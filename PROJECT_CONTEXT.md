# Kat's Pet Sitting Manager — Full Project Context
> This document is intended for AI assistants picking up work on this codebase. Read this fully before making any changes.

---

## 1. Project Overview

**Name:** Kat's Pet Sitting Manager (internally: `petsitting-manager`)
**Purpose:** A private, cloud-synced business management PWA for a solo pet sitter named Kat operating in Los Baños, Laguna, Philippines.
**Stack:** React 19 + Vite 8 + Firebase 12 (Firestore + Auth) + Vanilla CSS
**Deployment:** Vercel (Production) + GitHub (Source Control)
**Production Live URL:** `https://petsitting-manager.vercel.app`
**Production GitHub Repo:** `https://github.com/Aaron840588/kat-petsitting-crm`
**Demo Sandbox Live URL:** `https://pet-care-crm-demo.vercel.app`
**Demo Sandbox GitHub Repo:** `https://github.com/Aaron840588/pet-care-crm-demo`
**Maintainer / Author:** Aaron Tagapan (`aarontagapan@gmail.com` / GitHub: `Aaron840588`)

---

## 2. Infrastructure & Environments

### Firebase
- **Project ID:** `petsit-manager`
- **Auth Domain:** `petsit-manager.firebaseapp.com`
- **API Key:** `AIzaSyB4EPHJWKzQNrdI6FXkt860d3W0Z3d5nnY`
- **App ID:** `1:631159403990:web:2a720c8a8eb34d0187a077`
- **Auth:** Firebase Email/Password (single user — Kat only)
- **Database:** Firestore with `persistentLocalCache` (IndexedDB offline support)
- **Config file:** `src/firebase.js`

### Firestore Collections
| Collection | Purpose | Key Fields |
|---|---|---|
| `clients` | Client profiles | `name`, `phone`, `address`, `pets[]`, `gcash`, `notes` |
| `bookings` | Visit bookings | `clientId`, `date`, `service`, `days`, `extraPets`, `specialNeeds`, `distance`, `extraVisit`, `discounts{}`, `status` |
| `invoices` | Saved invoices | `clientId`, `toName`, `pets`, `gcash`, `lineItems[]`, `total`, `paid`, `tip`, `dateSaved` |
| `errands` | Errands & Pabili | `clientId`, `title`, `amount`, `items[]`, `status` (`pending`/`done`), `isBilled` |
| `reminders` | Sticky notes/tasks | `text`, `done` |
| `keys` | Client key tracker | Stored in SettingsView localStorage / Firestore (check KeysView) |
| `ownPets` | Kat's own pet care | `name`, `type`, `vaccinesUpdated`, `nextVaccineDate`, `medications[]` |
| `donations` | Stray care donations | `donorName`, `amount`, `date`, `notes` |

### Vercel Projects
- **Production CRM:** `petsitting-manager` → `https://petsitting-manager.vercel.app`
- **Demo Sandbox:** `pet-care-crm-demo` → `https://pet-care-crm-demo.vercel.app`

---

## 3. Project Structure

```
petsitting-manager/
├── public/
│   ├── invoice-bg.webp          # Background image used in invoice PNG export
│   ├── kathleen-gonzales.webp   # Memorial ribbon image asset (Dashboard)
│   ├── manifest.json            # Web App Manifest for Android PWA home screen installation
│   └── sw.js                    # Service Worker for PWA offline caching & push notifications
├── src/
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Root component — auth guard, routing, layout
│   ├── firebase.js              # Firebase init (Firestore + Auth)
│   ├── index.css                # All global styles + CSS variables (design system)
│   │
│   ├── store/
│   │   └── DataContext.jsx      # Global state — ALL Firestore CRUD & demo mode fallback
│   │
│   ├── components/
│   │   ├── Sidebar.jsx          # Desktop left sidebar navigation (viewport height constrained, smooth scrolling)
│   │   ├── BottomNav.jsx        # Mobile bottom navigation bar + More drawer modal
│   │   ├── Toast.jsx            # Toast notification system (useToast hook)
│   │   ├── ConfirmDialog.jsx    # Reusable modal confirmation dialog
│   │   ├── NumericInput.jsx     # Controlled numeric input (prevents NaN)
│   │   ├── PetBioModal.jsx      # Full pet profile modal with medications
│   │   └── ErrorBoundary.jsx    # Error boundary wrapping each view
│   │
│   ├── features/
│   │   ├── invoices/
│   │   │   └── InvoicePreviewCard.jsx  # Rendered invoice preview card (used for PNG export)
│   │   └── schedule/
│   │       └── ViewBookingModal.jsx   # Detailed visit breakdown modal
│   │
│   ├── utils/
│   │   ├── calculations.js      # calcLine(), calcDayTotal(), EXTRA_PET_RATE, newLineItem()
│   │   ├── dates.js             # todayLocalStr(), fmtDate(), fmtGcash(), dateSortValue()
│   │   ├── invoiceLogic.js      # groupImportedLineItems(), buildSingleDayInvoiceLines()
│   │   ├── scheduleLogic.js     # Schedule filtering/sorting helpers
│   │   ├── share.js             # shareImageFile(), downloadImage() (Web Share API)
│   │   └── icsExport.js         # .ics calendar export
│   │
│   └── views/
│       ├── LoginView.jsx            # Email/password login page
│       ├── DashboardView.jsx        # Home: today's visits, memorial ribbon, reminders, quick stats
│       ├── ClientsView.jsx          # Client management (CRUD + pet profiles + medications)
│       ├── ScheduleView.jsx         # Booking calendar + newest-first sorting + status dropdown select
│       ├── InvoiceView.jsx          # Invoice builder
│       ├── InvoiceRecordsView.jsx   # Saved invoice history
│       ├── EarningsView.jsx         # Revenue analytics + charts
│       ├── ErrandsView.jsx          # Errands & Pabili tracking
│       ├── KeysView.jsx             # Client key tracker
│       ├── OwnPetsView.jsx          # Kat's own pet care & stray donation logs
│       ├── ReportCardView.jsx       # Pet visit report card → PNG export
│       └── SettingsView.jsx         # Services config, GCash, data import/export
```

---

## 4. Design System & CSS Rules (`index.css`)

```css
--black:        #111111
--lime:         #d4e84a   /* primary brand green-yellow */
--lime-dark:    #7a9a20
--light:        #f5f5f0   /* page background */
--green:        #22c55e
--red:          #ef4444
--orange:       #f97316
--gray:         #888888
--font-body:    'Inter', sans-serif
--font-display: 'Playfair Display', serif
```

### Key UI Classes & Components
* `.badge`: `.b-active` (green), `.b-pending` (orange), `.b-tentative` (yellow dashed), `.b-done` (gray).
* `.status-select-wrapper` & `.status-select`: Custom styled status dropdown select for mobile cards & desktop tables. Touch-optimized (`34px` height, `touch-action: manipulation`).
* `.sidebar`: Constrained to `height: 100vh; max-height: 100vh; top: 0; bottom: 0; position: fixed;` with `.nav` scrolling (`overflow-y: auto`) to ensure bottom items (`Settings`, `Sign Out`, footer) are never cut off.

---

## 5. Data Flow & Demo Mode

* **Centralized Store:** Managed in `src/store/DataContext.jsx`.
* **Real-time Synchronization:** `onSnapshot()` listeners for all collections.
* **Demo Sandbox Mode:**
  * Controlled by `isDemo` flag.
  * In production repo (`kat-petsitting-crm`), `isDemo = import.meta.env.VITE_DEMO_MODE === 'true'` (defaults to `false`, connecting to live Firebase).
  * In public demo repo (`pet-care-crm-demo`), `isDemo = import.meta.env.VITE_DEMO_MODE !== 'false'` (defaults to `true`, using mock in-memory data).
  * Memorial ribbon card on Dashboard is hidden automatically when `isDemo` is `true`.
* **Offline Resilience:** Firestore `persistentLocalCache` + IndexedDB ensures full offline CRUD capabilities in areas with poor mobile signal.

---

## 6. Key Module Implementation Notes

### ScheduleView.jsx
* **Sorting Order:** Bookings are sorted **NEWEST (most recent start date) to OLDEST** via `dateSortValue(b.startDate) - dateSortValue(a.startDate)`.
* **Status Dropdown:** Replaced badge cycling with a styled `<select>` dropdown (`renderStatusSelect`). Updates status in Firestore on single selection change.
* **Calendar Export:** Download `.ics` calendar files via `icsExport.js`.

### DashboardView.jsx
* **Hero & Memorial:** Displays welcome header, active daily visits count, and the "In Loving Memory" tribute ribbon card (`public/kathleen-gonzales.webp`) when not in demo mode.
* **Stat Cards & Reminders:** Unpaid balances, upcoming visits, client count, and pending keys.

### InvoiceView.jsx & InvoicePreviewCard.jsx
* **Dual Invoice Tables:** Inline editing table in `InvoiceView.jsx` and PNG preview card `InvoicePreviewCard.jsx` must remain synchronized when updating table structures.
* **Errand Import:** Errand line items render with pastel yellow (`#F5F882`) background styling and auto-flag `isBilled: true` on invoice save.

---

## 7. Build & Deployment Commands

```powershell
# Local development server
npm run dev

# Production build test
npm run build

# Code linting
npm run lint

# Deploy script (PowerShell)
npm run build; if($?) { .\deploy.ps1 "commit message" }

# Manual Vercel production deploy
cmd /c "npx vercel --prod --yes"
```

---

*Last updated: August 2026. Maintained by Aaron Tagapan (`aarontagapan@gmail.com` / `Aaron840588`).*
