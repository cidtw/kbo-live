# kbo-live web

kbo-live의 웹 대시보드(Next.js 16 App Router)입니다. 데이터 출처는 CLI와 같은 비공식 네이버 스포츠 API입니다.

## 구조

```
app/            페이지(game, journal, pitchers, player)와 API 라우트(app/api/*)
components/     UI 컴포넌트
lib/domain/     네이버 API 클라이언트·파서·혹사 지수 계산 등 도메인 로직
test/           lib/domain 단위 테스트 (vitest)
```

## 명령

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest run (lib/domain 직접 import)
npm run lint
npm run build
```

루트에서는 `npm run web:dev`, `npm run web:build`, `npm run test:web`으로 같은 명령을 실행할 수 있습니다.
Vercel 배포 설정은 루트 `vercel.json`(`npm install --prefix web`, `npm run build --prefix web`)을 따릅니다.

> 참고: CLI(`../src/*.js`)와 이 웹 앱(`lib/domain/*.ts`)에는 API 클라이언트·broadcast·util 등 같은 도메인 로직이 각각 구현되어 있습니다. 공통 패키지로 합치는 작업은 아직 하지 않았습니다.
