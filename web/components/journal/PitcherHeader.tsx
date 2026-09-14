'use client';

import React from 'react';
import { PitcherOuting } from '@/lib/types/baseball';

interface PitcherHeaderProps {
  pitcher: PitcherOuting;
}

export const PitcherHeader: React.FC<PitcherHeaderProps> = ({ pitcher }) => {
  const { boxscore, isStarter, appearanceOrder, decision, arsenal, allPitches } = pitcher;

  const speeds = allPitches.map((p) => p.speed).filter((s) => s > 0);
  const maxGameSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgGameSpeed =
    speeds.length > 0
      ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10
      : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Pitcher Identity */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-2xl font-black text-white shadow-inner">
            {pitcher.pitcherName.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-white">
                {pitcher.pitcherName}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {pitcher.teamName}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {isStarter ? '선발 투수' : `${appearanceOrder}번째 구원 투수`}
              </span>
              {decision && (
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                    decision === 'W'
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                      : decision === 'L'
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/20'
                      : decision === 'SAVE'
                      ? 'bg-amber-500 text-slate-950 font-extrabold'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {decision === 'W'
                    ? '승리투수'
                    : decision === 'L'
                    ? '패전투수'
                    : decision === 'SAVE'
                    ? '세이브'
                    : '홀드'}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-3">
              <span>시즌 ERA {boxscore.era || '-'}</span>
              <span>•</span>
              <span className="text-blue-400 font-medium">
                오늘 최고 구속: {maxGameSpeed} km/h (평균 {avgGameSpeed} km/h)
              </span>
            </p>
          </div>
        </div>

        {/* Right: Pitch Count & Strike Ratio Gauge */}
        <div className="flex items-center gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="text-center pr-3 border-r border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              총 투구수
            </span>
            <div className="text-2xl font-black text-white">{boxscore.bf}구</div>
            <span className="text-[10px] text-slate-500">
              S {boxscore.strikes} / B {boxscore.balls}
            </span>
          </div>

          <div className="w-36">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-400">스트라이크 비율</span>
              <span className="text-blue-400 font-bold">{boxscore.strikePercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${boxscore.strikePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>이상적 63%+</span>
              <span>{allPitches.length}개 트래킹</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outing Boxscore Stats Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">이닝 (IP)</span>
          <span className="text-lg font-bold text-slate-100">{boxscore.inn || '-'}</span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">탈삼진 (K)</span>
          <span className="text-lg font-bold text-blue-400">{boxscore.kk}</span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">사사구 (BB)</span>
          <span className="text-lg font-bold text-slate-200">{boxscore.bb}</span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">피안타 (H)</span>
          <span className="text-lg font-bold text-slate-200">{boxscore.hit}</span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">실점 (R)</span>
          <span
            className={`text-lg font-bold ${
              boxscore.r > 0 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {boxscore.r}
          </span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center">
          <span className="text-[11px] text-slate-400 font-medium block">자책점 (ER)</span>
          <span
            className={`text-lg font-bold ${
              boxscore.er > 0 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {boxscore.er}
          </span>
        </div>
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-center col-span-3 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium block">구종 수</span>
          <span className="text-lg font-bold text-indigo-400">{arsenal.length}종류</span>
        </div>
      </div>
    </div>
  );
};
