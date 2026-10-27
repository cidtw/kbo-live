import { PTSPitch, TrajectoryPoint } from './types/baseball';

export function calculateFlightAndTrajectory(rawPts: {
  pitchId: string;
  inn: number;
  ballcount: number;
  crossPlateX: number;
  crossPlateY: number;
  topSz: number;
  bottomSz: number;
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
}): PTSPitch {
  const {
    pitchId,
    inn,
    ballcount,
    crossPlateX,
    crossPlateY,
    topSz,
    bottomSz,
    x0,
    y0,
    z0,
    vx0,
    vy0,
    vz0,
    ax,
    ay,
    az,
    stance,
  } = rawPts;

  // Solve for flight time tf when y(t) reaches home plate front (1.417 ft):
  // 0.5 * ay * t^2 + vy0 * t + (y0 - 1.417) = 0
  const yTarget = 1.417;
  const A = 0.5 * ay;
  const B = vy0;
  const C = y0 - yTarget;

  let flightTime = 0.4; // default fallback ~0.4s
  const discriminant = B * B - 4 * A * C;
  if (discriminant >= 0) {
    const t1 = (-B - Math.sqrt(discriminant)) / (2 * A);
    const t2 = (-B + Math.sqrt(discriminant)) / (2 * A);
    const positiveRoots = [t1, t2].filter((t) => t > 0.2 && t < 0.8);
    if (positiveRoots.length > 0) {
      flightTime = Math.min(...positiveRoots);
    }
  }

  // Trajectory samples
  const steps = 30;
  const trajectoryPoints: TrajectoryPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (flightTime * i) / steps;
    const x = x0 + vx0 * t + 0.5 * ax * t * t;
    const y = y0 + vy0 * t + 0.5 * ay * t * t;
    const z = z0 + vz0 * t + 0.5 * az * t * t;
    trajectoryPoints.push({ x, y, z, t });
  }

  // Movement in inches
  // Horizontal movement (HB): deflection due to Magnus force
  const breakHorizontal = 0.5 * ax * flightTime * flightTime * 12;
  // Induced Vertical Break (IVB): movement relative to gravity-only trajectory
  const g = 32.174; // gravity ft/s^2
  const breakVertical = 0.5 * (az + g) * flightTime * flightTime * 12;

  // Actual X and Z (vertical height) at the plate from 9-parameter kinematic equation
  const calculatedPlateZ = z0 + vz0 * flightTime + 0.5 * az * flightTime * flightTime;
  const calculatedPlateX = x0 + vx0 * flightTime + 0.5 * ax * flightTime * flightTime;

  // If raw crossPlateY is 0.7083 (placeholder half-width constant in raw PTS), use computed height plateZ
  const finalPlateY =
    Math.abs(crossPlateY - 0.7083) < 0.05 ? calculatedPlateZ : crossPlateY || calculatedPlateZ;
  const finalPlateX = crossPlateX !== undefined ? crossPlateX : calculatedPlateX;

  return {
    pitchId,
    inn,
    ballcount,
    crossPlateX: Math.round(finalPlateX * 1000) / 1000,
    crossPlateY: Math.round(finalPlateY * 1000) / 1000,
    topSz,
    bottomSz,
    x0,
    y0,
    z0,
    vx0,
    vy0,
    vz0,
    ax,
    ay,
    az,
    stance,
    trajectoryPoints,
    flightTime,
    breakHorizontal: Math.round(breakHorizontal * 10) / 10,
    breakVertical: Math.round(breakVertical * 10) / 10,
  };
}

export function isPitchInStrikeZone(
  crossPlateX: number,
  crossPlateY: number,
  topSz: number,
  bottomSz: number
): boolean {
  const plateHalfWidth = 0.7083 + 0.12; // 17 inch plate + ball radius allowance
  const isHorizontalIn = Math.abs(crossPlateX) <= plateHalfWidth;
  const isVerticalIn = crossPlateY >= bottomSz - 0.12 && crossPlateY <= topSz + 0.12;
  return isHorizontalIn && isVerticalIn;
}

export const PITCH_COLORS: Record<string, string> = {
  직구: '#EF4444', // Red (Fastball)
  포심: '#EF4444',
  투심: '#F97316', // Orange
  싱커: '#F97316',
  커터: '#06B6D4', // Cyan
  슬라이더: '#3B82F6', // Blue
  스위퍼: '#2563EB', // Royal Blue
  커브: '#F59E0B', // Amber
  너클커브: '#D97706',
  체인지업: '#10B981', // Emerald
  포크: '#8B5CF6', // Purple
  스플리터: '#8B5CF6',
  기타: '#6B7280', // Gray
};

export function getPitchColor(stuff: string): string {
  for (const [key, color] of Object.entries(PITCH_COLORS)) {
    if (stuff.includes(key)) return color;
  }
  return PITCH_COLORS['기타'];
}

export const RESULT_MAP: Record<string, { label: string; isStrike: boolean; isWhiff: boolean }> = {
  S: { label: '헛스윙', isStrike: true, isWhiff: true },
  T: { label: '루킹 스트라이크', isStrike: true, isWhiff: false },
  B: { label: '볼', isStrike: false, isWhiff: false },
  F: { label: '파울', isStrike: true, isWhiff: false },
  H: { label: '인플레이 타격', isStrike: true, isWhiff: false },
};
