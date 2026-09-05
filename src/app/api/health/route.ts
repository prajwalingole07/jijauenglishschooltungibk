import { NextResponse } from "next/server";

export async function GET() {
  const hasFirebase = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
  const hasRedis =
    !!process.env.UPSTASH_REDIS_REST_URL ||
    !!process.env.KV_REST_API_URL ||
    !!Object.keys(process.env).find((k) => k.endsWith("_REST_URL"));
  return NextResponse.json(
    {
      ok: true,
      timestamp: new Date().toISOString(),
      env: {
        firebase: hasFirebase ? "configured" : "MISSING - set NEXT_PUBLIC_FIREBASE_* in Vercel",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || null,
        redis: hasRedis ? "configured" : "not configured (optional)",
      },
      hint: hasFirebase
        ? "Live sync: Firebase Firestore onSnapshot is active. If data doesn't sync, check Firestore Rules (allow read, write: if true) and redeploy."
        : "Fix: Vercel Dashboard > Your Project > Settings > Environment Variables > add NEXT_PUBLIC_FIREBASE_API_KEY etc. for Production + Preview + Development, then Redeploy.",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
