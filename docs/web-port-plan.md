# kbo-live 웹 포팅 아키텍처 설계 (Vercel)

> 상태: 설계 문서만. 코드 미작성. `docs/web-port-plan.md`
> 대상: 현재 CLI(`bin/kbo-live.js` + `src/*`)를 Vercel에 배포 가능한 웹 서비스로 확장

## 1. 왜 이렇게 나뉘는가 — 현재 CLI 구조 재분류

| 파일 | 성격 | 웹 포팅 시 처리 |
|---|---|---|
| `src/api.js` | 순수 네트워크 레이어 (네이버 GW 호출) | **그대로 재사용**, 단 서버 사이드(API Route)에서만 실행 — CORS 때문에 브라우저 직접 호출 불가 |
| `src/broadcast.js` | 순수 도메인 로직 (seqno 커서, 이벤트 분류, 라인스코어 재구성) | **그대로 재사용 가능** — TTY/config 의존이 얕음(`config.gui`, `config.replay`, `config.pitches` 체크만 제거하면 브라우저에서도 동작) |
| `src/cache.js` | 파일시스템 캐시 (완료 이닝 불변 캐시) | **드롭**. 서버리스 인스턴스는 파일시스템이 휘발성 + 요청 간 공유 안 됨. 대체안은 §5 |
| `src/render.js`, `src/ansi.js`, `src/theme.js` | ANSI 이스케이프 기반 풀스크린 TUI 렌더러 | **전량 폐기**, React 컴포넌트 + CSS로 재작성 (§4) |
| `src/cli.js` (main loop, keypress 핸들러) | TTY 이벤트 루프 + 상태 머신(menu/spectate/switch) | **로직만 이식**, keypress → React state, 30초 폴링 루프 → client fetch 인터벌 (§3) |
| `src/runner.js` | 경기 탐색/대기/백필 오케스트레이션 | 서버 사이드에서는 상태 없는 조회 함수로, 클라이언트에서는 폴링 스케줄러로 분리 재구성 |

핵심 통찰: **도메인 로직(뭘 보여줄지 계산)과 렌더링(어떻게 그릴지)이 이미 분리돼 있어서**, `broadcast.js`를 프런트엔드 상태관리 코어로 그대로 승격시키는 게 가장 리스크가 적은 경로.

## 2. 배포 형태 결정

**Next.js 15 App Router 단일 프로젝트**, `kbo-live` 저장소 안에 `web/`로 추가 (별도 레포 아님 — 도메인 로직을 로컬 workspace 참조로 재사용).

```
kbo-live/
├── bin/ src/ test/         (기존 CLI, 무수정)
└── web/
    ├── app/
    │   ├── page.tsx              경기 목록 (오늘 라이브/예정/종료)
    │   ├── game/[gameId]/page.tsx   중계 화면
    │   └── api/
    │       ├── games/route.ts    GET ?date= → fetchGamesByDate 프록시
    │       ├── game/[id]/route.ts    GET → fetchGame 프록시
    │       └── relay/[id]/route.ts   GET ?inning=&finished= → fetchRelay 프록시
    ├── lib/
    │   ├── domain/                symlink 대신 src/api.js, src/broadcast.js를 
    │   │                          Node-only 부분만 뽑아 재노출 (§1 표 참고)
    │   └── useBroadcastStream.ts   클라이언트 폴링 훅
    └── components/
        ├── LineScore.tsx
        ├── DiamondPanel.tsx
        ├── CommentaryFeed.tsx
        └── GameSelector.tsx
```

**왜 모노레포인가**: `broadcast.js`가 CLI와 웹에서 100% 동일하게 동작해야 한다(이벤트 분류 규칙이 어긋나면 두 곳의 중계 내용이 갈린다). 별도 레포로 쪼개면 이 로직을 npm 패키지로 추출·버전 관리해야 하는데, 지금 단계에선 과설계. `web/`을 CLI 저장소 안에 두고 `../src/broadcast`를 직접 import하는 게 가장 단순.

## 3. 실시간 갱신 전략 — 왜 폴링인가

CLI는 `setInterval` 격 `while(true) + sleep(interval)`로 10초마다 `fetchRelay`를 부른다. 이걸 웹에서 그대로 옮기는 방법 세 가지를 비교:

| 방식 | 문제 |
|---|---|
| API Route 안에서 서버가 직접 폴링 후 SSE로 스트리밍 | Vercel 함수는 Fluid Compute에서도 실행시간 상한이 있고, 경기 하나가 3시간 넘게 가는데 그 시간 내내 함수 인스턴스를 붙잡아두는 건 과금·안정성 모두 나쁨. 다중 사용자가 각자 스트림을 열면 서버가 네이버에 N배 요청 (fan-out 안 됨) |
| WebSocket 상시 연결 | Vercel 서버리스 함수는 지속 연결을 못 받음 (별도 WS 인프라 필요 — 범위 밖) |
| **클라이언트가 직접 `/api/relay/[id]`를 주기적으로 fetch** (CLI와 동일 폴링 간격, 기본 10초) | 서버는 상태 없는 프록시로만 동작 → Vercel 서버리스와 가장 잘 맞음. CLI의 기존 폴링 간격 로직(`clampNum(5,300,10)`)을 그대로 재사용 가능 |

**결론: 클라이언트 폴링.** `useBroadcastStream` 훅이 `setInterval`로 `/api/relay/[id]?inning=` 없이 호출(최신 이닝) → 응답을 `Broadcast.ingestRelay()`에 먹여 React state 갱신. CLI의 `runLive`에 있던 로직(6폴마다 경기 상태 재확인, 3폴마다 게임 목록 갱신, 이닝 경계 gap 감지 후 backfill)을 훅 안에 그대로 이식.

동시접속자가 늘면 네이버 GW 호출도 그만큼 늘어난다는 점은 인지 필요 — 완화책은 §5.

## 4. 렌더링 — ANSI HUD를 웹으로 옮기는 매핑

| CLI 요소 (`render.js`) | 웹 대응 |
|---|---|
| `headerBar` (powerline 세그먼트) | flex row + 세그먼트별 `background`, `clip-path`로 화살표 모양 재현하거나 단순 배지로 대체(초기 draft는 단순화 권장) |
| `lineScore` (이닝별 R/H/E/B 그리드) | CSS Grid, 팀당 1행, 이닝 수만큼 열 |
| `diamondBlock` (다이아몬드 + B/S/O 램프) | SVG 다이아몬드(고정 4개 좌표) + 채워진/빈 원 뱃지 |
| `commentaryBox` (스크롤 가능 로그, follow/unfollow) | 가상 스크롤 없이 `overflow-y: auto` + "최신으로" 버튼 (follow=false 상태 그대로 이식) |
| 키보드 스크롤(↑↓/PageUp/Home/End) | 웹에서는 네이티브 스크롤에 위임 권장 — 커스텀 keypress 핸들러는 접근성 리스크만 키움. **원본 CLI 키바인딩을 웹에 1:1 이식하지 않는 것을 제안** |
| 팀 전환 숫자키(1-9), 좌우 화살표 | 게임 셀렉터 탭 UI로 대체 (클릭/터치 우선, 키보드는 보조) |
| `theme.js` 아이콘셋(nerd/emoji/ascii) | emoji만 채택(웹 폰트 의존 없이 크로스 플랫폼) — nerd font 테마는 드롭 |

**색상**: `ansi.js`의 256색 코드(`TEAM.home/away`, `CNT.ball/strike/out`)는 그대로 CSS 커스텀 프로퍼티로 매핑 가능 (`--team-home-color` 등). 라이트/다크 대응은 새로 설계 필요(CLI는 터미널 테마에 의존했으므로 웹에서는 자체 팔레트 필요 — `dataviz`/`artifact-design` 스킬의 팔레트 가이드 참고 권장).

## 5. 캐시 재설계

CLI의 `cache.js`는 "완료된 이닝은 불변"이라는 전제로 로컬 파일에 저장한다. 서버리스 환경에서 파일시스템은 인스턴스 간 공유되지 않으므로 그대로 쓸 수 없다. 옵션:

- **1안 (draft 범위에서 채택 권장): 캐시 없음.** 완료 이닝도 매번 네이버에서 재조회. 트래픽이 적을 때는 문제없고, 구현이 제일 단순.
- **2안: Vercel KV / Upstash Redis**로 완료 이닝 캐시 — `gameId:inning` 키, TTL 없음(불변이므로). 동시접속자가 늘어 네이버 GW rate limit이 실제 이슈가 되면 도입.
- **3안: 클라이언트 IndexedDB** — 브라우저별 로컬 캐시, 서버 부하와 무관. 재방문 시에만 유효해서 다중 사용자 캐시 공유 효과는 없음.

권장 순서: 1안으로 시작 → 트래픽 늘면 2안.

## 6. 미결정/리스크 (사용자 확인 필요한 지점)

1. **네이버 GW 이용약관**: CLI는 "개인 팬 프로젝트, 비공식" 전제로 단일 사용자가 쓰는 걸 가정한 트래픽. 웹으로 공개 배포하면 불특정 다수가 네이버 서버에 요청을 보내는 구조가 되어 리스크 프로파일이 달라짐 — 배포 전 확인 필요.
2. **Rate limit / 차단 대응**: 여러 사용자가 동시에 같은 경기를 보면 프록시 서버가 캐시 없이는 네이버에 사용자 수만큼 요청을 보냄. 최소한 "같은 gameId+inning 요청은 짧은 시간 내 서버 메모리에서 합치기(request coalescing)" 정도는 draft 이후 1차 개선으로 고려.
3. **경기 시작 대기(`waitForStart`), 다중 라이브 경기 선택 UI**는 CLI 대화형 프롬프트(`ask()`)를 그대로 옮길 수 없음 — 웹에서는 자동으로 폴링 재시도(대기) / 리스트에서 클릭 선택으로 자연 대체됨(이미 §4에 반영).
4. **날씨/프리뷰/기록(record) 패널**: `fetchWeather/fetchPreview/fetchRecord`는 그대로 재사용 가능한 순수 프록시 대상. draft 1차 스코프에는 넣지 않고 스코어보드+커멘터리만 먼저 만드는 걸 권장(범위 축소).

## 7. 1차 draft 스코프 제안

풀 기능(프리뷰/기록/테마/리플레이/멀티게임 전환)을 한 번에 옮기면 각 화면 재설계가 동시에 필요해 위험이 크다. 최소 스코프:

- [ ] `/api/games`, `/api/game/[id]`, `/api/relay/[id]` 프록시 3종
- [ ] 경기 목록 페이지 (라이브/예정/종료, `showList` 대응)
- [ ] 중계 페이지: 라인스코어 + 다이아몬드/카운트 + 커멘터리 피드 (폴링 기반)
- [ ] 리플레이 모드는 2차로 미룸 (배속 재생 타이머는 §3 폴링 훅과 다른 스케줄러가 필요 — 섞으면 훅이 비대해짐)
- [ ] 캐시 없음(§5 1안), 테마 없음(이모지 고정), 날씨/프리뷰/기록 패널 없음

이 스코프면 `broadcast.js` 재사용 + API 프록시 3개 + 컴포넌트 4개 정도로 실행 가능한 첫 버전이 나옴.
