# Pet Care Operations CRM — Portfolio Demo

A modern, offline-first, cloud-synced Progressive Web Application (PWA) designed for solo pet sitters and pet care service providers. This is a sanitized, fully isolated public portfolio demo copy. 

When running in Demo Mode, the application operates entirely within browser memory (in-memory local state and `localStorage` for configurations) without initializing Firebase, making network connections to Firestore, or exposing any production databases or real-world client records.

## Project Overview

Pet Care Operations CRM is a specialized business management dashboard for pet sitters to coordinate client communications, visiting schedules, pet profiles, errand check-offs, invoice generation, and custom report cards. The original production app integrates with Firebase Firestore for real-time sync and offline persistence; this demo is configured with a high-fidelity client-side sandbox to let visitors test-drive all operations with zero production database exposure.

## Key Features

- **📊 Dynamic Operations Dashboard**: Track today's visits, check off errands/tasks, monitor active system metrics, and view upcoming schedules at a glance.
- **👤 Fictional Client & Pet Profiles**: Store detailed pet bio notes, feeding times, veterinary schedules, and customer details entirely in memory.
- **📅 Interactive Schedule & Bookings**: Plan single-day or multi-day pet-sitting assignments with service assignments and distance trackers.
- **📝 Automated Invoice Builder**: Generate beautifully formatted invoices with custom service rates, automated discounts, and a "DEMO ONLY — DO NOT PAY" non-payable watermark.
- **🎨 Shareable Visit Report Cards**: Design high-quality summary cards containing visit reports to keep pet owners updated on their pets' well-being.
- **🔑 Key Handovers Tracker**: Keep a detailed audit of home keys (status: pending, received, none) ensuring security for client home entries.
- **📦 Data Export Sandbox**: Export your synthetic sandbox data as a structured JSON file at any time.

## Technology Stack

- **Frontend**: React 19, Vite 8, Lucide React (icons)
- **Styling**: Modern, responsive CSS with full Mobile and Desktop viewport adaptability
- **PDF/Image Generation**: HTML-to-Image for clean client updates and invoice exports
- **Build System**: ESLint for linting, Vite for super-fast bundling and PWA serving
- **Storage/Database**: Local browser React State and `localStorage` (Demo Mode) | Firebase Firestore (Production)

## Architecture Explanation

This application utilizes a structured provider-consumer context pattern (`DataContext.jsx`). In production, this context sets up live snapshot listeners with Firebase Firestore. In demo mode (`VITE_DEMO_MODE=true`), all cloud subscriptions are bypassed, and the initial state is populated with rich, obviously fictional synthetic datasets. Every creation, update, or deletion stays entirely inside browser memory and resets immediately upon page refresh, preventing any unauthorized connections or tracking.

## Screenshots

*(Placeholder section. Images will render once generated in host platforms)*
- **Dashboard View**: `verification-screens/desktop-dashboard.png`
- **Clients & Pets**: `qa/android-pwa-before/04-clients.png`
- **Invoice Records**: `qa/android-pwa-before/11-invoice-records.png`

## Demo-Mode Privacy & Security

- **Strict Network Isolation**: When `VITE_DEMO_MODE=true`, the Firebase SDK configuration is cleared, and no connections are established with the Firestore DB, Firebase Storage, or Auth.
- **Synthetic Data**: All names, contact details, Philippine mobile numbers, and personal notes are completely fictional (e.g., Demo Client A, Pepper Rescue Cat, Mochi, 0917-000-0000).
- **Payment Safety**: QR code payment creation is disabled and replaced by non-payable placeholders. Generated invoices are explicitly watermarked with **DEMO ONLY — DO NOT PAY**.
- **Local Sandbox Reset**: A visible **Reset Demo** button on the top banner allows you to clear custom services from local storage and restart with a clean sample dataset.
- **Notifications Disabled**: Browser service-worker notifications and push reminders are bypassed in demo mode.

---

## Local Setup & Installation

### Prerequisites
- **Node.js**: Version 24.x (configured in package.json engines)
- **npm** or another modern package manager

### Steps to Run

1. Clone the repository to your local machine.
2. Install the project dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root folder with the following contents:
   ```env
   VITE_DEMO_MODE=true
   ```
4. Run the local development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173` to interact with the demo sandbox.

### Production Build
To verify type-safety, linting, and optimize the bundle size, run:
```bash
npm run lint
npm run build
```

---

## Environment Variable Configuration (Vercel)

When deploying this project as a public demo on Vercel or similar platforms, configure the following environment variables in your deployment dashboard:

| Variable Name | Value | Purpose |
| --- | --- | --- |
| `VITE_DEMO_MODE` | `true` | Switches the application into a secure local sandbox |

---

## Disclaimer

This public portfolio copy uses strictly synthetic data and operates in a fully isolated browser sandbox. It is entirely separate from, and cannot read or write to, the production client database or any actual Firebase instances.
