'use strict';

const config = require('./config');

// ─────────────────────────────────────────────────────────────────────────────
// 아이콘 테마: nerd(기본) | emoji | ascii  (lol-live 테마 구조 이식, 야구 키셋)
// nerd = Nerd Font 글리프. 폰트 미설치 시 --emoji / --ascii.
// ─────────────────────────────────────────────────────────────────────────────
const ICONSET = {
  nerd: {
    inning: '󰪹', pitch: '󰏗', batter: '󰏗', hit: '󰏗',
    homerun: '󰏗', run: '󰏗', out: '󰏗', strikeout: '󰏗',
    walk: '󰏗', steal: '󰏗', change: '󰏗', error: '󰏗',
    info: '󰏗', end: '󰏗', clock: '󰏗', live: '󰏗', stadium: '󰏗',
    sunny: '󰖙', cloudy: '󰖐', rain: '󰖗',
  },
  emoji: {
    inning: '🔔', pitch: '⚾', batter: '🏏', hit: '💥',
    homerun: '🚀', run: '🏠', out: '❌', strikeout: '🔥',
    walk: '🚶', steal: '💨', change: '🔄', error: '⚠️',
    info: 'ℹ️', end: '🏁', clock: '⏱', live: '●', stadium: '🏟️',
    sunny: '☀️', cloudy: '☁️', rain: '🌧️',
  },
  ascii: {
    inning: '=', pitch: '.', batter: '>', hit: '*',
    homerun: 'HR', run: 'R', out: 'X', strikeout: 'K',
    walk: 'BB', steal: 'SB', change: '~', error: 'E',
    info: 'i', end: '#', clock: 't', live: '*', stadium: 'S',
    sunny: 'S', cloudy: 'C', rain: 'R',
  },
};

const SEP = ''; // Nerd Font powerline 오른쪽 화살표

function ic(key) { return (ICONSET[config.theme] || ICONSET.emoji)[key] || ''; }

module.exports = { ICONSET, SEP, ic };
