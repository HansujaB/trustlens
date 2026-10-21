# TrustLens — Solana transaction intelligence

React + Vite frontend for the Solana transaction explainer, investigator, and pre-signature review product. See [plan.md](plan.md) for architecture, backend contracts, milestones, and acceptance criteria.

## Run

```sh
npm install
npm run dev
npm run build
```

On this machine, if the npm shim is broken:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

## Implemented frontend

- TrustLens identity and responsive editorial landing page, updated for Solana.
- Three-mode workspace: transaction signature, unsigned base64 payload, public wallet address.
- Local base58 decoded-length checks, base64 encoding/size validation, and selected cluster.
- Clearly labeled fictional reports; arbitrary user inputs are never presented as analyzed.
- Selectable underlined glossary definitions and a step-through transfer explanation.
- Sample wallet activity with reversible likely-spam filtering.
- Keyboard-operable tabs, expandable evidence, navigation, FAQ, reduced-motion support.
- Capability roadmap covering live analysis, trade verification, wallet history, sharing, narration, and MP4 export.

## Not connected

There is no RPC, simulation backend, wallet connection, TinyFish integration, historical market feed, report persistence, TTS, or MP4 renderer in this frontend. Inputs stay in page memory and are not uploaded. No transactions are signed or sent. The step-through is not a narrated video. No 289-mainnet-transaction benchmark has been performed.

## Verification

```sh
node --test src/lib/inputValidation.test.js
npm run build
```

The validation tests cover format and byte-length boundaries only, not transaction validity or safety. Backend correctness and integration acceptance criteria are detailed in plan.md.
