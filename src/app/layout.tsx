import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "JIJAU SCHOOL CONNECT PORTAL - Tungi (B.K.)",
  description: "JIJAU ENGLISH SCHOOL - Digital Management System. Admin, Founder & Teacher portals. Vercel-ready PWA.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jijau Portal" },
  icons: { icon: "/school-logo.png", apple: "/school-logo.png" },
  openGraph: { title: "JIJAU SCHOOL CONNECT PORTAL", description: "Tungi (BK) School Management SaaS - Warm Sunset Glass" },
};

export const viewport: Viewport = {
  themeColor: "#FF6B1A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/school-logo.png" />
      </head>
      <body className="min-h-full">
        <div className="jijau-bg" />
        <StoreProvider>
          <AuthProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </AuthProvider>
        </StoreProvider>
        <PwaRegister />
      </body>
    </html>
  );
}

