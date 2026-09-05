# JIJAU ENGLISH SCHOOL, TUNGI (B.K) — Live Sync Project

Production-ready **Next.js + Firebase + Capacitor Android** with real-time sync between Vercel web and APK WebView.

## Live Sync Stack
- **Web:** Next.js 16.3.3 (Turbopack) + `src/lib/store.tsx` Firestore `onSnapshot` listeners for instant updates.
- **Auth:** `src/lib/auth.tsx` Firebase `onAuthStateChanged` + local admin/founder fallback (`prajwal77 / prajwal@77#`, `jijau2026 / jijau@2026#`).
- **DB/Storage:** Firebase `antigravity-school-project` (Firestore, Auth, Storage, Analytics) via `src/lib/firebase.ts` (offline persistence `enableIndexedDbPersistence`).
- **APK:** Capacitor 8 WebView `capacitor.config.json:5` `server.url: https://jijauenglishschooltungibk1.vercel.app` `cleartext:true` + native `MainActivity.java:38` `LOAD_NO_CACHE` + `DownloadManager` + `Android.savePdf` blob bridge for direct Downloads.

## Firebase Config (provided)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA5swbTPWjiz65nk36zdwtkpNxZBoJ9Ugo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=antigravity-school-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=antigravity-school-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=antigravity-school-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=303479789284
NEXT_PUBLIC_FIREBASE_APP_ID=1:303479789284:web:2ea1d5cdd9672691be7ef1
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-GQY6V8J0X9
```
Set as **Vercel Environment Variables** (Project → Settings → Environment Variables → Add all `NEXT_PUBLIC_*` → Save → Redeploy).

## Firestore Setup (required for live sync)
1. Firebase Console → `antigravity-school-project` → **Firestore Database** → Create (region `asia-south1` Mumbai) → Start in **test mode** or set rules:
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if request.auth != null || true; } // tighten for prod
  }
}
```
2. **Authentication** → Enable **Email/Password** → Add users (optional) for teacher logins.
3. **Storage** → Enable → rules `allow read, write: if true;` for homework/photo uploads.

Collections auto-created on first write (seeded via `store.tsx:122`):
`students`, `faculties`, `staff`, `attendance`, `teacherAttendance`, `homework`, `transactions`, `salaryRecords`, `portalAccounts`, `notices`, `meta/settings`, `meta/holidays`, `meta/classOptions`.

## Vercel Deploy
1. Zip `JIJAU_FOR_VERCEL.zip` (excludes `node_modules/.next/android/.gradle`) → Vercel → Add New Project → Upload → Framework `Next.js` → Env vars as above → **Deploy** → URL `https://jijauenglishschooltungibk1.vercel.app`.
2. Redeploy after env changes.

## APK Build
```powershell
cd jijau-portal
npm install
npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
Copy-Item app\build\outputs\apk\debug\app-debug.apk C:\Users\prajw\Downloads\"JIJAU ENGLISH SCHOOL, TUNGI (B.K).apk"
```
- Icon: `android/app/src/main/res/mipmap-*/*` from `public/school-logo.png` (512 padded, adaptive foreground 58%).
- Permissions: `AndroidManifest.xml:3` `READ/WRITE_EXTERNAL_STORAGE` + `READ_MEDIA_IMAGES`, `FileProvider` for PDF share.

## Live Sync Test
- Open web `https://jijauenglishschooltungibk1.vercel.app/students` in Chrome + APK on phone (same login).
- **Add Student** in Chrome → APK `Dashboard/Students` updates in <1s via `onSnapshot` (no refresh).
- **Add in APK** → Chrome updates instantly. Bidirectional, offline-persisted.

## PDF Download in APK
- `MainActivity.java:44` `DownloadManager` for `https` PDFs + `JavascriptInterface savePdf` for `Blob/data:` jsPDF (admission/receipt) → `MediaStore.Downloads` (`getUniqueFileName`) + `Toast Saved to Downloads/...` → visible in Files → Downloads, unique name on repeat, supports spaces/large PDFs.

## Project Zip
`JIJAU_FOR_VERCEL.zip` (web) + `JIJAU_SCHOOL_CONNECT_PORTAL.zip` (same) + `JIJAU ENGLISH SCHOOL, TUNGI (B.K).apk` in `C:\Users\prajw\Downloads`.

## Legacy
Previous KV `/api/store` fallback remains at `src/app/api/store/route.ts` (auto-detects `KV`/`UPSTASH` prefix) but live sync now primary via Firestore.
