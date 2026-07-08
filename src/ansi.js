'use strict';

const { dw, isWide } = require('./util');

// ─────────────────────────────────────────────────────────────────────────────
// ANSI 색상 + 색상 포함 문자열 폭 유틸 (lol-live 공용 코어 이식)
// ─────────────────────────────────────────────────────────────────────────────
const useColor = process.stdout.isTTY;

const C = new Proxy({
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  white: '\x1b[37m', gray: '\x1b[90m',
  bcyan: '\x1b[96m', bred: '\x1b[91m', byellow: '\x1b[93m', bgreen: '\x1b[92m',
}, { get: (t, p) => (useColor ? (t[p] || '') : '') });

function bg(n) { return useColor ? `\x1b[48;5;${n}m` : ''; }
function fg256(n) { return useColor ? `\x1b[38;5;${n}m` : ''; }

// 원정(away)/홈(home) 대표색. KBO 팀색은 다양하므로 중립적 주황/청록 계열.
const TEAM = { away: 209, home: 79 };
// B/S/O 카운트 램프 색
const CNT = { ball: 40, strike: 220, out: 196 };

// ── 색상 포함 문자열 표시폭(ANSI 제외) ──
function visLen(s) { return dw(s.replace(/\x1b\[[0-9;]*m/g, '')); }
function padEndWColor(s, width) { const p = width - visLen(s); return p > 0 ? s + ' '.repeat(p) : s; }
function padStartWColor(s, width) { const p = width - visLen(s); return p > 0 ? ' '.repeat(p) + s : s; }
// 코드포인트 단위로 자름(서로게이트 쌍 분리 방지). ANSI 시퀀스는 폭 0으로 통과.
function truncColor(s, width) {
  let out = '', w = 0, i = 0;
  const str = String(s);
  while (i < str.length) {
    if (str[i] === '\x1b') { const e = str.indexOf('m', i); if (e < 0) break; out += str.slice(i, e + 1); i = e + 1; continue; }
    const cp = str.codePointAt(i);
    const ch = String.fromCodePoint(cp);
    const cw = (cp === 0xfe0f || cp === 0x200d) ? 0 : (isWide(cp) ? 2 : 1);
    if (w + cw > width) break;
    out += ch; w += cw; i += ch.length;
  }
  return out;
}
function center(s, width) {
  const w = visLen(s); if (w >= width) return s;
  const l = Math.floor((width - w) / 2);
  return ' '.repeat(l) + s + ' '.repeat(width - w - l);
}
function justify(left, mid, right, width) {
  const mw = visLen(mid), lw = visLen(left), rw = visLen(right);
  const side = Math.max(1, Math.floor((width - mw) / 2) - Math.max(lw, rw));
  const s = left + ' '.repeat(Math.max(1, side)) + mid + ' '.repeat(Math.max(1, side)) + right;
  return center(s, width);
}

module.exports = {
  useColor, C, bg, fg256, TEAM, CNT,
  visLen, padEndWColor, padStartWColor, truncColor, center, justify,
};
