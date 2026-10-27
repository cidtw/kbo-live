# kbo-live (monorepo)

KBO 리그 실시간 문자중계 — 터미널 CLI와 웹 대시보드 (비공식 네이버 스포츠 데이터).

| 경로 | 내용 |
|---|---|
| [`apps/cli`](apps/cli) | npm 패키지 `kbo-live` (터미널 HUD). 사용법은 [apps/cli/README.md](apps/cli/README.md) |
| [`apps/web`](apps/web) | Next.js 웹 대시보드. [apps/web/README.md](apps/web/README.md) |
| `packages/` | 공유 코어 (예정) |

```bash
npm ci               # 루트에서 1회 (npm 11, Node >= 20.17)
npm start            # CLI
npm run web:dev      # 웹 (http://localhost:3000)
npm test && npm run check && npm run typecheck && npm run lint && npm run build
```

라이선스: [LICENSE](LICENSE) (MIT).
