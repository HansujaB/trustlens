# T06 share-wallet-smoke — save/share/revoke + Phantom login smoke

Goal: prove guest → wallet → share journey works.

Scope (`server/auth.js`, `server/http.js`, `src/lib/WalletAuth.jsx`, `src/App.jsx` `/share/:id`):
- Guest explain works, no login.
- Phantom `signMessage` login → session rotation → saved reports list.
- Publish executed-tx report → immutable `/share/:id` opens in fresh session.
- Revoke share, delete report blocks video/share access.
- Confirm presign/wallet-history reports are NOT publishable (expected 422/403).

Acceptance:
- Real Phantom extension smoke (fixture tests don't cover crypto path — `plan.md §16`).
- Note wallet version + cluster in commit.

Demo relevance: closing beat — "here's the share link".

## Acceptance log (2026-10-22, API half)
- `POST /api/reports/538c5df8…/share {publish:true}` → share `cbc5342c…`, url `/share/cbc5342c…`.
- Anonymous `GET /api/shares/cbc5342c…` (no cookies) → full snapshot, headline "5 supported transfer(s) explained." — publish path proven without login.
- Still manual (needs browser + Phantom, do before recording): wallet `signMessage` login → save → revoke → presign publish rejection. See `docs/DEMO.md` Beat 3.
