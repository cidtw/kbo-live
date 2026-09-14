'use client';

import React from 'react';
import { PitchArsenalStats } from '@/lib/types/baseball';
import { getPitchColor } from '@/lib/physics';

interface ArsenalBreakdownProps {
  arsenal: PitchArsenalStats[];
  totalPitches: number;
  selectedStuff?: string;
  onSelectStuff?: (stuff: string) => void;
}

export const ArsenalBreakdown: React.FC<ArsenalBreakdownProps> = ({
  arsenal,
  totalPitches,
  selectedStuff,
  onSelectStuff,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <span>구종별 구사 통계 (Pitch Arsenal Breakdown)</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            총 {totalPitches}구 중 구종별 비중, 구속 범위 및 헛스윙율(Whiff%)
          </p>
        </div>
      </div>

      <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex mb-5 p-0.5 border border-slate-800">
        {arsenal.map((a) => {
          const color = getPitchColor(a.stuff);
          return (
            <div
              key={a.stuff}
              style={{
                width: `${a.usagePercent}%`,
                backgroundColor: color,
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group"
              title={`${a.stuff}: ${a.count}구 (${a.usagePercent}%)`}
            />
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold">
              <th className="pb-2">구종</th>
              <th className="pb-2 text-right">투구수</th>
              <th className="pb-2 text-right">구사율</th>
              <th className="pb-2 text-right">평균 구속</th>
              <th className="pb-2 text-right">최고 구속</th>
              <th className="pb-2 text-right">Whiff%</th>
              <th className="pb-2 text-right">Zone%</th>
              <th className="pb-2 text-center">S / B</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {arsenal.map((item) => {
              const color = getPitchColor(item.stuff);
              const isSelected = selectedStuff === item.stuff;

              return (
                <tr
                  key={item.stuff}
                  onClick={() => onSelectStuff && onSelectStuff(item.stuff)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition ${
                    isSelected ? 'bg-blue-600/15 font-semibold' : ''
                  }`}
                >
                  <td className="py-2.5 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-bold text-slate-100">{item.stuff}</span>
                  </td>

                  <td className="py-2.5 text-right font-medium text-slate-200">
                    {item.count}구
                  </td>

                  <td className="py-2.5 text-right">
                    <span className="text-slate-100 font-bold">{item.usagePercent}%</span>
                  </td>

                  <td className="py-2.5 text-right font-mono text-blue-400 font-bold">
                    {item.avgSpeed > 0 ? `${item.avgSpeed} km/h` : '-'}
                  </td>

                  <td className="py-2.5 text-right font-mono text-slate-300">
                    {item.maxSpeed > 0 ? `${item.maxSpeed} km/h` : '-'}
                  </td>

                  <td className="py-2.5 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        item.whiffRate >= 25
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'text-slate-300'
                      }`}
                    >
                      {item.whiffRate}%
                    </span>
                  </td>

                  <td className="py-2.5 text-right">
                    <span className="text-slate-300">{item.zoneRate}%</span>
                  </td>

                  <td className="py-2.5 text-center text-slate-400 text-[11px]">
                    <span className="text-emerald-400 font-medium">{item.strikes}</span> /{' '}
                    <span className="text-slate-500">{item.balls}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
