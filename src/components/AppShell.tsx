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
        <main className="flex-1 p-4 lg:p-8" style={{maxWidth:"1400px", width:"100%", margin:"0 auto"}}>
          {children}
        </main>
        <footer className="no-print text-center text-xs text-[#98A2B3] py-4">JIJAU ENGLISH SCHOOL - Tungi (B.K.) - Connect Portal - 2026-2027</footer>
      </div>
    </div>
  );
}

