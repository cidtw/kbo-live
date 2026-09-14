import React from 'react';
import { InningScore, GameState } from '../lib/domain/broadcast';

interface LineScoreProps {
  inningScore: InningScore;
  gameState: GameState | null;
  awayName: string;
  homeName: string;
  currentInning: number;
  half: 'T' | 'B';
  ended: boolean;
}

export const LineScore: React.FC<LineScoreProps> = ({
  inningScore,
  gameState,
  awayName,
  homeName,
  currentInning,
  half,
  ended,
}) => {
  const maxInning = Math.max(
    9,
    ...Object.keys(inningScore.home).map(Number),
    ...Object.keys(inningScore.away).map(Number),
    currentInning
  );

  const innings = Array.from({ length: maxInning }, (_, i) => i + 1);

  const getInningVal = (side: 'home' | 'away', inn: number) => {
    const val = inningScore[side][String(inn)];
    if (val === undefined || val === '') {
      if (ended || inn > currentInning) return '-';
      return '0';
    }
    return val;
  };

  const isCurrent = (side: 'home' | 'away', inn: number) => {
    if (ended) return false;
    if (inn !== currentInning) return false;
    if (side === 'away' && half === 'T') return true;
    if (side === 'home' && half === 'B') return true;
    return false;
  };

  return (
    <div className="glass-panel p-6 overflow-x-auto rounded-toss-xl border border-toss-borderLight bg-toss-surface select-none">
      <table className="w-full text-center border-collapse text-sm select-none">
        <thead>
          <tr className="border-b border-toss-borderLight text-toss-inkMuted font-bold">
            <th className="text-left py-3 px-4 font-semibold text-toss-inkPrimary tracking-wider">팀명</th>
            {innings.map((inn) => (
              <th
                key={inn}
                className={`py-3 w-10 font-bold ${
                  inn === currentInning && !ended ? 'text-toss-primary bg-toss-primarySoft rounded-full' : 'text-toss-inkTertiary'
                }`}
              >
                {inn}
              </th>
            ))}
            <th className="py-3 w-12 border-l border-toss-borderLight font-black text-toss-primary text-center">R</th>
            <th className="py-3 w-12 font-bold text-toss-inkSecondary">H</th>
            <th className="py-3 w-12 font-bold text-toss-inkSecondary">E</th>
            <th className="py-3 w-12 font-bold text-toss-inkSecondary">B</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 font-semibold text-toss-inkSecondary">
          <tr className="hover:bg-toss-surfaceHover transition-colors">
            <td className="text-left py-4 px-4 font-black text-toss-inkPrimary text-base">{awayName}</td>
            {innings.map((inn) => {
              const active = isCurrent('away', inn);
              return (
                <td
                  key={inn}
                  className={`py-4 font-bold text-sm ${
                    active
                      ? 'text-toss-primary bg-toss-primarySoft font-extrabold text-base rounded-lg'
                      : inn === currentInning && !ended
                      ? 'bg-toss-surfaceMuted text-toss-inkSecondary'
                      : 'text-toss-inkTertiary'
                  }`}
                >
                  {getInningVal('away', inn)}
                </td>
              );
            })}
            <td className="py-4 border-l border-toss-borderLight text-toss-primary font-black text-lg text-center">
              {gameState?.awayScore ?? '-'}
            </td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.awayHit ?? '-'}</td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.awayError ?? '-'}</td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.awayBallFour ?? '-'}</td>
          </tr>
          <tr className="hover:bg-toss-surfaceHover transition-colors">
            <td className="text-left py-4 px-4 font-black text-toss-inkPrimary text-base">{homeName}</td>
            {innings.map((inn) => {
              const active = isCurrent('home', inn);
              return (
                <td
                  key={inn}
                  className={`py-4 font-bold text-sm ${
                    active
                      ? 'text-toss-primary bg-toss-primarySoft font-extrabold text-base rounded-lg'
                      : inn === currentInning && !ended
                      ? 'bg-toss-surfaceMuted text-toss-inkSecondary'
                      : 'text-toss-inkTertiary'
                  }`}
                >
                  {getInningVal('home', inn)}
                </td>
              );
            })}
            <td className="py-4 border-l border-toss-borderLight text-toss-primary font-black text-lg text-center">
              {gameState?.homeScore ?? '-'}
            </td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.homeHit ?? '-'}</td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.homeError ?? '-'}</td>
            <td className="py-4 text-toss-inkSecondary font-bold text-base">{gameState?.homeBallFour ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
