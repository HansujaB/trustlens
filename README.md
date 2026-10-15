# TrustLens landing page

A standalone React + Vite landing page. The original Connext application in the parent workspace is unchanged.

## Run

```sh
cd trustlens
npm install
npm run dev
```

For a production bundle, run `npm run build`. Preview that bundle with `npm run preview`.

On this Windows machine the global npm shim points at a missing installation. If `npm` fails, invoke the installed CLI directly:

```powershell
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' install
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

## Components

- `Header`: desktop navigation and accessible mobile menu.
- `Hero`: editorial introduction and a composed sample report.
- `HowItWorks`: three illustrated steps.
- `EvidenceExplorer`: three selectable report perspectives with expandable source trails.
- `Principles`: research approach and limitations.
- `Pricing`: indicative plans and working preview dialogs.
- `FAQ`: keyboard-accessible disclosure elements.
- `InvestigationForm`: local URL/address validation and preview handoff.
- `PreviewDialog`: native modal dialog, Escape dismissal, focus restoration.
- `Footer`: navigation and brand treatment.
- `ui`: shared brand, section labels, links, and statuses.

`src/styles.css` owns the blue/white visual system, component styles, responsive layouts, and reduced-motion behavior. Lucide supplies icons. Instrument Serif and DM Sans load from Google Fonts with system fallbacks.

## Scope

This is the landing-page UI, not the investigation service. Inputs are handled locally and are not sent to research providers. Atlas Protocol and its findings are fictional. Paid plans are labeled as proposed; there is no checkout or billing integration. No TinyFish credits are consumed by the page.

The source report examples are deliberately not linked to fabricated external evidence. The expandable references explain their illustrative status.
