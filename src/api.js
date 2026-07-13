'use strict';

const https = require('https');
const config = require('./config');
const cacheStore = require('./cache');
const { sleep } = require('./util');
const { debug, warn } = require('./log');

// 네이버 스포츠 내부 API 게이트웨이 (비공개·비문서화 — 브라우저 문자중계 페이지가 쓰는 것과 동일)
const GW = 'https://api-gw.sports.naver.com';
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5MB

function packageVersion() {
  try {
    return require('../package.json').version || '0.1.0';
  } catch (_) {
    return '0.1.0';
  }
}

function defaultUserAgent() {
  return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/${packageVersion()} (unofficial fan project)`;
}

class ApiError extends Error {
  constructor(message, { status, url, cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    if (cause) this.cause = cause;
  }
}

function defaultGet(url, { timeoutMs = 15000, maxBodyBytes = MAX_BODY_BYTES, userAgent = defaultUserAgent() } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
        Referer: 'https://m.sports.naver.com/',
      },
    }, (res) => {
      const chunks = [];
      let total = 0;
      res.on('data', (c) => {
        total += c.length;
        if (total > maxBodyBytes) {
          req.destroy(new ApiError(`response body exceeds ${maxBodyBytes} bytes`, { status: res.statusCode, url }));
          return;
        }
        chunks.push(c);
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('request timeout')));
  });
}

function createApi({ get = defaultGet, sleepFn = sleep } = {}) {
  async function getJSON(url) {
    for (let attempt = 0; ; attempt++) {
      const { status, headers, body } = await get(url);
      if ((status === 429 || status >= 500) && attempt === 0) {
        const ra = Math.min(10, Number(headers['retry-after']) || 2);
        debug('http retry', { status, url, waitSec: ra });
        await sleepFn(ra * 1000);
        continue;
      }
      if (status === 204 || !body) return { status, data: null };
      if (status !== 200) throw new ApiError(`HTTP ${status}: ${url}`, { status, url });
      try {
        return { status, data: JSON.parse(body) };
      } catch (cause) {
        throw new ApiError(`Invalid JSON from ${url}`, { status, url, cause });
      }
    }
  }

  async function fetchGamesByDate(date) {
    const url = `${GW}/schedule/games?fields=basic,schedule,baseball&upperCategoryId=kbaseball&categoryId=kbo&fromDate=${date}&toDate=${date}&size=50`;
    const { data } = await getJSON(url);
    return data?.result?.games || [];
  }

  async function fetchGame(gameId) {
    const { data } = await getJSON(`${GW}/schedule/games/${encodeURIComponent(gameId)}`);
    return data?.result?.game || null;
  }

  async function fetchRelay(gameId, inning, finished) {
    if (config.cache && inning != null) {
      cacheStore.touchGame(gameId);
      const hit = cacheStore.readInning(gameId, inning);
      if (hit) return hit;
    }
    const url = inning != null
      ? `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay?inning=${Number(inning)}`
      : `${GW}/schedule/games/${encodeURIComponent(gameId)}/relay`;
    const { data } = await getJSON(url);
    const relay = data?.result?.textRelayData || null;
    if (config.cache && inning != null && relay) cacheStore.writeInning(gameId, inning, relay, !!finished);
    return relay;
  }

  const STADIUM_COORDS = {
    잠실: { lat: 37.5122, lon: 127.0719 },
    고척: { lat: 37.4982, lon: 126.8671 },
    문학: { lat: 37.4370, lon: 126.6933 },
    인천: { lat: 37.4370, lon: 126.6933 },
    수원: { lat: 37.2997, lon: 127.0101 },
    대전: { lat: 36.3172, lon: 127.4292 },
    대구: { lat: 35.8412, lon: 128.6816 },
    광주: { lat: 35.1681, lon: 126.8891 },
    사직: { lat: 35.1940, lon: 129.0610 },
    창원: { lat: 35.2229, lon: 128.6809 },
    울산: { lat: 35.5353, lon: 129.2581 },
    포항: { lat: 36.0191, lon: 129.3432 },
    청주: { lat: 36.6373, lon: 127.4897 },
  };

  async function fetchWeather(stadiumName) {
    const coords = STADIUM_COORDS[stadiumName];
    if (!coords) return null;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
    try {
      const { data } = await getJSON(url);
      if (data?.current_weather) {
        return {
          temp: data.current_weather.temperature,
          code: data.current_weather.weathercode,
        };
      }
    } catch (e) {
      debug('fetchWeather failed', e.message);
    }
    return null;
  }

  async function fetchPreview(gameId) {
    const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/preview`;
    try {
      const { data } = await getJSON(url);
      return data?.result?.previewData || null;
    } catch (e) {
      debug('fetchPreview failed', e.message);
      return null;
    }
  }

  async function fetchRecord(gameId) {
    const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/record`;
    try {
      const { data } = await getJSON(url);
      return data?.result?.recordData || null;
    } catch (e) {
      debug('fetchRecord failed', e.message);
      return null;
    }
  }

  return {
    GW,
    get,
    getJSON,
    fetchGamesByDate,
    fetchGame,
    fetchRelay,
    fetchWeather,
    fetchPreview,
    fetchRecord,
    ApiError,
    MAX_BODY_BYTES,
  };
}

const defaultApi = createApi();

module.exports = {
  ...defaultApi,
  createApi,
  defaultGet,
  ApiError,
  MAX_BODY_BYTES,
  defaultUserAgent,
};
