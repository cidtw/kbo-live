import React from 'react';
import Link from 'next/link';
import { GameViewModel } from '../lib/domain/mapper';

interface GameCardProps {
  game: GameViewModel;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const getTeamBadgeColor = (code: string) => {
    const colors: Record<string, string> = {
      OB: 'bg-[#1b2f54] text-white', // Doosan
      LT: 'bg-[#d31125] text-white', // Lotte
      SS: 'bg-[#006cc7] text-white', // Samsung
      HT: 'bg-[#c70f2b] text-white', // KIA
      LG: 'bg-[#800020] text-white', // LG
      SK: 'bg-[#ff0000] text-white', // SSG
      NC: 'bg-[#073263] text-white', // NC
      HH: 'bg-[#ff6600] text-white', // Hanwha
      WO: 'bg-[#5c0019] text-white', // Kiwoom
      KT: 'bg-[#1c1c1b] text-white', // KT
    };
    return colors[code.toUpperCase()] || 'bg-toss-borderLight text-toss-inkTertiary';
  };

  const getPillStyles = () => {
    if (game.isCancelled) {
      return 'bg-toss-bullRedSoft text-toss-bullRed';
    }
    switch (game.status) {
      case 'LIVE':
        return 'bg-toss-primarySoft text-toss-primary border border-blue-500/30 font-bold';
      case 'FINISHED':
        return 'bg-slate-800 text-slate-300 border border-slate-700/80';
      case 'SCHEDULED':
      default:
        return 'bg-toss-warningYellowSoft text-amber-300 border border-amber-500/30';
    }
  };

  const cardContent = (
    <div
      className={`relative overflow-hidden rounded-toss-xl border bg-toss-surface transition-all duration-200 p-6 flex flex-col justify-between min-h-[240px] shadow-sm select-none ${
        game.isLive
          ? 'border-toss-primary/40 shadow-md shadow-toss-primary/5 hover:border-toss-primary hover:scale-[1.01]'
          : 'border-toss-borderLight hover:border-toss-borderMedium hover:shadow-md hover:scale-[1.01]'
      }`}
    >
      <div>
        {/* Stadium and Start Time Meta Row */}
        <div className="flex justify-between items-center text-xs text-toss-inkMuted mb-4 font-bold select-none">
          <span>{game.stadium}</span>
          <div className="flex items-center gap-1.5">
            {game.isLive && (
              <span className="w-2.5 h-2.5 rounded-full bg-toss-bullRed animate-pulse shrink-0" />
            )}
            <span className={`px-2.5 py-0.5 rounded-toss-sm text-[10px] font-bold tracking-wider ${getPillStyles()}`}>
              {game.statusLabel}
            </span>
          </div>
        </div>

        {/* Matchup horizontal area: Away VS Home */}
        <div className="flex items-center justify-between mb-5">
          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div
              className={`w-11 h-11 rounded-full ${getTeamBadgeColor(
                game.awayTeam.code
              )} flex items-center justify-center font-black text-sm shrink-0`}
            >
              {game.awayTeam.code}
            </div>
            <span className="mt-2 text-xs md:text-sm font-bold text-toss-inkSecondary text-center truncate w-full">
              {game.awayTeam.name}
            </span>
          </div>

          {/* Scores or VS */}
          <div className="flex flex-col items-center px-4 shrink-0">
            {game.awayTeam.score !== undefined && game.homeTeam.score !== undefined ? (
              <div className="flex items-center gap-2 font-black text-2xl tracking-tight text-toss-inkPrimary mono-font">
                <span>{game.awayTeam.score}</span>
                <span className="text-slate-200 font-light">:</span>
                <span>{game.homeTeam.score}</span>
              </div>
            ) : (
              <span className="text-slate-200 font-bold text-base tracking-wider select-none">VS</span>
            )}
            {game.tvBroadcaster && game.status === 'SCHEDULED' && (
              <span className="text-[10px] text-toss-inkMuted mt-1 font-semibold">{game.tvBroadcaster}</span>
            )}
          </div>

          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div
              className={`w-11 h-11 rounded-full ${getTeamBadgeColor(
                game.homeTeam.code
              )} flex items-center justify-center font-black text-sm shrink-0`}
            >
              {game.homeTeam.code}
            </div>
            <span className="mt-2 text-xs md:text-sm font-bold text-toss-inkSecondary text-center truncate w-full">
              {game.homeTeam.name}
            </span>
          </div>
        </div>
      </div>

      {/* Relay status pill-style link or badge */}
      {!game.isCancelled ? (
        <div
          className={`w-full text-center py-2.5 rounded-toss-lg font-bold text-xs transition-colors select-none ${
            game.isLive
              ? 'bg-toss-primary text-white'
              : 'bg-toss-canvas text-toss-inkTertiary'
          }`}
        >
          {game.isDone ? '경기 리플레이' : game.isLive ? '실시간 중계 보기' : '문자중계 대기'}
        </div>
      ) : (
        <div className="w-full text-center py-2.5 rounded-toss-lg bg-toss-canvas text-toss-inkFaint font-bold text-xs select-none cursor-not-allowed">
          경기 취소
        </div>
      )}
    </div>
  );

  if (game.isCancelled) {
    return cardContent;
  }

  return (
    <Link href={`/game/${game.gameId}`} className="block w-full">
      {cardContent}
    </Link>
  );
};
