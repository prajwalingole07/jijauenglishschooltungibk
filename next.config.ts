import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicit project root so builds are consistent on any host (Render, Railway, VPS, etc.)
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
