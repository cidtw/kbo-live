import { fetchGame, fetchRelay } from '@/lib/domain/api';
import { Broadcast } from '@/lib/domain/broadcast';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: gameId } = await params;
  const { searchParams } = new URL(request.url);
  const fromSeqParam = searchParams.get('fromSeq');
  let clientLastSeq = fromSeqParam ? Number(fromSeqParam) : -1;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let isAborted = false;
      let intervalId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        isAborted = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        try {
          controller.close();
        } catch (_) {}
      };

      request.signal.addEventListener('abort', cleanup);

      const sendEvent = (event: string, data: any) => {
        if (isAborted) return;
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (_) {
          cleanup();
        }
      };

      try {
        // 1. 경기 기본 정보 조회
        const game = await fetchGame(gameId);
        if (!game) {
          sendEvent('error', { message: '경기를 찾을 수 없습니다.' });
          cleanup();
          return;
        }

        const isFinished = game.statusCode === 'RESULT';

        // 2. 최신 릴레이 확인
        const latestRelay = await fetchRelay(gameId, undefined, isFinished);
        if (!latestRelay) {
          sendEvent('status', { status: '중계 준비 중', game });
          if (isFinished) {
            sendEvent('end', { message: '중계 피드가 없는 종료 경기입니다.' });
            cleanup();
            return;
          }
        }

        const curInning = Number(latestRelay?.inn) || 1;
        const allEvents: any[] = [];

        // 3. 이전 이닝 데이터 백필 (서버 인메모리 캐시 적극 활용)
        for (let i = 1; i < curInning; i++) {
          if (isAborted) return;
          try {
            const histRelay = await fetchRelay(gameId, i, isFinished);
            if (histRelay) {
              allEvents.push(...Broadcast.flatten(histRelay));
            }
          } catch (e) {
            console.warn(`[Stream] Inning ${i} backfill failed:`, e);
          }
        }

        if (latestRelay) {
          allEvents.push(...Broadcast.flatten(latestRelay));
        }

        // 중복 제거 및 정렬
        const seenSeq = new Set<number>();
        const uniqueEvents: any[] = [];
        for (const ev of allEvents) {
          if (!seenSeq.has(ev.seq)) {
            seenSeq.add(ev.seq);
            uniqueEvents.push(ev);
          }
        }
        uniqueEvents.sort((a, b) => a.seq - b.seq);

        // 클라이언트가 fromSeq를 보낸 경우 그 이후 이벤트만 필터
        const initialEvents = clientLastSeq >= 0
          ? uniqueEvents.filter((e) => e.seq > clientLastSeq)
          : uniqueEvents;

        if (uniqueEvents.length > 0) {
          clientLastSeq = Math.max(clientLastSeq, uniqueEvents[uniqueEvents.length - 1].seq);
        }

        // 초기 상태 전송
        sendEvent('init', {
          game,
          relay: latestRelay,
          events: initialEvents,
          lastSeq: clientLastSeq,
          ended: isFinished,
        });

        // 이미 종료된 경기라면 바로 종료 이벤트 전송
        if (isFinished) {
          sendEvent('end', { message: '경기 종료' });
          cleanup();
          return;
        }

        // 4. 실시간 경기인 경우 주기적 폴링 루프 시작 (5초 간격)
        let pollCount = 0;
        intervalId = setInterval(async () => {
          if (isAborted) return;

          try {
            const curRelay = await fetchRelay(gameId);
            if (!curRelay) return;

            const flatEvents = Broadcast.flatten(curRelay);
            const newEvents = flatEvents.filter((e) => e.seq > clientLastSeq);

            // seqno 공백(누락 이닝) 감지 시 해당 이닝 백필
            if (flatEvents.length > 0 && clientLastSeq >= 0 && flatEvents[0].seq > clientLastSeq + 1) {
              const gapFrom = Math.max(1, Number(latestRelay?.inn) || 1);
              const gapTo = Number(curRelay.inn) || gapFrom;
              for (let gi = gapFrom; gi < gapTo; gi++) {
                if (isAborted) return;
                try {
                  const gapRelay = await fetchRelay(gameId, gi);
                  if (gapRelay) {
                    const gapEvs = Broadcast.flatten(gapRelay).filter((e) => e.seq > clientLastSeq);
                    newEvents.push(...gapEvs);
                  }
                } catch (_) {}
              }
              newEvents.sort((a, b) => a.seq - b.seq);
            }

            if (newEvents.length > 0) {
              // 중복 제거 후 전송
              const delta: any[] = [];
              for (const ev of newEvents) {
                if (ev.seq > clientLastSeq) {
                  clientLastSeq = ev.seq;
                  delta.push(ev);
                }
              }

              if (delta.length > 0) {
                sendEvent('update', {
                  relay: curRelay,
                  events: delta,
                  lastSeq: clientLastSeq,
                });
              }
            }

            pollCount++;

            // 6회 폴링마다(약 30초) 게임 종료 상태 여부 확인
            if (pollCount % 6 === 0) {
              const checkGame = await fetchGame(gameId);
              if (checkGame?.statusCode === 'RESULT' || checkGame?.cancel) {
                sendEvent('end', {
                  message: checkGame.cancel ? '우천/경기 취소' : '경기 종료',
                  finalGame: checkGame,
                });
                cleanup();
              }
            }
          } catch (err: any) {
            sendEvent('warning', { message: `일시적 업데이트 지연: ${err.message}` });
          }
        }, 5000);
      } catch (err: any) {
        sendEvent('error', { message: err.message || '스트림 초기화 실패' });
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
