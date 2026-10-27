// 실제 도메인 모듈(lib/domain/overworkCalculator.ts)을 직접 import해 검증합니다.
// (이전에는 루트 test/에 로직을 복사해 두고 복사본을 테스트했음)
import { describe, expect, it } from 'vitest';
import {
  calculateGameStrain,
  daysBetween,
  formatOutsToInning,
  getRiskStatus,
  parseInningToOuts,
} from '../lib/domain/overworkCalculator';

describe('overworkCalculator', () => {
  it('parseInningToOuts: converts fractional inning strings to outs', () => {
    expect(parseInningToOuts('5')).toBe(15);
    expect(parseInningToOuts('1 ⅔')).toBe(5);
    expect(parseInningToOuts('1 2/3')).toBe(5);
    expect(parseInningToOuts('⅔')).toBe(2);
    expect(parseInningToOuts('⅓')).toBe(1);
    expect(parseInningToOuts('0')).toBe(0);
    expect(parseInningToOuts('')).toBe(0);
    expect(parseInningToOuts(null)).toBe(0);
  });

  it('formatOutsToInning: formats out counts back to baseball notation', () => {
    expect(formatOutsToInning(15)).toBe('5');
    expect(formatOutsToInning(5)).toBe('1 ⅔');
    expect(formatOutsToInning(2)).toBe('⅔');
    expect(formatOutsToInning(1)).toBe('⅓');
    expect(formatOutsToInning(0)).toBe('0');
  });

  it('daysBetween: calculates day differences', () => {
    expect(daysBetween('2024-06-10', '2024-06-11')).toBe(1);
    expect(daysBetween('2024-06-10', '2024-06-13')).toBe(3);
    expect(daysBetween('2024-06-10', '2024-06-10')).toBe(0);
  });

  it('calculateGameStrain: applies consecutive-day and multi-inning multipliers', () => {
    expect(calculateGameStrain(15, 3, true, 1, 1)).toBe(15); // 1일 휴식 후 1이닝 15구
    expect(calculateGameStrain(15, 3, true, 2, 0)).toBe(21); // 2연투 1.4배
    expect(calculateGameStrain(15, 3, true, 3, 0)).toBe(30); // 3연투 2.0배
    // 2이닝(6아웃) 멀티이닝 구원: 30 * 0.8 * 1.45 = 34.8
    expect(Math.round(calculateGameStrain(30, 6, true, 1, 2) * 10) / 10).toBe(34.8);
    expect(calculateGameStrain(110, 21, false, 1, 5)).toBe(130); // 선발 100구 초과분 2배
  });

  it('getRiskStatus: categorizes score thresholds', () => {
    expect(getRiskStatus(20).status).toBe('SAFE');
    expect(getRiskStatus(35).status).toBe('CAUTION');
    expect(getRiskStatus(55).status).toBe('WARNING');
    expect(getRiskStatus(75).status).toBe('DANGER');
    expect(getRiskStatus(90).status).toBe('EXTREME');
  });
});
