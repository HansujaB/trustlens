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
