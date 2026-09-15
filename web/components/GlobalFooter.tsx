'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Terminal, ShieldAlert, Cpu, ExternalLink, Activity, Heart } from 'lucide-react';

export const GlobalFooter: React.FC = () => {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <footer className="mt-auto border-t border-kbo-borderLight bg-[#001438] text-slate-400 text-xs select-none">
      {/* Upper Footer: Status and Telemetry */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Col 1: Platform & Identity */}
        <div className="space-y-2 md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="text-base">⚾</span>
            <span className="font-extrabold text-white tracking-tight">KBO LIVE COMPANION</span>
            <span className="badge-thirdparty text-[9px] py-0 px-1.5">3RD-PARTY</span>
          </div>
          <p className="text-[11px] text-kbo-textTertiary leading-relaxed">
            KBO 리그 실시간 문자중계, 투수 혹사 지수, 3D PTS 투구 궤적, 145일 FA 등록일수 데이터셋을 제공하는 비공식 독립 분석 플랫폼입니다.
          </p>
        </div>

        {/* Col 2: Color Theme & Design Reference */}
        <div className="space-y-2 md:col-span-1">
          <div className="font-bold text-white text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-kbo-blue" />
            <span>컬러 테마 레퍼런스</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            한국야구위원회 공식 웹사이트(
            <a
              href="https://www.koreabaseball.com"
              target="_blank"
              rel="noreferrer"
              className="text-kbo-cyan hover:underline inline-flex items-center gap-0.5"
            >
              koreabaseball.com <ExternalLink className="w-2.5 h-2.5" />
            </a>
            )의 딥 로열 네이비(#002063) 및 블루, 레드 테마를 오마주하여 시각적 정체성을 계승하였습니다.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-4 h-4 rounded bg-[#002063] border border-white/20" title="KBO Deep Navy #002063" />
            <span className="w-4 h-4 rounded bg-[#005BAC] border border-white/20" title="KBO Blue #005BAC" />
            <span className="w-4 h-4 rounded bg-[#ED1C24] border border-white/20" title="KBO Emblem Red #ED1C24" />
            <span className="w-4 h-4 rounded bg-[#00BECE] border border-white/20" title="KBO Cyan #00BECE" />
            <span className="w-4 h-4 rounded bg-[#C5A059] border border-white/20" title="KBO Gold #C5A059" />
          </div>
        </div>

        {/* Col 3: Engine Telemetry */}
        <div className="space-y-2 md:col-span-1 font-stats text-[11px]">
          <div className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>엔진 텔레메트리</span>
          </div>
          <div className="bg-[#051124] p-2.5 rounded-lg border border-kbo-borderLight space-y-1">
            <div className="flex justify-between">
              <span className="text-kbo-textMuted">DATA PIPELINE</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kbo-textMuted">SESSION UPTIME</span>
              <span className="text-slate-200">{formatUptime(uptime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-kbo-textMuted">FONTS</span>
              <span className="text-kbo-cyan">JetBrains Mono / Jakarta</span>
            </div>
          </div>
        </div>

        {/* Col 4: Hotkey Navigation */}
        <div className="space-y-2 md:col-span-1">
          <div className="font-bold text-white text-xs flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-kbo-gold" />
            <span>빠른 단축키 가이드</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <span className="bg-[#051124] px-2 py-1 rounded border border-kbo-borderLight">
              <strong className="text-kbo-cyan font-mono mr-1">[1]</strong> 실시간 중계
            </span>
            <span className="bg-[#051124] px-2 py-1 rounded border border-kbo-borderLight">
              <strong className="text-kbo-cyan font-mono mr-1">[2]</strong> 혹사 지수
            </span>
            <span className="bg-[#051124] px-2 py-1 rounded border border-kbo-borderLight">
              <strong className="text-kbo-cyan font-mono mr-1">[3]</strong> 등판 일지
            </span>
            <span className="bg-[#051124] px-2 py-1 rounded border border-kbo-borderLight">
              <strong className="text-kbo-cyan font-mono mr-1">[4]</strong> 라인업·FA
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Unofficial Disclaimer */}
      <div className="border-t border-kbo-borderLight/60 bg-[#000e26] py-3 px-4 text-center text-[11px] text-kbo-textMuted">
        <p>
          본 서비스는 KBO(한국야구위원회)의 공식 서비스가 아니며, 네이버 스포츠 문자중계 및 야구 데이터 분석을 위해 제작된 비상업적 독립 서드파티 툴킷입니다.
        </p>
        <p className="mt-0.5 text-[10px] text-slate-600">
          KBO LIVE COMPANION // INDEPENDENT SABERMETRICS & RELAY SUITE v2.6.4
        </p>
      </div>
    </footer>
  );
};
