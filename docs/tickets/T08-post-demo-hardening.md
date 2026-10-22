# T08 post-demo-hardening — NOT tonight (explicitly deferred)

Goal: launch readiness after demo is recorded.

Scope:
- Retention/cleanup worker (expired sessions/jobs purge + policy doc).
- Ingress-aware rate limiting (`TRUST_PROXY` + `X-Forwarded-For` handling, `server/http.js`).
- Deployment backups + `DATA_DIR` persistence docs, archival RPC capacity notes.
- Optional: Neon Postgres migration design (async store, migrations, object storage, durable queue) — design only.

Do NOT start before T01–T07 + demo recording are done.

Acceptance: separate milestone, separate branch.
