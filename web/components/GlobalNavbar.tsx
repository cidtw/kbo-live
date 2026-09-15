'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Radio,
  Flame,
  Target,
  Volume2,
  VolumeX,
  HelpCircle,
  Activity,
  Terminal,
} from 'lucide-react';
import { ThirdPartyInfoModal } from './ThirdPartyInfoModal';
import { useThirdPartyShortcuts } from '@/lib/hooks/useThirdPartyShortcuts';
import { toggleMute, isMuted, playChime } from '@/lib/utils/audioChimes';

const NAV_ITEMS = [
  {
    name: '실시간 문자중계',
    href: '/',
    icon: Radio,
    exact: true,
    shortcut: '1',
  },
  {
    name: '투수 혹사 지수',
    href: '/pitchers',
    icon: Flame,
    exact: false,
    shortcut: '2',
  },
  {
    name: '등판 일지 & PTS',
    href: '/journal',
    icon: Target,
    exact: false,
    shortcut: '3',
  },
];

export const GlobalNavbar: React.FC = () => {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [latency, setLatency] = useState<number>(31);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // 키보드 단축키 등록 및 Toast 알림 훅
  const { toast } = useThirdPartyShortcuts(() => setIsModalOpen(true));

  useEffect(() => {
    setSoundMuted(isMuted());

    // 실시간 KST 시계 갱신 (초 단위)
    const updateTime = () => {
      const now = new Date();
      const kstHours = String(now.getHours()).padStart(2, '0');
      const kstMins = String(now.getMinutes()).padStart(2, '0');
      const kstSecs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${kstHours}:${kstMins}:${kstSecs}`);
    };

    updateTime();
    const clockTimer = setInterval(updateTime, 1000);

    // 가벼운 지터 레이턴시 시뮬레이션
    const pingTimer = setInterval(() => {
      setLatency(25 + Math.floor(Math.random() * 14));
    }, 4500);

    return () => {
      clearInterval(clockTimer);
      clearInterval(pingTimer);
    };
  }, []);

  const handleToggleSound = () => {
    const next = toggleMute();
    setSoundMuted(next);
    if (!next) playChime('event');
  };

  const isItemActive = (item: (typeof NAV_ITEMS)[0]) => {
    if (item.exact) {
      return pathname === item.href || pathname.startsWith('/game/');
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 text-slate-100 shadow-xl select-none">
        {/* KBO Heritage Color Gradient Accent Top Border */}
        <div className="h-[3px] w-full bg-gradient-to-r from-kbo-navy via-kbo-blue via-kbo-cyan via-kbo-gold to-kbo-red" />

        <div className="bg-[#002063]/95 backdrop-blur-md border-b border-[#163156]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Brand with Third-Party Labs Stamp */}
            <div className="flex items-center gap-3 md:gap-6">
              <Link
                href="/"
                onClick={() => playChime('click')}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kbo-blue to-[#003875] border border-blue-400/40 flex items-center justify-center shadow-md group-hover:scale-105 transition">
                  <span className="text-base">⚾</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-base md:text-lg text-white tracking-tight leading-none">
                      KBO LIVE
                    </span>
                    <span className="badge-thirdparty text-[9px] py-0 px-1.5 hidden xs:inline-flex">
                      3RD-PARTY
                    </span>
                  </div>
                  <span className="text-[10px] text-kbo-textTertiary font-mono hidden sm:block">
                    ANALYTICS LAB
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Tabs */}
              <nav className="hidden md:flex items-center gap-1 bg-[#051329]/80 p-1 rounded-xl border border-kbo-borderLight text-xs">
                {NAV_ITEMS.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => playChime('switch')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                        active
                          ? 'bg-kbo-blue text-white font-bold shadow-md shadow-kbo-blue/30 border border-blue-400/40'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-kbo-textTertiary'}`} />
                      <span>{item.name}</span>
                      <kbd className="hidden lg:inline-block ml-1 px-1 py-0.2 rounded bg-black/40 text-[9px] font-mono text-slate-400">
                        {item.shortcut}
                      </kbd>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Real-time Telemetry, Audio, Shortcuts, Third-Party Badge */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              {/* Live Digital KST Clock */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#051329]/80 border border-kbo-borderLight font-stats text-[11px] text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-kbo-textMuted text-[10px]">KST</span>
                <span className="font-bold text-white tracking-wide">{currentTime || '--:--:--'}</span>
              </div>

              {/* Ping / Engine Latency */}
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-lg bg-[#051329]/80 border border-kbo-borderLight font-stats text-[10px] text-kbo-cyan" title="데이터 파이프라인 지연시간">
                <span>⚡</span>
                <span>{latency}ms</span>
              </div>

              {/* Audio Chime Mute Toggle */}
              <button
                onClick={handleToggleSound}
                title={soundMuted ? '효과음 켜기 (M)' : '효과음 음소거 (M)'}
                className={`p-1.5 rounded-lg border transition ${
                  soundMuted
                    ? 'bg-[#051329]/80 border-kbo-borderLight text-slate-400 hover:text-slate-200'
                    : 'bg-kbo-blue/20 border-kbo-blue/50 text-kbo-cyan hover:text-white'
                }`}
              >
                {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Unofficial Third-Party Badge / Modal Trigger */}
              <button
                onClick={() => {
                  playChime('click');
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-kbo-surface hover:bg-kbo-surfaceHover border border-kbo-border text-[11px] font-semibold text-slate-200 hover:border-kbo-cyan transition"
              >
                <HelpCircle className="w-3.5 h-3.5 text-kbo-gold" />
                <span className="hidden xs:inline">서드파티 툴킷</span>
                <kbd className="hidden md:inline px-1 py-0.2 rounded bg-black/40 text-[9px] font-mono text-kbo-gold">
                  ?
                </kbd>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="md:hidden flex items-center justify-around border-b border-kbo-borderLight px-1 py-1.5 bg-[#001740]/95 backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => playChime('switch')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] transition ${
                  active
                    ? 'text-white font-bold bg-kbo-blue/30 border border-kbo-blue/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-kbo-cyan' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Floating HUD Toast Notification for keyboard shortcuts & quick events */}
      {toast && (
        <div className="fixed top-18 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-kbo-navy/95 border border-kbo-cyan/50 text-white text-xs font-medium shadow-2xl backdrop-blur-md">
            <span className="text-base">{toast.icon || '⚡'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Interactive Third-Party Disclosure & Shortcuts Modal */}
      <ThirdPartyInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
