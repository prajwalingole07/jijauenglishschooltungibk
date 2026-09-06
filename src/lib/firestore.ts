import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Reads a Firebase service-account from environment variables.
// Set these three env vars on your host (Render, etc.) — never commit them:
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL
//   FIREBASE_PRIVATE_KEY   (paste with real newlines OR \n escaped, both are handled below)

let app: App | null = null;
let db: Firestore | null = null;

export function getDb(): Firestore | null {
  if (db) return db;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null; // not configured yet
  }

  // Env vars often store \n as literal backslash-n — fix that.
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  try {
    if (!getApps().length) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error("Firestore init failed:", e);
    return null;
  }
}

export const STORE_COLLECTION = "jijau_school";
export const STORE_DOC = "store_v2";
