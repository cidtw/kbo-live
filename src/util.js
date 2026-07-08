'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// 순수 유틸: 숫자/날짜/문자 폭. 다른 모듈 의존 없음. (lol-live 공용 코어 이식)
// ─────────────────────────────────────────────────────────────────────────────

// CLI 숫자 인자 방어: NaN·범위 밖 → 기본값/경계로 클램프 (핫루프 폴링 방지)
function clampNum(v, min, max, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
}

// YYYY-MM-DD (KBO 일정 API 형식). 인자 없으면 KST 기준 오늘.
function kstDateStr(d) {
  const base = d || new Date();
  const kst = new Date(base.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}
// 사용자 입력 날짜 정규화: 2026-07-08 | 20260708 | 0708 | 7/8 → YYYY-MM-DD
function parseDateArg(s) {
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

// 한글/CJK/이모지는 터미널에서 2칸 → 정렬용 실제 표시폭 계산
function isWide(c) {
  return (
    (c >= 0x1100 && c <= 0x115f) ||   // 한글 자모
    (c >= 0x2e80 && c <= 0xa4cf) ||   // CJK 부수 ~ 한글 이전
    (c >= 0xac00 && c <= 0xd7a3) ||   // 한글 완성형
    (c >= 0xf900 && c <= 0xfaff) ||   // CJK 호환
    (c >= 0xfe30 && c <= 0xfe4f) ||
    (c >= 0xff00 && c <= 0xff60) ||   // 전각
    (c >= 0x1f300 && c <= 0x1faff) || // 이모지 대부분
    (c >= 0x2600 && c <= 0x27bf)      // 기타 기호/이모지
  );
}
function dw(str) {
  let w = 0;
  for (const ch of String(str)) {
    const c = ch.codePointAt(0);
    if (c === 0xfe0f || c === 0x200d) continue; // 변형 셀렉터·ZWJ 무시
    w += isWide(c) ? 2 : 1;
  }
  return w;
}
function padEndW(str, width) {
  const pad = width - dw(str);
  return pad > 0 ? str + ' '.repeat(pad) : str;
}
function padStartW(str, width) {
  const pad = width - dw(str);
  return pad > 0 ? ' '.repeat(pad) + str : str;
}
function truncW(str, width) {
  let out = '', w = 0;
  for (const ch of String(str)) {
    const cw = isWide(ch.codePointAt(0)) ? 2 : 1;
    if (w + cw > width) break;
    out += ch; w += cw;
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sleepOrInterrupt(ms, bc) {
  const step = 100;
  for (let i = 0; i < ms; i += step) {
    if (bc && (bc.switchRequested || bc.menuRequested)) return true;
    await sleep(Math.min(step, ms - i));
  }
  return bc && (!!bc.switchRequested || !!bc.menuRequested);
}

module.exports = {
  clampNum, kstDateStr, parseDateArg, isWide, dw, padEndW, padStartW, truncW, sleep, sleepOrInterrupt,
};
