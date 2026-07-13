'use strict';

const config = require('../../src/config');

function resetConfig(overrides = {}) {
  if (typeof config.resetConfig === 'function') {
    return config.resetConfig(overrides);
  }
  Object.assign(config, {
    gui: true,
    theme: 'nerd',
    replay: false,
    cache: true,
    pitches: true,
    fahrenheit: false,
    verbose: false,
  }, overrides);
  return config;
}

function liveNetEnabled() {
  return process.env.KBO_LIVE_LIVE_NET === '1';
}

module.exports = { resetConfig, liveNetEnabled };
