# T04 coingecko-graceful — Pro unavailable, clean UI, no fake prices

Goal: CoinGecko Pro is paywalled — make `unavailable` intentional, not broken-looking.

Scope (`server/market.js`, `src/components/LiveReport.jsx`, `README.md`, `src/components/FeatureRoadmap.jsx`):
- Keep `Market.compare()` returning `status: unavailable + reason` when `COINGECKO_API_KEY` empty.
- Ensure UI renders explicit unavailable/unsupported (no spinners, no 500, no spot-price substitution).
- Update copy: "Historical USD comparison requires CoinGecko Pro — currently disabled".
- No free-price hack in this ticket (historical ≠ spot, per `plan.md §9`).

Acceptance:
- Jupiter swap tx → `unavailable` with reason, visually clean.
- `npm test` green.

Demo relevance: avoids awkward "why is price blank?" moment.

## Acceptance log (2026-10-22)
- Live report `538c5df8…`: `trade.status=unsupported` + honest reason (no 2-token Jupiter candidate), no 500.
- `LiveReport.jsx:263-265` renders `Trade comparison: <status>` + reason; `estimated` branch untouched.
- `FeatureRoadmap.jsx:33-34` already labels historical USD “PROVIDER REQUIRED”.
- Decision: no Pro key → keep `unavailable/unsupported`, no spot-price substitution (per plan.md §9). No code changes.
