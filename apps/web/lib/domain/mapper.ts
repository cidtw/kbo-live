export interface TeamViewModel {
  code: string;
  name: string;
  score?: number | string;
}

export interface GameViewModel {
  gameId: string;
  awayTeam: TeamViewModel;
  homeTeam: TeamViewModel;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED' | 'CANCELLED';
  statusLabel: string;
  stadium: string;
  startTime: string; // HH:MM format
  tvBroadcaster?: string;
  isLive: boolean;
  isDone: boolean;
  isCancelled: boolean;
}

const formatTime = (dateTimeStr: string) => {
  try {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch (_) {
    return '18:30';
  }
};

export function mapToGameViewModel(game: any): GameViewModel {
  const isCancelled = !!game.cancel;
  const isDone = game.statusCode === 'RESULT';
  const isLive = !isCancelled && !isDone && game.statusCode !== 'BEFORE' && game.statusCode !== 'READY';

  let status: GameViewModel['status'] = 'SCHEDULED';
  if (isCancelled) {
    status = 'CANCELLED';
  } else if (isLive) {
    status = 'LIVE';
  } else if (isDone) {
    status = 'FINISHED';
  }

  let statusLabel = '';
  if (isCancelled) {
    statusLabel = '우천취소';
  } else if (isLive) {
    statusLabel = game.statusInfo || 'LIVE';
  } else if (isDone) {
    statusLabel = '경기종료';
  } else {
    statusLabel = formatTime(game.gameDateTime);
  }

  return {
    gameId: game.gameId,
    awayTeam: {
      code: game.awayTeamCode,
      name: game.awayTeamName,
      score: showScore(status) ? game.awayTeamScore : undefined,
    },
    homeTeam: {
      code: game.homeTeamCode,
      name: game.homeTeamName,
      score: showScore(status) ? game.homeTeamScore : undefined,
    },
    status,
    statusLabel,
    stadium: game.stadium,
    startTime: formatTime(game.gameDateTime),
    tvBroadcaster: game.tv,
    isLive,
    isDone,
    isCancelled,
  };
}

function showScore(status: GameViewModel['status']): boolean {
  return status === 'LIVE' || status === 'FINISHED';
}
