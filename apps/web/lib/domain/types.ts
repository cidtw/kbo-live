// KBO 투수 등판 기록 및 혹사 지수(Overwork Score) 데이터 모델

export interface PitcherBoxEntry {
  name: string;
  pcode: string;
  inn: string;            // "5", "1 ⅔", "⅔", "0"
  bf: number;             // 투구 수
  ab?: number;            // 타수
  pa?: number;            // 타석
  hit?: number;           // 피안타
  hr?: number;            // 피홈런
  bb?: number;            // 4사구 (볼넷)
  bbhp?: number;          // 사구 포함
  kk?: number;            // 탈삼진
  r?: number;             // 실점
  er?: number;            // 자책점
  era?: string;           // 시즌 평균자책
  wls?: string;           // "승", "패", "홀", "세", ""
  tb?: 'T' | 'B';         // T: 원정, B: 홈
  gameCount?: number;     // 시즌 등판 경기수
  w?: number;
  l?: number;
  s?: number;
}

export type PitcherRole = 'SP' | 'RP' | 'CL'; // 선발(Starting), 불펜(Relief), 마무리(Closer)

export interface PitcherAppearance {
  gameId: string;
  date: string;           // YYYY-MM-DD
  team: string;           // 팀 코드 (예: KIA, LOT)
  opponent: string;       // 상대팀 코드
  isHome: boolean;
  order: number;          // 등판 순서 (1 = 선발, 2+ = 불펜)
  role: 'starter' | 'relief';
  innStr: string;         // "5", "1 ⅔" 등
  outs: number;           // 소화 아웃카운트 (5이닝 = 15)
  innings: number;        // 소수점 이닝 (1 ⅔ = 1.67)
  pitches: number;        // 투구수 (bf)
  hits: number;
  runs: number;
  er: number;
  bb: number;
  kk: number;
  wls: string;
  restDays: number;       // 직전 등판 이후 휴식 일수 (0 = 2연투, -1 = 더블헤더 등)
  consecutiveDays: number;// 연속 등판 일수 (1, 2, 3...)
  isMultiInning: boolean; // 구원 등판 시 4아웃(1⅓이닝) 이상 소화 여부
  gameStrain: number;     // 해당 경기 부하 가중치 점수
}

export type OverworkRiskStatus = 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'EXTREME';

export interface OverworkBreakdown {
  restPenaltyScore: number;    // 연투 및 휴식 결핍 페널티 (0~35)
  shortTermStrainScore: number;// 최근 3일/7일 집중 부하 점수 (0~35)
  multiInningScore: number;    // 구원 투수 멀티이닝 가중 점수 (0~15)
  papScore: number;            // 한 경기 100구 초과 PAP 및 누적 점수 (0~15)
}

export interface PitcherOverworkData {
  pcode: string;
  name: string;
  team: string;                // KIA, LG, LOT 등
  teamName: string;            // KIA 타이거즈, LG 트윈스 등
  primaryRole: PitcherRole;    // 주 보직
  roleLabel: string;           // '선발' | '불펜' | '마무리'
  
  // 기본 집계
  games: number;               // 총 등판수
  starts: number;              // 선발 등판수
  reliefs: number;             // 구원 등판수
  totalOuts: number;           // 총 아웃카운트
  inningsStr: string;          // "45 ⅔" 등
  inningsDecimal: number;      // 45.67
  totalPitches: number;        // 총 투구수
  avgPitchesPerGame: number;   // 경기당 평균 투구수
  pitchesPerInning: number;    // 이닝당 투구수

  // 연투 및 부하 지표
  maxConsecutiveDays: number;  // 기간 내 최다 연속 등판 일수
  currentConsecutiveDays: number; // 현재 연속 등판 일수
  twoDaysInRow: number;        // 2연투 횟수
  threeDaysInRow: number;      // 3연투 이상 횟수
  recent3DaysPitches: number;  // 최근 3일간 누적 투구수
  recent7DaysPitches: number;  // 최근 7일간 누적 투구수
  recent7DaysGames: number;    // 최근 7일간 등판 경기수
  multiInningReliefCount: number; // 구원 등판 시 1이닝 초과 경기수
  currentRestDays: number;     // 마지막 등판 이후 경과일수
  
  // 전통 성적
  era: string;
  w: number;
  l: number;
  s: number;
  hld: number;
  
  // 혹사 지수 산출 결과
  overworkScore: number;       // 0 ~ 100
  status: OverworkRiskStatus;  // 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'EXTREME'
  statusLabel: string;         // '정상' | '주의' | '경고' | '위험' | '혹사'
  breakdown: OverworkBreakdown;
  
  // 상세 시계열 등판 이력 (최신순)
  appearances: PitcherAppearance[];
}

export interface TeamOverworkSummary {
  teamCode: string;
  teamName: string;
  totalPitchers: number;
  bullpenTotalPitches: number;
  bullpenTotalOuts: number;
  bullpenInningsStr: string;
  avgOverworkScore: number;
  highRiskCount: number;       // WARNING, DANGER, EXTREME에 해당하는 선수 수
  threeConsecutiveCount: number; // 3연투 발생 건수
}

export interface OverworkDatasetResponse {
  dateRange: {
    from: string;
    to: string;
    totalDays: number;
  };
  totalGames: number;
  summary: {
    totalPitchers: number;
    extremeCount: number;
    dangerCount: number;
    warningCount: number;
    cautionCount: number;
    safeCount: number;
    highestStrainTeam: string;
    topFatiguePitchers: PitcherOverworkData[];
  };
  teams: Record<string, TeamOverworkSummary>;
  pitchers: PitcherOverworkData[];
}
