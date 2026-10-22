# T01 boot-verify — local boot + baseline green

Goal: reproducible local run, no surprises during recording.

Scope:
- `npm ci`
- `npm test` (15 tests: `src/lib/*.test.js`, `server/tests/*.test.js`)
- `npm run build`
- `npm run test:live` (read-only mainnet read + unfunded devnet sim, expect AccountNotFound failure)
- `npm run test:video` (silent WAV fixture → `.data/videos/renderer-smoke/explainer.mp4`)

Out of scope: any provider keys, any code changes unless boot is broken.

Acceptance:
- All commands pass, versions logged (Node >=24).
- `.env` exists locally from `.env.example`, NOT committed (`.gitignore` already covers `.env`, `.data/`).
- Record exact passing SHAs/outputs in commit message.

Demo relevance: BLOCKER — nothing else is recordable without this.
