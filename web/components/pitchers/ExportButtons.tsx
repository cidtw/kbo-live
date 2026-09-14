'use client';

import React from 'react';
import { PitcherOverworkData } from '@/lib/domain/types';

interface ExportButtonsProps {
  pitchers: PitcherOverworkData[];
  dateRange: { from: string; to: string };
}

export default function ExportButtons({ pitchers, dateRange }: ExportButtonsProps) {
  const exportCsv = () => {
    if (!pitchers || pitchers.length === 0) return;

    const headers = [
      '순위',
      '구단코드',
      '구단명',
      '선수명',
      '선수코드',
      '보직',
      '혹사지수',
      '위험도등급',
      '현재연투일수',
      '현재휴식일수',
      '2연투횟수',
      '3연투이상횟수',
      '최근3일투구수',
      '최근7일투구수',
      '최근7일등판수',
      '총등판경기수',
      '총소화이닝',
      '소수점이닝',
      '총투구수',
      '경기당평균투구수',
      '이닝당투구수',
      '구원멀티이닝횟수',
      '평균자책점',
      '승',
      '패',
      '세이브',
      '홀드',
    ];

    const rows = pitchers.map((p, idx) => [
      idx + 1,
      p.team,
      p.teamName,
      `"${p.name.replace(/"/g, '""')}"`,
      p.pcode,
      p.roleLabel,
      p.overworkScore,
      p.statusLabel,
      p.currentConsecutiveDays,
      p.currentRestDays,
      p.twoDaysInRow,
      p.threeDaysInRow,
      p.recent3DaysPitches,
      p.recent7DaysPitches,
      p.recent7DaysGames,
      p.games,
      `"${p.inningsStr}"`,
      p.inningsDecimal,
      p.totalPitches,
      p.avgPitchesPerGame,
      p.pitchesPerInning,
      p.multiInningReliefCount,
      p.era,
      p.w,
      p.l,
      p.s,
      p.hld,
    ]);

    // UTF-8 with BOM for Excel compatibility
    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `kbo_pitcher_overwork_${dateRange.from}_${dateRange.to}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!pitchers || pitchers.length === 0) return;
    const jsonStr = JSON.stringify(pitchers, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `kbo_pitcher_overwork_${dateRange.from}_${dateRange.to}.json`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCsv}
        disabled={pitchers.length === 0}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        <span>📥</span>
        <span>CSV 다운로드</span>
      </button>
      <button
        onClick={exportJson}
        disabled={pitchers.length === 0}
        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        <span>📄</span>
        <span>JSON 내보내기</span>
      </button>
    </div>
  );
}
