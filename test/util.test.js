'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { clampNum, parseDateArg, dw, truncW } = require('../src/util');
const { truncColor } = require('../src/ansi');

test('clampNum: NaN·범위 밖 입력 방어 (핫루프 폴링 방지)', () => {
  assert.strictEqual(clampNum('abc', 5, 300, 10), 10);
  assert.strictEqual(clampNum(0, 5, 300, 10), 5);
  assert.strictEqual(clampNum(-3, 5, 300, 10), 5);
  assert.strictEqual(clampNum(9999, 5, 300, 10), 300);
  assert.strictEqual(clampNum('15', 5, 300, 10), 15);
  assert.strictEqual(clampNum(Infinity, 5, 300, 10), 10);
});

test('parseDateArg: 다양한 날짜 표기 정규화', () => {
  assert.strictEqual(parseDateArg('2026-07-08'), '2026-07-08');
  assert.strictEqual(parseDateArg('20260708'), '2026-07-08');
  const y = new Date().getFullYear(); // KST 경계일 오차 허용: 연도만 검사
  assert.match(parseDateArg('0708'), new RegExp(`^\\d{4}-07-08$`));
  assert.match(parseDateArg('7/8'), /^\d{4}-07-08$/);
  assert.strictEqual(parseDateArg('nonsense'), null);
});

test('dw: 한글 2칸, ASCII 1칸', () => {
  assert.strictEqual(dw('롯데'), 4);
  assert.strictEqual(dw('LT'), 2);
});

test('truncW/truncColor: 폭 기준 자르기, 서로게이트 쌍 분리 없음', () => {
  assert.strictEqual(truncW('롯데자이언츠', 6), '롯데자');
  const s = '\x1b[31m가나🚀다\x1b[0m';
  const out = truncColor(s, 6); // 가(2)나(2)🚀(2) 까지
  assert.ok(out.includes('🚀'));
  assert.ok(!out.includes('다'));
  // 잘린 결과가 유효한 UTF-16 (lone surrogate 없음)
  assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(out.replace(/\x1b\[[0-9;]*m/g, '')));
});

const { sleepOrInterrupt } = require('../src/util');

test('sleepOrInterrupt: 완주 및 switchRequested에 의한 조기 종료', async () => {
  const bc = { switchRequested: null };
  const start = Date.now();
  const res = await sleepOrInterrupt(300, bc);
  const elapsed = Date.now() - start;
  assert.strictEqual(res, false);
  assert.ok(elapsed >= 250, `elapsed was ${elapsed}`);

  // 조기 종료 테스트
  const start2 = Date.now();
  setTimeout(() => { bc.switchRequested = { gameId: 'someGame' }; }, 50);
  const res2 = await sleepOrInterrupt(1000, bc);
  const elapsed2 = Date.now() - start2;
  assert.strictEqual(res2, true);
  assert.ok(elapsed2 < 200, `elapsed2 was ${elapsed2}`);
});
