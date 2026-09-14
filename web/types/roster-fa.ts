export type LineupRole = 'STARTER' | 'SUBSTITUTE' | 'BENCH';
export type TransactionStatus = 'IN' | 'OUT' | 'STABLE';
export type FaStatus = 'QUALIFIED' | 'IN_PROGRESS' | 'SHORTFALL';

export interface PlayerRosterItem {
  id: string; // pcode
  name: string;
  teamCode: string;
  teamName: string;
  backnum?: string;
  position: string; // '투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수', '지명타자'
  posCategory: 'PITCHER' | 'CATCHER' | 'INFIELDER' | 'OUTFIELDER' | 'DH';
  hitType?: string; // '우투우타', '우투좌타', etc.
  birth?: string;
  
  // Game Day Specific Status
  role: LineupRole;
  roleDetail: string; // e.g., '1번타자 (선발 1루수)', '선발투수', '7회 대타교체', '불펜대기', '벤치후보'
  batOrder?: number; // 1~9 if starter/played in batting lineup
  seqno?: number;
  cin?: boolean;
  cout?: boolean;
  
  // Transaction (등록/말소)
  transaction: TransactionStatus;
  transactionNote?: string; // e.g. '1군 신규등록', '1군 말소 (10일 후 재등록 가능)', '엔트리 유지'
  deregisterDate?: string;
  reEligibleDate?: string; // deregisterDate + 10 days
  
  // 1st Team Service Time & Appearance
  daysActive1stTeam: number; // 당해 1군 등록일수
  gamesPlayed: number; // 출장 경기수
  gamesStarted: number; // 선발 출장 수
  gamesSubbed: number; // 교체 출장 수
  daysOnBench: number; // 벤치 대기 일수
  
  // FA Calculation (KBO 규약 145일 기준)
  faThreshold: number; // 145
  faEligible: boolean; // daysActive1stTeam >= 145
  faProgressPercent: number; // min(100, Math.round((daysActive1stTeam / 145) * 100))
  daysNeededForFa: number; // max(0, 145 - daysActive1stTeam)
  faStatus: FaStatus;
  
  // Career / Multi-season FA estimate
  educationType?: 'HIGH_SCHOOL' | 'COLLEGE'; // 고졸(8~9시즌) vs 대졸(7~8시즌)
  accumulatedFaSeasons?: number; // 누적 FA 충족 시즌 수
  faGradeEstimate?: 'A' | 'B' | 'C'; // FA 등급제 추정
  
  // Game Performance stats on the day (if played)
  todayStats?: {
    ab?: number;
    hit?: number;
    hr?: number;
    rbi?: number;
    run?: number;
    bb?: number;
    so?: number;
    inn?: string;
    er?: number;
    np?: number;
  };
}

export interface TeamRosterSummary {
  teamCode: string;
  teamName: string;
  teamColor: string;
  teamEmblemUrl?: string;
  totalActiveRoster: number; // typically 28
  startersCount: number;
  subsCount: number;
  benchCount: number;
  registeredTodayCount: number; // IN
  deregisteredTodayCount: number; // OUT
  faQualifiedCount: number;
  faInProgressCount: number;
}

export interface DayRosterResponse {
  success: boolean;
  date: string;
  comparisonDate?: string;
  gamesCount: number;
  teams: TeamRosterSummary[];
  players: PlayerRosterItem[];
  transactions: {
    registered: PlayerRosterItem[];
    deregistered: PlayerRosterItem[];
  };
  summary: {
    totalPlayers: number;
    totalStarters: number;
    totalSubs: number;
    totalBench: number;
    totalFaQualified: number;
  };
  error?: string;
}
