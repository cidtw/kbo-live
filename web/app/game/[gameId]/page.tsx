"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Broadcast } from '@/lib/domain/broadcast';
import { LineScore } from '@/components/LineScore';
import { DiamondPanel } from '@/components/DiamondPanel';
import { CommentaryFeed } from '@/components/CommentaryFeed';

interface GamePageProps {
  params: Promise<{ gameId: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { gameId } = use(params);

  // States
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('접속 중…');
  const [gameMeta, setGameMeta] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [finalRelayData, setFinalRelayData] = useState<any>(null);
  const [actualEnded, setActualEnded] = useState(false);

  // Modes: 'total' (Total Result) | 'simulation' (Simulation)
  const [viewMode, setViewMode] = useState<'total' | 'simulation'>('total');
  const [simulatedCount, setSimulatedCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms per event

  // Polling ref to prevent concurrent fetches
  const isPollingRef = useRef(false);

  // Initial Fetch & Events Reconstruction
  useEffect(() => {
    let active = true;

    async function loadGameDetails() {
      try {
        setLoading(true);
        setStatus('경기 정보를 불러오는 중…');

        // 1. Fetch game metadata
        const metaRes = await fetch(`/api/game/${gameId}`);
        if (!metaRes.ok) throw new Error('경기 정보를 불러올 수 없습니다.');
        const { game } = await metaRes.json();
        if (!active) return;

        if (!game) {
          setStatus('경기를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        const league = game.leagueName || 'KBO';
        const stadium = game.stadium;
        const home = { code: game.homeTeamCode, name: game.homeTeamName };
        const away = { code: game.awayTeamCode, name: game.awayTeamName };
        const startTime = game.gameStartDate;
        const meta = { league, stadium, home, away, startTime };
        setGameMeta(meta);

        const endedGame = game.statusCode === 'RESULT';
        setActualEnded(endedGame);

        // 2. Fetch the latest relay
        setStatus('중계 데이터를 연동하는 중…');
        const relayRes = await fetch(`/api/relay/${gameId}`);
        if (!relayRes.ok) throw new Error('중계 데이터를 불러올 수 없습니다.');
        const { relay } = await relayRes.json();
        if (!active) return;

        setFinalRelayData(relay);

        if (!relay) {
          setStatus('중계가 예정되어 있으며 피드가 아직 생성되지 않았습니다.');
          setLoading(false);
          return;
        }

        // 3. Parallel fetch all previous innings
        const curInning = Number(relay.inn) || 1;
        setStatus('지난 이닝 정보 분석 중…');

        const inningPromises = [];
        for (let i = 1; i <= curInning; i++) {
          inningPromises.push(
            fetch(`/api/relay/${gameId}?inning=${i}`)
              .then(res => res.ok ? res.json() : null)
              .catch(() => null)
          );
        }

        const results = await Promise.all(inningPromises);
        if (!active) return;

        const allEvents: any[] = [];
        results.forEach(res => {
          if (res && res.relay) {
            allEvents.push(...Broadcast.flatten(res.relay));
          }
        });

        allEvents.push(...Broadcast.flatten(relay));

        // De-duplicate events by seqno
        const seen = new Set();
        const uniqueEvents: any[] = [];
        for (const ev of allEvents) {
          if (!seen.has(ev.seq)) {
            seen.add(ev.seq);
            uniqueEvents.push(ev);
          }
        }
        uniqueEvents.sort((a, b) => a.seq - b.seq);

        setEvents(uniqueEvents);
        setSimulatedCount(uniqueEvents.length);
        setStatus(endedGame ? '중계 종료' : '실시간 중계 중');
        setLoading(false);
      } catch (err: any) {
        if (active) {
          setStatus(`데이터 연결 실패: ${err.message}`);
          setLoading(false);
        }
      }
    }

    loadGameDetails();

    return () => {
      active = false;
    };
  }, [gameId]);

  // Live Polling
  useEffect(() => {
    if (actualEnded || loading || !gameMeta) return;

    const pollInterval = setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const pollRes = await fetch(`/api/relay/${gameId}`);
        if (pollRes.ok) {
          const { relay } = await pollRes.json();
          if (relay) {
            const newEvents = Broadcast.flatten(relay);
            
            let addedNew = false;
            setEvents(prev => {
              const seen = new Set(prev.map(e => e.seq));
              const merged = [...prev];
              for (const ev of newEvents) {
                if (!seen.has(ev.seq)) {
                  seen.add(ev.seq);
                  merged.push(ev);
                  addedNew = true;
                }
              }
              if (addedNew) {
                merged.sort((a, b) => a.seq - b.seq);
                if (viewMode === 'total') {
                  setSimulatedCount(merged.length);
                }
                return merged;
              }
              return prev;
            });

            setFinalRelayData(relay);
            if (relay.textRelays?.some((b: any) => /경기\s*종료/.test(b.textOptions?.[0]?.text || ''))) {
              setActualEnded(true);
              setStatus('경기 종료');
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      } finally {
        isPollingRef.current = false;
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [gameId, actualEnded, loading, gameMeta, viewMode]);

  // Playback timer for Simulation Mode
  useEffect(() => {
    if (viewMode !== 'simulation' || !isPlaying || events.length === 0) return;

    const timer = setInterval(() => {
      setSimulatedCount(prev => {
        if (prev >= events.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(timer);
  }, [viewMode, isPlaying, events.length, playbackSpeed]);

  // Handle Mode Change
  const handleModeChange = (mode: 'total' | 'simulation') => {
    setViewMode(mode);
    setIsPlaying(false);
    if (mode === 'total') {
      setSimulatedCount(events.length);
    } else {
      setSimulatedCount(0);
    }
  };

  const getSimulatedState = () => {
    if (!gameMeta || events.length === 0) return null;

    const isSim = viewMode === 'simulation';
    const limit = isSim ? simulatedCount : events.length;

    const bc = new Broadcast(gameMeta, isSim);
    
    if (finalRelayData) {
      bc._absorbMeta(finalRelayData);
    }

    for (let i = 0; i < limit; i++) {
      bc._applyEvent(events[i], false);
    }

    if (limit === events.length && actualEnded) {
      bc.ended = true;
      bc.addLine('end', '경기가 종료되었습니다. 시청해 주셔서 감사합니다!', 'end', 99999);
      bc.addLine('end', `최종 스코어  ${bc.teamName('away')} ${bc.gs?.awayScore ?? '-'} : ${bc.gs?.homeScore ?? '-'} ${bc.teamName('home')}`, 'end', 100000);
    }

    return bc;
  };

  const bc = getSimulatedState();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toss-canvas text-toss-inkPrimary gap-4">
        <div className="w-10 h-10 border-4 border-toss-primary border-t-transparent rounded-full animate-spin" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-black tracking-tight select-none">중계 채널 연결 중</span>
          <span className="text-xs text-toss-inkMuted font-semibold">{status}</span>
        </div>
      </div>
    );
  }

  if (!gameMeta || !bc) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-toss-canvas text-toss-inkPrimary gap-4 p-4 text-center">
        <p className="text-toss-bullRed font-bold text-base select-none">경기를 찾을 수 없거나 중계 정보를 불러오는 데 실패했습니다.</p>
        <Link href="/" className="px-5 py-2.5 bg-toss-surface hover:bg-toss-surfaceHover rounded-toss-lg border border-toss-borderLight text-xs font-bold shadow-sm">
          경기 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const getPitcherStuffStats = () => {
    const pcode = bc.gs?.pitcher;
    if (!pcode) return [];
    const stats = bc.pitchStats[pcode];
    if (!stats) return [];

    return Object.entries(stats).map(([stuff, speedMap]: [string, any]) => {
      let total = 0;
      let speeds: number[] = [];
      Object.entries(speedMap).forEach(([speedKey, item]: [string, any]) => {
        total += item.total || 0;
        const speedNum = Number(speedKey);
        if (Number.isFinite(speedNum)) {
          speeds.push(speedNum);
        }
      });
      const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : null;
      return { stuff, total, avgSpeed };
    }).sort((a, b) => b.total - a.total);
  };

  const pitcherStatsList = getPitcherStuffStats();

  const getSingleStatusLabel = () => {
    if (bc.ended) return '경기종료';
    return `LIVE · ${bc.inn}회 ${bc.half === 'T' ? '초' : '말'}`;
  };

  return (
    <main className="min-h-screen pb-12 px-4 md:px-6 max-w-6xl mx-auto space-y-6">
      
      {/* 1. Compact Header */}
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
              {gameMeta.away?.name} VS {gameMeta.home?.name}
            </span>
            <span className="text-[10px] text-toss-inkMuted font-bold">
              {gameMeta.stadium || '구장'} · {gameMeta.startTime || '오늘'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Polling / Network status indicator (small) */}
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-toss-xs bg-toss-canvas text-toss-inkMuted">
            {status}
          </span>
          {/* Single status chip (LIVE or FINISHED) */}
          <span
            className={`px-3 py-1.5 rounded-toss-lg text-xs font-black tracking-tight flex items-center gap-1.5 ${
              actualEnded
                ? 'bg-toss-canvas text-toss-inkTertiary'
                : 'bg-toss-primarySoft text-toss-primary'
            }`}
          >
            {!actualEnded && <span className="w-1.5 h-1.5 rounded-full bg-toss-primary animate-pulse" />}
            {getSingleStatusLabel()}
          </span>
        </div>
      </div>

      {/* 2. Hero Score Strip */}
      <div className="glass-panel p-6 md:p-8 bg-toss-surface border border-toss-borderLight rounded-toss-xl flex items-center justify-between text-center shadow-sm select-none relative overflow-hidden">
        {/* Away Team */}
        <div className="flex-1 flex flex-col sm:flex-row items-center sm:justify-end gap-3.5 min-w-0">
          <span className="text-lg md:text-2xl font-black text-toss-inkPrimary truncate w-full sm:w-auto sm:text-right">
            {gameMeta.away?.name}
          </span>
          <span className="text-4xl md:text-5xl font-black text-toss-inkPrimary tracking-tight mono-font">
            {bc.gs?.awayScore ?? 0}
          </span>
        </div>

        {/* Center Divider / Half */}
        <div className="flex flex-col items-center justify-center px-4 md:px-8 shrink-0">
          <span className="px-3 py-1 rounded-full bg-toss-canvas border border-toss-borderLight text-[10px] font-bold text-toss-inkMuted mb-1.5 tracking-tight uppercase">
            {gameMeta.league || 'KBO'}
          </span>
          <span className="text-toss-inkFaint font-light text-2xl select-none">:</span>
        </div>

        {/* Home Team */}
        <div className="flex-1 flex flex-col sm:flex-row-reverse items-center sm:justify-end gap-3.5 min-w-0">
          <span className="text-lg md:text-2xl font-black text-toss-inkPrimary truncate w-full sm:w-auto sm:text-left">
            {gameMeta.home?.name}
          </span>
          <span className="text-4xl md:text-5xl font-black text-toss-inkPrimary tracking-tight mono-font">
            {bc.gs?.homeScore ?? 0}
          </span>
        </div>
      </div>

      {/* Mode Selector Segmented Toggle */}
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
            전체 결과 보기
          </button>
          <button
            onClick={() => handleModeChange('simulation')}
            className={`px-6 py-2 rounded-toss-sm text-xs font-bold transition-all ${
              viewMode === 'simulation'
                ? 'bg-toss-surface text-toss-inkPrimary shadow-sm'
                : 'text-toss-inkMuted hover:text-toss-inkSecondary'
            }`}
          >
            실시간 시뮬레이션
          </button>
        </div>
      </div>

      {/* 7. Simulation Playback Chrome (Toss styled player widget) */}
      {viewMode === 'simulation' && (
        <div className="glass-panel p-5 rounded-toss-xl border border-toss-borderLight bg-toss-surface shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            {/* Playback Transport Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSimulatedCount(0);
                  setIsPlaying(false);
                }}
                disabled={events.length === 0}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                ↺ 처음으로
              </button>
              <button
                onClick={() => {
                  setSimulatedCount(prev => Math.max(0, prev - 1));
                  setIsPlaying(false);
                }}
                disabled={simulatedCount === 0}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                ◀ 이전 플레이
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={events.length === 0}
                className={`px-6 py-2.5 text-white rounded-toss-lg text-xs font-black select-none shadow-sm transition-all ${
                  isPlaying ? 'bg-toss-bullRed hover:bg-red-600' : 'bg-toss-primary hover:bg-toss-primaryHover'
                }`}
              >
                {isPlaying ? '⏸ 일시정지' : '▶ 재생하기'}
              </button>
              <button
                onClick={() => {
                  setSimulatedCount(prev => Math.min(events.length, prev + 1));
                  setIsPlaying(false);
                }}
                disabled={simulatedCount >= events.length}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                다음 플레이 ▶
              </button>
              <button
                onClick={() => {
                  setSimulatedCount(events.length);
                  setIsPlaying(false);
                }}
                disabled={simulatedCount === events.length}
                className="px-3.5 py-2.5 bg-toss-canvas hover:bg-toss-surfaceHover disabled:opacity-50 text-toss-inkTertiary rounded-toss-lg text-xs font-bold select-none border border-toss-borderLight"
              >
                마지막으로 ⏭
              </button>
            </div>

            {/* Scrub Slider */}
            <div className="flex-1 w-full flex items-center gap-3.5">
              <input
                type="range"
                min="0"
                max={events.length}
                value={simulatedCount}
                onChange={(e) => {
                  setSimulatedCount(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-[#e5e8eb] rounded-lg appearance-none cursor-pointer accent-[#3182f6]"
              />
              <span className="text-xs text-toss-inkMuted font-mono font-bold shrink-0 select-none">
                {simulatedCount} / {events.length}
              </span>
            </div>

            {/* Playback Speed Segmented buttons */}
            <div className="flex items-center gap-1 shrink-0 bg-toss-canvas p-0.5 rounded-toss-lg border border-toss-borderLight/50 select-none">
              {[
                { label: '0.2초', val: 200 },
                { label: '0.5초', val: 500 },
                { label: '1초', val: 1000 },
                { label: '2초', val: 2000 },
              ].map(speed => (
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

      {/* 3. Diamond Panel & B/S/O */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Diamond (Span 2 for emphasis) */}
        <div className="lg:col-span-2">
          <DiamondPanel gameState={bc.gs} />
        </div>

        {/* 5. Pitcher vs Batter Profile Card */}
        <div className="glass-panel p-6 rounded-toss-xl border border-toss-borderLight bg-toss-surface flex flex-col justify-between gap-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4 divide-x divide-toss-borderLight">
            {/* Pitcher */}
            <div className="flex flex-col justify-between min-h-[100px] pr-2">
              <div>
                <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-wider">PITCHER</span>
                <h4 className="text-lg font-black text-toss-inkPrimary mt-1">
                  {bc.currentPitcher()?.name || '대기 중'}
                </h4>
              </div>
              {bc.currentPitcher() && (
                <div className="mt-3 space-y-0.5 text-xs text-toss-inkTertiary font-medium">
                  {bc.currentPitcher().ballCount != null && (
                    <div>투구수: <span className="text-toss-primary font-bold">{bc.currentPitcher().ballCount}구</span></div>
                  )}
                  {bc.currentPitcher().seasonEra != null && (
                    <div>평균자책점: <span className="text-toss-inkPrimary font-bold">{bc.currentPitcher().seasonEra}</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Batter */}
            <div className="flex flex-col justify-between min-h-[100px] pl-4">
              <div>
                <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-wider">BATTER</span>
                <h4 className="text-lg font-black text-toss-inkPrimary mt-1">
                  {bc.currentBatterName() || '대기 중'}
                </h4>
              </div>
              {bc.currentBatterName() && (
                <div className="mt-3 space-y-0.5 text-xs text-toss-inkTertiary font-medium">
                  {bc.batterNow && (
                    <div>
                      오늘 기록:{' '}
                      <span className="text-toss-bullRed font-bold">
                        {bc.batterNow.hit}안타 {bc.batterNow.ab}타수
                      </span>
                    </div>
                  )}
                  {bc.batterNow?.seasonHra != null && (
                    <div>
                      시즌 타율:{' '}
                      <span className="text-toss-inkPrimary font-bold">
                        .{Number(bc.batterNow.seasonHra).toFixed(3).replace(/^0/, '')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pitch Stats */}
          {pitcherStatsList.length > 0 && (
            <div className="border-t border-toss-borderLight pt-4">
              <span className="text-[10px] text-toss-inkMuted font-bold uppercase tracking-widest block mb-2">
                오늘의 투구 분석 ({bc.currentPitcher()?.name || '투수'})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {pitcherStatsList.map((stat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-toss-lg bg-toss-canvas border border-toss-borderLight text-xs font-bold text-toss-inkTertiary"
                  >
                    {stat.stuff}: <span className="text-toss-primary font-black">{stat.total}구</span>
                    {stat.avgSpeed && <span className="text-toss-inkMuted font-normal ml-1">({stat.avgSpeed}k)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Line Scoreboard */}
      <LineScore
        inningScore={bc.inningScore}
        gameState={bc.gs}
        awayName={gameMeta.away?.name || '원정'}
        homeName={gameMeta.home?.name || '홈'}
        currentInning={bc.inn}
        half={bc.half}
        ended={bc.ended}
      />

      {/* 6. Commentary Feed */}
      <CommentaryFeed log={bc.log} />

    </main>
  );
}
