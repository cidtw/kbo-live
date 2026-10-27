'use client';

import React, { useState } from 'react';
import { PitchingAnalysisData, BattingAnalysisData } from '@/lib/domain/pitchingAnalysisEngine';

interface PitchingStyleAnalysisProps {
  pitchingAnalysis?: PitchingAnalysisData;
  battingAnalysis?: BattingAnalysisData;
  playerName: string;
}

type ZoneViewMode = 'distribution' | 'hra' | 'strikeout';

export default function PitchingStyleAnalysis({
  pitchingAnalysis,
  battingAnalysis,
  playerName,
}: PitchingStyleAnalysisProps) {
  const [zoneMode, setZoneMode] = useState<ZoneViewMode>('distribution');

  if (!pitchingAnalysis && !battingAnalysis) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
        선수의 구종별 정밀 트래킹 데이터 및 플레이 스타일 분석 정보가 집계 중입니다.
      </div>
    );
  }

  // 1. 투수 구종 분석 렌더링
  if (pitchingAnalysis) {
    const {
      archetype,
      styleTags,
      scoutingReport,
      primaryPitch,
      primarySpeed,
      primaryDiffSpeed,
      arsenal,
      zoneHeatmap,
      metrics,
    } = pitchingAnalysis;

    // 존 데이터 인덱싱 (1~13)
    const zoneMap = new Map(zoneHeatmap.map((z) => [z.zone, z]));

    // 색상 헬퍼
    const getZoneColor = (zoneNum: number) => {
      const item = zoneMap.get(zoneNum);
      if (!item) return 'bg-slate-900 border-slate-800 text-slate-400';

      if (zoneMode === 'distribution') {
        const rate = item.pitRate;
        if (rate >= 12) return 'bg-rose-600/90 text-white font-bold border-rose-400 shadow-sm shadow-rose-900/50';
        if (rate >= 8) return 'bg-amber-600/80 text-white font-semibold border-amber-500';
        if (rate >= 5) return 'bg-blue-900/70 text-blue-200 border-blue-700/60';
        if (rate > 0) return 'bg-slate-800/80 text-slate-300 border-slate-700';
        return 'bg-slate-950/60 text-slate-500 border-slate-800';
      }

      if (zoneMode === 'hra') {
        const hraNum = parseFloat(item.hra);
        if (isNaN(hraNum) || item.hra === '-') return 'bg-slate-900/80 text-slate-500 border-slate-800';
        if (hraNum >= 0.330) return 'bg-red-600/80 text-white font-bold border-red-500'; // 피안타율 높음 (약점)
        if (hraNum >= 0.250) return 'bg-amber-600/70 text-amber-100 border-amber-600';
        if (hraNum <= 0.150) return 'bg-emerald-700/80 text-emerald-100 font-bold border-emerald-500'; // 피안타율 낮음 (강점)
        return 'bg-blue-900/60 text-blue-200 border-blue-800';
      }

      if (zoneMode === 'strikeout') {
        const kk = item.kkRate;
        if (kk >= 15) return 'bg-purple-600/90 text-white font-bold border-purple-400 shadow-sm shadow-purple-900/50';
        if (kk >= 8) return 'bg-indigo-600/80 text-white font-semibold border-indigo-500';
        if (kk >= 4) return 'bg-slate-800/80 text-indigo-200 border-slate-700';
        if (kk > 0) return 'bg-slate-900/80 text-slate-400 border-slate-800';
        return 'bg-slate-950/60 text-slate-500 border-slate-800';
      }

      return 'bg-slate-800 border-slate-700 text-slate-300';
    };

    const getZoneDisplayValue = (zoneNum: number) => {
      const item = zoneMap.get(zoneNum);
      if (!item) return '-';
      if (zoneMode === 'distribution') return `${item.pitRate}%`;
      if (zoneMode === 'hra') return item.hra;
      if (zoneMode === 'strikeout') return `${item.kkRate}%`;
      return '-';
    };

    return (
      <div className="space-y-6">
        {/* A. 상단 아키타입 & 스카우팅 리포트 브리핑 카드 */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
          {/* 은은한 배경 광원 */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            {/* 타이틀 & 뱃지 */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">🎯</span>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {archetype}
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  KBO 공식 트래킹 시스템(PTS) 구종 데이터 및 볼카운트별 핫/콜드 존 종합 분석
                </p>
              </div>

              {/* 태그 리스트 */}
              <div className="flex flex-wrap items-center gap-1.5">
                {styleTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* 스카우팅 리포트 본문 */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 md:p-5 text-xs md:text-sm text-slate-200 leading-relaxed space-y-2">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
                <span>📋</span>
                <span>피칭 스타일 스카우팅 리포트</span>
              </div>
              <p className="text-slate-300">{scoutingReport}</p>
            </div>

            {/* 핵심 피칭 지표 칩 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">탈삼진율 (K%)</span>
                <span className="text-sm md:text-base font-bold text-rose-400 font-mono">
                  {metrics.kPer > 0 ? `${metrics.kPer}%` : '-'}
                </span>
                {metrics.kkRank && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">리그 {metrics.kkRank}</span>
                )}
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">볼넷율 (BB%)</span>
                <span className="text-sm md:text-base font-bold text-emerald-400 font-mono">
                  {metrics.bbPer > 0 ? `${metrics.bbPer}%` : '-'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">제구 안정도</span>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">K/BB 비율</span>
                <span className="text-sm md:text-base font-bold text-indigo-300 font-mono">
                  {metrics.kBbRatio > 0 ? metrics.kBbRatio.toFixed(2) : '-'}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">삼진/볼넷 비</span>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">주무기 구속</span>
                <span className="text-sm md:text-base font-bold text-amber-300 font-mono">
                  {primarySpeed > 0 ? `${primarySpeed}km/h` : '-'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {primaryPitch} ({primaryDiffSpeed > 0 ? `+${primaryDiffSpeed}` : primaryDiffSpeed}km/h)
                </span>
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">평균자책 / WHIP</span>
                <span className="text-sm md:text-base font-bold text-slate-200 font-mono">
                  {metrics.era} / {metrics.whip}
                </span>
                {metrics.eraRank && (
                  <span className="text-[10px] text-slate-500 block mt-0.5">ERA 리그 {metrics.eraRank}</span>
                )}
              </div>

              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">이닝 / 승패</span>
                <span className="text-sm md:text-base font-bold text-slate-200 font-mono">
                  {metrics.inn}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {metrics.winLoss || (metrics.innRank ? `이닝 리그 ${metrics.innRank}` : '-')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* B. 2열 인터랙티브 분석 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 1. 구종별 구사율 및 구속 분석 (좌측 7열) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>구종별 구사율 및 평균 구속 (Pitch Arsenal)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  구종 점유율과 리그 평균 구속 대비 편차 비교
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                총 {arsenal.length}개 구종
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {arsenal.map((p) => {
                const isFastest = p.speed === Math.max(...arsenal.map((x) => x.speed));
                return (
                  <div key={p.code} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-slate-200">{p.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                            p.role === '주무기'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 font-bold'
                              : p.role === '핵심 결정구'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/80'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-100 font-bold">{p.usage}%</span>
                        <span className="text-slate-300 font-semibold">{p.speed} km/h</span>
                        {p.diffSpeed !== 0 && (
                          <span
                            className={`text-[11px] font-bold ${
                              p.diffSpeed > 0 ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {p.diffSpeed > 0 ? `+${p.diffSpeed}` : p.diffSpeed} km/h
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 구사율 바 */}
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 relative">
                      <div
                        className="h-full rounded-full transition-all duration-500 relative"
                        style={{
                          width: `${Math.min(p.usage, 100)}%`,
                          backgroundColor: p.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 범례 및 안내 */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>리그 평균보다 빠름</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>리그 평균보다 느림</span>
                </span>
              </div>
              <span className="font-mono text-slate-500">※ KBO 리그 평균 기준 (KBO/PTS 공식 집계)</span>
            </div>
          </div>

          {/* 2. 스트라이크존 로케이션 & 핫/콜드 존 (우측 5열) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2 border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>스트라이크존 로케이션</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">3×3 Zone + Chase</span>
              </div>

              {/* 3개 모드 토글 바 */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                <button
                  onClick={() => setZoneMode('distribution')}
                  className={`py-1 rounded-lg font-medium transition-colors ${
                    zoneMode === 'distribution'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  투구 분포 (%)
                </button>
                <button
                  onClick={() => setZoneMode('hra')}
                  className={`py-1 rounded-lg font-medium transition-colors ${
                    zoneMode === 'hra'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  피안타율 (BAA)
                </button>
                <button
                  onClick={() => setZoneMode('strikeout')}
                  className={`py-1 rounded-lg font-medium transition-colors ${
                    zoneMode === 'strikeout'
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  탈삼진 점유율
                </button>
              </div>
            </div>

            {/* 존 시각화 다이어그램 */}
            <div className="py-2 flex flex-col items-center">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-2">
                <span>포수/시청자 시점</span>
                <span>•</span>
                <span className="text-slate-500">좌: 우타자 몸쪽 / 우: 우타자 바깥쪽</span>
              </div>

              <div className="relative w-64 max-w-full">
                {/* 10번 존: 상단 볼 */}
                <div
                  className={`w-full py-1 mb-1 rounded-lg border text-center text-xs font-mono transition-all ${getZoneColor(
                    10
                  )}`}
                  title={zoneMap.get(10)?.label}
                >
                  <span className="text-[10px] opacity-70 block">존 상단</span>
                  {getZoneDisplayValue(10)}
                </div>

                <div className="flex items-center gap-1">
                  {/* 11번 존: 좌측 볼 */}
                  <div
                    className={`w-12 h-44 rounded-lg border flex flex-col items-center justify-center text-center text-xs font-mono transition-all ${getZoneColor(
                      11
                    )}`}
                    title={zoneMap.get(11)?.label}
                  >
                    <span className="text-[10px] opacity-70 block">좌측</span>
                    {getZoneDisplayValue(11)}
                  </div>

                  {/* 3x3 메인 스트라이크 존 (1~9번) */}
                  <div className="flex-grow grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border-2 border-slate-700 shadow-inner">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((zNum) => (
                      <div
                        key={zNum}
                        className={`h-14 rounded-lg border flex flex-col items-center justify-center text-center font-mono transition-all ${getZoneColor(
                          zNum
                        )}`}
                        title={zoneMap.get(zNum)?.label}
                      >
                        <span className="text-[9px] opacity-60">#{zNum}</span>
                        <span className="text-xs font-bold leading-none mt-0.5">
                          {getZoneDisplayValue(zNum)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 12번 존: 우측 볼 */}
                  <div
                    className={`w-12 h-44 rounded-lg border flex flex-col items-center justify-center text-center text-xs font-mono transition-all ${getZoneColor(
                      12
                    )}`}
                    title={zoneMap.get(12)?.label}
                  >
                    <span className="text-[10px] opacity-70 block">우측</span>
                    {getZoneDisplayValue(12)}
                  </div>
                </div>

                {/* 13번 존: 하단 볼 */}
                <div
                  className={`w-full py-1 mt-1 rounded-lg border text-center text-xs font-mono transition-all ${getZoneColor(
                    13
                  )}`}
                  title={zoneMap.get(13)?.label}
                >
                  <span className="text-[10px] opacity-70 block">존 하단 (유인구)</span>
                  {getZoneDisplayValue(13)}
                </div>
              </div>
            </div>

            {/* 존 하단 안내 문구 */}
            <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center">
              {zoneMode === 'distribution' && '붉은색일수록 해당 코스로 공이 많이 투구되었음을 의미합니다.'}
              {zoneMode === 'hra' && '초록색은 피안타율이 낮아 투수가 강한 코스, 붉은색은 피안타율이 높은 코스입니다.'}
              {zoneMode === 'strikeout' && '보라색일수록 삼진 카운트가 많이 기록된 결정구 코스입니다.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. 타자 타격 스타일 렌더링 (타자인 경우)
  if (battingAnalysis) {
    const { styleTitle, styleTags, scoutingReport, sprayDirection, tendencyLabel, hotColdZones, metrics } =
      battingAnalysis;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl">⚡</span>
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {styleTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  타구 방향 스프레이 및 스트라이크존 코스별 타율 핫/콜드 분석
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {styleTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80 shadow-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 text-xs md:text-sm text-slate-200 leading-relaxed">
              <p className="text-slate-300">{scoutingReport}</p>
            </div>

            {/* 타격 지표 칩 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">시즌 타율</span>
                <span className="text-base font-bold text-amber-300 font-mono">{metrics.hra}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">홈런 / 타점</span>
                <span className="text-base font-bold text-rose-400 font-mono">
                  {metrics.hr}홈런 / {metrics.rbi}타점
                </span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">OPS</span>
                <span className="text-base font-bold text-slate-100 font-mono">{metrics.ops}</span>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-0.5">타구 성향</span>
                <span className="text-xs font-bold text-blue-300 truncate block mt-0.5">
                  {tendencyLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 타구 방향 스프레이 차트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <span>🏟️</span>
              <span>타구 방향 분포 (Spray Chart)</span>
            </h3>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">좌측 (Left Field)</span>
                  <span className="text-slate-100 font-mono font-bold">{sprayDirection.left}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${sprayDirection.left}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">중앙 (Center Field)</span>
                  <span className="text-slate-100 font-mono font-bold">{sprayDirection.center}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${sprayDirection.center}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">우측 (Right Field)</span>
                  <span className="text-slate-100 font-mono font-bold">{sprayDirection.right}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${sprayDirection.right}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <span>🎯</span>
              <span>코스별 타율 (Hot / Cold Zone)</span>
            </h3>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2 rounded-xl border border-slate-800 max-w-xs mx-auto">
              {hotColdZones.map((z) => {
                const hraNum = parseFloat(z.hra);
                let color = 'bg-slate-900 text-slate-400';
                if (!isNaN(hraNum)) {
                  if (hraNum >= 0.350) color = 'bg-rose-600 text-white font-bold';
                  else if (hraNum >= 0.280) color = 'bg-amber-600/80 text-white font-semibold';
                  else if (hraNum <= 0.200) color = 'bg-blue-900/70 text-blue-200';
                  else color = 'bg-slate-800 text-slate-300';
                }
                return (
                  <div
                    key={z.zone}
                    className={`h-14 rounded-lg flex flex-col items-center justify-center text-center font-mono ${color}`}
                    title={z.label}
                  >
                    <span className="text-[9px] opacity-60">#{z.zone}</span>
                    <span className="text-xs font-bold leading-none mt-0.5">{z.hra}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
