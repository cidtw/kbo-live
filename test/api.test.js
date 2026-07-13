'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { createApi, ApiError } = require('../src/api');
const { resetConfig } = require('./support/helpers');

test('getJSON: retries once on 429 then succeeds', async () => {
  resetConfig({ cache: false });
  let n = 0;
  const api = createApi({
    get: async () => {
      n += 1;
      if (n === 1) return { status: 429, headers: { 'retry-after': '0' }, body: '' };
      return { status: 200, headers: {}, body: JSON.stringify({ result: { games: [{ gameId: 'x' }] } }) };
    },
    sleepFn: async () => {},
  });
  const { data } = await api.getJSON('https://example.test/g');
  assert.strictEqual(n, 2);
  assert.strictEqual(data.result.games[0].gameId, 'x');
});

test('getJSON: invalid JSON throws ApiError', async () => {
  const api = createApi({
    get: async () => ({ status: 200, headers: {}, body: '<html>nope</html>' }),
  });
  await assert.rejects(() => api.getJSON('https://example.test/bad'), (err) => {
    assert.ok(err instanceof ApiError || err.name === 'ApiError');
    assert.match(err.message, /Invalid JSON/);
    return true;
  });
});

test('getJSON: non-200 throws with status', async () => {
  const api = createApi({
    get: async () => ({ status: 404, headers: {}, body: 'missing' }),
  });
  await assert.rejects(() => api.getJSON('https://example.test/404'), (err) => {
    assert.strictEqual(err.status, 404);
    return true;
  });
});

test('fetchGamesByDate: maps gateway payload', async () => {
  const api = createApi({
    get: async () => ({
      status: 200,
      headers: {},
      body: JSON.stringify({ result: { games: [{ gameId: '1', homeTeamCode: 'LT' }] } }),
    }),
  });
  const games = await api.fetchGamesByDate('2026-07-07');
  assert.strictEqual(games.length, 1);
  assert.strictEqual(games[0].homeTeamCode, 'LT');
});

test('fetchWeather: unknown stadium returns null without network', async () => {
  const api = createApi({
    get: async () => {
      throw new Error('should not call network');
    },
  });
  assert.strictEqual(await api.fetchWeather('nonsense_stadium'), null);
});
