'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { handleMenuKey, handleSpectateKey, KEYBINDINGS } = require('../src/input');

const games = [
  { gameId: 'A', statusCode: 'STARTED' },
  { gameId: 'B', statusCode: 'RESULT' },
];

test('handleMenuKey: navigation and select', () => {
  assert.strictEqual(handleMenuKey('j', {}, { games, selectedIdx: 0 }).type, 'MENU_MOVE');
  assert.strictEqual(handleMenuKey('j', {}, { games, selectedIdx: 0 }).selectedIdx, 1);
  assert.deepStrictEqual(
    handleMenuKey('\r', { name: 'return' }, { games, selectedIdx: 1 }),
    { type: 'SELECT_GAME', game: games[1], replay: false },
  );
  assert.strictEqual(handleMenuKey('r', {}, { games, selectedIdx: 1 }).replay, true);
  assert.strictEqual(handleMenuKey('q', {}, { games, selectedIdx: 0 }).type, 'QUIT');
});

test('handleSpectateKey: switch by number and scroll', () => {
  const bc = {
    meta: { gameId: 'A' },
    games,
    viewN: 10,
  };
  const sw = handleSpectateKey('2', {}, { bc });
  assert.strictEqual(sw.type, 'SWITCH_GAME');
  assert.strictEqual(sw.game.gameId, 'B');
  assert.strictEqual(sw.replay, true);

  assert.deepStrictEqual(handleSpectateKey('j', {}, { bc }), { type: 'SCROLL', delta: 1 });
  assert.strictEqual(handleSpectateKey('p', {}, { bc }).type, 'TOGGLE_PREVIEW');
  assert.strictEqual(handleSpectateKey('e', {}, { bc }).type, 'EXPORT_REPORT');
  assert.strictEqual(handleSpectateKey(undefined, { name: 'tab' }, { bc }).type, 'CYCLE_RECORD');
});

test('KEYBINDINGS table is non-empty', () => {
  assert.ok(KEYBINDINGS.length >= 10);
});
