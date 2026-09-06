# ⚙️ Cinema Hall Management - Admin Panel

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-v1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Recharts](https://img.shields.io/badge/Recharts-v3.x-22B14C?logo=recharts&logoColor=white)](https://recharts.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A powerful, state-of-the-art administration dashboard built using **React**, **Vite**, **Tailwind CSS**, and **shadcn/ui**. Designed for cinema owners to manage multiple theaters, screens, seating layouts, shows scheduling, bookings, ticket scanning, financial refunds, and marketing banners/promotional coupons.

> Part of the **[Cinema Hall Platform](../README.md)** — see also [cinema-hall-api](../cinema-hall-api) (backend), [cinema-hall-users](../cinema-hall-users) (customer app), and [cinemax-mcp-server](../cinemax-mcp-server) (AI/MCP integration).

---

## 📑 Table of Contents

- [Key Features & Modules](#-key-features--modules)
- [Screenshots](#-screenshots)
- [Folder Architecture](#-folder-architecture)
- [Environment Setup](#-environment-setup)
- [Execution Instructions](#-execution-instructions)
- [Admin Documentation](#-admin-documentation)
- [License](#-license)

---

## 🎨 Key Features & Modules

*   **📊 Unified Dashboard Analytics**: A modern cockpit featuring real-time KPI metrics (today's revenue, booking count, total customers, active offers) coupled with interactive Recharts trends, recent bookings list, and occupancy alerts.
*   **🏢 Multi-Hall Workspace Switcher**: Manage and toggle between multiple cinema hall locations dynamically from the sidebar header. Changes update context state and refetch analytics automatically.
*   **🗺️ Interactive Register & Onboarding Wizard**: A 3-step setup (Personal Info → Hall Address → Pin Coordinates on Leaflet Map) that registers the admin and sets up their first hall.
*   **📐 Seating Designer Canvas**: A full-viewport layout builder allowing customization of rows/columns, category classification (Premium/Gold/Silver), blocked seat slots, vertical/horizontal aisles, zoom toolbar (-/+/Fit, 20–200%), and Undo/Redo history.
*   **📅 Showtime Scheduler**: Schedule single shows or bulk shows with Week-by-Week navigation (chevrons with ±7 day offset), calendar date pickers, price overrides per seat type, and show cancellation alerts.
*   **📷 QR Ticket Validator**: Real-time browser-based ticket validator utilizing the user's camera scanner. Confirms booking details, seat allocations, and checks ticket validity against active show databases.
*   **🏷️ Promotions & Banner Managers**: Scoped and global Offer coupons builder (discount type, value, expiry date picker, and user eligibility parameters) and banner advertising panel with click-through analytics.
*   **📥 CSV / Excel Export**: Instant client-side download of tables (Ads analytics, coupon sheets, and orders lists) using the XLSX engine.

---

## 🖼️ Screenshots

**Onboarding & Dashboard**

| Login | Create Account | Onboarding |
|---|---|---|
| ![Login](docs/screenshots/01-login.png) | ![Create Account](docs/screenshots/02-create-account.png) | ![Onboarding](docs/screenshots/03-onboarding.png) |

| Dashboard | My Halls | Screens List |
|---|---|---|
| ![Dashboard](docs/screenshots/04-dashboard.png) | ![My Halls](docs/screenshots/05-my-halls.png) | ![Screens List](docs/screenshots/06-screens-list.png) |

**Catalog & Scheduling**

| Movie Management | Shows Management |
|---|---|
| ![Movie Management](docs/screenshots/08-movie-management.png) | ![Shows Management](docs/screenshots/09-shows-management.png) |

**Bookings, Payments & Refunds**

| Bookings List | Booking Detail | Refunds |
|---|---|---|
| ![Bookings List](docs/screenshots/10-bookings-list.png) | ![Booking Detail](docs/screenshots/11-booking-detail.png) | ![Refunds](docs/screenshots/12-refunds.png) |

| Payment Orders | Offers | Ads Management |
|---|---|---|
| ![Payment Orders](docs/screenshots/13-payment-orders.png) | ![Offers](docs/screenshots/14-offers.png) | ![Ads Management](docs/screenshots/15-ads-management.png) |

**People & Notifications**

| Customers | Hall Admins |
|---|---|
| ![Customers](docs/screenshots/16-customers.png) | ![Hall Admins](docs/screenshots/17-hall-admins.png) |

| Notifications — Manual | Notifications — Auto |
|---|---|
| ![Notifications Manual](docs/screenshots/18-notifications-manual.png) | ![Notifications Auto](docs/screenshots/19-notifications-auto.png) |

**Settings**

| General | Team | Roles & Permissions |
|---|---|---|
| ![Settings General](docs/screenshots/20-settings-general.png) | ![Settings Team](docs/screenshots/21-settings-team.png) | ![Settings Roles](docs/screenshots/22-settings-roles.png) |

| Roles — Permission Matrix | Activity Log | API Keys |
|---|---|---|
| ![Roles Permission Matrix](docs/screenshots/23-settings-roles-permissions.png) | ![Activity Log](docs/screenshots/24-settings-activity-log.png) | ![API Keys](docs/screenshots/25-settings-api-keys.png) |

---

## 📂 Folder Architecture

```bash
cinema-hall-admin/
├── public/               # Static assets & icons
├── src/
│   ├── components/       # Reusable components
│   │   ├── ui/               # shadcn/ui custom primitives
│   │   ├── AppSidebar.jsx    # Collapsible primary navigation
│   │   ├── HallSwitcher.jsx  # Multi-hall context dropdown selector
│   │   ├── MapPicker.jsx     # Leaflet coordinates pinning canvas
│   │   └── TMDBBrowser.jsx   # TMDB catalog search grid
│   ├── context/          # State Providers
│   │   ├── AuthContext.jsx   # Admin authentication & onboarding state
│   │   └── HallContext.jsx   # Active cinema hall tracking & toggle
│   ├── pages/            # View components
│   │   ├── HomePage.jsx          # Dashboard charts & KPI cards
│   │   ├── MovieManagement.jsx   # Movie collection CRUD & TMDB import
│   │   ├── ShowsManagement.jsx   # Showtime scheduler & bulk scheduler
│   │   ├── CinemaScreens.jsx     # Screens lists
│   │   ├── ScreenDesignerPage.jsx# Seating designer workspace
│   │   ├── Bookings.jsx          # Interactive bookings list & filter
│   │   ├── PaymentOrders.jsx     # Payment attempts table
│   │   └── OnboardingPage.jsx    # First-time setup wizard
│   ├── routes/           # Routing guard middleware
│   │   ├── ProtectedRoutes.jsx   # Validates active admin session
│   │   ├── AdminProtectedRoutes.jsx # Checks SuperAdmin authorization
│   │   └── HallGuard.jsx         # Gates routes until active hall is selected
│   ├── services/         # API abstraction
│   │   ├── api.js                # Fetch wrapper with cookies enabled
│   │   └── cloudinary.js         # Direct media upload service
│   ├── utils/            # Shared formatting helpers
│   ├── App.jsx           # App shell & router configurations
│   ├── index.css         # Tailwind directives & CSS design system
│   └── main.jsx          # Root DOM renderer
├── tailwind.config.js    # Styling configurations
├── vite.config.js        # Vite compilation configuration
└── package.json          # Node modules list
```

---

## 🔑 Environment Setup

Create a `.env` file in the root of the `cinema-hall-admin` directory:

```env
# URL pointing to the API service
VITE_API_BASE_URL=http://localhost:5000

# Deployed Cinemax MCP server (HTTP transport) — shown on Settings > API Keys
# so admins know where to point their MCP client. Leave unset locally.
VITE_MCP_SERVER_URL=https://your-mcp-server-host/mcp

# Cloudinary asset storage configuration
VITE_CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
VITE_CLOUDINARY_CLOUD_NAME=<cloud_name>
VITE_CLOUDINARY_UPLOAD_PRESET=<upload_preset_name>

# OAuth Configuration
VITE_GOOGLE_CLIENT_ID=<google_oauth_client_id>
VITE_GITHUB_CLIENT_ID=<github_oauth_client_id>

# Firebase (push notifications)
VITE_FIREBASE_API_KEY=<firebase_api_key>
VITE_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<firebase_project_id>
VITE_FIREBASE_STORAGE_BUCKET=<project-id>.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<firebase_sender_id>
VITE_FIREBASE_APP_ID=<firebase_app_id>
VITE_FIREBASE_VAPID_KEY=<firebase_vapid_key>
```

---

## 🚀 Execution Instructions

### 1. Install Dependencies
Make sure you include peer dependencies as some React 19 / Leaflet packages require them:
```bash
npm install --legacy-peer-deps
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch on [http://localhost:5174](http://localhost:5174).

### 3. Build for Production
```bash
npm run build
```
Generates a highly optimized build bundle inside the `dist/` directory.

### 4. Preview Production Build Locally
```bash
npm run preview
```

---

## 📘 Admin Documentation
For structural walkthroughs, component specifications, and workflow diagrams, review [docs/admin.md](../docs/admin.md).

---

## 📄 License
Licensed under the [MIT License](LICENSE).
