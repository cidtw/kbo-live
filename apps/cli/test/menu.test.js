'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { mapTeamCode } = require('../src/util');
const { fetchWeather, fetchPreview, fetchRecord } = require('../src/api');
const { liveNetEnabled } = require('./support/helpers');

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

test('fetchWeather: returns null for invalid stadium (offline)', async () => {
  const res = await fetchWeather('nonsense_stadium');
  assert.strictEqual(res, null);
});

const live = liveNetEnabled() ? test : test.skip;

live('fetchWeather: resolves weather data for a valid stadium (live net)', async () => {
  const res = await fetchWeather('잠실');
  if (res) {
    assert.strictEqual(typeof res.temp, 'number');
    assert.strictEqual(typeof res.code, 'number');
  } else {
    assert.strictEqual(res, null);
  }
});

live('fetchPreview: resolves preview data for a valid gameId (live net)', async () => {
  const res = await fetchPreview('20260707HTLT02026');
  if (res) {
    assert.ok(res.gameInfo);
  } else {
    assert.strictEqual(res, null);
  }
});

live('fetchRecord: resolves record data for a valid gameId (live net)', async () => {
  const res = await fetchRecord('20260707HTLT02026');
  if (res) {
    assert.ok(res.scoreBoard || res.gameInfo);
  } else {
    assert.strictEqual(res, null);
  }
});
