/**
 * 외국인 및 아시아쿼터(대체 외국인 포함) 선수 프로필/출신교/데뷔 정보 고도화 엔진
 */

export type PlayerCategory = 'DOMESTIC' | 'FOREIGN' | 'ASIAN_QUOTA';

export interface EnhancedPlayerMeta {
  playerCategory: PlayerCategory;
  categoryLabel: string;
  nationality: string;
  nationalityFlag: string;
  englishName: string;
  schools: string[];
  kboDebutYear: string;
  kboDebutTeam: string;
  kboDraftType: string;
  proDebutYear: string;
  proDebutTeam: string;
  salary: string;
  payment: string;
  rawCareer: string;
}

export const COUNTRY_FLAG_MAP: Record<string, string> = {
  미국: '🇺🇸',
  일본: '🇯🇵',
  쿠바: '🇨🇺',
  도미니카공화국: '🇩🇴',
  도미니카: '🇩🇴',
  베네수엘라: '🇻🇪',
  파나마: '🇵🇦',
  대만: '🇹🇼',
  멕시코: '🇲🇽',
  캐나다: '🇨🇦',
  호주: '🇦🇺',
  푸에르토리코: '🇵🇷',
  네덜란드: '🇳🇱',
  대한민국: '🇰🇷',
  한국: '🇰🇷',
};

// 주요 KBO 외국인 및 아시아쿼터/대체 외국인 선수 사전 데이터
export const CURATED_FOREIGN_PLAYERS: Record<string, Partial<EnhancedPlayerMeta>> = {
  // KIA 타이거즈
  '54640': {
    englishName: 'James Naile',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['찰스턴 고등학교 (Charleston HS)', '파크랜드 칼리지 (Parkland College)', '앨라배마 대학교 버밍햄 (UAB)'],
    proDebutYear: '2015',
    proDebutTeam: '오클랜드 애슬레틱스 (MLB 20R 드래프트 / 2022 세인트루이스 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'KIA 타이거즈',
    kboDraftType: '2024 KIA 자유선발',
  },
  '54843': {
    englishName: 'Keisho Shirakawa (白川 恵翔)',
    nationality: '일본',
    nationalityFlag: '🇯🇵',
    playerCategory: 'ASIAN_QUOTA',
    categoryLabel: '아시아쿼터 / 대체 외인',
    schools: ['도쿠시마 현립 이케다 고등학교 (徳島県立池田高等学校)'],
    proDebutYear: '2020',
    proDebutTeam: '도쿠시마 인디고삭스 (일본 시코쿠 아일랜드 리그 플러스)',
    kboDebutYear: '2024',
    kboDebutTeam: 'SSG 랜더스',
    kboDraftType: '2024 SSG 부상 대체 외국인선수 (두산 베어스 거쳐 KIA 타이거즈)',
  },
  // SSG 랜더스
  '53827': {
    englishName: 'Guillermo Heredia',
    nationality: '쿠바',
    nationalityFlag: '🇨🇺',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['에이데 루이스 아구스토 투르시오스 리마 체육학교 (EIDE Matanzas, 쿠바)'],
    proDebutYear: '2009',
    proDebutTeam: '코코드릴로스 데 마탄사스 (쿠바) / 2016 시애틀 매리너스 (MLB 데뷔)',
    kboDebutYear: '2023',
    kboDebutTeam: 'SSG 랜더스',
    kboDraftType: '2023 SSG 자유선발',
  },
  '54840': {
    englishName: 'Drew Anderson',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['갤리나 고등학교 (Galena HS)', '네바다 대학교 리노 (University of Nevada)'],
    proDebutYear: '2012',
    proDebutTeam: '필라델피아 필리스 (MLB 21R 드래프트 / 2017 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'SSG 랜더스',
    kboDraftType: '2024 SSG 대체 외국인 자유선발',
  },
  // LG 트윈스
  '53123': {
    englishName: 'Austin Dean',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['클라인 콜린스 고등학교 (Klein Collins HS, 텍사스)'],
    proDebutYear: '2012',
    proDebutTeam: '마이애미 말린스 (MLB 4R 드래프트 / 2018 MLB 데뷔)',
    kboDebutYear: '2023',
    kboDebutTeam: 'LG 트윈스',
    kboDraftType: '2023 LG 자유선발',
  },
  '69103': {
    englishName: 'Casey Kelly',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['새러소타 고등학교 (Sarasota HS, 플로리다)'],
    proDebutYear: '2008',
    proDebutTeam: '보스턴 레드삭스 (MLB 1R 30순위 지명 / 2012 샌디에이고 MLB 데뷔)',
    kboDebutYear: '2019',
    kboDebutTeam: 'LG 트윈스',
    kboDraftType: '2019 LG 자유선발',
  },
  '54133': {
    englishName: 'Dietrich Enns',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['센트럴 캐톨릭 고등학교', '센트럴 미시간 대학교 (Central Michigan University)'],
    proDebutYear: '2012',
    proDebutTeam: '뉴욕 양키스 (MLB 19R 지명 / 2017 미네소타 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'LG 트윈스',
    kboDraftType: '2024 LG 자유선발',
  },
  // KT 위즈
  '67025': {
    englishName: 'Mel Rojas Jr.',
    nationality: '미국 / 도미니카공화국',
    nationalityFlag: '🇩🇴',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['마운트 버넌 고등학교', '워배시 밸리 칼리지 (Wabash Valley College)'],
    proDebutYear: '2010',
    proDebutTeam: '피츠버그 파이어리츠 (MLB 3R 드래프트)',
    kboDebutYear: '2017',
    kboDebutTeam: 'kt wiz',
    kboDraftType: '2017 KT 자유선발 (2020 시즌 MVP)',
  },
  '69032': {
    englishName: 'William Cuevas',
    nationality: '베네수엘라',
    nationalityFlag: '🇻🇪',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['카라보보 대학교 (Universidad de Carabobo, 베네수엘라)'],
    proDebutYear: '2008',
    proDebutTeam: '보스턴 레드삭스 (국제 아마추어 계약 / 2016 MLB 데뷔)',
    kboDebutYear: '2019',
    kboDebutTeam: 'kt wiz',
    kboDraftType: '2019 KT 자유선발',
  },
  '52043': {
    englishName: 'Wes Benjamin',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['세인트찰스 이스트 고등학교', '캔자스 대학교 (University of Kansas)'],
    proDebutYear: '2014',
    proDebutTeam: '텍사스 레인저스 (MLB 5R 드래프트 / 2020 MLB 데뷔)',
    kboDebutYear: '2022',
    kboDebutTeam: 'kt wiz',
    kboDraftType: '2022 KT 대체 외국인 자유선발',
  },
  // 롯데 자이언츠
  '52528': {
    englishName: 'Charlie Barnes',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['섬터 고등학교 (Sumter HS, 사우스캐롤라이나)', '클렘슨 대학교 (Clemson University)'],
    proDebutYear: '2017',
    proDebutTeam: '미네소타 트윈스 (MLB 4R 드래프트 / 2021 MLB 데뷔)',
    kboDebutYear: '2022',
    kboDebutTeam: '롯데 자이언츠',
    kboDraftType: '2022 롯데 자유선발',
  },
  '53549': {
    englishName: 'Aaron Wilkerson',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['웨이코 고등학교 (Waco HS)', '컴벌랜드 대학교 (Cumberland University)'],
    proDebutYear: '2011',
    proDebutTeam: '포트워스 캐츠 (미국 독립리그 / 2017 밀워키 MLB 데뷔)',
    kboDebutYear: '2023',
    kboDebutTeam: '롯데 자이언츠',
    kboDraftType: '2023 롯데 대체 외국인 자유선발',
  },
  // NC 다이노스
  '54930': {
    englishName: 'Kyle Hart',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['신시내티 사우스웨스트 고등학교', '인디애나 대학교 (Indiana University)'],
    proDebutYear: '2016',
    proDebutTeam: '보스턴 레드삭스 (MLB 19R 드래프트 / 2020 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'NC 다이노스',
    kboDraftType: '2024 NC 자유선발 (2024 KBO 탈삼진/승률/ERA 다관왕)',
  },
  '54920': {
    englishName: 'Daniel Castano',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['레이크 트래비스 고등학교', '베일러 대학교 (Baylor University)'],
    proDebutYear: '2016',
    proDebutTeam: '세인트루이스 카디널스 (MLB 19R 지명 / 2020 마이애미 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'NC 다이노스',
    kboDraftType: '2024 NC 자유선발',
  },
  '54931': {
    englishName: 'Matt Davidson',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['유카이파 고등학교 (Yucaipa HS, 캘리포니아)'],
    proDebutYear: '2009',
    proDebutTeam: '애리조나 다이아몬드백스 (MLB 1R 35순위 지명 / 2013 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: 'NC 다이노스',
    kboDraftType: '2024 NC 자유선발 (2024 KBO 홈런왕)',
  },
  // 삼성 라이온즈
  '54452': {
    englishName: 'Connor Seabold',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['뉴포트 하버 고등학교', '캘리포니아 주립대학교 풀러턴 (Cal State Fullerton)'],
    proDebutYear: '2017',
    proDebutTeam: '필라델피아 필리스 (MLB 3R 드래프트 / 2021 보스턴 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: '삼성 라이온즈',
    kboDraftType: '2024 삼성 자유선발',
  },
  '54451': {
    englishName: 'Denyi Reyes',
    nationality: '도미니카공화국',
    nationalityFlag: '🇩🇴',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['도미니카공화국 산토도밍고 야구 아카데미'],
    proDebutYear: '2014',
    proDebutTeam: '보스턴 레드삭스 (국제 아마추어 계약 / 2022 볼티모어 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: '삼성 라이온즈',
    kboDraftType: '2024 삼성 자유선발',
  },
  '54831': {
    englishName: 'Lewin Diaz',
    nationality: '도미니카공화국',
    nationalityFlag: '🇩🇴',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['도미니카공화국 산티아고 데 로스 카바예로스 아카데미'],
    proDebutYear: '2013',
    proDebutTeam: '미네소타 트윈스 (국제 아마추어 계약 / 2020 마이애미 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: '삼성 라이온즈',
    kboDraftType: '2024 삼성 대체 외국인 자유선발',
  },
  // 한화 이글스
  '54755': {
    englishName: 'Ryan Weiss',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['사우스엘진 고등학교 (South Elgin HS)', '라이트 주립대학교 (Wright State University)'],
    proDebutYear: '2018',
    proDebutTeam: '애리조나 다이아몬드백스 (MLB 4R 드래프트)',
    kboDebutYear: '2024',
    kboDebutTeam: '한화 이글스',
    kboDraftType: '2024 한화 대체 외국인 자유선발',
  },
  '54834': {
    englishName: 'Jaime Barria',
    nationality: '파나마',
    nationalityFlag: '🇵🇦',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['파나마 파나마시티 야구 아카데미'],
    proDebutYear: '2013',
    proDebutTeam: 'LA 에인절스 (국제 아마추어 계약 / 2018 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: '한화 이글스',
    kboDraftType: '2024 한화 대체 외국인 자유선발',
  },
  '54433': {
    englishName: 'Yonathan Peraza',
    nationality: '베네수엘라',
    nationalityFlag: '🇻🇪',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['베네수엘라 카라카스 야구 아카데미'],
    proDebutYear: '2015',
    proDebutTeam: '시카고 컵스 (국제 아마추어 계약)',
    kboDebutYear: '2024',
    kboDebutTeam: '한화 이글스',
    kboDraftType: '2024 한화 자유선발',
  },
  // 키움 히어로즈
  '53375': {
    englishName: 'Ariel Jurado',
    nationality: '파나마',
    nationalityFlag: '🇵🇦',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['산 유다스 타데오 고등학교 (Colegio San Judas Tadeo, 파나마)'],
    proDebutYear: '2012',
    proDebutTeam: '텍사스 레인저스 (국제 아마추어 계약 / 2018 MLB 데뷔)',
    kboDebutYear: '2023',
    kboDebutTeam: '키움 히어로즈',
    kboDraftType: '2023 키움 자유선발',
  },
  '54330': {
    englishName: 'Enmanuel De Jesus',
    nationality: '베네수엘라',
    nationalityFlag: '🇻🇪',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['베네수엘라 발렌시아 야구 아카데미'],
    proDebutYear: '2014',
    proDebutTeam: '보스턴 레드삭스 (국제 계약 / 2023 마이애미 MLB 데뷔)',
    kboDebutYear: '2024',
    kboDebutTeam: '키움 히어로즈',
    kboDraftType: '2024 키움 자유선발',
  },
  '54030': {
    englishName: 'Ronnie Dawson',
    nationality: '미국',
    nationalityFlag: '🇺🇸',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['리스버그 고등학교', '오하이오 주립대학교 (Ohio State University)'],
    proDebutYear: '2016',
    proDebutTeam: '휴스턴 애스트로스 (MLB 2R 드래프트 / 2021 MLB 데뷔)',
    kboDebutYear: '2023',
    kboDebutTeam: '키움 히어로즈',
    kboDraftType: '2023 키움 대체 외국인 자유선발',
  },
  // 두산 베어스
  '69045': {
    englishName: 'Raul Alcantara',
    nationality: '도미니카공화국',
    nationalityFlag: '🇩🇴',
    playerCategory: 'FOREIGN',
    categoryLabel: '외국인 선수',
    schools: ['엠마 발라게르 중등학교 (Liceo Emma Balaguer, 도미니카)'],
    proDebutYear: '2009',
    proDebutTeam: '보스턴 레드삭스 (국제 계약 / 2016 오클랜드 MLB 데뷔)',
    kboDebutYear: '2019',
    kboDebutTeam: 'kt wiz',
    kboDraftType: '2019 KT 자유선발 (2020, 2023~2024 두산 베어스)',
  },
};

// 학교명 정제 사전 (KBO raw career에 영문/약어로 들어있는 학교 매핑)
const KNOWN_TRANSLATIONS: Record<string, string> = {
  'Alabama at Birmingham': '앨라배마 대학교 버밍햄 (UAB)',
  '이케타고': '이케다 고등학교 (도쿠시마현)',
  'Klein Collins': '클라인 콜린스 고등학교 (텍사스)',
  'Wabash Valley': '워배시 밸리 칼리지',
  'Kansas': '캔자스 대학교',
  'Clemson': '클렘슨 대학교',
  'Sumter': '섬터 고등학교',
  'Eide Luis Agusto Tursios Lima': '에이데 루이스 아구스토 투르시오스 리마 체육학교 (쿠바 마탄사스)',
  'Galena': '갤리나 고등학교',
  'Nevada': '네바다 대학교 리노',
  'South Elgin': '사우스엘진 고등학교',
  'Wright State': '라이트 주립대학교',
  'Cincinnati Southwest': '사우스웨스트 고등학교',
  'Indiana': '인디애나 대학교',
  'Yucaipa': '유카이파 고등학교',
  'Valencia': '발렌시아 야구 아카데미',
  'Waco': '웨이코 고등학교',
  'Cumberland': '컴벌랜드 대학교',
  'Baylor': '베일러 대학교',
  'Carabobo': '카라보보 대학교',
  'San Judas Tadeo': '산 유다스 타데오 고등학교',
  'Sarasota': '새러소타 고등학교',
  'Central Michigan': '센트럴 미시간 대학교',
  'California State': '캘리포니아 주립대학교',
  'Ohio State': '오하이오 주립대학교',
  'Liceo secundario Emma Balaguer': '엠마 발라게르 중등학교 (도미니카)',
};

/**
 * KBO 공식 웹사이트 Basic.aspx에서 기본 인적사항 및 계약/지명 정보 비동기 크롤링
 */
export async function fetchKboBasicProfile(playerId: string, isPitcher = true): Promise<any | null> {
  const type = isPitcher ? 'PitcherDetail' : 'HitterDetail';
  const url = `https://www.koreabaseball.com/Record/Player/${type}/Basic.aspx?playerId=${encodeURIComponent(playerId)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();

    const getField = (field: string) => {
      const m = html.match(new RegExp(`lbl${field}[^>]*>([^<]+)<`, 'i'));
      return m ? m[1].trim() : '';
    };

    return {
      name: getField('Name'),
      backNo: getField('BackNo'),
      birthday: getField('Birthday'),
      position: getField('Position'),
      heightWeight: getField('HeightWeight'),
      career: getField('Career'),
      payment: getField('Payment'),
      salary: getField('Salary'),
      draft: getField('Draft'),
      entryYear: getField('EntryYear'),
    };
  } catch (_) {
    return null;
  }
}

/**
 * 외국인/아시아쿼터/국내 선수 정보를 통합 분석하여 고도화된 프로필 메타데이터를 도출합니다.
 */
export function enhancePlayerInformation(
  playerId: string,
  pRaw: any,
  rRaw: any,
  kboBasic: any
): EnhancedPlayerMeta {
  const curated = CURATED_FOREIGN_PLAYERS[playerId];

  // 1. 국적 및 선수 구분 (외국인 / 아시아쿼터 / 국내) 판정
  const rawBirthPlace = pRaw?.birthPlace || '';
  const kboCareer = kboBasic?.career || '';
  const kboDraft = kboBasic?.draft || '';
  const salaryStr = kboBasic?.salary || '';
  const paymentStr = kboBasic?.payment || '';

  let nationality = curated?.nationality || rawBirthPlace || '대한민국';
  let nationalityFlag = curated?.nationalityFlag || COUNTRY_FLAG_MAP[nationality] || '🇰🇷';

  // 아시아쿼터 / 단기 대체 판별
  let playerCategory: PlayerCategory = curated?.playerCategory || 'DOMESTIC';
  let categoryLabel = curated?.categoryLabel || '국내 선수';

  if (!curated?.playerCategory) {
    const isForeignDraft = kboDraft.includes('자유선발') || kboDraft.includes('외국인') || kboDraft.includes('대체 외국인');
    const isDollarCurrency = salaryStr.includes('달러') || paymentStr.includes('달러');
    const isForeignBirth = rawBirthPlace && rawBirthPlace !== '한국' && rawBirthPlace !== '대한민국';
    const isForeignCareer = /^(미국|일본|쿠바|베네수엘라|도미니카|대만|파나마|멕시코|캐나다|호주)/.test(kboCareer);

    if (isForeignDraft || isDollarCurrency || isForeignBirth || isForeignCareer) {
      if (nationality === '일본' || nationality === '대만' || kboDraft.includes('아시아쿼터') || kboDraft.includes('부상 대체 외국인')) {
        playerCategory = 'ASIAN_QUOTA';
        categoryLabel = '아시아쿼터 / 대체 외인';
      } else {
        playerCategory = 'FOREIGN';
        categoryLabel = '외국인 선수';
      }
    }
  }

  // 2. 출신교명 정보 고도화
  let schools: string[] = [];

  if (curated?.schools && curated.schools.length > 0) {
    schools = [...curated.schools];
  } else {
    // 2-1. Naver 제공 학교 목록 확인
    if (Array.isArray(pRaw?.mainSchoolList) && pRaw.mainSchoolList.length > 0) {
      pRaw.mainSchoolList.forEach((s: any) => {
        if (s.schoolName && !schools.includes(s.schoolName)) schools.push(s.schoolName);
      });
    }
    if (schools.length === 0 && Array.isArray(pRaw?.sportsBridgeSchool) && pRaw.sportsBridgeSchool.length > 0) {
      pRaw.sportsBridgeSchool.forEach((s: any) => {
        if (s.schoolName && !schools.includes(s.schoolName)) schools.push(s.schoolName);
      });
    }

    // 2-2. 외국인/아시아쿼터의 경우 Naver 학교가 비어있거나 불완전하면 KBO career에서 추출/정제
    if (schools.length === 0 && kboCareer) {
      if (playerCategory !== 'DOMESTIC') {
        // 외국 학교 정제
        let s = kboCareer.replace(/-(?:SSG|두산|KIA|KT|LG|삼성|한화|롯데|NC|키움|SK|OB|HT)+/g, '').trim();

        // 국적 접두사 분리
        let cName = '';
        for (const c of Object.keys(COUNTRY_FLAG_MAP)) {
          if (s.startsWith(c)) {
            cName = c;
            s = s.slice(c.length).trim();
            break;
          }
        }

        // 알려진 명칭 치환
        for (const [eng, kor] of Object.entries(KNOWN_TRANSLATIONS)) {
          if (s.includes(eng)) {
            s = kor;
            break;
          }
        }

        s = s
          .replace(/\(대\)/g, ' 대학교')
          .replace(/\(고\)/g, ' 고등학교')
          .replace(/\(중\)/g, ' 중학교')
          .replace(/\(초\)/g, ' 초등학교')
          .trim();

        if (cName && !s.includes(cName)) {
          s = `${s} (${cName})`;
        }
        if (s) schools.push(s);
      } else {
        // 국내 학교 파싱: 초-중-고 분리
        const parts = kboCareer.split('-').map((x: string) => x.trim()).filter(Boolean);
        parts.forEach((p: string) => {
          let clean = p;
          if (clean.endsWith('초')) clean += '등학교';
          else if (clean.endsWith('중')) clean += '학교';
          else if (clean.endsWith('고')) clean += '등학교';
          else if (clean.endsWith('대')) clean += '학교';
          if (!schools.includes(clean)) schools.push(clean);
        });
      }
    }
  }

  // 3. 프로 데뷔 및 KBO 입단 정보 고도화
  const careerInfo = pRaw?.sportsBridgeCareerInfo || [];
  const debutInfo = pRaw?.debutInfo?.[0];

  // 3-1. KBO 리그 입단 정보
  let kboDebutYear = curated?.kboDebutYear || '';
  let kboDebutTeam = curated?.kboDebutTeam || '';
  let kboDraftType = curated?.kboDraftType || kboDraft || '';

  if (!kboDebutYear) {
    if (kboBasic?.entryYear) {
      // e.g. "24KIA" -> 2024년 KIA
      const m = kboBasic.entryYear.match(/^(\d{2})/);
      if (m) kboDebutYear = `20${m[1]}`;
    }
    if (!kboDebutYear && kboDraft) {
      const m = kboDraft.match(/^(\d{2})/);
      if (m) kboDebutYear = `20${m[1]}`;
    }
  }

  if (!kboDebutTeam) {
    // sportsBridgeCareerInfo에서 최초 KBO 팀 탐색
    for (let i = careerInfo.length - 1; i >= 0; i--) {
      const c = careerInfo[i];
      if (/타이거즈|라이온즈|트윈스|베어스|wiz|랜더스|자이언츠|이글스|다이노스|히어로즈/.test(c.contents)) {
        kboDebutTeam = c.contents;
        if (!kboDebutYear && c.startDate) kboDebutYear = c.startDate.slice(0, 4);
        break;
      }
    }
  }

  // 3-2. 프로 / 해외 데뷔 정보
  let proDebutYear = curated?.proDebutYear || '';
  let proDebutTeam = curated?.proDebutTeam || '';

  if (!proDebutYear || !proDebutTeam) {
    // Naver의 debutInfo 우선 확인 (국가대표 이벤트 배제)
    if (debutInfo?.debut_year && !debutInfo.debuts_work?.includes('국가대표')) {
      proDebutYear = proDebutYear || debutInfo.debut_year;
      proDebutTeam = proDebutTeam || debutInfo.debuts_work;
    }

    // careerInfo에서 국가대표/WBC를 제외한 최초 프로 클럽 역순 탐색
    if (!proDebutTeam) {
      for (let i = careerInfo.length - 1; i >= 0; i--) {
        const c = careerInfo[i];
        if (c.contents && !c.contents.includes('국가대표') && !c.contents.includes('WBC') && !c.contents.includes('프리미어')) {
          proDebutTeam = c.contents;
          proDebutYear = proDebutYear || (c.startDate ? c.startDate.slice(0, 4) : '');
          break;
        }
      }
    }
  }

  // 국내 선수의 경우 proDebut = kboDebut 일치화
  if (playerCategory === 'DOMESTIC') {
    if (!proDebutYear) proDebutYear = kboDebutYear;
    if (!proDebutTeam) proDebutTeam = kboDebutTeam;
  }

  return {
    playerCategory,
    categoryLabel,
    nationality,
    nationalityFlag,
    englishName: curated?.englishName || pRaw?.viewName || '',
    schools,
    kboDebutYear: kboDebutYear || proDebutYear,
    kboDebutTeam: kboDebutTeam || proDebutTeam,
    kboDraftType,
    proDebutYear: proDebutYear || kboDebutYear,
    proDebutTeam: proDebutTeam || kboDebutTeam,
    salary: kboBasic?.salary || '',
    payment: kboBasic?.payment || '',
    rawCareer: kboCareer,
  };
}
