import React from 'react';
import Link from 'next/link';

interface Game {
  gameId: string;
  gameStartDate: string;
  gameDateTime: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamCode: string;
  awayTeamCode: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
  statusCode: string;
  statusInfo?: string;
  stadium: string;
  cancel: boolean;
  tv?: string;
}

interface GameSelectorProps {
  games: Game[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const GameSelector: React.FC<GameSelectorProps> = ({
  games,
  selectedDate,
  onDateChange,
}) => {
  const isLive = (g: Game) =>
    g && !g.cancel && g.statusCode !== 'BEFORE' && g.statusCode !== 'READY' && g.statusCode !== 'RESULT';

  const isDone = (g: Game) => g && g.statusCode === 'RESULT';

  const isScheduled = (g: Game) =>
    g && (g.statusCode === 'BEFORE' || g.statusCode === 'READY') && !g.cancel;

  const liveGames = games.filter(isLive);
  const scheduledGames = games.filter(isScheduled);
  const finishedGames = games.filter((g) => isDone(g) || g.cancel);

  const getTeamBadgeColor = (code: string) => {
    // Beautiful, friendly Toss-style colors
    const colors: Record<string, string> = {
      OB: 'bg-[#1b2f54] text-white',
      LT: 'bg-[#d31125] text-white',
      SS: 'bg-[#006cc7] text-white',
      HT: 'bg-[#c70f2b] text-white',
      LG: 'bg-[#800020] text-white',
      SK: 'bg-[#ff0000] text-white',
      NC: 'bg-[#073263] text-white',
      HH: 'bg-[#ff6600] text-white',
      WO: 'bg-[#5c0019] text-white',
      KT: 'bg-[#1c1c1b] text-white',
    };
    return colors[code.toUpperCase()] || 'bg-slate-100 text-slate-700';
  };

  const formatTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (_) {
      return '18:30';
    }
  };

  const renderGameCard = (game: Game, statusType: 'live' | 'scheduled' | 'finished') => {
    const isGameCancel = game.cancel;
    const showScore = statusType !== 'scheduled';
    const statusText = isGameCancel
      ? '우천취소'
      : statusType === 'live'
      ? game.statusInfo || 'LIVE'
      : statusType === 'finished'
      ? '경기종료'
      : formatTime(game.gameDateTime);

    return (
      <div
        key={game.gameId}
        className={`relative overflow-hidden rounded-3xl border bg-white transition-all duration-200 p-6 flex flex-col justify-between min-h-[240px] shadow-sm ${
          statusType === 'live'
            ? 'border-[#3182f6]/40 shadow-md shadow-[#3182f6]/5'
            : 'border-slate-100 hover:border-slate-200'
        }`}
      >
        <div>
          {/* Header */}
          <div className="flex justify-between items-center text-xs text-[#8b95a1] mb-4 font-bold">
            <span>{game.stadium}</span>
            <div className="flex items-center gap-1.5">
              {statusType === 'live' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#f04452] animate-pulse shrink-0" />
              )}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider ${
                  isGameCancel
                    ? 'bg-[#feebee] text-[#f04452]'
                    : statusType === 'live'
                    ? 'bg-[#e8f3ff] text-[#3182f6]'
                    : statusType === 'finished'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-[#fff7e6] text-[#ab570a]'
                }`}
              >
                {statusText}
              </span>
            </div>
          </div>

          {/* Teams / Scores */}
          <div className="flex items-center justify-between mb-5">
            {/* Away */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-11 h-11 rounded-full ${getTeamBadgeColor(
                  game.awayTeamCode
                )} flex items-center justify-center font-black text-sm`}
              >
                {game.awayTeamCode}
              </div>
              <span className="mt-2 text-xs md:text-sm font-bold text-[#333d4b] text-center truncate w-full">
                {game.awayTeamName}
              </span>
            </div>

            {/* Score / VS */}
            <div className="flex flex-col items-center px-2 shrink-0">
              {showScore ? (
                <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-[#191f28]">
                  <span>{game.awayTeamScore ?? '-'}</span>
                  <span className="text-slate-200 font-light">:</span>
                  <span>{game.homeTeamScore ?? '-'}</span>
                </div>
              ) : (
                <span className="text-slate-200 font-bold text-base tracking-wider">VS</span>
              )}
              {game.tv && !showScore && (
                <span className="text-[10px] text-[#8b95a1] mt-1 font-semibold">{game.tv}</span>
              )}
            </div>

            {/* Home */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-11 h-11 rounded-full ${getTeamBadgeColor(
                  game.homeTeamCode
                )} flex items-center justify-center font-black text-sm`}
              >
                {game.homeTeamCode}
              </div>
              <span className="mt-2 text-xs md:text-sm font-bold text-[#333d4b] text-center truncate w-full">
                {game.homeTeamName}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        {!isGameCancel && (
          <Link
            href={`/game/${game.gameId}`}
            className={`w-full block text-center py-2.5 rounded-2xl font-bold text-xs transition-colors select-none ${
              statusType === 'live'
                ? 'bg-[#3182f6] hover:bg-[#1b64da] text-white'
                : 'bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#4e5968]'
            }`}
          >
            {statusType === 'finished' ? '경기 리플레이' : statusType === 'live' ? '실시간 중계 보기' : '문자중계 대기'}
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 border-b border-[#e5e8eb] pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#191f28] tracking-tight">
            KBO 실시간 중계 대시보드
          </h1>
          <p className="text-xs md:text-sm text-[#8b95a1] mt-1 font-medium">KBO 리그 경기 일정 및 문자중계를 실시간으로 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-[#e5e8eb] rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              onDateChange(prev.toISOString().slice(0, 10));
            }}
            className="px-4 py-2 text-xs text-[#4e5968] hover:text-[#191f28] rounded-xl hover:bg-[#f2f4f6] transition-colors font-bold"
          >
            이전 날
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-[#f2f4f6] border border-transparent rounded-xl px-3 py-1.5 text-xs text-[#191f28] font-bold focus:outline-none focus:border-[#3182f6]"
          />
          <button
            onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              onDateChange(next.toISOString().slice(0, 10));
            }}
            className="px-4 py-2 text-xs text-[#4e5968] hover:text-[#191f28] rounded-xl hover:bg-[#f2f4f6] transition-colors font-bold"
          >
            다음 날
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="space-y-8">
        {/* Live */}
        <div>
          <h2 className="text-sm font-bold text-[#191f28] flex items-center gap-2 mb-4 tracking-wider uppercase">
            <span className="w-3 h-3 rounded-full bg-[#f04452]" />
            실시간 중계 ({liveGames.length})
          </h2>
          {liveGames.length === 0 ? (
            <div className="glass-panel text-slate-400 text-center py-12 rounded-3xl border border-slate-100 bg-white text-xs select-none">
              현재 진행 중인 경기가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveGames.map((g) => renderGameCard(g, 'live'))}
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div>
          <h2 className="text-sm font-bold text-[#191f28] flex items-center gap-2 mb-4 tracking-wider uppercase">
            <span className="w-3 h-3 rounded-full bg-[#ffad12]" />
            경기 예정 ({scheduledGames.length})
          </h2>
          {scheduledGames.length === 0 ? (
            <div className="glass-panel text-slate-400 text-center py-12 rounded-3xl border border-slate-100 bg-white text-xs select-none">
              오늘 예정된 경기가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledGames.map((g) => renderGameCard(g, 'scheduled'))}
            </div>
          )}
        </div>

        {/* Finished */}
        <div>
          <h2 className="text-sm font-bold text-[#191f28] flex items-center gap-2 mb-4 tracking-wider uppercase">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            종료 및 취소 ({finishedGames.length})
          </h2>
          {finishedGames.length === 0 ? (
            <div className="glass-panel text-slate-400 text-center py-12 rounded-3xl border border-slate-100 bg-white text-xs select-none">
              종료된 경기가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {finishedGames.map((g) => renderGameCard(g, 'finished'))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
