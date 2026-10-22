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
