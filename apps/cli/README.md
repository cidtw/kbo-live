# kbo-live

**KBO 리그 실시간 문자중계 CLI.** 터미널 HUD로 투구·안타·득점·주자 상황을 실시간 중계합니다.
네이버 스포츠 문자중계 데이터(비공식) 기반 — **의존성 0** (Node 내장 모듈만).

[lol-live](https://github.com/Lucas20000903/lol-live)와 같은 프레임워크(캐시·폴링·TUI 코어)를 공유하는 자매 프로젝트입니다.

## 실행

```bash
node bin/kbo-live.js              # 오늘 라이브 경기 자동 탐색 → 문자중계
node bin/kbo-live.js 롯데         # 오늘 롯데 경기 (경기 전이면 시작까지 대기)
node bin/kbo-live.js --list       # 오늘 경기 목록 (라이브/예정/종료)
node bin/kbo-live.js --replay 20260707HTLT02026   # 종료 경기 리플레이
node bin/kbo-live.js --report --game-id 20260707HTLT02026
```

## 사용법

```
kbo-live                     오늘 라이브 경기 자동 탐색 → 문자중계 시작
kbo-live <팀명|팀코드>        오늘 해당 팀 경기 중계 (예: 롯데 / LT / kia)
kbo-live --list [--date 날짜] 경기 목록
kbo-live --game-id <id>      특정 경기 중계
kbo-live --replay <gameId>   종료된 경기를 처음부터 리플레이
kbo-live --report …          마크다운 경기 보고서(투구 분석 포함) 내보내기
```

### 옵션

| 옵션 | 설명 |
|------|------|
| `--date <YYYY-MM-DD\|MMDD>` | 대상 날짜 (기본 오늘, KST) |
| `--locale <hl>` | 표시 언어 (기본 `ko-KR`; 중계 본문은 한국어 원문) |
| `--interval <sec>` | 라이브 폴링 간격 (기본 10, 5~300 클램프) |
| `--speed <n>` | 리플레이 배속 (기본 1 ≈ 투구당 0.65초) |
| `--no-history` | 접속 시 지난 이닝 복원 생략 (빠른 시작) |
| `--no-pitches` | 투구 단위(1구 볼/스트라이크) 라인 숨김 — 결과 중심 중계 |
| `--no-cache` | 완료 이닝 로컬 캐시 비활성화 |
| `--no-gui` | 스코어보드 없이 로그만 (파이프/기록용) |
| `--report` | 경기 보고서 마크다운 내보내기 |
| `--verbose` / `-v` | 디버그 로그 stderr (`KBO_LIVE_DEBUG=1` 과 동일) |
| `--nerd \| --emoji \| --ascii` | 아이콘 테마 (기본 `nerd` = Nerd Font 필요) |

### 조작 (GUI)

| 모드 | 키 | 동작 |
|------|-----|------|
| 공통 | `q` / `Ctrl+C` | 종료 |
| 메뉴 | `↑↓` / `k` `j` | 경기 선택 |
| 메뉴 | `←→` / `h` `l` | 날짜 ±1일 |
| 메뉴 | `d` | 날짜 직접 입력 |
| 메뉴 | `Enter` | 중계 시작 |
| 메뉴 | `r` | 종료 경기 리플레이 |
| 중계 | `↑↓` / `k` `j` | 스크롤 |
| 중계 | `PageUp`/`PageDn` · `b`/`Space` | 페이지 스크롤 |
| 중계 | `g` / `G` | 맨 위 / 최신 follow |
| 중계 | `1`–`9` | 게임 바 순번 전환 |
| 중계 | `←` `→` | 인접 경기 전환 |
| 중계 | `p` | 전력분석 패널 |
| 중계 | `Tab` | 경기기록 패널 순환 |
| 중계 | `e` | 마크다운 리포트 내보내기 |
| 중계 | `m` / `Esc` | 메뉴로 돌아가기 |

키 매핑 정본: `src/input.js` (`KEYBINDINGS`).

## 화면 구성

```
 KBO리그 · KIA VS 롯데 · 사직 · 5회말 · ● LIVE

        1  2  3  4  5  6  7  8  9   R  H  E  B
 HT     1  0  0  0  0  ·  ·  ·  ·   1  3  1  1
 LT     4  1  3  1  0  ·  ·  ·  ·   9 12  0  4

     ◇        B ●●○     투수 김시훈
   ◇   ◇      S ●○      타자 레이예스 오늘 4-4 시즌 .348
     ·        O ○○

╭─ 문자중계 ──────────────────────────────────╮
│ [ 5초] 💥  김규성 : 우중간 1루타             │
│ [ 5말] 🏠  3루주자 황성빈 : 홈인 (1:5)       │
╰─────────────────────────────────────────────╯
```

- 이닝 라인스코어(R/H/E/B), 주자 다이아몬드, B/S/O 카운트, 현재 투수/타자
- 라이브 도중 접속해도 1회부터 전체 기록을 자동 복원
- 득점 순간엔 라인 끝에 스코어 태그 `(원정:홈)` 표시
- 대체 화면 버퍼 사용 — 종료 후 스크롤백을 더럽히지 않음
- 리플레이는 스포일러 방지: 라인스코어를 이벤트에서 재구성 (최종 점수 미노출)

> Nerd Font 글리프가 □ 로 보이면 `--emoji` 또는 `--ascii` 를 쓰세요.

## 로컬 캐시

완료된 이닝의 문자중계(불변 데이터)는 로컬에 캐시됩니다. 같은 경기를 다시
리플레이하거나 재접속 후 기록을 복원할 때 네트워크 없이 즉시 동작합니다.
기본 활성화, `--no-cache` 로 끔. 최근 접근 20경기만 보관(LRU 자동 정리).

- macOS: `~/Library/Caches/kbo-live`
- Linux: `$XDG_CACHE_HOME/kbo-live` (기본 `~/.cache/kbo-live`)
- Windows: `%LOCALAPPDATA%\kbo-live\Cache`

`KBO_LIVE_CACHE_DIR` 환경변수로 위치 재정의 가능.

## 데이터 출처와 고지

이 도구는 **비공식 팬 프로젝트**입니다. KBO, 네이버, CJ ENM(TVING) 과 무관하며
후원·보증 관계가 없습니다. 네이버 스포츠 웹 문자중계 페이지가 사용하는
비공개 API 를 이용하므로 예고 없이 변경되거나 중단될 수 있습니다.
경기 기록 등 데이터의 권리는 KBO 및 해당 권리자에게 있습니다.
**개인 시청 용도로만 사용하세요** (상업적 이용·재배포 금지). 폴링 간격은
서버에 부담을 주지 않도록 최소 5초로 강제됩니다.

## 개발

```bash
npm test              # 오프라인 기본 (픽스처 + 목 HTTP)
npm run check         # 구문 검사
KBO_LIVE_LIVE_NET=1 npm test   # 실네트워크 스모크(선택)
```

구조:

```
bin/kbo-live.js
src/
  cli.js           인자 · 모드 루프
  input.js         키 → action (순수)
  terminal.js      대체 화면 / raw mode
  runner.js        resolveTarget · runLive · runReplay
  game_loader.js   전체 이닝 로드 (--report)
  api.js           createApi({ get }) · Naver GW
  broadcast.js     seqno 커서 도메인
  render.js        TUI (renderToString 테스트 가능)
  cache.js · report.js · config.js · log.js · util · ansi · theme · i18n
```

`util`/`ansi`/`theme`/`i18n` 은 lol-live 와 공유하는 스포츠 무관 코어입니다.

## License

MIT
