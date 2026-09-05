# JIJAU SCHOOL CONNECT PORTAL — Vercel + APK Guide

## 1) Deploy to Vercel (live web app) — 2 minutes

**Option A: Drag & Drop (no Git)**
1. Go to https://vercel.com/new
2. Choose **Browse** → select this folder `jijau-portal` (or the ZIP `JIJAU_FOR_VERCEL.zip`)
3. Framework: **Next.js** (auto-detected), Build Command: `npm run build`, Output: `.next`
4. Click **Deploy** → you get `https://jijau-portal-xxx.vercel.app`

**Option B: Import Git**
1. Push this folder to GitHub (create repo `jijau-portals`)
2. In Vercel: **Add New → Project → Import Git Repository**
3. Deploy. Every `git push` auto-redeploys.

**Env:** No env vars needed. Data persists in browser `localStorage` (jijau_store_v2). For real DB later swap `@/lib/store` to Prisma/Postgres.

**Vercel files already included:**
- `next.config.ts` with `turbopack.root` (no lockfile warning)
- `vercel.json` (headers, region bom1 = Mumbai)
- `public/manifest.json` + `public/sw.js` (PWA)
- `src/components/PwaRegister.tsx` (service worker)

After deploy, open `https://YOUR_URL.vercel.app/login` → login with:
- Admin: `prajwal77 / prajwal@77#`
- Founder: `jijau2026 / jijau@2026#`

---

## 2) APK — make Android app (2 ways, no code change)

### Fastest: PWA Install (no APK build)
1. Open your Vercel URL on Android Chrome
2. Menu → **Install app** / **Add to Home screen** → Jijau icon appears like native APK, works offline (service worker caches)
3. Share this link with teachers: they install in 5 seconds.

### Real APK (via PWABuilder — 3 minutes, free, no Android Studio)

1. Deploy to Vercel first (step 1) and copy URL (must be https)
2. Go to https://www.pwabuilder.com → enter your Vercel URL → **Start**
3. Click **Package For Stores** → **Android** → choose **Generate Signed APK**
4. Download `app-release-signed.apk` → share via WhatsApp / Drive → users install → less process than web.

### Real APK via Capacitor (if you have Android Studio)

```bash
npm i -D @capacitor/cli @capacitor/core @capacitor/android
npx cap init "Jijau School Connect" com.jijau.school --web-dir=.next
# Edit capacitor.config.json -> set server.url to your Vercel URL
npx cap add android
npx cap open android   # builds APK in Android Studio → Build → Generate Signed APK
```

`capacitor.config.json` is already in project — just replace `YOUR_VERCEL_URL`.

---

## 3) Local test before deploy

```bash
npm install
npm run build
npm start  # http://localhost:3000/login
```

Double-click `START_JIJAU_PORTAL.bat` still works for local Windows use.

---

## ZIPs provided
- `JIJAU_SCHOOL_CONNECT_PORTAL.zip` (59 MB, with .next) → local Windows double-click
- `JIJAU_FOR_VERCEL.zip` (source only, ~1 MB without node_modules) → upload to Vercel
- `JIJAU_APK_PWA_GUIDE` → this file

© 2026 JIJAU ENGLISH SCHOOL, TUNGI (BK)
