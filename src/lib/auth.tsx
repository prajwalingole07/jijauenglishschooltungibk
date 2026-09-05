"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type Role = "admin" | "founder" | "teacher";
export type AuthUser = { username: string; role: Role; displayName: string; facultyId?: string };

const AUTH_KEY = "jijau_auth_v3";
const REMEMBER_KEY = "jijau_remember";

type Ctx = {
  user: AuthUser | null;
  login: (username:string, password:string, remember:boolean)=> {ok:boolean; error?:string};
  logout: ()=>void;
  updateProfilePhoto?: (data:string)=>void;
};

const AuthContext = createContext<Ctx | null>(null);

function getStoredUser(): AuthUser | null{
  try{ const raw=localStorage.getItem(AUTH_KEY); if(raw) return JSON.parse(raw); }catch{}
  return null;
}

export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<AuthUser|null>(null);
  const [hydrated,setHydrated]=useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(()=>{
    setUser(getStoredUser());
    setHydrated(true);
  },[]);

  useEffect(()=>{
    if(!hydrated) return;
    const isLogin = pathname === "/login";
    if(!user && !isLogin){
      router.push("/login");
    }
    if(user && isLogin){
      router.push("/dashboard");
    }
  },[user, hydrated, pathname, router]);

  const isTeacherBlockedByHoliday = (): {blocked:boolean; reason?:string; to?:string}=>{
    try{
      const raw = localStorage.getItem("jijau_holiday_ranges");
      if(!raw) return {blocked:false};
      const ranges: Array<{from:string; to:string; reason:string}> = JSON.parse(raw);
      const today = new Date().toISOString().slice(0,10);
      for(const r of ranges){
        if(today >= r.from && today <= r.to){
          return {blocked:true, reason:r.reason, to:r.to};
        }
      }
    }catch{}
    return {blocked:false};
  };

  const login = (username:string, password:string, remember:boolean)=>{
    // Admin
    if(username==="prajwal77" && password==="prajwal@77#"){
      const u:AuthUser={username, role:"admin", displayName:"Prajwal (Admin)"};
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      if(remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY);
      // Track logged-in teachers list for live reminder (not for admin)
      try{
        // Admin login does not need holiday check
      }catch{}
      setUser(u); return {ok:true};
    }
    // Founder
    if(username==="jijau2026" && password==="jijau@2026#"){
      const u:AuthUser={username, role:"founder", displayName:"Dnyaneshwar Ingole (Founder)"};
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      if(remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY);
      setUser(u); return {ok:true};
    }
    // Check festival holidays - block teacher login
    const holidayCheck = isTeacherBlockedByHoliday();
    if(holidayCheck.blocked){
      return {ok:false, error:`🏖️ School is on holidays (${holidayCheck.reason}) till ${holidayCheck.to}. Only Admin and Founder can login. Contact Admin.`};
    }
    // Teacher via portalAccounts stored in jijau_store_v2
    try{
      const raw = localStorage.getItem("jijau_store_v2");
      if(raw){
        const store = JSON.parse(raw);
        const acc = (store.portalAccounts||[]).find((p:any)=> p.portalId===username && p.status==="Active");
        if(acc){
          // password hash check: we stored as "hashed_"+password
          if(acc.passwordHash==="hashed_"+password){
            const u:AuthUser={username, role:"teacher", displayName: acc.facultyName + " (Teacher)", facultyId: acc.facultyId};
            localStorage.setItem(AUTH_KEY, JSON.stringify(u));
            if(remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY);
            // Track teacher as logged-in for live days count and daily reminder + auto-mark present for today
            try{
              const loggedRaw = localStorage.getItem("jijau_logged_in_teachers");
              const list: string[] = loggedRaw ? JSON.parse(loggedRaw) : [];
              if(!list.includes(acc.facultyId)){
                list.push(acc.facultyId);
                localStorage.setItem("jijau_logged_in_teachers", JSON.stringify(list));
              }
              localStorage.setItem(`jijau_teacher_last_seen_${acc.facultyId}`, Date.now().toString());
              const loginKey = `jijau_teacher_first_login_${acc.facultyId}`;
              if(!localStorage.getItem(loginKey)){
                localStorage.setItem(loginKey, new Date().toISOString().slice(0,10));
              }
              // Auto-capture present on login (live days count)
              const today = new Date().toISOString().slice(0,10);
              const storeRaw = localStorage.getItem("jijau_store_v2");
              if(storeRaw){
                const storeData = JSON.parse(storeRaw);
                const todayExists = (storeData.teacherAttendance||[]).some((t:any)=> t.facultyId===acc.facultyId && t.date===today);
                if(!todayExists){
                  const newRec = { id: `tatt_${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`, date: today, facultyId: acc.facultyId, status: "Present", markedBy: "login", updatedAt: new Date().toISOString() };
                  storeData.teacherAttendance = [...(storeData.teacherAttendance||[]), newRec];
                  localStorage.setItem("jijau_store_v2", JSON.stringify(storeData));
                  // Also broadcast for live
                  try{
                    const bc = new BroadcastChannel("jijau_live");
                    bc.postMessage({key:"jijau_store_v2", payload: storeData});
                    bc.close();
                  }catch{}
                  window.dispatchEvent(new Event("storage"));
                }
              }
            }catch{}
            setUser(u); return {ok:true};
          } else {
            return {ok:false, error:"Invalid password for teacher portal"};
          }
        }
      }
    }catch{}
    return {ok:false, error:"Invalid credentials. Check Username / Password"};
  };

  const logout = ()=>{
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    router.push("/login");
  };
  const updateProfilePhoto = (data:string)=>{
    if(!user) return;
    const updated={...user, photo:data} as any;
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return <AuthContext.Provider value={{user, login, logout, updateProfilePhoto}}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const c=useContext(AuthContext);
  if(!c) throw new Error("AuthProvider missing");
  return c;
}

export function getRememberedUsername():string{
  try{ return localStorage.getItem(REMEMBER_KEY)||""; }catch{ return "";}
}
