// 실제 도메인 모듈(lib/domain/playerApi.ts)의 순수 파서를 직접 import해 검증합니다.
import { describe, expect, it } from 'vitest';
import { parseCareerSchools, parseJoinAndDraft } from '../lib/domain/playerApi';

describe('player profile parsers', () => {
  it('parseCareerSchools: keeps schools, drops pro/military teams', () => {
    const lee = parseCareerSchools('노암초-경포중-강릉고-강릉영동대');
    expect(lee).toEqual(['노암초', '경포중', '강릉고', '강릉영동대']);

    const ko = parseCareerSchools('부산대연초(사상구리틀)-대동중-경남고-성균관대-키움-상무');
    expect(ko).toEqual(['부산대연초(사상구리틀)', '대동중', '경남고', '성균관대']);

    expect(parseCareerSchools('부천북초-부천중-유신고')).toEqual(['부천북초', '부천중', '유신고']);
    expect(parseCareerSchools('')).toEqual([]);
  });

  it('parseJoinAndDraft: parses join year/team and draft info', () => {
    expect(parseJoinAndDraft('24LG', '21 LG 2차 4라운드 37순위')).toEqual({
      joinYear: '2024',
      joinTeam: 'LG 트윈스',
      draftInfo: '2021년 LG 2차 4라운드 37순위',
    });
    expect(parseJoinAndDraft('24키움', '24 키움 4라운드 39순위')).toEqual({
      joinYear: '2024',
      joinTeam: '키움 히어로즈',
      draftInfo: '2024년 키움 4라운드 39순위',
    });
    expect(parseJoinAndDraft('22KT', '육성선수')).toEqual({
      joinYear: '2022',
      joinTeam: 'KT 위즈',
      draftInfo: '육성선수',
    });
  });
});
