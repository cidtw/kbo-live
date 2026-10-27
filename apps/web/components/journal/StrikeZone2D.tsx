'use client';

import React, { useState } from 'react';
import { PitchEvent, PitchArsenalStats } from '@/lib/types/baseball';
import { getPitchColor } from '@/lib/physics';
import { RotateCw } from 'lucide-react';

interface StrikeZone2DProps {
  pitches: PitchEvent[];
  arsenal: PitchArsenalStats[];
  selectedPitch: PitchEvent | null;
  onSelectPitch: (pitch: PitchEvent) => void;
}

export const StrikeZone2D: React.FC<StrikeZone2DProps> = ({
  pitches,
  arsenal,
  selectedPitch,
  onSelectPitch,
}) => {
  const [selectedStuff, setSelectedStuff] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<string>('ALL');
  const [selectedStance, setSelectedStance] = useState<string>('ALL');
  const [isPitcherView, setIsPitcherView] = useState<boolean>(false);
  const [hoveredPitch, setHoveredPitch] = useState<PitchEvent | null>(null);

  const filteredPitches = pitches.filter((p) => {
    if (selectedStuff !== 'ALL' && p.stuff !== selectedStuff) return false;
    if (selectedResult !== 'ALL') {
      if (selectedResult === 'STRIKE' && !['S', 'T', 'F', 'H'].includes(p.pitchResult))
        return false;
      if (selectedResult === 'BALL' && p.pitchResult !== 'B') return false;
      if (selectedResult === 'WHIFF' && p.pitchResult !== 'S') return false;
    }
    if (selectedStance !== 'ALL' && p.pts && p.pts.stance !== selectedStance) return false;
    return true;
  });

  const svgWidth = 340;
  const svgHeight = 400;
  const xMin = -2.0;
  const xMax = 2.0;
  const yMin = 0.5;
  const yMax = 4.5;

  const mapX = (x: number) => {
    const adjustedX = isPitcherView ? -x : x;
    return ((adjustedX - xMin) / (xMax - xMin)) * svgWidth;
  };

  const mapY = (y: number) => {
    return svgHeight - ((y - yMin) / (yMax - yMin)) * svgHeight;
  };

  const ptsWithSz = pitches.filter((p) => p.pts?.topSz && p.pts?.bottomSz);
  const avgTopSz =
    ptsWithSz.length > 0
      ? ptsWithSz.reduce((acc, p) => acc + p.pts!.topSz, 0) / ptsWithSz.length
      : 3.4;
  const avgBottomSz =
    ptsWithSz.length > 0
      ? ptsWithSz.reduce((acc, p) => acc + p.pts!.bottomSz, 0) / ptsWithSz.length
      : 1.5;

  const szLeft = mapX(-0.7083);
  const szRight = mapX(0.7083);
  const szTop = mapY(avgTopSz);
  const szBottom = mapY(avgBottomSz);
  const szWidth = Math.abs(szRight - szLeft);
  const szHeight = Math.abs(szBottom - szTop);

  const hpYTop = mapY(0.7);
  const hpYBottom = mapY(0.4);
  const hpXLeft = mapX(-0.7083);
  const hpXRight = mapX(0.7083);
  const hpXCenter = mapX(0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>2D 스트라이크 존 로케이션</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredPitches.length}/{pitches.length}구)
            </span>
          </h3>
          <p className="text-[11px] text-slate-400">
            KBO ABS(자동 투구 판정) 규격 존 및 통과 지점
          </p>
        </div>

        <button
          onClick={() => setIsPitcherView(!isPitcherView)}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>{isPitcherView ? '투수 시점' : '포수 시점'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px]">
        <button
          onClick={() => setSelectedStuff('ALL')}
          className={`px-2.5 py-1 rounded-full font-medium transition ${
            selectedStuff === 'ALL'
              ? 'bg-slate-200 text-slate-900 font-bold'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          전체
        </button>
        {arsenal.map((a) => {
          const color = getPitchColor(a.stuff);
          const isSelected = selectedStuff === a.stuff;
          return (
            <button
              key={a.stuff}
              onClick={() => setSelectedStuff(isSelected ? 'ALL' : a.stuff)}
              className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-slate-800 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-850 text-slate-400 border-slate-750 hover:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{a.stuff}</span>
              <span className="text-[10px] text-slate-500">{a.count}</span>
            </button>
          );
        })}

        <div className="w-px h-4 bg-slate-800 mx-1" />

        <button
          onClick={() =>
            setSelectedResult(
              selectedResult === 'ALL'
                ? 'STRIKE'
                : selectedResult === 'STRIKE'
                ? 'BALL'
                : selectedResult === 'BALL'
                ? 'WHIFF'
                : 'ALL'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium"
        >
          결과: {selectedResult === 'ALL' ? '전체' : selectedResult === 'STRIKE' ? '스트라이크' : selectedResult === 'BALL' ? '볼' : '헛스윙'}
        </button>

        <button
          onClick={() =>
            setSelectedStance(
              selectedStance === 'ALL' ? 'R' : selectedStance === 'R' ? 'L' : 'ALL'
            )
          }
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-medium"
        >
          타자: {selectedStance === 'ALL' ? '전체' : selectedStance === 'R' ? '우타' : '좌타'}
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center min-h-[360px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-[400px] select-none"
        >
          <rect
            x={0}
            y={0}
            width={svgWidth}
            height={svgHeight}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1"
          />

          <polygon
            points={`${hpXLeft},${hpYTop} ${hpXRight},${hpYTop} ${hpXRight},${hpYBottom + 12} ${hpXCenter},${hpYBottom} ${hpXLeft},${hpYBottom + 12}`}
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1.5"
            opacity="0.8"
          />

          <rect
            x={Math.min(szLeft, szRight) - 10}
            y={szTop - 10}
            width={szWidth + 20}
            height={szHeight + 20}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.3"
          />

          <rect
            x={Math.min(szLeft, szRight)}
            y={szTop}
            width={szWidth}
            height={szHeight}
            fill="rgba(30, 41, 59, 0.4)"
            stroke="#94a3b8"
            strokeWidth="2"
            rx="2"
          />

          <line
            x1={Math.min(szLeft, szRight) + szWidth / 3}
            y1={szTop}
            x2={Math.min(szLeft, szRight) + szWidth / 3}
            y2={szBottom}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <line
            x1={Math.min(szLeft, szRight) + (szWidth * 2) / 3}
            y1={szTop}
            x2={Math.min(szLeft, szRight) + (szWidth * 2) / 3}
            y2={szBottom}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <line
            x1={Math.min(szLeft, szRight)}
            y1={szTop + szHeight / 3}
            x2={Math.max(szLeft, szRight)}
            y2={szTop + szHeight / 3}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <line
            x1={Math.min(szLeft, szRight)}
            y1={szTop + (szHeight * 2) / 3}
            x2={Math.max(szLeft, szRight)}
            y2={szTop + (szHeight * 2) / 3}
            stroke="#475569"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          <text
            x={szLeft - 32}
            y={(szTop + szBottom) / 2}
            fill="#475569"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            {isPitcherView ? '좌타석' : '우타석'}
          </text>
          <text
            x={szRight + 32}
            y={(szTop + szBottom) / 2}
            fill="#475569"
            fontSize="11"
            fontWeight="bold"
            textAnchor="middle"
          >
            {isPitcherView ? '우타석' : '좌타석'}
          </text>

          {filteredPitches.map((p, idx) => {
            if (!p.pts) return null;
            const cx = mapX(p.pts.crossPlateX);
            const cy = mapY(p.pts.crossPlateY);
            const color = getPitchColor(p.stuff);
            const isSelected = selectedPitch?.pts?.pitchId === p.pts.pitchId;
            const isHovered = hoveredPitch?.pts?.pitchId === p.pts.pitchId;

            return (
              <g
                key={p.pts.pitchId || idx}
                onClick={() => onSelectPitch(p)}
                onMouseEnter={() => setHoveredPitch(p)}
                onMouseLeave={() => setHoveredPitch(null)}
                className="cursor-pointer transition-transform duration-150"
              >
                {(isSelected || isHovered) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="13"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}

                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected || isHovered ? "8.5" : "6.5"}
                  fill={color}
                  stroke={
                    p.pitchResult === 'B'
                      ? '#000000'
                      : p.pitchResult === 'S'
                      ? '#ffffff'
                      : '#334155'
                  }
                  strokeWidth={isSelected || isHovered ? "2" : "1.2"}
                  opacity={
                    selectedPitch && !isSelected && !isHovered ? 0.35 : 0.95
                  }
                />

                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  {p.pitchNum}
                </text>
              </g>
            );
          })}
        </svg>

        {(hoveredPitch || selectedPitch) && (
          <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs w-64 pointer-events-none z-20">
            {(() => {
              const p = hoveredPitch || selectedPitch!;
              const color = getPitchColor(p.stuff);
              return (
                <div>
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                    <span className="font-black text-slate-100 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {p.stuff} {p.speed} km/h
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {p.pitchNum}구 ({p.ball}B-{p.strike}S)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] mt-1.5">
                    <div>
                      <span className="text-slate-500">판정: </span>
                      <span className="font-bold text-slate-200">
                        {p.resultKorean} ({p.pitchResult})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">상대 타자: </span>
                      <span className="font-semibold text-slate-200">
                        {p.batterName} ({p.pts?.stance === 'L' ? '좌타' : '우타'})
                      </span>
                    </div>
                    {p.pts && (
                      <>
                        <div>
                          <span className="text-slate-500">수평 무브: </span>
                          <span className="font-mono font-medium text-blue-400">
                            {p.pts.breakHorizontal > 0 ? `+${p.pts.breakHorizontal}"` : `${p.pts.breakHorizontal}"`}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">수직 무브(IVB): </span>
                          <span className="font-mono font-medium text-indigo-400">
                            {p.pts.breakVertical > 0 ? `+${p.pts.breakVertical}"` : `${p.pts.breakVertical}"`}
                          </span>
                        </div>
                        <div className="col-span-2 text-[10px] text-slate-400 mt-1">
                          비행시간: {p.pts.flightTime.toFixed(3)}초 | 릴리스 높이:{' '}
                          {p.pts.z0.toFixed(2)}ft
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> 직구
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> 슬라이더
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> 체인지업
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> 포크/스플리터
          </span>
        </div>
        <span className="text-[10px] text-slate-500">투구 클릭 시 3D 궤적 포커스</span>
      </div>
    </div>
  );
};
