'use strict';

const config = require('./config');

function isVerbose() {
  return !!(config.verbose || process.env.KBO_LIVE_DEBUG);
}

function debug(msg, extra) {
  if (!isVerbose()) return;
  const suffix = extra != null ? ` ${typeof extra === 'string' ? extra : JSON.stringify(extra)}` : '';
  process.stderr.write(`[kbo-live] ${msg}${suffix}\n`);
}

function warn(msg) {
  process.stderr.write(`[kbo-live] WARN: ${msg}\n`);
}

module.exports = { isVerbose, debug, warn };
