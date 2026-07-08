'use strict';

// 실경기 픽스처(2026-07-07 KIA vs 롯데, 1회 relay 응답) 기반 도메인 회귀 테스트.
// 네트워크 없이 ingest 파이프라인 전체(평탄화·커서·분류·상태)를 검증한다.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const config = require('../src/config');
const { Broadcast } = require('../src/broadcast');

const FIXTURE = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'fixtures', 'relay-20260707HTLT02026-i1.json'), 'utf8',
)).result.textRelayData;

const meta = () => ({
  league: 'KBO리그', stadium: '사직',
  home: { code: 'LT', name: '롯데' }, away: { code: 'HT', name: 'KIA' },
});

function fresh() {
  config.gui = true; // printPlainLine 부수효과 차단
  config.replay = false;
  config.pitches = true;
  return new Broadcast(meta());
}

test('flatten: 전역 seqno 오름차순 정렬', () => {
  const evs = Broadcast.flatten(FIXTURE);
  assert.ok(evs.length > 100);
  for (let i = 1; i < evs.length; i++) assert.ok(evs[i].seq > evs[i - 1].seq);
});

test('ingestRelay: 이벤트 수만큼 처리하고 커서를 전진', () => {
  const bc = fresh();
  const n = bc.ingestRelay(FIXTURE);
  assert.strictEqual(n, Broadcast.flatten(FIXTURE).length);
  assert.strictEqual(bc.lastSeq, Broadcast.flatten(FIXTURE).at(-1).seq);
  assert.ok(bc.log.length > 0);
});

test('ingestRelay: 같은 응답 재주입 시 중복 0건 (seqno 커서)', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  const lines = bc.log.length;
  assert.strictEqual(bc.ingestRelay(FIXTURE), 0);
  assert.strictEqual(bc.log.length, lines);
});

test('분류: 볼넷/삼진/안타/홈인이 올바른 아이콘으로 매핑', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  const by = (icon) => bc.log.filter((l) => l.icon === icon);
  assert.ok(by('walk').some((l) => /볼넷/.test(l.text)));
  assert.ok(by('strikeout').some((l) => /삼진/.test(l.text)));
  assert.ok(by('hit').length >= 1);
  assert.ok(by('run').some((l) => /홈인/.test(l.text)));
  assert.ok(by('steal').some((l) => /도루/.test(l.text)));
  assert.ok(by('inning').some((l) => /1회초/.test(l.text)));
});

test('득점 이벤트에 스코어 태그가 붙는다', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  const run = bc.log.find((l) => l.icon === 'run');
  assert.match(run.text.replace(/\x1b\[[0-9;]*m/g, ''), /\(\d+:\d+\)/);
});

test('--no-pitches: 투구/타자 등장 라인 생략, 결과 라인은 유지', () => {
  config.pitches = false;
  const bc = new Broadcast(meta());
  bc.ingestRelay(FIXTURE);
  config.pitches = true;
  assert.ok(!bc.log.some((l) => l.icon === 'pitch'));
  assert.ok(bc.log.some((l) => l.icon === 'walk' || l.icon === 'strikeout'));
});

test('silent 베이스라인: 상태만 갱신하고 라인은 만들지 않음', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE, { silent: true });
  assert.strictEqual(bc.log.length, 0);
  assert.ok(bc.lastSeq >= 0);
  assert.ok(bc.gs);
});

test('hasGapBefore: 커서와 다음 seqno 사이 공백 감지', () => {
  const bc = fresh();
  bc.lastSeq = -1;
  assert.strictEqual(bc.hasGapBefore(FIXTURE), false); // 처음부터면 공백 아님
  bc.ingestRelay(FIXTURE);
  const later = { textRelays: [{ inn: 3, homeOrAway: '0', textOptions: [{ seqno: bc.lastSeq + 50, type: 1, text: '1구 볼' }] }] };
  assert.strictEqual(bc.hasGapBefore(later), true);
  const next = { textRelays: [{ inn: 2, homeOrAway: '0', textOptions: [{ seqno: bc.lastSeq + 1, type: 1, text: '1구 볼' }] }] };
  assert.strictEqual(bc.hasGapBefore(next), false);
});

test('이닝/공수 추적: 초(원정)→말(홈) 전환', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  assert.strictEqual(bc.inn, 1);
  assert.strictEqual(bc.half, 'B'); // 1회말까지 진행된 픽스처
});

test('경기종료/승리투수 문구로 ended 판정', () => {
  const bc = fresh();
  bc.ingestRelay({ textRelays: [{ inn: 9, homeOrAway: '0', textOptions: [{ seqno: 1, type: 0, text: '경기종료' }] }] });
  assert.strictEqual(bc.ended, true);
  const bc2 = fresh();
  bc2.ingestRelay({ textRelays: [{ inn: 9, homeOrAway: '0', textOptions: [{ seqno: 1, type: 13, text: '승리투수: 로드리게스' }] }] });
  assert.strictEqual(bc2.ended, true);
});

test('리플레이: 이닝 스코어를 이벤트에서 재구성(최종 스코어 스포일러 방지)', () => {
  config.replay = true;
  const bc = new Broadcast(meta());
  bc.ingestRelay(FIXTURE);
  config.replay = false;
  // 픽스처는 1회 종료 시점: 원정(KIA) 1점, 홈(롯데) 4점
  assert.strictEqual(bc.inningScore.away['1'], '1');
  assert.strictEqual(bc.inningScore.home['1'], '4');
  // relay 응답의 최종 inningScore(9이닝 전체)를 그대로 흡수하지 않았는지
  assert.strictEqual(bc.inningScore.home['3'], undefined);
});

test('라인업 흡수: pcode→이름 사전 구축', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  assert.ok(Object.keys(bc.names).length > 10);
});

test('로그 캡: 4000줄 초과 시 shift 하되 스크롤 위치 보정', () => {
  const bc = fresh();
  bc.follow = false;
  bc.viewBottom = 10;
  for (let i = 0; i < 4100; i++) bc.addLine('info', `line ${i}`);
  assert.ok(bc.log.length <= 4000);
  assert.ok(bc.viewBottom < 10); // shift 만큼 당겨짐
});

test('투구 데이터(구속, 구종) 통계 축적 검증', () => {
  const bc = fresh();
  bc.ingestRelay(FIXTURE);
  
  // FIXTURE 에 있는 투구수 데이터 확인
  const evs = Broadcast.flatten(FIXTURE);
  const pitchEvs = evs.filter(e => e.type === 1);
  assert.ok(pitchEvs.length > 0);
  
  // 첫 번째 투구 이벤트에 speed, stuff가 정상 추출되었는지 검증
  const samplePitch = pitchEvs.find(e => e.speed && e.stuff);
  if (samplePitch) {
    assert.ok(typeof samplePitch.speed === 'string');
    assert.ok(typeof samplePitch.stuff === 'string');
  }

  // 투수별 구종/구속 통계가 정상 축적되었는지 검증
  const statsKeys = Object.keys(bc.pitchStats);
  assert.ok(statsKeys.length > 0);
  const firstStats = bc.pitchStats[statsKeys[0]];
  assert.ok(Object.keys(firstStats).length > 0);
  
  // 구속 카운트 검증
  const firstStuff = Object.keys(firstStats)[0];
  const speeds = firstStats[firstStuff];
  assert.ok(Object.keys(speeds).length > 0);
  assert.ok(Object.values(speeds)[0].total >= 1);
});

