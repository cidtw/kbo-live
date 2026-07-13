'use strict';

const readline = require('readline');
const config = require('./config');
const { C, fg256, TEAM } = require('./ansi');
const { sleep, sleepOrInterrupt, kstDateStr, REVERSE_TEAM_MAP } = require('./util');
const defaultApi = require('./api');
const { Broadcast } = require('./broadcast');
const { render } = require('./render');
const { i18n } = require('./i18n');
const { isLive, isDone, gameMeta } = require('./runner_meta');
const { debug, warn } = require('./log');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

function matchTeam(g, q) {
  const s = String(q).toLowerCase();
  const mapped = REVERSE_TEAM_MAP[s.toUpperCase()];
  const searchTerms = [s];
  if (mapped) {
    searchTerms.push(mapped.toLowerCase());
  }
  return [g.homeTeamCode, g.homeTeamName, g.awayTeamCode, g.awayTeamName]
    .some((v) => v && searchTerms.some((term) => String(v).toLowerCase().includes(term)));
}

/**
 * Resolve broadcast target.
 * @returns {Promise<{game?, replay?, menu?, games?, exitCode?}>}
 * If no game can be chosen interactively, returns { exitCode } instead of process.exit.
 */
async function resolveTarget(opts, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  if (opts.gameId) {
    const g = await api.fetchGame(opts.gameId);
    if (!g) throw new Error(t.errGameNotFound);
    return { game: g, replay: opts.replay || (opts.replayWanted && isDone(g)) };
  }
  const date = opts.date || kstDateStr();
  const games = await api.fetchGamesByDate(date);
  if (!games.length) throw new Error(t.noGamesDate(date));

  if (!opts.team && !opts.replay && config.gui && process.stdin.isTTY && process.stdout.isTTY) {
    return { menu: true, games };
  }

  let pool = games;
  if (opts.team) {
    pool = games.filter((g) => matchTeam(g, opts.team));
    if (!pool.length) throw new Error(t.teamNotFound(opts.team));
  }

  if (opts.replay) {
    const done = pool.filter(isDone);
    if (!done.length) throw new Error(t.errFeedNotFound);
    return { game: done[done.length - 1], replay: true };
  }

  const live = pool.filter(isLive);
  if (live.length === 1) return { game: live[0], replay: false };
  if (live.length > 1) {
    let chosen = live[0];
    if (process.stdin.isTTY) {
      console.log(t.multiLive);
      live.forEach((g, i) => console.log(`  [${i + 1}] ${g.awayTeamName} ${t.vs} ${g.homeTeamName} — ${g.statusInfo || ''}`));
      const ans = await ask(t.pickLiveNum);
      chosen = live[(Number(ans) || 1) - 1] || live[0];
    }
    return { game: chosen, replay: false };
  }

  const before = pool.filter((g) => (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel);
  if (opts.team && before.length) return { game: before[0], replay: false };

  console.log(`${C.yellow}${t.noLiveNow}${C.reset}`);
  const done = pool.filter(isDone);
  if (done.length && process.stdin.isTTY) {
    const g = done[done.length - 1];
    const ans = await ask(t.confirmReplayLatest({ away: g.awayTeamName, home: g.homeTeamName }));
    if (ans.toLowerCase() !== 'n') return { game: g, replay: true };
  }
  console.log(t.startHint);
  console.log(t.replayHint);
  return { exitCode: before.length ? 0 : 1 };
}

async function waitForStart(bc, game, opts, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  let g = game;
  while (g && (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel) {
    const when = new Date(g.gameDateTime).toLocaleTimeString(t.dateLocale, { hour: '2-digit', minute: '2-digit' });
    bc.status = t.waitingStart(when);
    render(bc);
    if (!config.gui) console.log(bc.status);
    if (await sleepOrInterrupt(30 * 1000, bc)) return null;
    try {
      g = await api.fetchGame(game.gameId);
    } catch (e) {
      debug('waitForStart fetchGame failed', e.message);
    }
  }
  if (g && g.cancel) { bc.addLine('info', t.gameCancelled, C.yellow); render(bc); return null; }
  return g || game;
}

async function backfillHistory(bc, gameId, curRelay, finished, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  const cur = Number(curRelay?.inn) || 1;
  for (let i = 1; i < cur; i++) {
    if (bc.switchRequested || bc.menuRequested) return;
    let data;
    try {
      data = await api.fetchRelay(gameId, i, finished);
    } catch (e) {
      debug(`backfill inn ${i} failed`, e.message);
      if (config.verbose) warn(`backfill failed inning ${i}: ${e.message}`);
      continue;
    }
    bc.ingestRelay(data);
    bc.status = t.loadingHistoryAt(i);
    render(bc);
  }
  if (bc.switchRequested || bc.menuRequested) return;
  bc.ingestRelay(curRelay);
}

function finish(bc, kind) {
  const t = i18n.t;
  const gs = bc.gs || {};
  bc.ended = true;
  bc.addLine('end', kind === 'replay' ? t.replayEnded : t.liveEnded, C.bgreen);
  bc.addLine('end', `${C.bold}${t.finalScore({
    away: bc.meta.away?.name, ascore: gs.awayScore ?? '-',
    home: bc.meta.home?.name, hscore: gs.homeScore ?? '-',
  })}${C.reset}`, C.byellow);
  render(bc);
}

function attachSidePanels(bc, game, api) {
  if (game.stadium) {
    api.fetchWeather(game.stadium).then((w) => {
      if (w) {
        bc.weather = w;
        render(bc);
      }
    }).catch((e) => debug('weather failed', e.message));
  }
  if (game.gameId) {
    api.fetchPreview(game.gameId).then((p) => {
      if (p) {
        bc.preview = p;
        render(bc);
      }
    }).catch((e) => debug('preview failed', e.message));
    api.fetchRecord(game.gameId).then((r) => {
      if (r) {
        bc.record = r;
        render(bc);
      }
    }).catch((e) => debug('record failed', e.message));
  }
}

async function runLive(bc, game, opts, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  bc.status = t.waitingFeed;
  render(bc);
  attachSidePanels(bc, game, api);

  const started = await waitForStart(bc, game, opts, api);
  if (!started || bc.switchRequested || bc.menuRequested) return;

  let first = null;
  for (let i = 0; i < 20 && !first; i++) {
    if (bc.switchRequested || bc.menuRequested) return;
    try {
      first = await api.fetchRelay(game.gameId);
    } catch (e) {
      debug('first relay failed', e.message);
    }
    if (!first) {
      bc.status = t.syncing(i + 1);
      render(bc);
      if (await sleepOrInterrupt(6000, bc)) return;
    }
  }
  if (bc.switchRequested || bc.menuRequested) return;
  if (!first) throw new Error(t.errFeedNotFound);

  if (opts.history !== false) {
    bc.status = t.loadingHistory;
    render(bc);
    await backfillHistory(bc, game.gameId, first, isDone(started), api);
    if (bc.switchRequested || bc.menuRequested) return;
    bc.addLine('info', t.historyDone, C.cyan);
  } else {
    bc.ingestRelay(first, { silent: true });
    bc.addLine('info', t.connectMid({
      away: bc.meta.away?.name, home: bc.meta.home?.name,
      inn: t.innLabel({ inn: bc.inn || 1, half: bc.half }),
    }), C.cyan);
  }
  bc.status = t.statusLive;
  render(bc);

  let poll = 0;
  while (!bc.ended) {
    if (await sleepOrInterrupt(opts.interval * 1000, bc)) break;
    let relay;
    try {
      relay = await api.fetchRelay(game.gameId);
    } catch (e) {
      bc.status = t.errorStatus(e.message);
      render(bc);
      continue;
    }
    if (bc.switchRequested || bc.menuRequested) break;
    if (relay) {
      if (bc.hasGapBefore(relay)) {
        const from = Math.max(1, bc.inn);
        for (let i = from; i < (Number(relay.inn) || from); i++) {
          if (bc.switchRequested || bc.menuRequested) break;
          try {
            bc.ingestRelay(await api.fetchRelay(game.gameId, i));
          } catch (e) {
            debug(`gap backfill inn ${i}`, e.message);
            if (config.verbose) warn(`gap backfill failed inning ${i}: ${e.message}`);
          }
        }
      }
      if (bc.switchRequested || bc.menuRequested) break;
      bc.ingestRelay(relay);
      bc.status = t.statusLive;
      render(bc);
    }
    poll++;
    if (poll % 3 === 0) {
      try {
        const date = opts.date || kstDateStr();
        bc.games = await api.fetchGamesByDate(date);
        render(bc);
      } catch (e) {
        debug('games refresh failed', e.message);
      }
    }
    if (!bc.ended && poll % 6 === 0) {
      try {
        const g = await api.fetchGame(game.gameId);
        if (bc.switchRequested || bc.menuRequested) break;
        if (isDone(g)) {
          try {
            bc.ingestRelay(await api.fetchRelay(game.gameId));
          } catch (e) {
            debug('final relay failed', e.message);
          }
          break;
        }
        if (g && g.cancel) {
          bc.addLine('info', t.gameCancelled, C.yellow);
          break;
        }
      } catch (e) {
        debug('status poll failed', e.message);
      }
    }
  }
  if (!bc.switchRequested && !bc.menuRequested) {
    finish(bc, 'live');
  }
}

const PACE = { 0: 1500, 1: 650, 8: 550, 13: 1200, 14: 500, 23: 1300, 24: 1000 };

async function runReplay(bc, game, opts, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  const prevReplay = config.replay;
  config.replay = true;
  try {
    bc.status = t.replayPreparing;
    render(bc);
    attachSidePanels(bc, game, api);

    const latest = await api.fetchRelay(game.gameId);
    if (bc.switchRequested || bc.menuRequested) return;
    if (!latest) {
      throw new Error((game.statusCode === 'BEFORE' || game.statusCode === 'READY') ? t.errNotStarted : t.errFeedNotFound);
    }
    const finished = isDone(game);
    const lastInn = Number(latest.inn) || 1;

    for (let i = 1; i <= lastInn && !bc.ended; i++) {
      if (bc.switchRequested || bc.menuRequested) return;
      let data;
      try {
        data = await api.fetchRelay(game.gameId, i, finished);
      } catch (e) {
        bc.status = t.errorStatus(e.message);
        render(bc);
        continue;
      }
      if (!data) continue;
      bc.status = t.statusReplay;
      const evs = Broadcast.flatten(data).filter((e) => e.seq > bc.lastSeq);
      bc.absorbMeta(data);
      for (const ev of evs) {
        if (bc.switchRequested || bc.menuRequested) return;
        bc.ingestRelay({
          textRelays: [{
            inn: ev.inn,
            homeOrAway: ev.ha,
            textOptions: [{
              seqno: ev.seq,
              type: ev.type,
              text: ev.text,
              currentGameState: ev.gs,
              batterRecord: ev.batterRecord,
              speed: ev.speed,
              stuff: ev.stuff,
              pitchResult: ev.pitchResult,
            }],
          }],
        });
        render(bc);
        if (bc.ended) break;
        if (config.pitches || (ev.type !== 1 && ev.type !== 8)) {
          if (await sleepOrInterrupt(Math.max(30, (PACE[ev.type] || 700) / opts.speed), bc)) return;
        }
      }
    }
    if (!bc.switchRequested && !bc.menuRequested) {
      finish(bc, 'replay');
    }
  } finally {
    config.replay = prevReplay;
  }
}

async function showList(opts, deps = {}) {
  const api = { ...defaultApi, ...deps };
  const t = i18n.t;
  const date = opts.date || kstDateStr();
  const games = await api.fetchGamesByDate(date);
  console.log(`\n${C.bold}${t.listTitle(date)}${C.reset}`);
  if (!games.length) {
    console.log(t.noGamesDate(date));
    return;
  }
  const groups = [
    [t.listLive, C.bred, games.filter(isLive)],
    [t.listBefore, C.yellow, games.filter((g) => (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel)],
    [t.listDone, C.gray, games.filter((g) => isDone(g) || g.cancel)],
  ];
  for (const [label, col, list] of groups) {
    console.log(`\n${col}${C.bold}${label}${C.reset}`);
    if (!list.length) {
      console.log(t.listNone);
      continue;
    }
    for (const g of list) {
      const score = (g.statusCode === 'BEFORE' || g.statusCode === 'READY')
        ? new Date(g.gameDateTime).toLocaleTimeString(t.dateLocale, { hour: '2-digit', minute: '2-digit' })
        : `${g.awayTeamScore ?? '-'}:${g.homeTeamScore ?? '-'}`;
      const status = g.cancel ? t.gameCancelled : (g.statusInfo || '');
      console.log(`  ${fg256(TEAM.away)}${g.awayTeamName}${C.reset} ${t.vs} ${fg256(TEAM.home)}${g.homeTeamName}${C.reset}`
        + `  ${C.bold}${score}${C.reset}  ${C.dim}${status}  ${g.stadium}  gameId=${g.gameId}${C.reset}`);
    }
  }
  console.log(t.startHint);
  console.log(t.replayHint);
}

module.exports = {
  ask,
  resolveTarget,
  gameMeta,
  runLive,
  runReplay,
  showList,
  waitForStart,
  backfillHistory,
  isLive,
  isDone,
};
