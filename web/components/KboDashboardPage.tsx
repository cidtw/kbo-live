import React from 'react';
import { DateNavigator } from './DateNavigator';
import { SectionHeader } from './SectionHeader';
import { GameGrid } from './GameGrid';
import { GameCard } from './GameCard';
import { EmptyState } from './EmptyState';
import { mapToGameViewModel, GameViewModel } from '../lib/domain/mapper';

interface KboDashboardPageProps {
  rawGames: any[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  loading?: boolean;
}

const GameCardSkeleton = () => (
  <div className="glass-panel p-6 rounded-toss-xl border border-toss-borderLight bg-toss-surface min-h-[240px] flex flex-col justify-between animate-pulse select-none">
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="w-20 h-3.5 bg-toss-canvas rounded-toss-xs" />
        <div className="w-14 h-5 bg-toss-canvas rounded-toss-xs" />
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex flex-col items-center flex-1">
          <div className="w-11 h-11 rounded-full bg-toss-canvas" />
          <div className="w-12 h-3 bg-toss-canvas rounded mt-2" />
        </div>
        <div className="w-8 h-5 bg-toss-canvas rounded-toss-xs" />
        <div className="flex flex-col items-center flex-1">
          <div className="w-11 h-11 rounded-full bg-toss-canvas" />
          <div className="w-12 h-3 bg-toss-canvas rounded mt-2" />
        </div>
      </div>
    </div>
    <div className="w-full h-9 bg-toss-canvas rounded-toss-lg" />
  </div>
);

export const KboDashboardPage: React.FC<KboDashboardPageProps> = ({
  rawGames,
  selectedDate,
  onDateChange,
  loading = false,
}) => {
  // Map raw games to the View Model layer
  const games: GameViewModel[] = (rawGames || []).map(mapToGameViewModel);

  const liveGames = games.filter((g) => g.status === 'LIVE');
  const scheduledGames = games.filter((g) => g.status === 'SCHEDULED');
  const finishedGames = games.filter((g) => g.status === 'FINISHED' || g.status === 'CANCELLED');

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* Page Header and Date Navigation */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-5 border-b border-toss-borderLight pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-toss-inkPrimary tracking-tight">
            KBO 리그
          </h1>
          <p className="text-xs md:text-sm text-toss-inkMuted mt-1 font-medium">
            KBO 리그 경기 일정 및 문자중계를 실시간으로 확인하세요.
          </p>
        </div>
        <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
      </div>

      {loading ? (
        /* Loading skeleton grids instead of a dark overlay */
        <div className="space-y-8 select-none">
          <div>
            <SectionHeader title="실시간 중계" count={0} indicatorColor="var(--bull-red)" />
            <GameGrid>
              <GameCardSkeleton />
            </GameGrid>
          </div>
          <div>
            <SectionHeader title="경기 예정" count={0} indicatorColor="var(--warning-yellow)" />
            <GameGrid>
              <GameCardSkeleton />
              <GameCardSkeleton />
              <GameCardSkeleton />
            </GameGrid>
          </div>
        </div>
      ) : (
        /* Grid container for each section */
        <div className="space-y-8">
          {/* Live Section */}
          <div>
            <SectionHeader title="실시간 중계" count={liveGames.length} indicatorColor="var(--bull-red)" />
            {liveGames.length === 0 ? (
              <EmptyState message="현재 진행 중인 경기가 없습니다." />
            ) : (
              <GameGrid>
                {liveGames.map((game) => (
                  <GameCard key={game.gameId} game={game} />
                ))}
              </GameGrid>
            )}
          </div>

          {/* Scheduled Section */}
          <div>
            <SectionHeader title="경기 예정" count={scheduledGames.length} indicatorColor="var(--warning-yellow)" />
            {scheduledGames.length === 0 ? (
              <EmptyState message="오늘 예정된 경기가 없습니다." />
            ) : (
              <GameGrid>
                {scheduledGames.map((game) => (
                  <GameCard key={game.gameId} game={game} />
                ))}
              </GameGrid>
            )}
          </div>

          {/* Finished Section */}
          <div>
            <SectionHeader title="종료 및 취소" count={finishedGames.length} indicatorColor="var(--ink-faint)" />
            {finishedGames.length === 0 ? (
              <EmptyState message="종료된 경기가 없습니다." />
            ) : (
              <GameGrid>
                {finishedGames.map((game) => (
                  <GameCard key={game.gameId} game={game} />
                ))}
              </GameGrid>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default KboDashboardPage;
