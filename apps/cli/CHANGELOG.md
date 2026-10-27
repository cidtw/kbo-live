# Changelog

## 0.1.1 — 2026-07-13

### Quality / reliability
- Injectable HTTP client (`createApi`) with safe JSON parse, 5MB body cap, versioned User-Agent
- `--verbose` / `KBO_LIVE_DEBUG` stderr debug logs; critical paths stop swallowing errors silently
- `resolveTarget` no longer calls `process.exit` (returns `exitCode` for the CLI to handle)
- Shared `loadFullBroadcast` for `--report` with partial-inning warnings
- `config.replay` restored after replay via `finally`
- Public `Broadcast.absorbMeta` (replaces private `_absorbMeta` usage from runner)

### Structure
- `terminal.js` — alt-screen enter/leave/raw mode
- `input.js` — pure key→action maps for menu/spectate (+ KEYBINDINGS table)
- `game_loader.js`, `runner_meta.js`, `log.js`
- `renderToString` / `buildFrame` for offline TUI tests
- `util.gameIdToDate` helper

### Tests
- Offline-first suite: api, parseArgs, input, resolveTarget, render frames, broadcast gap
- Live network tests gated by `KBO_LIVE_LIVE_NET=1`
- `npm run check` syntax smoke

### Docs
- README keybindings and architecture notes updated
