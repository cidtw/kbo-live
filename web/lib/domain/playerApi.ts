// KBO 선수 상세 프로필 및 3대 기록(시즌별/일자별/상대구단별) API 연동 모듈

const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

export interface PlayerProfile {
  playerId: string;
  name: string;
  imageUrl: string;
  teamCode: string;
  teamName: string;
  backNumber: string;
  position: string;
  playerDescription: string; // 예: "투수, 좌투좌타"
  birthDate: string;         // 예: "2004.04.20."
  birthDateKor: string;      // 예: "2004년04월20일"
  age: string;               // 예: "22세"
  height: string;            // 예: "187"
  weight: string;            // 예: "87"
  debutYear: string;         // 프로 입단/데뷔 시기 (예: "2022")
  debutTeam: string;         // 입단 구단 (예: "KIA 타이거즈")
  schools: string[];         // 출신 학교 목록 (예: ["충암고등학교"])
  prizes: { year: string; contents: string }[]; // 주요 수상 내역
}

export interface SeasonRecord {
  year: string;              // "2023", "2024", "통산"
  team: string;
  era: string;               // "4.39"
  games: number;             // gamenum
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  innings: string;           // "254 1/3"
  pitches: number;           // bf
  hits: number;
  homeRuns: number;
  walks: number;             // bb
  strikeouts: number;        // kk
  runs: number;
  earnedRuns: number;
  whip: string;
  qs?: number;
}

export interface GameLogRecord {
  date: string;              // "06.15" or "2024-06-15"
  opponent: string;          // vsTeam
  result: string;            // "승", "패", "홀", "세", ""
  innings: string;           // "5", "1 ⅔"
  pitches: number;           // bf
  hits: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  runs: number;
  earnedRuns: number;
  era: string;
}

export interface VsTeamRecord {
  teamCode: string;          // "LG", "HH"
  teamName: string;          // "LG", "한화"
  era: string;               // "1.80"
  games?: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  innings: string;           // "5"
  pitches: number;           // pit
  hits: number;
  homeRuns: number;
  walks: number;             // bbhp
  strikeouts: number;        // kk
  earnedRuns: number;
  runs: number;
  whip: string;
}

export interface FullPlayerRecordData {
  profile: PlayerProfile;
  seasons: SeasonRecord[];
  gameLogs: GameLogRecord[];
  vsTeams: VsTeamRecord[];
}

// 인메모리 캐시 (10분)
const playerCache = new Map<string, { timestamp: number; data: FullPlayerRecordData }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

async function getJsonWithRetry(url: string, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json',
          Referer: 'https://m.sports.naver.com/',
        },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      return await res.json();
    } catch (e: any) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}

/**
 * 선수의 전체 상세 프로필 및 3대 기록(시즌별/일자별/상대구단별)을 조회합니다.
 */
export async function fetchFullPlayerData(playerId: string): Promise<FullPlayerRecordData | null> {
  const cached = playerCache.get(playerId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const profileUrl = `${GW}/players/kbo/${encodeURIComponent(playerId)}/tores-profile`;
  const recordUrl = `${GW}/players/kbo/${encodeURIComponent(playerId)}/playerend-record`;

  const [profileRes, recordRes] = await Promise.all([
    getJsonWithRetry(profileUrl).catch(() => null),
    getJsonWithRetry(recordUrl).catch(() => null),
  ]);

  const pRaw = profileRes?.result?.profile;
  const rRaw = recordRes?.result;

  if (!pRaw && !rRaw) return null;

  // 1. 프로필 정규화
  const teamInfo = pRaw?.teamInfo?.[0] || {};
  const careerInfo = pRaw?.sportsBridgeCareerInfo || [];
  const debutEntry = careerInfo[careerInfo.length - 1] || careerInfo[0] || {};

  const schools: string[] = [];
  if (Array.isArray(pRaw?.mainSchoolList)) {
    pRaw.mainSchoolList.forEach((s: any) => {
      if (s.schoolName && !schools.includes(s.schoolName)) schools.push(s.schoolName);
    });
  }
  if (schools.length === 0 && Array.isArray(pRaw?.sportsBridgeSchool)) {
    pRaw.sportsBridgeSchool.forEach((s: any) => {
      if (s.schoolName && !schools.includes(s.schoolName)) schools.push(s.schoolName);
    });
  }

  const prizes: { year: string; contents: string }[] = [];
  if (Array.isArray(pRaw?.sportsBridgePrizeInfo)) {
    pRaw.sportsBridgePrizeInfo.forEach((pr: any) => {
      if (pr.contents) prizes.push({ year: pr.year || '', contents: pr.contents });
    });
  }

  const profile: PlayerProfile = {
    playerId,
    name: pRaw?.name || 'KBO 선수',
    imageUrl:
      pRaw?.profileImage ||
      'https://ssl.pstatic.net/static.sports/resources/sports-web/player-end/static/media/default_player.svg',
    teamCode: teamInfo.teamCode || rRaw?.teamCode || '',
    teamName: teamInfo.teamOriginalName || teamInfo.teamName || 'KBO',
    backNumber: teamInfo.teamPlayerNumber || '',
    position: teamInfo.teamPosition || (rRaw?.playerType === 'pitcher' ? '투수' : '타자'),
    playerDescription: rRaw?.playerDescription || (rRaw?.playerType === 'pitcher' ? '투수' : '타자'),
    birthDate: pRaw?.birthDate || '',
    birthDateKor: pRaw?.birthDateKor || pRaw?.birthDate || '',
    age: pRaw?.age || '',
    height: pRaw?.bodyHeight ? `${pRaw.bodyHeight}cm` : '',
    weight: pRaw?.bodyWeight ? `${pRaw.bodyWeight}kg` : '',
    debutYear: debutEntry.startDate || '',
    debutTeam: debutEntry.contents || '',
    schools,
    prizes,
  };

  // 2. 기록 정규화 (시즌별, 일자별, 상대팀별)
  let parsedRecord: any = {};
  try {
    if (rRaw?.record) parsedRecord = JSON.parse(rRaw.record);
  } catch (_) {}

  let parsedVsTeam: any = {};
  try {
    if (rRaw?.vsTeam) parsedVsTeam = JSON.parse(rRaw.vsTeam);
  } catch (_) {}

  // 2-1. 시즌별 기록
  const seasons: SeasonRecord[] = [];
  const rawSeasons = parsedRecord?.season || [];
  for (const s of rawSeasons) {
    seasons.push({
      year: String(s.gyear || s.year || ''),
      team: String(s.teamName || s.team || ''),
      era: s.era != null ? Number(s.era).toFixed(2) : '-',
      games: Number(s.gamenum || s.g) || 0,
      wins: Number(s.w) || 0,
      losses: Number(s.l) || 0,
      saves: Number(s.sv || s.s) || 0,
      holds: Number(s.hold || s.hld) || 0,
      innings: String(s.inn || '0'),
      pitches: Number(s.bf || s.pit) || 0,
      hits: Number(s.hit) || 0,
      homeRuns: Number(s.hr) || 0,
      walks: Number(s.bb) || 0,
      strikeouts: Number(s.kk) || 0,
      runs: Number(s.r) || 0,
      earnedRuns: Number(s.er) || 0,
      whip: s.whip != null ? Number(s.whip).toFixed(2) : '-',
      qs: Number(s.qs) || 0,
    });
  }

  // 2-2. 일자별 최근 기록
  const gameLogs: GameLogRecord[] = [];
  const rawGames = parsedRecord?.game || [];
  for (const g of rawGames) {
    gameLogs.push({
      date: String(g.displayDate || g.date || ''),
      opponent: String(g.vsTeam || g.opponent || ''),
      result: String(g.result || g.wls || ''),
      innings: String(g.inn || '0'),
      pitches: Number(g.bf || g.pit) || 0,
      hits: Number(g.hit) || 0,
      homeRuns: Number(g.hr) || 0,
      walks: Number(g.bb || g.bbhp) || 0,
      strikeouts: Number(g.kk) || 0,
      runs: Number(g.r) || 0,
      earnedRuns: Number(g.er) || 0,
      era: g.era != null ? Number(g.era).toFixed(2) : '-',
    });
  }

  // 2-3. 상대 구단별 전적
  const vsTeams: VsTeamRecord[] = [];
  const rawVs = parsedVsTeam?.vsteam || [];
  for (const v of rawVs) {
    vsTeams.push({
      teamCode: String(v.team || ''),
      teamName: String(v.name || v.team || ''),
      era: v.era != null ? Number(v.era).toFixed(2) : '-',
      games: Number(v.gamenum || v.g) || 0,
      wins: Number(v.w) || 0,
      losses: Number(v.l) || 0,
      saves: Number(v.save || v.sv) || 0,
      holds: Number(v.hold || v.hld) || 0,
      innings: String(v.inn || '0'),
      pitches: Number(v.pit || v.bf) || 0,
      hits: Number(v.hit) || 0,
      homeRuns: Number(v.hr) || 0,
      walks: Number(v.bbhp || v.bb) || 0,
      strikeouts: Number(v.kk) || 0,
      earnedRuns: Number(v.er) || 0,
      runs: Number(v.r) || 0,
      whip: v.whip != null ? Number(v.whip).toFixed(2) : '-',
    });
  }

  const result: FullPlayerRecordData = {
    profile,
    seasons,
    gameLogs,
    vsTeams,
  };

  playerCache.set(playerId, { timestamp: Date.now(), data: result });
  return result;
}
