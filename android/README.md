# Jijau Android App

This Android project wraps the deployed Next.js site with Capacitor.

## First setup

1. Deploy the project to Vercel.
2. Open `../capacitor.config.json`.
3. Replace `REPLACE-WITH-YOUR-VERCEL-DOMAIN.vercel.app` with the real Vercel domain.
4. From the project root, run:

```text
npm install
npx cap sync android
npx cap open android
```

Build the signed APK or AAB from Android Studio. The Android app uses the same Vercel API and Firebase Firestore data as the website.

## Native features

- PDF downloads are saved to the Android Documents directory through Capacitor Filesystem.
- PDF sharing uses the Android share sheet with the PDF file URI and student details text.
- WhatsApp can receive the PDF attachment when it is installed and selected in the share sheet.
- The web fallback remains available when the app is opened in a browser that does not support file sharing.

## Vercel requirements

Set these as server-only Vercel environment variables:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Do not add Firebase service-account values to Android resources, client-side environment variables, or the repository.

## Updating the app

After web changes, redeploy Vercel and run `npx cap sync android` before creating a new Android build. Keep the `android/` project in version control, but never commit `android/local.properties`, keystores, or signing passwords.
