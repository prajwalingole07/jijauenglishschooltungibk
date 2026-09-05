"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth as fbAuth } from "./firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export type Role = "admin" | "founder" | "teacher";
export type AuthUser = { username: string; role: Role; displayName: string; facultyId?: string; uid?: string; email?: string };

const AUTH_KEY = "jijau_auth_v3";
const REMEMBER_KEY = "jijau_remember";

type Ctx = {
  user: AuthUser | null;
  fbUser: User | null;
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
  const [fbUser,setFbUser]=useState<User|null>(null);
  const [hydrated,setHydrated]=useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(()=>{
    setUser(getStoredUser());
    setHydrated(true);
    const unsub = onAuthStateChanged(fbAuth, (u)=>{
      setFbUser(u);
      // If Firebase user exists and no local user, create local session
      if(u && !getStoredUser()){
        const role: Role = u.email?.includes("admin") ? "admin" : u.email?.includes("founder") ? "founder" : "teacher";
        const local: AuthUser = { username: u.email||u.uid, role, displayName: u.displayName || u.email || "Firebase User", uid: u.uid, email: u.email||undefined };
        localStorage.setItem(AUTH_KEY, JSON.stringify(local));
        setUser(local);
      }
    });
    return ()=> unsub();
  },[]);

  useEffect(()=>{
    if(!hydrated) return;
    const isLogin = pathname === "/login";
    if(!user && !isLogin){
      router.replace("/login");
    }
    if(user && isLogin){
      router.replace("/dashboard");
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
      setUser(u); return {ok:true};
    }
    // Founder
    if(username==="jijau2026" && password==="jijau@2026#"){
      const u:AuthUser={username, role:"founder", displayName:"Dnyaneshwar Ingole (Founder)"};
      localStorage.setItem(AUTH_KEY, JSON.stringify(u));
      if(remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY);
      setUser(u); return {ok:true};
    }
    const holidayCheck = isTeacherBlockedByHoliday();
    if(holidayCheck.blocked){
      return {ok:false, error:`🏖️ School is on holidays (${holidayCheck.reason}) till ${holidayCheck.to}. Only Admin and Founder can login. Contact Admin.`};
    }
    // Teacher via portalAccounts (fallback, now Firestore but keep localStorage check for offline)
    try{
      const raw = localStorage.getItem("jijau_store_v2");
      if(raw){
        const store = JSON.parse(raw);
        const acc = (store.portalAccounts||[]).find((p:any)=> p.portalId===username && p.status==="Active");
        if(acc){
          if(acc.passwordHash==="hashed_"+password){
            const u:AuthUser={username, role:"teacher", displayName: acc.facultyName + " (Teacher)", facultyId: acc.facultyId};
            localStorage.setItem(AUTH_KEY, JSON.stringify(u));
            if(remember) localStorage.setItem(REMEMBER_KEY, username); else localStorage.removeItem(REMEMBER_KEY);
            setUser(u); return {ok:true};
          } else {
            return {ok:false, error:"Invalid password for teacher portal"};
          }
        }
      }
    }catch{}
    // Also try Firestore portalAccounts via direct check (if online)
    // Fallback to Firebase Auth email login
    return {ok:false, error:"Invalid credentials. Check Username / Password or use Firebase email login"};
  };

  const logout = async ()=>{
    try{ await signOut(fbAuth); }catch{}
    localStorage.removeItem(AUTH_KEY);
    setUser(null);
    setFbUser(null);
    router.replace("/login");
  };
  const updateProfilePhoto = (data:string)=>{
    if(!user) return;
    const updated={...user, photo:data} as any;
    localStorage.setItem(AUTH_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  return <AuthContext.Provider value={{user, fbUser, login, logout, updateProfilePhoto}}>{children}</AuthContext.Provider>;
}

export function useAuth(){
  const c=useContext(AuthContext);
  if(!c) throw new Error("AuthProvider missing");
  return c;
}

export function getRememberedUsername():string{
  try{ return localStorage.getItem(REMEMBER_KEY)||""; }catch{ return "";}
}
