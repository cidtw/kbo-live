'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameSummary } from '@/lib/types/baseball';
import { Calendar, RefreshCw, Activity, Users } from 'lucide-react';

interface NavbarProps {
  date?: string;
  onDateChange?: (d: string) => void;
  games?: GameSummary[];
  selectedGameId?: string;
  onSelectGame?: (id: string) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
  title?: string;
  subtitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  date,
  onDateChange,
  games,
  selectedGameId,
  onSelectGame,
  isLoading,
  onRefresh,
  title,
  subtitle,
}) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Tabs */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="font-black text-xl tracking-tighter">KBO</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight text-slate-100">
                    {title || 'KBO 통합 야구 데이터 분석 포털'}
                  </h1>
                </div>
                <p className="text-xs text-slate-400">
                  {subtitle || '네이버 스포츠 KBO 실시간 중계 및 1군 등록·FA 서비스타임 연동'}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
              <Link
                href="/roster-fa"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/roster-fa'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-300" />
                라인업·등록말소 & FA 서비스타임
              </Link>
              <Link
                href="/"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  pathname === '/'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-300" />
                투수 일지 & PTS 궤적
              </Link>
            </nav>
          </div>

          {/* Controls (Date, Game Selector, Refresh) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Date buttons */}
            {onDateChange && date && (
              <div className="hidden sm:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
                <button
                  onClick={() => onDateChange('2024-05-15')}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    date === '2024-05-15'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  5월 15일 (샘플)
                </button>
                <button
                  onClick={() => onDateChange('2024-05-14')}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    date === '2024-05-14'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  5월 14일
                </button>
              </div>
            )}

            {/* Date Picker */}
            {onDateChange && date && (
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-100 rounded-lg border border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            )}

            {/* Optional Game Selector (used on Pitcher page) */}
            {games && selectedGameId !== undefined && onSelectGame && (
              <div className="relative">
                <select
                  value={selectedGameId}
                  onChange={(e) => onSelectGame(e.target.value)}
                  disabled={games.length === 0}
                  className="bg-slate-800 hover:bg-slate-750 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition max-w-[240px] truncate"
                >
                  {games.length === 0 ? (
                    <option value="">경기가 없습니다</option>
                  ) : (
                    games.map((g) => (
                      <option key={g.gameId} value={g.gameId}>
                        {g.awayTeamName} {g.awayTeamScore} vs {g.homeTeamScore} {g.homeTeamName} (
                        {g.statusInfo || g.statusCode})
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                title="새로고침"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-center gap-2 pt-2 border-t border-slate-800 mt-2">
          <Link
            href="/roster-fa"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold ${
              pathname === '/roster-fa'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            라인업·등록말소 & FA
          </Link>
          <Link
            href="/"
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold ${
              pathname === '/'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            투수 일지 & PTS
          </Link>
        </div>
      </div>
    </header>
  );
};
