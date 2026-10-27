# Pet Care Operations — public demo

A React application for exploring pet-care scheduling, client records, invoices, visit reports and earnings. This repository is the public portfolio sandbox, using fictional records.

## Run locally

Requires Node.js 24 (matching package.json and CI).

```sh
npm ci
npm run dev
```

Demo mode is the default. It does not initialize Firebase, register push notifications or persist edited records and service settings. Refreshing resets the session. Use fictional data only; invoice previews are not requests for payment. Setting `VITE_DEMO_MODE=false` enables the inherited Firebase integration and requires a separately configured environment; it is not needed for this demo.

## Validation

The October 27 release passed 16 Node tests and 16 desktop/mobile browser tests, lint, build, the public-source guard and the dependency audit. See `RELEASE_2026-10-27.md` and `RELEASE_NOTES.md` for publication scope.


```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

The browser suite runs against the production preview and covers desktop/mobile navigation, client/pet/booking/errand workflows, invoice/report PNG and backup JSON downloads, session reset and absence of Firebase/Gemini requests during the tested flows. Real-device printing, native sharing and private cloud mode require separate validation. The public bundle omits the Firebase SDK; its main JavaScript is approximately 210 KB before compression, down from 689 KB.

[Public demo](https://pet-care-crm-demo.vercel.app) · [Portfolio](https://aarontagapan.vercel.app)

The deployed demo can differ from a review branch. Project workflow design, AI-assisted implementation and testing are described in the portfolio case study.

## Public-source privacy

Private cloud import scripts, production configuration and historical screenshots were removed from the current source after the privacy audit. Previously committed credentials remain in Git history: revoke the exposed API key and change the exposed Firebase login password in their provider consoles. Removing files does not invalidate credentials or erase past commits. The Firebase web configuration is a public client identifier, but it is no longer hardcoded into this demo.

Never enter personal/client information into the public sandbox or import private backups. The included Firestore rules deny all reads and writes for an isolated demo project; they are not private production rules.
