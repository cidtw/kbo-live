'use client';

import React, { useEffect, useState } from 'react';
import { GameSummary, GameDetailData, PitcherOuting, PitchEvent } from '@/lib/types/baseball';
import { PitcherSelector } from '@/components/journal/PitcherSelector';
import { PitcherHeader } from '@/components/journal/PitcherHeader';
import { StrikeZone2D } from '@/components/journal/StrikeZone2D';
import { Trajectory3D } from '@/components/journal/Trajectory3D';
import { ArsenalBreakdown } from '@/components/journal/ArsenalBreakdown';
import { AtBatTimeline } from '@/components/journal/AtBatTimeline';
import { Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

export default function JournalPage() {
  const [date, setDate] = useState<string>('2024-05-15');
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [gameData, setGameData] = useState<GameDetailData | null>(null);
  const [selectedPitcher, setSelectedPitcher] = useState<PitcherOuting | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<PitchEvent | null>(null);

  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchGames = async (targetDate: string) => {
    setIsLoadingGames(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/games?date=${targetDate}`);
      const json = await res.json();
      const gamesList = json.games || [];
      if (gamesList.length > 0) {
        setGames(gamesList);
        const playedGame =
          gamesList.find((g: any) => g.statusCode === 'RESULT') || gamesList[0];
        setSelectedGameId(playedGame.gameId);
      } else {
        setGames([]);
        setSelectedGameId('');
        setGameData(null);
        setSelectedPitcher(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch games:', err);
      setErrorMessage('경기 일정을 불러오는 데 실패했습니다.');
    } finally {
      setIsLoadingGames(false);
    }
  };

  useEffect(() => {
    fetchGames(date);
  }, [date]);

  const fetchGameDetail = async (gameId: string) => {
    if (!gameId) return;
    setIsLoadingDetail(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/journal/${gameId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setGameData(json.data);
        const defaultPitcher =
          json.data.homePitchers[0] || json.data.awayPitchers[0] || null;
        setSelectedPitcher(defaultPitcher);
        if (defaultPitcher && defaultPitcher.allPitches.length > 0) {
          setSelectedPitch(defaultPitcher.allPitches[0]);
        } else {
          setSelectedPitch(null);
        }
      } else {
        setErrorMessage(json.error || '경기 세부 데이터를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Failed to fetch game details:', err);
      setErrorMessage('문자중계 및 PTS 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      fetchGameDetail(selectedGameId);
    }
  }, [selectedGameId]);

  const handleSelectPitcher = (pitcher: PitcherOuting) => {
    setSelectedPitcher(pitcher);
    if (pitcher.allPitches.length > 0) {
      setSelectedPitch(pitcher.allPitches[0]);
    } else {
      setSelectedPitch(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Sub-header Controls */}
      <div className="bg-slate-900 border-b border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-100">
                투수별 등판 일지 & PTS 궤적 뷰어
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PTS 9-Param Trajectory
              </span>
            </div>
            <p className="text-xs text-slate-400">
              네이버 스포츠 KBO 실시간 문자중계 트래킹 데이터 연동
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick date buttons */}
            <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
              <button
                onClick={() => setDate('2024-05-15')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  date === '2024-05-15'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                5월 15일 (샘플)
              </button>
              <button
                onClick={() => setDate('2024-05-14')}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  date === '2024-05-14'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                5월 14일
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

            {/* Game Selector */}
            <select
              value={selectedGameId}
              onChange={(e) => setSelectedGameId(e.target.value)}
              disabled={games.length === 0}
              className="bg-slate-800 text-slate-100 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition max-w-[260px] truncate"
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

            {/* Refresh */}
            <button
              onClick={() => {
                if (selectedGameId) fetchGameDetail(selectedGameId);
                else fetchGames(date);
              }}
              disabled={isLoadingGames || isLoadingDetail}
              title="새로고침"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoadingGames || isLoadingDetail ? 'animate-spin text-blue-400' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoadingGames ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">KBO 경기 일정 및 라인업 조회 중...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-32 text-slate-500">
            <p className="text-base font-semibold">선택한 날짜에 진행된 KBO 경기가 없습니다.</p>
            <p className="text-xs mt-1">상단의 빠른 선택(5월 15일 등)을 클릭해 보세요.</p>
          </div>
        ) : isLoadingDetail ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">
              네이버 문자중계 및 PTS 9-파라미터 궤적 데이터를 파싱하고 있습니다...
            </p>
          </div>
        ) : gameData && selectedPitcher ? (
          <>
            <PitcherSelector
              homeTeamName={gameData.game.homeTeamName}
              awayTeamName={gameData.game.awayTeamName}
              homePitchers={gameData.homePitchers}
              awayPitchers={gameData.awayPitchers}
              selectedPitcherId={selectedPitcher.pitcherId}
              onSelectPitcher={handleSelectPitcher}
            />

            <PitcherHeader pitcher={selectedPitcher} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <StrikeZone2D
                pitches={selectedPitcher.allPitches}
                arsenal={selectedPitcher.arsenal}
                selectedPitch={selectedPitch}
                onSelectPitch={setSelectedPitch}
              />
              <Trajectory3D
                pitch={selectedPitch}
                allPitches={selectedPitcher.allPitches}
                showAllTrajectories={true}
              />
            </div>

            <ArsenalBreakdown
              arsenal={selectedPitcher.arsenal}
              totalPitches={selectedPitcher.allPitches.length}
            />

            <AtBatTimeline
              plateAppearances={selectedPitcher.plateAppearances}
              selectedPitch={selectedPitch}
              onSelectPitch={setSelectedPitch}
            />
          </>
        ) : null}
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-6 text-center text-xs text-slate-500">
        <p>
          KBO PTS Tracker & Outing Journal • Data Source: Naver Sports Baseball Live Text Relay & PTS
        </p>
        <p className="text-[11px] text-slate-600 mt-1">
          Coordinate System: Home plate width 17", PTS 9-Parameter Kinematic Flight Model
        </p>
      </footer>
    </div>
  );
}
