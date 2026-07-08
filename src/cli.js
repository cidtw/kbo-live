'use strict';

const readline = require('readline');
const config = require('./config');
const { C } = require('./ansi');
const { ICONSET, ic } = require('./theme');
const { i18n, setLocale } = require('./i18n');
const { Broadcast } = require('./broadcast');
const { render, scrollBy, renderSelectorMenu } = require('./render');
const { resolveTarget, gameMeta, runLive, runReplay, showList } = require('./runner');
const { clampNum, parseDateArg, sleep, kstDateStr } = require('./util');
const { fetchGamesByDate } = require('./api');

function parseArgs(argv) {
  const a = {
    locale: 'ko-KR',
    interval: 10,   // 라이브 폴링 간격(초)
    speed: 1,       // 리플레이 배속
    gui: true,
    replay: false,
    history: true,  // 라이브 접속 시 지난 이닝 복원
    cache: true,    // 완료 이닝 로컬 캐시. --no-cache 면 끔
    pitches: true,  // 투구 단위 라인 표시. --no-pitches 면 결과만
    fahrenheit: false,
  };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    const next = () => args[++i];
    switch (k) {
      case '--help': case '-h': a.help = true; break;
      case '--list': case '-l': a.list = true; break;
      case '--game-id': a.gameId = next(); break;
      case '--date': case '-d': a.date = parseDateArg(next()) || a.date; break;
      case '--replay': a.replay = true; if (args[i + 1] && !args[i + 1].startsWith('-')) a.gameId = next(); break;
      case '--fahrenheit': case '-f': a.fahrenheit = true; break;
      case '--locale': case '--lang': a.locale = next(); break;
      case '--interval': a.interval = next(); break;
      case '--speed': a.speed = next(); break;
      case '--no-gui': a.gui = false; break;
      case '--no-history': a.history = false; break;
      case '--no-cache': a.cache = false; break;
      case '--no-pitches': a.pitches = false; break;
      case '--nerd': a.theme = 'nerd'; break;
      case '--emoji': a.theme = 'emoji'; break;
      case '--ascii': a.theme = 'ascii'; break;
      case '--theme': a.theme = next(); break;
      default:
        // 위치 인자: gameId 형태(YYYYMMDD..)면 gameId, 아니면 팀명/팀코드 필터
        if (!k.startsWith('-')) {
          if (/^\d{8}[A-Z]{4}\d/.test(k)) a.gameId = k;
          else if (!a.team) a.team = k;
        }
    }
  }
  // 숫자 인자 방어: NaN·0·음수로 인한 핫루프 폴링(API 난타) 방지
  a.interval = clampNum(a.interval, 5, 300, 10);
  a.speed = clampNum(a.speed, 0.1, 100, 1);
  return a;
}

async function main() {
  const opts = parseArgs(process.argv);
  config.gui = opts.gui;
  config.cache = opts.cache;
  config.pitches = opts.pitches;
  config.fahrenheit = opts.fahrenheit;
  if (opts.theme && ICONSET[opts.theme]) config.theme = opts.theme;
  setLocale(opts.locale);

  if (opts.help) { console.log(i18n.t.help); return; }
  if (opts.list) { await showList(opts); return; }

  if (config.cache) require('./cache').prune(20); // 최근 20경기만 보관(LRU)
  const target = await resolveTarget(opts);

  // Fetch games of the day
  let games = [];
  if (target.menu) {
    games = target.games;
  } else {
    try {
      let date = opts.date;
      if (!date && target.game) {
        if (target.game.gameId && /^\d{8}/.test(target.game.gameId)) {
          const ymd = target.game.gameId.slice(0, 8);
          date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
        }
      }
      if (!date) date = kstDateStr();
      games = await fetchGamesByDate(date);
    } catch (_) {
      if (target.game) games = [target.game];
    }
  }

  let activeGame = target.game;
  let activeReplay = target.replay;
  let currentBc = null;
  let activeMode = target.menu ? 'menu' : 'spectate';
  let selectedIdx = 0;
  let menuResolver = null;
  const waitMenuSelection = () => new Promise(r => { menuResolver = r; });

  const rawOn = config.gui && process.stdin.isTTY && process.stdout.isTTY;
  const ENTER = '\x1b[?1049h\x1b[?25l';  // 대체 화면 진입 + 커서 숨김
  const LEAVE = '\x1b[?25h\x1b[?1049l';  // 커서 복원 + 대체 화면 이탈

  // 터미널 복구는 단일 경로로. exit 훅이 최후의 보루라 어떤 종료(SIGTERM 포함)에도 화면이 남지 않는다.
  let restored = !config.gui;
  const restoreTerminal = () => {
    if (rawOn) { try { process.stdin.setRawMode(false); } catch (_) {} }
    if (!restored) { process.stdout.write(LEAVE); restored = true; }
  };
  process.on('exit', restoreTerminal);
  process.on('SIGINT', () => { restoreTerminal(); process.exit(0); });
  process.on('SIGTERM', () => { restoreTerminal(); process.exit(0); });

  if (config.gui) process.stdout.write(ENTER);
  if (config.gui && process.stdout.isTTY) {
    process.stdout.on('resize', () => {
      if (activeMode === 'menu') {
        let date = opts.date || kstDateStr();
        renderSelectorMenu(games, selectedIdx, date);
      } else if (currentBc) {
        render(currentBc);
      }
    });
  }

  // 키보드 스크롤: ↑↓(k/j) / PageUp·Dn(b/Space) / Home·End(g/G) / q·Ctrl+C 종료
  if (rawOn) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', (s, key) => {
      key = key || {};
      if ((key.ctrl && key.name === 'c') || s === 'q' || key.name === 'q') { restoreTerminal(); process.exit(0); }

      if (activeMode === 'menu') {
        if (!games || games.length === 0) return;
        if (key.name === 'up' || s === 'k') {
          selectedIdx = (selectedIdx - 1 + games.length) % games.length;
        } else if (key.name === 'down' || s === 'j') {
          selectedIdx = (selectedIdx + 1) % games.length;
        } else if (key.name === 'return' || key.name === 'enter') {
          const chosen = games[selectedIdx];
          if (menuResolver) {
            menuResolver(chosen);
          }
          return;
        } else return;

        let date = opts.date || kstDateStr();
        renderSelectorMenu(games, selectedIdx, date);
        return;
      }

      if (!currentBc) return;

      const bc = currentBc;
      const N = bc.viewN || 10;

      // Handle game switching keys
      if (bc.games && bc.games.length > 0) {
        let nextGame = null;
        if (s >= '1' && s <= '9') {
          const idx = Number(s) - 1;
          if (idx < bc.games.length) {
            nextGame = bc.games[idx];
          }
        } else if (key.name === 'left') {
          const curIdx = bc.games.findIndex(g => g.gameId === bc.meta.gameId);
          if (curIdx >= 0) {
            const nextIdx = (curIdx - 1 + bc.games.length) % bc.games.length;
            nextGame = bc.games[nextIdx];
          }
        } else if (key.name === 'right') {
          const curIdx = bc.games.findIndex(g => g.gameId === bc.meta.gameId);
          if (curIdx >= 0) {
            const nextIdx = (curIdx + 1) % bc.games.length;
            nextGame = bc.games[nextIdx];
          }
        }

        if (nextGame && nextGame.gameId !== bc.meta.gameId) {
          const replay = nextGame.statusCode === 'RESULT';
          bc.switchRequested = { game: nextGame, replay };
          return;
        }
      }

      // Toggle preview panel key: 'p'
      if (s === 'p' || key.name === 'p') {
        bc.showPreview = !bc.showPreview;
        if (bc.showPreview) bc.recordMode = null;
        render(bc);
        return;
      }

      // Toggle record panel key: 'o'
      if (s === 'o' || key.name === 'o') {
        if (!bc.recordMode) bc.recordMode = 'summary';
        else if (bc.recordMode === 'summary') bc.recordMode = 'batters';
        else if (bc.recordMode === 'batters') bc.recordMode = 'pitchers';
        else bc.recordMode = null;

        if (bc.recordMode) bc.showPreview = false;
        render(bc);
        return;
      }

      // Back to menu keys: 'm', 'escape', 'backspace'
      if (s === 'm' || key.name === 'm' || key.name === 'escape' || key.name === 'backspace') {
        bc.menuRequested = true;
        return;
      }

      if (key.name === 'up' || s === 'k') scrollBy(bc, -1);
      else if (key.name === 'down' || s === 'j') scrollBy(bc, +1);
      else if (key.name === 'pageup' || s === 'b') scrollBy(bc, -N);
      else if (key.name === 'pagedown' || s === ' ') scrollBy(bc, +N);
      else if (key.name === 'home' || s === 'g') scrollBy(bc, -1e9);
      else if (key.name === 'end' || s === 'G') { bc.follow = true; }
      else return;
      render(bc);
    });
  }

  while (true) {
    if (activeMode === 'menu') {
      const liveIdx = games.findIndex(g => g.statusCode !== 'BEFORE' && g.statusCode !== 'READY' && g.statusCode !== 'RESULT' && !g.cancel);
      if (liveIdx >= 0 && selectedIdx === 0) {
        selectedIdx = liveIdx;
      }

      let date = opts.date || kstDateStr();
      renderSelectorMenu(games, selectedIdx, date);

      const chosen = await waitMenuSelection();
      activeGame = chosen;
      activeReplay = chosen.statusCode === 'RESULT';
      activeMode = 'spectate';
    }

    if (!activeGame) break;

    const bc = new Broadcast(gameMeta(activeGame));
    bc.games = games;
    bc.replay = activeReplay;
    currentBc = bc;

    try {
      if (activeReplay) await runReplay(bc, activeGame, opts);
      else await runLive(bc, activeGame, opts);

      // If the game ended naturally, and we are in GUI mode, wait for user to switch, quit, or return to menu
      if (rawOn && !bc.switchRequested && !bc.menuRequested) {
        while (!bc.switchRequested && !bc.menuRequested && !restored) {
          await sleep(100);
        }
      }
    } catch (e) {
      if (!bc.switchRequested && !bc.menuRequested) {
        restoreTerminal();
        throw e;
      }
    }

    if (bc.menuRequested) {
      activeMode = 'menu';
      activeGame = null;
      currentBc = null;

      try {
        let date = opts.date;
        if (!date && target.game) {
          if (target.game.gameId && /^\d{8}/.test(target.game.gameId)) {
            const ymd = target.game.gameId.slice(0, 8);
            date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
          }
        }
        if (!date) date = kstDateStr();
        games = await fetchGamesByDate(date);
      } catch (_) {}
      continue;
    }

    if (bc.switchRequested) {
      activeGame = bc.switchRequested.game;
      activeReplay = bc.switchRequested.replay;

      try {
        let date = opts.date;
        if (!date && activeGame) {
          if (activeGame.gameId && /^\d{8}/.test(activeGame.gameId)) {
            const ymd = activeGame.gameId.slice(0, 8);
            date = `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
          }
        }
        if (!date) date = kstDateStr();
        games = await fetchGamesByDate(date);
      } catch (_) {}
    } else {
      break;
    }
  }

  restoreTerminal();

  if (config.gui && currentBc) {
    const tail = currentBc.log.slice(-8).map((it) => `${C.gray}[${it.ts}]${C.reset} ${ic(it.icon)}  ${it.text}`);
    console.log(['', ...tail, `${C.dim}${i18n.t.endBanner}${C.reset}`].join('\n'));
  }
  process.exit(0);
}

module.exports = { main, parseArgs };
