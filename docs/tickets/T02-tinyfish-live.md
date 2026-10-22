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
