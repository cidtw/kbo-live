'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { resolveTarget } = require('../src/runner');
const config = require('../src/config');

test('resolveTarget: returns menu flag when team is not specified', async () => {
  // Save original config & stdin/stdout TTY state
  const origGui = config.gui;
  const origInTTY = process.stdin.isTTY;
  const origOutTTY = process.stdout.isTTY;

  config.gui = true;
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;

  try {
    const opts = { date: '2026-07-07' };
    const res = await resolveTarget(opts);
    assert.strictEqual(res.menu, true);
    assert.ok(Array.isArray(res.games));
    assert.ok(res.games.length > 0);
  } finally {
    // Restore
    config.gui = origGui;
    process.stdin.isTTY = origInTTY;
    process.stdout.isTTY = origOutTTY;
  }
});

const { fetchWeather } = require('../src/api');

test('fetchWeather: resolves weather data for a valid stadium', async () => {
  const res = await fetchWeather('잠실');
  if (res) {
    assert.strictEqual(typeof res.temp, 'number');
    assert.strictEqual(typeof res.code, 'number');
  } else {
    assert.strictEqual(res, null);
  }
});

test('fetchWeather: returns null for invalid stadium', async () => {
  const res = await fetchWeather('nonsense_stadium');
  assert.strictEqual(res, null);
});

const { mapTeamCode } = require('../src/util');

test('mapTeamCode: correctly translates 2-digit team codes to custom codes', () => {
  assert.strictEqual(mapTeamCode('LT'), 'LOT');
  assert.strictEqual(mapTeamCode('SK'), 'SSG');
  assert.strictEqual(mapTeamCode('HT'), 'KIA');
  assert.strictEqual(mapTeamCode('OB'), 'DB');
  assert.strictEqual(mapTeamCode('WO'), 'KH');
  assert.strictEqual(mapTeamCode('SS'), 'SL');
  assert.strictEqual(mapTeamCode('HH'), 'HE');
  assert.strictEqual(mapTeamCode('LG'), 'LG');
  assert.strictEqual(mapTeamCode('NC'), 'NCD');
  assert.strictEqual(mapTeamCode('KT'), 'KT');
  assert.strictEqual(mapTeamCode('UNKNOWN'), 'UNKNOWN');
});

test('resolveTarget: matches game by custom team code (e.g. KIA)', async () => {
  const opts = { date: '2026-07-07', team: 'KIA', replay: true };
  const res = await resolveTarget(opts);
  assert.ok(res.game);
  assert.strictEqual(res.game.awayTeamCode, 'HT');
});

const { fetchPreview } = require('../src/api');

test('fetchPreview: resolves preview data for a valid gameId', async () => {
  const res = await fetchPreview('20260707HTLT02026');
  if (res) {
    assert.ok(res.gameInfo);
    assert.ok(res.awayStarter);
    assert.ok(res.homeStarter);
  } else {
    assert.strictEqual(res, null);
  }
});
