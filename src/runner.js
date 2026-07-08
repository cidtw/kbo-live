'use strict';

const readline = require('readline');
const config = require('./config');
const { C, fg256, TEAM } = require('./ansi');
const { sleep, sleepOrInterrupt, kstDateStr } = require('./util');
const { fetchGamesByDate, fetchGame, fetchRelay, fetchWeather } = require('./api');
const { Broadcast } = require('./broadcast');
const { render } = require('./render');
const { i18n } = require('./i18n');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); });
  });
}

const isLive = (g) => g && !g.cancel && g.statusCode !== 'BEFORE' && g.statusCode !== 'READY' && g.statusCode !== 'RESULT';
const isDone = (g) => g && g.statusCode === 'RESULT';

function gameMeta(g) {
  return {
    gameId: g.gameId,
    league: g.categoryName || 'KBO리그',
    stadium: g.stadium || '',
    startTime: g.gameDateTime,
    home: { code: g.homeTeamCode, name: g.homeTeamName },
    away: { code: g.awayTeamCode, name: g.awayTeamName },
  };
}

function matchTeam(g, q) {
  const s = String(q).toLowerCase();
  return [g.homeTeamCode, g.homeTeamName, g.awayTeamCode, g.awayTeamName]
    .some((v) => v && String(v).toLowerCase().includes(s));
}

// 중계 대상 경기 결정 → { game, replay, menu, games }
async function resolveTarget(opts) {
  const t = i18n.t;
  if (opts.gameId) {
    const g = await fetchGame(opts.gameId);
    if (!g) throw new Error(t.errGameNotFound);
    return { game: g, replay: opts.replay || (opts.replayWanted && isDone(g)) };
  }
  const date = opts.date || kstDateStr();
  const games = await fetchGamesByDate(date);
  if (!games.length) throw new Error(t.noGamesDate(date));

  // If the user did not specify a team and is in GUI/interactive terminal mode, trigger menu selector!
  if (!opts.team && !opts.replay && config.gui && process.stdin.isTTY && process.stdout.isTTY) {
    return { menu: true, games };
  }

  let pool = games;
  if (opts.team) {
    pool = games.filter((g) => matchTeam(g, opts.team));
    if (!pool.length) throw new Error(t.teamNotFound(opts.team));
  }

  // --replay (id 없이): 대상 풀에서 최근 종료 경기
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

  // 라이브 없음: 팀을 지정했고 경기 전이면 시작 대기 모드로 진행
  const before = pool.filter((g) => (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel);
  if (opts.team && before.length) return { game: before[0], replay: false };

  // 자동 탐색 실패 → 최근 종료 경기 리플레이 제안
  console.log(`${C.yellow}${t.noLiveNow}${C.reset}`);
  const done = pool.filter(isDone);
  if (done.length && process.stdin.isTTY) {
    const g = done[done.length - 1];
    const ans = await ask(t.confirmReplayLatest({ away: g.awayTeamName, home: g.homeTeamName }));
    if (ans.toLowerCase() !== 'n') return { game: g, replay: true };
  }
  console.log(t.startHint);
  console.log(t.replayHint);
  process.exit(before.length ? 0 : 1);
}

// 경기 전이면 시작까지 대기 (30초 간격 상태 폴링)
async function waitForStart(bc, game, opts) {
  const t = i18n.t;
  let g = game;
  while (g && (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel) {
    const when = new Date(g.gameDateTime).toLocaleTimeString(t.dateLocale, { hour: '2-digit', minute: '2-digit' });
    bc.status = t.waitingStart(when);
    render(bc);
    if (!config.gui) console.log(bc.status);
    if (await sleepOrInterrupt(30 * 1000, bc)) return null;
    try { g = await fetchGame(game.gameId); } catch (_) {}
  }
  if (g && g.cancel) { bc.addLine('info', t.gameCancelled, C.yellow); render(bc); return null; }
  return g || game;
}

// 접속 시 1회부터 현재 이닝까지 복원. relay(i)는 완료 이닝이면 캐시를 탄다.
async function backfillHistory(bc, gameId, curRelay, finished) {
  const t = i18n.t;
  const cur = Number(curRelay?.inn) || 1;
  for (let i = 1; i < cur; i++) {
    if (bc.switchRequested || bc.menuRequested) return;
    let data;
    try { data = await fetchRelay(gameId, i, finished); } catch (_) { continue; }
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

async function runLive(bc, game, opts) {
  const t = i18n.t;
  bc.status = t.waitingFeed;
  render(bc);

  if (game.stadium) {
    fetchWeather(game.stadium).then(w => {
      if (w) {
        bc.weather = w;
        render(bc);
      }
    }).catch(() => {});
  }

  const started = await waitForStart(bc, game, opts);
  if (!started || bc.switchRequested || bc.menuRequested) return;

  // 첫 relay 확보 (경기 직후엔 피드가 늦을 수 있음 → 재시도)
  let first = null;
  for (let i = 0; i < 20 && !first; i++) {
    if (bc.switchRequested || bc.menuRequested) return;
    try { first = await fetchRelay(game.gameId); } catch (_) {}
    if (!first) { bc.status = t.syncing(i + 1); render(bc); if (await sleepOrInterrupt(6000, bc)) return; }
  }
  if (bc.switchRequested || bc.menuRequested) return;
  if (!first) throw new Error(t.errFeedNotFound);

  if (opts.history !== false) {
    bc.status = t.loadingHistory;
    render(bc);
    await backfillHistory(bc, game.gameId, first, isDone(started));
    if (bc.switchRequested || bc.menuRequested) return;
    bc.addLine('info', t.historyDone, C.cyan);
  } else {
    bc.ingestRelay(first, { silent: true }); // 무음 베이스라인
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
    try { relay = await fetchRelay(game.gameId); }
    catch (e) { bc.status = t.errorStatus(e.message); render(bc); continue; }
    if (bc.switchRequested || bc.menuRequested) break;
    if (relay) {
      // 이닝 경계에서 폴링이 놓친 구간(seqno 공백) → 지난 이닝 재수집으로 메꾼다
      if (bc.hasGapBefore(relay)) {
        const from = Math.max(1, bc.inn);
        for (let i = from; i < (Number(relay.inn) || from); i++) {
          if (bc.switchRequested || bc.menuRequested) break;
          try { bc.ingestRelay(await fetchRelay(game.gameId, i)); } catch (_) {}
        }
      }
      if (bc.switchRequested || bc.menuRequested) break;
      bc.ingestRelay(relay);
      bc.status = t.statusLive;
      render(bc);
    }
    poll++;
    // Every 3 polls (approx 30s), refresh the games list of the day to update scores of other games
    if (poll % 3 === 0) {
      try {
        const date = opts.date || kstDateStr();
        bc.games = await fetchGamesByDate(date);
        render(bc);
      } catch (_) {}
    }
    // 문자중계에 종료 문구가 없을 때를 대비해 주기적으로 경기 상태도 확인
    if (!bc.ended && poll % 6 === 0) {
      try {
        const g = await fetchGame(game.gameId);
        if (bc.switchRequested || bc.menuRequested) break;
        if (isDone(g)) {
          try { bc.ingestRelay(await fetchRelay(game.gameId)); } catch (_) {}
          break;
        }
        if (g && g.cancel) { bc.addLine('info', t.gameCancelled, C.yellow); break; }
      } catch (_) {}
    }
  }
  if (!bc.switchRequested && !bc.menuRequested) {
    finish(bc, 'live');
  }
}

// 이벤트 type별 재생 템포(ms). --speed 로 나눈다.
const PACE = { 0: 1500, 1: 650, 8: 550, 13: 1200, 14: 500, 23: 1300, 24: 1000 };

async function runReplay(bc, game, opts) {
  const t = i18n.t;
  config.replay = true;
  bc.status = t.replayPreparing;
  render(bc);

  if (game.stadium) {
    fetchWeather(game.stadium).then(w => {
      if (w) {
        bc.weather = w;
        render(bc);
      }
    }).catch(() => {});
  }

  const latest = await fetchRelay(game.gameId);
  if (bc.switchRequested || bc.menuRequested) return;
  if (!latest) throw new Error((game.statusCode === 'BEFORE' || game.statusCode === 'READY') ? t.errNotStarted : t.errFeedNotFound);
  const finished = isDone(game);
  const lastInn = Number(latest.inn) || 1;

  for (let i = 1; i <= lastInn && !bc.ended; i++) {
    if (bc.switchRequested || bc.menuRequested) return;
    let data;
    try { data = await fetchRelay(game.gameId, i, finished); } // 완료 경기는 마지막 이닝까지 캐시에 남는다
    catch (e) { bc.status = t.errorStatus(e.message); render(bc); continue; }
    if (!data) continue;
    bc.status = t.statusReplay;
    // 이벤트 단위로 한 줄씩 재생. ingestRelay 가 seqno 커서로 중복을 걸러준다.
    const evs = Broadcast.flatten(data).filter((e) => e.seq > bc.lastSeq);
    bc._absorbMeta(data);
    for (const ev of evs) {
      if (bc.switchRequested || bc.menuRequested) return;
      bc.ingestRelay({ textRelays: [{ inn: ev.inn, homeOrAway: ev.ha, textOptions: [{ seqno: ev.seq, type: ev.type, text: ev.text, currentGameState: ev.gs, batterRecord: ev.batterRecord }] }] });
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
}

async function showList(opts) {
  const t = i18n.t;
  const date = opts.date || kstDateStr();
  const games = await fetchGamesByDate(date);
  console.log(`\n${C.bold}${t.listTitle(date)}${C.reset}`);
  if (!games.length) { console.log(t.noGamesDate(date)); return; }
  const groups = [
    [t.listLive, C.bred, games.filter(isLive)],
    [t.listBefore, C.yellow, games.filter((g) => (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel)],
    [t.listDone, C.gray, games.filter((g) => isDone(g) || g.cancel)],
  ];
  for (const [label, col, list] of groups) {
    console.log(`\n${col}${C.bold}${label}${C.reset}`);
    if (!list.length) { console.log(t.listNone); continue; }
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

module.exports = { ask, resolveTarget, gameMeta, runLive, runReplay, showList, waitForStart, backfillHistory };
