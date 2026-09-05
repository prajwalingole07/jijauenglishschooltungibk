"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  persistentSingleTabManager,
  getFirestore,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  process.env.project_id ||
  process.env.PROJECT_ID ||
  "antigravity-school-project";

const apiKey =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  process.env.api_key ||
  process.env.API_KEY ||
  "AIzaSyA5swbTPWjiz65nk36zdwtkpNxZBoJ9Ugo";

const firebaseConfig = {
  apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "303479789284",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:303479789284:web:2ea1d5cdd9672691be7ef1",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GQY6V8J0X9",
};

export const hasFirebaseEnv = !!apiKey && !!projectId && apiKey !== "missing" && projectId !== "missing";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use modern multi-tab persistent cache API
// This allows instant cross-device and multi-tab live sync without locking delays.
let _db: ReturnType<typeof getFirestore>;
if (!getApps().length || !(globalThis as any)._jijauDb) {
  try {
    if (typeof window !== "undefined" && hasFirebaseEnv) {
      const tabMgr = typeof persistentMultipleTabManager === "function"
        ? persistentMultipleTabManager()
        : persistentSingleTabManager(undefined);
      _db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: tabMgr,
        }),
      });
    } else {
      _db = getFirestore(app);
    }
  } catch (e) {
    // Fallback if already initialized (HMR)
    _db = getFirestore(app);
  }
  (globalThis as any)._jijauDb = _db;
} else {
  _db = (globalThis as any)._jijauDb as ReturnType<typeof getFirestore>;
}
export const db = _db;
export const storage = getStorage(app);

if (typeof window !== "undefined") {
  if (hasFirebaseEnv) {
    isSupported()
      .then((yes) => {
        if (yes) getAnalytics(app);
      })
      .catch(() => {});
  }
}
export default app;
