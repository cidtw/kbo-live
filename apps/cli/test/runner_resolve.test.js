'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { resolveTarget } = require('../src/runner');
const { resetConfig } = require('./support/helpers');

const sampleGames = [
  {
    gameId: '20260707HTLT02026',
    statusCode: 'RESULT',
    homeTeamCode: 'LT',
    homeTeamName: '롯데',
    awayTeamCode: 'HT',
    awayTeamName: 'KIA',
    cancel: false,
  },
  {
    gameId: '20260707SSLG02026',
    statusCode: 'BEFORE',
    homeTeamCode: 'LG',
    homeTeamName: 'LG',
    awayTeamCode: 'SS',
    awayTeamName: '삼성',
    cancel: false,
  },
];

test('resolveTarget: menu when gui+tty and no team', async () => {
  resetConfig({ gui: true });
  const origIn = process.stdin.isTTY;
  const origOut = process.stdout.isTTY;
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
  try {
    const res = await resolveTarget(
      { date: '2026-07-07' },
      { fetchGamesByDate: async () => sampleGames },
    );
    assert.strictEqual(res.menu, true);
    assert.strictEqual(res.games.length, 2);
  } finally {
    process.stdin.isTTY = origIn;
    process.stdout.isTTY = origOut;
  }
});

test('resolveTarget: empty day still opens interactive menu', async () => {
  resetConfig({ gui: true });
  const origIn = process.stdin.isTTY;
  const origOut = process.stdout.isTTY;
  process.stdin.isTTY = true;
  process.stdout.isTTY = true;
  try {
    const res = await resolveTarget(
      { date: '2026-01-01' },
      { fetchGamesByDate: async () => [] },
    );
    assert.strictEqual(res.menu, true);
    assert.deepStrictEqual(res.games, []);
  } finally {
    process.stdin.isTTY = origIn;
    process.stdout.isTTY = origOut;
  }
});

test('resolveTarget: empty day non-interactive still errors', async () => {
  resetConfig({ gui: false });
  await assert.rejects(
    () => resolveTarget(
      { date: '2026-01-01' },
      { fetchGamesByDate: async () => [] },
    ),
    /경기|games|없습니다|No KBO/i,
  );
});

test('resolveTarget: team KIA maps HT and replay latest done', async () => {
  resetConfig({ gui: false });
  const res = await resolveTarget(
    { date: '2026-07-07', team: 'KIA', replay: true },
    { fetchGamesByDate: async () => sampleGames },
  );
  assert.ok(res.game);
  assert.strictEqual(res.game.awayTeamCode, 'HT');
  assert.strictEqual(res.replay, true);
});

test('resolveTarget: no process.exit — returns exitCode when no live', async () => {
  resetConfig({ gui: false });
  const origIn = process.stdin.isTTY;
  process.stdin.isTTY = false;
  try {
    const res = await resolveTarget(
      { date: '2026-07-07' },
      { fetchGamesByDate: async () => sampleGames.filter((g) => g.statusCode === 'BEFORE') },
    );
    assert.strictEqual(typeof res.exitCode, 'number');
    assert.ok(res.exitCode === 0 || res.exitCode === 1);
  } finally {
    process.stdin.isTTY = origIn;
  }
});

test('resolveTarget: gameId path uses fetchGame', async () => {
  resetConfig();
  const res = await resolveTarget(
    { gameId: '20260707HTLT02026' },
    { fetchGame: async (id) => ({ ...sampleGames[0], gameId: id }) },
  );
  assert.strictEqual(res.game.gameId, '20260707HTLT02026');
});
