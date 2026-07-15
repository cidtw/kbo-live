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
