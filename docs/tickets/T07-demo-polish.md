# T07 demo-polish — error states, mobile, keyboard, reduced-motion

Goal: recording doesn't embarrass us.

Scope (frontend only):
- RPC error / missing metadata / unsupported version states readable.
- Partial results: chain facts visible when research unavailable.
- Mobile layout, keyboard nav for glossary/tabs, `useScrollMotion.js` reduced-motion respected, no audio autoplay.
- Sample vs live labels distinct ("ILLUSTRATIVE FIXTURE · NOT YOUR INPUT").

Acceptance:
- Checklist in commit: 127.0.0.1:5173 desktop + mobile width, keyboard-only run, `npm run build` clean.

Demo relevance: final gate before hitting Record.

## Acceptance log (2026-10-22, static)
- Reduced-motion: `useScrollMotion.js:19` matchMedia gate + `styles.css:3099/3146` both preferences covered.
- Sample vs live: `ILLUSTRATIVE FIXTURE · NOT YOUR INPUT` + `NO LIVE CALLS` pills (`InvestigationForm.jsx:80-82`), hero marked illustrative.
- Keyboard: roving tabIndex + onKeyDown in workspace tabs + EvidenceExplorer tabs; aria labels on nav/report/hero.
- Mobile: viewport meta + 12 `@media` blocks; build green.
- No `<audio>` autoplay in app source. Still manual (5 min in browser): desktop + 390px width pass, keyboard-only run, error-state screenshots.
