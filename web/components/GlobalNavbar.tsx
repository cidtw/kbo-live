'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Flame, Target, Users } from 'lucide-react';

const NAV_ITEMS = [
  {
    name: '실시간 문자중계',
    href: '/',
    icon: Radio,
    exact: true,
  },
  {
    name: '투수 혹사 지수',
    href: '/pitchers',
    icon: Flame,
    exact: false,
  },
  {
    name: '등판 일지 & PTS',
    href: '/journal',
    icon: Target,
    exact: false,
  },
  {
    name: '라인업 & FA',
    href: '/roster-fa',
    icon: Users,
    exact: false,
  },
];

export const GlobalNavbar: React.FC = () => {
  const pathname = usePathname();

  const isItemActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href || pathname.startsWith('/game/');
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-black text-lg text-white hover:text-blue-400 transition-colors"
          >
            <span className="text-xl">⚾</span>
            <span className="tracking-tight">KBO LIVE</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 text-xs md:text-sm">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Info Tag */}
        <div className="text-xs text-slate-400 hidden lg:block font-medium">
          KBO 실시간 중계 및 통합 분석 대시보드
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden flex items-center justify-around border-t border-slate-800/80 px-2 py-1.5 bg-slate-900/95">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-[10px] transition-all ${
                active
                  ? 'text-blue-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
