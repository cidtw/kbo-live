'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Terminal,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldAlert,
  Cpu,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { toggleMute, isMuted, playChime } from '@/lib/utils/audioChimes';

interface ThirdPartyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThirdPartyInfoModal: React.FC<ThirdPartyInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'DISCLOSURE' | 'SHORTCUTS' | 'DIAGNOSTICS'>('DISCLOSURE');
  const [sessionSec, setSessionSec] = useState<number>(0);
  const [latency, setLatency] = useState<number>(28);
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(() => {
    setMuted(isMuted());
    const interval = setInterval(() => {
      setSessionSec((s) => s + 1);
    }, 1000);
    // 미세한 레이턴시 지터 시뮬레이션
    const pingInterval = setInterval(() => {
      setLatency(24 + Math.floor(Math.random() * 12));
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(pingInterval);
    };
  }, []);

  if (!isOpen) return null;

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
  };

  const handleToggleSound = () => {
    const next = toggleMute();
    setMuted(next);
    if (!next) playChime('event');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-kbo-dark border border-kbo-borderMedium rounded-2xl shadow-2xl overflow-hidden text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-kbo-navy via-kbo-blue via-kbo-cyan to-kbo-red" />

        {/* Modal Header */}
        <div className="p-5 border-b border-kbo-border flex items-center justify-between bg-kbo-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-kbo-navy border border-kbo-borderMedium flex items-center justify-center shadow-inner">
              <span className="text-lg">⚾</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  KBO LIVE RELAY • 서드파티 애널리틱스 랩
                </h3>
                <span className="badge-thirdparty">3RD-PARTY LABS</span>
              </div>
              <p className="text-xs text-kbo-textTertiary mt-0.5">
                독립 개발자 야구 데이터 분석 & 실시간 중계 대시보드
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-kbo-surfaceHover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-kbo-border bg-kbo-surface/50 text-xs">
          <button
            onClick={() => setActiveTab('DISCLOSURE')}
            className={`pb-2 px-1 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'DISCLOSURE'
                ? 'border-kbo-cyan text-kbo-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            서드파티 안내 & 테마
          </button>
          <button
            onClick={() => setActiveTab('SHORTCUTS')}
            className={`pb-2 px-1 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'SHORTCUTS'
                ? 'border-kbo-cyan text-kbo-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            키보드 단축키
          </button>
          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`pb-2 px-1 font-semibold transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-kbo-cyan text-kbo-cyan'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            실시간 엔진 진단
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto space-y-4 text-xs leading-relaxed">
          {activeTab === 'DISCLOSURE' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-kbo-midnight border border-kbo-border space-y-2">
                <div className="flex items-center gap-2 text-kbo-gold font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>KBO 공식 컬러 테마 오마주 & 서드파티 식별</span>
                </div>
                <p className="text-slate-300">
                  본 애플리케이션의 색상 테마는 한국야구위원회(KBO) 공식 웹사이트(
                  <a
                    href="https://www.koreabaseball.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-kbo-cyan underline inline-flex items-center gap-0.5 ml-1"
                  >
                    koreabaseball.com <ExternalLink className="w-3 h-3" />
                  </a>
                  )의 시그니처 팔레트(
                  <span className="text-white font-mono bg-kbo-navy px-1 py-0.5 rounded border border-kbo-borderLight">#002063 Deep Royal Navy</span>,{' '}
                  <span className="text-white font-mono bg-[#005BAC] px-1 py-0.5 rounded">#005BAC Blue</span>,{' '}
                  <span className="text-white font-mono bg-[#ED1C24] px-1 py-0.5 rounded">#ED1C24 Red</span>,{' '}
                  <span className="text-white font-mono bg-[#00BECE] text-black px-1 py-0.5 rounded">#00BECE Cyan</span>
                  )를 정교하게 레퍼런스하여 제작되었습니다.
                </p>
                <p className="text-slate-400">
                  동시에, 관공서풍의 기본 폰트 대신 <strong className="text-white">Plus Jakarta Sans</strong>,{' '}
                  <strong className="text-white">Pretendard</strong>, 그리고 세이버메트릭스 통계용{' '}
                  <strong className="text-kbo-cyan font-mono">JetBrains Mono (Tabular Numeral)</strong> 폰트를 전면 배치하여,
                  야구 데이터 연구원 및 세이버메트리션을 위해 특화된 독립 서드파티 도구임을 명확히 나타냅니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-kbo-surface border border-kbo-border space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-kbo-blue" />
                    <span>독립 데이터 파이프라인</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    <li>네이버 스포츠 실시간 문자중계 SSE 스트림 연동</li>
                    <li>투수 4일 누적 혹사 지수 자체 산출 엔진</li>
                    <li>PTS 3D 투구 궤적 & Three.js 공간 시각화</li>
                    <li>1군 엔트리 변동 및 145일 FA 서비스타임 연산</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-kbo-surface border border-kbo-border space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-kbo-cyan" />
                    <span>신디사이저 효과음 (Web Audio API)</span>
                  </div>
                  <p className="text-slate-400">
                    외부 음원 파일 없이 순수 자바스크립트 Web Audio API 오실레이터로 제작된 햅틱 사운드를 제공합니다.
                  </p>
                  <button
                    onClick={handleToggleSound}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-kbo-midnight border border-kbo-border text-white font-bold flex items-center gap-1.5 hover:border-kbo-cyan transition"
                  >
                    {muted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-kbo-cyan" />}
                    <span>사운드: {muted ? '음소거됨' : '켜짐 (테스트)'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-kbo-textMuted border-t border-kbo-border pt-3">
                ⚠️ 면책 조항: KBO 리그 및 각 구단(KIA, 삼성, LG, 두산, KT, SSG, 롯데, 한화, NC, 키움)의 공식 명칭과 로고의 권리는
                한국야구위원회 및 각 구단에 있으며, 본 사이트는 순수 분석/연구 목적의 비공식 서드파티 프로젝트입니다.
              </div>
            </div>
          )}

          {activeTab === 'SHORTCUTS' && (
            <div className="space-y-3">
              <p className="text-slate-400">
                페이지 어디에서나 키보드 단축키를 눌러 0ms로 메뉴를 전환하고 화면을 제어할 수 있습니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">실시간 문자중계 (라이브)</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-kbo-cyan">1</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">투수 혹사 지수 대시보드</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-kbo-cyan">2</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">등판 일지 & 3D PTS 궤적</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-kbo-cyan">3</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">라인업 & 145일 FA 현황</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-kbo-cyan">4</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">화면 데이터 강제 새로고침</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-white">R</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between">
                  <span className="text-slate-300">효과음 음소거 토글</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-white">M</kbd>
                </div>
                <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border flex items-center justify-between col-span-1 sm:col-span-2">
                  <span className="text-slate-300">서드파티 정보 및 단축키 안내 열기</span>
                  <kbd className="px-2 py-1 rounded bg-kbo-midnight border border-kbo-borderMedium font-mono font-bold text-kbo-gold">?</kbd>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-xl bg-kbo-midnight border border-kbo-border space-y-2">
                <div className="text-xs text-kbo-cyan font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>CLIENT ENGINE TELEMETRY</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-kbo-surface p-2 rounded border border-kbo-borderLight">
                    <span className="text-kbo-textMuted block text-[10px]">PLATFORM STATUS</span>
                    <span className="text-emerald-400 font-bold">ONLINE (ACTIVE)</span>
                  </div>
                  <div className="bg-kbo-surface p-2 rounded border border-kbo-borderLight">
                    <span className="text-kbo-textMuted block text-[10px]">CURRENT PING</span>
                    <span className="text-kbo-cyan font-bold">{latency} ms</span>
                  </div>
                  <div className="bg-kbo-surface p-2 rounded border border-kbo-borderLight">
                    <span className="text-kbo-textMuted block text-[10px]">SESSION UPTIME</span>
                    <span className="text-white font-bold">{formatUptime(sessionSec)}</span>
                  </div>
                  <div className="bg-kbo-surface p-2 rounded border border-kbo-borderLight">
                    <span className="text-kbo-textMuted block text-[10px]">ACTIVE ENGINE VERSION</span>
                    <span className="text-kbo-gold font-bold">v2.6.4-pro</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-kbo-surface border border-kbo-border text-[11px] text-kbo-textTertiary flex items-center justify-between">
                <span>데이터 파서: Naver Sports Relay & KBO Open Metas</span>
                <span className="text-emerald-400 font-bold">● CONNECTED</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-kbo-border bg-kbo-surface flex items-center justify-between text-xs">
          <span className="text-kbo-textMuted font-mono">
            KBO-LIVE-ANALYTICS // THIRD-PARTY LAB
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-kbo-blue hover:bg-kbo-blueHover text-white font-bold transition shadow"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
