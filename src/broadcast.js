'use strict';

const config = require('./config');
const { C } = require('./ansi');
const { i18n } = require('./i18n');
const { printPlainLine } = require('./render');

// ─────────────────────────────────────────────────────────────────────────────
// 야구 중계 도메인. lol-live 의 Broadcast 와 같은 역할이지만 훨씬 단순하다:
// 네이버 relay 는 (LoL 처럼 누적 스냅샷이 아니라) 이미 "이벤트 스트림" 이므로
// diff 추론 없이 전역 seqno 커서로 중복 제거만 하면 된다.
//
// relay 이벤트 type 관측값 (실데이터 역공학):
//   0=이닝 시작/경기 공지, 1=투구(n구 볼/스트라이크/파울/타격),
//   8=타자 등장, 13=타석 결과, 14=주자 진루/도루, 23=득점 연결 안타, 24=홈인
// 미지의 type 은 원문 그대로 info 라인으로 흘린다(전진 호환).
// ─────────────────────────────────────────────────────────────────────────────

class Broadcast {
  constructor(meta) {
    this.meta = meta;           // {league, stadium, home:{code,name}, away:{code,name}, startTime}
    this.log = [];              // 중계 라인 배열 {ts, icon, text, color}
    this.lastSeq = -1;          // 전역 seqno 커서 — 이닝/폴링 간 중복 방지
    this.inn = 0;               // 현재 이닝 (0=경기 전)
    this.half = 'T';            // 'T'=초(원정 공격) | 'B'=말(홈 공격)
    this.gs = null;             // 최신 이벤트의 게임 상태 {homeScore, ball, strike, out, base1..3, ...}
    this.inningScore = null;    // {home:{'1':..}, away:{..}}
    this.lineups = { home: null, away: null }; // relay 응답의 homeLineup/awayLineup 최신본
    this.names = {};            // pcode → 이름
    this.batterNow = null;      // 최근 타자 등장 이벤트의 batterRecord
    this.status = i18n.t.connecting;
    this.ended = false;
    this.follow = true;         // true=최신 하단 추적, false=스크롤로 과거 보는 중
    this.viewBottom = 0;        // follow=false 일 때 화면에 보일 마지막 로그 인덱스
    this.viewN = 10;            // 현재 중계창 표시 줄 수(render 가 갱신)
  }

  teamName(side) { return this.meta[side]?.code || this.meta[side]?.name || side; }

  tsNow() {
    return this.inn > 0 ? i18n.t.tsLabel({ inn: this.inn, half: this.half }) : i18n.t.tsNone;
  }

  addLine(icon, text, color = C.white) {
    this.log.push({ ts: this.tsNow(), icon, text, color });
    if (this.log.length > 4000) {
      this.log.shift();
      if (!this.follow && this.viewBottom > 0) this.viewBottom--; // 스크롤 위치 유지
    }
    if (!config.gui) printPlainLine(this.log[this.log.length - 1]); // no-gui 모드는 즉시 출력
  }

  // 라인업/선수명 사전 갱신 (relay 응답마다 최신본으로 교체)
  // 리플레이에선 relay.inningScore 가 "최종" 스코어라 스포일러 → 이벤트에서 재구성한다.
  _absorbMeta(relay) {
    if (relay.inningScore && !config.replay) this.inningScore = relay.inningScore;
    for (const [side, key] of [['home', 'homeLineup'], ['away', 'awayLineup']]) {
      const lu = relay[key];
      if (!lu) continue;
      this.lineups[side] = lu;
      for (const p of [...(lu.batter || []), ...(lu.pitcher || [])]) {
        if (p.pcode) this.names[p.pcode] = p.name;
      }
    }
  }

  // relay 응답의 블록들을 전역 seqno 순으로 평탄화
  static flatten(relay) {
    const evs = [];
    for (const block of relay.textRelays || []) {
      for (const o of block.textOptions || []) {
        evs.push({
          seq: o.seqno, type: o.type, text: o.text || '',
          gs: o.currentGameState || null,
          inn: block.inn, ha: String(block.homeOrAway), // '0'=초(원정 공격) '1'=말(홈 공격)
          batterRecord: o.batterRecord || null,
        });
      }
    }
    evs.sort((a, b) => a.seq - b.seq);
    return evs;
  }

  // 한 relay 응답을 ingest. silent=true 면 상태만 갱신하고 라인은 만들지 않는다
  // (--no-history 접속 시 현재 이닝 이벤트 폭탄 방지). 새로 처리한 이벤트 수를 돌려준다.
  ingestRelay(relay, { silent = false } = {}) {
    if (!relay) return 0;
    this._absorbMeta(relay);
    const evs = Broadcast.flatten(relay);
    let n = 0;
    for (const ev of evs) {
      if (ev.seq <= this.lastSeq) continue;
      this.lastSeq = ev.seq;
      n++;
      this._applyEvent(ev, silent);
    }
    return n;
  }

  // 다음 이벤트의 seqno 에 공백이 있는지(이닝 경계 폴링 누락 감지)
  hasGapBefore(relay) {
    const evs = Broadcast.flatten(relay).filter((e) => e.seq > this.lastSeq);
    return evs.length > 0 && this.lastSeq >= 0 && evs[0].seq > this.lastSeq + 1;
  }

  _applyEvent(ev, silent) {
    const t = i18n.t;
    if (ev.inn) { this.inn = ev.inn; this.half = ev.ha === '1' ? 'B' : 'T'; }
    const prevGs = this.gs;
    if (ev.gs) this.gs = ev.gs;
    if (ev.batterRecord) this.batterNow = ev.batterRecord;
    if (config.replay) this._rebuildInningScore(ev);

    const text = ev.text.trim();
    if (!text) return;
    if (/경기\s*종료|^승리투수/.test(text)) this.ended = true;
    if (silent) return;

    const atkCol = ev.ha === '1' ? C.bgreen : C.byellow; // 공격팀 강조(말=홈, 초=원정)

    // 득점 변화 감지 → 라인 끝에 (원정:홈) 스코어 태그
    const scored = prevGs && ev.gs
      && (Number(ev.gs.homeScore) !== Number(prevGs.homeScore)
        || Number(ev.gs.awayScore) !== Number(prevGs.awayScore));
    const tag = scored ? `${C.bold}${t.scoreTag({ a: ev.gs.awayScore, h: ev.gs.homeScore })}${C.reset}` : '';

    // 키워드 우선 분류(모든 type 공통) → type 기본값
    if (/홈런/.test(text)) return this.addLine('homerun', `${C.byellow}${C.bold}${text}${C.reset}${tag}`, C.byellow);
    if (/교체|대타|대주자/.test(text)) return this.addLine('change', text + tag, C.cyan);
    if (/실책/.test(text)) return this.addLine('error', text + tag, C.magenta);

    switch (ev.type) {
      case 0: // 이닝 시작/경기 공지
        this.addLine('inning', `${C.bold}${text}${C.reset}`, C.cyan);
        break;
      case 1: // 투구
        if (config.pitches) this.addLine('pitch', text, C.gray);
        break;
      case 8: // 타자 등장
        if (config.pitches) this.addLine('batter', text, C.white);
        break;
      case 13: case 23: { // 타석 결과
        if (/삼진/.test(text)) this.addLine('strikeout', text + tag, C.bred);
        else if (/볼넷|몸에\s*맞는|고의4구/.test(text)) this.addLine('walk', text + tag, C.green);
        else if (/아웃|병살|희생/.test(text)) this.addLine('out', text + tag, C.gray);
        else if (/안타|1루타|2루타|3루타/.test(text)) this.addLine('hit', `${atkCol}${text}${C.reset}${tag}`, atkCol);
        else this.addLine('info', text + tag, C.white);
        break;
      }
      case 14: // 주자 진루
        if (/도루/.test(text)) this.addLine('steal', text + tag, C.bcyan);
        else this.addLine('info', `${C.dim}${text}${C.reset}${tag}`, C.gray);
        break;
      case 24: // 홈인(득점)
        this.addLine('run', `${C.bgreen}${C.bold}${text}${C.reset}${tag}`, C.bgreen);
        break;
      default:
        this.addLine('info', text + tag, C.white);
    }
  }

  // 리플레이 라인스코어 재구성: 반이닝 시작 시점의 누적 점수를 기준선으로 잡고
  // 이후 이벤트마다 (현재 누적 − 기준선) 을 그 이닝 칸에 쓴다.
  _rebuildInningScore(ev) {
    if (!ev.gs || !ev.inn) return;
    const side = ev.ha === '1' ? 'home' : 'away';
    const cur = Number(ev.gs[`${side}Score`]);
    if (!Number.isFinite(cur)) return;
    if (!this.inningScore) this.inningScore = { home: {}, away: {} };
    const cell = String(ev.inn);
    if (ev.type === 0 || !this._innBase || this._innBase.side !== side || this._innBase.inn !== ev.inn) {
      this._innBase = { side, inn: ev.inn, base: cur - (Number(this.inningScore[side][cell]) || 0) };
    }
    this.inningScore[side][cell] = String(cur - this._innBase.base);
  }

  // 현재 투수/타자 표시용 (render 소비)
  currentPitcher() {
    // 리플레이는 라인업의 "마지막 투수"가 최종 마무리라 스포일러 → 이벤트의 pcode 로 해석
    if (!config.replay) {
      const side = this.half === 'T' ? 'home' : 'away'; // 수비팀 투수
      const ps = this.lineups[side]?.pitcher || [];
      if (ps.length) return ps[ps.length - 1];
    }
    const pcode = this.gs?.pitcher;
    return pcode ? { name: this.names[pcode] || `#${pcode}` } : null;
  }
  currentBatterName() {
    const pcode = this.gs?.batter;
    return (this.batterNow && this.batterNow.name) || (pcode && (this.names[pcode] || `#${pcode}`)) || null;
  }
}

module.exports = { Broadcast };
