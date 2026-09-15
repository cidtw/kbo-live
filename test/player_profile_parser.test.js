'use strict';

const test = require('node:test');
const assert = require('node:assert');

// 프로 구단 화이트리스트 검증 로직 테스트
const PRO_TEAMS_WHITELIST = {
  LG: 'LG 트윈스',
  KIA: 'KIA 타이거즈',
  HT: 'KIA 타이거즈',
  삼성: '삼성 라이온즈',
  SS: '삼성 라이온즈',
  SL: '삼성 라이온즈',
  두산: '두산 베어스',
  OB: '두산 베어스',
  KT: 'KT 위즈',
  kt: 'KT 위즈',
  SSG: 'SSG 랜더스',
  SK: 'SK 와이번스',
  롯데: '롯데 자이언츠',
  한화: '한화 이글스',
  NC: 'NC 다이노스',
  키움: '키움 히어로즈',
  넥센: '넥센 히어로즈',
  우리: '우리 히어로즈',
  현대: '현대 유니콘스',
};

function parseCareerSchools(rawCareer) {
  const careerSchools = [];
  if (!rawCareer) return careerSchools;
  const parts = rawCareer.split('-');
  for (const p of parts) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const isTeam = Object.keys(PRO_TEAMS_WHITELIST).some(
      (t) => trimmed.toLowerCase() === t.toLowerCase() || trimmed.includes(PRO_TEAMS_WHITELIST[t])
    ) || trimmed === '상무' || trimmed === '경찰' || trimmed === '국가대표';

    if (!isTeam) {
      careerSchools.push(trimmed);
    }
  }
  return careerSchools;
}

function parseJoinAndDraft(rawJoin, rawDraft) {
  let joinYear = '';
  let joinTeam = '';
  if (rawJoin) {
    const mYear = rawJoin.match(/^(\d{2})(.*)$/);
    if (mYear) {
      const yy = parseInt(mYear[1], 10);
      joinYear = yy >= 80 ? `19${yy}` : `20${yy < 10 ? '0' + yy : yy}`;
      const teamAbbr = mYear[2].trim();
      joinTeam = PRO_TEAMS_WHITELIST[teamAbbr] || teamAbbr;
    }
  }

  let draftInfo = rawDraft;
  if (rawDraft) {
    const dMatch = rawDraft.match(/^(\d{2})\s*(.*)$/);
    if (dMatch) {
      const dYear = parseInt(dMatch[1], 10);
      const fullYear = dYear >= 80 ? `19${dYear}` : `20${dYear < 10 ? '0' + dYear : dYear}`;
      draftInfo = `${fullYear}년 ${dMatch[2].trim()}`;
    }
  }

  return { joinYear, joinTeam, draftInfo };
}

test('parseCareerSchools: correctly extracts college and school names while filtering out pro/military teams', () => {
  // 이믿음 케이스
  const leeSchools = parseCareerSchools('노암초-경포중-강릉고-강릉영동대');
  assert.deepStrictEqual(leeSchools, ['노암초', '경포중', '강릉고', '강릉영동대']);
  assert.ok(leeSchools.some(s => s.includes('대') || s.includes('대학')), 'College must be included');

  // 고영우 케이스 (프로/군 팀 섞여 있는 경우)
  const koSchools = parseCareerSchools('부산대연초(사상구리틀)-대동중-경남고-성균관대-키움-상무');
  assert.deepStrictEqual(koSchools, ['부산대연초(사상구리틀)', '대동중', '경남고', '성균관대']);
  assert.ok(!koSchools.includes('키움'), 'Pro team must be filtered out');
  assert.ok(!koSchools.includes('상무'), 'Military team must be filtered out');
  assert.ok(koSchools.includes('성균관대'), 'University must be preserved');

  // 박영현 케이스
  const parkSchools = parseCareerSchools('부천북초-부천중-유신고');
  assert.deepStrictEqual(parkSchools, ['부천북초', '부천중', '유신고']);
});

test('parseJoinAndDraft: correctly parses KBO draft round and official join year', () => {
  // 24LG, 21 LG 2차 4라운드 37순위
  const res1 = parseJoinAndDraft('24LG', '21 LG 2차 4라운드 37순위');
  assert.strictEqual(res1.joinYear, '2024');
  assert.strictEqual(res1.joinTeam, 'LG 트윈스');
  assert.strictEqual(res1.draftInfo, '2021년 LG 2차 4라운드 37순위');

  // 24키움, 24 키움 4라운드 39순위
  const res2 = parseJoinAndDraft('24키움', '24 키움 4라운드 39순위');
  assert.strictEqual(res2.joinYear, '2024');
  assert.strictEqual(res2.joinTeam, '키움 히어로즈');
  assert.strictEqual(res2.draftInfo, '2024년 키움 4라운드 39순위');

  // 육성선수 입단 케이스
  const res3 = parseJoinAndDraft('22KT', '육성선수');
  assert.strictEqual(res3.joinYear, '2022');
  assert.strictEqual(res3.joinTeam, 'KT 위즈');
  assert.strictEqual(res3.draftInfo, '육성선수');
});
