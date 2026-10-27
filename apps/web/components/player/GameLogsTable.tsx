'use client';

import React from 'react';
import { GameLogRecord } from '@/lib/domain/playerApi';

interface GameLogsTableProps {
  gameLogs: GameLogRecord[];
}

export default function GameLogsTable({ gameLogs }: GameLogsTableProps) {
  if (!gameLogs || gameLogs.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        최근 일자별 등판 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur shadow-sm">
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          최근 일자별 등판 일지 ({gameLogs.length}경기)
        </h3>
        <span className="text-[11px] text-slate-400">최신순</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
          <thead className="bg-slate-800/95 text-slate-400 font-semibold border-b border-slate-700 select-none">
            <tr>
              <th className="py-2.5 px-3">날짜</th>
              <th className="py-2.5 px-3">상대팀</th>
              <th className="py-2.5 px-3 text-center">결과</th>
              <th className="py-2.5 px-3 text-right">이닝</th>
              <th className="py-2.5 px-3 text-right">투구수</th>
              <th className="py-2.5 px-3 text-right">피안타</th>
              <th className="py-2.5 px-3 text-right">피홈런</th>
              <th className="py-2.5 px-3 text-right">사사구</th>
              <th className="py-2.5 px-3 text-right">탈삼진</th>
              <th className="py-2.5 px-3 text-right">실점</th>
              <th className="py-2.5 px-3 text-right">자책</th>
              <th className="py-2.5 px-3 text-right">ERA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {gameLogs.map((g, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-800/60 transition-colors"
              >
                <td className="py-2.5 px-3 font-semibold text-slate-200">{g.date}</td>
                <td className="py-2.5 px-3 font-sans font-medium text-slate-300">{g.opponent}</td>
                <td className="py-2.5 px-3 text-center font-sans">
                  {g.result ? (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        g.result === '승'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : g.result === '패'
                          ? 'bg-red-950 text-red-300 border border-red-800/60'
                          : g.result === '세'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : g.result === '홀'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {g.result}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2.5 px-3 text-right font-sans font-medium text-slate-200">{g.innings}</td>
                <td className="py-2.5 px-3 text-right font-bold text-white">{g.pitches}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">{g.hits}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">{g.homeRuns}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">{g.walks}</td>
                <td className="py-2.5 px-3 text-right text-blue-300 font-medium">{g.strikeouts}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">{g.runs}</td>
                <td className="py-2.5 px-3 text-right text-slate-400">{g.earnedRuns}</td>
                <td className="py-2.5 px-3 text-right text-slate-300 font-medium">{g.era}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
