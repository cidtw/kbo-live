'use strict';

const fs = require('fs');
const path = require('path');
const { translateStuff } = require('./util');

function generateReport(bc) {
  const meta = bc.meta || {};
  const rd = bc.record || {};
  const gs = bc.gs || {};
  const isc = bc.inningScore || { home: {}, away: {} };

  let out = '';
  out += `# KBO 경기 보고서 (Game Report)\n\n`;

  // 1. 경기 개요
  out += `## 1. 경기 개요\n`;
  out += `- **경기 ID:** ${meta.gameId || '-'}\n`;
  out += `- **대진:** ${meta.away?.name || '?'} vs ${meta.home?.name || '?'}\n`;
  out += `- **구장:** ${meta.stadium || '-'}\n`;
  if (meta.startTime) {
    try {
      out += `- **시작 시간:** ${new Date(meta.startTime).toLocaleString('ko-KR')}\n`;
    } catch (_) {
      out += `- **시작 시간:** ${meta.startTime}\n`;
    }
  }
  if (bc.weather) {
    const isFahrenheit = require('./config').fahrenheit;
    const temp = bc.weather.temp;
    const displayTemp = isFahrenheit ? Math.round(temp * 1.8 + 32) : Math.round(temp);
    const unit = isFahrenheit ? '°F' : '°C';
    out += `- **날씨:** 기온 ${displayTemp}${unit}\n`;
  }
  out += `\n`;

  // 2. 라인 스코어 (Scoreboard)
  out += `## 2. 라인 스코어\n\n`;
  const innMax = Math.max(9, ...Object.keys(isc.home || {}).map(Number), ...Object.keys(isc.away || {}).map(Number), bc.inn || 0);

  // Table header
  out += `| 팀 |`;
  for (let i = 1; i <= innMax; i++) out += ` ${i} |`;
  out += ` R | H | E | B |\n`;

  // Table separator
  out += `|---|`;
  for (let i = 1; i <= innMax; i++) out += `---|`;
  out += `---|---|---|---|\n`;

  // Rows
  const formatRow = (side, code) => {
    const sc = isc[side] || {};
    const p = side === 'home' ? 'home' : 'away';
    let r = `| **${code}** |`;
    for (let i = 1; i <= innMax; i++) {
      r += ` ${sc[String(i)] ?? '-'} |`;
    }
    r += ` ${gs[`${p}Score`] ?? '-'} | ${gs[`${p}Hit`] ?? '-'} | ${gs[`${p}Error`] ?? '-'} | ${gs[`${p}BallFour`] ?? '-'} |\n`;
    return r;
  };
  out += formatRow('away', meta.away?.name || '원정');
  out += formatRow('home', meta.home?.name || '홈');
  out += `\n`;

  // 3. 경기 요약 및 수상
  out += `## 3. 경기 요약\n`;
  if (rd.pitchingResult && rd.pitchingResult.length > 0) {
    rd.pitchingResult.forEach(p => {
      let role = p.wls === 'W' ? '승리투수' : p.wls === 'L' ? '패전투수' : p.wls === 'S' ? '세이브' : p.wls === 'H' ? '홀드' : '';
      if (role) {
        out += `- **${role}:** ${p.name} (${p.w}승 ${p.l}패${p.s ? ` ${p.s}세` : ''})\n`;
      }
    });
  }
  if (rd.etcRecords && rd.etcRecords.length > 0) {
    out += `\n### 주요 기록\n`;
    rd.etcRecords.forEach(e => {
      out += `- **[${e.how}]** ${e.result}\n`;
    });
  }
  out += `\n`;

  // 4. 타자 박스스코어
  out += `## 4. 타자 박스스코어\n\n`;
  const formatBatters = (list, teamName) => {
    let s = `### ${teamName} 타자\n\n`;
    s += `| 이름 | 포지션 | 타수 | 안타 | 득점 | 타점 | 볼넷 | 삼진 | 타율 |\n`;
    s += `|---|---|---|---|---|---|---|---|---|\n`;
    (list || []).forEach(b => {
      s += `| ${b.name || '-'} | ${b.pos || '-'} | ${b.ab ?? 0} | ${b.hit ?? 0} | ${b.r ?? 0} | ${b.rbi ?? 0} | ${b.bb ?? 0} | ${b.kk ?? 0} | ${b.hra || '.000'} |\n`;
    });
    s += `\n`;
    return s;
  };
  out += formatBatters(rd.battersBoxscore?.away, meta.away?.name || '원정');
  out += formatBatters(rd.battersBoxscore?.home, meta.home?.name || '홈');

  // 5. 투수 박스스코어
  out += `## 5. 투수 박스스코어\n\n`;
  const formatPitchers = (list, teamName) => {
    let s = `### ${teamName} 투수\n\n`;
    s += `| 이름 | 이닝 | 타자수 | 안타 | 홈런 | 볼넷 | 삼진 | 실점 | 자책점 | 방어율 | 투구수 |\n`;
    s += `|---|---|---|---|---|---|---|---|---|---|---|\n`;
    (list || []).forEach(p => {
      s += `| ${p.name || '-'} | ${p.inn || '-'} | ${p.pa ?? p.bf ?? 0} | ${p.hit ?? 0} | ${p.hr ?? 0} | ${p.bb ?? 0} | ${p.kk ?? 0} | ${p.r ?? 0} | ${p.er ?? 0} | ${p.era || '0.00'} | ${p.bf || 0} |\n`;
    });
    s += `\n`;
    return s;
  };
  out += formatPitchers(rd.pitchersBoxscore?.away, meta.away?.name || '원정');
  out += formatPitchers(rd.pitchersBoxscore?.home, meta.home?.name || '홈');

  // 6. 투구 분석 (Pitch Analysis)
  out += `## 6. 투구 분석 (Pitch Analysis)\n\n`;
  const hasStats = Object.keys(bc.pitchStats || {}).length > 0;
  if (!hasStats) {
    out += `*투구 통계 데이터가 없습니다.*\n`;
  } else {
    const writePitcherStats = (list, teamName) => {
      let s = `### ${teamName} 투수 투구 분석\n\n`;
      let count = 0;
      (list || []).forEach(p => {
        if (p.pcode && bc.pitchStats[p.pcode]) {
          count++;
          const name = bc.names[p.pcode] || p.name || p.pcode;
          s += `#### ${name}\n`;
          const stats = bc.pitchStats[p.pcode];
          const ballTypes = Object.keys(stats);
          if (ballTypes.length === 0) {
            s += `* 투구 분석 데이터 없음\n\n`;
            return;
          }
          ballTypes.forEach(stuff => {
            const code = translateStuff(stuff);
            const speeds = stats[stuff];
            const sortedSpeeds = Object.keys(speeds).sort((a, b) => {
              const na = parseInt(a, 10) || 0;
              const nb = parseInt(b, 10) || 0;
              return na - nb;
            });
            const details = sortedSpeeds.map(sp => {
              const st = speeds[sp];
              const spText = sp === 'unknown' ? '?' : `${sp}km/h`;
              return `**${spText}** (스트라이크: ${st.strike}, 볼: ${st.ball}, 타격: ${st.hit}, 합계: ${st.total})`;
            }).join(', ');
            const total = Object.values(speeds).reduce((sum, v) => sum + (v.total || 0), 0);
            s += `- **${stuff} (${code}):** ${details} (총 투구수 ${total})\n`;
          });
          s += `\n`;
        }
      });
      if (count === 0) {
        s += `* 투구 분석 데이터 없음\n\n`;
      }
      return s;
    };
    out += writePitcherStats(rd.pitchersBoxscore?.away, meta.away?.name || '원정');
    out += writePitcherStats(rd.pitchersBoxscore?.home, meta.home?.name || '홈');
  }

  return out;
}

function exportReport(bc) {
  const reportContent = generateReport(bc);
  const gameId = bc.meta?.gameId || 'game';
  const filename = `report_${gameId}.md`;
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, reportContent, 'utf8');
  return { filename, filepath };
}

module.exports = { generateReport, exportReport };
