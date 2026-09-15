// KBO 선수 상세 프로필 및 3대 기록(시즌별/일자별/상대구단별) API 연동 모듈

const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

import {
  enhancePlayerInformation,
  PlayerCategory,
} from './foreignPlayerEnhancer';

export interface PlayerProfile {
  playerId: string;
  name: string;
  englishName?: string;
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
  debutYear: string;         // 프로 입단/데뷔 연도 (예: "2024")
  debutTeam: string;         // 프로 입단 구단 (예: "LG 트윈스")
  draftInfo?: string;        // 신인 드래프트 지명 순위 (예: "2021년 LG 2차 4라운드 37순위" 또는 "육성선수")
  payment?: string;          // 입단 계약금 (예: "7000만원")
  salary?: string;           // 연봉 (예: "3000만원")
  schools: string[];         // 출신 학교 목록 (예: ["강릉영동대", "강릉고", "경포중", "노암초"])
  prizes: { year: string; contents: string }[]; // 주요 수상 내역

  // 외국인 및 아시아쿼터(대체 외인 포함) 고도화 메타데이터
  playerCategory?: PlayerCategory;
  categoryLabel?: string;
  nationality?: string;
  nationalityFlag?: string;
  kboDebutYear?: string;
  kboDebutTeam?: string;
  kboDraftType?: string;
  proDebutYear?: string;
  proDebutTeam?: string;
  rawCareer?: string;
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

const PRO_TEAMS_WHITELIST: Record<string, string> = {
  LG: 'LG 트윈스',
  KIA: 'KIA 타이거즈',
  HT: 'KIA 타이거즈',
  해태: '해태 타이거즈',
  삼성: '삼성 라이온즈',
  SS: '삼성 라이온즈',
  SL: '삼성 라이온즈',
  두산: '두산 베어스',
  OB: 'OB 베어스',
  DB: '두산 베어스',
  KT: 'KT 위즈',
  kt: 'KT 위즈',
  SSG: 'SSG 랜더스',
  SK: 'SK 와이번스',
  롯데: '롯데 자이언츠',
  LT: '롯데 자이언츠',
  LOT: '롯데 자이언츠',
  한화: '한화 이글스',
  빙그레: '빙그레 이글스',
  HH: '한화 이글스',
  HE: '한화 이글스',
  NC: 'NC 다이노스',
  NCD: 'NC 다이노스',
  키움: '키움 히어로즈',
  넥센: '넥센 히어로즈',
  우리: '우리 히어로즈',
  히어로즈: '키움 히어로즈',
  현대: '현대 유니콘스',
  쌍방울: '쌍방울 레이더스',
  태평양: '태평양 돌핀스',
  청보: '청보 핀토스',
  삼미: '삼미 슈퍼스타즈',
  MBC: 'MBC 청룡',
};

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
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
}

/**
 * KBO 공식 사이트(koreabaseball.com)에서 선수의 공식 서류 등록 데이터(경력/출신교, 신인지명순위, 입단년도, 계약금)를 크롤링합니다.
 */
export async function fetchKboOfficialProfile(playerId: string): Promise<{
  careerSchools: string[];
  draftInfo: string;
  joinYear: string;
  joinTeam: string;
  joinInfoRaw: string;
  payment: string;
  salary: string;
  careerRaw?: string;
} | null> {
  const urls = [
    `https://www.koreabaseball.com/Record/Player/PitcherDetail/Basic.aspx?playerId=${playerId}`,
    `https://www.koreabaseball.com/Record/Player/HitterDetail/Basic.aspx?playerId=${playerId}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(6000),
        cache: 'no-store',
      });

      if (!res.ok) continue;
      const html = await res.text();
      if (!html.includes('playerProfile_lblName')) continue;

      const getField = (fName: string) => {
        const regex = new RegExp(`id="[^"]*${fName}">([^<]*)<`);
        const m = html.match(regex);
        return m ? m[1].trim() : '';
      };

      const rawCareer = getField('lblCareer'); // 예: "노암초-경포중-강릉고-강릉영동대" or "...-성균관대-키움-상무"
      const rawDraft = getField('lblDraft');   // 예: "21 LG 2차 4라운드 37순위" or "22 KT 1차" or "육성선수"
      const rawJoin = getField('lblJoinInfo');  // 예: "24LG", "22KT", "05삼성"
      const payment = getField('lblPayment');
      const salary = getField('lblSalary');

      // 1. 출신 학교 분리 및 정제
      const careerSchools: string[] = [];
      if (rawCareer) {
        const parts = rawCareer.split('-');
        for (const p of parts) {
          const trimmed = p.trim();
          if (!trimmed) continue;
          // 프로 구단이나 군 구단(상무/경찰)은 학교가 아님
          const isTeam = Object.keys(PRO_TEAMS_WHITELIST).some(
            (t) => trimmed.toLowerCase() === t.toLowerCase() || trimmed.includes(PRO_TEAMS_WHITELIST[t])
          ) || trimmed === '상무' || trimmed === '경찰' || trimmed === '국가대표';

          if (!isTeam) {
            careerSchools.push(trimmed);
          }
        }
      }

      // 2. 입단년도 및 입단 구단 정규화 (예: "24LG" -> 연도 2024, 구단 LG 트윈스)
      let joinYear = '';
      let joinTeam = '';
      if (rawJoin) {
        const mYear = rawJoin.match(/^(\d{2})(.*)$/);
        if (mYear) {
          const yy = parseInt(mYear[1], 10);
          joinYear = yy >= 80 ? `19${yy}` : `20${yy < 10 ? '0' + yy : yy}`;
          const teamAbbr = mYear[2].trim();
          joinTeam = PRO_TEAMS_WHITELIST[teamAbbr] || teamAbbr;
        }
      }

      // 3. 지명 순위 정규화 (예: "21 LG 2차 4라운드 37순위" -> "2021년 LG 2차 4R (37순위)")
      let draftInfo = rawDraft;
      if (rawDraft) {
        const dMatch = rawDraft.match(/^(\d{2})\s*(.*)$/);
        if (dMatch) {
          const dYear = parseInt(dMatch[1], 10);
          const fullYear = dYear >= 80 ? `19${dYear}` : `20${dYear < 10 ? '0' + dYear : dYear}`;
          draftInfo = `${fullYear}년 ${dMatch[2].trim()}`;
        }
      }

      return {
        careerSchools,
        draftInfo,
        joinYear,
        joinTeam,
        joinInfoRaw: rawJoin,
        payment,
        salary,
        careerRaw: rawCareer,
      };
    } catch (_) {
      // 다음 URL 시도
    }
  }
  return null;
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

  // 네이버 포털 API + KBO 공식 등록 정보 병렬 수집
  const [profileRes, recordRes, kboOfficial] = await Promise.all([
    getJsonWithRetry(profileUrl).catch(() => null),
    getJsonWithRetry(recordUrl).catch(() => null),
    fetchKboOfficialProfile(playerId).catch(() => null),
  ]);

  const pRaw = profileRes?.result?.profile;
  const rRaw = recordRes?.result;

  if (!pRaw && !rRaw && !kboOfficial) return null;

  // 1. 프로 입단 정보 정확도 개선 (아마추어 등판 오인 버그 방지)
  let debutYear = '';
  let debutTeam = '';
  let draftInfo = kboOfficial?.draftInfo || '';

  // 1순위: KBO 공식 등록 입단 정보
  if (kboOfficial?.joinYear && kboOfficial?.joinTeam) {
    debutYear = kboOfficial.joinYear;
    debutTeam = kboOfficial.joinTeam;
  }

  // 2순위: 네이버 공식 debutInfo (예: [{"debut_year":"2021","debuts_work":"SK 와이번스 입단"}])
  if (!debutYear && Array.isArray(pRaw?.debutInfo) && pRaw.debutInfo.length > 0) {
    const d = pRaw.debutInfo[0];
    if (d.debut_year) {
      debutYear = String(d.debut_year);
      debutTeam = String(d.debuts_work || '').replace(/입단$/, '').trim();
    }
  }

  // 3순위: sportsBridgeCareerInfo에서 프로 구단만 화이트리스트 필터링 (아마추어 대회/국가대표/홍보대사 완전 배제)
  if (!debutYear && Array.isArray(pRaw?.sportsBridgeCareerInfo)) {
    const validProCareers = pRaw.sportsBridgeCareerInfo
      .filter((c: any) => {
        const cnt = String(c.contents || '').trim();
        // 국가대표, 올스타, 홍보대사, 상무, 경찰 배제
        if (cnt.includes('대표') || cnt.includes('대사') || cnt.includes('상무') || cnt.includes('경찰')) return false;
        // KBO 프로 구단 화이트리스트에 부합하는지 확인
        return Object.values(PRO_TEAMS_WHITELIST).some((team) => cnt.includes(team)) ||
          Object.keys(PRO_TEAMS_WHITELIST).some((k) => cnt.toLowerCase().includes(k.toLowerCase()));
      })
      .sort((a: any, b: any) => {
        const yearA = parseInt(String(a.startDate || '9999').slice(0, 4), 10) || 9999;
        const yearB = parseInt(String(b.startDate || '9999').slice(0, 4), 10) || 9999;
        return yearA - yearB; // 가장 빠른 프로 입단 연도 우선
      });

    if (validProCareers.length > 0) {
      const earliest = validProCareers[0];
      debutYear = String(earliest.startDate || '').slice(0, 4);
      debutTeam = String(earliest.contents || '').trim();
    }
  }

  // 2. 출신 학교 목록 구성 (대졸 4년제/2년제 누락 방지)
  const rawSchools: string[] = [];

  // 1순위: KBO 공식 기록실 출신교 (노암초, 경포중, 강릉고, 강릉영동대 등 전수 수록)
  if (kboOfficial?.careerSchools && kboOfficial.careerSchools.length > 0) {
    kboOfficial.careerSchools.forEach((s) => {
      if (!rawSchools.includes(s)) rawSchools.push(s);
    });
  }

  // 2순위: 네이버 인물정보 mainSchoolList & sportsBridgeSchool 보강
  if (Array.isArray(pRaw?.mainSchoolList)) {
    pRaw.mainSchoolList.forEach((s: any) => {
      if (s.schoolName && !rawSchools.includes(s.schoolName)) {
        rawSchools.push(s.schoolName);
      }
    });
  }
  if (Array.isArray(pRaw?.sportsBridgeSchool)) {
    pRaw.sportsBridgeSchool.forEach((s: any) => {
      if (s.schoolName && !rawSchools.includes(s.schoolName)) {
        rawSchools.push(s.schoolName);
      }
    });
  }

  // 중복 및 약칭/정식명칭 통합 (예: '성균관대학교'가 있으면 '성균관대' 생략)
  const schools: string[] = [];
  const sortedRaw = [...new Set(rawSchools)].sort((a, b) => b.length - a.length);
  for (const s of sortedRaw) {
    const base = s.replace(/(대학교|고등학교|중학교|초등학교|대학|학교|교)$/, '');
    const already = schools.some((r) => {
      const rBase = r.replace(/(대학교|고등학교|중학교|초등학교|대학|학교|교)$/, '');
      return base.length >= 2 && rBase.length >= 2 && (base === rBase || r.includes(base) || base.includes(rBase));
    });
    if (!already) {
      schools.push(s);
    }
  }

  // 3. 외국인 및 아시아쿼터/국내 선수 프로 데뷔 및 출신교명 고도화 엔진 적용
  const enhanced = enhancePlayerInformation(playerId, pRaw, rRaw, {
    career: kboOfficial?.careerRaw || '',
    draft: kboOfficial?.draftInfo || '',
    entryYear: kboOfficial?.joinInfoRaw || '',
    salary: kboOfficial?.salary || '',
    payment: kboOfficial?.payment || '',
  });

  // 외국인/아시아쿼터 선수의 경우 고도화된 학교 목록 및 데뷔 정보 우선 적용
  let finalSchools = schools;
  if (enhanced.playerCategory !== 'DOMESTIC' && enhanced.schools.length > 0) {
    finalSchools = enhanced.schools;
  } else if (finalSchools.length === 0 && enhanced.schools.length > 0) {
    finalSchools = enhanced.schools;
  }

  // 데뷔 정보 결합
  let finalDebutYear = debutYear;
  let finalDebutTeam = debutTeam;
  if (enhanced.playerCategory !== 'DOMESTIC') {
    finalDebutYear = enhanced.kboDebutYear || debutYear;
    finalDebutTeam = enhanced.kboDebutTeam || debutTeam;
  }

  const prizes: { year: string; contents: string }[] = [];
  if (Array.isArray(pRaw?.sportsBridgePrizeInfo)) {
    pRaw.sportsBridgePrizeInfo.forEach((pr: any) => {
      if (pr.contents) prizes.push({ year: pr.year || '', contents: pr.contents });
    });
  }

  const teamInfo = pRaw?.teamInfo?.[0] || {};
  const profile: PlayerProfile = {
    playerId,
    name: pRaw?.name || kboOfficial?.joinTeam || 'KBO 선수',
    englishName: enhanced.englishName,
    imageUrl:
      pRaw?.profileImage ||
      'https://ssl.pstatic.net/static.sports/resources/sports-web/player-end/static/media/default_player.svg',
    teamCode: teamInfo.teamCode || rRaw?.teamCode || '',
    teamName: teamInfo.teamOriginalName || teamInfo.teamName || finalDebutTeam || 'KBO',
    backNumber: teamInfo.teamPlayerNumber || '',
    position: teamInfo.teamPosition || (rRaw?.playerType === 'pitcher' ? '투수' : '타자'),
    playerDescription: rRaw?.playerDescription || (rRaw?.playerType === 'pitcher' ? '투수' : '타자'),
    birthDate: pRaw?.birthDate || '',
    birthDateKor: pRaw?.birthDateKor || pRaw?.birthDate || '',
    age: pRaw?.age || '',
    height: pRaw?.bodyHeight ? `${pRaw.bodyHeight}cm` : '',
    weight: pRaw?.bodyWeight ? `${pRaw.bodyWeight}kg` : '',
    debutYear: finalDebutYear || '',
    debutTeam: finalDebutTeam || '',
    draftInfo: enhanced.kboDraftType || draftInfo || '',
    payment: kboOfficial?.payment || '',
    salary: kboOfficial?.salary || '',
    schools: finalSchools,
    prizes,

    // 외국인/아시아쿼터 특화 고도화 필드
    playerCategory: enhanced.playerCategory,
    categoryLabel: enhanced.categoryLabel,
    nationality: enhanced.nationality,
    nationalityFlag: enhanced.nationalityFlag,
    kboDebutYear: enhanced.kboDebutYear,
    kboDebutTeam: enhanced.kboDebutTeam,
    kboDraftType: enhanced.kboDraftType,
    proDebutYear: enhanced.proDebutYear,
    proDebutTeam: enhanced.proDebutTeam,
    rawCareer: kboOfficial?.careerRaw || '',
  };

  // 3. 기록 정규화 (시즌별, 일자별, 상대팀별)
  let parsedRecord: any = {};
  try {
    if (rRaw?.record) parsedRecord = JSON.parse(rRaw.record);
  } catch (_) {}

  let parsedVsTeam: any = {};
  try {
    if (rRaw?.vsTeam) parsedVsTeam = JSON.parse(rRaw.vsTeam);
  } catch (_) {}

  // 3-1. 시즌별 기록
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

  // 3-2. 일자별 최근 기록
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

  // 3-3. 상대 구단별 전적
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
