export const TEAM_MAP: Record<string, string> = {
  'LT': 'LOT',
  'NC': 'NCD',
  'HH': 'HE',
  'HT': 'KIA',
  'LG': 'LG',
  'SS': 'SL',
  'SK': 'SSG',
  'OB': 'DB',
  'WO': 'KH',
  'KT': 'KT'
};

export const REVERSE_TEAM_MAP: Record<string, string> = {
  'LOT': 'LT',
  'NCD': 'NC',
  'HE': 'HH',
  'KIA': 'HT',
  'LG': 'LG',
  'SL': 'SS',
  'SSG': 'SK',
  'DB': 'OB',
  'KH': 'WO',
  'KT': 'KT'
};

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

export function mapTeamCode(code: string): string {
  if (!code) return '';
  const upper = code.toUpperCase();
  return TEAM_MAP[upper] || upper;
}

export function kstDateStr(d?: Date): string {
  const base = d || new Date();
  const kst = new Date(base.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function parseDateArg(s: string): string | null {
  if (!s) return null;
  const t = String(s).trim();
  let m = t.match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/^(\d{1,2})[\/.](\d{1,2})$/) || t.match(/^(\d{2})(\d{2})$/);
  if (m) {
    const y = kstDateStr().slice(0, 4);
    return `${y}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
  }
  return null;
}

export function addDays(dateStr: string, days: number): string {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return dateStr;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const PITCH_MAP: Record<string, string> = {
  '직구': 'FF',
  '투심': 'FT',
  '커터': 'FC',
  '싱커': 'SI',
  '슬라이더': 'SL',
  '스위퍼': 'ST',
  '커브': 'CU',
  '슬로커브': 'SC',
  '체인지업': 'CH',
  '포크': 'FO',
  '너클볼': 'KN',
};

export const translateStuff = (stuff: string | null): string => {
  if (!stuff) return '??';
  if (PITCH_MAP[stuff]) return PITCH_MAP[stuff];
  const s = String(stuff);
  if (s.includes('직구') || s.includes('속구') || s.includes('패스트')) return 'FF';
  if (s.includes('슬라이더')) return 'SL';
  if (s.includes('체인지업')) return 'CH';
  if (s.includes('커브')) return 'CU';
  if (s.includes('투심')) return 'FT';
  if (s.includes('커터')) return 'FC';
  if (s.includes('포크') || s.includes('스플')) return 'SF';
  if (s.includes('싱커')) return 'SI';
  if (s.includes('스위퍼')) return 'SW';
  if (s.includes('너클')) return 'KN';
  return s.slice(0, 2);
};
