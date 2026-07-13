'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { parseArgs } = require('../src/cli');

test('parseArgs: defaults and clamps interval/speed', () => {
  const a = parseArgs(['node', 'kbo-live']);
  assert.strictEqual(a.interval, 10);
  assert.strictEqual(a.speed, 1);
  assert.strictEqual(a.gui, true);
  assert.strictEqual(a.cache, true);
});

test('parseArgs: interval min 5 max 300', () => {
  assert.strictEqual(parseArgs(['node', 'x', '--interval', '1']).interval, 5);
  assert.strictEqual(parseArgs(['node', 'x', '--interval', '999']).interval, 300);
  assert.strictEqual(parseArgs(['node', 'x', '--interval', 'nope']).interval, 10);
});

test('parseArgs: flags and positional gameId/team', () => {
  const a = parseArgs([
    'node', 'x',
    '--no-gui', '--no-cache', '--no-pitches', '--verbose',
    '--emoji', '--report', '--list',
    '20260707HTLT02026',
  ]);
  assert.strictEqual(a.gui, false);
  assert.strictEqual(a.cache, false);
  assert.strictEqual(a.pitches, false);
  assert.strictEqual(a.verbose, true);
  assert.strictEqual(a.theme, 'emoji');
  assert.strictEqual(a.report, true);
  assert.strictEqual(a.list, true);
  assert.strictEqual(a.gameId, '20260707HTLT02026');
});

test('parseArgs: team positional when not gameId shape', () => {
  const a = parseArgs(['node', 'x', '롯데', '--date', '0707']);
  assert.strictEqual(a.team, '롯데');
  assert.ok(a.date);
});

test('parseArgs: --replay optional gameId', () => {
  const a = parseArgs(['node', 'x', '--replay', '20260707HTLT02026']);
  assert.strictEqual(a.replay, true);
  assert.strictEqual(a.gameId, '20260707HTLT02026');
});
