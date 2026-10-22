# Pet Care Operations — public demo

A React application for exploring pet-care scheduling, client records, invoices, visit reports and earnings. This repository is the public portfolio sandbox, using fictional records.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

Demo mode is the default. It does not initialize Firebase, register push notifications or persist edited records and service settings. Refreshing resets the session. Use fictional data only; invoice previews are not requests for payment. Setting `VITE_DEMO_MODE=false` enables the inherited Firebase integration and requires a separately configured environment; it is not needed for this demo.

## Validation

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

The browser suite covers desktop and mobile navigation, invoice creation/reset, service reset on refresh and absence of Firebase requests. It does not establish production readiness or validate every export format. The production build currently reports a large JavaScript chunk; further route splitting is a performance improvement to consider.

[Public demo](https://pet-care-crm-demo.vercel.app) · [Portfolio](https://aarontagapan.vercel.app)

The deployed demo can differ from a review branch. Project workflow design, AI-assisted implementation and testing are described in the portfolio case study.
