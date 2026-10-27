export interface GameSummary {
  gameId: string;
  gameDate: string;
  gameDateTime: string;
  homeTeamCode: string;
  homeTeamName: string;
  homeTeamScore: number;
  awayTeamCode: string;
  awayTeamName: string;
  awayTeamScore: number;
  statusCode: string; // 'BEFORE' | 'LIVE' | 'RESULT' | 'CANCEL'
  statusInfo: string;
  homeTeamEmblemUrl?: string;
  awayTeamEmblemUrl?: string;
}

export interface TrajectoryPoint {
  x: number; // side offset in ft (plate center = 0)
  y: number; // distance from plate in ft (mound = ~50, plate = 1.417)
  z: number; // height in ft
  t: number; // time in seconds from release
}

export interface PTSPitch {
  pitchId: string;
  inn: number;
  ballcount: number;
  crossPlateX: number; // ft at plate
  crossPlateY: number; // ft height at plate
  topSz: number; // ft
  bottomSz: number; // ft
  x0: number;
  y0: number;
  z0: number;
  vx0: number;
  vy0: number;
  vz0: number;
  ax: number;
  ay: number;
  az: number;
  stance: 'R' | 'L';
  trajectoryPoints: TrajectoryPoint[];
  flightTime: number; // seconds
  breakHorizontal: number; // inches
  breakVertical: number; // inches (IVB)
}

export type PitchResultType = 'S' | 'T' | 'B' | 'F' | 'H';

export interface PitchEvent {
  pitchNum: number;
  pitchResult: PitchResultType;
  resultKorean: string; // '헛스윙' | '루킹 스트라이크' | '볼' | '파울' | '타격'
  speed: number; // km/h
  stuff: string; // '직구' | '슬라이더' | '체인지업' | '투심' | '포크' | '커브' | '커터' 등
  pts?: PTSPitch;
  strike: number;
  ball: number;
  out: number;
  base1: boolean;
  base2: boolean;
  base3: boolean;
  batterName: string;
  batterCode: string;
  paSeq: number;
}

export interface PlateAppearance {
  paId: string;
  inning: number;
  isBottom: boolean;
  batterId: string;
  batterName: string;
  batterStance: 'R' | 'L';
  pitcherId: string;
  pitcherName: string;
  resultText: string;
  pitches: PitchEvent[];
}

export interface PitchArsenalStats {
  stuff: string;
  count: number;
  usagePercent: number;
  avgSpeed: number;
  maxSpeed: number;
  minSpeed: number;
  strikes: number;
  balls: number;
  whiffCount: number;
  whiffRate: number; // S / (S + F + H) * 100
  zoneCount: number;
  zoneRate: number; // pitches inside strike zone * 100
}

export interface PitcherOuting {
  pitcherId: string;
  pitcherName: string;
  teamCode: string;
  teamName: string;
  isStarter: boolean;
  appearanceOrder: number;
  decision?: 'W' | 'L' | 'HOLD' | 'SAVE' | null;
  boxscore: {
    inn: string;
    bf: number; // total pitches
    hit: number;
    r: number;
    er: number;
    bb: number;
    kk: number;
    hr: number;
    w: number;
    l: number;
    hold: number;
    s: number;
    era: string;
    strikes: number;
    balls: number;
    strikePercent: number;
  };
  arsenal: PitchArsenalStats[];
  plateAppearances: PlateAppearance[];
  allPitches: PitchEvent[];
}

export interface GameDetailData {
  game: GameSummary;
  homePitchers: PitcherOuting[];
  awayPitchers: PitcherOuting[];
}
