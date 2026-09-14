'use client';

import React from 'react';
import Link from 'next/link';
import { PitcherOverworkData } from '@/lib/domain/types';

interface PitcherDrawerProps {
  pitcher: PitcherOverworkData | null;
  onClose: () => void;
}

export default function PitcherDrawer({ pitcher, onClose }: PitcherDrawerProps) {
  if (!pitcher) return null;

  const maxDailyPitches = Math.max(10, ...pitcher.appearances.map((a) => a.pitches));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm flex justify-end transition-opacity">
      {/* 바깥 클릭 영역 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 우측 드로어 본체 */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col z-10 overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20 backdrop-blur flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {pitcher.teamName}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800/60">
                {pitcher.roleLabel}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  pitcher.status === 'EXTREME'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                    : pitcher.status === 'DANGER'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : pitcher.status === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : pitcher.status === 'CAUTION'
                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {pitcher.statusLabel} ({pitcher.overworkScore}점)
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
              {pitcher.name}
              <span className="text-sm font-normal text-slate-400 font-mono">#{pitcher.pcode}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              시즌 성적: ERA {pitcher.era} | {pitcher.w}승 {pitcher.l}패 {pitcher.s}세 {pitcher.hld}홀 | {pitcher.inningsStr}이닝 ({pitcher.totalPitches}구)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div className="p-6 space-y-6 flex-grow">
          {/* 1. 혹사 지수 4대 분해 지표 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              혹사 지수 세부 부하 분해 (Overwork Breakdown)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>연투 / 무휴식 페널티</span>
                  <span className="font-bold text-slate-200">{pitcher.breakdown.restPenaltyScore} / 35점</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(pitcher.breakdown.restPenaltyScore / 35) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  2연투 {pitcher.twoDaysInRow}회 / 3연투+ {pitcher.threeDaysInRow}회
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>단기 집중 부하 (3일/7일)</span>
                  <span className="font-bold text-slate-200">{pitcher.breakdown.shortTermStrainScore} / 35점</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(pitcher.breakdown.shortTermStrainScore / 35) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  최근 3일 {pitcher.recent3DaysPitches}구 / 7일 {pitcher.recent7DaysPitches}구
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>구원 멀티이닝 과부하</span>
                  <span className="font-bold text-slate-200">{pitcher.breakdown.multiInningScore} / 15점</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(pitcher.breakdown.multiInningScore / 15) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  1이닝 초과 등판 {pitcher.multiInningReliefCount}회
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>단일 경기 과투구 (PAP)</span>
                  <span className="font-bold text-slate-200">{pitcher.breakdown.papScore} / 15점</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${(pitcher.breakdown.papScore / 15) * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-slate-400">
                  경기당 평균 {pitcher.avgPitchesPerGame}구
                </div>
              </div>
            </div>
          </div>

          {/* 2. 최근 등판 투구수 바 차트 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              등판별 투구 수 추이 (최근 등판순)
            </h3>
            <div className="flex items-end gap-2 h-32 pt-4 px-2 overflow-x-auto">
              {[...pitcher.appearances].reverse().map((app, idx) => {
                const heightPercent = Math.min(100, Math.max(10, (app.pitches / maxDailyPitches) * 100));
                const isOverwork = app.pitches >= 40 || app.consecutiveDays >= 2;

                return (
                  <div key={idx} className="flex flex-col items-center flex-1 min-w-[36px] group">
                    <span className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-white">
                      {app.pitches}
                    </span>
                    <div className="w-full bg-slate-800/80 rounded-t h-20 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all ${
                          app.consecutiveDays >= 3
                            ? 'bg-red-500'
                            : app.consecutiveDays === 2
                            ? 'bg-amber-500'
                            : isOverwork
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                        title={`${app.date}: ${app.pitches}구 (${app.innStr}이닝), ${app.consecutiveDays}연투`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 group-hover:text-slate-300">
                      {app.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. 경기별 상세 등판 로그 테이블 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                경기별 상세 등판 일지 ({pitcher.appearances.length}경기)
              </h3>
              <span className="text-[11px] text-slate-400">최신순</span>
            </div>
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2 px-3">날짜</th>
                    <th className="py-2 px-2">상대</th>
                    <th className="py-2 px-2 text-center">보직</th>
                    <th className="py-2 px-2 text-right">이닝</th>
                    <th className="py-2 px-2 text-right">투구수</th>
                    <th className="py-2 px-2 text-center">휴식일</th>
                    <th className="py-2 px-2 text-center">연투</th>
                    <th className="py-2 px-2 text-right">부하점수</th>
                    <th className="py-2 px-2 text-center">결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {pitcher.appearances.map((app) => (
                    <tr key={app.gameId} className="hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-mono text-slate-300">{app.date}</td>
                      <td className="py-2 px-2">
                        <span className="text-slate-400 font-mono">
                          {app.isHome ? 'vs ' : '@ '}
                          {app.opponent}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-[11px] text-slate-400">
                        {app.order === 1 ? '선발' : `${app.order}구원`}
                      </td>
                      <td className="py-2 px-2 text-right font-medium text-slate-200">{app.innStr}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-white">{app.pitches}</td>
                      <td className="py-2 px-2 text-center font-mono text-slate-400">
                        {app.restDays >= 900 ? '-' : `${app.restDays}일`}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {app.consecutiveDays >= 3 ? (
                          <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                            {app.consecutiveDays}연투
                          </span>
                        ) : app.consecutiveDays === 2 ? (
                          <span className="px-1 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            2연투
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-300">
                        {Math.round(app.gameStrain)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-xs">
                        {app.wls ? (
                          <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">
                            {app.wls}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 선수 전체 프로필 & 통산 기록 바로가기 버튼 */}
          <div className="pt-2 pb-6">
            <Link
              href={`/player/${pitcher.pcode}`}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>⚾</span>
              <span>{pitcher.name} 선수 전체 프로필 & 시즌/상대구단별 기록 보기</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
