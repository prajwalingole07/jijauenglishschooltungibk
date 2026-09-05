"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileBottomNav from "./MobileBottomNav";
import { usePathname } from "next/navigation";

export default function AppShell({children}:{children:React.ReactNode}){
  const [mobileOpen,setMobileOpen]=useState(false);
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  if(isLogin){
    return <>{children}</>;
  }
  return (
    <div className="min-h-screen">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="lg:pl-[232px] flex flex-col min-h-screen">
        <Header onMenu={()=> setMobileOpen(v=>!v)} />
        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 w-full max-w-[1400px] mx-auto">
          {children}
        </main>
        <footer className="no-print text-center text-xs text-[#98A2B3] py-4 hidden lg:block">JIJAU ENGLISH SCHOOL - Tungi (B.K.) - Connect Portal - 2026-2027</footer>
        <MobileBottomNav />
      </div>
    </div>
  );
}
