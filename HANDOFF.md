# HANDOFF — kbo-live

최신 항목이 위. 새 항목은 `handoff` 스킬 형식으로 맨 위에 추가.

## 2026-10-10 — 워크스페이스 이동·원격 동기화

**한 일**
- 홈 폴더에서 `D:/Dev/projects/kbo-live`로 이동, 전역 `npm link` 재연결
- 원격 main(9/14~15 작업 21커밋)으로 동기화. 이전 로컬 미커밋 작업은 `local/snapshot-2026-10-10` 브랜치에 보존
- 검증: `npm test` 72 pass, `npm run check`, `npm run build` 성공

**남은 일**
- [ ] `web/package-lock.json` 재생성 (`npm ci` 실패 — three, @types/three, lucide-react, @dimforge/rapier3d-compat 누락)
- [ ] snapshot 브랜치에서 살릴 내용이 있는지 확인 (없으면 삭제)


> 아래 기록의 경로 `C:/Users/SGAEM/kbo-live`는 2026-10-10 `D:/Dev/projects/kbo-live`로 이동됨.

## kbo-live pitch viz (2026-09-05)

### 한 일

단계별 웹 투구 로케이션을 `C:\Users\SGAEM\kbo-live`에 붙임.

1. `src/pitch-location.js` — PTS 조인, 플레이트 통과 시각/높이(물리식), 궤적
2. `web/` Vite 앱 — 2D 존, Three.js 비행, 날짜/경기 선택
3. `/naver` 프록시, 10초 라이브 폴링, 840px 반응형

`crossPlateY`(0.7083)는 높이가 아니라 홈플레이트 반폭 상수. 높이는 `z(t)`.

### 검증

- `node --test` 56 pass
- 오늘 1회: 61구 전부 위치, 예: FF 141 km/h, z=2.04 ft, t=0.439s
- `web`: `tsc --noEmit`, `vite build`, `http://127.0.0.1:5174/` 200, 프록시 경기 목록 200

### 실행

```powershell
cd C:\Users\SGAEM\kbo-live\web
npm run dev    # http://127.0.0.1:5174
```

### 남은 일

- 브라우저에서 클릭→비행 육안 확인 (헤드리스 페이지 툴은 localhost 실패)
- `D:\Dev\projects\kbo-live` 이관 여부
- Claude 검수

### 블로커

없음. 개발 서버는 세션에서 5174로 켜 둔 상태일 수 있음.

_원본: `D:/Dev/handoff/archive/2026-Q3/2026-09-05_kbo-live-pitch-viz.md`_

---

## kbo-live 핫픽스 (2026-09-05)

프로젝트 위치: `C:\Users\SGAEM\kbo-live` (워크스페이스 `projects/` 밖)

### 한 일

1. **팀 약자** — 표시를 공식 2자리로. `LOT→LT`, `NCD→NC`. 검색은 옛 표기도 유지.
2. **구속 미계측** — 라이브 PTS가 `speed:"0"`으로 오면 예전엔 `0k`(Ok처럼 보임). 0/Ok/빈값은 숨기고, 같은 seq에 구속·구종이 나중에 채워지면 라인·통계를 갱신. 이닝이 넘어가면 직전 이닝을 다시 ingest.
3. **단위** — `k` → `km/h`. `--mph` 및 키 `v`로 `141 km/h · 88 mph` 병기.
4. **날씨** — open-meteo 자체 크롤(`fetchWeather`, 구장 좌표, `--fahrenheit`) 삭제. 헤더는 구장명만.
5. **Pitch Analysis** — 구속별 unpivot 대신 구종 행 × S/B/H/평균/범위. Tab에 `analysis` 패널 추가.

검증: `cd C:\Users\SGAEM\kbo-live; node --test` → 50 passed.

추가로: 이닝 전환 후 미완성 PTS 캐시 고정 방지(`shouldCache` + skipCache 재조회), `LT`/`LOT` 양방향 검색.

### 남은 일

- 프로젝트는 홈 디렉터리에 있음. `D:\Dev\projects\kbo-live`로 옮길지는 미결정.
- Grok 코딩 초안 → Claude 검수 권장 (`context/agent-routing.md`).
- 커밋/푸시 요청 없음.

### 블로커

없음.

_원본: `D:/Dev/handoff/archive/2026-Q3/2026-09-05_kbo-live-hotfix.md`_

---
