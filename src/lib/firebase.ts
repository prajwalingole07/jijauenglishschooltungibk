"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "missing",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "missing",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "missing",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "missing",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "missing",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "missing",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const hasFirebaseEnv = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable analytics only; persistence is enabled in store.tsx (avoid duplicate)
if (typeof window !== "undefined") {
  if (hasFirebaseEnv) {
    isSupported().then((yes) => { if (yes) getAnalytics(app); }).catch(()=>{});
  } else {
    console.warn("[firebase] Missing NEXT_PUBLIC_FIREBASE_* env vars - using placeholder config, set them in Vercel Dashboard > Settings > Environment Variables");
  }
}
export default app;
