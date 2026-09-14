'use client';

import React from 'react';

export const KBO_TEAMS = [
  { code: '', label: '전체' },
  { code: 'KIA', label: 'KIA' },
  { code: 'SL', label: '삼성' },
  { code: 'LG', label: 'LG' },
  { code: 'DB', label: '두산' },
  { code: 'KT', label: 'KT' },
  { code: 'SSG', label: 'SSG' },
  { code: 'LOT', label: '롯데' },
  { code: 'HE', label: '한화' },
  { code: 'NCD', label: 'NC' },
  { code: 'KH', label: '키움' },
];

export const ROLE_OPTIONS = [
  { value: '', label: '전체 보직' },
  { value: 'RP', label: '불펜 (구원)' },
  { value: 'SP', label: '선발' },
  { value: 'CL', label: '마무리' },
];

export const RANGE_OPTIONS = [
  { value: '7d', label: '최근 7일' },
  { value: '14d', label: '최근 14일' },
  { value: '30d', label: '최근 30일' },
  { value: 'season', label: '시즌 전체' },
];

interface FilterBarProps {
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onlyHighRisk: boolean;
  onToggleHighRisk: (only: boolean) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function FilterBar({
  selectedTeam,
  onSelectTeam,
  selectedRole,
  onSelectRole,
  selectedRange,
  onSelectRange,
  searchQuery,
  onSearchChange,
  onlyHighRisk,
  onToggleHighRisk,
  isLoading,
  onRefresh,
}: FilterBarProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 backdrop-blur shadow-sm space-y-4">
      {/* 1. 구단 선택 탭 */}
      <div>
        <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>구단 선택</span>
          <span className="text-[11px] text-slate-500">10개 구단 실시간 등판 분석</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {KBO_TEAMS.map((t) => {
            const isSelected = selectedTeam === t.code;
            return (
              <button
                key={t.code}
                onClick={() => onSelectTeam(t.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/50'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 보직, 기간, 위험도 토글, 검색 및 새로고침 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 보직 필터 */}
          <select
            value={selectedRole}
            onChange={(e) => onSelectRole(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 기간 필터 */}
          <select
            value={selectedRange}
            onChange={(e) => onSelectRange(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* 위험군 전용 토글 버튼 */}
          <button
            onClick={() => onToggleHighRisk(!onlyHighRisk)}
            className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              onlyHighRisk
                ? 'bg-red-950/60 text-red-300 border-red-700/60 ring-1 ring-red-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${onlyHighRisk ? 'bg-red-500' : 'bg-slate-500'}`} />
            경고 이상만 보기
          </button>
        </div>

        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          {/* 검색창 */}
          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="선수명 검색..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 새로고침 버튼 */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 flex items-center gap-1"
            title="데이터 새로고침"
          >
            <span className={isLoading ? 'animate-spin inline-block' : ''}>🔄</span>
            <span className="hidden sm:inline">동기화</span>
          </button>
        </div>
      </div>
    </div>
  );
}
