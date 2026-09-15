'use client';

import { useState, useEffect, useMemo } from 'react';
import { RosterTable } from '@/components/roster/RosterTable';
import { LineupBoard } from '@/components/roster/LineupBoard';
import { FaLeaderboard } from '@/components/roster/FaLeaderboard';
import { PlayerDetailModal } from '@/components/roster/PlayerDetailModal';
import { DayRosterResponse, PlayerRosterItem } from '@/types/roster-fa';
import { isMatchingTeam } from '@/lib/roster-fa-service';
import { RawDataDrawer } from '@/components/RawDataDrawer';
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
  RefreshCw,
} from 'lucide-react';

export default function RosterFaPage() {
  const [date, setDate] = useState<string>('2024-05-15');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'LINEUP' | 'FA_LEADERBOARD'>('TABLE');

  const [rosterData, setRosterData] = useState<DayRosterResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRosterItem | null>(null);

  // Fetch data - always fetch full day dataset (team=ALL) so client-side switching is instantaneous
  const fetchData = async (targetDate: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/roster-fa?date=${targetDate}&team=ALL`);
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
    fetchData(date);
  }, [date]);

  // All players for current day
  const basePlayers = rosterData?.allPlayers || rosterData?.players || [];

  // Filtered players based on selected team
  const filteredPlayers = useMemo(() => {
    if (!selectedTeam || selectedTeam === 'ALL') return basePlayers;
    return basePlayers.filter((p) => isMatchingTeam(p.teamName, p.teamCode, selectedTeam));
  }, [basePlayers, selectedTeam]);

  // Dynamic summary based on selected team
  const summary = useMemo(() => {
    if (!rosterData) return null;
    if (selectedTeam === 'ALL') return rosterData.summary;
    const starters = filteredPlayers.filter((p) => p.role === 'STARTER').length;
    const subs = filteredPlayers.filter((p) => p.role === 'SUBSTITUTE').length;
    const bench = filteredPlayers.filter((p) => p.role === 'BENCH' && p.transaction !== 'OUT').length;
    const faQualified = filteredPlayers.filter((p) => p.faEligible).length;
    return {
      totalPlayers: filteredPlayers.length,
      totalStarters: starters,
      totalSubs: subs,
      totalBench: bench,
      totalFaQualified: faQualified,
    };
  }, [rosterData, selectedTeam, filteredPlayers]);

  const transactions = rosterData?.transactions;
  const teamTransactions = useMemo(() => {
    if (!transactions) return { registered: [], deregistered: [] };
    if (selectedTeam === 'ALL') return transactions;
    return {
      registered: transactions.registered.filter((p) => isMatchingTeam(p.teamName, p.teamCode, selectedTeam)),
      deregistered: transactions.deregistered.filter((p) => isMatchingTeam(p.teamName, p.teamCode, selectedTeam)),
    };
  }, [transactions, selectedTeam]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sub-header Controls Bar */}
      <div className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-100">
                선발·후보 라인업 & 1군 등록/말소·FA 서비스타임
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                KBO 규약 145일 기준
              </span>
            </div>
            <p className="text-xs text-slate-400">
              경기일자별 28인 엔트리 및 등록/말소 변동, FA 서비스타임 충족 여부 실시간 산출
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick date buttons */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              <button
                onClick={() => setDate('2026-09-13')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  date === '2026-09-13'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                9월 13일 (최근)
              </button>
              <button
                onClick={() => setDate('2024-05-15')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  date === '2024-05-15'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                2024년 5월 15일 (샘플)
              </button>
            </div>

            {/* Date input */}
            <div className="relative flex items-center">
              <Calendar className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-800 text-slate-100 rounded-lg border border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchData(date)}
              disabled={isLoading}
              title="새로고침"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-kbo-cyan' : ''}`} />
            </button>

            {/* Raw JSON API Inspector */}
            {rosterData && (
              <RawDataDrawer data={rosterData} title={`ROSTER_FA_${date}`} />
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Page Header & View Switcher */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-kbo-borderLight">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {date} KBO 1군 엔트리 & FA 서비스타임 데이터셋
              </h2>
              <span className="badge-thirdparty text-[10px]">
                145D FA MATRIX
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-kbo-blue/20 text-kbo-cyan border border-kbo-blue/40 font-semibold">
                {selectedTeam === 'ALL' ? '전체 10개 구단' : `${selectedTeam} 구단`}
              </span>
            </div>
            <p className="text-xs text-kbo-textTertiary mt-1 font-medium flex items-center gap-2">
              <span>구단별 선발 라인업(1~9번+선발투수)과 교체/벤치 엔트리 전수 분석 및 전일 대비 등록/말소 내역</span>
              <span className="text-slate-600">•</span>
              <span className="text-kbo-gold font-mono text-xs">단축키 [4]</span>
            </p>
          </div>

          {/* View Modes */}
          <div className="flex items-center bg-[#051124] p-1.5 rounded-2xl border border-kbo-borderLight shadow-lg text-xs font-bold">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                viewMode === 'TABLE'
                  ? 'bg-kbo-blue text-white shadow-md shadow-kbo-blue/30 border border-blue-400/40'
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
                  ? 'bg-kbo-blue text-white shadow-md shadow-kbo-blue/30 border border-blue-400/40'
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
                  ? 'bg-kbo-blue text-white shadow-md shadow-kbo-blue/30 border border-blue-400/40'
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
              <div className="text-[10px] text-slate-500 mt-1">
                {selectedTeam === 'ALL' ? '리그 전체' : `${selectedTeam} 현역`}
              </div>
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
                <span className="text-green-400">▲{teamTransactions.registered.length}</span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400">▼{teamTransactions.deregistered.length}</span>
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
            전체 구단 ({basePlayers.length}명)
          </button>
          {rosterData?.teams.map((t) => {
            const isSelected = selectedTeam === t.teamName || selectedTeam === t.teamCode;
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

        {/* Empty State: No Games on Date */}
        {!isLoading && rosterData && basePlayers.length === 0 && (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <p className="text-slate-300 font-semibold text-sm">
              선택하신 일자({date})에는 진행된 KBO 경기 및 등록된 1군 엔트리가 없습니다.
            </p>
            <p className="text-xs text-slate-500">
              월요일 휴식일이거나 비시즌, 또는 당일 경기 시작 전 라인업 미발표 상태일 수 있습니다.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDate('2026-09-13')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
              >
                최근 경기일(2026-09-13)로 이동
              </button>
              <button
                onClick={() => setDate('2024-05-15')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                2024 샘플 경기일(2024-05-15)로 이동
              </button>
            </div>
          </div>
        )}

        {/* Empty State: Selected Team Did Not Play on Date */}
        {!isLoading && rosterData && basePlayers.length > 0 && filteredPlayers.length === 0 && selectedTeam !== 'ALL' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-2">
            <p className="text-slate-300 text-xs font-semibold">
              {selectedTeam} 구단은 {date}에 편성된 정규시즌 경기 일정이 없습니다 (우천취소 또는 해당일 휴식).
            </p>
            <button
              onClick={() => setSelectedTeam('ALL')}
              className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition"
            >
              전체 구단 보기로 전환
            </button>
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
                players={filteredPlayers}
                date={date}
                selectedTeam={selectedTeam}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {viewMode === 'LINEUP' && (
              <LineupBoard
                players={basePlayers}
                teams={rosterData.teams}
                selectedTeam={selectedTeam}
                onSelectTeam={setSelectedTeam}
                onSelectPlayer={setSelectedPlayer}
              />
            )}

            {viewMode === 'FA_LEADERBOARD' && (
              <FaLeaderboard
                players={basePlayers}
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
