import { useEffect, useState, useRef } from 'react';
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
}

export function useBroadcastStream(gameId: string, intervalSeconds = 10): UseBroadcastStreamResult {
  const [loading, setLoading] = useState(true);
  const [gameMeta, setGameMeta] = useState<any>(null);
  const [log, setLog] = useState<BroadcastLogEntry[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inningScore, setInningScore] = useState<InningScore>({ home: {}, away: {} });
  const [inn, setInn] = useState(0);
  const [half, setHalf] = useState<'T' | 'B'>('T');
  const [status, setStatus] = useState('접속 중…');
  const [ended, setEnded] = useState(false);
  const [currentPitcher, setCurrentPitcher] = useState<any>(null);
  const [currentBatterName, setCurrentBatterName] = useState<string | null>(null);
  const [currentBatterRecord, setCurrentBatterRecord] = useState<any>(null);
  const [pitchStats, setPitchStats] = useState<any>({});

  const broadcastRef = useRef<Broadcast | null>(null);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    async function initStream() {
      try {
        setLoading(true);
        setStatus('경기 정보 조회 중…');

        // 1. Fetch game meta
        const metaRes = await fetch(`/api/game/${gameId}`);
        if (!metaRes.ok) throw new Error('경기 메타데이터를 불러오지 못했습니다.');
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

        const bc = new Broadcast(meta);
        broadcastRef.current = bc;

        // 2. Fetch first relay
        setStatus('중계 피드 연결 중…');
        const relayRes = await fetch(`/api/relay/${gameId}`);
        if (!relayRes.ok) throw new Error('중계 피드를 불러오지 못했습니다.');
        const { relay } = await relayRes.json();
        if (!active) return;

        if (!relay) {
          setStatus('중계 피드를 대기하고 있습니다…');
          updateReactState(bc);
          setLoading(false);
          return;
        }

        // 3. Backfill history
        const curInning = Number(relay.inn) || 1;
        if (curInning > 1) {
          for (let i = 1; i < curInning; i++) {
            if (!active) return;
            setStatus(`지난 기록 복원 중… (${i}회)`);
            try {
              const histRes = await fetch(`/api/relay/${gameId}?inning=${i}`);
              if (histRes.ok) {
                const histData = await histRes.json();
                if (histData.relay) {
                  bc.ingestRelay(histData.relay);
                }
              }
            } catch (err) {
              console.error(`Inning ${i} backfill failed:`, err);
            }
          }
        }

        if (!active) return;
        setStatus('지난 기록 복원 완료');
        bc.ingestRelay(relay);

        if (bc.ended) {
          bc.status = '경기 종료';
          setStatus('경기 종료');
          bc.addLine('end', '경기가 종료되었습니다. 시청해 주셔서 감사합니다!', 'end', 99999);
          bc.addLine('end', `최종 스코어  ${bc.teamName('away')} ${bc.gs?.awayScore ?? '-'} : ${bc.gs?.homeScore ?? '-'} ${bc.teamName('home')}`, 'end', 100000);
        } else {
          bc.status = '라이브 중계 중';
          setStatus('라이브 중계 중');
        }

        updateReactState(bc);
        setLoading(false);

        // 4. Start live polling
        if (!bc.ended) {
          timerId = setInterval(async () => {
            try {
              const pollRes = await fetch(`/api/relay/${gameId}`);
              if (!pollRes.ok) throw new Error('네트워크 연결 끊김');
              const pollData = await pollRes.json();
              if (!active) return;

              if (pollData.relay) {
                // Check if we missed any innings due to interval gaps
                if (bc.hasGapBefore(pollData.relay)) {
                  const from = Math.max(1, bc.inn);
                  const to = Number(pollData.relay.inn) || from;
                  for (let i = from; i < to; i++) {
                    if (!active) return;
                    try {
                      const gapRes = await fetch(`/api/relay/${gameId}?inning=${i}`);
                      if (gapRes.ok) {
                        const gapData = await gapRes.json();
                        if (gapData.relay) bc.ingestRelay(gapData.relay);
                      }
                    } catch (_) {}
                  }
                }

                if (!active) return;
                bc.ingestRelay(pollData.relay);

                if (bc.ended) {
                  bc.status = '경기 종료';
                  setStatus('경기 종료');
                  bc.addLine('end', '경기가 종료되었습니다. 시청해 주셔서 감사합니다!', 'end', 99999);
                  bc.addLine('end', `최종 스코어  ${bc.teamName('away')} ${bc.gs?.awayScore ?? '-'} : ${bc.gs?.homeScore ?? '-'} ${bc.teamName('home')}`, 'end', 100000);
                  if (timerId) clearInterval(timerId);
                } else {
                  bc.status = '라이브 중계 중';
                  setStatus('라이브 중계 중');
                }

                updateReactState(bc);
              }
            } catch (err: any) {
              if (active) {
                setStatus(`오류: ${err.message || '네트워크 연결 오류'} — 재시도 중`);
              }
            }
          }, intervalSeconds * 1000);
        }
      } catch (err: any) {
        if (active) {
          setStatus(`접속 실패: ${err.message}`);
          setLoading(false);
        }
      }
    }

    function updateReactState(bc: Broadcast) {
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
    }

    initStream();

    return () => {
      active = false;
      if (timerId) clearInterval(timerId);
    };
  }, [gameId, intervalSeconds]);

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
  };
}
