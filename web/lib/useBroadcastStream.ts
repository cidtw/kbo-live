import { useEffect, useState, useRef, useCallback } from 'react';
import { Broadcast, GameState, InningScore, BroadcastLogEntry } from './domain/broadcast';

export interface UseBroadcastStreamResult {
  gameMeta: any;
  log: BroadcastLogEntry[];
  gameState: GameState | null;
  inningScore: InningScore;
  inn: number;
  half: 'T' | 'B';
  status: string;
  ended: boolean;
  currentPitcher: any;
  currentBatterName: string | null;
  currentBatterRecord: any;
  pitchStats: any;
  loading: boolean;
  rawEvents: any[];
  broadcastInstance: Broadcast | null;
}

export function useBroadcastStream(gameId: string): UseBroadcastStreamResult {
  const [loading, setLoading] = useState(true);
  const [gameMeta, setGameMeta] = useState<any>(null);
  const [log, setLog] = useState<BroadcastLogEntry[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inningScore, setInningScore] = useState<InningScore>({ home: {}, away: {} });
  const [inn, setInn] = useState(0);
  const [half, setHalf] = useState<'T' | 'B'>('T');
  const [status, setStatus] = useState('중계 연결 중…');
  const [ended, setEnded] = useState(false);
  const [currentPitcher, setCurrentPitcher] = useState<any>(null);
  const [currentBatterName, setCurrentBatterName] = useState<string | null>(null);
  const [currentBatterRecord, setCurrentBatterRecord] = useState<any>(null);
  const [pitchStats, setPitchStats] = useState<any>({});
  const [rawEvents, setRawEvents] = useState<any[]>([]);

  const broadcastRef = useRef<Broadcast | null>(null);
  const rawEventsRef = useRef<any[]>([]);

  const syncStateFromBc = useCallback((bc: Broadcast) => {
    setLog([...bc.log]);
    setGameState(bc.gs ? { ...bc.gs } : null);
    setInningScore({
      home: { ...bc.inningScore.home },
      away: { ...bc.inningScore.away },
    });
    setInn(bc.inn);
    setHalf(bc.half);
    setEnded(bc.ended);
    setCurrentPitcher(bc.currentPitcher());
    setCurrentBatterName(bc.currentBatterName());
    setCurrentBatterRecord(bc.batterNow);
    setPitchStats({ ...bc.pitchStats });
  }, []);

  useEffect(() => {
    if (!gameId) return;

    let active = true;
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;
    rawEventsRef.current = [];

    // Fallback polling function if SSE is unavailable or errors out
    const startFallbackPolling = (bc: Broadcast) => {
      if (fallbackInterval || !active || bc.ended) return;
      console.warn('[BroadcastStream] Switching to HTTP polling fallback');

      fallbackInterval = setInterval(async () => {
        if (!active || bc.ended) {
          if (fallbackInterval) clearInterval(fallbackInterval);
          return;
        }
        try {
          const pollRes = await fetch(`/api/relay/${encodeURIComponent(gameId)}`);
          if (!pollRes.ok) return;
          const { relay } = await pollRes.json();
          if (relay) {
            const addedCount = bc.ingestRelay(relay);
            if (addedCount > 0) {
              const newEvs = Broadcast.flatten(relay);
              const merged = [...rawEventsRef.current];
              const seen = new Set(merged.map((e) => e.seq));
              for (const ev of newEvs) {
                if (!seen.has(ev.seq)) {
                  seen.add(ev.seq);
                  merged.push(ev);
                }
              }
              merged.sort((a, b) => a.seq - b.seq);
              rawEventsRef.current = merged;
              setRawEvents(merged);
            }
            if (bc.ended) {
              setStatus('경기 종료');
              if (fallbackInterval) clearInterval(fallbackInterval);
            }
            syncStateFromBc(bc);
          }
        } catch (_) {}
      }, 7000);
    };

    const initSSE = () => {
      setLoading(true);
      setStatus('실시간 중계 스트림 연결 중…');

      const streamUrl = `/api/relay/${encodeURIComponent(gameId)}/stream`;
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('init', (e: MessageEvent) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          const { game, relay, events, ended: isFinished } = data;

          const league = game?.leagueName || 'KBO';
          const stadium = game?.stadium;
          const home = { code: game?.homeTeamCode, name: game?.homeTeamName };
          const away = { code: game?.awayTeamCode, name: game?.awayTeamName };
          const startTime = game?.gameStartDate;

          const meta = { league, stadium, home, away, startTime };
          setGameMeta(meta);

          const bc = new Broadcast(meta);
          broadcastRef.current = bc;

          if (relay) {
            bc._absorbMeta(relay);
          }

          if (Array.isArray(events) && events.length > 0) {
            rawEventsRef.current = events;
            setRawEvents(events);
            for (const ev of events) {
              bc._applyEvent(ev, false);
            }
          }

          if (isFinished || bc.ended) {
            bc.ended = true;
            setStatus('경기 종료');
            bc.addLine('end', '경기가 종료되었습니다. 시청해 주셔서 감사합니다!', 'end', 99999);
            bc.addLine(
              'end',
              `최종 스코어  ${bc.teamName('away')} ${bc.gs?.awayScore ?? '-'} : ${bc.gs?.homeScore ?? '-'} ${bc.teamName('home')}`,
              'end',
              100000
            );
          } else {
            setStatus('실시간 중계 중');
          }

          syncStateFromBc(bc);
          setLoading(false);
        } catch (err: any) {
          console.error('[BroadcastStream] init error:', err);
          setStatus(`초기 데이터 처리 실패: ${err.message}`);
          setLoading(false);
        }
      });

      eventSource.addEventListener('update', (e: MessageEvent) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          const { relay, events: deltaEvents } = data;
          const bc = broadcastRef.current;
          if (!bc) return;

          if (relay) {
            bc._absorbMeta(relay);
          }

          if (Array.isArray(deltaEvents) && deltaEvents.length > 0) {
            const merged = [...rawEventsRef.current];
            const seen = new Set(merged.map((ev) => ev.seq));
            for (const ev of deltaEvents) {
              if (!seen.has(ev.seq)) {
                seen.add(ev.seq);
                merged.push(ev);
                bc._applyEvent(ev, false);
              }
            }
            merged.sort((a, b) => a.seq - b.seq);
            rawEventsRef.current = merged;
            setRawEvents(merged);
          }

          setStatus(bc.ended ? '경기 종료' : '실시간 중계 중');
          syncStateFromBc(bc);
        } catch (err) {
          console.error('[BroadcastStream] update error:', err);
        }
      });

      eventSource.addEventListener('end', (e: MessageEvent) => {
        if (!active) return;
        const bc = broadcastRef.current;
        if (bc) {
          bc.ended = true;
          syncStateFromBc(bc);
        }
        setEnded(true);
        setStatus('경기 종료');
        if (eventSource) {
          eventSource.close();
        }
      });

      eventSource.addEventListener('warning', (e: MessageEvent) => {
        if (!active) return;
        try {
          const data = JSON.parse(e.data);
          console.warn('[BroadcastStream] Server warning:', data.message);
        } catch (_) {}
      });

      eventSource.addEventListener('error', () => {
        if (!active) return;
        console.warn('[BroadcastStream] EventSource connection issue. Falling back to HTTP polling.');
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (broadcastRef.current) {
          startFallbackPolling(broadcastRef.current);
        }
      });
    };

    initSSE();

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [gameId, syncStateFromBc]);

  return {
    gameMeta,
    log,
    gameState,
    inningScore,
    inn,
    half,
    status,
    ended,
    currentPitcher,
    currentBatterName,
    currentBatterRecord,
    pitchStats,
    loading,
    rawEvents,
    broadcastInstance: broadcastRef.current,
  };
}
