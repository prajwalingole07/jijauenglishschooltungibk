import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-optimized: turbopack root set to this project so lockfile warning disappears on Vercel
  turbopack: { root: __dirname },
  // Prevent Vercel from tracing entire filesystem due to dynamic fs usage in client components
  outputFileTracingRoot: __dirname,
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      process.env.FIREBASE_PROJECT_ID ||
      process.env.project_id ||
      process.env.PROJECT_ID ||
      "antigravity-school-project",
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.FIREBASE_API_KEY ||
      process.env.api_key ||
      process.env.API_KEY ||
      "AIzaSyA5swbTPWjiz65nk36zdwtkpNxZBoJ9Ugo",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.project_id || process.env.PROJECT_ID || "antigravity-school-project"}.firebaseapp.com`,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || process.env.project_id || process.env.PROJECT_ID || "antigravity-school-project"}.firebasestorage.app`,
    NEXT_PUBLIC_FIREBASE_APP_ID:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
      process.env.FIREBASE_APP_ID ||
      process.env.app_id ||
      "1:303479789284:web:2ea1d5cdd9672691be7ef1",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "303479789284",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GQY6V8J0X9",
    FIREBASE_CLIENT_EMAIL:
      process.env.FIREBASE_CLIENT_EMAIL ||
      process.env.client_email ||
      process.env.CLIENT_EMAIL ||
      "",
    FIREBASE_PRIVATE_KEY:
      process.env.FIREBASE_PRIVATE_KEY ||
      process.env.private_key ||
      process.env.PRIVATE_KEY ||
      "",
  },
  // PWA-friendly headers + APK WebView support (allow embedding via Web2App)
  async headers(){
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/manifest.json",
        headers: [{ key: "Content-Type", value: "application/manifest+json" }],
      },
      {
        source: "/(.*)",
        headers: [
          // Allow WebView to download PDFs / share via anchor clicks
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
