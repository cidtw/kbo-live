'use strict';

const readline = require('readline');

const ENTER = '\x1b[?1049h\x1b[?25l'; // 대체 화면 진입 + 커서 숨김
const LEAVE = '\x1b[?25h\x1b[?1049l'; // 커서 복원 + 대체 화면 이탈

function createTerminal({ gui, stdout = process.stdout, stdin = process.stdin } = {}) {
  const rawOn = !!(gui && stdin.isTTY && stdout.isTTY);
  let restored = !gui;

  const restore = () => {
    if (rawOn) {
      try {
        stdin.setRawMode(false);
      } catch (_) {}
    }
    if (!restored) {
      stdout.write(LEAVE);
      restored = true;
    }
  };

  const enter = () => {
    if (gui) {
      stdout.write(ENTER);
      restored = false;
    }
  };

  const enableRaw = () => {
    if (!rawOn) return false;
    readline.emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();
    return true;
  };

  const isRestored = () => restored;
  const setRestored = (v) => {
    restored = v;
  };

  return {
    rawOn,
    ENTER,
    LEAVE,
    enter,
    restore,
    enableRaw,
    isRestored,
    setRestored,
    onResize(handler) {
      if (gui && stdout.isTTY) stdout.on('resize', handler);
    },
  };
}

module.exports = { createTerminal, ENTER, LEAVE };
