"use client";

import React, { use, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Broadcast } from '@/lib/domain/broadcast';
import { useBroadcastStream } from '@/lib/useBroadcastStream';
import { LineScore } from '@/components/LineScore';
import { DiamondPanel } from '@/components/DiamondPanel';
import { CommentaryFeed } from '@/components/CommentaryFeed';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = use(params);

  // 실시간 SSE 스트림 연동
  const stream = useBroadcastStream(gameId);

  // 모드 상태: 'total' (실시간 라이브 / 전체 결과) | 'simulation' (시뮬레이션 리플레이)
  const [viewMode, setViewMode] = useState<'total' | 'simulation'>('total');
  const [simulatedCount, setSimulatedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // 이벤트당 ms

  // 시뮬레이션 모드에서 사용할 재구성된 Broadcast (useMemo로 메모이제이션하여 렌더링 낭비 방지)
  const simulatedBc = useMemo(() => {
    if (viewMode !== 'simulation' || !stream.gameMeta || stream.rawEvents.length === 0) {
      return null;
    }
    const bc = new Broadcast(stream.gameMeta, true);
    const limit = Math.min(simulatedCount, stream.rawEvents.length);
    for (let i = 0; i < limit; i++) {
      bc._applyEvent(stream.rawEvents[i], false);
    }
    if (limit === stream.rawEvents.length && stream.ended) {
      bc.ended = true;
      bc.addLine('end', '경기가 종료되었습니다. 시청해 주셔서 감사합니다!', 'end', 99999);
      bc.addLine(
        'end',
        `최종 스코어  ${bc.teamName('away')} ${bc.gs?.awayScore ?? '-'} : ${bc.gs?.homeScore ?? '-'} ${bc.teamName('home')}`,
        'end',
        100000
      );
    }
    return bc;
  }, [viewMode, simulatedCount, stream.gameMeta, stream.rawEvents, stream.ended]);

  // 시뮬레이션 자동 재생 타이머
  useEffect(() => {
    if (viewMode !== 'simulation' || !isPlaying || stream.rawEvents.length === 0) return;

    const timer = setInterval(() => {
      setSimulatedCount((prev) => {
        if (prev >= stream.rawEvents.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [viewMode, isPlaying, stream.rawEvents.length, playbackSpeed]);

  // 모드 변경 핸들러
  const handleModeChange = (mode: 'total' | 'simulation') => {
    setViewMode(mode);
    setIsPlaying(false);
    if (mode === 'total') {
      setSimulatedCount(stream.rawEvents.length);
    } else {
      setSimulatedCount(0);
    }
  };

  if (stream.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toss-canvas text-toss-inkPrimary gap-4">
        <div className="w-10 h-10 border-4 border-toss-primary border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-black tracking-tight select-none">중계 채널 연결 중</span>
          <span className="text-xs text-toss-inkMuted font-semibold">{stream.status}</span>
        </div>
      </div>
    );
  }

  if (!stream.gameMeta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toss-canvas text-toss-inkPrimary gap-4 p-4 text-center">
        <p className="text-toss-bullRed font-bold text-base select-none">
          경기를 찾을 수 없거나 중계 정보를 불러오는 데 실패했습니다.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-toss-surface hover:bg-toss-surfaceHover rounded-toss-lg border border-toss-borderLight text-xs font-bold shadow-sm"
        >
          경기 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 현재 모드에 따른 표시 데이터 결정
  const isSim = viewMode === 'simulation';
  const displayBc = isSim ? simulatedBc : stream.broadcastInstance;

  const gameState = isSim ? (displayBc?.gs ?? null) : stream.gameState;
  const inningScore = isSim ? (displayBc?.inningScore ?? { home: {}, away: {} }) : stream.inningScore;
  const currentInn = isSim ? (displayBc?.inn ?? 1) : stream.inn;
  const currentHalf = isSim ? (displayBc?.half ?? 'T') : stream.half;
  const currentLog = isSim ? (displayBc?.log ?? []) : stream.log;
  const isEnded = isSim ? (displayBc?.ended ?? false) : stream.ended;

  const currentPitcher = isSim ? displayBc?.currentPitcher() : stream.currentPitcher;
  const currentBatterName = isSim ? displayBc?.currentBatterName() : stream.currentBatterName;
  const currentBatterRecord = isSim ? displayBc?.batterNow : stream.currentBatterRecord;

  // 투수 구종별 투구 통계 가공
  const getPitcherStuffStats = () => {
    const statsSource = isSim ? displayBc?.pitchStats : stream.pitchStats;
    const pcode = gameState?.pitcher;
    if (!pcode || !statsSource) return [];
    const stats = statsSource[pcode];
    if (!stats) return [];

    return Object.entries(stats)
      .map(([stuff, speedMap]: [string, any]) => {
        let total = 0;
        const speeds: number[] = [];
        Object.entries(speedMap).forEach(([speedKey, item]: [string, any]) => {
          total += item.total || 0;
          const speedNum = Number(speedKey);
          if (Number.isFinite(speedNum)) {
            speeds.push(speedNum);
          }
        });
        const avgSpeed =
          speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : null;
        return { stuff, total, avgSpeed };
      })
      .sort((a, b) => b.total - a.total);
  };

  const pitcherStatsList = getPitcherStuffStats();

  const getSingleStatusLabel = () => {
    if (isEnded) return '경기종료';
    return `LIVE · ${currentInn}회 ${currentHalf === 'T' ? '초' : '말'}`;
  };

  return (
    <main className="min-h-screen pb-12 px-4 md:px-6 max-w-6xl mx-auto space-y-6">
      {/* 1. 상단 컴팩트 헤더 */}
      <div className="flex items-center justify-between border-b border-toss-borderLight py-4 select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-toss-lg bg-toss-surface hover:bg-toss-surfaceHover border border-toss-borderLight text-xs font-bold transition-all text-toss-inkTertiary shadow-sm"
          >
            ← 목록
          </Link>
          <div className="flex flex-col">
            <span className="text-sm font-black text-toss-inkPrimary tracking-tight">
              {stream.gameMeta.away?.name} VS {stream.gameMeta.home?.name}
            </span>
            <span className="text-[10px] text-toss-inkMuted font-bold">
              {stream.gameMeta.stadium || '구장'} · {stream.gameMeta.startTime || '오늘'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 스트림 상태 안내 배지 */}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-toss-xs bg-toss-canvas text-toss-inkMuted">
            {stream.status}
          </span>
          {/* 상태 칩 (LIVE or FINISHED) */}
          <span
            className={`px-3 py-1.5 rounded-toss-lg text-xs font-black tracking-tight flex items-center gap-1.5 ${
              isEnded
                ? 'bg-toss-canvas text-toss-inkTertiary'
                : 'bg-toss-primarySoft text-toss-primary'
            }`}
          >
            {!isEnded && <span className="w-1.5 h-1.5 rounded-full bg-toss-primary animate-pulse" />}
            {getSingleStatusLabel()}
          </span>
        </div>
      </div>

      {/* 2. 히어로 스코어보드 */}
      <div className="glass-panel p-6 md:p-8 bg-toss-surface border border-toss-borderLight rounded-toss-xl flex items-center justify-between text-center shadow-sm select-none relative overflow-hidden">
        {/* 원정팀 */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-3.5 min-w-0">
          <span className="text-lg md:text-2xl font-black text-toss-inkPrimary truncate w-full sm:w-auto sm:text-right">
            {stream.gameMeta.away?.name}
          </span>
          <span className="text-4xl md:text-5xl font-black text-toss-inkPrimary tracking-tight font-mono">
            {gameState?.awayScore ?? 0}
          </span>
        </div>

        {/* 중앙 리그 구분 및 콜론 */}
        <div className="flex flex-col items-center justify-center px-4 md:px-8 shrink-0">
          <span className="px-3 py-1 rounded-full bg-toss-canvas border border-toss-borderLight text-[10px] font-bold text-toss-inkMuted mb-1.5 tracking-tight uppercase">
            {stream.gameMeta.league || 'KBO'}
          </span>
          <span className="text-toss-inkFaint font-light text-2xl select-none">:</span>
        </div>

        {/* 홈팀 */}
        <div className="flex-1 flex flex-col sm:flex-row-reverse items-center sm:justify-end gap-3.5 min-w-0">
          <span className="text-lg md:text-2xl font-black text-toss-inkPrimary truncate w-full sm:w-auto sm:text-left">
            {stream.gameMeta.home?.name}
          </span>
          <span className="text-4xl md:text-5xl font-black text-toss-inkPrimary tracking-tight font-mono">
            {gameState?.homeScore ?? 0}
          </span>
        </div>
      </div>

      {/* 모드 선택 토글 (실시간 라이브 / 리플레이 시뮬레이션) */}
      <div className="flex justify-center select-none py-1">
        <div className="bg-toss-canvas p-0.5 flex gap-0.5 rounded-toss-lg border border-toss-borderLight/50">
          <button
            onClick={() => handleModeChange('total')}
            className={`px-6 py-2 rounded-toss-sm text-xs font-bold transition-all ${
              viewMode === 'total'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            실시간 중계
          </button>
          <button
            onClick={() => handleModeChange('simulation')}
            className={`px-6 py-2 rounded-toss-sm text-xs font-bold transition-all ${
              viewMode === 'simulation'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            시뮬레이션 리플레이
          </button>
        </div>
      </div>

      {/* 시뮬레이션 플레이어 컨트롤 패널 (시뮬레이션 모드일 때만 렌더링) */}
      {viewMode === 'simulation' && (
        <div className="glass-panel p-5 rounded-toss-xl border border-toss-borderLight bg-toss-surface shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            {/* 조작 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSimulatedCount(0);
                  setIsPlaying(false);
                }}
                disabled={stream.rawEvents.length === 0}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                ↺ 처음으로
              </button>
              <button
                onClick={() => {
                  setSimulatedCount((prev) => Math.max(0, prev - 1));
                  setIsPlaying(false);
                }}
                disabled={simulatedCount === 0}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                ◀ 이전 플레이
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={stream.rawEvents.length === 0}
                className={`px-6 py-2.5 text-white rounded-toss-lg text-xs font-black select-none shadow-sm transition-all ${
                  isPlaying
                    ? 'bg-toss-bullRed hover:bg-red-600'
                    : 'bg-toss-primary hover:bg-toss-primaryHover'
                }`}
              >
                {isPlaying ? '⏸ 일시정지' : '▶ 재생하기'}
              </button>
              <button
                onClick={() => {
                  setSimulatedCount((prev) => Math.min(stream.rawEvents.length, prev + 1));
                  setIsPlaying(false);
                }}
                disabled={simulatedCount >= stream.rawEvents.length}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                다음 플레이 ▶
              </button>
              <button
                onClick={() => {
                  setSimulatedCount(stream.rawEvents.length);
                  setIsPlaying(false);
                }}
                disabled={simulatedCount === stream.rawEvents.length}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                마지막으로 ⏭
              </button>
            </div>

            {/* 타임라인 슬라이더 */}
            <div className="flex-1 w-full flex items-center gap-3.5">
              <input
                type="range"
                min="0"
                max={stream.rawEvents.length}
                value={simulatedCount}
                onChange={(e) => {
                  setSimulatedCount(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-[#e5e8eb] rounded-lg appearance-none cursor-pointer accent-[#3182f6]"
              />
              <span className="text-xs text-toss-inkMuted font-mono font-bold shrink-0 select-none">
                {simulatedCount} / {stream.rawEvents.length}
              </span>
            </div>

            {/* 재생 속도 선택 */}
            <div className="flex items-center gap-1 shrink-0 bg-toss-canvas p-0.5 rounded-toss-lg border border-toss-borderLight/50 select-none">
              {[
                { label: '0.2초', val: 200 },
                { label: '0.5초', val: 500 },
                { label: '1초', val: 1000 },
                { label: '2초', val: 2000 },
              ].map((speed) => (
                <button
                  key={speed.val}
                  onClick={() => setPlaybackSpeed(speed.val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-toss-sm transition-all ${
                    playbackSpeed === speed.val
                      ? 'bg-toss-surface text-toss-primary shadow-sm font-black'
                      : 'text-toss-inkMuted hover:text-toss-inkSecondary'
                  }`}
                >
                  {speed.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. 그라운드 다이아몬드 및 투타 정보 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 다이아몬드 패널 & 볼카운트 */}
        <div className="lg:col-span-2">
          <DiamondPanel gameState={gameState} />
        </div>

        {/* 투수 vs 타자 매치업 카드 */}
        <div className="glass-panel p-6 rounded-toss-xl border border-toss-borderLight bg-toss-surface flex flex-col justify-between gap-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 divide-x divide-toss-borderLight">
            {/* 투수 */}
            <div className="flex flex-col justify-between min-h-[100px] pr-2">
              <div>
                <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-wider">
                  PITCHER
                </span>
                <h4 className="text-lg font-black text-toss-inkPrimary mt-1">
                  {currentPitcher?.name || '대기 중'}
                </h4>
              </div>
              {currentPitcher && (
                <div className="mt-3 space-y-0.5 text-xs text-toss-inkTertiary font-medium">
                  {currentPitcher.ballCount != null && (
                    <div>
                      투구수:{' '}
                      <span className="text-toss-primary font-bold">
                        {currentPitcher.ballCount}구
                      </span>
                    </div>
                  )}
                  {currentPitcher.seasonEra != null && (
                    <div>
                      평균자책점:{' '}
                      <span className="text-toss-inkPrimary font-bold">
                        {currentPitcher.seasonEra}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 타자 */}
            <div className="flex flex-col justify-between min-h-[100px] pl-4">
              <div>
                <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-wider">
                  BATTER
                </span>
                <h4 className="text-lg font-black text-toss-inkPrimary mt-1">
                  {currentBatterName || '대기 중'}
                </h4>
              </div>
              {currentBatterName && (
                <div className="mt-3 space-y-0.5 text-xs text-toss-inkTertiary font-medium">
                  {currentBatterRecord && (
                    <div>
                      오늘 기록:{' '}
                      <span className="text-toss-bullRed font-bold">
                        {currentBatterRecord.hit}안타 {currentBatterRecord.ab}타수
                      </span>
                    </div>
                  )}
                  {currentBatterRecord?.seasonHra != null && (
                    <div>
                      시즌 타율:{' '}
                      <span className="text-toss-inkPrimary font-bold">
                        .{Number(currentBatterRecord.seasonHra).toFixed(3).replace(/^0/, '')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 투수 구종 통계 */}
          {pitcherStatsList.length > 0 && (
            <div className="border-t border-toss-borderLight pt-4">
              <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-widest block mb-2">
                오늘의 투구 분석 ({currentPitcher?.name || '투수'})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pitcherStatsList.map((stat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-toss-lg bg-toss-canvas border border-toss-borderLight text-xs font-bold text-toss-inkTertiary"
                  >
                    {stat.stuff}: <span className="text-toss-primary font-black">{stat.total}구</span>
                    {stat.avgSpeed && (
                      <span className="text-toss-inkMuted font-normal ml-1">({stat.avgSpeed}k)</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. 라인 스코어보드 */}
      <LineScore
        inningScore={inningScore}
        gameState={gameState}
        awayName={stream.gameMeta.away?.name || '원정'}
        homeName={stream.gameMeta.home?.name || '홈'}
        currentInning={currentInn}
        half={currentHalf}
        ended={isEnded}
      />

      {/* 5. 문자중계 피드 */}
      <CommentaryFeed log={currentLog} />
    </main>
  );
}
