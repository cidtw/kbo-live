'use strict';

// English UI strings. NOTE: the relay text itself (pitch-by-pitch commentary)
// is provided by Naver in Korean only — only the UI chrome is translated.
module.exports = {
  dateLocale: 'en-US',
  vs: 'VS',
  homeLabel: 'HOME',
  awayLabel: 'AWAY',

  help: `
kbo-live — live text commentary CLI for the KBO League (unofficial Naver Sports data)

Usage:
  kbo-live                     auto-detect today's live game and start commentary
  kbo-live <team>              today's game of the team (e.g. kbo-live LT)
  kbo-live --list [--date d]   list live / upcoming / finished games
  kbo-live --game-id <id>      commentate a specific game
  kbo-live --replay <gameId>   replay a finished game from the start

Options:
  --date <YYYY-MM-DD|MMDD>  target date (default: today, KST)
  --locale <hl>             display language (default ko-KR)
  --interval <sec>          live polling interval (default 10, min 5)
  --speed <n>               replay speed multiplier (default 1 ≈ 0.7s per pitch)
  --no-history              skip past-innings restore on connect
  --no-pitches              hide per-pitch lines (ball/strike), results only
  --no-cache                disable local caching of completed innings
  --no-gui                  log only, no scoreboard (for pipes)
  --fahrenheit | -f         show temperatures in Fahrenheit (default Celsius)
  --nerd | --emoji | --ascii  icon theme (default nerd = needs a Nerd Font)

Controls (GUI): arrows scroll · PageUp/PageDn (Space) · Home/End (g/G latest) · q/Ctrl+C quit

Note: relay text is Korean only (source: Naver Sports).
`.trim(),

  connecting: 'Connecting…',
  waitingFeed: 'Waiting for relay feed…',
  loadingHistory: 'Restoring past innings…',
  loadingHistoryAt: (inn) => `Restoring history… (inning ${inn})`,
  historyDone: 'History restored — starting live commentary',
  statusLive: 'LIVE',
  statusReplay: 'Replaying',
  replayPreparing: 'Preparing replay…',
  errorStatus: (msg) => `Error: ${msg} — retrying`,
  syncing: (n) => `Syncing feed… (${n})`,
  waitingStart: (t) => `Waiting for first pitch — scheduled ${t}`,
  gameCancelled: 'Game cancelled',
  gameEndedMsg: 'Game over',
  liveEnded: 'The game has ended. Thanks for watching!',
  replayEnded: 'Replay finished',
  finalScore: ({ away, ascore, home, hscore }) => `FINAL  ${away} ${ascore} : ${hscore} ${home}`,

  listLive: '● LIVE',
  listBefore: '○ Upcoming',
  listDone: '· Finished',
  listNone: '  (none)',
  listTitle: (d) => `KBO League — ${d}`,
  startHint: '\nStart commentary:  kbo-live <team>   or  kbo-live --game-id <id>',
  replayHint: 'Replay:  kbo-live --replay <gameId>',
  noLiveNow: 'No KBO game is live right now.',
  noGamesDate: (d) => `No KBO games on ${d}.`,
  multiLive: 'Multiple live games. Pick a number:',
  pickLiveNum: 'Number (default 1): ',
  confirmReplayLatest: ({ away, home }) => `Replay the latest finished game ${away} vs ${home}? [Y/n] `,
  teamNotFound: (q) => `No game today matching '${q}'. Try --list.`,
  errGameNotFound: 'Game not found. Check the gameId.',
  errFeedNotFound: 'No text relay data found for this game.',
  errNotStarted: 'The game has not started yet. Check the schedule with --list.',

  innLabel: ({ inn, half }) => `${half === 'T' ? 'T' : 'B'}${inn}`,
  tsLabel: ({ inn, half }) => `${half === 'T' ? '▲' : '▼'}${String(inn).padStart(2)}`,
  tsNone: '---',

  scoreTag: ({ a, h }) => ` (${a}:${h})`,
  batterUp: null,
  connectMid: ({ away, home, inn }) => `${away} vs ${home} — joined in progress (${inn})`,
  connectStart: ({ away, home }) => `${away} vs ${home} — waiting for first pitch`,

  commentaryTitle: 'COMMENTARY',
  scrollHint: 'arrows scroll · [1-9]/←→ switch · p preview · m menu · q quit',
  endHint: 'G latest',
  scrollPast: ({ end, total }) => `viewing past ${end}/${total}`,
  moreAbove: (n) => ` ↑ ${n} more `,
  pitcherLabel: 'P',
  batterLabel: 'AB',
  pitchCount: (n) => `${n}p`,
  todayLine: (s) => `today ${s}`,
  seasonAvg: (v) => `AVG ${v}`,
  seasonEra: (v) => `ERA ${v}`,
  baseEmpty: 'bases empty',
  footer: ({ theme, W, rows }) => ` kbo-live · theme ${theme} · ${W}×${rows} · unofficial fan project (data: Naver Sports)`,
  endBanner: '— end of commentary —',
  errorLabel: 'Error',
  menuTitle: 'KBO Match Selector',
  menuInstruction: 'Up/Down (k/j) navigate · Enter select · q quit',
  menuDate: (d) => `Date: ${d}`,
};
