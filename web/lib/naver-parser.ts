import {
  GameSummary,
  GameDetailData,
  PitcherOuting,
  PlateAppearance,
  PitchEvent,
  PitchArsenalStats,
  PitchResultType,
} from './types/baseball';
import { calculateFlightAndTrajectory, isPitchInStrikeZone, RESULT_MAP } from './physics';

const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for finished games

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(url: string) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }
  const data = await res.json();
  cache.set(url, { timestamp: Date.now(), data });
  return data;
}

export async function getGamesByDate(dateStr: string): Promise<GameSummary[]> {
  const url = `https://api-gw.sports.naver.com/schedule/games?upperCategoryId=kbaseball&fromDate=${dateStr}&toDate=${dateStr}`;
  const json = await fetchJson(url);
  const gamesRaw = json?.result?.games || [];

  return gamesRaw.map((g: any) => ({
    gameId: g.gameId,
    gameDate: g.gameDate,
    gameDateTime: g.gameDateTime,
    homeTeamCode: g.homeTeamCode,
    homeTeamName: g.homeTeamName,
    homeTeamScore: g.homeTeamScore || 0,
    awayTeamCode: g.awayTeamCode,
    awayTeamName: g.awayTeamName,
    awayTeamScore: g.awayTeamScore || 0,
    statusCode: g.statusCode || 'RESULT',
    statusInfo: g.statusInfo || '',
    homeTeamEmblemUrl: g.homeTeamEmblemUrl,
    awayTeamEmblemUrl: g.awayTeamEmblemUrl,
  }));
}

export async function getGamePitcherOutings(gameId: string): Promise<GameDetailData> {
  const cacheKey = `game_detail_${gameId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Fetch record for boxscore and game summary
  const recordUrl = `https://api-gw.sports.naver.com/schedule/games/${gameId}/record`;
  const recordJson = await fetchJson(recordUrl);
  const rec = recordJson?.result?.recordData || {};
  const gameInfo = rec?.games?.[0] || {};
  const pb = rec?.pitchersBoxscore || {};

  const gameSummary: GameSummary = {
    gameId,
    gameDate: String(gameInfo.gdate || ''),
    gameDateTime: `${gameInfo.gdate}T${gameInfo.gtime || '18:30'}:00`,
    homeTeamCode: gameInfo.hCode || '',
    homeTeamName: gameInfo.hName || gameInfo.hFullName || '',
    homeTeamScore: gameInfo.score?.hScore ?? 0,
    awayTeamCode: gameInfo.aCode || '',
    awayTeamName: gameInfo.aName || gameInfo.aFullName || '',
    awayTeamScore: gameInfo.score?.aScore ?? 0,
    statusCode: gameInfo.statusCode === '4' ? 'RESULT' : 'LIVE',
    statusInfo: gameInfo.inn || '경기종료',
  };

  // Determine played innings count from scoreboard
  const homeInns = rec?.scoreBoard?.inn?.home || [];
  const awayInns = rec?.scoreBoard?.inn?.away || [];
  const totalInnings = Math.max(homeInns.length, awayInns.length, 9);

  // 2. Fetch all innings in parallel
  const inningPromises: Promise<any>[] = [];
  for (let inn = 1; inn <= totalInnings; inn++) {
    const relayUrl = `https://api-gw.sports.naver.com/schedule/games/${gameId}/relay?inning=${inn}`;
    inningPromises.push(
      fetchJson(relayUrl).catch((err) => {
        console.warn(`Failed fetching inning ${inn} for ${gameId}:`, err);
        return null;
      })
    );
  }

  const inningResults = await Promise.all(inningPromises);

  // 3. Collect lineups & players mapping
  const playerMap = new Map<string, { name: string; team: string }>();

  // Extract from first available relay
  for (const res of inningResults) {
    const trData = res?.result?.textRelayData;
    if (trData) {
      for (const p of trData.homeLineup?.pitcher || []) {
        playerMap.set(String(p.pcode), { name: p.name, team: gameSummary.homeTeamName });
      }
      for (const p of trData.awayLineup?.pitcher || []) {
        playerMap.set(String(p.pcode), { name: p.name, team: gameSummary.awayTeamName });
      }
      for (const b of trData.homeLineup?.batter || []) {
        playerMap.set(String(b.pcode), { name: b.name, team: gameSummary.homeTeamName });
      }
      for (const b of trData.awayLineup?.batter || []) {
        playerMap.set(String(b.pcode), { name: b.name, team: gameSummary.awayTeamName });
      }
    }
  }

  // Also map from pitchersBoxscore
  for (const side of ['home', 'away'] as const) {
    const teamName = side === 'home' ? gameSummary.homeTeamName : gameSummary.awayTeamName;
    for (const p of pb[side] || []) {
      const code = p.pcode || p.playerCode;
      if (code) {
        playerMap.set(String(code), { name: p.name, team: teamName });
      }
    }
  }

  // 4. Group pitches and plate appearances by pitcher
  const homePitchersMap = new Map<string, PitcherOuting>();
  const awayPitchersMap = new Map<string, PitcherOuting>();

  function getOrCreatePitcherOuting(
    pcode: string,
    pname: string,
    side: 'home' | 'away',
    isStarter: boolean,
    order: number
  ): PitcherOuting {
    const map = side === 'home' ? homePitchersMap : awayPitchersMap;
    if (!map.has(pcode)) {
      const teamCode = side === 'home' ? gameSummary.homeTeamCode : gameSummary.awayTeamCode;
      const teamName = side === 'home' ? gameSummary.homeTeamName : gameSummary.awayTeamName;
      map.set(pcode, {
        pitcherId: pcode,
        pitcherName: pname,
        teamCode,
        teamName,
        isStarter,
        appearanceOrder: order,
        boxscore: {
          inn: '',
          bf: 0,
          hit: 0,
          r: 0,
          er: 0,
          bb: 0,
          kk: 0,
          hr: 0,
          w: 0,
          l: 0,
          hold: 0,
          s: 0,
          era: '',
          strikes: 0,
          balls: 0,
          strikePercent: 0,
        },
        arsenal: [],
        plateAppearances: [],
        allPitches: [],
      });
    }
    return map.get(pcode)!;
  }

  // Populate known pitchers from pitchersBoxscore in order
  let homeOrder = 1;
  for (const p of pb.home || []) {
    const pcode = String(p.pcode || p.playerCode || p.name);
    const outing = getOrCreatePitcherOuting(pcode, p.name, 'home', homeOrder === 1, homeOrder++);
    outing.boxscore.inn = String(p.inn || '');
    outing.boxscore.bf = Number(p.bf || 0);
    outing.boxscore.hit = Number(p.hit || 0);
    outing.boxscore.r = Number(p.r || 0);
    outing.boxscore.er = Number(p.er || 0);
    outing.boxscore.bb = Number(p.bb || 0);
    outing.boxscore.kk = Number(p.kk || 0);
    outing.boxscore.hr = Number(p.hr || 0);
    outing.boxscore.w = Number(p.w || 0);
    outing.boxscore.l = Number(p.l || 0);
    outing.boxscore.hold = Number(p.hold || 0);
    outing.boxscore.s = Number(p.s || 0);
    outing.boxscore.era = String(p.era || '');
    if (p.wls === '승' || outing.boxscore.w > 0) outing.decision = 'W';
    else if (p.wls === '패' || outing.boxscore.l > 0) outing.decision = 'L';
    else if (p.wls === '세' || outing.boxscore.s > 0) outing.decision = 'SAVE';
    else if (p.wls === '홀' || outing.boxscore.hold > 0) outing.decision = 'HOLD';
  }

  let awayOrder = 1;
  for (const p of pb.away || []) {
    const pcode = String(p.pcode || p.playerCode || p.name);
    const outing = getOrCreatePitcherOuting(pcode, p.name, 'away', awayOrder === 1, awayOrder++);
    outing.boxscore.inn = String(p.inn || '');
    outing.boxscore.bf = Number(p.bf || 0);
    outing.boxscore.hit = Number(p.hit || 0);
    outing.boxscore.r = Number(p.r || 0);
    outing.boxscore.er = Number(p.er || 0);
    outing.boxscore.bb = Number(p.bb || 0);
    outing.boxscore.kk = Number(p.kk || 0);
    outing.boxscore.hr = Number(p.hr || 0);
    outing.boxscore.w = Number(p.w || 0);
    outing.boxscore.l = Number(p.l || 0);
    outing.boxscore.hold = Number(p.hold || 0);
    outing.boxscore.s = Number(p.s || 0);
    outing.boxscore.era = String(p.era || '');
    if (p.wls === '승' || outing.boxscore.w > 0) outing.decision = 'W';
    else if (p.wls === '패' || outing.boxscore.l > 0) outing.decision = 'L';
    else if (p.wls === '세' || outing.boxscore.s > 0) outing.decision = 'SAVE';
    else if (p.wls === '홀' || outing.boxscore.hold > 0) outing.decision = 'HOLD';
  }

  // Iterate over inning relay responses
  let paGlobalSeq = 0;
  for (const innRes of inningResults) {
    if (!innRes?.result?.textRelayData) continue;
    const textRelays = innRes.result.textRelayData.textRelays || [];

    // Reverse to chronological order (Naver gives latest at top)
    const sortedRelays = [...textRelays].reverse();

    for (const relay of sortedRelays) {
      const inn = Number(relay.inn || 1);
      const homeOrAway = Number(relay.homeOrAway); // 0: Top (home pitching), 1: Bottom (away pitching)
      const pitchingSide: 'home' | 'away' = homeOrAway === 0 ? 'home' : 'away';

      const ptsList = relay.ptsOptions || [];
      const textOptions = relay.textOptions || [];

      let batterId = '';
      let batterName = '';
      let resultText = '';
      let pitcherId = '';

      for (const opt of textOptions) {
        if (opt.currentGameState?.pitcher) {
          pitcherId = String(opt.currentGameState.pitcher);
        }
        if (opt.currentGameState?.batter) {
          batterId = String(opt.currentGameState.batter);
        }
        if (opt.batterRecord?.name) {
          batterName = opt.batterRecord.name;
        }
        if (opt.type === 13) {
          resultText = opt.text || '';
        }
      }

      if (!batterName && batterId) {
        batterName = playerMap.get(batterId)?.name || `타자 ${batterId}`;
      }

      if (!pitcherId) {
        continue;
      }

      const pitcherName =
        playerMap.get(pitcherId)?.name ||
        (pitchingSide === 'home' ? pb.home?.[0]?.name : pb.away?.[0]?.name) ||
        `투수 ${pitcherId}`;

      const outing = getOrCreatePitcherOuting(
        pitcherId,
        pitcherName,
        pitchingSide,
        false,
        (pitchingSide === 'home' ? homePitchersMap.size : awayPitchersMap.size) + 1
      );

      const pitchOptions = textOptions.filter((opt: any) => opt.type === 1);
      const paPitches: PitchEvent[] = [];

      for (let i = 0; i < pitchOptions.length; i++) {
        const pOpt = pitchOptions[i];
        const pitchNum = Number(pOpt.pitchNum || i + 1);
        const pitchResult = (pOpt.pitchResult || 'B') as PitchResultType;
        const speed = Number(pOpt.speed || 0);
        const stuff = pOpt.stuff || '직구';

        const ptsRaw =
          ptsList.find((pts: any) => pts.pitchId === pOpt.ptsPitchId) ||
          ptsList.find((pts: any) => pts.ballcount === pitchNum) ||
          ptsList[i];

        let ptsCalc = undefined;
        if (ptsRaw) {
          ptsCalc = calculateFlightAndTrajectory(ptsRaw);
        }

        const resInfo = RESULT_MAP[pitchResult] || { label: '볼', isStrike: false, isWhiff: false };

        const cgs = pOpt.currentGameState || {};
        const pitchEvent: PitchEvent = {
          pitchNum,
          pitchResult,
          resultKorean: resInfo.label,
          speed,
          stuff,
          pts: ptsCalc,
          strike: Number(cgs.strike || 0),
          ball: Number(cgs.ball || 0),
          out: Number(cgs.out || 0),
          base1: cgs.base1 === '1' || cgs.base1 === 1 || cgs.base1 === '2',
          base2: cgs.base2 === '1' || cgs.base2 === 1 || cgs.base2 === '2',
          base3: cgs.base3 === '1' || cgs.base3 === 1 || cgs.base3 === '2',
          batterName,
          batterCode: batterId,
          paSeq: paGlobalSeq,
        };

        paPitches.push(pitchEvent);
        outing.allPitches.push(pitchEvent);

        if (resInfo.isStrike) {
          outing.boxscore.strikes++;
        } else {
          outing.boxscore.balls++;
        }
      }

      if (paPitches.length > 0 || resultText) {
        const stance = ptsList[0]?.stance === 'L' ? 'L' : 'R';
        outing.plateAppearances.push({
          paId: `pa_${inn}_${homeOrAway}_${paGlobalSeq}`,
          inning: inn,
          isBottom: homeOrAway === 1,
          batterId,
          batterName: batterName || relay.title || '타자',
          batterStance: stance,
          pitcherId,
          pitcherName,
          resultText: resultText || '타석 진행',
          pitches: paPitches,
        });
        paGlobalSeq++;
      }
    }
  }

  function finalizeOuting(outing: PitcherOuting) {
    const totalPitches = outing.allPitches.length;
    if (outing.boxscore.bf === 0) {
      outing.boxscore.bf = totalPitches;
    }
    const totalRecorded = outing.boxscore.strikes + outing.boxscore.balls;
    if (totalRecorded > 0) {
      outing.boxscore.strikePercent = Math.round(
        (outing.boxscore.strikes / totalRecorded) * 100
      );
    }

    const arsenalMap = new Map<string, PitchEvent[]>();
    for (const p of outing.allPitches) {
      const s = p.stuff || '기타';
      if (!arsenalMap.has(s)) arsenalMap.set(s, []);
      arsenalMap.get(s)!.push(p);
    }

    const arsenalList: PitchArsenalStats[] = [];
    for (const [stuff, pitches] of arsenalMap.entries()) {
      const count = pitches.length;
      const speeds = pitches.map((p) => p.speed).filter((s) => s > 0);
      const avgSpeed =
        speeds.length > 0
          ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10
          : 0;
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;

      let strikes = 0;
      let balls = 0;
      let whiffCount = 0;
      let swingCount = 0;
      let zoneCount = 0;

      for (const p of pitches) {
        const r = p.pitchResult;
        if (r === 'S' || r === 'T' || r === 'F' || r === 'H') strikes++;
        else balls++;

        if (r === 'S') whiffCount++;
        if (r === 'S' || r === 'F' || r === 'H') swingCount++;

        if (p.pts) {
          if (
            isPitchInStrikeZone(
              p.pts.crossPlateX,
              p.pts.crossPlateY,
              p.pts.topSz,
              p.pts.bottomSz
            )
          ) {
            zoneCount++;
          }
        }
      }

      arsenalList.push({
        stuff,
        count,
        usagePercent: totalPitches > 0 ? Math.round((count / totalPitches) * 1000) / 10 : 0,
        avgSpeed,
        maxSpeed,
        minSpeed,
        strikes,
        balls,
        whiffCount,
        whiffRate: swingCount > 0 ? Math.round((whiffCount / swingCount) * 1000) / 10 : 0,
        zoneCount,
        zoneRate: count > 0 ? Math.round((zoneCount / count) * 1000) / 10 : 0,
      });
    }

    arsenalList.sort((a, b) => b.count - a.count);
    outing.arsenal = arsenalList;
  }

  const homePitchers = Array.from(homePitchersMap.values()).sort(
    (a, b) => a.appearanceOrder - b.appearanceOrder
  );
  const awayPitchers = Array.from(awayPitchersMap.values()).sort(
    (a, b) => a.appearanceOrder - b.appearanceOrder
  );

  homePitchers.forEach(finalizeOuting);
  awayPitchers.forEach(finalizeOuting);

  const result: GameDetailData = {
    game: gameSummary,
    homePitchers,
    awayPitchers,
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}
