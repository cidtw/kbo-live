import { translateStuff } from './util';

export interface BroadcastLogEntry {
  ts: string;
  icon: string;
  text: string;
  eventType: string;
  seq: number;
}

export interface TeamMeta {
  code: string;
  name: string;
}

export interface GameMeta {
  league?: string;
  stadium?: string;
  home?: TeamMeta;
  away?: TeamMeta;
  startTime?: string;
}

export interface GameState {
  homeScore?: number | string;
  awayScore?: number | string;
  homeHit?: number | string;
  awayHit?: number | string;
  homeError?: number | string;
  awayError?: number | string;
  homeBallFour?: number | string;
  awayBallFour?: number | string;
  ball?: number | string;
  strike?: number | string;
  out?: number | string;
  base1?: boolean | number;
  base2?: boolean | number;
  base3?: boolean | number;
  pitcher?: string;
  batter?: string;
  [key: string]: any;
}

export interface InningScore {
  home: Record<string, string>;
  away: Record<string, string>;
}

export interface PitcherStats {
  strike: number;
  ball: number;
  hit: number;
  total: number;
}

export class Broadcast {
  meta: GameMeta;
  log: BroadcastLogEntry[] = [];
  lastSeq = -1;
  inn = 0;
  half: 'T' | 'B' = 'T'; // 'T'=초 (away), 'B'=말 (home)
  gs: GameState | null = null;
  inningScore: InningScore = { home: {}, away: {} };
  lineups: { home: any; away: any } = { home: null, away: null };
  names: Record<string, string> = {};
  batterNow: any = null;
  status = '접속 중…';
  ended = false;
  pitchStats: Record<string, Record<string, Record<string, PitcherStats>>> = {};
  isSimulation = false;
  private _innBase: { side: 'home' | 'away'; inn: number; base: number } | null = null;

  constructor(meta: GameMeta, isSimulation = false) {
    this.meta = meta;
    this.isSimulation = isSimulation;
  }

  teamName(side: 'home' | 'away'): string {
    return this.meta[side]?.code || this.meta[side]?.name || side;
  }

  tsNow(): string {
    if (this.inn > 0) {
      return `${this.inn}회${this.half === 'T' ? '초' : '말'}`;
    }
    return '----';
  }

  addLine(icon: string, text: string, eventType: string, seq: number) {
    this.log.push({
      ts: this.tsNow(),
      icon,
      text,
      eventType,
      seq,
    });
    if (this.log.length > 4000) {
      this.log.shift();
    }
  }

  _absorbMeta(relay: any) {
    if (relay.inningScore && !this.isSimulation) {
      this.inningScore = relay.inningScore;
    }
    for (const side of ['home', 'away'] as const) {
      const key = side === 'home' ? 'homeLineup' : 'awayLineup';
      const lu = relay[key];
      if (!lu) continue;
      this.lineups[side] = lu;
      for (const p of [...(lu.batter || []), ...(lu.pitcher || [])]) {
        if (p.pcode) this.names[p.pcode] = p.name;
      }
    }
  }

  static flatten(relay: any): any[] {
    const evs: any[] = [];
    if (!relay || !relay.textRelays) return evs;
    for (const block of relay.textRelays || []) {
      for (const o of block.textOptions || []) {
        evs.push({
          seq: o.seqno,
          type: o.type,
          text: o.text || '',
          gs: o.currentGameState || null,
          inn: block.inn,
          ha: String(block.homeOrAway), // '0'=초 (원정) '1'=말 (홈)
          batterRecord: o.batterRecord || null,
          speed: o.speed || null,
          stuff: o.stuff || null,
          pitchResult: o.pitchResult || null,
        });
      }
    }
    evs.sort((a, b) => a.seq - b.seq);
    return evs;
  }

  ingestRelay(relay: any, { silent = false } = {}): number {
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

  hasGapBefore(relay: any): boolean {
    const evs = Broadcast.flatten(relay).filter((e) => e.seq > this.lastSeq);
    return evs.length > 0 && this.lastSeq >= 0 && evs[0].seq > this.lastSeq + 1;
  }

  _applyEvent(ev: any, silent: boolean) {
    if (ev.inn) {
      this.inn = ev.inn;
      this.half = ev.ha === '1' ? 'B' : 'T';
    }
    const prevGs = this.gs;
    if (ev.gs) this.gs = ev.gs;
    if (ev.batterRecord) this.batterNow = ev.batterRecord;
    if (this.isSimulation) this._rebuildInningScore(ev);

    // Collect pitch stats
    if (ev.type === 1) {
      const pitcherPcode = ev.gs?.pitcher;
      if (pitcherPcode) {
        const speed = ev.speed;
        const stuff = ev.stuff;
        if (stuff) {
          if (!this.pitchStats[pitcherPcode]) {
            this.pitchStats[pitcherPcode] = {};
          }
          if (!this.pitchStats[pitcherPcode][stuff]) {
            this.pitchStats[pitcherPcode][stuff] = {};
          }
          const spKey = speed || 'unknown';
          if (!this.pitchStats[pitcherPcode][stuff][spKey]) {
            this.pitchStats[pitcherPcode][stuff][spKey] = { strike: 0, ball: 0, hit: 0, total: 0 };
          }
          const stats = this.pitchStats[pitcherPcode][stuff][spKey];
          const result = ev.pitchResult;
          if (result === 'B') {
            stats.ball++;
          } else if (result === 'H') {
            stats.hit++;
          } else if (result === 'T' || result === 'S' || result === 'F') {
            stats.strike++;
          } else {
            const text = ev.text || '';
            if (text.includes('볼')) stats.ball++;
            else if (text.includes('타격')) stats.hit++;
            else stats.strike++;
          }
          stats.total++;
        }
      }
    }

    const text = ev.text.trim();
    if (!text) return;
    if (/경기\s*종료|^승리투수/.test(text)) this.ended = true;
    if (silent) return;

    // Detect score changes
    const scored = prevGs && ev.gs &&
      (Number(ev.gs.homeScore) !== Number(prevGs.homeScore) ||
       Number(ev.gs.awayScore) !== Number(prevGs.awayScore));
    const tag = scored ? ` (${ev.gs.awayScore}:${ev.gs.homeScore})` : '';

    if (/홈런/.test(text)) {
      return this.addLine('homerun', text + tag, 'homerun', ev.seq);
    }
    if (/교체|대타|대주자/.test(text)) {
      return this.addLine('change', text + tag, 'change', ev.seq);
    }
    if (/실책/.test(text)) {
      return this.addLine('error', text + tag, 'error', ev.seq);
    }

    switch (ev.type) {
      case 0:
        this.addLine('inning', text, 'inning', ev.seq);
        break;
      case 1: {
        let pitchText = text;
        if (ev.speed || ev.stuff) {
          const code = translateStuff(ev.stuff);
          const speedText = ev.speed ? `${ev.speed}k` : '?';
          pitchText += ` (${speedText} ${code})`;
        }
        this.addLine('pitch', pitchText, 'pitch', ev.seq);
        break;
      }
      case 8:
        this.addLine('batter', text, 'batter', ev.seq);
        break;
      case 13:
      case 23: {
        if (/삼진/.test(text)) this.addLine('strikeout', text + tag, 'strikeout', ev.seq);
        else if (/볼넷|몸에\s*맞는|고의4구/.test(text)) this.addLine('walk', text + tag, 'walk', ev.seq);
        else if (/아웃|병살|희생/.test(text)) this.addLine('out', text + tag, 'out', ev.seq);
        else if (/안타|1루타|2루타|3루타/.test(text)) this.addLine('hit', text + tag, 'hit', ev.seq);
        else this.addLine('info', text + tag, 'info', ev.seq);
        break;
      }
      case 14:
        if (/도루/.test(text)) this.addLine('steal', text + tag, 'steal', ev.seq);
        else this.addLine('info', text + tag, 'info', ev.seq);
        break;
      case 24:
        this.addLine('run', text + tag, 'run', ev.seq);
        break;
      default:
        this.addLine('info', text + tag, 'info', ev.seq);
    }
  }

  _rebuildInningScore(ev: any) {
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

  currentPitcher() {
    const side = this.half === 'T' ? 'home' : 'away';
    const ps = this.lineups[side]?.pitcher || [];
    if (ps.length) return ps[ps.length - 1];
    const pcode = this.gs?.pitcher;
    return pcode ? { name: this.names[pcode] || `#${pcode}` } : null;
  }

  currentBatterName() {
    const pcode = this.gs?.batter;
    return (this.batterNow && this.batterNow.name) || (pcode && (this.names[pcode] || `#${pcode}`)) || null;
  }
}
