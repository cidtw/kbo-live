# AGENTS.md — kbo-live

KBO 리그 실시간 문자중계 CLI(터미널 HUD, 비공식 네이버 스포츠 데이터) + `apps/web/` Next.js 대시보드(중계·투수 저널·선수 프로필·데이터셋).
워크스페이스 공통 규칙: `D:\Dev\AGENTS.md`. 2026-10-10 `C:\Users\SGAEM\kbo-live`에서 이 위치로 이동.

## 실행

```
npm ci                       # 루트에서 1회 (npm workspaces, lock은 루트 package-lock.json 하나)
npm start                    # CLI (apps/cli). 전역 kbo-live 재연결: cd apps/cli && npm link
npm run web:dev              # apps/web Next.js 개발 서버 (3000)
```

`apps/web/`은 `apps/web/AGENTS.md` 규칙도 따른다 (Next.js 버전 주의 문구 포함).
의존성 추가는 `npm install <pkg> -w kbo-live` 또는 `-w web`. 워크스페이스별 lock 파일은 두지 않는다.

## 검증 (완료 선언 전 실행)

```
npm test                     # 전 워크스페이스 (CLI node --test + web vitest)
npm run check                # CLI 전체 문법 검사
npm run typecheck            # web tsc --noEmit
npm run lint                 # web eslint
npm run build                # web next build
```

## 구조

- `apps/cli/` — npm 배포 패키지 `kbo-live`
  - `bin/kbo-live.js` 진입점, `src/` api·broadcast·render·runner·overwork_cli 등, `locales/`, `test/`, `scripts/`
- `apps/web/` — Next.js 앱 (`app/`, `components/`, `lib/`, `test/`). Vercel 미배포 (배포 시 Root Directory = `apps/web`)
- `packages/` — 공유 코어 자리 (3단계에서 추가 예정)

## 금지

- 사용자 요청 없는 커밋/푸시
- 비밀 파일(.env, *.pem, 토큰) 커밋
- 네이버 스포츠에 과도한 폴링

## 참고

- 로컬 브랜치 `local/snapshot-2026-10-10`: 홈 폴더 시절의 9월 초 미커밋 작업(Vite 투구 시각화). 원격 main에 이후 버전이 들어가 있어 병합하지 않고 보존만 함 (푸시 안 함)
- 인수인계: `HANDOFF.md` (`handoff` 스킬)
