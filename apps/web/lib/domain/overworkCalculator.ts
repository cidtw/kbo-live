import {
  PitcherBoxEntry,
  PitcherAppearance,
  PitcherOverworkData,
  OverworkRiskStatus,
  OverworkBreakdown,
  TeamOverworkSummary,
  PitcherRole,
} from './types';
import { mapTeamCode } from './util';

export const TEAM_FULL_NAMES: Record<string, string> = {
  KIA: 'KIA 타이거즈',
  LG: 'LG 트윈스',
  DB: '두산 베어스',
  OB: '두산 베어스',
  SL: '삼성 라이온즈',
  SS: '삼성 라이온즈',
  SSG: 'SSG 랜더스',
  SK: 'SSG 랜더스',
  KT: 'KT 위즈',
  LOT: '롯데 자이언츠',
  LT: '롯데 자이언츠',
  HE: '한화 이글스',
  HH: '한화 이글스',
  NCD: 'NC 다이노스',
  NC: 'NC 다이노스',
  KH: '키움 히어로즈',
  WO: '키움 히어로즈',
};

/**
 * 이닝 문자열을 아웃카운트로 변환합니다.
 * 예: "5" -> 15, "1 ⅔" -> 5, "⅔" -> 2, "⅓" -> 1, "0" -> 0
 */
export function parseInningToOuts(innStr: string | undefined | null): number {
  if (!innStr) return 0;
  const s = String(innStr).trim();
  if (!s || s === '0') return 0;

  // 정수 이닝만 있는 경우 ("5", "7")
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10) * 3;
  }

  // 분수 포함 경우 ("1 ⅔", "1 2/3", "⅔", "2/3", "⅓", "1/3")
  let fullInnings = 0;
  let partialFraction = s;

  const parts = s.split(/\s+/);
  if (parts.length === 2) {
    fullInnings = parseInt(parts[0], 10) || 0;
    partialFraction = parts[1];
  }

  let partialOuts = 0;
  if (partialFraction === '⅔' || partialFraction === '2/3') {
    partialOuts = 2;
  } else if (partialFraction === '⅓' || partialFraction === '1/3') {
    partialOuts = 1;
  }

  return fullInnings * 3 + partialOuts;
}

/**
 * 아웃카운트를 표준 야구 이닝 문자열로 변환합니다.
 * 예: 15 -> "5", 5 -> "1 ⅔", 2 -> "⅔", 0 -> "0"
 */
export function formatOutsToInning(outs: number): string {
  if (!outs || outs <= 0) return '0';
  const full = Math.floor(outs / 3);
  const rem = outs % 3;

  const frac = rem === 2 ? '⅔' : rem === 1 ? '⅓' : '';
  if (full === 0) return frac || '0';
  return frac ? `${full} ${frac}` : `${full}`;
}

export function outsToDecimal(outs: number): number {
  if (!outs || outs <= 0) return 0;
  return Math.round((outs / 3) * 100) / 100;
}

/**
 * 두 날짜(YYYY-MM-DD) 사이의 일수 차이를 반환합니다. (date2 - date1)
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 단일 경기 투구의 피로도/부하 점수(Game Strain) 계산
 */
export function calculateGameStrain(
  pitches: number,
  outs: number,
  isRelief: boolean,
  consecutiveDays: number,
  restDays: number
): number {
  if (pitches <= 0) return 0;

  if (isRelief) {
    // 불펜 투수 가중치
    let restMultiplier = 1.0;
    if (consecutiveDays >= 4) {
      restMultiplier = 3.0;
    } else if (consecutiveDays === 3) {
      restMultiplier = 2.0;
    } else if (consecutiveDays === 2) {
      restMultiplier = 1.4;
    } else if (restDays === 1) {
      restMultiplier = 1.0;
    } else if (restDays >= 2) {
      restMultiplier = 0.8;
    }

    // 멀티이닝 가중치 (3아웃 = 1.0이닝 초과 시 아웃당 15% 가산)
    let multiInningMultiplier = 1.0;
    if (outs > 3) {
      multiInningMultiplier = 1.0 + (outs - 3) * 0.15;
    }

    return pitches * restMultiplier * multiInningMultiplier;
  } else {
    // 선발 투수: 100구 초과 시 부하 급격 증가
    let papBonus = 0;
    if (pitches > 100) {
      papBonus = (pitches - 100) * 2;
    }
    return pitches + papBonus;
  }
}

/**
 * 혹사 점수에 따른 위험도 등급 판정
 */
export function getRiskStatus(score: number): { status: OverworkRiskStatus; label: string } {
  if (score >= 85) return { status: 'EXTREME', label: '혹사' };
  if (score >= 70) return { status: 'DANGER', label: '위험' };
  if (score >= 50) return { status: 'WARNING', label: '경고' };
  if (score >= 30) return { status: 'CAUTION', label: '주의' };
  return { status: 'SAFE', label: '정상' };
}

/**
 * 한 선수의 전체 등판 기록을 바탕으로 연투 계산 및 혹사 지수를 집계합니다.
 */
export function processPitcherHistory(
  pcode: string,
  rawAppearances: {
    gameId: string;
    date: string;
    team: string;
    opponent: string;
    isHome: boolean;
    order: number;
    raw: PitcherBoxEntry;
  }[],
  asOfDate?: string
): PitcherOverworkData | null {
  if (!rawAppearances || rawAppearances.length === 0) return null;

  // 날짜 오름차순 정렬
  const sorted = [...rawAppearances].sort((a, b) => a.date.localeCompare(b.date));
  const latestEntry = sorted[sorted.length - 1];
  const firstEntry = sorted[0];

  const targetDate = asOfDate || latestEntry.date;
  const teamCode = mapTeamCode(latestEntry.team);
  const teamName = TEAM_FULL_NAMES[teamCode] || teamCode;
  const pitcherName = latestEntry.raw.name;

  let starts = 0;
  let reliefs = 0;
  let totalOuts = 0;
  let totalPitches = 0;
  let twoDaysInRow = 0;
  let threeDaysInRow = 0;
  let maxConsecutive = 1;
  let multiInningReliefCount = 0;

  let wins = 0;
  let losses = 0;
  let saves = 0;
  let holds = 0;

  const enrichedAppearances: PitcherAppearance[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;

    const outs = parseInningToOuts(curr.raw.inn);
    const pitches = Number(curr.raw.bf) || 0;
    const isStarter = curr.order === 1;
    const isRelief = !isStarter;

    if (isStarter) starts++;
    else reliefs++;

    totalOuts += outs;
    totalPitches += pitches;

    if (isRelief && outs > 3) {
      multiInningReliefCount++;
    }

    // 승패홀세 집계
    const wls = (curr.raw.wls || '').trim();
    if (wls === '승') wins++;
    else if (wls === '패') losses++;
    else if (wls === '세') saves++;
    else if (wls === '홀') holds++;

    // 휴식일 및 연속 등판 계산
    let restDays = 999;
    let consecutiveDays = 1;

    if (prev) {
      const diff = daysBetween(prev.date, curr.date);
      restDays = Math.max(0, diff - 1);
      if (diff === 1) {
        // 연투
        consecutiveDays = enrichedAppearances[i - 1].consecutiveDays + 1;
        if (consecutiveDays === 2) twoDaysInRow++;
        if (consecutiveDays >= 3) threeDaysInRow++;
      } else if (diff === 0) {
        // 더블헤더 등 같은 날 2번째 등판
        consecutiveDays = enrichedAppearances[i - 1].consecutiveDays + 1;
        twoDaysInRow++;
      } else {
        consecutiveDays = 1;
      }
    }

    if (consecutiveDays > maxConsecutive) {
      maxConsecutive = consecutiveDays;
    }

    const gameStrain = calculateGameStrain(pitches, outs, isRelief, consecutiveDays, restDays);

    enrichedAppearances.push({
      gameId: curr.gameId,
      date: curr.date,
      team: mapTeamCode(curr.team),
      opponent: mapTeamCode(curr.opponent),
      isHome: curr.isHome,
      order: curr.order,
      role: isStarter ? 'starter' : 'relief',
      innStr: curr.raw.inn || '0',
      outs,
      innings: outsToDecimal(outs),
      pitches,
      hits: curr.raw.hit || 0,
      runs: curr.raw.r || 0,
      er: curr.raw.er || 0,
      bb: curr.raw.bb || 0,
      kk: curr.raw.kk || 0,
      wls,
      restDays,
      consecutiveDays,
      isMultiInning: isRelief && outs > 3,
      gameStrain,
    });
  }

  // 최신 상태 지표 산출
  const lastApp = enrichedAppearances[enrichedAppearances.length - 1];
  const daysSinceLastGame = daysBetween(lastApp.date, targetDate);
  const currentRestDays = Math.max(0, daysSinceLastGame);
  const currentConsecutiveDays = daysSinceLastGame <= 1 ? lastApp.consecutiveDays : 0;

  // 최근 3일 및 7일간 투구수 계산 (기준: targetDate 기준 최근 3일 및 7일)
  let recent3DaysPitches = 0;
  let recent7DaysPitches = 0;
  let recent7DaysGames = 0;

  for (const app of enrichedAppearances) {
    const diff = daysBetween(app.date, targetDate);
    if (diff >= 0 && diff <= 3) {
      recent3DaysPitches += app.pitches;
    }
    if (diff >= 0 && diff <= 7) {
      recent7DaysPitches += app.pitches;
      recent7DaysGames++;
    }
  }

  // 주 보직 결정
  let primaryRole: PitcherRole = 'RP';
  if (starts > reliefs) primaryRole = 'SP';
  else if (saves >= 3) primaryRole = 'CL';

  const roleLabel = primaryRole === 'SP' ? '선발' : primaryRole === 'CL' ? '마무리' : '불펜';

  // ----------------------------------------------------
  // 혹사 지수(Overwork Score, 0~100) 종합 산출
  // ----------------------------------------------------
  
  // 1. 연투 및 무휴식 결핍 페널티 (최대 35점)
  // - 2연투 1회당 7점, 3연투 1회당 18점
  // - 현재 연투 중(currentConsecutiveDays >= 2)이면 추가 가산
  let restPenaltyScore = (twoDaysInRow * 7) + (threeDaysInRow * 15);
  if (currentConsecutiveDays === 2) restPenaltyScore += 8;
  if (currentConsecutiveDays >= 3) restPenaltyScore += 18;
  restPenaltyScore = Math.min(35, restPenaltyScore);

  // 2. 단기 집중 부하 점수 (최대 35점)
  // - 최근 3일 투구 수: 35구(10점), 50구(20점), 65구(30점)
  // - 최근 7일 투구 수: 70구(10점), 90구(20점), 110구(30점)
  // - 최근 7일 등판 수: 4경기 이상(10점)
  let shortTermStrainScore = 0;
  if (primaryRole !== 'SP') {
    // 불펜 기준
    if (recent3DaysPitches >= 65) shortTermStrainScore += 25;
    else if (recent3DaysPitches >= 50) shortTermStrainScore += 18;
    else if (recent3DaysPitches >= 35) shortTermStrainScore += 10;

    if (recent7DaysPitches >= 100) shortTermStrainScore += 15;
    else if (recent7DaysPitches >= 80) shortTermStrainScore += 10;
    else if (recent7DaysPitches >= 60) shortTermStrainScore += 5;

    if (recent7DaysGames >= 4) shortTermStrainScore += 8;
  } else {
    // 선발 기준 (최근 7일 110구 초과 또는 짧은 간격 등판)
    if (recent7DaysGames >= 2) shortTermStrainScore += 15;
    if (recent7DaysPitches >= 120) shortTermStrainScore += 20;
    else if (recent7DaysPitches >= 105) shortTermStrainScore += 12;
  }
  shortTermStrainScore = Math.min(35, shortTermStrainScore);

  // 3. 멀티이닝 과부하 점수 (최대 15점)
  // - 불펜이 4아웃 이상 던진 횟수당 4점
  let multiInningScore = Math.min(15, multiInningReliefCount * 4);

  // 4. 단일 경기 한계 투구수(PAP) 및 장기 누적 과부하 점수 (최대 15점)
  let papScore = 0;
  for (const app of enrichedAppearances) {
    if (app.pitches > 110) papScore += 6;
    else if (app.pitches > 100) papScore += 3;
  }
  // 시즌 평균 경기당 투구수 가중치
  const avgP = totalPitches / (enrichedAppearances.length || 1);
  if (primaryRole !== 'SP' && avgP > 25) papScore += 5;
  papScore = Math.min(15, papScore);

  // 종합 점수 계산
  const rawTotalScore = restPenaltyScore + shortTermStrainScore + multiInningScore + papScore;
  const overworkScore = Math.min(100, Math.max(0, Math.round(rawTotalScore)));
  const { status, label: statusLabel } = getRiskStatus(overworkScore);

  const breakdown: OverworkBreakdown = {
    restPenaltyScore,
    shortTermStrainScore,
    multiInningScore,
    papScore,
  };

  const totalGames = enrichedAppearances.length;
  const avgPitchesPerGame = totalGames > 0 ? Math.round((totalPitches / totalGames) * 10) / 10 : 0;
  const pitchesPerInning = totalOuts > 0 ? Math.round((totalPitches / (totalOuts / 3)) * 10) / 10 : 0;

  return {
    pcode,
    name: pitcherName,
    team: teamCode,
    teamName,
    primaryRole,
    roleLabel,
    games: totalGames,
    starts,
    reliefs,
    totalOuts,
    inningsStr: formatOutsToInning(totalOuts),
    inningsDecimal: outsToDecimal(totalOuts),
    totalPitches,
    avgPitchesPerGame,
    pitchesPerInning,
    maxConsecutiveDays: maxConsecutive,
    currentConsecutiveDays,
    twoDaysInRow,
    threeDaysInRow,
    recent3DaysPitches,
    recent7DaysPitches,
    recent7DaysGames,
    multiInningReliefCount,
    currentRestDays,
    era: latestEntry.raw.era || '0.00',
    w: wins,
    l: losses,
    s: saves,
    hld: holds,
    overworkScore,
    status,
    statusLabel,
    breakdown,
    appearances: enrichedAppearances.reverse(), // 최신순
  };
}

/**
 * 여러 투수들의 등판 데이터를 집계하여 전체 구단 및 선수별 혹사 데이터셋을 생성합니다.
 */
export function buildOverworkDataset(
  appearancesByPitcher: Map<string, {
    gameId: string;
    date: string;
    team: string;
    opponent: string;
    isHome: boolean;
    order: number;
    raw: PitcherBoxEntry;
  }[]>,
  asOfDate?: string
): {
  pitchers: PitcherOverworkData[];
  teams: Record<string, TeamOverworkSummary>;
} {
  const pitchers: PitcherOverworkData[] = [];
  const teams: Record<string, TeamOverworkSummary> = {};

  for (const [pcode, list] of appearancesByPitcher.entries()) {
    const summary = processPitcherHistory(pcode, list, asOfDate);
    if (summary) {
      pitchers.push(summary);

      // 팀별 집계
      const tCode = summary.team;
      if (!teams[tCode]) {
        teams[tCode] = {
          teamCode: tCode,
          teamName: summary.teamName,
          totalPitchers: 0,
          bullpenTotalPitches: 0,
          bullpenTotalOuts: 0,
          bullpenInningsStr: '0',
          avgOverworkScore: 0,
          highRiskCount: 0,
          threeConsecutiveCount: 0,
        };
      }

      const t = teams[tCode];
      t.totalPitchers++;
      if (summary.primaryRole !== 'SP') {
        t.bullpenTotalPitches += summary.totalPitches;
        t.bullpenTotalOuts += summary.totalOuts;
      }
      t.threeConsecutiveCount += summary.threeDaysInRow;
      if (summary.status === 'WARNING' || summary.status === 'DANGER' || summary.status === 'EXTREME') {
        t.highRiskCount++;
      }
    }
  }

  // 팀 평균 혹사 점수 및 불펜 이닝 계산
  for (const tCode of Object.keys(teams)) {
    const t = teams[tCode];
    const teamPitchers = pitchers.filter((p) => p.team === tCode);
    const scoreSum = teamPitchers.reduce((acc, p) => acc + p.overworkScore, 0);
    t.avgOverworkScore = teamPitchers.length > 0 ? Math.round((scoreSum / teamPitchers.length) * 10) / 10 : 0;
    t.bullpenInningsStr = formatOutsToInning(t.bullpenTotalOuts);
  }

  // 혹사 지수 내림차순 정렬
  pitchers.sort((a, b) => b.overworkScore - a.overworkScore);

  return { pitchers, teams };
}
