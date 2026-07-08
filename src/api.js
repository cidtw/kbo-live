'use strict';

const https = require('https');
const config = require('./config');
const cacheStore = require('./cache');
const { sleep } = require('./util');

// 네이버 스포츠 내부 API 게이트웨이 (비공개·비문서화 — 브라우저 문자중계 페이지가 쓰는 것과 동일)
const GW = 'https://api-gw.sports.naver.com';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) kbo-live/0.1 (unofficial fan project)';

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://m.sports.naver.com/' },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject); // 본문 수신 중 커넥션 끊김 → 즉시 실패(타임아웃 대기 방지)
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('request timeout')));
  });
}

// 429/5xx 는 짧은 백오프 후 1회 재시도 (Retry-After 존중, 최대 10초)
async function getJSON(url) {
  for (let attempt = 0; ; attempt++) {
    const { status, headers, body } = await get(url);
    if ((status === 429 || status >= 500) && attempt === 0) {
      const ra = Math.min(10, Number(headers['retry-after']) || 2);
      await sleep(ra * 1000);
      continue;
    }
    if (status === 204 || !body) return { status, data: null };
    if (status !== 200) throw new Error(`HTTP ${status}: ${url}`);
    return { status, data: JSON.parse(body) };
  }
}

// 날짜별 KBO 경기 목록
async function fetchGamesByDate(date) {
  const url = `${GW}/schedule/games?fields=basic,schedule,baseball&upperCategoryId=kbaseball&categoryId=kbo&fromDate=${date}&toDate=${date}&size=50`;
  const { data } = await getJSON(url);
  return data?.result?.games || [];
}

// 경기 단건 (statusCode: BEFORE | RESULT | 그 외=진행 중)
async function fetchGame(gameId) {
  const { data } = await getJSON(`${GW}/schedule/games/${encodeURIComponent(gameId)}`);
  return data?.result?.game || null;
}

// 문자중계. inning 생략 = 현재(최신) 이닝. 지정 시 해당 이닝 전체(초+말).
// 과거 이닝은 불변 → 로컬 캐시 우선. finished=true 면 현재 이닝도 저장 가능.
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
  '잠실': { lat: 37.5122, lon: 127.0719 },
  '고척': { lat: 37.4982, lon: 126.8671 },
  '문학': { lat: 37.4370, lon: 126.6933 },
  '인천': { lat: 37.4370, lon: 126.6933 },
  '수원': { lat: 37.2997, lon: 127.0101 },
  '대전': { lat: 36.3172, lon: 127.4292 },
  '대구': { lat: 35.8412, lon: 128.6816 },
  '광주': { lat: 35.1681, lon: 126.8891 },
  '사직': { lat: 35.1940, lon: 129.0610 },
  '창원': { lat: 35.2229, lon: 128.6809 },
  '울산': { lat: 35.5353, lon: 129.2581 },
  '포항': { lat: 36.0191, lon: 129.3432 },
  '청주': { lat: 36.6373, lon: 127.4897 }
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
        code: data.current_weather.weathercode
      };
    }
  } catch (_) {}
  return null;
}

async function fetchPreview(gameId) {
  const url = `${GW}/schedule/games/${encodeURIComponent(gameId)}/preview`;
  try {
    const { data } = await getJSON(url);
    return data?.result?.previewData || null;
  } catch (_) {}
  return null;
}

module.exports = { GW, get, getJSON, fetchGamesByDate, fetchGame, fetchRelay, fetchWeather, fetchPreview };
