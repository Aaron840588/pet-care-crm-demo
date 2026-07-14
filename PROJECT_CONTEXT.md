# Pet Care Operations CRM — Full Project Context
> This document is intended for AI assistants picking up work on this codebase. Read this fully before making any changes.

---

## 1. Project Overview

**Name:** Pet Care Operations CRM (internally: `petsitting-manager`)
**Purpose:** A private, cloud-synced business management PWA for a solo pet care operations business operating in the Philippines.
**Stack:** React 19 + Vite 8 + Firebase 12 (Firestore + Auth) + Vanilla CSS
**Deployment:** Vercel (production) + GitHub (source control)
**Live URL:** Deployed via Vercel — check Vercel dashboard for exact URL
**GitHub Repo:** `https://github.com/[REDACTED]/pet-care-crm`
**Local path:** `[REDACTED_LOCAL_PATH]`

---

## 2. Infrastructure

### Firebase
- **Project ID:** `[REDACTED_PROJECT_ID]`
- **Auth Domain:** `[REDACTED_AUTH_DOMAIN]`
- **API Key:** `[REDACTED_API_KEY]`
- **App ID:** `[REDACTED_APP_ID]`
- **Auth:** Firebase Email/Password (single user)
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

### Vercel
- Deploy command: `npm run build` → `dist/`
- Deploy script: `.\deploy.ps1 "commit message"` (PowerShell, in project root)
- This script: builds → deploys to Vercel (`npx vercel --prod --yes`) → commits and pushes to GitHub

### GitHub
- Repo: `https://github.com/[REDACTED]/pet-care-crm`
- Branch: `master`
- Auto-deploys via Vercel on push (or manual via deploy script)

---

## 3. Project Structure

```
petsitting-manager/
├── public/
│   ├── invoice-bg.webp       # Background image used in invoice PNG export
│   └── sw.js                 # Service Worker for PWA + push notifications
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component — auth guard, routing, layout
│   ├── firebase.js           # Firebase init (Firestore + Auth)
│   ├── index.css             # All global styles + CSS variables (design system)
│   │
│   ├── store/
│   │   └── DataContext.jsx   # Global state — ALL Firestore CRUD here
│   │
│   ├── components/
│   │   ├── Sidebar.jsx       # Desktop left sidebar navigation
│   │   ├── BottomNav.jsx     # Mobile bottom navigation bar
│   │   ├── Toast.jsx         # Toast notification system (useToast hook)
│   │   ├── ConfirmDialog.jsx # Reusable modal confirmation dialog
│   │   ├── NumericInput.jsx  # Controlled numeric input (prevents NaN)
│   │   ├── PetBioModal.jsx   # Full pet profile modal with medications
│   │   └── ErrorBoundary.jsx # Error boundary wrapping each view
│   │
│   ├── features/
│   │   ├── invoices/
│   │   │   └── InvoicePreviewCard.jsx  # The rendered invoice preview (used for PNG export)
│   │   └── schedule/
│   │       └── (schedule-related sub-components)
│   │
│   ├── utils/
│   │   ├── calculations.js   # calcLine(), calcDayTotal(), EXTRA_PET_RATE, newLineItem()
│   │   ├── dates.js          # todayLocalStr(), fmtDate(), fmtGcash(), dateSortValue()
│   │   ├── invoiceLogic.js   # groupImportedLineItems(), buildSingleDayInvoiceLines()
│   │   ├── scheduleLogic.js  # Schedule filtering/sorting helpers
│   │   ├── share.js          # shareImageFile(), downloadImage() (Web Share API)
│   │   └── icsExport.js      # .ics calendar export
│   │
│   └── views/
│       ├── LoginView.jsx         # Email/password login page
│       ├── DashboardView.jsx     # Home: today's visits, reminders, quick stats
│       ├── ClientsView.jsx       # Client management (CRUD + pet profiles + medications)
│       ├── ScheduleView.jsx      # Booking calendar + booking form with discounts
│       ├── InvoiceView.jsx       # Invoice builder (biggest file ~47KB)
│       ├── InvoiceRecordsView.jsx# Saved invoice history
│       ├── EarningsView.jsx      # Revenue analytics + charts
│       ├── ErrandsView.jsx       # Errands & Pabili tracking
│       ├── KeysView.jsx          # Client key tracker
│       ├── ReportCardView.jsx    # Pet visit report card → PNG export
│       └── SettingsView.jsx      # Services config, GCash, data import/export
```

---

## 4. Design System (CSS Variables in `index.css`)

```css
--black:      #111111
--lime:       #d4e84a   /* primary brand green-yellow */
--lime-dark:  #7a9a20
--light:      #f5f5f0   /* page background */
--green:      #22c55e
--red:        #ef4444
--orange:     #f97316
--gray:       #888888
--font-body:  'Inter', sans-serif
--font-display: 'Playfair Display', serif
```

Key utility classes: `.btn`, `.btn-lime`, `.btn-dark`, `.btn-ghost`, `.btn-danger`, `.card`, `.fg` (form group), `.form-row`, `.badge`

---

## 5. Data Flow & State Management

All Firestore data is managed centrally in `DataContext.jsx`:
- Provides `useData()` hook to every view
- Real-time listeners via `onSnapshot()` for: `bookings`, `clients`, `invoices`, `reminders`, `errands`
- `services` are stored in **localStorage** (not Firestore) — user-configurable service names/prices
- **Demo mode**: `VITE_DEMO_MODE=true` env var switches to in-memory mock data (no Firebase needed)
- **Offline support**: Firestore `persistentLocalCache` + IndexedDB = works offline, syncs on reconnect
- **Sync status**: `syncStatus` = `'online'` | `'offline'` | `'connecting'` — shown as pill in UI

---

## 6. Key Business Logic

### Services & Pricing
- Default services (editable in Settings): Basic Visit ₱200, Play & Visit ₱250, Twice-a-day Visit ₱350, Twice-a-day Play & Visit ₱450
- `EXTRA_PET_RATE = ₱50` per additional pet (constant in `calculations.js`)

### Invoice Line Items
Each line item has shape:
```js
{
  id: string,
  customName: string,
  subtitle: string,       // e.g. "(up to 2 pets)"
  days: number,
  note: string,           // e.g. "(April 12-14)"
  customRate: string,     // rate per day (empty string = no rate display)
  discountMode: 'none' | 'rate_flat' | 'rate_percent' | 'total_flat' | 'total_percent',
  discountValue: number,
  discountLabel: string,
  // Errand-specific fields:
  isErrand: boolean,      // flags this as an Errand/Pabili line
  amount: number,         // total errand amount (bypasses rate × days calc)
  items: [{title, note, amount}],  // sub-items shown inline below the header
  _errandId: string,      // links to the Firestore errand document
  _itemType: string,      // 'service' | 'extraPets' | 'specialNeeds' | 'distance' | 'extraVisit'
  _sourceDates: string[], // YYYY-MM-DD strings for date grouping
}
```

### calcLine() — `src/utils/calculations.js`
```js
// Special handling for Errands:
if (item.isErrand) {
  return { rate: '', baseAmount: item.amount, discountAmount: 0, finalAmount: item.amount, displayRate: '' };
}
// Normal line items: rate × days, with discount applied
```

### Errand Line Items in Invoice
- Errands import as a **single parent row** per errand (not one row per sub-item)
- Sub-items render **inline** inside the parent row's "Service" cell (same `inv-svc-sub` style as "up to 2 pets")
- Background color of ALL errand rows: **`#F5F882`** (pastel yellow)
- Days column: **empty** for errands
- Rate column: **empty** for errands
- Amount: shows the total errand amount (`e.amount`)
- Only **pending** (`status !== 'done'`) and **unbilled** (`!isBilled`) errands appear in the import list

### Invoice PNG Generation
- Uses `html-to-image` (`toPng()`)
- Temporarily forces exact pixel widths (640px) onto the DOM before capture
- Background image: `invoice-bg.webp` (fetched and inlined as base64)
- Defined in `InvoiceView.jsx` → `renderInvoicePng()`

### Report Card PNG Generation
- Uses `html-to-image` (`toPng()`)
- White card on lime/yellow background
- Defined in `ReportCardView.jsx` → `renderReportPng()`
- "Cared for by [sitter] 🐾" pill color: `#F5F882`

---

## 7. Module-by-Module Reference

### LoginView.jsx
- Firebase Email/Password auth
- Single hardcoded user (Kat)
- Redirects to Dashboard on login

### DashboardView.jsx
- Today's bookings summary
- Active reminders (CRUD)
- Quick stats: pending keys, unbilled errands, today's revenue
- Upcoming visit list

### ClientsView.jsx
- Full CRUD for clients
- Each client has: name, phone, address, GCash, notes, `pets[]`
- Each pet has: name, breed, photo (base64), medications[]
- Pet bio modal: `PetBioModal.jsx`
- Client autofill in Invoice: uses `clients` from `useData()`

### ScheduleView.jsx (~50KB)
- Calendar grid view of bookings
- Booking form with: service picker, date range, extra pets, special needs, distance charge, extra visit fee
- Per-component discount system (`discounts{}` object)
- Import bookings → Invoice (via `buildSingleDayInvoiceLines()`)
- ICS export support

### InvoiceView.jsx (~47KB)
- **Left panel:** form with client autofill, line item editor, paid/tip inputs
- **Right panel:** live invoice preview (same styling as final PNG)
- Two rendering contexts for the table: inline (right panel) AND `InvoicePreviewCard.jsx` (for PNG)
- **IMPORTANT:** The inline table in InvoiceView and the InvoicePreviewCard are SEPARATE — both must be updated when changing invoice table rendering
- Errand import: filters `errands` by `clientId`, `amount > 0`, `!isBilled`, `status !== 'done'`
- On save: calls `addInvoice()` + marks all errand line items as `isBilled: true`
- `Struck` component: renders strikethrough for original prices (gray `#aaa`, `font-size: 10px`)

### InvoicePreviewCard.jsx
- Used by InvoiceView for the right-panel live preview
- Also used standalone for PNG export rendering
- Contains its own `Struck` component (identical to InvoiceView's)

### InvoiceRecordsView.jsx
- List of saved invoices (sorted by `dateSaved`)
- Edit modal allows changing `dateSaved` so imported past invoices map to the correct month
- Edit modal with inline invoice preview (also must handle `isErrand`)
- Mobile card view + desktop table view

### ErrandsView.jsx
- Pending / Completed tabs (`status !== 'done'` vs `status === 'done'`)
- Each errand: title, clientId, items[] (title, note, amount), auto-calculated total
- Mark complete: `updateErrand(id, { status: 'done' })`
- Mark incomplete: `updateErrand(id, { status: 'pending' })`
- Billed status (`isBilled`) set automatically when saved to invoice

### KeysView.jsx
- Track client keys: received / returned
- Mobile-friendly with `flex-wrap` on action buttons (48px touch targets)

### ReportCardView.jsx
- Form: client, pet, visit date (free text, e.g. "April 12-14"), sitter name, photos (max 4), behavioral assessment, mood, tasks, observations, message
- Photos: up to 4, first = profile, rest = mood photos; reorderable via `<` `>` buttons
- Behavioral categories: Energy, Sociability, Appetite, Litter/Potty, Condition — all have "Other" option with custom text input
- Mood options: 8 preset + "Other" custom
- Tasks: Fed, Walked, Played, Potty Break, Groomed, Medicine, Other (custom) + auto-populated pet medications
- "Notable Observations" textarea → renders as bulleted list with `•`
- "Cared for by [sitter] 🐾" pill: background `#F5F882`
- PNG export: `html-to-image` at 640px width, 2x pixel ratio
- Header symbol: `♡` (not `✦` or `✨`)

### EarningsView.jsx
- Revenue charts from saved invoices
- Monthly breakdown, client breakdown
- Bar charts restricted in width via 'maxWidth' to prevent ugly stretching when only 1 month has data

### SettingsView.jsx
- Service name/price editor (saved to localStorage as `kats_services`)
- GCash number setting
- Data export (JSON) / import (JSON — replaces all Firestore data)
- Demo mode indicator

---

## 8. Navigation Structure

### Desktop (Sidebar)
Home → Clients → Schedule → 📄 Invoice Builder → 📋 Invoice Records → 📈 Earnings → 🐾 Report Card → 🛒 Errands → 🔑 Keys → ⚙️ Settings

### Mobile (Bottom Nav — 5 main tabs)
Home | Clients | Schedule | Earnings | Errands
(Others accessible via hamburger / "More" menu)

---

## 9. Important Known Patterns & Gotchas

1. **Two invoice tables:** `InvoiceView.jsx` has its own inline table (lines ~920–990) AND uses `InvoicePreviewCard.jsx`. When changing invoice rendering, **always update BOTH**.

2. **isErrand detection:** `const isErrand = li.isErrand || String(li.customName || '').toLowerCase().includes('errand')` — backward compat for older saved invoices that didn't have the flag.

3. **Services in localStorage:** `services` state is NOT in Firestore. It's saved to `localStorage` as `kats_services`. Export/import JSON includes services.

4. **calcLine() errand shortcut:** If `item.isErrand === true`, `calcLine()` returns `finalAmount = item.amount` directly, skipping `rate × days` calculation entirely.

5. **Errand filter for invoice import:**
   ```js
   errands.filter(e => e.clientId === data.clientId && e.amount > 0 && !e.isBilled && e.status !== 'done')
   ```

6. **PWA / Service Worker:** Registered at `/sw.js`. Sends daily morning notification. Aggressive caching — users need hard refresh after deploy.

7. **Deploy process (PowerShell):**
   ```powershell
   npm run build; if($?) { .\deploy.ps1 "commit message" }
   ```
   Never use `&&` in PowerShell (use `;` + `if($?)`).

8. **Demo mode:** Set `VITE_DEMO_MODE=true` in `.env.local`. All data is in-memory, Firebase not called.

9. **Offline persistence:** Firebase 12 uses `initializeFirestore()` with `persistentLocalCache`. Do NOT use `getFirestore()` — it will lose offline support.

10. **InvoiceRecordsView preview** also needs errand handling — it has its own mini table inside the edit modal.

---

## 10. Color Reference

| Usage | Color |
|---|---|
| Brand lime (buttons, accents) | `#d4e84a` |
| Errands & Pabili row background | `#F5F882` (pastel yellow) |
| "Cared for by Kat" pill | `#F5F882` |
| Strikethrough original price | `#aaa` (text) + `10px` font |
| Discount label | `#d06060` (red italic) |
| Page background | `#f5f5f0` |
| Card background | `#ffffff` |
| Invoice card background | `#fffef8` |

---

## 11. Key Files to Know Cold

| File | Why Important |
|---|---|
| `src/store/DataContext.jsx` | ALL Firestore CRUD — understand this first |
| `src/views/InvoiceView.jsx` | Biggest, most complex view |
| `src/utils/calculations.js` | Core billing math |
| `src/utils/invoiceLogic.js` | Import/grouping logic from bookings |
| `src/views/ReportCardView.jsx` | PNG generation logic |
| `src/features/invoices/InvoicePreviewCard.jsx` | Duplicate of invoice table (must stay in sync) |
| `src/index.css` | All styles — no Tailwind |

---

## 12. Environment Variables

| Variable | Location | Value |
|---|---|---|
| `VITE_DEMO_MODE` | `.env.local` | `true` for demo, omit for production |

Firebase credentials are hardcoded in `src/firebase.js` (not in env vars — intentional for this private single-user app).

---

## 13. Quick Reference Commands

```powershell
# Dev server
npm run dev

# Build
npm run build

# Build + Deploy to Vercel + Push to GitHub
npm run build; if($?) { .\deploy.ps1 "your commit message" }
```

---

*Last updated: April 14, 2026. Maintained by AI assistant (Antigravity / Google DeepMind) across ~5 days of development sessions.*
