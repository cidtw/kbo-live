import React from 'react';
import { GameState } from '../lib/domain/broadcast';

interface DiamondPanelProps {
  gameState: GameState | null;
}

export const DiamondPanel: React.FC<DiamondPanelProps> = ({ gameState }) => {
  const ball = Number(gameState?.ball) || 0;
  const strike = Number(gameState?.strike) || 0;
  const out = Number(gameState?.out) || 0;

  const base1 = !!gameState?.base1;
  const base2 = !!gameState?.base2;
  const base3 = !!gameState?.base3;

  const renderDots = (count: number, max: number, activeColorClass: string) => {
    return Array.from({ length: max }).map((_, i) => {
      const active = i < count;
      return (
        <span
          key={i}
          className={`inline-block w-4 h-4 rounded-full transition-all duration-200 ${
            active
              ? `${activeColorClass} scale-105`
              : 'bg-toss-borderLight'
          }`}
        />
      );
    });
  };

  return (
    <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-around rounded-toss-xl border border-toss-borderLight bg-toss-surface shadow-sm">
      {/* SVG Diamond */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Base path lines */}
          <path
            d="M 100 160 L 160 100 L 100 40 L 40 100 Z"
            fill="none"
            className="stroke-toss-borderLight"
            strokeWidth="3"
            strokeDasharray="6 4"
          />

          {/* Home Plate (bottom) */}
          <path
            d="M 100 168 L 108 160 L 100 152 L 92 160 Z"
            className="fill-toss-borderMedium"
            stroke="none"
          />

          {/* 1st Base (Right) */}
          <rect
            x="150"
            y="90"
            width="20"
            height="20"
            rx="4"
            ry="4"
            transform="rotate(45 160 100)"
            className={`transition-all duration-300 ease-out ${
              base1
                ? 'fill-toss-primary'
                : 'fill-toss-borderLight'
            }`}
          />

          {/* 2nd Base (Top) */}
          <rect
            x="90"
            y="30"
            width="20"
            height="20"
            rx="4"
            ry="4"
            transform="rotate(45 100 40)"
            className={`transition-all duration-300 ease-out ${
              base2
                ? 'fill-toss-primary'
                : 'fill-toss-borderLight'
            }`}
          />

          {/* 3rd Base (Left) */}
          <rect
            x="30"
            y="90"
            width="20"
            height="20"
            rx="4"
            ry="4"
            transform="rotate(45 40 100)"
            className={`transition-all duration-300 ease-out ${
              base3
                ? 'fill-toss-primary'
                : 'fill-toss-borderLight'
            }`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-toss-borderMedium pointer-events-none select-none font-bold text-[10px] tracking-widest">
          그라운드 상황
        </div>
      </div>

      {/* B/S/O Counts */}
      <div className="flex flex-col gap-4 mt-4 sm:mt-0 font-bold text-toss-inkPrimary tracking-wider w-36">
        <div className="flex items-center justify-between">
          <span className="text-toss-inkMuted text-xs font-semibold tracking-wider">볼 (B)</span>
          <div className="flex gap-2">
            {renderDots(ball, 3, 'bg-toss-primary')}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-toss-inkMuted text-xs font-semibold tracking-wider">스트라이크 (S)</span>
          <div className="flex gap-2">
            {renderDots(strike, 2, 'bg-toss-warningYellow')}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-toss-inkMuted text-xs font-semibold tracking-wider">아웃 (O)</span>
          <div className="flex gap-2">
            {renderDots(out, 2, 'bg-toss-bullRed')}
          </div>
        </div>
      </div>
    </div>
  );
};
