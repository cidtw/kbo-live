'use strict';

/**
 * Pure key → action mapping for menu and spectate modes.
 * Returns action objects; side effects stay in cli.
 */

function handleMenuKey(s, key, { games, selectedIdx }) {
  key = key || {};
  if ((key.ctrl && key.name === 'c') || s === 'q' || key.name === 'q') {
    return { type: 'QUIT' };
  }
  if (key.name === 'left' || s === 'h') return { type: 'MENU_DATE_DELTA', days: -1 };
  if (key.name === 'right' || s === 'l') return { type: 'MENU_DATE_DELTA', days: 1 };
  if (s === 'd') return { type: 'MENU_DATE_PROMPT' };
  if (!games || games.length === 0) return { type: 'NONE' };

  if (key.name === 'up' || s === 'k') {
    return { type: 'MENU_MOVE', selectedIdx: (selectedIdx - 1 + games.length) % games.length };
  }
  if (key.name === 'down' || s === 'j') {
    return { type: 'MENU_MOVE', selectedIdx: (selectedIdx + 1) % games.length };
  }
  if (key.name === 'return' || key.name === 'enter') {
    return { type: 'SELECT_GAME', game: games[selectedIdx], replay: false };
  }
  if (s === 'r' || key.name === 'r') {
    const chosen = games[selectedIdx];
    if (chosen && chosen.statusCode === 'RESULT') {
      return { type: 'SELECT_GAME', game: chosen, replay: true };
    }
  }
  return { type: 'NONE' };
}

function handleSpectateKey(s, key, { bc, viewN }) {
  key = key || {};
  if ((key.ctrl && key.name === 'c') || s === 'q' || key.name === 'q') {
    return { type: 'QUIT' };
  }
  if (!bc) return { type: 'NONE' };
  const N = viewN || bc.viewN || 10;

  if (/^[1-9]$/.test(s) && bc.games && bc.games.length > 0) {
    const nextGame = bc.games[Number(s) - 1];
    if (nextGame && nextGame.gameId !== bc.meta.gameId) {
      return {
        type: 'SWITCH_GAME',
        game: nextGame,
        replay: nextGame.statusCode === 'RESULT',
      };
    }
    return { type: 'NONE' };
  }

  if (bc.games && bc.games.length > 0) {
    let nextGame = null;
    if (key.name === 'left') {
      const curIdx = bc.games.findIndex((g) => g.gameId === bc.meta.gameId);
      if (curIdx >= 0) {
        nextGame = bc.games[(curIdx - 1 + bc.games.length) % bc.games.length];
      }
    } else if (key.name === 'right') {
      const curIdx = bc.games.findIndex((g) => g.gameId === bc.meta.gameId);
      if (curIdx >= 0) {
        nextGame = bc.games[(curIdx + 1) % bc.games.length];
      }
    }
    if (nextGame && nextGame.gameId !== bc.meta.gameId) {
      return {
        type: 'SWITCH_GAME',
        game: nextGame,
        replay: nextGame.statusCode === 'RESULT',
      };
    }
  }

  if (s === 'p' || key.name === 'p') return { type: 'TOGGLE_PREVIEW' };
  if (key.name === 'tab') return { type: 'CYCLE_RECORD' };
  if (s === 'e' || key.name === 'e') return { type: 'EXPORT_REPORT' };
  if (s === 'm' || key.name === 'm' || key.name === 'escape' || key.name === 'backspace') {
    return { type: 'BACK_MENU' };
  }

  if (key.name === 'up' || s === 'k') return { type: 'SCROLL', delta: -1 };
  if (key.name === 'down' || s === 'j') return { type: 'SCROLL', delta: +1 };
  if (key.name === 'pageup' || s === 'b') return { type: 'SCROLL', delta: -N };
  if (key.name === 'pagedown' || s === ' ') return { type: 'SCROLL', delta: +N };
  if (key.name === 'home' || s === 'g') return { type: 'SCROLL', delta: -1e9 };
  if (key.name === 'end' || s === 'G') return { type: 'FOLLOW' };
  return { type: 'NONE' };
}

/** Human-readable keybinding table (README / help). */
const KEYBINDINGS = [
  { mode: 'both', keys: 'q / Ctrl+C', action: '종료' },
  { mode: 'menu', keys: '↑↓ / k j', action: '경기 선택' },
  { mode: 'menu', keys: '←→ / h l', action: '날짜 변경' },
  { mode: 'menu', keys: 'd', action: '날짜 직접 입력' },
  { mode: 'menu', keys: 'Enter', action: '중계 시작' },
  { mode: 'menu', keys: 'r', action: '종료 경기 리플레이' },
  { mode: 'spectate', keys: '↑↓ / k j', action: '중계 스크롤' },
  { mode: 'spectate', keys: 'PageUp/Dn · b/Space', action: '페이지 스크롤' },
  { mode: 'spectate', keys: 'g / G', action: '맨 위 / 최신(follow)' },
  { mode: 'spectate', keys: '1-9', action: '게임 바 순번 전환' },
  { mode: 'spectate', keys: '← →', action: '인접 경기 전환' },
  { mode: 'spectate', keys: 'p', action: '전력분석 패널' },
  { mode: 'spectate', keys: 'Tab', action: '경기기록 패널 순환' },
  { mode: 'spectate', keys: 'e', action: '마크다운 리포트 내보내기' },
  { mode: 'spectate', keys: 'm / Esc', action: '메뉴로 돌아가기' },
];

module.exports = { handleMenuKey, handleSpectateKey, KEYBINDINGS };
