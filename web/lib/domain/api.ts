const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

async function getJSON(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Referer: 'https://m.sports.naver.com/',
    },
    next: { revalidate: 0 },
  });
  if (res.status === 204) return { status: res.status, data: null };
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = await res.json();
  return { status: res.status, data };
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

export async function fetchRelay(gameId: string, inning?: string) {
  const url = inning
    ? `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay?inning=${Number(inning)}`
    : `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay`;
  const { data } = await getJSON(url);
  return data?.result?.textRelayData || null;
}
