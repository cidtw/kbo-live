'use strict';

const config = require('./config');
const { Broadcast } = require('./broadcast');
const { gameMeta } = require('./runner_meta');
const defaultApi = require('./api');
const { debug, warn } = require('./log');
const { i18n } = require('./i18n');

/**
 * Load a full Broadcast from all available innings (for --report / export).
 * @returns {{ bc: Broadcast, failedInnings: number[], lastInn: number }}
 */
async function loadFullBroadcast(game, { api = defaultApi } = {}) {
  const t = i18n.t;
  const bc = new Broadcast(gameMeta(game));
  const [preview, record] = await Promise.all([
    api.fetchPreview(game.gameId).catch((e) => {
      debug('preview load failed', e.message);
      return null;
    }),
    api.fetchRecord(game.gameId).catch((e) => {
      debug('record load failed', e.message);
      return null;
    }),
  ]);
  bc.preview = preview;
  bc.record = record;

  const latestRelay = await api.fetchRelay(game.gameId);
  if (!latestRelay) {
    throw new Error(t.errFeedNotFound || 'No commentary data found for this game.');
  }
  const lastInn = Number(latestRelay.inn) || 1;
  const finished = game.statusCode === 'RESULT';
  const failedInnings = [];

  for (let i = 1; i <= lastInn; i++) {
    try {
      const inningRelay = await api.fetchRelay(game.gameId, i, finished);
      if (inningRelay) bc.ingestRelay(inningRelay);
      else failedInnings.push(i);
    } catch (e) {
      failedInnings.push(i);
      debug(`inning ${i} load failed`, e.message);
      if (config.verbose) warn(`Failed to load inning ${i}: ${e.message}`);
    }
  }

  return { bc, failedInnings, lastInn };
}

module.exports = { loadFullBroadcast };
