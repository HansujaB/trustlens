# TrustLens — Demo recording script (tonight)

Total: ~5 min. Stack: `npm run server` + `npm run dev` → http://127.0.0.1:5173.
Verified 2026-10-22. Fallback for every beat included.

## Setup (before hitting Record)

1. `npm run server` (port 3001), `npm run dev` (port 5173). Check `GET /api/health` → `{"status":"ok"}`.
2. `.env` has `TINYFISH_API_KEY` (local only, never on camera). Capabilities check:
   `curl -b cookies /api/session` → `tinyfish:true, historicalPrices:false, video:false`.
3. Have these three inputs ready in a text file:
   - **A. Success tx (mainnet):** `5nP5QNB2W7butQry6BjutpcQap35rAuvbKKs41mjnqBQt3H9iqMYr9Q4zJHDNPUgGFZXngFe1P3cG5aChDik23FP`
   - **B. Presign payload (devnet):** generate fresh: `node -e` snippet from `server/scripts/live-smoke.js:26-40` (new Keypair, 1-lamport transfer, base64). Generate 2 min before recording (blockhash goes stale; app discloses refresh).
   - **C. Share link:** publish live on camera (Beat 3), or reuse `/share/cbc5342cb45af51f3a3ab5edc10512f3c577ea01cf9ea0cc` if offline.

## Beat 1 — Executed transaction + live evidence (2 min)

1. Paste sig A, cluster `mainnet-beta` → Submit. Narrate job stages (queued → running → complete, ~11s).
2. Show: headline "5 supported transfer(s) explained.", exact fee `20000 lamports`, steps, 8 findings.
3. Open research drawer: `pAMMBay6…` → status `complete`, Helius excerpt, `exact_identifier_mention`. Read the disclaimer aloud: *"A page mention does not establish ownership, safety, or incident relevance."*
4. Show second identifier `pfeeUxB…` → `no_sources` — honest empty state.
5. Trade comparison → `unsupported` ("No unambiguous two-token candidate…"). Say: *"Historical USD needs CoinGecko Pro — disabled tonight, so it says so instead of inventing a price."*

Fallback: if RPC throttled, show cached report + `retrievedAt` timestamp, label as replay.

## Beat 2 — Presign review, no signing (1.5 min)

1. Switch to presign mode, cluster `devnet`, paste payload B (+ intent owner = payer, max SOL e.g. 500000000 lamports).
2. Show: decoded instructions, required signers, message digest, simulation → `failed: AccountNotFound` (fresh unfunded address — expected, say so).
3. Findings: outflow vs intent, blockhash treatment (`blockhashReplaced:true` disclosed). Stress: *"Nothing signed, nothing broadcast — simulation only."*

Fallback: payload older than ~1 min → blockhash refresh notice appears; generate a fresh one.

## Beat 3 — Share link (1 min)

1. On report A: Publish → copy `/share/:id` → open in incognito window (no session): headline + findings + evidence visible.
2. State disclosure line shown by API: *"Anyone with this link can view addresses, amounts, findings, source excerpts."*
3. (Optional) Revoke → incognito refresh fails. Presign reports: Publish rejected (expected).

## Beat 4 — Close (30s)

- Glossary term hover (e.g. `delegate`) → curated definition.
- Video button → clean "not configured" message (TTS off tonight); silent-pipeline proof exists (`test:video` MP4).
- Lines: *"Read-only review. No seed phrases, no signing, no broadcasting."*

## Do-not-show list

- Never paste recovery phrases/keys; presign payloads only.
- Never show `.env` or the TinyFish key on screen.
- Samples are labeled fixtures — don't present them as live analysis.
