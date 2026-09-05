"use client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { IconLogout } from "./IOSIcons";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiveIndicator from "./LiveIndicator";

export default function Header({ onMenu }:{ onMenu:()=>void }){
  const { user, logout } = useAuth();
  const { syncNow, isSyncing } = useStore();
  const router = useRouter();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN",{ day:"2-digit", month:"long", year:"numeric"});
  const displayName = user?.displayName || "Prajwal (Admin)";
  const roleLabel = user?.role==="founder"? "FOUNDER" : user?.role==="teacher"? "TEACHER" : "ADMIN";
  const initial = displayName.charAt(0).toUpperCase();
  const [photo,setPhoto]=useState<string|null>(null);

  useEffect(()=>{
    const load=()=>{
      try{
        const m=JSON.parse(localStorage.getItem("jijau_profile_photos")||"{}");
        if(user && m[user.username]) { setPhoto(m[user.username]); return; }
        const authRaw = localStorage.getItem("jijau_auth_v3");
        if(authRaw){
          const u = JSON.parse(authRaw);
          if(u?.photo) { setPhoto(u.photo); return; }
        }
        setPhoto(null);
      }catch{ setPhoto(null); }
    };
    load();
    const h=()=> load();
    window.addEventListener("storage",h);
    window.addEventListener("jijau_profile",h as any);
    window.addEventListener("focus", h);
    return()=> { window.removeEventListener("storage",h); window.removeEventListener("jijau_profile",h as any); window.removeEventListener("focus", h); };
  },[user]);

  return (
    <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-black/[0.06] h-[68px] flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} aria-label="Toggle menu" className="lg:hidden w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-[#FFF2E2] grid place-items-center hover:border hover:border-[#FF6B1A]/30 hover:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] active:scale-95 transition-all touch-manipulation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <div className="hidden sm:flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl overflow-hidden border shadow-sm ${user ? "logo-glow-live border-orange-200" : "border-orange-100"}`}>
            <img src="/school-logo.png" alt="logo" className="w-full h-full object-cover" />
          </div>
          <div className="leading-tight">
            <div className="font-black text-[13px] tracking-wide text-[#2D2D2D]">JIJAU SCHOOL</div>
            <div className="text-[11px] font-bold tracking-[0.12em] text-[#FF6B1A]">CONNECT PORTAL</div>
          </div>
        </div>
        <div className="hidden md:block ml-4 text-xs text-[#98A2B3]">{dateStr}</div>
      </div>

      <div className="flex items-center gap-2">
        {/* Live status badge */}
        <div className="hidden sm:block">
          <LiveIndicator showText={true} size="small" />
        </div>

        {/* Sync Now button */}
        <button
          onClick={() => syncNow()}
          title="Force Live Cloud Sync"
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-[#FF6B1A] bg-[#FFF2E2] border border-[#FF6B1A]/20 rounded-xl hover:bg-[#FFE5CC] transition-all disabled:opacity-50"
        >
          <svg
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          <span className="hidden md:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
        </button>

        <div className="hidden sm:block text-right leading-tight mr-1">
          <div className="text-sm font-bold text-[#2D2D2D]">{displayName}</div>
          <div className="text-[10px] font-bold tracking-[0.14em] text-[#FF6B1A]">{roleLabel}</div>
        </div>
        <button onClick={()=> router.push("/profile")} className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#FF8A2A] to-[#FF6B1A] text-white grid place-items-center font-black text-sm hover:shadow-[0_0_0_3px_rgba(255,107,26,0.22),0_8px_16px_rgba(255,107,26,0.22)] hover:scale-[1.03] transition-all overflow-hidden border-2 border-white shadow-sm shrink-0">
          {photo ? <img src={photo} alt={displayName} className="w-full h-full object-cover" /> : initial}
        </button>
        <button title="Logout" onClick={()=> logout()} className="ml-1 w-[52px] h-[42px] min-h-[42px] rounded-xl border border-black/10 bg-white grid place-items-center hover:border-[#FF6B1A]/30 hover:bg-[#FFF2E2] hover:shadow-[0_0_0_2px_rgba(255,107,26,0.10)] active:scale-95 transition-all shrink-0 touch-manipulation">
          <IconLogout size={18} className="text-[#7A6F68]" />
        </button>
      </div>
    </header>
  );
}
