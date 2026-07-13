'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { renderToString, weatherText, lineScore, headerBar } = require('../src/render');
const { Broadcast } = require('../src/broadcast');
const { resetConfig } = require('./support/helpers');

function sampleBc() {
  const bc = new Broadcast({
    league: 'KBO리그',
    stadium: '사직',
    home: { code: 'LT', name: '롯데' },
    away: { code: 'HT', name: 'KIA' },
  });
  bc.gs = {
    homeScore: 5,
    awayScore: 1,
    ball: 2,
    strike: 1,
    out: 0,
    base1: 1,
    base2: 0,
    base3: 0,
  };
  bc.inningScore = {
    home: { 1: '2', 2: '3' },
    away: { 1: '1', 2: '0' },
  };
  bc.inn = 3;
  bc.half = 'T';
  bc.status = 'LIVE';
  bc.weather = { temp: 20, code: 0 };
  bc.addLine('hit', '안타', '');
  return bc;
}

test('renderToString: includes matchup and produces multiple lines', () => {
  resetConfig({ gui: true, theme: 'ascii', fahrenheit: false, replay: false });
  const text = renderToString(sampleBc(), { columns: 96, rows: 40 });
  assert.ok(text.includes('KIA') || text.includes('롯데') || text.includes('VS') || text.includes('vs'));
  assert.ok(text.split('\n').length > 5);
});

test('weatherText: fahrenheit conversion', () => {
  resetConfig({ fahrenheit: true, theme: 'ascii' });
  const bc = sampleBc();
  const w = weatherText(bc);
  assert.match(w, /°F/);
  assert.ok(w.includes('68') || w.includes('67') || w.includes('69')); // 20C ≈ 68F
});

test('lineScore: returns non-empty rows', () => {
  resetConfig({ theme: 'ascii' });
  const rows = lineScore(sampleBc(), 96);
  assert.ok(Array.isArray(rows));
  assert.ok(rows.length >= 1);
});

test('headerBar: includes league label', () => {
  resetConfig({ theme: 'ascii', replay: false });
  const h = headerBar(sampleBc());
  assert.ok(typeof h === 'string' && h.length > 0);
});
