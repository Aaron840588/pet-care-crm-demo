# Public Pet Care demo context

This repository is a public, synthetic portfolio sandbox. Private deployments, real clients, payment details, cloud login credentials and import tools do not belong here.

- Demo mode is enabled unless `VITE_DEMO_MODE=false` is explicitly configured.
- Demo records and service edits reset on refresh; do not initialize Firebase or register notifications in demo mode.
- The app supports clients/pets, visits, keys, errands, invoices, earnings and visit reports.
- Cloud mode is inherited optional code, requires explicit Firebase environment configuration, and is not a public demo feature.
- `firestore.rules` denies all access for this demo repository. Private deployments need separately reviewed project rules; never deploy these rules over a private project accidentally.
- Use synthetic fixtures in tests and screenshots. Do not commit browser exports, backups, raw audit logs, login scripts or production configuration.
- Before release run lint, Node tests, the browser suite, the public-safety check and the production build. Check the actual deployed URL afterward.
