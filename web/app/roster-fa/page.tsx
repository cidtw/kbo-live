'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { RosterTable } from '@/components/roster/RosterTable';
import { LineupBoard } from '@/components/roster/LineupBoard';
import { FaLeaderboard } from '@/components/roster/FaLeaderboard';
import { PlayerDetailModal } from '@/components/roster/PlayerDetailModal';
import { DayRosterResponse, PlayerRosterItem } from '@/types/roster-fa';
import {
  Users,
  LayoutGrid,
  Trophy,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  TrendingUp,
  UserCheck,
  UserMinus,
  Sparkles,
} from 'lucide-react';

export default function RosterFaPage() {
  const [date, setDate] = useState<string>('2024-05-15');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'LINEUP' | 'FA_LEADERBOARD'>('TABLE');

  const [rosterData, setRosterData] = useState<DayRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRosterItem | null>(null);

  // Fetch data
  const fetchData = async (targetDate: string, team: string = 'ALL') => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/roster-fa?date=${targetDate}&team=${team}`);
      const json = await res.json();
      if (json.success) {
        setRosterData(json);
      } else {
        setError(json.error || '데이터를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('네트워크 오류 또는 서버 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(date, selectedTeam);
  }, [date, selectedTeam]);

  const summary = rosterData?.summary;
  const transactions = rosterData?.transactions;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar with Date Picker */}
      <Navbar
        date={date}
        onDateChange={setDate}
        isLoading={isLoading}
        onRefresh={() => fetchData(date, selectedTeam)}
        title="KBO 선발·후보 라인업 & 1군 등록/말소·FA 서비스타임 분석"
        subtitle="경기일자별 선발/교체/벤치 분류 및 145일 기준 KBO 규약 FA 서비스타임 계산기"
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Header & View Switcher */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {date} KBO 1군 엔트리 & FA 서비스타임 데이터셋
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                정규시즌 공식 기록 연동
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              구단별 선발 라인업(1~9번+선발투수)과 교체/벤치 엔트리를 전수 분석하고, 전일 대비 등록/말소 내역 및 145일 기준 당해 FA 충족 여부를 실시간 산출합니다.
            </p>
          </div>

          {/* View Modes */}
          <div className="flex items-center bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-lg text-xs font-bold">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                viewMode === 'TABLE'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              데이터셋 테이블
            </button>
            <button
              onClick={() => setViewMode('LINEUP')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                viewMode === 'LINEUP'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              선발 vs 후보 라인업
            </button>
            <button
              onClick={() => setViewMode('FA_LEADERBOARD')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                viewMode === 'FA_LEADERBOARD'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              FA 서비스타임 추적기
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Total Players */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                1군 등록 선수
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {summary.totalPlayers}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">28인 엔트리 기준</div>
            </div>

            {/* Card 2: Starters */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                선발 출장
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {summary.totalStarters}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">1~9번 타자 + 선발투수</div>
            </div>

            {/* Card 3: Substitutes */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                교체 출장
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {summary.totalSubs}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">대타 / 대주자 / 구원</div>
            </div>

            {/* Card 4: Bench */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                벤치 대기
              </div>
              <div className="text-2xl font-black text-slate-300 mt-1">
                {summary.totalBench}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">엔트리 내 미출장 후보</div>
            </div>

            {/* Card 5: Transactions */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-green-400" />
                당일 등록 / 말소
              </div>
              <div className="text-xl font-black text-white mt-1 flex items-center gap-2">
                <span className="text-green-400">▲{transactions?.registered.length || 0}</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">▼{transactions?.deregistered.length || 0}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">전일 대비 변동</div>
            </div>

            {/* Card 6: FA Qualified */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                FA 1시즌 충족
              </div>
              <div className="text-2xl font-black text-teal-400 mt-1">
                {summary.totalFaQualified}
                <span className="text-xs font-normal text-slate-400 ml-1">명</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">145일 이상 달성</div>
            </div>
          </div>
        )}

        {/* Team Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-400 whitespace-nowrap mr-1">
            구단 필터:
          </span>
          <button
            onClick={() => setSelectedTeam('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              selectedTeam === 'ALL'
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            전체 구단 ({rosterData?.players.length || 0}명)
          </button>
          {rosterData?.teams.map((t) => {
            const isSelected = selectedTeam === t.teamName;
            return (
              <button
                key={t.teamCode}
                onClick={() => setSelectedTeam(t.teamName)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.teamColor || '#3b82f6' }}
                ></span>
                {t.teamName}
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">
              KBO {date} 경기 라인업 및 엔트리 변동, FA 서비스타임 데이터를 계산하는 중입니다...
            </p>
          </div>
        )}

        {/* Render Active View */}
        {!isLoading && rosterData && (
          <div>
            {viewMode === 'TABLE' && (
              <RosterTable
                players={rosterData.players}
                date={date}
                selectedTeam={selectedTeam}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {viewMode === 'LINEUP' && (
              <LineupBoard
                players={rosterData.players}
                teams={rosterData.teams}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {viewMode === 'FA_LEADERBOARD' && (
              <FaLeaderboard
                players={rosterData.players}
                teams={rosterData.teams}
                onSelectPlayer={setSelectedPlayer}
              />
            )}
          </div>
        )}
      </main>

      {/* Player Detail Modal */}
      <PlayerDetailModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />
    </div>
  );
}
