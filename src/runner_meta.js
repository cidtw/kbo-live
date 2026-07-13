'use strict';

// Thin pure helpers shared by runner and game_loader (avoid circular require).

const isLive = (g) => g && !g.cancel && g.statusCode !== 'BEFORE' && g.statusCode !== 'READY' && g.statusCode !== 'RESULT';
const isDone = (g) => g && g.statusCode === 'RESULT';

function gameMeta(g) {
  return {
    gameId: g.gameId,
    league: g.categoryName || 'KBO리그',
    stadium: g.stadium || '',
    startTime: g.gameDateTime,
    home: { code: g.homeTeamCode, name: g.homeTeamName },
    away: { code: g.awayTeamCode, name: g.awayTeamName },
  };
}

module.exports = { isLive, isDone, gameMeta };
