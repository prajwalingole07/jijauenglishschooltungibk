import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-optimized: turbopack root set to this project so lockfile warning disappears on Vercel
  turbopack: { root: __dirname },
  // PWA-friendly headers
  async headers(){
    return [{
      source: "/sw.js",
      headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
    }];
  },
};

export default nextConfig;
