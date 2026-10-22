# T02 tinyfish-live — real Search/Fetch evidence (P0 gate)

Goal: P0 Definition of Done (`plan.md §14`): real TinyFish evidence in a report.

Scope (`server/research.js`, `server/service.js`, `src/components/LiveReport.jsx`):
- Use local `.env` `TINYFISH_API_KEY` (never commit/log full key).
- Explain a real mainnet tx containing a known mint (e.g. USDC `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`).
- Verify `research.status == complete|no_sources` (not `unavailable`), `evidence[].url/title/retrievedAt/excerpt/matchStatus`.
- Verify failure path: bad key / timeout → `unavailable`, report still readable.
- Verify 1h cache reuse (`cached:true` on repeat).

Out of scope: Agent escalation (`TINYFISH_AGENT_ENABLED` stays false), LLM glossary.

Acceptance:
- One `POST /api/transactions/explain` → `GET /api/reports/:id` with live evidence attached.
- Screenshots/IDs noted in commit message, key redacted.
- `npm test` still green (mocked providers untouched).

Demo relevance: CORE DEMO BEAT — open cited source, state what it proves / doesn't prove.

## Acceptance log (2026-10-22)
- Sig `5nP5…ChDik23FP` (mainnet-beta) → job `b91767da…` complete in ~11s → report `538c5df8…`.
- `capabilities.tinyfish:true`, `historicalPrices:false`, `video:false` (expected).
- `research[0] pAMMBay6…`: status `complete`, 2 evidence, `exact_identifier_mention`, helius docs, retrievedAt `2026-10-22T03:57:26Z`.
- `research[1] pfeeUxB…`: status `no_sources`, empty evidence (honest empty path works).
- Report readable with research partial: headline, 8 findings, `researchCoverage` disclaimer present.
- `trade.status` = unavailable (no CoinGecko key — see T04).
- No code changes required; key stayed in gitignored local `.env` only.
- TODO for full close: repeat-job cache check (`cached:true`) + bad-key `unavailable` path (5 min, do before recording).
