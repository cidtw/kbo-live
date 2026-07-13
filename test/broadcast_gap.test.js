'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { Broadcast } = require('../src/broadcast');
const { resetConfig } = require('./support/helpers');

function relay(inn, ha, options, extra = {}) {
  return {
    inn,
    homeOrAway: ha,
    textRelays: [{
      inn,
      homeOrAway: ha,
      textOptions: options,
    }],
    ...extra,
  };
}

test('hasGapBefore: detects seqno hole', () => {
  resetConfig({ gui: true, pitches: true, replay: false });
  const bc = new Broadcast({ home: { code: 'LT', name: '롯데' }, away: { code: 'HT', name: 'KIA' } });
  bc.ingestRelay(relay(1, '0', [
    { seqno: 1, type: 0, text: '1회초 시작', currentGameState: { homeScore: 0, awayScore: 0 } },
    { seqno: 2, type: 13, text: '안타', currentGameState: { homeScore: 0, awayScore: 0 } },
  ]));
  assert.strictEqual(bc.lastSeq, 2);
  const next = relay(2, '0', [
    { seqno: 5, type: 0, text: '2회초 시작', currentGameState: { homeScore: 0, awayScore: 0 } },
  ]);
  assert.strictEqual(bc.hasGapBefore(next), true);
});

test('ingest multi-inning: cursor advances and lines accumulate', () => {
  resetConfig({ gui: true, pitches: true, replay: false });
  const bc = new Broadcast({ home: { code: 'LT', name: '롯데' }, away: { code: 'HT', name: 'KIA' } });
  const n1 = bc.ingestRelay(relay(1, '0', [
    { seqno: 10, type: 0, text: '1회초 시작' },
    { seqno: 11, type: 13, text: '삼진' },
  ]));
  const n2 = bc.ingestRelay(relay(2, '1', [
    { seqno: 12, type: 0, text: '2회말 시작' },
  ]));
  assert.strictEqual(n1, 2);
  assert.strictEqual(n2, 1);
  assert.strictEqual(bc.lastSeq, 12);
  assert.strictEqual(bc.inn, 2);
  assert.strictEqual(bc.half, 'B');
  assert.ok(bc.log.length >= 3);
});

test('absorbMeta is public and fills names', () => {
  resetConfig({ gui: true, replay: false });
  const bc = new Broadcast({ home: { code: 'LT', name: '롯데' }, away: { code: 'HT', name: 'KIA' } });
  bc.absorbMeta({
    homeLineup: { pitcher: [{ pcode: '1', name: '투수A' }], batter: [] },
    awayLineup: { pitcher: [], batter: [{ pcode: '2', name: '타자B' }] },
  });
  assert.strictEqual(bc.names['1'], '투수A');
  assert.strictEqual(bc.names['2'], '타자B');
});
