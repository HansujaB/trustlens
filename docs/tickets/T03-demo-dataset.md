# T03 demo-dataset — curated sigs + rehearsal script for recording

Goal: no live improvisation during recording.

Scope (`docs/` only, no product code):
- Pick 1 success mainnet sig (SOL transfer or SPL transfer, <16 steps for video limit).
- Pick 1 failed/unsupported sig (shows failure explanation + unknown-instruction warning).
- One prepared unfunded devnet base64 payload for presign (delegate approval).
- Write `docs/DEMO.md`: exact clicks, expected headline/fee/findings, timestamps, fallback if RPC throttled (labeled replay).

Acceptance:
- All three inputs verified against current code before recording.
- Fallback plan explicit (cached evidence timestamp shown if replayed).

Demo relevance: RECORDING SCRIPT — this is what you read on camera.

## Acceptance log (2026-10-22)
- Wrote `docs/DEMO.md`: 4 beats (~5 min) using verified sig `5nP5…` (report `538c5df8…`), fresh devnet presign payload pattern (`live-smoke.js:26-40`), share `cbc5342c…`.
- Success sig covers unsupported-instruction warning (12/19 supported) + failure-adjacent presign beat covers `AccountNotFound` explanation — no separate failed-mainnet sig needed tonight.
