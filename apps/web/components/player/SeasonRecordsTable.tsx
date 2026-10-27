'use client';

import React from 'react';
import { SeasonRecord } from '@/lib/domain/playerApi';

interface SeasonRecordsTableProps {
  seasons: SeasonRecord[];
}

export default function SeasonRecordsTable({ seasons }: SeasonRecordsTableProps) {
  if (!seasons || seasons.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        시즌별 통산 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur shadow-sm">
      <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          시즌별 통산 기록 (Season History)
        </h3>
        <span className="text-[11px] text-slate-400">정규시즌 공식 기록</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
          <thead className="bg-slate-800/95 text-slate-400 font-semibold border-b border-slate-700 select-none">
            <tr>
              <th className="py-2.5 px-3 text-center w-16">연도</th>
              <th className="py-2.5 px-3 text-center">팀</th>
              <th className="py-2.5 px-3 text-right">ERA</th>
              <th className="py-2.5 px-3 text-right">경기</th>
              <th className="py-2.5 px-3 text-right">승</th>
              <th className="py-2.5 px-3 text-right">패</th>
              <th className="py-2.5 px-3 text-right">세</th>
              <th className="py-2.5 px-3 text-right">홀</th>
              <th className="py-2.5 px-3 text-right">이닝</th>
              <th className="py-2.5 px-3 text-right">투구수</th>
              <th className="py-2.5 px-3 text-right">피안타</th>
              <th className="py-2.5 px-3 text-right">피홈런</th>
              <th className="py-2.5 px-3 text-right">사사구</th>
              <th className="py-2.5 px-3 text-right">탈삼진</th>
              <th className="py-2.5 px-3 text-right">실점</th>
              <th className="py-2.5 px-3 text-right">자책</th>
              <th className="py-2.5 px-3 text-right">WHIP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {seasons.map((s, idx) => {
              const isCareer = s.year === '통산' || s.year.includes('통산');
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isCareer
                      ? 'bg-blue-950/40 font-bold text-white border-t-2 border-slate-700'
                      : idx % 2 === 0
                      ? 'bg-slate-900/30 hover:bg-slate-800/60'
                      : 'hover:bg-slate-800/60'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-sans font-semibold text-slate-200">
                    {s.year}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    {s.team ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {s.team}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-400">{s.era}</td>
                  <td className="py-2.5 px-3 text-right text-slate-200">{s.games}</td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">{s.wins}</td>
                  <td className="py-2.5 px-3 text-right text-red-400">{s.losses}</td>
                  <td className="py-2.5 px-3 text-right text-amber-400">{s.saves}</td>
                  <td className="py-2.5 px-3 text-right text-purple-400">{s.holds}</td>
                  <td className="py-2.5 px-3 text-right font-sans font-medium text-slate-200">{s.innings}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{s.pitches}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.hits}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.homeRuns}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.walks}</td>
                  <td className="py-2.5 px-3 text-right text-blue-300 font-medium">{s.strikeouts}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.runs}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{s.earnedRuns}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{s.whip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
