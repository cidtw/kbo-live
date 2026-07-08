'use strict';

const config = require('./config');
const { padEndW, truncW, mapTeamCode } = require('./util');
const {
  useColor, C, bg, fg256, TEAM, CNT,
  visLen, padEndWColor, truncColor, center,
} = require('./ansi');
const { ic, SEP } = require('./theme');
const { i18n } = require('./i18n');

// 현재 터미널 폭에 맞춤(실제 컬럼 존중, 60~120 clamp)
function termW() { return Math.max(60, Math.min(process.stdout.columns || 96, 120)); }

function printPlainLine(item) {
  const text = item.text.replace(/\x1b\[[0-9;]*m/g, '');
  console.log(`[${item.ts}] ${ic(item.icon)}  ${text}`);
}

// ── 파워라인 세그먼트 헤더 ──
function powerline(segs) {
  let out = '';
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    out += bg(s.c) + fg256(s.fgc) + (s.bold ? C.bold : '') + ' ' + s.t + ' ' + C.reset;
    const nb = segs[i + 1] ? segs[i + 1].c : null;
    out += (nb != null ? bg(nb) : '') + fg256(s.c) + SEP + C.reset;
  }
  return out;
}

function innText(bc) {
  return bc.inn > 0 ? i18n.t.innLabel({ inn: bc.inn, half: bc.half }) : '—';
}

function weatherText(bc) {
  if (!bc.weather) return '';
  const temp = bc.weather.temp;
  const code = bc.weather.code;

  let iconKey = 'sunny';
  if (code >= 1 && code <= 48) {
    iconKey = 'cloudy';
  } else if (code >= 51) {
    iconKey = 'rain';
  }

  const isFahrenheit = config.fahrenheit;
  const displayTemp = isFahrenheit
    ? Math.round(temp * 1.8 + 32)
    : Math.round(temp);
  const unit = isFahrenheit ? '°F' : '°C';

  return ` ${ic(iconKey)} ${displayTemp}${unit}`;
}

function headerBar(bc) {
  const ended = bc.ended;
  const mode = ended ? `${ic('live')} END` : config.replay ? `${ic('live')} REPLAY` : `${ic('live')} LIVE`;
  const modeC = ended ? 244 : config.replay ? 141 : 160;
  const matchup = `${bc.meta.away?.name || '?'} ${i18n.t.vs} ${bc.meta.home?.name || '?'}`;
  const stadiumWeather = `${bc.meta.stadium || ''}${weatherText(bc)}`;
  if (config.theme === 'nerd' && useColor) {
    return ' ' + powerline([
      { t: bc.meta.league || 'KBO', c: 238, fgc: 231, bold: true },
      { t: matchup, c: 236, fgc: 252 },
      { t: `${ic('stadium')} ${stadiumWeather}`, c: 235, fgc: 250 },
      { t: `${ic('clock')} ${innText(bc)}`, c: 234, fgc: 227 },
      { t: mode, c: modeC, fgc: 231, bold: true },
    ]);
  }
  return ` ${C.bold}${bc.meta.league || 'KBO'}${C.reset} ${C.dim}·${C.reset} ${matchup} `
    + `${C.dim}·${C.reset} ${stadiumWeather} ${C.dim}·${C.reset} ${C.byellow}${innText(bc)}${C.reset} `
    + `${C.dim}·${C.reset} ${fg256(modeC)}${C.bold}${mode}${C.reset}`;
}

// ── 이닝 라인스코어 (원정 위, 홈 아래 — 야구 관례) ──
function lineScore(bc, W) {
  const isc = bc.inningScore || { home: {}, away: {} };
  const gs = bc.gs || {};
  const innMax = Math.max(9, ...Object.keys(isc.home || {}).map(Number), ...Object.keys(isc.away || {}).map(Number), bc.inn || 0);
  const CW = 3, LBL = 7;
  const head = ' '.repeat(LBL)
    + Array.from({ length: innMax }, (_, i) => center(`${C.gray}${i + 1}${C.reset}`, CW)).join('')
    + ' ' + ['R', 'H', 'E', 'B'].map((h) => center(`${C.gray}${C.bold}${h}${C.reset}`, CW)).join('');
  const row = (side) => {
    const col = TEAM[side];
    const name = mapTeamCode(bc.meta[side]?.code || bc.meta[side]?.name || side);
    const sc = isc[side] || {};
    const cur = (i) => bc.inn === i && !bc.ended && ((side === 'away') === (bc.half === 'T'));
    let s = `${fg256(col)}${C.bold}${padEndW(truncW(name, LBL - 1), LBL)}${C.reset}`;
    for (let i = 1; i <= innMax; i++) {
      const v = sc[String(i)];
      const cell = v == null || v === '' ? `${C.dim}·${C.reset}` : String(v);
      s += center(cur(i) ? `${fg256(col)}${C.bold}${cell}${C.reset}` : cell === '-' ? `${C.dim}-${C.reset}` : cell, CW);
    }
    const p = side === 'home' ? 'home' : 'away';
    const rheb = [gs[`${p}Score`], gs[`${p}Hit`], gs[`${p}Error`], gs[`${p}BallFour`]]
      .map((v) => center(v == null ? `${C.dim}·${C.reset}` : `${fg256(col)}${C.bold}${v}${C.reset}`, CW)).join('');
    return s + ' ' + rheb;
  };
  return [head, row('away'), row('home')].map((s) => center(s, W));
}

// ── 다이아몬드(주자) + B/S/O 램프 + 현재 투수/타자 ──
function lamps(n, max, col) {
  const k = Math.max(0, Math.min(max, Number(n) || 0));
  return `${fg256(col)}${'●'.repeat(k)}${C.reset}${C.dim}${'○'.repeat(max - k)}${C.reset}`;
}
function diamondBlock(bc, W) {
  const t = i18n.t;
  const gs = bc.gs || {};
  const on = (b) => gs[b] && gs[b] !== '0';
  const base = (b) => on(b) ? `${C.byellow}◆${C.reset}` : `${C.dim}◇${C.reset}`;
  const dia = [
    `    ${base('base2')}    `,
    `  ${base('base3')}   ${base('base1')}  `,
    `    ${C.dim}·${C.reset}    `,
  ];
  const cnt = [
    `${C.gray}B${C.reset} ${lamps(gs.ball, 3, CNT.ball)}`,
    `${C.gray}S${C.reset} ${lamps(gs.strike, 2, CNT.strike)}`,
    `${C.gray}O${C.reset} ${lamps(gs.out, 2, CNT.out)} `,
  ];
  const p = bc.currentPitcher();
  const br = bc.batterNow;
  const pline = p
    ? `${C.gray}${t.pitcherLabel}${C.reset} ${C.bold}${p.name}${C.reset}` +
      (p.ballCount != null ? ` ${C.dim}${t.pitchCount(p.ballCount)}${C.reset}` : '') +
      (p.todayEra != null ? ` ${C.dim}${t.seasonEra(p.seasonEra || p.todayEra)}${C.reset}` : '')
    : '';
  const bname = bc.currentBatterName();
  const bline = bname
    ? `${C.gray}${t.batterLabel}${C.reset} ${C.bold}${bname}${C.reset}` +
      (br && br.pa != null ? ` ${C.dim}${t.todayLine(`${br.hit}-${br.ab}`)}${C.reset}` : '') +
      (br && br.seasonHra != null ? ` ${C.dim}${t.seasonAvg(Number(br.seasonHra).toFixed(3).replace(/^0/, ''))}${C.reset}` : '')
    : '';
  const info = [pline, bline, ''];
  const rows = [];
  for (let i = 0; i < 3; i++) {
    rows.push(center(`${padEndWColor(dia[i], 11)}  ${padEndWColor(cnt[i], 8)}  ${padEndWColor(truncColor(info[i], 40), 40)}`, W));
  }
  return rows;
}

// ── 중계 박스 + 스크롤 ──
function clampView(bc, N) {
  const total = bc.log.length;
  const minB = Math.min(N, total);
  if (bc.viewBottom > total) bc.viewBottom = total;
  if (bc.viewBottom < minB) bc.viewBottom = minB;
}
// delta<0 = 과거로, delta>0 = 최신으로
function scrollBy(bc, delta) {
  const N = bc.viewN, total = bc.log.length;
  if (bc.follow) bc.viewBottom = total;
  bc.viewBottom += delta;
  if (bc.viewBottom >= total) { bc.viewBottom = total; bc.follow = true; }
  else { bc.follow = false; clampView(bc, N); }
}

function commentaryBox(bc, W, N) {
  const inner = W - 4;
  const out = [];
  const total = bc.log.length;
  const end = bc.follow ? total : Math.min(bc.viewBottom, total);
  const start = Math.max(0, end - N);
  const recent = bc.log.slice(start, end);
  const more = start;

  const title = bc.follow
    ? `${C.bold}${i18n.t.commentaryTitle}${C.reset}${C.dim}  ${i18n.t.scrollHint}${C.reset}`
    : `${C.bold}${i18n.t.commentaryTitle}${C.reset}  ${C.byellow}${i18n.t.scrollPast({ end, total })}${C.reset}${C.dim}  ${i18n.t.endHint}${C.reset}`;
  const fill = Math.max(0, W - 5 - visLen(title));
  out.push(`${C.gray}╭─ ${C.reset}${title}${C.gray} ${'─'.repeat(fill)}╮${C.reset}`);

  for (const it of recent) {
    let s = `${C.gray}[${it.ts}]${C.reset} ${ic(it.icon)}  ${it.color}${it.text}${C.reset}`;
    if (visLen(s) > inner) s = truncColor(s, inner) + C.reset;
    out.push(`${C.gray}│${C.reset} ${padEndWColor(s, inner)} ${C.gray}│${C.reset}`);
  }
  for (let i = recent.length; i < N; i++) out.push(`${C.gray}│${C.reset} ${' '.repeat(inner)} ${C.gray}│${C.reset}`);
  const foot = !bc.follow && more > 0 ? `${C.dim}${i18n.t.moreAbove(more)}${C.reset}` : '';
  const fw = Math.max(0, W - 2 - visLen(foot));
  out.push(`${C.gray}╰${'─'.repeat(fw)}${C.reset}${foot}${C.gray}╯${C.reset}`);
  return out;
}

// 낮은 화면용 한 줄 스코어 요약
function compactScore(bc, W) {
  const gs = bc.gs || {};
  const s = `${fg256(TEAM.away)}${C.bold}${bc.meta.away?.code || 'A'} ${gs.awayScore ?? '-'}${C.reset}`
    + `:${fg256(TEAM.home)}${C.bold}${gs.homeScore ?? '-'} ${bc.meta.home?.code || 'H'}${C.reset}`
    + ` ${C.dim}·${C.reset} ${innText(bc)}`
    + ` ${C.dim}·${C.reset} B${gs.ball ?? '-'} S${gs.strike ?? '-'} O${gs.out ?? '-'}`;
  return center(s, W);
}

function gamesBar(bc, W) {
  if (!bc.games || bc.games.length <= 1) return '';

  const items = bc.games.map((g, i) => {
    const isActive = g.gameId === bc.meta.gameId;
    const isDone = g.statusCode === 'RESULT';
    const isBefore = g.statusCode === 'BEFORE' || g.statusCode === 'READY';
    const isLive = !isDone && !isBefore && !g.cancel;

    let scoreOrStatus = '';
    let statusColor = C.gray;

    if (g.cancel) {
      scoreOrStatus = 'Cxl';
      statusColor = C.red;
    } else if (isBefore) {
      try {
        const timeStr = new Date(g.gameDateTime).toLocaleTimeString(i18n.t.dateLocale, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        scoreOrStatus = timeStr;
      } catch (_) {
        scoreOrStatus = '--:--';
      }
      statusColor = C.yellow;
    } else {
      scoreOrStatus = `${g.awayTeamScore ?? '-'}:${g.homeTeamScore ?? '-'}`;
      if (isLive) {
        statusColor = C.bgreen;
      }
    }

    const awayCode = mapTeamCode(g.awayTeamCode) || g.awayTeamName || '?';
    const homeCode = mapTeamCode(g.homeTeamCode) || g.homeTeamName || '?';
    const matchStr = `${awayCode}-${homeCode}`;

    if (isActive) {
      return `${bg(237)}${C.bold}${C.white}▶[${i + 1}] ${matchStr} ${scoreOrStatus}◀${C.reset}`;
    } else {
      return ` [${i + 1}] ${C.white}${matchStr}${C.reset} ${statusColor}${scoreOrStatus}${C.reset} `;
    }
  });

  const joined = items.join(`${C.gray}│${C.reset}`);
  return center(truncColor(joined, W), W);
}

function previewBlock(bc, W) {
  const pd = bc.preview;
  if (!pd) {
    return [
      '',
      center(`${C.dim}Loading preview data...${C.reset}`, W),
      ''
    ];
  }

  const out = [];

  const hName = pd.gameInfo?.hName || bc.meta.home?.name || 'HOME';
  const aName = pd.gameInfo?.aName || bc.meta.away?.name || 'AWAY';
  const hCode = mapTeamCode(pd.gameInfo?.hCode || bc.meta.home?.code || '');
  const aCode = mapTeamCode(pd.gameInfo?.aCode || bc.meta.away?.code || '');

  // 1. Teams & Standings
  const aStd = pd.awayStandings || {};
  const hStd = pd.homeStandings || {};
  const aRankText = aStd.rank ? `${aStd.rank}위 (${aStd.w}승 ${aStd.l}패 ${aStd.d}무)` : '';
  const hRankText = hStd.rank ? `${hStd.rank}위 (${hStd.w}승 ${hStd.l}패 ${hStd.d}무)` : '';
  
  const leftInfo = `${C.bold}${fg256(TEAM.away)}${aCode} ${aName}${C.reset} [${aRankText}]`;
  const rightInfo = `${C.bold}${fg256(TEAM.home)}${hCode} ${hName}${C.reset} [${hRankText}]`;
  out.push(center(`${leftInfo}  ${C.dim}vs${C.reset}  ${rightInfo}`, W));

  // 2. Season Team Stats (ERA / HRA)
  const aTeamStats = `ERA ${aStd.era || '-'}  타율 ${aStd.hra || '-'}`;
  const hTeamStats = `ERA ${hStd.era || '-'}  타율 ${hStd.hra || '-'}`;
  out.push(center(`${C.dim}${aTeamStats}${C.reset}  ${C.gray}│${C.reset}  ${C.dim}${hTeamStats}${C.reset}`, W));

  // 3. Head-to-Head & TV Channel
  const vs = pd.seasonVsResult || {};
  const vsText = vs.aw != null ? `${aName} ${vs.aw}승 ${vs.ad}무 ${vs.hw}승 ${hName}` : '';
  const channelText = bc.meta.broadChannel ? `방송: ${bc.meta.broadChannel}` : '';
  const vsRow = [vsText, channelText].filter(Boolean).join(`  ${C.gray}·${C.reset}  `);
  if (vsRow) {
    out.push(center(`${C.byellow}${vsRow}${C.reset}`, W));
  }
  
  out.push(center(`${C.gray}──────────────────────────────────────────────────────────${C.reset}`, W));

  // 4. Starting Pitchers
  const aStart = pd.awayStarter || {};
  const hStart = pd.homeStarter || {};
  const aStarterName = aStart.playerInfo?.name || '-';
  const hStarterName = hStart.playerInfo?.name || '-';
  
  const aStarterStats = aStart.currentSeasonStats || {};
  const hStarterStats = hStart.currentSeasonStats || {};
  
  const aStarterWLE = aStarterStats.w != null ? `${aStarterStats.w}승 ${aStarterStats.l}패  ERA ${aStarterStats.era}` : '';
  const hStarterWLE = hStarterStats.w != null ? `${hStarterStats.w}승 ${hStarterStats.l}패  ERA ${hStarterStats.era}` : '';

  // Pitch types
  const formatPits = (pits) => {
    if (!pits || !pits.length) return '';
    return pits.slice(0, 2).map(p => `${p.type}(${Math.round(p.pit_rt)}%)`).join(' ');
  };
  const aPits = formatPits(aStart.currentPitKindStats);
  const hPits = formatPits(hStart.currentPitKindStats);

  // VS Opponent stats
  const formatVsOpp = (opp) => {
    if (!opp || !opp.gameCount || opp.gameCount === '0') return '상대전적 없음';
    return `대 ${opp.era} ERA (${opp.gameCount}경)`;
  };
  const aVsOpp = formatVsOpp(aStart.currentSeasonStatsOnOpponents);
  const hVsOpp = formatVsOpp(hStart.currentSeasonStatsOnOpponents);

  // Pitcher formatting: two columns
  const colW = Math.floor((W - 8) / 2);
  
  const pCol1 = `선발: ${C.bold}${aStarterName}${C.reset} (${aStarterWLE})`;
  const pCol2 = `선발: ${C.bold}${hStarterName}${C.reset} (${hStarterWLE})`;
  const pRow1 = pCol1 + ' '.repeat(Math.max(2, colW - visLen(pCol1))) + pCol2;

  const pCol1_2 = `구종: ${aPits || '-'} (${aVsOpp})`;
  const pCol2_2 = `구종: ${hPits || '-'} (${hVsOpp})`;
  const pRow2 = pCol1_2 + ' '.repeat(Math.max(2, colW - visLen(pCol1_2))) + pCol2_2;
  
  out.push('  ' + pRow1, '  ' + pRow2);

  out.push(center(`${C.gray}──────────────────────────────────────────────────────────${C.reset}`, W));

  // 5. Key Players
  const aTop = pd.awayTopPlayer || {};
  const hTop = pd.homeTopPlayer || {};
  const aTopName = aTop.playerInfo?.name || '-';
  const hTopName = hTop.playerInfo?.name || '-';
  
  const aTopStats = aTop.currentSeasonStats || {};
  const hTopStats = hTop.currentSeasonStats || {};
  const aTopStatsText = aTopStats.hra ? `${aTopStats.hra} 타율  ${aTopStats.hr}홈런  ${aTopStats.rbi}타점` : '';
  const hTopStatsText = hTopStats.hra ? `${hTopStats.hra} 타율  ${hTopStats.hr}홈런  ${hTopStats.rbi}타점` : '';

  const kCol1 = `키플레이어: ${C.bold}${aTopName}${C.reset}`;
  const kCol2 = `키플레이어: ${C.bold}${hTopName}${C.reset}`;
  const kRow1 = kCol1 + ' '.repeat(Math.max(2, colW - visLen(kCol1))) + kCol2;

  const kCol1_2 = `시즌기록: ${aTopStatsText}`;
  const kCol2_2 = `시즌기록: ${hTopStatsText}`;
  const kRow2 = kCol1_2 + ' '.repeat(Math.max(2, colW - visLen(kCol1_2))) + kCol2_2;

  out.push('  ' + kRow1, '  ' + kRow2);

  return out;
}

function render(bc) {
  if (!config.gui) return;
  const W = termW();
  const rows = process.stdout.rows || 32;
  const roomy = rows >= 26;
  const showBoard = rows >= 16;
  const out = [headerBar(bc)];
  const bar = gamesBar(bc, W);
  if (bar) out.push(bar);

  if (bc.showPreview) {
    if (showBoard) {
      if (roomy) out.push('');
      out.push(...previewBlock(bc, W));
      if (roomy) out.push('');
    } else {
      out.push(center(`${C.dim}Preview (Low height screen)${C.reset}`, W));
    }
  } else if (bc.gs || bc.inningScore) {
    if (showBoard) {
      if (roomy) out.push('');
      out.push(...lineScore(bc, W));
      if (roomy) out.push('');
      out.push(...diamondBlock(bc, W));
      if (roomy) out.push('');
    } else {
      out.push(compactScore(bc, W));
    }
  } else {
    out.push('', center(`${C.dim}${bc.status}${C.reset}`, W));
  }

  const N = Math.max(3, rows - out.length - 2 - 1 - 1);
  bc.viewN = N;
  out.push(...commentaryBox(bc, W, N));
  out.push(`${C.dim}${i18n.t.footer({ theme: config.theme, W, rows })}${C.reset}`);
  // 커서 홈 → 줄마다 끝 지우기(K) → 아래 남은 줄 지우기(J). 대체 화면 버퍼에서 그리므로 깜빡임 없음.
  process.stdout.write('\x1b[H' + out.map((l) => l + '\x1b[K').join('\n') + '\x1b[J');
}

function formatSelectorItem(g, idx, isSelected) {
  const isDone = g.statusCode === 'RESULT';
  const isBefore = g.statusCode === 'BEFORE' || g.statusCode === 'READY';
  const isLive = !isDone && !isBefore && !g.cancel;

  let statusText = '';
  let statusColor = C.gray;

  if (g.cancel) {
    statusText = 'Cxl';
    statusColor = C.red;
  } else if (isBefore) {
    let timeStr = '--:--';
    try {
      timeStr = new Date(g.gameDateTime).toLocaleTimeString(i18n.t.dateLocale, { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (_) {}
    statusText = `Upcoming (${timeStr})`;
    statusColor = C.yellow;
  } else {
    const score = `${g.awayTeamScore ?? '-'}:${g.homeTeamScore ?? '-'}`;
    if (isLive) {
      statusText = `LIVE ${score}`;
      if (g.statusInfo) {
        statusText += ` (${g.statusInfo})`;
      }
      statusColor = C.bgreen;
    } else {
      statusText = `Finished ${score}`;
      statusColor = C.gray;
    }
  }

  const matchStr = `${g.awayTeamName} vs ${g.homeTeamName}`;
  const padMatch = padEndWColor(`${C.white}${matchStr}${C.reset}`, 28);
  const padStatus = padEndWColor(`${statusColor}${statusText}${C.reset}`, 24);
  const stadiumStr = `${C.dim}${g.stadium || ''}${C.reset}`;

  if (isSelected) {
    return `${bg(237)}${C.bold}${C.white} ▶ [${idx}] ${padMatch} │ ${padStatus} │ ${stadiumStr} ${C.reset}`;
  } else {
    return `   [${idx}] ${padMatch} │ ${padStatus} │ ${stadiumStr}`;
  }
}

function renderSelectorMenu(games, selectedIdx, date) {
  if (!config.gui) return;
  const W = termW();
  const rows = process.stdout.rows || 32;

  const t = i18n.t;
  const out = [];

  const title = ` ${t.menuTitle || 'KBO Match Selector'} `;
  const dateStr = ` ${t.menuDate ? t.menuDate(date) : date} `;
  out.push(center(`${C.bold}${title}${C.reset} ${C.dim}·${C.reset} ${C.byellow}${dateStr}${C.reset}`, W));
  out.push('');

  const leftPad = Math.max(0, Math.floor((W - 74) / 2));
  const padStr = ' '.repeat(leftPad);

  games.forEach((g, i) => {
    const isSelected = i === selectedIdx;
    const itemStr = formatSelectorItem(g, i + 1, isSelected);
    out.push(padStr + itemStr);
  });

  const contentHeight = out.length;
  const padY = Math.max(2, Math.floor((rows - contentHeight - 6) / 2));
  for (let i = 0; i < padY; i++) out.unshift('');
  for (let i = 0; i < padY; i++) out.push('');

  out.push('');
  out.push(center(`${C.dim}─── ${C.reset}${t.menuInstruction || 'Up/Down (k/j) navigate · Enter select · q quit'}${C.dim} ───${C.reset}`, W));
  out.push(C.dim + center(`kbo-live · theme ${config.theme} · ${W}×${rows}`, W) + C.reset);

  process.stdout.write('\x1b[H' + out.map((l) => l + '\x1b[K').join('\n') + '\x1b[J');
}

module.exports = { render, printPlainLine, scrollBy, clampView, termW, renderSelectorMenu };
