'use client';

import React, { useMemo } from 'react';
import { VsTeamRecord } from '@/lib/domain/playerApi';

interface VsTeamRecordsTableProps {
  vsTeams: VsTeamRecord[];
}

export default function VsTeamRecordsTable({ vsTeams }: VsTeamRecordsTableProps) {
  const { bestMatchup, worstMatchup } = useMemo(() => {
    if (!vsTeams || vsTeams.length === 0) return { bestMatchup: null, worstMatchup: null };

    // 이닝이 있는 팀 중에서 최저 ERA와 최고 ERA 산출
    const validTeams = vsTeams.filter((v) => v.innings && v.innings !== '0' && v.era !== '-');
    if (validTeams.length === 0) return { bestMatchup: null, worstMatchup: null };

    const sortedByEra = [...validTeams].sort((a, b) => parseFloat(a.era) - parseFloat(b.era));
    return {
      bestMatchup: sortedByEra[0],
      worstMatchup: sortedByEra[sortedByEra.length - 1],
    };
  }, [vsTeams]);

  if (!vsTeams || vsTeams.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
        상대 구단별 전적 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 상대 구단 강약 분석 하이라이트 배너 */}
      {(bestMatchup || worstMatchup) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bestMatchup && (
            <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  가장 강했던 상대 (천적 구단)
                </span>
                <span className="text-xl font-bold text-white mt-1 block">
                  vs {bestMatchup.teamName}
                </span>
                <span className="text-xs text-slate-300">
                  {bestMatchup.wins}승 {bestMatchup.losses}패 {bestMatchup.saves}세 | {bestMatchup.innings}이닝
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {bestMatchup.era}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  WHIP {bestMatchup.whip}
                </span>
              </div>
            </div>
          )}

          {worstMatchup && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block">
                  가장 고전했던 상대
                </span>
                <span className="text-xl font-bold text-white mt-1 block">
                  vs {worstMatchup.teamName}
                </span>
                <span className="text-xs text-slate-300">
                  {worstMatchup.wins}승 {worstMatchup.losses}패 {worstMatchup.saves}세 | {worstMatchup.innings}이닝
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-red-400 font-mono">
                  {worstMatchup.era}
                </span>
                <span className="text-[11px] text-slate-400 block font-mono">
                  WHIP {worstMatchup.whip}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9개 상대 구단별 전적 테이블 */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur shadow-sm">
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            상대 구단별 전적 (Head-to-Head vs Opponents)
          </h3>
          <span className="text-[11px] text-slate-400">9개 구단 맞춤 성적</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
            <thead className="bg-slate-800/95 text-slate-400 font-semibold border-b border-slate-700 select-none">
              <tr>
                <th className="py-2.5 px-3">상대팀</th>
                <th className="py-2.5 px-3 text-right">ERA</th>
                <th className="py-2.5 px-3 text-center">승-패-세-홀</th>
                <th className="py-2.5 px-3 text-right">이닝</th>
                <th className="py-2.5 px-3 text-right">투구수</th>
                <th className="py-2.5 px-3 text-right">피안타</th>
                <th className="py-2.5 px-3 text-right">피홈런</th>
                <th className="py-2.5 px-3 text-right">사사구</th>
                <th className="py-2.5 px-3 text-right">탈삼진</th>
                <th className="py-2.5 px-3 text-right">자책</th>
                <th className="py-2.5 px-3 text-right">WHIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {vsTeams.map((v, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-2.5 px-3 font-sans font-bold text-white flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                      {v.teamCode}
                    </span>
                    <span>{v.teamName}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-blue-400">{v.era}</td>
                  <td className="py-2.5 px-3 text-center text-slate-300">
                    {v.wins}-{v.losses}-{v.saves}-{v.holds}
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans font-medium text-slate-200">{v.innings}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{v.pitches}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{v.hits}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{v.homeRuns}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{v.walks}</td>
                  <td className="py-2.5 px-3 text-right text-blue-300 font-medium">{v.strikeouts}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{v.earnedRuns}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{v.whip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
