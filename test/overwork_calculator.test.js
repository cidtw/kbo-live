'use strict';

const test = require('node:test');
const assert = require('node:assert');

// overworkCalculator 로직 테스트용 순수 함수 (Domain 알고리즘 정합성 검증)
function parseInningToOuts(innStr) {
  if (!innStr) return 0;
  const s = String(innStr).trim();
  if (!s || s === '0') return 0;
  if (/^\d+$/.test(s)) return parseInt(s, 10) * 3;

  let fullInnings = 0;
  let partialFraction = s;
  const parts = s.split(/\s+/);
  if (parts.length === 2) {
    fullInnings = parseInt(parts[0], 10) || 0;
    partialFraction = parts[1];
  }

  let partialOuts = 0;
  if (partialFraction === '⅔' || partialFraction === '2/3') partialOuts = 2;
  else if (partialFraction === '⅓' || partialFraction === '1/3') partialOuts = 1;

  return fullInnings * 3 + partialOuts;
}

function formatOutsToInning(outs) {
  if (!outs || outs <= 0) return '0';
  const full = Math.floor(outs / 3);
  const rem = outs % 3;
  const frac = rem === 2 ? '⅔' : rem === 1 ? '⅓' : '';
  if (full === 0) return frac || '0';
  return frac ? `${full} ${frac}` : `${full}`;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1 + 'T00:00:00Z');
  const d2 = new Date(date2 + 'T00:00:00Z');
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateGameStrain(pitches, outs, isRelief, consecutiveDays, restDays) {
  if (pitches <= 0) return 0;
  if (isRelief) {
    let restMultiplier = 1.0;
    if (consecutiveDays >= 4) restMultiplier = 3.0;
    else if (consecutiveDays === 3) restMultiplier = 2.0;
    else if (consecutiveDays === 2) restMultiplier = 1.4;
    else if (restDays === 1) restMultiplier = 1.0;
    else if (restDays >= 2) restMultiplier = 0.8;

    let multiInningMultiplier = 1.0;
    if (outs > 3) multiInningMultiplier = 1.0 + (outs - 3) * 0.15;
    return pitches * restMultiplier * multiInningMultiplier;
  } else {
    let papBonus = 0;
    if (pitches > 100) papBonus = (pitches - 100) * 2;
    return pitches + papBonus;
  }
}

function getRiskStatus(score) {
  if (score >= 85) return { status: 'EXTREME', label: '혹사' };
  if (score >= 70) return { status: 'DANGER', label: '위험' };
  if (score >= 50) return { status: 'WARNING', label: '경고' };
  if (score >= 30) return { status: 'CAUTION', label: '주의' };
  return { status: 'SAFE', label: '정상' };
}

test('parseInningToOuts: accurately converts fractional inning strings to outs', () => {
  assert.strictEqual(parseInningToOuts('5'), 15);
  assert.strictEqual(parseInningToOuts('1 ⅔'), 5);
  assert.strictEqual(parseInningToOuts('1 2/3'), 5);
  assert.strictEqual(parseInningToOuts('⅔'), 2);
  assert.strictEqual(parseInningToOuts('⅓'), 1);
  assert.strictEqual(parseInningToOuts('0'), 0);
  assert.strictEqual(parseInningToOuts(''), 0);
  assert.strictEqual(parseInningToOuts(null), 0);
});

test('formatOutsToInning: formats out counts back to standard baseball notation', () => {
  assert.strictEqual(formatOutsToInning(15), '5');
  assert.strictEqual(formatOutsToInning(5), '1 ⅔');
  assert.strictEqual(formatOutsToInning(2), '⅔');
  assert.strictEqual(formatOutsToInning(1), '⅓');
  assert.strictEqual(formatOutsToInning(0), '0');
});

test('daysBetween: correctly calculates day differences', () => {
  assert.strictEqual(daysBetween('2024-06-10', '2024-06-11'), 1);
  assert.strictEqual(daysBetween('2024-06-10', '2024-06-13'), 3);
  assert.strictEqual(daysBetween('2024-06-10', '2024-06-10'), 0);
});

test('calculateGameStrain: applies fatigue multipliers for consecutive days and multi-innings', () => {
  // 1일 휴식 후 1이닝 15구 (기준)
  const normal = calculateGameStrain(15, 3, true, 1, 1);
  assert.strictEqual(normal, 15);

  // 2연투 시 1.4배
  const backToBack = calculateGameStrain(15, 3, true, 2, 0);
  assert.strictEqual(backToBack, 21);

  // 3연투 시 2.0배
  const threeDays = calculateGameStrain(15, 3, true, 3, 0);
  assert.strictEqual(threeDays, 30);

  // 2이닝(6아웃) 멀티이닝 구원 등판 (1 + 3 * 0.15 = 1.45배)
  const multiInning = calculateGameStrain(30, 6, true, 1, 2);
  // 30 * 0.8 * 1.45 = 34.8
  assert.strictEqual(Math.round(multiInning * 10) / 10, 34.8);

  // 선발 110구 등판 시 100구 초과분 2배 가산
  const starterOver = calculateGameStrain(110, 21, false, 1, 5);
  assert.strictEqual(starterOver, 130);
});

test('getRiskStatus: categorizes score thresholds correctly', () => {
  assert.strictEqual(getRiskStatus(20).status, 'SAFE');
  assert.strictEqual(getRiskStatus(35).status, 'CAUTION');
  assert.strictEqual(getRiskStatus(55).status, 'WARNING');
  assert.strictEqual(getRiskStatus(75).status, 'DANGER');
  assert.strictEqual(getRiskStatus(90).status, 'EXTREME');
});
