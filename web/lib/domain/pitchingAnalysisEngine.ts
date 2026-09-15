/**
 * 선수별 구종 데이터(KBO/네이버 트래킹) 기반 피칭 분석 및 플레이 스타일 엔진
 */

export interface PitchArsenalItem {
  code: string;           // 'fast', 'twos', 'swee', 'slid', 'chup', 'fork', 'curv', 'cutt'
  name: string;           // '직구', '투심', '스위퍼', '슬라이더', '체인지업', '포크', '커브', '커터'
  usage: number;          // 구사율 (%) e.g. 33.1
  speed: number;          // 평균 구속 (km/h) e.g. 145.0
  leagueSpeed: number;    // 리그 평균 구속 (km/h) e.g. 143.0
  diffSpeed: number;      // 리그 평균 대비 구속 차이 (+2.0)
  role: '주무기' | '핵심 결정구' | '카운트용' | '유인구';
  color: string;          // 뱃지 및 바 차트 색상 코드
}

export interface ZoneHeatmapItem {
  zone: number;           // 1~9 (내측 스트라이크 존), 10~13 (외곽 유인구 존: 10상, 11좌, 12우, 13하)
  pitRate: number;        // 투구 집중도 (%) e.g. 18.4
  hra: string;            // 피안타율 e.g. "0.200"
  kkRate: number;         // 탈삼진 점유율 (%) e.g. 32.1
  pitStep: number;        // 1~5 단계 (히트 강도)
  hraStep: number;        // 1~5 단계
  kkStep: number;         // 1~5 단계
  label: string;          // 구역 설명 (예: "몸쪽 상단", "바깥쪽 하단 볼")
}

export interface PitchingAdvancedMetrics {
  kPer: number;           // 탈삼진율 (K%) e.g. 31.5
  bbPer: number;          // 볼넷율 (BB%) e.g. 5.1
  kBbRatio: number;       // K/BB e.g. 6.18
  era: string;            // 평균자책점 e.g. "2.14"
  whip: string;           // WHIP e.g. "1.07"
  inn: string;            // 소화 이닝 e.g. "157 2/3"
  winLoss: string;        // "10승 7패"
  warRank?: string;       // "공동 3위"
  eraRank?: string;       // "4위"
  kkRank?: string;        // "8위"
  innRank?: string;       // "1위"
}

export interface PitchingAnalysisData {
  isPitcher: true;
  archetype: string;                 // 예: "투심-스위퍼 땅볼 유도형 싱커볼러"
  styleTags: string[];               // 예: ['#싱커볼러', '#스위퍼특화', '#땅볼유도형', '#150km파워']
  scoutingReport: string;            // 2~3문장의 분석 요약 리포트
  primaryPitch: string;              // 주무기 이름
  primarySpeed: number;              // 주무기 평균 구속
  primaryDiffSpeed: number;          // 리그 대비 구속
  secondaryPitch?: string;           // 결정구
  arsenal: PitchArsenalItem[];       // 구종별 구사율/구속 목록
  zoneHeatmap: ZoneHeatmapItem[];    // 13개 구역 스트라이크존 데이터
  metrics: PitchingAdvancedMetrics;  // 세부 지표
}

export interface BattingAnalysisData {
  isPitcher: false;
  styleTitle: string;                // 예: "전형적인 당겨치기형 파워 히터"
  styleTags: string[];               // 예: ['#풀히터', '#장타형', '#클러치히터']
  scoutingReport: string;            // 타격 분석 요약
  sprayDirection: {
    left: number;                    // 좌측 타구 비율 (%)
    center: number;                  // 중앙 타구 비율 (%)
    right: number;                   // 우측 타구 비율 (%)
  };
  tendencyLabel: string;             // "당겨치기 성향 (Pull Hitter)"
  hotColdZones: {
    zone: number;
    hra: string;                     // 타율
    hraStep: number;
    label: string;
  }[];
  metrics: {
    hra: string;
    hr: number;
    rbi: number;
    ops: string;
    wrcPlus?: string;
    war?: string;
    rankText?: string;
  };
}

// 구종별 고유 색상 및 명칭 정의
export const PITCH_COLORS: Record<string, string> = {
  fast: '#ef4444', // 직구 (빨강)
  twos: '#f97316', // 투심 (주황)
  cutt: '#f59e0b', // 커터 (호박색)
  slid: '#3b82f6', // 슬라이더 (파랑)
  swee: '#8b5cf6', // 스위퍼 (보라)
  chup: '#10b981', // 체인지업 (초록)
  fork: '#06b6d4', // 포크 (청록)
  spli: '#06b6d4', // 스플리터 (청록)
  curv: '#0ea5e9', // 커브 (하늘색)
  sink: '#f97316', // 싱커
  kunc: '#64748b', // 너클
  slur: '#6366f1', // 슬러브
};

const ZONE_LABELS: Record<number, string> = {
  1: '좌상단 (High-Left)',
  2: '상단 중앙 (High-Center)',
  3: '우상단 (High-Right)',
  4: '중단 좌측 (Mid-Left)',
  5: '한가운데 (Center)',
  6: '중단 우측 (Mid-Right)',
  7: '좌하단 (Low-Left)',
  8: '하단 중앙 (Low-Center)',
  9: '우하단 (Low-Right)',
  10: '존 상단 볼 (High Chase)',
  11: '존 좌측 볼 (Left Chase)',
  12: '존 우측 볼 (Right Chase)',
  13: '존 하단 볼 (Low Chase)',
};

/**
 * 투수의 구종 데이터 및 기록을 정량 분석하여 피칭 스타일 및 스카우팅 리포트를 산출합니다.
 */
export function analyzePitchingStyle(
  chartRaw: any,
  basicRecordRaw: any,
  playerDesc = '',
  playerName = '선수'
): PitchingAnalysisData | null {
  if (!chartRaw) return null;

  let chart = chartRaw;
  if (typeof chart === 'string') {
    try {
      chart = JSON.parse(chart);
    } catch (_) {
      return null;
    }
  }

  let basicObj = basicRecordRaw;
  if (typeof basicObj === 'string') {
    try {
      basicObj = JSON.parse(basicObj);
    } catch (_) {
      basicObj = {};
    }
  }
  const basic = basicObj?.basic || {};
  const ranks = basicObj?.rank || [];

  const playerPitches = chart?.pit_kind?.player || {};
  const seasonPitches = chart?.pit_kind?.season || {};

  // 1. 구종 목록 정규화
  const arsenal: PitchArsenalItem[] = [];
  for (const [code, info] of Object.entries<any>(playerPitches)) {
    if (!info || info.pit_rt === null || Number(info.pit_rt) <= 0) continue;

    const usage = Math.round(Number(info.pit_rt) * 10) / 10;
    const speed = typeof info.speed === 'number' ? info.speed : parseFloat(info.speed) || 0;

    // 리그 평균 구속
    const leagueInfo = seasonPitches[code];
    const leagueSpeed = leagueInfo && typeof leagueInfo.speed === 'number' ? leagueInfo.speed : 0;
    const diffSpeed = leagueSpeed > 0 && speed > 0 ? Math.round((speed - leagueSpeed) * 10) / 10 : 0;

    arsenal.push({
      code,
      name: info.pit || code,
      usage,
      speed,
      leagueSpeed,
      diffSpeed,
      role: '카운트용',
      color: PITCH_COLORS[code] || '#94a3b8',
    });
  }

  if (arsenal.length === 0) return null;

  // 구사율 내림차순 정렬
  arsenal.sort((a, b) => b.usage - a.usage);

  // 역할 부여
  arsenal.forEach((item, index) => {
    if (index === 0) {
      item.role = '주무기';
    } else if (index === 1 && (item.code === 'swee' || item.code === 'slid' || item.code === 'fork' || item.code === 'chup')) {
      item.role = '핵심 결정구';
    } else if (item.usage >= 15) {
      item.role = '카운트용';
    } else {
      item.role = '유인구';
    }
  });

  const primary = arsenal[0];
  const secondary = arsenal.length > 1 ? arsenal[1] : undefined;

  // 2. 핵심 투구 지표 계산
  const kPer = basic.k_per ? Number(basic.k_per) : 0;
  const bbPer = basic.bb_per ? Number(basic.bb_per) : 0;
  const kBbRatio = bbPer > 0 ? Math.round((kPer / bbPer) * 100) / 100 : kPer;
  const era = basic.era !== undefined ? String(basic.era) : '-';
  const whip = basic.whip !== undefined ? String(basic.whip) : '-';
  const inn = basic.inn || '-';
  const winLoss = basic.w !== undefined && basic.l !== undefined ? `${basic.w}승 ${basic.l}패` : '';

  const getRank = (key: string) => {
    const found = ranks.find((r: any) => r.key === key);
    return found ? String(found.rank || '') : undefined;
  };

  const metrics: PitchingAdvancedMetrics = {
    kPer,
    bbPer,
    kBbRatio,
    era,
    whip,
    inn,
    winLoss,
    warRank: getRank('war'),
    eraRank: getRank('era'),
    kkRank: getRank('kk'),
    innRank: getRank('inn'),
  };

  // 3. 투구 유형 아키타입(Archetype) 및 스타일 태그 분류
  const isLefty = playerDesc.includes('좌투');
  const handPrefix = isLefty ? '좌완' : '우완';
  let archetype = `${handPrefix} 밸런스형 정통파 투수`;

  const fastUsage = arsenal.find((p) => p.code === 'fast')?.usage || 0;
  const fastSpeed = arsenal.find((p) => p.code === 'fast')?.speed || 0;
  const twosUsage = arsenal.find((p) => p.code === 'twos')?.usage || 0;
  const sweeUsage = arsenal.find((p) => p.code === 'swee')?.usage || 0;
  const slidUsage = arsenal.find((p) => p.code === 'slid')?.usage || 0;
  const forkUsage = (arsenal.find((p) => p.code === 'fork')?.usage || 0) + (arsenal.find((p) => p.code === 'spli')?.usage || 0);
  const chupUsage = arsenal.find((p) => p.code === 'chup')?.usage || 0;

  const styleTags: string[] = [];

  // 아키타입 판별 로직
  if (fastUsage >= 50 && fastSpeed >= 147) {
    archetype = `${handPrefix} 150km/h 초강력 포심 파워피처`;
    styleTags.push('#파워피처', '#하이패스트볼', '#구위압도');
  } else if ((twosUsage + sweeUsage) >= 45) {
    archetype = `${handPrefix} 투심-스위퍼 땅볼 유도형 싱커볼러`;
    styleTags.push('#싱커볼러', '#스위퍼특화', '#땅볼유도형');
  } else if (twosUsage >= 35) {
    archetype = `${handPrefix} 변형 패스트볼 중심의 헤비 싱커볼러`;
    styleTags.push('#헤비투심', '#내추럴무브먼트', '#땅볼유도');
  } else if (slidUsage >= 35) {
    archetype = `${handPrefix} 슬라이더 마스터 / 횡무브먼트 스페셜리스트`;
    styleTags.push('#슬라이더스페셜리스트', '#와이드존활용');
  } else if (forkUsage >= 20 && kPer >= 20) {
    archetype = `${handPrefix} 낙차 큰 포크볼을 앞세운 닥터K 탈삼진러`;
    styleTags.push('#포크볼러', '#탈삼진머신', '#종무브먼트');
  } else if (arsenal.filter((p) => p.usage >= 10).length >= 4) {
    archetype = `${handPrefix} 4구종 이상을 자유자재로 구사하는 완성형 선발`;
    styleTags.push('#포피치완성형', '#팔색조피칭', '#볼배합우수');
  } else if (bbPer <= 5.5 && bbPer > 0) {
    archetype = `${handPrefix} 코너워크 중심의 정밀 컨트롤 아티스트`;
    styleTags.push('#칼제구', '#코너워크', '#볼넷억제');
  } else if (chupUsage >= 20) {
    archetype = `${handPrefix} 체인지업으로 타이밍을 뺏는 오프스피드 피처`;
    styleTags.push('#체인지업마스터', '#타이밍브레이커');
  } else {
    archetype = `${handPrefix} 로케이션과 변화구 조합의 밸런스형 피처`;
    styleTags.push('#밸런스형', '#안정된로케이션');
  }

  // 부가 스타일 태그
  if (fastSpeed >= 149) styleTags.push('#150km급구속');
  if (primary.diffSpeed >= 2.0) styleTags.push('#리그최상위구위');
  if (kPer >= 28) styleTags.push('#탈삼진율_상위1%');
  else if (kPer >= 20) styleTags.push('#높은탈삼진율');
  if (bbPer > 0 && bbPer <= 5.0) styleTags.push('#볼넷억제력_최상위');

  // 중복 태그 제거 및 최대 4개
  const uniqueTags = [...new Set(styleTags)].slice(0, 4);

  // 4. 스카우팅 분석 리포트 자동 생성
  const reportSentences: string[] = [];

  // 문장 1: 주무기 및 구속
  if (primary.diffSpeed > 0) {
    reportSentences.push(
      `주무기인 ${primary.name}을(를) ${primary.usage}%의 높은 비율로 구사하며, 평균 ${primary.speed}km/h로 리그 평균(${primary.leagueSpeed}km/h) 대비 +${primary.diffSpeed}km/h 빠른 압도적인 구위를 자랑합니다.`
    );
  } else {
    reportSentences.push(
      `주무기인 ${primary.name}을(를) 전체 투구의 ${primary.usage}%로 구사하며(평균 ${primary.speed}km/h), 안정된 릴리스 포인트와 정교한 로케이션으로 카운트를 선점합니다.`
    );
  }

  // 문장 2: 결정구 및 보조 구종
  if (secondary) {
    const secDiff = secondary.diffSpeed > 0 ? ` (+${secondary.diffSpeed}km/h)` : '';
    reportSentences.push(
      `유리한 볼카운트에서는 2구종인 ${secondary.name}(${secondary.usage}%, ${secondary.speed}km/h${secDiff})을(를) 결정구로 활용하여 타자의 배트를 끌어내고 헛스윙을 유도합니다.`
    );
  }

  // 문장 3: 전반적인 피칭 특성 및 존 공략
  if (kPer >= 25) {
    reportSentences.push(
      `탈삼진율(K%)이 ${kPer}%에 달해 위기 상황에서도 주자를 묶어두는 탁월한 탈삼진 억제력을 갖추고 있습니다.`
    );
  } else if (bbPer > 0 && bbPer <= 6.0) {
    reportSentences.push(
      `볼넷 허용률(BB%)이 ${bbPer}%에 불과하여 타자에게 불필요한 출루를 내주지 않는 정밀한 제구력이 최대 강점입니다.`
    );
  } else {
    reportSentences.push(
      `구종 간 구속 편차와 좌우·상하 무브먼트의 조합을 통해 타자의 정타를 효과적으로 차단하는 피칭 디자인을 갖추고 있습니다.`
    );
  }

  const scoutingReport = reportSentences.join(' ');

  // 5. 13개 존 핫/콜드 데이터 정규화
  const rawHotCold = chart?.hot_cold || [];
  const zoneHeatmap: ZoneHeatmapItem[] = [];

  for (let z = 1; z <= 13; z++) {
    const found = rawHotCold.find((h: any) => Number(h.zone) === z);
    zoneHeatmap.push({
      zone: z,
      pitRate: found ? parseFloat(found.pit_rt || '0') : 0,
      hra: found?.hra || '-',
      kkRate: found ? parseFloat(found.kk || '0') : 0,
      pitStep: found ? parseInt(found.pit_rt_step || '1', 10) : 1,
      hraStep: found ? parseInt(found.hra_step || '1', 10) : 1,
      kkStep: found ? parseInt(found.kk_step || '1', 10) : 1,
      label: ZONE_LABELS[z] || `Zone ${z}`,
    });
  }

  return {
    isPitcher: true,
    archetype,
    styleTags: uniqueTags,
    scoutingReport,
    primaryPitch: primary.name,
    primarySpeed: primary.speed,
    primaryDiffSpeed: primary.diffSpeed,
    secondaryPitch: secondary?.name,
    arsenal,
    zoneHeatmap,
    metrics,
  };
}

/**
 * 타자의 타구 방향 및 코스별 타율을 분석하여 타격 스타일을 요약합니다.
 */
export function analyzeBattingStyle(
  chartRaw: any,
  basicRecordRaw: any,
  playerDesc = '',
  playerName = '선수'
): BattingAnalysisData | null {
  if (!chartRaw) return null;

  let chart = chartRaw;
  if (typeof chart === 'string') {
    try {
      chart = JSON.parse(chart);
    } catch (_) {
      return null;
    }
  }

  let basicObj = basicRecordRaw;
  if (typeof basicObj === 'string') {
    try {
      basicObj = JSON.parse(basicObj);
    } catch (_) {
      basicObj = {};
    }
  }
  const basic = basicObj?.basic || {};

  const dir = chart?.direction || { left: 33.3, center: 33.3, right: 33.4 };
  const left = parseFloat(dir.left || '0');
  const center = parseFloat(dir.center || '0');
  const right = parseFloat(dir.right || '0');

  const isLeftBatter = playerDesc.includes('좌타');
  let tendencyLabel = '스프레이 히터 (Spray Hitter)';
  let styleTitle = '부채꼴 타구를 만드는 스프레이 히터';
  const styleTags: string[] = [];

  if (!isLeftBatter) {
    // 우타자: 좌측 타구 많으면 당겨치기
    if (left >= 42) {
      tendencyLabel = '당겨치기 성향 (Pull Hitter)';
      styleTitle = '강한 장타력을 앞세운 당겨치기형 타자';
      styleTags.push('#풀히터', '#당겨치기', '#강한타구');
    } else if (right >= 33) {
      tendencyLabel = '밀어치기 능한 반대방향 타자 (Oppo Hitter)';
      styleTitle = '우측 필드를 공략하는 정교한 타자';
      styleTags.push('#밀어치기', '#정교한배트컨트롤');
    } else {
      styleTags.push('#스프레이히터', '#전방위타구분포');
    }
  } else {
    // 좌타자: 우측 타구 많으면 당겨치기
    if (right >= 42) {
      tendencyLabel = '당겨치기 성향 (Pull Hitter)';
      styleTitle = '우측 담장을 위협하는 당겨치기형 타자';
      styleTags.push('#풀히터', '#당겨치기', '#장타특화');
    } else if (left >= 33) {
      tendencyLabel = '밀어치기 능한 반대방향 타자 (Oppo Hitter)';
      styleTitle = '좌측 결대로 밀어치는 테크니션 타자';
      styleTags.push('#밀어치기', '#정교한테크니션');
    } else {
      styleTags.push('#스프레이히터', '#전방위타구분포');
    }
  }

  const hr = Number(basic.hr || 0);
  const hra = basic.hra || basic.avg || '-';
  const ops = basic.ops || '-';
  const rbi = Number(basic.rbi || 0);
  const wrcPlus = basic.wrc_plus ? String(basic.wrc_plus) : undefined;
  const war = basic.war ? String(basic.war) : undefined;

  if (hr >= 20) styleTags.push('#슬러거_20홈런');
  else if (hr >= 10) styleTags.push('#중장거리포');
  if (parseFloat(hra) >= 0.300) styleTags.push('#3할타자');
  if (parseFloat(ops) >= 0.850) styleTags.push('#특급_OPS');

  const scoutingReport = `좌·중·우 타구 분포([좌 ${left}% / 중 ${center}% / 우 ${right}%])를 보이는 ${tendencyLabel}로, 코스에 맞는 유연한 배트 컨트롤과 상황에 따른 타격 메커니즘을 보여줍니다.`;

  const rawHotCold = chart?.hot_cold || [];
  const hotColdZones = rawHotCold.slice(0, 9).map((h: any) => ({
    zone: Number(h.zone),
    hra: h.hra || '-',
    hraStep: parseInt(h.hra_step || '1', 10),
    label: ZONE_LABELS[Number(h.zone)] || `Zone ${h.zone}`,
  }));

  return {
    isPitcher: false,
    styleTitle,
    styleTags: [...new Set(styleTags)].slice(0, 4),
    scoutingReport,
    sprayDirection: { left, center, right },
    tendencyLabel,
    hotColdZones,
    metrics: {
      hra,
      hr,
      rbi,
      ops,
      wrcPlus,
      war,
    },
  };
}
