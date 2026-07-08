'use strict';

// 완료된 이닝의 relay 응답 로컬 캐시 (lol-live 캐시 설계 이식).
// 이닝이 끝나면 그 이닝의 문자중계는 불변 → TTL·무효화가 없다.
// 캐시는 최적화일 뿐 — 모든 I/O 실패는 삼키고 네트워크 폴백에 맡긴다.
const fs = require('fs');
const path = require('path');
const os = require('os');

function cacheRoot() {
  if (process.env.KBO_LIVE_CACHE_DIR) return process.env.KBO_LIVE_CACHE_DIR;
  const home = os.homedir();
  if (process.platform === 'darwin') return path.join(home, 'Library', 'Caches', 'kbo-live');
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    return path.join(base, 'kbo-live', 'Cache');
  }
  const base = process.env.XDG_CACHE_HOME || path.join(home, '.cache');
  return path.join(base, 'kbo-live');
}

function gameDir(gameId) {
  const safe = String(gameId).replace(/[^A-Za-z0-9_-]/g, '_'); // 경로 탈출 방지
  return path.join(cacheRoot(), 'games', safe);
}

function innKey(inning) {
  const n = Number(inning);
  if (!Number.isInteger(n) || n < 1 || n > 30) return null;
  return `inn${n}`;
}

// 불변이 확실한 이닝만 저장: 요청 이닝 < 현재 진행 이닝, 또는 경기 종료(finished).
// data.inn 은 relay 응답의 "현재 이닝". 진행 중 이닝은 계속 자라므로 저장하지 않는다.
function shouldCache(key, inning, data, finished) {
  if (!key || !data) return false;
  if (!Array.isArray(data.textRelays) || data.textRelays.length === 0) return false;
  if (finished) return true;
  const cur = Number(data.inn);
  return Number.isFinite(cur) && Number(inning) < cur;
}

function readInning(gameId, inning) {
  const key = innKey(inning);
  if (!key) return null;
  const file = path.join(gameDir(gameId), `${key}.json`);
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
  try {
    return JSON.parse(raw);
  } catch (_) {
    try { fs.unlinkSync(file); } catch (_) {} // 손상 파일 제거
    return null;
  }
}

function writeInning(gameId, inning, data, finished) {
  const key = innKey(inning);
  if (!shouldCache(key, inning, data, finished)) return;
  try {
    const dir = gameDir(gameId);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${key}.json`);
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data)); // tmp에 먼저 쓰고 원자적 rename
    fs.renameSync(tmp, file);
  } catch (_) {} // 쓰기 실패는 무시
}

const touched = new Set(); // 프로세스당 게임별 1회만 meta 갱신

function touchGame(gameId) {
  if (touched.has(gameId)) return;
  touched.add(gameId);
  try {
    const dir = gameDir(gameId);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'meta.json');
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify({ lastAccess: Date.now() }));
    fs.renameSync(tmp, file);
  } catch (_) {}
}

// 최근 접근 keep개만 남기고 게임 폴더 삭제. 실패는 다음 실행에서 재시도되는 셈이라 무시.
function prune(keep) {
  const root = path.join(cacheRoot(), 'games');
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { return; }
  const games = entries.filter((d) => d.isDirectory()).map((d) => {
    let last = 0;
    try { last = JSON.parse(fs.readFileSync(path.join(root, d.name, 'meta.json'), 'utf8')).lastAccess || 0; } catch (_) {}
    return { name: d.name, last };
  });
  games.sort((a, b) => b.last - a.last);
  for (const g of games.slice(keep)) {
    try { fs.rmSync(path.join(root, g.name), { recursive: true, force: true }); } catch (_) {}
  }
}

module.exports = { cacheRoot, gameDir, innKey, shouldCache, readInning, writeInning, touchGame, prune };
