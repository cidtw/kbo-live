'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PitcherOverworkData, OverworkRiskStatus } from '@/lib/domain/types';

interface OverworkTableProps {
  pitchers: PitcherOverworkData[];
  onSelectPitcher: (pitcher: PitcherOverworkData) => void;
}

type SortField =
  | 'overworkScore'
  | 'name'
  | 'team'
  | 'roleLabel'
  | 'games'
  | 'inningsDecimal'
  | 'totalPitches'
  | 'avgPitchesPerGame'
  | 'recent3DaysPitches'
  | 'recent7DaysPitches'
  | 'twoDaysInRow'
  | 'threeDaysInRow'
  | 'multiInningReliefCount'
  | 'currentRestDays'
  | 'era';

export default function OverworkTable({ pitchers, onSelectPitcher }: OverworkTableProps) {
  const [sortField, setSortField] = useState<SortField>('overworkScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // 기본 내림차순
    }
  };

  const sortedPitchers = useMemo(() => {
    return [...pitchers].sort((a, b) => {
      let vA: any = a[sortField];
      let vB: any = b[sortField];

      if (sortField === 'era') {
        vA = parseFloat(a.era) || 0;
        vB = parseFloat(b.era) || 0;
      }

      if (typeof vA === 'string') {
        return sortOrder === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      return sortOrder === 'asc' ? vA - vB : vB - vA;
    });
  }, [pitchers, sortField, sortOrder]);

  const renderStatusBadge = (status: OverworkRiskStatus, label: string) => {
    switch (status) {
      case 'EXTREME':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-700/80">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            {label}
          </span>
        );
      case 'DANGER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-700/80">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            {label}
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700/80">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            {label}
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-950 text-yellow-300 border border-yellow-700/80">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {label}
          </span>
        );
    }
  };

  const renderConsecutiveBadge = (p: PitcherOverworkData) => {
    if (p.currentConsecutiveDays >= 3) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-600 text-white animate-pulse shadow-sm">
          {p.currentConsecutiveDays}연투 🔥
        </span>
      );
    }
    if (p.currentConsecutiveDays === 2) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          2연투 ⚠️
        </span>
      );
    }
    if (p.currentRestDays === 0) {
      return <span className="text-[11px] text-slate-400">당일 등판</span>;
    }
    return <span className="text-[11px] text-slate-400">휴식 {p.currentRestDays}일</span>;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <span className="text-slate-600 ml-1">↕</span>;
    return sortOrder === 'asc' ? <span className="text-blue-400 ml-1">↑</span> : <span className="text-blue-400 ml-1">↓</span>;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden backdrop-blur shadow-sm">
      <div className="overflow-x-auto max-h-[700px]">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead className="bg-slate-800/95 sticky top-0 z-20 text-slate-400 font-semibold border-b border-slate-700 select-none shadow-sm">
            <tr>
              <th className="py-3 px-2 text-center w-12 sticky left-0 bg-slate-800/95 z-30">#</th>
              <th
                onClick={() => handleSort('team')}
                className="py-3 px-3 cursor-pointer hover:text-white sticky left-12 bg-slate-800/95 z-30"
              >
                구단 {getSortIcon('team')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-3 px-3 cursor-pointer hover:text-white sticky left-24 bg-slate-800/95 z-30 min-w-[90px]"
              >
                선수명 {getSortIcon('name')}
              </th>
              <th
                onClick={() => handleSort('roleLabel')}
                className="py-3 px-2 text-center cursor-pointer hover:text-white w-16"
              >
                보직 {getSortIcon('roleLabel')}
              </th>
              <th
                onClick={() => handleSort('overworkScore')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white min-w-[130px]"
              >
                혹사 지수 {getSortIcon('overworkScore')}
              </th>
              <th className="py-3 px-2 text-center">위험도</th>
              <th
                onClick={() => handleSort('currentRestDays')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white min-w-[95px]"
              >
                연투 / 휴식 {getSortIcon('currentRestDays')}
              </th>
              <th
                onClick={() => handleSort('recent3DaysPitches')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                title="최근 3일간 누적 투구수"
              >
                3일 투구 {getSortIcon('recent3DaysPitches')}
              </th>
              <th
                onClick={() => handleSort('recent7DaysPitches')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
                title="최근 7일간 누적 투구수"
              >
                7일 투구 {getSortIcon('recent7DaysPitches')}
              </th>
              <th
                onClick={() => handleSort('games')}
                className="py-3 px-2 text-right cursor-pointer hover:text-white"
              >
                등판 {getSortIcon('games')}
              </th>
              <th
                onClick={() => handleSort('inningsDecimal')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
              >
                이닝 {getSortIcon('inningsDecimal')}
              </th>
              <th
                onClick={() => handleSort('totalPitches')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
              >
                투구수 {getSortIcon('totalPitches')}
              </th>
              <th
                onClick={() => handleSort('avgPitchesPerGame')}
                className="py-3 px-2 text-right cursor-pointer hover:text-white"
              >
                NP/G {getSortIcon('avgPitchesPerGame')}
              </th>
              <th
                onClick={() => handleSort('multiInningReliefCount')}
                className="py-3 px-2 text-center cursor-pointer hover:text-white"
                title="불펜 4아웃(1⅓이닝) 이상 소화 횟수"
              >
                멀티 {getSortIcon('multiInningReliefCount')}
              </th>
              <th
                onClick={() => handleSort('era')}
                className="py-3 px-2 text-right cursor-pointer hover:text-white"
              >
                ERA {getSortIcon('era')}
              </th>
              <th className="py-3 px-3 text-center">W-L-S-H</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {sortedPitchers.map((p, idx) => {
              const isExtreme = p.status === 'EXTREME';
              const isDanger = p.status === 'DANGER';

              return (
                <tr
                  key={p.pcode}
                  onClick={() => onSelectPitcher(p)}
                  className={`cursor-pointer transition-colors hover:bg-slate-800/70 group ${
                    isExtreme
                      ? 'bg-purple-950/20'
                      : isDanger
                      ? 'bg-red-950/15'
                      : idx % 2 === 0
                      ? 'bg-slate-900/30'
                      : 'bg-transparent'
                  }`}
                >
                  <td className="py-2.5 px-2 text-center text-slate-500 font-sans sticky left-0 bg-slate-900/95 group-hover:bg-slate-800/95 z-10">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-300 sticky left-12 bg-slate-900/95 group-hover:bg-slate-800/95 z-10">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700">
                      {p.team}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans font-bold text-white group-hover:text-blue-400 transition-colors sticky left-24 bg-slate-900/95 group-hover:bg-slate-800/95 z-10 truncate">
                    <div className="flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <Link
                        href={`/player/${p.pcode}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`${p.name} 선수 상세 프로필 보기`}
                        className="text-slate-500 hover:text-blue-400 p-0.5 rounded hover:bg-slate-800 transition-colors inline-flex items-center"
                      >
                        <span className="text-[10px]">↗</span>
                      </Link>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-sans">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        p.primaryRole === 'SP'
                          ? 'bg-blue-900/60 text-blue-300'
                          : p.primaryRole === 'CL'
                          ? 'bg-amber-900/60 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.roleLabel}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 font-bold text-right text-slate-100">{p.overworkScore}</span>
                      <div className="flex-grow h-2 rounded-full bg-slate-800 overflow-hidden min-w-[50px]">
                        <div
                          className={`h-full rounded-full ${
                            p.overworkScore >= 85
                              ? 'bg-purple-500'
                              : p.overworkScore >= 70
                              ? 'bg-red-500'
                              : p.overworkScore >= 50
                              ? 'bg-amber-500'
                              : p.overworkScore >= 30
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, p.overworkScore)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-sans">
                    {renderStatusBadge(p.status, p.statusLabel)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-sans">
                    {renderConsecutiveBadge(p)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={
                        p.recent3DaysPitches >= 50
                          ? 'text-red-400 font-bold'
                          : p.recent3DaysPitches >= 35
                          ? 'text-amber-400 font-medium'
                          : 'text-slate-300'
                      }
                    >
                      {p.recent3DaysPitches}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={
                        p.recent7DaysPitches >= 90
                          ? 'text-red-400 font-bold'
                          : p.recent7DaysPitches >= 75
                          ? 'text-amber-400 font-medium'
                          : 'text-slate-300'
                      }
                    >
                      {p.recent7DaysPitches}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300">{p.games}</td>
                  <td className="py-2.5 px-3 text-right font-sans font-medium text-slate-200">
                    {p.inningsStr}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-200">{p.totalPitches}</td>
                  <td className="py-2.5 px-2 text-right text-slate-400">{p.avgPitchesPerGame}</td>
                  <td className="py-2.5 px-2 text-center">
                    {p.multiInningReliefCount > 0 ? (
                      <span className="text-amber-400 font-semibold">{p.multiInningReliefCount}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-300">{p.era}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400 text-[11px]">
                    {p.w}-{p.l}-{p.s}-{p.hld}
                  </td>
                </tr>
              );
            })}
            {sortedPitchers.length === 0 && (
              <tr>
                <td colSpan={16} className="py-12 text-center text-slate-500 font-sans">
                  조건에 일치하는 투수 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="py-2.5 px-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span>총 {sortedPitchers.length}명 표시 중</span>
        <span className="text-[11px] text-slate-500">투수명을 클릭하면 상세 등판 이력 및 차트가 열립니다.</span>
      </div>
    </div>
  );
}
