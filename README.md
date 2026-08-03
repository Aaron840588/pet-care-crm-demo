# 🐾 Kat's Pet Sitting Manager (CRM & PWA)

> A high-performance, private, cloud-synced Business Management PWA designed for a solo pet sitter operating in the Philippines. Built for offline resilience, real-time Firebase sync, and seamless Android Chrome home screen PWA usage.

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://petsitting-manager.vercel.app)
[![Demo Sandbox](https://img.shields.io/badge/Demo_Sandbox-Active-blue?logo=vercel)](https://pet-care-crm-demo.vercel.app)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase)](https://firebase.google.com/)

---

## 🚀 Live Applications & Repositories

| Environment | Live URL | GitHub Repository | Vercel Project |
|---|---|---|---|
| **Production CRM** | [petsitting-manager.vercel.app](https://petsitting-manager.vercel.app) | [`Aaron840588/kat-petsitting-crm`](https://github.com/Aaron840588/kat-petsitting-crm) | `petsitting-manager` |
| **Public Demo Sandbox** | [pet-care-crm-demo.vercel.app](https://pet-care-crm-demo.vercel.app) | [`Aaron840588/pet-care-crm-demo`](https://github.com/Aaron840588/pet-care-crm-demo) | `pet-care-crm-demo` |

---

## ✨ Feature Overview

### 🏠 Dashboard & Memorial
* **Today's Sitting Schedule:** Instant view of visits scheduled for today with session markers (AM, PM, 2x).
* **Memorial Ribbon:** Features an "In Loving Memory" tribute card (*hidden automatically in Demo mode*).
* **Active Reminders:** Quick CRUD task list for medication and daily reminders.
* **Key Stats:** Registered clients, queued upcoming visits, pending key collections, and total unpaid balance.

### 📅 Booking Schedule
* **Newest-to-Oldest Sorting:** Most recent and upcoming bookings displayed at the top.
* **Status Dropdown Select:** Direct single-click status updates (**Active**, **Upcoming**, **Needs confirmation**, **Done**) styled with responsive badge colors.
* **Multi-Day & Per-Day Services:** Custom rate and visit schedule breakdown with individual daily discounts.
* **Calendar Export:** Instant `.ics` calendar export for Google Calendar, Apple Calendar, and Outlook.

### 👥 Client & Pet Profile Management
* **Client Records:** Contact numbers, complete addresses, GCash accounts, and custom notes.
* **Pet Profiles:** Species, breed, photo uploads, and dedicated pet medication tracking.
* **Pet Bio Modal:** Interactive pet bio card for quick lookup during pet visits.

### 📄 Invoices & Financial Analytics
* **Line Item Builder:** Auto-calculates service rates, additional pet surcharges, and component discounts.
* **PNG Invoice Generator:** High-res PNG export (`html-to-image`) formatted with background branding.
* **Invoice Records:** Historical invoice log with editable payment dates for monthly accounting.
* **Revenue Analytics:** Monthly and per-client earnings charts in `EarningsView.jsx`.

### 🛒 Errands & Pabili Tracker
* **Itemized Shopping:** Tracks client errand requests, itemized amounts, and completion status.
* **Pastel Yellow Styling:** Distinct pastel yellow (`#F5F882`) row highlighting when imported into invoices.
* **Auto-Billing:** Marking errands billed automatically syncs item status with saved invoices.

### 🐾 Visit Report Cards
* **Post-Visit Updates:** Generates client report cards with behavioral checks, mood selection, and photos.
* **PNG Export:** Downloads styled 640px report cards for instant sharing via WhatsApp/Viber/FB Messenger.

### 🔑 Key Tracker & Settings
* **Key Tracker:** Monitors client house keys (received vs. returned).
* **Settings:** Custom service catalog pricing saved to `localStorage`, GCash configuration, and full JSON data backup/restore.

---

## 🛠️ Technology Stack

* **Frontend:** React 19 + Vite 8
* **Database & Auth:** Firebase 12 (Firestore NoSQL + Email/Password Authentication)
* **Offline Persistence:** Firestore `persistentLocalCache` + IndexedDB
* **Styling:** Vanilla CSS (CSS Custom Properties & Design System tokens in `index.css`)
* **Export Utilities:** `html-to-image`, `qrcode.react`, `uuid`, `lucide-react`
* **Package Manager:** `npm` (Node.js 24+)

---

## 💻 Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/Aaron840588/kat-petsitting-crm.git
cd kat-petsitting-crm

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Production build
npm run build
```

---

## 📜 Maintainer & Author

* **Maintainer:** Aaron Tagapan (`aarontagapan@gmail.com` / GitHub: `Aaron840588`)
* **Last Updated:** August 2026
