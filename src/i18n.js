'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// i18n: 로케일 파일 로딩 + 현재 로케일 전환. locales/ 폴더에 파일을 추가하면 자동 지원.
// 주의: 중계 본문(문자중계 텍스트)은 네이버가 한국어로만 제공 → en 은 UI 문구만 번역.
// ─────────────────────────────────────────────────────────────────────────────
const locales = {
  'ko-KR': require('../locales/ko'),
  'en-US': require('../locales/en'),
};
const DEFAULT = 'ko-KR';

const i18n = { hl: DEFAULT, t: locales[DEFAULT] };

// hl 매칭: 정확 매칭 → 접두 매칭(예: 'en' → 'en-US') → 기본값
function resolve(hl) {
  if (!hl) return DEFAULT;
  if (locales[hl]) return hl;
  const pref = String(hl).slice(0, 2).toLowerCase();
  const hit = Object.keys(locales).find((k) => k.slice(0, 2).toLowerCase() === pref);
  return hit || DEFAULT;
}
function setLocale(hl) {
  i18n.hl = resolve(hl);
  i18n.t = locales[i18n.hl];
  return i18n.hl;
}
function available() { return Object.keys(locales); }

module.exports = { i18n, setLocale, available };
