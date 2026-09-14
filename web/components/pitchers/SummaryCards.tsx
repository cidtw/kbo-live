'use client';

import React from 'react';
import { OverworkDatasetResponse, PitcherOverworkData } from '@/lib/domain/types';

interface SummaryCardsProps {
  data: OverworkDatasetResponse | null;
  onSelectPitcher?: (pitcher: PitcherOverworkData) => void;
}

export default function SummaryCards({ data, onSelectPitcher }: SummaryCardsProps) {
  if (!data) return null;

  const { summary } = data;
  const highRiskTotal = (summary.extremeCount || 0) + (summary.dangerCount || 0) + (summary.warningCount || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. 고위험 투수 수 경보 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">관리 대상 고위험군</span>
          <span className="flex h-2.5 w-2.5 relative">
            {highRiskTotal > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${highRiskTotal > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">{highRiskTotal}</span>
          <span className="text-xs text-slate-400">명</span>
        </div>
        <div className="mt-2 text-xs flex gap-2 text-slate-300">
          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
            혹사 {summary.extremeCount}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60">
            위험 {summary.dangerCount}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
            경고 {summary.warningCount}
          </span>
        </div>
      </div>

      {/* 2. 최고 과부하 구단 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">최대 부하 구단</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
            평균 혹사 1위
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-white truncate">
            {summary.highestStrainTeam || '데이터 집계중'}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          불펜 총 투구량 및 연투 빈도 최고 기록
        </p>
      </div>

      {/* 3. 데이터셋 분석 기간 및 총 경기수 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">분석 표본 규모</span>
          <span className="text-xs text-emerald-400">실시간 연동</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">{data.totalGames}</span>
          <span className="text-xs text-slate-400">경기</span>
          <span className="text-slate-600">/</span>
          <span className="text-2xl font-bold text-slate-300">{summary.totalPitchers}</span>
          <span className="text-xs text-slate-400">명 투수</span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {data.dateRange.from} ~ {data.dateRange.to} ({data.dateRange.totalDays}일간)
        </p>
      </div>

      {/* 4. 최상위 혹사 투수 TOP 3 미니 리스트 */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">혹사 지수 TOP 3</span>
          <span className="text-xs text-slate-500">클릭 시 상세</span>
        </div>
        <div className="space-y-1.5 mt-1">
          {summary.topFatiguePitchers?.slice(0, 3).map((p, idx) => (
            <div
              key={p.pcode}
              onClick={() => onSelectPitcher && onSelectPitcher(p)}
              className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-slate-800/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-slate-500 font-mono w-3">{idx + 1}</span>
                <span className="text-slate-300 font-medium truncate">{p.name}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">{p.team}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">{p.recent3DaysPitches}구/3일</span>
                <span className="font-bold text-red-400 font-mono">{p.overworkScore}점</span>
              </div>
            </div>
          ))}
          {(!summary.topFatiguePitchers || summary.topFatiguePitchers.length === 0) && (
            <p className="text-xs text-slate-500">집계 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
