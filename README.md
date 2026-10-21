# TrustLens — Solana transaction intelligence

React/Vite frontend and Node 24 backend for executed-transaction explanations, unsigned transaction simulation, wallet history, TinyFish evidence, glossary research, and narrated MP4 generation. See [plan.md](plan.md) for the product and business plan and [docs/API.md](docs/API.md) for endpoints.

## Run locally

Requires Node **24+** (built-in SQLite), npm, and internet access to configured providers.

```sh
npm ci
```

Copy `.env.example` to `.env`. Keep secrets server-side. In two terminals:

```sh
npm run server
npm run dev
```

Open **http://127.0.0.1:5173**. Vite proxies `/api` to port 3001. `APP_ORIGIN` must match the browser origin exactly; if you change the UI port or hostname, update it. Guest analysis needs no wallet. Wallet sign-in requests only an authentication-message signature.

For a built frontend, run `npm run build` then `npm start`, and set `APP_ORIGIN` to the public API/UI origin. Production requires `NODE_ENV=production`, an HTTPS reverse proxy, and a persistent private `DATA_DIR`. The API serves `dist` and the share-page fallback. Use a single server process; the in-memory job queue is not a distributed worker system.

On Windows with a broken npm shim, use `node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run server` (or the corresponding script).

## Configuration

| Integration               | Variables                                                                | Without credentials                                           |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Solana                    | `SOLANA_MAINNET_RPC_URL`, `SOLANA_DEVNET_RPC_URL`                        | Public RPC defaults; provider throttling/history limits apply |
| TinyFish Search/Fetch     | `TINYFISH_API_KEY`                                                       | On-chain reports still work; research is unavailable          |
| Optional TinyFish agent   | Above + `TINYFISH_AGENT_ENABLED=true`                                    | Escalation disabled                                           |
| New glossary definitions  | `LLM_URL`, `LLM_API_KEY`, `LLM_MODEL`, TinyFish key                      | Curated definitions still work                                |
| Historical USD comparison | `COINGECKO_API_KEY` (Pro)                                                | Explicit unavailable/unsupported result                       |
| Narrated videos           | `VIDEO_ENABLED=true`, `TTS_URL`, `TTS_API_KEY`, `TTS_MODEL`, `TTS_VOICE` | Video requests return configuration error                     |
| Glossary human review     | `GLOSSARY_ADMIN_KEY`                                                     | Admin endpoints denied                                        |

LLM and TTS URLs are **full** OpenAI-compatible chat/completions and audio/speech endpoints. They are operator configuration, never user-supplied URLs. TTS must return WAV. On first render Remotion downloads Chrome Headless Shell; install the renderer's OS dependencies in deployment. Rendering uses one Chromium worker and temporary per-video audio. Check Remotion licensing for your intended commercial use before launch.

## Implemented behavior and boundaries

- Lossless RPC JSON parsing and integer-string amounts. SOL, legacy SPL transfers/approvals/revocations/authority changes/account closures, associated token account creation, and compute budget instructions. Unknown instructions remain visible. Token-2022 extensions and durable nonce payloads are not decoded.
- Legacy/v0 unsigned deserialization, verified lookup-table owner, payload digest, read-only simulation, simulated inner instructions, stale-blockhash disclosure, and deterministic findings. Existing signatures are rejected. No broadcast RPC method exists.
- Conservative Jupiter two-token net-balance candidates with mapped wrapped SOL/USDC historical prices. This is an **estimated USD value comparison**, not a verified executable quote, universal swap decoder, or exact slippage calculation. Unsupported routes are labeled.
- Paginated history referencing the queried address. Promotional incoming transactions may be marked likely spam; all rows remain available. Current token-account discovery is exposed separately; closed-account and full indexed wallet coverage require an indexer.
- SQLite reports, guest sessions, domain-bound one-use wallet login, ownership checks, CSRF protection, quotas, bounded jobs, cancellation, saved reports, watchlists and preferences. Watchlists are saved addresses, not scheduled monitoring.
- Explicit immutable public sharing for executed transaction reports only, with revocation. Wallet histories and unsigned payload reports cannot be published. Report deletion revokes its shares and blocks attached video access.
- TinyFish allowlisted source collection, exact-address excerpts, retrieval timestamps, cross-user source caching, and optional bounded Web Agent navigation. A page mention does not establish ownership, incident relevance, or safety.
- Thirty curated glossary entries plus aliases; source-backed generation is cached as **AI-written, not human-reviewed** until admin approval. Sensitive missing permission terms do not generate. Only selected terms are interactive.
- Remotion animated scenes, captions, WAV narration, authenticated playback with byte ranges, transcript metadata, and MP4 download. Maximum 16 report steps and five minutes; longer/unsupported reports remain readable as text.

Raw unsigned payloads are processed in memory, not stored in reports. RPC receives them for simulation. Selected public mint/program identifiers go to TinyFish. Report text goes to TTS only on video request. New-term source excerpts go to the configured LLM. SQLite and media contain public-chain information linked to user sessions: keep the data directory private and back it up deliberately. Avoid request-body logging at the reverse proxy.

## Verification

```sh
npm test
npm run build
npm run test:live
npm run test:video
```

`npm test` uses deterministic fixtures and mocked providers, including a real local HTTP server. `test:live` performs read-only mainnet retrieval and an unsigned devnet simulation using a fresh **unfunded** test address; an execution failure is expected. It never funds, signs, or broadcasts. `test:video` runs the actual MP4 renderer with a **synthetic silent WAV fixture**, not live TTS, and writes `.data/videos/renderer-smoke/explainer.mp4`. It may download a browser.

Live TinyFish, LLM, paid historical data, and spoken TTS need credentials and separate acceptance checks. No 289-mainnet-transaction benchmark has been performed. Test results and remaining rollout work are recorded in plan.md.
