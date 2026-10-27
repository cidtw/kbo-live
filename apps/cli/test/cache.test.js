'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'kbo-live-cache-'));
process.env.KBO_LIVE_CACHE_DIR = TMP;

const cache = require('../src/cache');

const relayData = (inn) => ({ inn, textRelays: [{ inn: 1, homeOrAway: '0', textOptions: [{ seqno: 0, text: 'x', type: 0 }] }] });

test('shouldCache: 요청 이닝 < 현재 이닝이면 저장', () => {
  assert.strictEqual(cache.shouldCache('inn1', 1, relayData(3), false), true);
});

test('shouldCache: 진행 중 이닝(요청==현재)은 저장 안 함', () => {
  assert.strictEqual(cache.shouldCache('inn3', 3, relayData(3), false), false);
});

test('shouldCache: 경기 종료면 현재 이닝도 저장', () => {
  assert.strictEqual(cache.shouldCache('inn3', 3, relayData(3), true), true);
});

test('shouldCache: textRelays 없거나 빈 데이터는 저장 안 함', () => {
  assert.strictEqual(cache.shouldCache('inn1', 1, null, true), false);
  assert.strictEqual(cache.shouldCache('inn1', 1, { inn: 9, textRelays: [] }, true), false);
});

test('innKey: 비정상 이닝은 null', () => {
  assert.strictEqual(cache.innKey(0), null);
  assert.strictEqual(cache.innKey('abc'), null);
  assert.strictEqual(cache.innKey(99), null);
  assert.strictEqual(cache.innKey(9), 'inn9');
});

test('writeInning→readInning 라운드트립', () => {
  const d = relayData(5);
  cache.writeInning('g1', 2, d, false);
  assert.deepStrictEqual(cache.readInning('g1', 2), d);
});

test('writeInning: 판정 미달이면 파일을 만들지 않음', () => {
  cache.writeInning('g2', 7, relayData(7), false); // 진행 중 이닝
  assert.strictEqual(cache.readInning('g2', 7), null);
  assert.strictEqual(fs.existsSync(path.join(cache.gameDir('g2'), 'inn7.json')), false);
});

test('readInning: 손상 파일은 null 반환 후 삭제', () => {
  const dir = cache.gameDir('g3');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'inn1.json');
  fs.writeFileSync(file, '{broken json');
  assert.strictEqual(cache.readInning('g3', 1), null);
  assert.strictEqual(fs.existsSync(file), false);
});

test('readInning: 없는 파일은 null', () => {
  assert.strictEqual(cache.readInning('none', 1), null);
});

test('touchGame: meta.json에 lastAccess 기록', () => {
  cache.touchGame('g4');
  const meta = JSON.parse(fs.readFileSync(path.join(cache.gameDir('g4'), 'meta.json'), 'utf8'));
  assert.ok(meta.lastAccess > 0);
});

test('prune: lastAccess 오래된 게임부터 삭제하고 keep개만 남김', () => {
  const root = path.join(cache.cacheRoot(), 'games');
  fs.rmSync(root, { recursive: true, force: true });
  for (let i = 0; i < 5; i++) {
    const dir = cache.gameDir(`p${i}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ lastAccess: 1000 + i }));
  }
  cache.prune(2);
  const left = fs.readdirSync(root).sort();
  assert.deepStrictEqual(left, ['p3', 'p4']); // 최근 2개만 생존
});

test('prune: games 디렉토리가 없어도 조용히 통과', () => {
  fs.rmSync(path.join(cache.cacheRoot(), 'games'), { recursive: true, force: true });
  assert.doesNotThrow(() => cache.prune(3));
});

test('gameDir: 경로 탈출 gameId는 games 루트 안으로 새니타이즈', () => {
  const dir = cache.gameDir('../../etc/passwd');
  assert.ok(dir.startsWith(path.join(cache.cacheRoot(), 'games')));
  assert.ok(!dir.includes('..'));
});

test('writeInning: 성공 후 게임 폴더에 *.tmp 잔여 없음', () => {
  cache.writeInning('g5', 1, relayData(9), false);
  const files = fs.readdirSync(cache.gameDir('g5'));
  assert.ok(!files.some((f) => f.endsWith('.tmp')));
});
