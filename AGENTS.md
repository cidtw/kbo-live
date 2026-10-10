# AGENTS.md — kbo-live

KBO 리그 실시간 문자중계 CLI(터미널 HUD, 비공식 네이버 스포츠 데이터) + `web/` Next.js 대시보드(중계·투수 저널·선수 프로필·데이터셋).
워크스페이스 공통 규칙: `D:\Dev\AGENTS.md`. 2026-10-10 `C:\Users\SGAEM\kbo-live`에서 이 위치로 이동.

## 실행

```
npm start                    # CLI. 전역 명령 kbo-live는 npm link로 이 폴더를 가리킴 (재연결: npm link)
npm run web:dev              # web/ Next.js 개발 서버 (3000)
```

`web/`은 `web/AGENTS.md` 규칙도 따른다 (Next.js 버전 주의 문구 포함).
`web/package-lock.json`이 `package.json`과 어긋나 있어 `npm ci`가 실패한다 (2026-10-10 확인). 의존성은 `npm install`로 설치하고, lock 갱신은 별도 커밋으로.

## 검증 (완료 선언 전 실행)

```
npm test                     # node --test
npm run check                # 주요 모듈 문법 검사
npm run build                # web/ 변경 시 (next build)
```

## 구조

- `bin/kbo-live.js` — CLI 진입점
- `src/` — api·broadcast·render·runner·overwork_cli 등
- `locales/` — ko/en 문자열
- `web/` — Next.js 앱 (`app/`, `components/`, `lib/`), Vercel 배포 (`vercel.json`)

## 금지

- 사용자 요청 없는 커밋/푸시
- 비밀 파일(.env, *.pem, 토큰) 커밋
- 네이버 스포츠에 과도한 폴링

## 참고

- 로컬 브랜치 `local/snapshot-2026-10-10`: 홈 폴더 시절의 9월 초 미커밋 작업(Vite 투구 시각화). 원격 main에 이후 버전이 들어가 있어 병합하지 않고 보존만 함 (푸시 안 함)
- 인수인계: `HANDOFF.md` (`handoff` 스킬)
