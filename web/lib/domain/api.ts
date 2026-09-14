// KBO 네이버 스포츠 게이트웨이 연동 API 및 서버 캐시 계층
const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

export class ApiError extends Error {
  status?: number;
  url?: string;
  constructor(message: string, { status, url }: { status?: number; url?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
  }
}

// 서버 프로세스 수명 주기 동안 완료된 이닝(불변 데이터)을 보관하는 인메모리 캐시
// key: `${gameId}_inn${inning}`
const inningCache = new Map<string, any>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJSON(url: string, timeoutMs = 10000) {
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
          Referer: 'https://m.sports.naver.com/',
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });

      if ((res.status === 429 || res.status >= 500) && attempt === 0) {
        const retryAfterHeader = res.headers.get('retry-after');
        const waitSec = Math.min(10, Number(retryAfterHeader) || 2);
        console.warn(`[KBO API] HTTP ${res.status} for ${url}. Retrying after ${waitSec}s...`);
        await sleep(waitSec * 1000);
        continue;
      }

      if (res.status === 204) return { status: res.status, data: null };
      if (!res.ok) {
        throw new ApiError(`HTTP ${res.status}: ${url}`, { status: res.status, url });
      }

      const data = await res.json();
      return { status: res.status, data };
    } catch (err: any) {
      if (attempt === 0 && (err.name === 'TimeoutError' || err.message?.includes('fetch failed'))) {
        console.warn(`[KBO API] Request failed (${err.message}). Retrying once...`);
        await sleep(1000);
        continue;
      }
      throw err;
    }
  }
}

export async function fetchGamesByDate(date: string) {
  const url = `${GW}/schedule/games?fields=basic,schedule,baseball&upperCategoryId=kbaseball&categoryId=kbo&fromDate=${date}&toDate=${date}&size=50`;
  const { data } = await getJSON(url);
  return data?.result?.games || [];
}

export async function fetchGame(gameId: string) {
  const { data } = await getJSON(`${GW}/schedule/games/${encodeURIComponent(gameId)}`);
  return data?.result?.game || null;
}

/**
 * 특정 게임의 문자중계(relay) 데이터를 가져옵니다.
 * 이닝 번호(inning)가 지정되고 해당 이닝이 이미 종료되었거나 경기가 완료된 경우 캐시를 활용합니다.
 */
export async function fetchRelay(gameId: string, inning?: string | number, isFinished = false) {
  const innNum = inning != null ? Number(inning) : null;
  const cacheKey = innNum != null ? `${gameId}_inn${innNum}` : null;

  if (cacheKey && inningCache.has(cacheKey)) {
    return inningCache.get(cacheKey);
  }

  const url = innNum != null
    ? `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay?inning=${innNum}`
    : `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay`;

  const { data } = await getJSON(url);
  const relay = data?.result?.textRelayData || null;

  if (cacheKey && relay && Array.isArray(relay.textRelays) && relay.textRelays.length > 0) {
    const curInn = Number(relay.inn);
    // 요청 이닝이 현재 진행 이닝보다 작거나(이미 종료된 이닝), 경기 자체가 종료된 경우 캐시 저장
    if (isFinished || (Number.isFinite(curInn) && innNum !== null && innNum < curInn)) {
      inningCache.set(cacheKey, relay);
    }
  }

  return relay;
}

export async function fetchPreview(gameId: string) {
  const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/preview`;
  try {
    const { data } = await getJSON(url);
    return data?.result?.previewData || null;
  } catch (err: any) {
    console.warn(`[KBO API] fetchPreview failed for ${gameId}:`, err.message);
    return null;
  }
}

export async function fetchRecord(gameId: string) {
  const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/record`;
  try {
    const { data } = await getJSON(url);
    return data?.result?.recordData || null;
  } catch (err: any) {
    console.warn(`[KBO API] fetchRecord failed for ${gameId}:`, err.message);
    return null;
  }
}
