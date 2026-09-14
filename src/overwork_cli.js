'use strict';

const https = require('https');
const { C } = require('./ansi');
const { padEndW, padStartW, truncW, kstDateStr, addDays, mapTeamCode } = require('./util');

const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://m.sports.naver.com/' }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(null);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function parseInningToOuts(innStr) {
  if (!innStr) return 0;
  const s = String(innStr).trim();
  if (!s || s === '0') return 0;
  if (/^\d+$/.test(s)) return parseInt(s, 10) * 3;
  let full = 0, frac = s;
  const parts = s.split(/\s+/);
  if (parts.length === 2) {
    full = parseInt(parts[0], 10) || 0;
    frac = parts[1];
  }
  let partial = 0;
  if (frac === '⅔' || frac === '2/3') partial = 2;
  else if (frac === '⅓' || frac === '1/3') partial = 1;
  return full * 3 + partial;
}

function formatOutsToInning(outs) {
  if (!outs || outs <= 0) return '0';
  const full = Math.floor(outs / 3);
  const rem = outs % 3;
  const frac = rem === 2 ? '⅔' : rem === 1 ? '⅓' : '';
  if (full === 0) return frac || '0';
  return frac ? `${full} ${frac}` : `${full}`;
}

function daysBetween(d1, d2) {
  const t1 = new Date(d1 + 'T00:00:00Z').getTime();
  const t2 = new Date(d2 + 'T00:00:00Z').getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

async function showOverworkReport(opts) {
  const toDate = opts.date || kstDateStr();
  const fromDate = addDays(toDate, -13); // 최근 14일
  const targetTeam = opts.team ? mapTeamCode(opts.team) : null;

  console.log(`\n${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   ⚾ KBO 투수 혹사 지수 (Overwork Index) 리포트                                   ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   기간: ${fromDate} ~ ${toDate} (최근 14일) ${targetTeam ? `| 대상 구단: ${targetTeam}` : '| 전체 10개 구단'}                         ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

  process.stdout.write(`${C.dim}데이터 크롤링 및 혹사 지수 계산 중...${C.reset}`);

  // 날짜 목록
  const dates = [];
  let cur = fromDate;
  while (cur <= toDate) {
    dates.push(cur);
    cur = addDays(cur, 1);
  }

  // 1. 경기 목록
  const games = [];
  for (const d of dates) {
    const res = await getJSON(`${GW}/schedule/games?fields=basic,schedule,baseball&upperCategoryId=kbaseball&categoryId=kbo&fromDate=${d}&toDate=${d}&size=50`);
    const gList = res?.result?.games || [];
    for (const g of gList) {
      if (g.statusCode === 'RESULT' && g.gameId) games.push(g);
    }
  }

  // 2. 투수별 등판 수집
  const pitcherMap = new Map();
  for (const g of games) {
    const recRes = await getJSON(`${GW}/schedule/games/${encodeURIComponent(g.gameId)}/record`);
    const box = recRes?.result?.recordData?.pitchersBoxscore;
    if (!box) continue;

    const gameDate = g.gameDate || g.startDate?.slice(0, 10) || fromDate;
    const homeTeam = mapTeamCode(g.homeTeamCode || g.homeTeamName);
    const awayTeam = mapTeamCode(g.awayTeamCode || g.awayTeamName);

    const processTeam = (list, myTeam, oppTeam) => {
      (list || []).forEach((p, idx) => {
        if (!p.pcode) return;
        if (!pitcherMap.has(p.pcode)) pitcherMap.set(p.pcode, []);
        pitcherMap.get(p.pcode).push({
          gameId: g.gameId,
          date: gameDate,
          team: myTeam,
          opponent: oppTeam,
          order: idx + 1,
          raw: p
        });
      });
    };

    processTeam(box.away, awayTeam, homeTeam);
    processTeam(box.home, homeTeam, awayTeam);
  }

  process.stdout.write(`\r                                                  \r`);

  // 3. 혹사 지수 계산
  const analyzed = [];
  for (const [pcode, apps] of pitcherMap.entries()) {
    apps.sort((a, b) => a.date.localeCompare(b.date));
    const last = apps[apps.length - 1];
    const team = last.team;

    if (targetTeam && team !== targetTeam) continue;

    let starts = 0, reliefs = 0, totalOuts = 0, totalPitches = 0;
    let twoDaysInRow = 0, threeDaysInRow = 0, consecutive = 1;
    let multiInningCount = 0;

    for (let i = 0; i < apps.length; i++) {
      const c = apps[i];
      const prev = i > 0 ? apps[i - 1] : null;
      const outs = parseInningToOuts(c.raw.inn);
      const np = Number(c.raw.bf) || 0;
      const isRelief = c.order > 1;

      if (isRelief) reliefs++;
      else starts++;

      totalOuts += outs;
      totalPitches += np;
      if (isRelief && outs > 3) multiInningCount++;

      if (prev) {
        const diff = daysBetween(prev.date, c.date);
        if (diff === 1 || diff === 0) {
          consecutive++;
          if (consecutive === 2) twoDaysInRow++;
          if (consecutive >= 3) threeDaysInRow++;
        } else {
          consecutive = 1;
        }
      }
    }

    const lastDateDiff = daysBetween(last.date, toDate);
    const curConsecutive = lastDateDiff <= 1 ? consecutive : 0;

    let np3d = 0, np7d = 0, g7d = 0;
    for (const a of apps) {
      const diff = daysBetween(a.date, toDate);
      const np = Number(a.raw.bf) || 0;
      if (diff >= 0 && diff <= 3) np3d += np;
      if (diff >= 0 && diff <= 7) { np7d += np; g7d++; }
    }

    // 혹사 점수
    let score = (twoDaysInRow * 7) + (threeDaysInRow * 15);
    if (curConsecutive === 2) score += 8;
    if (curConsecutive >= 3) score += 18;
    score = Math.min(35, score);

    let strain = 0;
    if (np3d >= 65) strain += 25;
    else if (np3d >= 50) strain += 18;
    else if (np3d >= 35) strain += 10;
    if (np7d >= 100) strain += 15;
    else if (np7d >= 80) strain += 10;
    if (g7d >= 4) strain += 8;
    score += Math.min(35, strain);

    score += Math.min(15, multiInningCount * 4);
    score = Math.min(100, Math.round(score));

    let statusLabel = '정상', statusColor = C.green;
    if (score >= 85) { statusLabel = '혹사'; statusColor = C.magenta + C.bold; }
    else if (score >= 70) { statusLabel = '위험'; statusColor = C.red + C.bold; }
    else if (score >= 50) { statusLabel = '경고'; statusColor = C.yellow + C.bold; }
    else if (score >= 30) { statusLabel = '주의'; statusColor = C.yellow; }

    analyzed.push({
      pcode,
      name: last.raw.name,
      team,
      role: starts > reliefs ? '선발' : '불펜',
      score,
      statusLabel,
      statusColor,
      consecutive: curConsecutive,
      twoDaysInRow,
      threeDaysInRow,
      np3d,
      np7d,
      games: apps.length,
      innStr: formatOutsToInning(totalOuts),
      totalPitches,
      multiInningCount
    });
  }

  analyzed.sort((a, b) => b.score - a.score);

  // 테이블 헤더 렌더링
  console.log(`${C.bold}순위  구단   선수명        보직  혹사지수   등급   연투   3일구  7일구  등판  이닝    투구수  멀티${C.reset}`);
  console.log(`${C.dim}───────────────────────────────────────────────────────────────────────────────────${C.reset}`);

  const displayList = analyzed.slice(0, 25);
  displayList.forEach((p, idx) => {
    const rank = padStartW(String(idx + 1), 3);
    const team = padEndW(p.team, 5);
    const name = padEndW(p.name, 10);
    const role = padEndW(p.role, 4);
    const score = padStartW(String(p.score), 4);
    const status = padEndW(p.statusColor + p.statusLabel + C.reset, 8);
    const con = p.consecutive >= 2 ? `${C.red}${p.consecutive}연투${C.reset}` : `${p.twoDaysInRow > 0 ? p.twoDaysInRow + '회' : '-'}`;
    const conStr = padStartW(con, 5);
    const np3d = padStartW(String(p.np3d), 6);
    const np7d = padStartW(String(p.np7d), 6);
    const g = padStartW(String(p.games), 4);
    const inn = padStartW(p.innStr, 7);
    const np = padStartW(String(p.totalPitches), 6);
    const multi = padStartW(String(p.multiInningCount), 4);

    console.log(`${rank}  ${team}  ${name}  ${role}  ${score}점  ${status}  ${conStr}  ${np3d}  ${np7d}  ${g}  ${inn}  ${np}  ${multi}`);
  });

  console.log(`${C.dim}───────────────────────────────────────────────────────────────────────────────────${C.reset}`);
  console.log(`\n${C.dim}💡 총 ${analyzed.length}명 투수 집계 완료.`);
  console.log(`💡 웹 대시보드에서 인터랙티브 테이블 및 일별 차트 보기: ${C.cyan}http://localhost:3000/pitchers${C.reset}\n`);
}

module.exports = { showOverworkReport };
