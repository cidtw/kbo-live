'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const config = require('../src/config');
const { Broadcast } = require('../src/broadcast');
const { generateReport } = require('../src/report');

const FIXTURE = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'fixtures', 'relay-20260707HTLT02026-i1.json'), 'utf8',
)).result.textRelayData;

const meta = () => ({
  gameId: '20260707HTLT02026',
  league: 'KBO리그', stadium: '사직',
  home: { code: 'LT', name: '롯데' }, away: { code: 'HT', name: 'KIA' },
});

test('generateReport: 경기 보고서 마크다운 생성 검증', () => {
  config.gui = true;
  config.replay = false;
  config.pitches = true;
  
  const bc = new Broadcast(meta());
  bc.ingestRelay(FIXTURE);
  
  // Set some mock preview/record data
  bc.preview = {
    gameInfo: { hName: '롯데', aName: 'KIA' }
  };
  bc.record = {
    pitchingResult: [
      { wls: 'W', name: '로드리게스', w: 1, l: 0 }
    ],
    etcRecords: [
      { how: '결승타', result: '레이예스' }
    ]
  };

  const report = generateReport(bc);
  assert.ok(typeof report === 'string');
  assert.ok(report.includes('# KBO 경기 보고서'));
  assert.ok(report.includes('## 1. 경기 개요'));
  assert.ok(report.includes('## 2. 라인 스코어'));
  assert.ok(report.includes('## 6. 투구 분석'));
  assert.ok(report.includes('로드리게스'));
  assert.ok(report.includes('레이예스'));
});
