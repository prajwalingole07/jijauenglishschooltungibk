"use client";
import { useState, useEffect } from "react";
import { useAuth, getRememberedUsername } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function LoginPage(){
  const { login, user } = useAuth();
  const router = useRouter();
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [remember,setRemember]=useState(false);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const rem=getRememberedUsername();
    if(rem) { setUsername(rem); setRemember(true); }
  },[]);
  useEffect(()=>{ if(user) router.push("/dashboard"); },[user, router]);

  const submit = ()=>{
    setErr("");
    if(!username.trim() || !password) { setErr("Enter Username and Password"); return; }
    setLoading(true);
    setTimeout(()=>{
      const res=login(username.trim(), password, remember);
      if(!res.ok) setErr(res.error||"Login failed");
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8 relative overflow-hidden">
      <div className="jijau-bg" style={{position:"fixed"}} />
      {/* soft blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-20 w-[420px] h-[420px] bg-[#FFD8B8]/40 rounded-full blur-[60px]" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-[#D6F0FF]/30 rounded-full blur-[60px]" />
      </div>

      <div className="w-full max-w-[420px] relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-[86px] h-[86px] rounded-full bg-white overflow-hidden border-[3px] border-white logo-glow-live">
            <img src="/school-logo.png" alt="Jijau Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="mt-4 text-[22px] font-black tracking-wide text-[#FF6B1A]">JIJAU ENGLISH SCHOOL TUNGI (BK)</h1>
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#98A2B3] mt-1">DIGITAL MANAGEMENT SYSTEM</p>
        </div>

        <div className="login-card bg-white rounded-[28px] p-7 md:p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#FF8A2A] to-[#FF6B1A] opacity-60" />
          <h2 className="text-xl font-black text-center text-[#1A2B3C] tracking-wide">PORTAL ACCESS</h2>
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#98A2B3] text-center mt-1">ENTER CREDENTIALS TO CONTINUE</p>

          {err && <div className="mt-4 bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-sm p-3 rounded-xl text-center font-medium">{err}</div>}

          <div className="mt-6 space-y-4">
            <label>
              <span className="text-xs font-black tracking-[0.12em] text-[#FF6B1A]">USERNAME / ID</span>
              <input
                className="login-input mt-2 j-input !bg-white !h-[48px] font-medium"
                placeholder="Username"
                value={username}
                onChange={e=> setUsername(e.target.value)}
                onKeyDown={e=> e.key==="Enter" && submit()}
              />
            </label>
            <label>
              <span className="text-xs font-black tracking-[0.12em] text-[#FF6B1A]">SECURITY PASSWORD</span>
              <div className="relative mt-2">
                <input
                  type={show? "text":"password"}
                  className="login-input j-input !bg-white !h-[48px] pr-12 font-medium"
                  placeholder="Password"
                  value={password}
                  onChange={e=> setPassword(e.target.value)}
                  onKeyDown={e=> e.key==="Enter" && submit()}
                />
                <button
                  type="button"
                  onClick={()=> setShow(v=>!v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl grid place-items-center text-[#98A2B3] hover:text-[#FF6B1A] hover:bg-[#FFF7ED] transition"
                  aria-label={show? "Hide password":"Show password"}
                >
                  {show? "🙈":"👁"}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={remember} onChange={e=> setRemember(e.target.checked)} className="w-4 h-4 accent-[#FF6B1A] rounded" />
              <span className="text-sm font-semibold text-[#5A4A42]">Remember Me</span>
            </label>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full btn-primary !py-3.5 !text-[15px] !rounded-2xl disabled:opacity-60 hover:shadow-[0_8px_24px_rgba(255,107,26,0.32),0_0_0_4px_rgba(255,107,26,0.14)]"
            >
              {loading? "SIGNING IN..." : "SIGN IN"}
            </button>

            <div className="text-xs text-center text-[#98A2B3] bg-[#FFFBF0] border border-orange-100/50 rounded-xl p-3">
              <span className="font-bold text-[#FF6B1A]">🔒 Secure Login</span> - Contact Administrator for credentials. Unauthorized access is logged.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5 text-[10px] font-bold tracking-[0.16em] text-[#FFD4B8]">
          <span>🛡</span> SECURE CLOUD ACCESS - 2026
        </div>
      </div>
    </div>
  );
}

