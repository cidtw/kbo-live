'use client';

import React, { useState } from 'react';
import { PitcherOuting } from '@/lib/types/baseball';

interface PitcherSelectorProps {
  homeTeamName: string;
  awayTeamName: string;
  homePitchers: PitcherOuting[];
  awayPitchers: PitcherOuting[];
  selectedPitcherId: string;
  onSelectPitcher: (pitcher: PitcherOuting) => void;
}

export const PitcherSelector: React.FC<PitcherSelectorProps> = ({
  homeTeamName,
  awayTeamName,
  homePitchers,
  awayPitchers,
  selectedPitcherId,
  onSelectPitcher,
}) => {
  const [activeSide, setActiveSide] = useState<'home' | 'away'>('home');

  const currentList = activeSide === 'home' ? homePitchers : awayPitchers;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <span>등판 투수 선택</span>
          <span className="text-xs font-normal text-slate-400">
            (선발 및 계투진 실시간 순서)
          </span>
        </h2>

        {/* Team Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSide('home')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeSide === 'home'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {homeTeamName} ({homePitchers.length}명)
          </button>
          <button
            onClick={() => setActiveSide('away')}
            className={`px-3 py-1 rounded-lg font-semibold transition ${
              activeSide === 'away'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {awayTeamName} ({awayPitchers.length}명)
          </button>
        </div>
      </div>

      {/* Pitchers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {currentList.map((pitcher) => {
          const isSelected = pitcher.pitcherId === selectedPitcherId;
          const { boxscore, isStarter, appearanceOrder, decision } = pitcher;

          return (
            <button
              key={pitcher.pitcherId}
              onClick={() => onSelectPitcher(pitcher)}
              className={`text-left p-3 rounded-xl border transition relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-white ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-300 hover:border-slate-700'
              }`}
            >
              {/* Header inside card */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isStarter ? '선' : `${appearanceOrder}`}
                  </div>
                  <div>
                    <div className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                      <span>{pitcher.pitcherName}</span>
                      {decision && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                            decision === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : decision === 'L'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : decision === 'SAVE'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {decision}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isStarter ? '선발등판' : `${appearanceOrder}번째 투수`}
                    </span>
                  </div>
                </div>

                {/* Pitch count badge */}
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-200">
                    {boxscore.bf}구
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    {boxscore.inn || '0'}이닝
                  </span>
                </div>
              </div>

              {/* Mini Stats row */}
              <div className="flex items-center justify-between text-[11px] bg-slate-950/60 px-2 py-1 rounded-lg text-slate-400 border border-slate-800/80">
                <div>
                  <span className="text-slate-500">K:</span>{' '}
                  <span className="text-slate-200 font-semibold">{boxscore.kk}</span>
                </div>
                <div>
                  <span className="text-slate-500">BB:</span>{' '}
                  <span className="text-slate-200 font-semibold">{boxscore.bb}</span>
                </div>
                <div>
                  <span className="text-slate-500">실점:</span>{' '}
                  <span
                    className={`font-semibold ${
                      boxscore.er > 0 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {boxscore.er}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">S%:</span>{' '}
                  <span className="text-slate-200 font-semibold">
                    {boxscore.strikePercent}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
