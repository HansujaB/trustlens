# TrustLens API

All endpoints use JSON except MP4 streaming. Errors have `{error:{code,message,requestId}}`. Inputs are schema-validated. Exact on-chain quantities are decimal integer strings; formatted quantities are strings, while historical market estimates are floating point and labeled approximate.

## Session and request rules

Call `GET /api/session` first and retain its HttpOnly session cookie. Send its `csrf` value as `X-CSRF-Token`, the exact configured `Origin`, and `Content-Type: application/json` on writes. Cookies use SameSite=Strict and Secure in production. There is no cross-origin CORS API or developer API key product yet. Browser requests use the same-origin Vite proxy or the built API-hosted UI.

| Endpoint                          | Purpose                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `GET /api/health`                 | Process liveness, not provider readiness                                         |
| `GET /api/session`                | Anonymous/authenticated session, CSRF, usage, configured capabilities            |
| `POST /api/auth/challenge`        | `{address}`; five-minute login message                                           |
| `POST /api/auth/verify`           | `{signature}`; base58 Ed25519 signature of exact challenge bytes                 |
| `POST /api/auth/logout`           | Revoke session and create a new anonymous session                                |
| `POST /api/analyses`              | Queue one input described below; returns 202 and job ID                          |
| `GET /api/jobs/:id`               | Owner-only stage/status/result/error                                             |
| `DELETE /api/jobs/:id`            | Cancel queued/running work; completed work is unchanged                          |
| `GET /api/reports`                | Up to 100 recent reports belonging to current owner                              |
| `GET /api/reports/:id`            | Private report                                                                   |
| `DELETE /api/reports/:id`         | Remove report and revoke its public shares                                       |
| `POST /api/reports/:id/save`      | Mark a report saved; wallet login required                                       |
| `POST /api/reports/:id/share`     | `{publish:true}`; executed transactions only                                     |
| `GET /api/shares/:id`             | Public immutable snapshot; no authentication                                     |
| `DELETE /api/shares/:id`          | Owner revokes link                                                               |
| `POST /api/reports/:id/video`     | Queue narrated MP4, provider configuration required                              |
| `GET /api/videos/:id`             | Owner-only transcript and duration metadata                                      |
| `GET /api/videos/:id/play`        | Owner-only MP4 with byte-range playback                                          |
| `GET /api/videos/:id/download`    | Owner-only attachment download                                                   |
| `GET /api/glossary`               | Curated and human-approved definitions                                           |
| `POST /api/glossary/lookup`       | `{term}`; cached or researched definition with review state                      |
| `GET /api/admin/glossary`         | Pending generated definitions; admin Bearer secret required                      |
| `POST /api/admin/glossary/review` | `{id,status:"approved"\|"retired"}`; admin Bearer + session/CSRF                 |
| `POST /api/research/agent`        | `{identifier,url}`; optional curated-domain agent job                            |
| `POST /api/wallet/token-accounts` | `{address,cluster}`; current token accounts, no closed-account discovery         |
| `GET/POST /api/watchlist`         | Logged-in saved addresses; POST `{address,cluster,label}`                        |
| `DELETE /api/watchlist/:id`       | Delete owned saved address                                                       |
| `GET/PUT /api/preferences`        | Logged-in preferences; PUT `{hideLikelySpam,glossaryMode:"beginner"\|"minimal"}` |

Watchlist/preferences have backend endpoints; the current UI focuses on analysis, sign-in, report saving/sharing, glossary and video. Watchlists do not initiate monitoring. Sensitive admin operations are intended for an operator interface, not exposing the admin key in browser assets.

## Analysis inputs

```json
{
  "kind": "transaction",
  "signature": "BASE58_SIGNATURE",
  "cluster": "mainnet-beta"
}
```

```json
{
  "kind": "presign",
  "payload": "CANONICAL_BASE64_UNSIGNED_TRANSACTION",
  "cluster": "devnet",
  "intent": { "owner": "PUBLIC_ADDRESS", "maxSolLamports": "500000000" }
}
```

```json
{
  "kind": "wallet",
  "address": "PUBLIC_ADDRESS",
  "cluster": "mainnet-beta",
  "limit": 10,
  "before": "OPTIONAL_BASE58_CURSOR"
}
```

`cluster` defaults to mainnet-beta. Wallet limit is 1–20. Omit `before` for the first page. The optional intent check compares only decoded direct SOL transfers from the stated owner; it does not infer intent from free text or model arbitrary swap limits. A report is bound to the submitted message digest; changing the payload requires a new review.

Jobs move queued → running → complete/failed/cancelled. Completion returns `result.reportId` or `result.videoId`. Running work is aborted when cancelled; an already-dispatched provider call may still be billed. Restarted unfinished jobs are marked failed and must be resubmitted. The queue has two active jobs, 20 total slots, and one active video renderer.

## Storage and deployment

SQLite has two physical tables: `records(kind,id,owner,data,updated)` and `usage(subject,day,category,count)`. Record kinds are session, challenge, owner_alias, job, report, share, research, glossary, glossary_revision, video, watchlist, preferences. Session lookup uses a SHA-256 hash of the random cookie token. Owner identifiers are guest IDs or public wallet addresses. There are no passwords, API keys, private wallet keys, or persisted login signatures in these tables.

Reports retain decoded instruction data, public account addresses, exact deltas, logs, simulation observations, findings, source excerpts and explanation. The complete serialized unsigned transaction is not persisted. Media binaries live on local disk; video records hold their path, transcript and duration. Current data retention is explicit/manual; expired sessions are rejected but not automatically purged. Add a retention worker and storage budget before a public launch.

Neon migration is a code change, not a connection-string toggle: replace synchronous SQLite operations with an asynchronous Postgres store, add migrations and constraints, make quotas/owner migration transactional, and externalize durable jobs before multiple API instances. Use object storage for MP4/WAV files. Keep Chromium rendering in a long-running worker. Postgres does not replace a queue or media storage.

The current IP limiter uses the socket address and deliberately ignores untrusted forwarded headers. Behind a proxy it groups traffic by proxy address. Configure trusted-proxy handling or enforce per-client quotas at your ingress before public scale; do not blindly trust arbitrary `X-Forwarded-For` headers.
