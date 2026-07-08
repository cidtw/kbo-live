'use strict';

// 한국어 메시지 테이블 (기본). 중계 본문은 네이버 원문(한국어) 그대로 사용.
module.exports = {
  dateLocale: 'ko-KR',
  vs: 'VS',
  homeLabel: '홈',
  awayLabel: '원정',

  help: `
kbo-live — KBO 리그 실시간 문자중계 CLI (비공식 네이버 스포츠 데이터)

사용법:
  kbo-live                     오늘 라이브 경기 자동 탐색 → 문자중계 시작
  kbo-live <팀명|팀코드>        오늘 해당 팀 경기 중계 (예: kbo-live 롯데 / kbo-live LT)
  kbo-live --list [--date 날짜] 경기 목록 (라이브/예정/종료)
  kbo-live --game-id <id>      특정 경기 중계 (예: 20260707HTLT02026)
  kbo-live --replay <gameId>   종료된 경기를 처음부터 리플레이

옵션:
  --date <YYYY-MM-DD|MMDD>  대상 날짜 (기본 오늘)
  --locale <hl>             표시 언어 (기본 ko-KR)
  --interval <sec>          라이브 폴링 간격 초 (기본 10, 최소 5)
  --speed <n>               리플레이 배속 (기본 1 ≈ 투구당 0.7초)
  --no-history              접속 시 지난 이닝 복원 생략 (빠른 시작)
  --no-pitches              투구 단위(1구 볼/스트라이크) 라인 숨김
  --no-cache                완료 이닝 로컬 캐시 비활성화
  --no-gui                  스코어보드 없이 로그만 (파이프/기록용)
  --fahrenheit | -f         구장 기온을 화씨(°F)로 표시 (기본 섭씨)
  --nerd | --emoji | --ascii  아이콘 테마 (기본 nerd = Nerd Font 필요)

조작(GUI): ↑↓ 스크롤 · PageUp/PageDn(Space) · Home/End(g/G 최신) · q·Ctrl+C 종료
`.trim(),

  // 상태 문구
  connecting: '접속 중…',
  waitingFeed: '중계 피드 대기 중…',
  loadingHistory: '지난 이닝 기록 복원 중…',
  loadingHistoryAt: (inn) => `지난 기록 복원 중… (${inn}회)`,
  historyDone: '지난 기록 복원 완료 — 라이브 중계를 시작합니다',
  statusLive: '라이브 중계 중',
  statusReplay: '리플레이 재생 중',
  replayPreparing: '리플레이 준비 중…',
  errorStatus: (msg) => `오류: ${msg} — 재시도 중`,
  syncing: (n) => `피드 동기화 중… (${n})`,
  waitingStart: (t) => `경기 시작 대기 중 — ${t} 예정`,
  gameCancelled: '경기가 취소되었습니다',
  gameEndedMsg: '경기 종료',
  liveEnded: '경기가 종료되었습니다. 시청해 주셔서 감사합니다!',
  replayEnded: '리플레이 종료',
  finalScore: ({ away, ascore, home, hscore }) => `최종 스코어  ${away} ${ascore} : ${hscore} ${home}`,

  // 목록/선택
  listLive: '● 라이브',
  listBefore: '○ 예정',
  listDone: '· 종료',
  listNone: '  (없음)',
  listTitle: (d) => `KBO 리그 — ${d}`,
  startHint: '\n중계 시작:  kbo-live <팀명>   또는  kbo-live --game-id <id>',
  replayHint: '리플레이:  kbo-live --replay <gameId>',
  noLiveNow: '지금 라이브 중인 KBO 경기가 없습니다.',
  noGamesDate: (d) => `${d} 에는 KBO 경기가 없습니다.`,
  multiLive: '라이브 경기가 여러 개입니다. 번호를 선택하세요:',
  pickLiveNum: '번호 입력 (기본 1): ',
  confirmReplayLatest: ({ away, home }) => `최근 종료 경기 ${away} vs ${home} 를 리플레이할까요? [Y/n] `,
  teamNotFound: (q) => `'${q}' 에 해당하는 오늘 경기를 찾지 못했습니다. --list 로 확인하세요.`,
  errGameNotFound: '경기를 찾을 수 없습니다. gameId 를 확인하세요.',
  errFeedNotFound: '이 경기의 문자중계 데이터를 찾을 수 없습니다.',
  errNotStarted: '경기가 아직 시작되지 않았습니다. --list 로 일정을 확인하세요.',

  // 이닝 라벨: half 'T'=초, 'B'=말
  innLabel: ({ inn, half }) => `${inn}회${half === 'T' ? '초' : '말'}`,
  tsLabel: ({ inn, half }) => `${String(inn).padStart(2)}${half === 'T' ? '초' : '말'}`,
  tsNone: '----',

  // 중계 라인 보조
  scoreTag: ({ a, h }) => ` (${a}:${h})`,
  batterUp: null, // 원문 그대로 사용
  connectMid: ({ away, home, inn }) => `${away} vs ${home} — ${inn} 진행 중 경기에 연결했습니다`,
  connectStart: ({ away, home }) => `${away} vs ${home} — 경기 시작을 기다립니다`,

  // 스코어보드
  commentaryTitle: '문자중계',
  scrollHint: '↑↓ 스크롤 · [1-9]/←→ 전환 · p 전력분석 · r 경기기록 · m 메뉴 · q 종료',
  endHint: 'G 최신',
  scrollPast: ({ end, total }) => `과거 보기 ${end}/${total}`,
  moreAbove: (n) => ` ↑ 이전 ${n}줄 `,
  pitcherLabel: '투수',
  batterLabel: '타자',
  pitchCount: (n) => `${n}구`,
  todayLine: (s) => `오늘 ${s}`,
  seasonAvg: (v) => `시즌 ${v}`,
  seasonEra: (v) => `평자 ${v}`,
  baseEmpty: '주자 없음',
  footer: ({ theme, W, rows }) => ` kbo-live · 테마 ${theme} · ${W}×${rows} · Source: 네이버 스포츠 / Original : Lucas (@Lucas20000903)`,
  endBanner: '— 중계 종료 —',
  errorLabel: '오류',
  menuTitle: 'KBO 리그 경기 선택 (메인 메뉴)',
  menuInstruction: '방향키 위/아래(k/j) 이동 · Enter 선택 · q 종료',
  menuDate: (d) => `날짜: ${d}`,
};
