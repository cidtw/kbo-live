'use strict';

const readline = require('readline');
const config = require('./config');
const { C } = require('./ansi');
const { ICONSET, ic } = require('./theme');
const { i18n, setLocale } = require('./i18n');
const { Broadcast } = require('./broadcast');
const { render, scrollBy, renderSelectorMenu } = require('./render');
const { resolveTarget, gameMeta, runLive, runReplay, showList } = require('./runner');
const { clampNum, parseDateArg, sleep, kstDateStr, addDays, gameIdToDate } = require('./util');
const { fetchGamesByDate } = require('./api');
const { loadFullBroadcast } = require('./game_loader');
const { createTerminal } = require('./terminal');
const { handleMenuKey, handleSpectateKey } = require('./input');
const { debug, warn } = require('./log');

function parseArgs(argv) {
  const a = {
    locale: 'ko-KR',
    interval: 10,
    speed: 1,
    gui: true,
    replay: false,
    history: true,
    cache: true,
    pitches: true,
    fahrenheit: false,
    verbose: false,
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
      case '--replay':
        a.replay = true;
        if (args[i + 1] && !args[i + 1].startsWith('-')) a.gameId = next();
        break;
      case '--fahrenheit': case '-f': a.fahrenheit = true; break;
      case '--locale': case '--lang': a.locale = next(); break;
      case '--interval': a.interval = next(); break;
      case '--speed': a.speed = next(); break;
      case '--report': a.report = true; break;
      case '--verbose': case '-v': a.verbose = true; break;
      case '--no-gui': a.gui = false; break;
      case '--no-history': a.history = false; break;
      case '--no-cache': a.cache = false; break;
      case '--no-pitches': a.pitches = false; break;
      case '--nerd': a.theme = 'nerd'; break;
      case '--emoji': a.theme = 'emoji'; break;
      case '--ascii': a.theme = 'ascii'; break;
      case '--theme': a.theme = next(); break;
      default:
        if (!k.startsWith('-')) {
          if (/^\d{8}[A-Z]{4}\d/.test(k)) a.gameId = k;
          else if (!a.team) a.team = k;
        }
    }
  }
  a.interval = clampNum(a.interval, 5, 300, 10);
  a.speed = clampNum(a.speed, 0.1, 100, 1);
  return a;
}

async function resolveDateForGames(opts, game) {
  return opts.date || gameIdToDate(game?.gameId) || kstDateStr();
}

async function main() {
  const opts = parseArgs(process.argv);
  config.gui = opts.gui;
  config.cache = opts.cache;
  config.pitches = opts.pitches;
  config.fahrenheit = opts.fahrenheit;
  config.verbose = opts.verbose || !!process.env.KBO_LIVE_DEBUG;
  if (opts.theme && ICONSET[opts.theme]) config.theme = opts.theme;
  setLocale(opts.locale);

  if (opts.help) {
    console.log(i18n.t.help);
    return;
  }
  if (opts.list) {
    await showList(opts);
    return;
  }

  if (config.cache) require('./cache').prune(20);
  const target = await resolveTarget(opts);
  if (target && typeof target.exitCode === 'number') {
    process.exit(target.exitCode);
  }

  if (opts.report) {
    if (!target.game) {
      throw new Error(i18n.t.errReportNeedGame || 'Please specify a game with --game-id, a team name, or --replay to export a report.');
    }
    const { exportReport } = require('./report');
    console.log((i18n.t.reportFetching || ((id) => `Fetching game data for ${id}...`))(target.game.gameId));
    const { bc, failedInnings, lastInn } = await loadFullBroadcast(target.game);
    if (bc.log.length === 0 && failedInnings.length >= lastInn) {
      throw new Error(i18n.t.errFeedNotFound || 'No commentary data found for this game.');
    }
    if (failedInnings.length) {
      warn((i18n.t.reportPartial || ((n, total) => `Partial report: failed innings ${n.join(', ')} of ${total}`))(failedInnings, lastInn));
    }
    const { filename } = exportReport(bc);
    console.log((i18n.t.reportExported || ((f) => `Exported KBO game report to: ${f}`))(filename));
    if (failedInnings.length && failedInnings.length === lastInn) process.exitCode = 1;
    return;
  }

  let games = [];
  if (target.menu) {
    games = target.games;
  } else {
    try {
      const date = await resolveDateForGames(opts, target.game);
      games = await fetchGamesByDate(date);
    } catch (e) {
      debug('initial games list failed', e.message);
      if (target.game) games = [target.game];
    }
  }

  let activeGame = target.game;
  let activeReplay = target.replay;
  let currentBc = null;
  let activeMode = target.menu ? 'menu' : 'spectate';
  let selectedIdx = 0;
  let menuResolver = null;
  const waitMenuSelection = () => new Promise((r) => { menuResolver = r; });

  const term = createTerminal({ gui: config.gui });
  process.on('exit', term.restore);
  process.on('SIGINT', () => { term.restore(); process.exit(0); });
  process.on('SIGTERM', () => { term.restore(); process.exit(0); });

  term.enter();
  term.onResize(() => {
    if (activeMode === 'menu') {
      renderSelectorMenu(games, selectedIdx, opts.date || kstDateStr());
    } else if (currentBc) {
      render(currentBc);
    }
  });

  if (term.enableRaw()) {
    process.stdin.on('keypress', (s, key) => {
      if (activeMode === 'menu') {
        const action = handleMenuKey(s, key, { games, selectedIdx });
        applyMenuAction(action);
        return;
      }
      const action = handleSpectateKey(s, key, { bc: currentBc });
      applySpectateAction(action);
    });
  }

  function applyMenuAction(action) {
    const date = opts.date || kstDateStr();
    switch (action.type) {
      case 'QUIT':
        term.restore();
        process.exit(0);
        break;
      case 'MENU_DATE_DELTA':
        if (menuResolver) menuResolver({ type: 'CHANGE_DATE', date: addDays(date, action.days) });
        break;
      case 'MENU_DATE_PROMPT': {
        term.restore();
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question('\nEnter Date (YYYY-MM-DD or MMDD): ', (answer) => {
          rl.close();
          if (term.rawOn) {
            process.stdout.write(term.ENTER);
            process.stdin.setRawMode(true);
            process.stdin.resume();
            term.setRestored(false);
          }
          const parsed = parseDateArg(answer);
          if (parsed && menuResolver) menuResolver({ type: 'CHANGE_DATE', date: parsed });
          else renderSelectorMenu(games, selectedIdx, date);
        });
        break;
      }
      case 'MENU_MOVE':
        selectedIdx = action.selectedIdx;
        renderSelectorMenu(games, selectedIdx, date);
        break;
      case 'SELECT_GAME':
        if (menuResolver) menuResolver(action);
        break;
      default:
        break;
    }
  }

  function applySpectateAction(action) {
    const bc = currentBc;
    switch (action.type) {
      case 'QUIT':
        term.restore();
        process.exit(0);
        break;
      case 'SWITCH_GAME':
        if (bc) bc.switchRequested = { game: action.game, replay: action.replay };
        break;
      case 'TOGGLE_PREVIEW':
        if (!bc) return;
        bc.showPreview = !bc.showPreview;
        if (bc.showPreview) bc.recordMode = null;
        render(bc);
        break;
      case 'CYCLE_RECORD':
        if (!bc) return;
        if (!bc.recordMode) bc.recordMode = 'summary';
        else if (bc.recordMode === 'summary') bc.recordMode = 'batters';
        else if (bc.recordMode === 'batters') bc.recordMode = 'pitchers';
        else if (bc.recordMode === 'pitchers') bc.recordMode = 'lineups';
        else bc.recordMode = null;
        if (bc.recordMode) bc.showPreview = false;
        render(bc);
        break;
      case 'EXPORT_REPORT': {
        if (!bc) return;
        const { exportReport } = require('./report');
        try {
          const { filename } = exportReport(bc);
          bc.addLine('info', (i18n.t.reportExportedShort || ((f) => `Exported to ${f}`))(filename), C.cyan);
        } catch (err) {
          bc.addLine('info', (i18n.t.reportExportFailed || ((m) => `Export failed: ${m}`))(err.message), C.red);
        }
        render(bc);
        break;
      }
      case 'BACK_MENU':
        if (bc) bc.menuRequested = true;
        break;
      case 'SCROLL':
        if (!bc) return;
        scrollBy(bc, action.delta);
        render(bc);
        break;
      case 'FOLLOW':
        if (!bc) return;
        bc.follow = true;
        render(bc);
        break;
      default:
        break;
    }
  }

  while (true) {
    if (activeMode === 'menu') {
      const liveIdx = games.findIndex((g) => g.statusCode !== 'BEFORE' && g.statusCode !== 'READY' && g.statusCode !== 'RESULT' && !g.cancel);
      if (liveIdx >= 0 && selectedIdx === 0) selectedIdx = liveIdx;

      const date = opts.date || kstDateStr();
      renderSelectorMenu(games, selectedIdx, date);

      const result = await waitMenuSelection();
      if (result && result.type === 'CHANGE_DATE') {
        opts.date = result.date;
        selectedIdx = 0;
        try {
          games = await fetchGamesByDate(opts.date);
        } catch (e) {
          debug('menu date change failed', e.message);
          games = [];
        }
        continue;
      }

      if (result && result.type === 'SELECT_GAME') {
        activeGame = result.game;
        activeReplay = result.replay;
        activeMode = 'spectate';
      } else {
        activeGame = result;
        activeReplay = result && result.statusCode === 'RESULT';
        activeMode = 'spectate';
      }
    }

    if (!activeGame) break;

    const bc = new Broadcast(gameMeta(activeGame));
    bc.games = games;
    bc.replay = activeReplay;
    currentBc = bc;

    try {
      if (activeReplay) await runReplay(bc, activeGame, opts);
      else await runLive(bc, activeGame, opts);

      if (term.rawOn && !bc.switchRequested && !bc.menuRequested) {
        while (!bc.switchRequested && !bc.menuRequested && !term.isRestored()) {
          await sleep(100);
        }
      }
    } catch (e) {
      if (!bc.switchRequested && !bc.menuRequested) {
        term.restore();
        throw e;
      }
    }

    if (bc.menuRequested) {
      activeMode = 'menu';
      activeGame = null;
      currentBc = null;
      try {
        const date = await resolveDateForGames(opts, target.game);
        games = await fetchGamesByDate(date);
      } catch (e) {
        debug('menu reload failed', e.message);
      }
      continue;
    }

    if (bc.switchRequested) {
      activeGame = bc.switchRequested.game;
      activeReplay = bc.switchRequested.replay;
      try {
        const date = await resolveDateForGames(opts, activeGame);
        games = await fetchGamesByDate(date);
      } catch (e) {
        debug('switch reload failed', e.message);
      }
    } else {
      break;
    }
  }

  term.restore();

  if (config.gui && currentBc) {
    const tail = currentBc.log.slice(-8).map((it) => `${C.gray}[${it.ts}]${C.reset} ${ic(it.icon)}  ${it.text}`);
    console.log(['', ...tail, `${C.dim}${i18n.t.endBanner}${C.reset}`].join('\n'));
  }
  process.exit(0);
}

module.exports = { main, parseArgs };
