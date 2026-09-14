import fs from 'fs';
import path from 'path';
import { PitcherBoxEntry, OverworkDatasetResponse } from './types';
import { buildOverworkDataset } from './overworkCalculator';
import { mapTeamCode, kstDateStr, addDays } from './util';

const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

// 캐시 디렉토리 설정 (Next.js 루트의 .cache/kbo-games)
const CACHE_DIR = path.join(process.cwd(), '.cache', 'kbo-games');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCachedGame(gameId: string): any | null {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${gameId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (_) {
    // 캐시 읽기 실패 시 무시
  }
  return null;
}

function writeCachedGame(gameId: string, data: any) {
  try {
    ensureCacheDir();
    const filePath = path.join(CACHE_DIR, `${gameId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  } catch (err: any) {
    console.warn(`[Crawler Cache] Failed to write cache for ${gameId}:`, err.message);
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
          Referer: 'https://m.sports.naver.com/',
        },
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
      });

      if (res.status === 429) {
        const wait = 2000 * (i + 1);
        console.warn(`[Crawler] Rate limited (429). Waiting ${wait}ms...`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${url}`);
      }

      return await res.json();
    } catch (err: any) {
      if (i === retries) throw err;
      await sleep(1000 * (i + 1));
    }
  }
}

/**
 * 특정 날짜의 경기 목록을 조회합니다.
 */
export async function fetchGamesOnDate(date: string): Promise<any[]> {
  const url = `${GW}/schedule/games?fields=basic,schedule,baseball&upperCategoryId=kbaseball&categoryId=kbo&fromDate=${date}&toDate=${date}&size=50`;
  try {
    const data = await fetchWithRetry(url);
    return data?.result?.games || [];
  } catch (err: any) {
    console.warn(`[Crawler] Failed to fetch games for ${date}:`, err.message);
    return [];
  }
}

/**
 * 특정 경기의 박스스코어(기록) 데이터를 조회합니다. (캐시 우선)
 */
export async function fetchGameRecord(gameId: string, isFinished = false): Promise<any | null> {
  if (isFinished) {
    const cached = readCachedGame(gameId);
    if (cached) return cached;
  }

  const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/record`;
  try {
    const data = await fetchWithRetry(url);
    const recordData = data?.result?.recordData || null;
    if (recordData && isFinished) {
      writeCachedGame(gameId, recordData);
    }
    return recordData;
  } catch (err: any) {
    console.warn(`[Crawler] Failed to fetch record for ${gameId}:`, err.message);
    return null;
  }
}

/**
 * 날짜 범위(fromDate ~ toDate)의 모든 종료된 경기에서 투수 기록을 크롤링하고 혹사 지수 데이터셋을 생성합니다.
 */
export async function crawlPitcherOverworkDataset(
  fromDate: string,
  toDate: string,
  onProgress?: (current: number, total: number, msg: string) => void
): Promise<OverworkDatasetResponse> {
  // 1. 날짜 리스트 생성
  const dates: string[] = [];
  let cur = fromDate;
  while (cur <= toDate) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }

  // 2. 각 날짜별 경기 수집 (동시성 5로 배치 처리)
  const allGames: any[] = [];
  const chunkSize = 5;
  for (let i = 0; i < dates.length; i += chunkSize) {
    const batch = dates.slice(i, i + chunkSize);
    const results = await Promise.all(batch.map((d) => fetchGamesOnDate(d)));
    for (const games of results) {
      for (const g of games) {
        // 종료된 정규/포스트시즌 KBO 경기
        if (g.statusCode === 'RESULT' && g.gameId) {
          allGames.push(g);
        }
      }
    }
    await sleep(50); // API 부하 조절
  }

  // 3. 각 경기의 박스스코어(투수 기록) 수집
  const appearancesByPitcher = new Map<
    string,
    {
      gameId: string;
      date: string;
      team: string;
      opponent: string;
      isHome: boolean;
      order: number;
      raw: PitcherBoxEntry;
    }[]
  >();

  const totalGames = allGames.length;
  let processed = 0;

  // 박스스코어 동시 수집 (동시성 4)
  const gameBatchSize = 4;
  for (let i = 0; i < allGames.length; i += gameBatchSize) {
    const batch = allGames.slice(i, i + gameBatchSize);
    await Promise.all(
      batch.map(async (game) => {
        const gameId = game.gameId;
        const gameDate = game.gameDate || game.startDate?.slice(0, 10) || fromDate;
        const homeTeam = game.homeTeamCode || game.homeTeamName;
        const awayTeam = game.awayTeamCode || game.awayTeamName;

        const record = await fetchGameRecord(gameId, true);
        if (record?.pitchersBoxscore) {
          const awayPitchers: PitcherBoxEntry[] = record.pitchersBoxscore.away || [];
          const homePitchers: PitcherBoxEntry[] = record.pitchersBoxscore.home || [];

          // 원정 투수 등록
          awayPitchers.forEach((p, idx) => {
            if (!p.pcode) return;
            if (!appearancesByPitcher.has(p.pcode)) {
              appearancesByPitcher.set(p.pcode, []);
            }
            appearancesByPitcher.get(p.pcode)!.push({
              gameId,
              date: gameDate,
              team: awayTeam,
              opponent: homeTeam,
              isHome: false,
              order: idx + 1,
              raw: p,
            });
          });

          // 홈 투수 등록
          homePitchers.forEach((p, idx) => {
            if (!p.pcode) return;
            if (!appearancesByPitcher.has(p.pcode)) {
              appearancesByPitcher.set(p.pcode, []);
            }
            appearancesByPitcher.get(p.pcode)!.push({
              gameId,
              date: gameDate,
              team: homeTeam,
              opponent: awayTeam,
              isHome: true,
              order: idx + 1,
              raw: p,
            });
          });
        }

        processed++;
        if (onProgress) {
          onProgress(processed, totalGames, `경기 데이터 수집 중 (${processed}/${totalGames})`);
        }
      })
    );
    await sleep(40);
  }

  // 4. 투수별 시계열 집계 및 혹사 지수 모델링
  const { pitchers, teams } = buildOverworkDataset(appearancesByPitcher, toDate);

  // 5. 리그 요약 통계 집계
  let extremeCount = 0;
  let dangerCount = 0;
  let warningCount = 0;
  let cautionCount = 0;
  let safeCount = 0;

  for (const p of pitchers) {
    if (p.status === 'EXTREME') extremeCount++;
    else if (p.status === 'DANGER') dangerCount++;
    else if (p.status === 'WARNING') warningCount++;
    else if (p.status === 'CAUTION') cautionCount++;
    else safeCount++;
  }

  // 최고 부하 구단 선정 (평균 혹사 지수 기준)
  let highestStrainTeam = '';
  let highestAvg = -1;
  for (const t of Object.values(teams)) {
    if (t.avgOverworkScore > highestAvg) {
      highestAvg = t.avgOverworkScore;
      highestStrainTeam = t.teamName;
    }
  }

  const topFatiguePitchers = pitchers.slice(0, 5);

  return {
    dateRange: {
      from: fromDate,
      to: toDate,
      totalDays: dates.length,
    },
    totalGames,
    summary: {
      totalPitchers: pitchers.length,
      extremeCount,
      dangerCount,
      warningCount,
      cautionCount,
      safeCount,
      highestStrainTeam,
      topFatiguePitchers,
    },
    teams,
    pitchers,
  };
}
