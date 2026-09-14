'use client';

import React, { useState } from 'react';
import { PlateAppearance, PitchEvent } from '@/lib/types/baseball';
import { getPitchColor } from '@/lib/physics';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AtBatTimelineProps {
  plateAppearances: PlateAppearance[];
  selectedPitch: PitchEvent | null;
  onSelectPitch: (pitch: PitchEvent) => void;
}

export const AtBatTimeline: React.FC<AtBatTimelineProps> = ({
  plateAppearances,
  selectedPitch,
  onSelectPitch,
}) => {
  const [collapsedPAs, setCollapsedPAs] = useState<Record<string, boolean>>({});

  const togglePA = (paId: string) => {
    setCollapsedPAs((prev) => ({
      ...prev,
      [paId]: !prev[paId],
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>타석별 상세 투구 일지 (Plate Appearance Log)</span>
            <span className="text-xs font-normal text-slate-400">
              (총 {plateAppearances.length}타석)
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            상대한 모든 타자의 타석별 투구 시퀀스, 볼카운트 변화 및 최종 결과
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {plateAppearances.map((pa, idx) => {
          const isCollapsed = collapsedPAs[pa.paId];
          const isStrikeout = pa.resultText.includes('삼진');
          const isHit =
            pa.resultText.includes('안타') ||
            pa.resultText.includes('2루타') ||
            pa.resultText.includes('3루타') ||
            pa.resultText.includes('홈런');
          const isWalk = pa.resultText.includes('볼넷') || pa.resultText.includes('사구');

          return (
            <div
              key={pa.paId || idx}
              className="bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden transition"
            >
              <div
                onClick={() => togglePA(pa.paId)}
                className="p-3 flex items-center justify-between hover:bg-slate-850/60 cursor-pointer transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">
                        {pa.inning}회{pa.isBottom ? '말' : '초'} vs {pa.batterName}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {pa.batterStance === 'L' ? '좌타' : '우타'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                      isStrikeout
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : isHit
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isWalk
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {pa.resultText}
                  </span>

                  <span className="text-xs text-slate-500">{pa.pitches.length}구</span>

                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {!isCollapsed && pa.pitches.length > 0 && (
                <div className="p-3 pt-0 border-t border-slate-800/40 bg-slate-900/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 mt-2.5">
                    {pa.pitches.map((pitch) => {
                      const isSelected = selectedPitch?.pts?.pitchId === pitch.pts?.pitchId;
                      const color = getPitchColor(pitch.stuff);

                      return (
                        <button
                          key={pitch.pts?.pitchId || pitch.pitchNum}
                          onClick={() => onSelectPitch(pitch)}
                          className={`text-left p-2.5 rounded-lg border transition text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-slate-850/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-100 flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                              {pitch.pitchNum}구 {pitch.stuff}
                            </span>
                            <span className="font-mono font-bold text-blue-400">
                              {pitch.speed > 0 ? `${pitch.speed} km/h` : '-'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                            <span
                              className={`font-semibold ${
                                pitch.pitchResult === 'S'
                                  ? 'text-rose-400'
                                  : pitch.pitchResult === 'B'
                                  ? 'text-emerald-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {pitch.resultKorean}
                            </span>
                            <span className="text-slate-500">
                              {pitch.ball}B - {pitch.strike}S
                            </span>
                          </div>

                          {pitch.pts && (
                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between font-mono">
                              <span>H: {pitch.pts.breakHorizontal > 0 ? `+${pitch.pts.breakHorizontal}"` : `${pitch.pts.breakHorizontal}"`}</span>
                              <span>V: {pitch.pts.breakVertical > 0 ? `+${pitch.pts.breakVertical}"` : `${pitch.pts.breakVertical}"`}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
