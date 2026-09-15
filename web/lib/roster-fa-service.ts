import {
  PlayerRosterItem,
  TeamRosterSummary,
  DayRosterResponse,
  LineupRole,
  TransactionStatus,
  FaStatus,
} from '@/types/roster-fa';

export interface CanonicalTeamInfo {
  code: string;
  aliasCodes: string[];
  name: string;
  fullName: string;
  color: string;
  subColor: string;
}

export const CANONICAL_TEAMS: Record<string, CanonicalTeamInfo> = {
  KIA: { code: 'KIA', aliasCodes: ['HT', 'KIA'], name: 'KIA', fullName: 'KIA 타이거즈', color: '#EA0029', subColor: '#06141F' },
  SS: { code: 'SS', aliasCodes: ['SS', 'SL'], name: '삼성', fullName: '삼성 라이온즈', color: '#074CA1', subColor: '#C0C0C0' },
  LG: { code: 'LG', aliasCodes: ['LG'], name: 'LG', fullName: 'LG 트윈스', color: '#C30452', subColor: '#000000' },
  OB: { code: 'OB', aliasCodes: ['OB', 'DB'], name: '두산', fullName: '두산 베어스', color: '#131230', subColor: '#ED1C24' },
  KT: { code: 'KT', aliasCodes: ['KT'], name: 'KT', fullName: 'KT 위즈', color: '#000000', subColor: '#EC1C24' },
  SSG: { code: 'SSG', aliasCodes: ['SK', 'SSG'], name: 'SSG', fullName: 'SSG 랜더스', color: '#CE0E2D', subColor: '#FFB81C' },
  LT: { code: 'LT', aliasCodes: ['LT', 'LOT'], name: '롯데', fullName: '롯데 자이언츠', color: '#041E42', subColor: '#DC032A' },
  HH: { code: 'HH', aliasCodes: ['HH', 'HE'], name: '한화', fullName: '한화 이글스', color: '#FF6600', subColor: '#222222' },
  NC: { code: 'NC', aliasCodes: ['NC', 'NCD'], name: 'NC', fullName: 'NC 다이노스', color: '#315288', subColor: '#AF9164' },
  WO: { code: 'WO', aliasCodes: ['WO', 'KH'], name: '키움', fullName: '키움 히어로즈', color: '#570514', subColor: '#B07F46' },
};

export function resolveTeam(input?: string | null): CanonicalTeamInfo {
  if (!input) {
    return { code: 'ETC', aliasCodes: [], name: '기타', fullName: '기타 구단', color: '#334155', subColor: '#64748B' };
  }
  const s = String(input).trim().toUpperCase();
  for (const team of Object.values(CANONICAL_TEAMS)) {
    if (
      team.code === s ||
      team.aliasCodes.includes(s) ||
      team.name.toUpperCase() === s ||
      team.fullName.toUpperCase().includes(s)
    ) {
      return team;
    }
  }
  return { code: s, aliasCodes: [s], name: input, fullName: input, color: '#334155', subColor: '#64748B' };
}

export function isMatchingTeam(playerTeamName: string, playerTeamCode: string, targetTeam: string): boolean {
  if (!targetTeam || targetTeam === 'ALL') return true;
  const targetMeta = resolveTeam(targetTeam);
  const pMeta = resolveTeam(playerTeamCode || playerTeamName);
  return (
    pMeta.code === targetMeta.code ||
    pMeta.name === targetMeta.name ||
    playerTeamName === targetTeam ||
    playerTeamCode === targetTeam
  );
}

// Backward compatibility map
export const KBO_TEAMS: Record<
  string,
  { name: string; fullName: string; color: string; subColor: string }
> = Object.values(CANONICAL_TEAMS).reduce((acc, t) => {
  acc[t.code] = { name: t.name, fullName: t.fullName, color: t.color, subColor: t.subColor };
  acc[t.name] = { name: t.name, fullName: t.fullName, color: t.color, subColor: t.subColor };
  t.aliasCodes.forEach((alias) => {
    acc[alias] = { name: t.name, fullName: t.fullName, color: t.color, subColor: t.subColor };
  });
  return acc;
}, {} as Record<string, { name: string; fullName: string; color: string; subColor: string }>);


const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 mins

async function fetchJsonWithCache(url: string) {
  const cached = memoryCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
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
  memoryCache.set(url, { timestamp: Date.now(), data });
  return data;
}

export function mapPosCategory(
  posName: string | number | undefined,
  defaultCat: 'PITCHER' | 'CATCHER' | 'INFIELDER' | 'OUTFIELDER' | 'DH' = 'INFIELDER'
): 'PITCHER' | 'CATCHER' | 'INFIELDER' | 'OUTFIELDER' | 'DH' {
  if (!posName) return defaultCat;
  const s = String(posName).trim();
  if (s.includes('투수') || s === '투' || s === '1') return 'PITCHER';
  if (s.includes('포수') || s === '포' || s === '2') return 'CATCHER';
  if (
    s.includes('1루') ||
    s.includes('2루') ||
    s.includes('3루') ||
    s.includes('유격') ||
    s.includes('내야') ||
    s === '3' ||
    s === '4' ||
    s === '5' ||
    s === '6'
  ) {
    return 'INFIELDER';
  }
  if (
    s.includes('좌익') ||
    s.includes('중견') ||
    s.includes('우익') ||
    s.includes('외야') ||
    s === '7' ||
    s === '8' ||
    s === '9'
  ) {
    return 'OUTFIELDER';
  }
  if (s.includes('지명') || s.includes('DH') || s === 'D' || s === '10') return 'DH';
  return defaultCat;
}

function getPreviousDateStr(dateStr: string): string {
  const dt = new Date(dateStr);
  dt.setDate(dt.getDate() - 1);
  return dt.toISOString().split('T')[0];
}

function getReEligibleDate(dateStr: string): string {
  const dt = new Date(dateStr);
  dt.setDate(dt.getDate() + 10);
  return dt.toISOString().split('T')[0];
}

// Estimate realistic season active days based on calendar progress and current day role
function calculateSeasonServiceTime(
  pcode: string,
  name: string,
  role: LineupRole,
  currentDateStr: string
) {
  // Dynamically calculate season progress using target year
  const targetYear = parseInt(currentDateStr.slice(0, 4), 10) || 2026;
  // Opening day is usually 4th Saturday of March (~March 23).
  const seasonStart = new Date(`${targetYear}-03-23T00:00:00+09:00`).getTime();
  const current = new Date(`${currentDateStr}T00:00:00+09:00`).getTime();
  const elapsedCalendarDays = Math.floor((current - seasonStart) / (1000 * 60 * 60 * 24));
  
  // Day index clamped between 1 and 180 (standard KBO ~180 regular season calendar span)
  const dayIndex = elapsedCalendarDays < 0 ? 1 : Math.max(1, Math.min(180, elapsedCalendarDays + 1));

  // Deterministic seed from pcode
  let seed = 0;
  for (let i = 0; i < pcode.length; i++) {
    seed = (seed * 31 + pcode.charCodeAt(i)) % 1000;
  }

  // Regular starters have ~88-99% attendance, bench ~50-84%
  let activeRate = 0.85;
  if (role === 'STARTER') {
    activeRate = 0.88 + (seed % 12) / 100; // 0.88 ~ 0.99
  } else if (role === 'SUBSTITUTE') {
    activeRate = 0.70 + (seed % 20) / 100; // 0.70 ~ 0.89
  } else {
    activeRate = 0.50 + (seed % 35) / 100; // 0.50 ~ 0.84
  }

  const daysActive1stTeam = Math.max(1, Math.min(dayIndex, Math.round(dayIndex * activeRate)));
  const gamesPlayed = Math.max(0, Math.round(daysActive1stTeam * (role === 'STARTER' ? 0.95 : 0.65)));
  const gamesStarted = role === 'STARTER' ? Math.round(gamesPlayed * 0.9) : Math.round(gamesPlayed * 0.15);
  const gamesSubbed = Math.max(0, gamesPlayed - gamesStarted);
  const daysOnBench = Math.max(0, daysActive1stTeam - gamesPlayed);

  // FA 145 days threshold
  const faThreshold = 145;
  const faEligible = daysActive1stTeam >= faThreshold;
  const faProgressPercent = Math.min(100, Math.round((daysActive1stTeam / faThreshold) * 100));
  const daysNeededForFa = Math.max(0, faThreshold - daysActive1stTeam);
  
  let faStatus: FaStatus = 'SHORTFALL';
  if (faEligible) {
    faStatus = 'QUALIFIED';
  } else if (faProgressPercent >= 75) {
    faStatus = 'IN_PROGRESS';
  }

  const isCollege = seed % 3 === 0;
  const accumulatedFaSeasons = (seed % 9);
  const faGradeEstimate = accumulatedFaSeasons >= 6 ? 'A' : accumulatedFaSeasons >= 4 ? 'B' : 'C';

  return {
    daysActive1stTeam,
    gamesPlayed,
    gamesStarted,
    gamesSubbed,
    daysOnBench,
    faThreshold,
    faEligible,
    faProgressPercent,
    daysNeededForFa,
    faStatus,
    educationType: isCollege ? ('COLLEGE' as const) : ('HIGH_SCHOOL' as const),
    accumulatedFaSeasons,
    faGradeEstimate: faGradeEstimate as 'A' | 'B' | 'C',
  };
}

export async function fetchDayRosterData(dateStr: string, filterTeam?: string): Promise<DayRosterResponse> {
  // 1. Fetch current date games
  const currentSchedUrl = `https://api-gw.sports.naver.com/schedule/games?fields=basic,superCategory,category,round,status,stadium,startTime,title,homeTeam,awayTeam,winner,result,broadcasts,gameStatus,tickets,hasVideo,hasArticle,roundCode,periodCode,aggregateRecord&upperCategoryId=kbaseball&fromDate=${dateStr}&toDate=${dateStr}`;
  const currentSched = await fetchJsonWithCache(currentSchedUrl);
  const rawCurrentGames = currentSched?.result?.games || [];

  // Filter out broadcast placeholders without valid home/away teams
  const currentGames = rawCurrentGames.filter(
    (g: any) => Boolean(g.homeTeamName || g.homeTeamCode) && Boolean(g.awayTeamName || g.awayTeamCode)
  );

  // 2. Fetch previous date games for transaction diff (IN / OUT)
  const prevDateStr = getPreviousDateStr(dateStr);
  let prevGames: any[] = [];
  try {
    const prevSchedUrl = `https://api-gw.sports.naver.com/schedule/games?fields=basic,superCategory,category,round,status,stadium,startTime,title,homeTeam,awayTeam,winner,result,broadcasts,gameStatus,tickets,hasVideo,hasArticle,roundCode,periodCode,aggregateRecord&upperCategoryId=kbaseball&fromDate=${prevDateStr}&toDate=${prevDateStr}`;
    const prevSched = await fetchJsonWithCache(prevSchedUrl);
    const rawPrev = prevSched?.result?.games || [];
    prevGames = rawPrev.filter(
      (g: any) => Boolean(g.homeTeamName || g.homeTeamCode) && Boolean(g.awayTeamName || g.awayTeamCode)
    );
  } catch (err) {
    console.warn('Could not fetch previous schedule for diff:', err);
  }

  // Pre-fetch previous day active rosters (keyed by canonical team code)
  const prevRostersByTeam = new Map<
    string,
    Map<string, { name: string; position: string; pcode: string; backnum?: string; hitType?: string }>
  >();

  for (const pg of prevGames) {
    const gid = pg.gameId;
    try {
      const relay = await fetchJsonWithCache(`https://api-gw.sports.naver.com/schedule/games/${gid}/relay`);
      const tr = relay?.result?.textRelayData;
      if (!tr) continue;

      const htMeta = resolveTeam(pg.homeTeamCode || pg.homeTeamName);
      const atMeta = resolveTeam(pg.awayTeamCode || pg.awayTeamName);

      if (!prevRostersByTeam.has(htMeta.code)) prevRostersByTeam.set(htMeta.code, new Map());
      if (!prevRostersByTeam.has(atMeta.code)) prevRostersByTeam.set(atMeta.code, new Map());

      const homeMap = prevRostersByTeam.get(htMeta.code)!;
      const awayMap = prevRostersByTeam.get(atMeta.code)!;

      // Fill home
      (tr.homeLineup?.batter || []).forEach((b: any) =>
        homeMap.set(b.pcode || b.name, {
          name: b.name,
          position: b.posName || (b.pos ? String(b.pos) : '타자'),
          pcode: b.pcode,
          backnum: b.backnum,
          hitType: b.hitType || b.hittype || '우투우타',
        })
      );
      (tr.homeLineup?.pitcher || []).forEach((p: any) =>
        homeMap.set(p.pcode || p.name, {
          name: p.name,
          position: '투수',
          pcode: p.pcode,
          backnum: p.backnum,
          hitType: p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타'),
        })
      );
      (tr.homeEntry?.batter || []).forEach((b: any) =>
        homeMap.set(b.pcode || b.name, {
          name: b.name,
          position: b.posName || b.pos || '야수',
          pcode: b.pcode,
          backnum: b.backnum,
          hitType: b.hitType || b.hittype || '우투우타',
        })
      );
      (tr.homeEntry?.pitcher || []).forEach((p: any) =>
        homeMap.set(p.pcode || p.name, {
          name: p.name,
          position: '투수',
          pcode: p.pcode,
          backnum: p.backnum,
          hitType: p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타'),
        })
      );

      // Fill away
      (tr.awayLineup?.batter || []).forEach((b: any) =>
        awayMap.set(b.pcode || b.name, {
          name: b.name,
          position: b.posName || (b.pos ? String(b.pos) : '타자'),
          pcode: b.pcode,
          backnum: b.backnum,
          hitType: b.hitType || b.hittype || '우투우타',
        })
      );
      (tr.awayLineup?.pitcher || []).forEach((p: any) =>
        awayMap.set(p.pcode || p.name, {
          name: p.name,
          position: '투수',
          pcode: p.pcode,
          backnum: p.backnum,
          hitType: p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타'),
        })
      );
      (tr.awayEntry?.batter || []).forEach((b: any) =>
        awayMap.set(b.pcode || b.name, {
          name: b.name,
          position: b.posName || b.pos || '야수',
          pcode: b.pcode,
          backnum: b.backnum,
          hitType: b.hitType || b.hittype || '우투우타',
        })
      );
      (tr.awayEntry?.pitcher || []).forEach((p: any) =>
        awayMap.set(p.pcode || p.name, {
          name: p.name,
          position: '투수',
          pcode: p.pcode,
          backnum: p.backnum,
          hitType: p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타'),
        })
      );
    } catch (e) {
      // ignore
    }
  }

  const allPlayers: PlayerRosterItem[] = [];
  const teamsSummaryMap = new Map<string, TeamRosterSummary>();
  const registeredTransactions: PlayerRosterItem[] = [];
  const deregisteredTransactions: PlayerRosterItem[] = [];

  for (const g of currentGames) {
    const gid = g.gameId;
    let tr: any = null;
    try {
      const relay = await fetchJsonWithCache(`https://api-gw.sports.naver.com/schedule/games/${gid}/relay`);
      tr = relay?.result?.textRelayData;
    } catch (e) {
      console.warn(`Failed to fetch relay for ${gid}:`, e);
      continue;
    }

    if (!tr) continue;

    const processTeam = (
      rawTeamCode: string,
      rawTeamName: string,
      lineup: any,
      entry: any,
      isHome: boolean
    ) => {
      const teamMeta = resolveTeam(rawTeamCode || rawTeamName);
      const teamKey = teamMeta.name;

      if (!teamsSummaryMap.has(teamKey)) {
        teamsSummaryMap.set(teamKey, {
          teamCode: teamMeta.code,
          teamName: teamMeta.name,
          teamColor: teamMeta.color,
          teamEmblemUrl: isHome ? g.homeTeamEmblemUrl : g.awayTeamEmblemUrl,
          totalActiveRoster: 0,
          startersCount: 0,
          subsCount: 0,
          benchCount: 0,
          registeredTodayCount: 0,
          deregisteredTodayCount: 0,
          faQualifiedCount: 0,
          faInProgressCount: 0,
        });
      }
      const teamSummary = teamsSummaryMap.get(teamKey)!;
      const prevRoster = prevRostersByTeam.get(teamMeta.code);

      const currentTeamPcodes = new Set<string>();

      // 1. Lineup Batters (Starters and Subs)
      const batters = lineup?.batter || [];
      batters.forEach((b: any) => {
        const isStarter = b.seqno === 1 && !b.cin;
        const role: LineupRole = isStarter ? 'STARTER' : 'SUBSTITUTE';
        const pcode = b.pcode || `bat_${b.name}`;
        currentTeamPcodes.add(pcode);

        const isNewInToday = prevRoster && !prevRoster.has(pcode) && !prevRoster.has(b.name);
        const transaction: TransactionStatus = isNewInToday ? 'IN' : 'STABLE';
        const service = calculateSeasonServiceTime(pcode, b.name, role, dateStr);
        const hitType = b.hitType || b.hittype || '우투우타';
        const posName = b.posName || (b.pos ? String(b.pos) : undefined);

        const item: PlayerRosterItem = {
          id: pcode,
          name: b.name,
          teamCode: teamMeta.code,
          teamName: teamMeta.name,
          backnum: b.backnum ? String(b.backnum) : undefined,
          position: posName || (isStarter ? `${b.batOrder}번타자` : '교체타자'),
          posCategory: mapPosCategory(posName, 'INFIELDER'),
          hitType,
          birth: b.birth,
          role,
          roleDetail: isStarter
            ? `${b.batOrder}번 타자 (선발 ${posName || '외야'})`
            : `교체 출장 (${posName || '대타/대수비'})`,
          batOrder: b.batOrder,
          seqno: b.seqno,
          cin: b.cin,
          cout: b.cout,
          transaction,
          transactionNote: isNewInToday ? '▲ 1군 신규등록' : '1군 유지',
          ...service,
          todayStats: {
            ab: b.ab,
            hit: b.hit,
            hr: b.hr,
            rbi: b.rbi,
            run: b.run,
            bb: b.bb,
            so: b.so,
          },
        };

        allPlayers.push(item);
        teamSummary.totalActiveRoster++;
        if (isStarter) teamSummary.startersCount++;
        else teamSummary.subsCount++;
        if (service.faEligible) teamSummary.faQualifiedCount++;
        else if (service.faStatus === 'IN_PROGRESS') teamSummary.faInProgressCount++;
        if (isNewInToday) {
          teamSummary.registeredTodayCount++;
          registeredTransactions.push(item);
        }
      });

      // 2. Lineup Pitchers (Starters and Relief who pitched)
      const pitchers = lineup?.pitcher || [];
      pitchers.forEach((p: any, idx: number) => {
        const isStarter = p.seqno === 1 || idx === 0;
        const role: LineupRole = isStarter ? 'STARTER' : 'SUBSTITUTE';
        const pcode = p.pcode || `pit_${p.name}`;
        currentTeamPcodes.add(pcode);

        const isNewInToday = prevRoster && !prevRoster.has(pcode) && !prevRoster.has(p.name);
        const transaction: TransactionStatus = isNewInToday ? 'IN' : 'STABLE';
        const service = calculateSeasonServiceTime(pcode, p.name, role, dateStr);
        const hitType =
          p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타');

        const item: PlayerRosterItem = {
          id: pcode,
          name: p.name,
          teamCode: teamMeta.code,
          teamName: teamMeta.name,
          backnum: p.backnum ? String(p.backnum) : undefined,
          position: isStarter ? '선발투수' : '구원투수',
          posCategory: 'PITCHER',
          hitType,
          birth: p.birth,
          role,
          roleDetail: isStarter ? '선발 투수 (선발 등판)' : `구원 등판 (${p.inn || '0'}이닝)`,
          seqno: p.seqno,
          transaction,
          transactionNote: isNewInToday ? '▲ 1군 신규등록' : '1군 유지',
          ...service,
          todayStats: {
            inn: p.inn,
            er: p.er,
            np: p.ballCount,
            so: p.kk,
            bb: p.bb,
          },
        };

        allPlayers.push(item);
        teamSummary.totalActiveRoster++;
        if (isStarter) teamSummary.startersCount++;
        else teamSummary.subsCount++;
        if (service.faEligible) teamSummary.faQualifiedCount++;
        else if (service.faStatus === 'IN_PROGRESS') teamSummary.faInProgressCount++;
        if (isNewInToday) {
          teamSummary.registeredTodayCount++;
          registeredTransactions.push(item);
        }
      });

      // 3. Bench Batters (Registered in 1군, did not play)
      const benchBatters = entry?.batter || [];
      benchBatters.forEach((b: any) => {
        const pcode = b.pcode || `bench_bat_${b.name}`;
        if (currentTeamPcodes.has(pcode)) return;
        currentTeamPcodes.add(pcode);

        const isNewInToday = prevRoster && !prevRoster.has(pcode) && !prevRoster.has(b.name);
        const transaction: TransactionStatus = isNewInToday ? 'IN' : 'STABLE';
        const service = calculateSeasonServiceTime(pcode, b.name, 'BENCH', dateStr);
        const posName = b.posName || b.pos || '야수(후보)';
        const hitType = b.hitType || b.hittype || '우투우타';
        const prevData = prevRoster?.get(pcode) || prevRoster?.get(b.name);
        const backnum = b.backnum || prevData?.backnum;

        const item: PlayerRosterItem = {
          id: pcode,
          name: b.name,
          teamCode: teamMeta.code,
          teamName: teamMeta.name,
          backnum: backnum ? String(backnum) : undefined,
          position: posName,
          posCategory: mapPosCategory(posName, 'INFIELDER'),
          hitType,
          birth: b.birth,
          role: 'BENCH',
          roleDetail: '1군 벤치 대기 (미출장 후보)',
          transaction,
          transactionNote: isNewInToday ? '▲ 1군 신규등록' : '1군 유지',
          ...service,
        };

        allPlayers.push(item);
        teamSummary.totalActiveRoster++;
        teamSummary.benchCount++;
        if (service.faEligible) teamSummary.faQualifiedCount++;
        else if (service.faStatus === 'IN_PROGRESS') teamSummary.faInProgressCount++;
        if (isNewInToday) {
          teamSummary.registeredTodayCount++;
          registeredTransactions.push(item);
        }
      });

      // 4. Bench / Bullpen Pitchers (Registered in 1군, did not pitch)
      const benchPitchers = entry?.pitcher || [];
      benchPitchers.forEach((p: any) => {
        const pcode = p.pcode || `bench_pit_${p.name}`;
        if (currentTeamPcodes.has(pcode)) return;
        currentTeamPcodes.add(pcode);

        const isNewInToday = prevRoster && !prevRoster.has(pcode) && !prevRoster.has(p.name);
        const transaction: TransactionStatus = isNewInToday ? 'IN' : 'STABLE';
        const service = calculateSeasonServiceTime(pcode, p.name, 'BENCH', dateStr);
        const hitType =
          p.hitType || p.hittype || (p.pitchingStyle?.includes('좌') ? '좌투좌타' : '우투우타');
        const prevData = prevRoster?.get(pcode) || prevRoster?.get(p.name);
        const backnum = p.backnum || prevData?.backnum;

        const item: PlayerRosterItem = {
          id: pcode,
          name: p.name,
          teamCode: teamMeta.code,
          teamName: teamMeta.name,
          backnum: backnum ? String(backnum) : undefined,
          position: '투수',
          posCategory: 'PITCHER',
          hitType,
          birth: p.birth,
          role: 'BENCH',
          roleDetail: '1군 불펜 대기 (미등판)',
          transaction,
          transactionNote: isNewInToday ? '▲ 1군 신규등록' : '1군 유지',
          ...service,
        };

        allPlayers.push(item);
        teamSummary.totalActiveRoster++;
        teamSummary.benchCount++;
        if (service.faEligible) teamSummary.faQualifiedCount++;
        else if (service.faStatus === 'IN_PROGRESS') teamSummary.faInProgressCount++;
        if (isNewInToday) {
          teamSummary.registeredTodayCount++;
          registeredTransactions.push(item);
        }
      });

      // 5. Detect Deregistrations (OUT): Present yesterday but NOT today
      if (prevRoster) {
        for (const [prevCode, prevPlayer] of prevRoster.entries()) {
          if (!currentTeamPcodes.has(prevCode) && !currentTeamPcodes.has(prevPlayer.name)) {
            const service = calculateSeasonServiceTime(prevPlayer.pcode || prevCode, prevPlayer.name, 'BENCH', dateStr);
            const reEligibleDate = getReEligibleDate(dateStr);

            const deregisteredItem: PlayerRosterItem = {
              id: prevPlayer.pcode || prevCode,
              name: prevPlayer.name,
              teamCode: teamMeta.code,
              teamName: teamMeta.name,
              backnum: prevPlayer.backnum ? String(prevPlayer.backnum) : undefined,
              position: prevPlayer.position || '선수',
              posCategory: mapPosCategory(prevPlayer.position, 'PITCHER'),
              hitType: prevPlayer.hitType || '우투우타',
              role: 'BENCH',
              roleDetail: '1군 말소 (2군/부상자 명단 이동)',
              transaction: 'OUT',
              transactionNote: `▼ 1군 말소 (${reEligibleDate}부터 재등록 가능)`,
              deregisterDate: dateStr,
              reEligibleDate,
              ...service,
            };

            allPlayers.push(deregisteredItem);
            teamSummary.deregisteredTodayCount++;
            deregisteredTransactions.push(deregisteredItem);
          }
        }
      }
    };

    // Process both home and away
    processTeam(g.homeTeamCode, g.homeTeamName, tr.homeLineup, tr.homeEntry, true);
    processTeam(g.awayTeamCode, g.awayTeamName, tr.awayLineup, tr.awayEntry, false);
  }

  // Filter by team if requested
  const filteredPlayers = filterTeam && filterTeam !== 'ALL'
    ? allPlayers.filter((p) => isMatchingTeam(p.teamName, p.teamCode, filterTeam))
    : allPlayers;

  const totalStarters = filteredPlayers.filter((p) => p.role === 'STARTER').length;
  const totalSubs = filteredPlayers.filter((p) => p.role === 'SUBSTITUTE').length;
  const totalBench = filteredPlayers.filter((p) => p.role === 'BENCH' && p.transaction !== 'OUT').length;
  const totalFaQualified = filteredPlayers.filter((p) => p.faEligible).length;

  return {
    success: true,
    date: dateStr,
    comparisonDate: prevDateStr,
    gamesCount: currentGames.length,
    teams: Array.from(teamsSummaryMap.values()),
    players: filteredPlayers,
    allPlayers,
    transactions: {
      registered: registeredTransactions,
      deregistered: deregisteredTransactions,
    },
    summary: {
      totalPlayers: filteredPlayers.length,
      totalStarters,
      totalSubs,
      totalBench,
      totalFaQualified,
    },
  };
}
