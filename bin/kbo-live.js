#!/usr/bin/env node
'use strict';

/**
 * kbo-live — KBO 리그 실시간 문자중계 CLI (진입점)
 *
 * 비공식 네이버 스포츠 데이터 사용. Node.js 내장 모듈만 (의존성 0).
 * 구조: src/ (모듈), locales/ (다국어). 사용법은 --help 참고.
 */
const { main } = require('../src/cli');
const { C } = require('../src/ansi');
const { i18n } = require('../src/i18n');

main().catch((e) => {
  const label = (i18n.t && i18n.t.errorLabel) || 'Error';
  console.error(`${C.red}${label}:${C.reset} ${e.message}`);
  process.exit(1);
});
