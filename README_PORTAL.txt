JIJAU SCHOOL CONNECT PORTAL - Tungi (B.K.)
===========================================
Warm Sunset Glass / Peach Horizon Light Theme
Soft Neumorphism / Glassmorphism Hybrid - SaaS Admin Dashboard

QUICK START
-----------
1. Double-click: START_JIJAU_PORTAL.bat
   - Installs dependencies (first time)
   - Builds production bundle
   - Starts server at http://localhost:3000
   - Browser opens automatically to /dashboard

2. Alternative DEV mode:
   Double-click RUN_DEV.bat for hot-reload development server.

MANUAL COMMANDS
---------------
npm install
npm run build
npm start          -> http://localhost:3000
npm run dev        -> http://localhost:3000 (dev)

CREDENTIALS
-----------
Default Admin shown in header: Prajwal (Admin)
Faculty logins: Created via Portal Access page (case-sensitive passwords, hashed)
No default password - create portals via UI.

FEATURES
--------
- Dashboard (stats from real DB, circular attendance)
- Academic Faculty & Staff Faculty (CRUD, photo, salary)
- Students (enrollment, ledger, fee collect, CSV export)
- Attendance (daily, class filter, submit, export)
- Homework Tracker (assign, WhatsApp share)
- Fees & Salary (student fees / faculty salary / staff salary)
- Fee Receipts (premium receipt, print, PDF, WhatsApp, delete)
- Portal Access (faculty credentials)
- AI Tools (6 tools, never auto-modifies records)

PERSISTENCE
-----------
All data is persisted to browser localStorage (key: jijau_store_v2).
Exports to JSON automatically on every change.
Production DB-ready: swap StoreProvider with Prisma/Postgres easily.

PRINT / PDF
-----------
Fee Receipt -> View -> Print produces print-only receipt (sidebar/header hidden via @media print).

DESIGN TOKENS
-------------
Primary: #FF6B1A  Sidebar: #FFF2E2  Card: #FFFFFF  Radius:12-16px
Mesh gradient: Peach -> Cream -> Pink -> Light Cyan

SUPPORT
-------
Node.js v18+ required. If port 3000 busy, set PORT=3001 before running.
Example: set PORT=3001 && npm start

© 2026 JIJAU ENGLISH SCHOOL, TUNGI (B.K.)
