# JIJAU SCHOOL CONNECT — Deploy Guide (Render + Firebase, no Vercel)

Vercel has been fully removed. The app now uses:
- **Hosting:** Render.com (free web service, real Node server, no forced sleep-then-lose-data behavior)
- **Database:** Firebase Firestore (free forever tier, real persistence, built for exactly this kind of live sync)

Both the website and the APK talk to the same `/api/store` endpoint, which now reads/writes Firestore
instead of Vercel KV / the old kvdb.io fallback / a `/tmp` file. That `/tmp` file was the main cause of
"data disappears" errors — on serverless hosts like Vercel, `/tmp` gets wiped constantly, so it was never
real persistence.

## 1) Create your free Firestore database (5 minutes)

1. Go to https://console.firebase.google.com → **Add project** → name it anything (e.g. `jijau-school`) → finish the wizard (no billing needed).
2. In the left menu: **Build → Firestore Database → Create database** → choose **Production mode** → pick a region close to India (e.g. `asia-south1`) → Enable.
3. Get server credentials: **Project settings (gear icon) → Service accounts → Generate new private key**. This downloads a JSON file — keep it safe, don't commit it to Git.
4. From that JSON you'll need three values for the next step:
   - `project_id`
   - `client_email`
   - `private_key`

## 2) Deploy to Render (free, 5 minutes)

1. Push this project folder to a GitHub repo (Render deploys from Git).
2. Go to https://render.com → sign up free → **New → Web Service** → connect your GitHub repo.
3. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance type:** Free
4. Add environment variables (Render dashboard → Environment):
   - `FIREBASE_PROJECT_ID` = the `project_id` from your service account JSON
   - `FIREBASE_CLIENT_EMAIL` = the `client_email` from your service account JSON
   - `FIREBASE_PRIVATE_KEY` = the `private_key` from your service account JSON (paste it as-is, including `-----BEGIN PRIVATE KEY-----` and the `\n` characters — the app handles the escaping automatically)
5. Click **Deploy**. You'll get a URL like `https://jijau-portal.onrender.com`.

Note: on Render's **free** tier the service sleeps after ~15 minutes of no traffic and takes ~30-50 seconds
to wake up on the next request. Data is never lost during sleep because it lives in Firestore, not on the
server. If you want it always-instant with no wake delay, upgrade that one service to Render's paid Starter
tier (~$7/month) — everything else here stays exactly the same.

Test it: open `https://YOUR-URL.onrender.com/api/health` — should show `"status":"online"`.
Then open `https://YOUR-URL.onrender.com/login` and sign in:
- Admin: `prajwal77 / prajwal@77#`
- Founder: `jijau2026 / jijau@2026#`

## 3) Point the APK at your live server

Open the app once, go to the server/sync settings screen (`portal-access` / settings area), and set the
**Live Server URL** to your Render URL. From then on the APK polls the same Firestore-backed API every
2.5 seconds, same as the website — so an edit made on the website shows up on the APK (and vice versa)
within a couple of seconds, without rebuilding the app.

If you'd rather bake the URL in at build time instead of typing it into the app, edit `capacitor.config.json`:

```json
"server": { "url": "https://YOUR-URL.onrender.com", "cleartext": true }
```

## 4) Rebuild the APK with the new URL

I can't compile an Android APK inside this chat (no Android SDK/network access here), but you have two
free, reliable options:

**A. PWABuilder (no Android Studio needed)**
1. Deploy to Render first, copy the URL.
2. Go to https://www.pwabuilder.com → paste your Render URL → Start.
3. Package For Stores → Android → Generate Signed APK → download.

**B. Capacitor + Android Studio (if you already have it installed)**
```bash
npm install
npx cap sync android
npx cap open android
```
Then Build → Generate Signed Bundle/APK in Android Studio.

## Why this fixes the "errors" you were seeing

- The old code tried Vercel KV first, then a public third-party URL (`kvdb.io`) that isn't something you
  control and can go down or get rate-limited, then finally a `/tmp` file that's wiped on every cold start.
  Without KV env vars configured, you were effectively running on that unreliable fallback chain.
- Firestore is a real managed database: free tier is generous (1 GiB storage, 50k reads/20k writes per day
  — far more than a single school needs), it doesn't get wiped, and it's the same store whether the request
  comes from the website or the APK.
