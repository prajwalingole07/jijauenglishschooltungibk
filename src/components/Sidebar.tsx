"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { IconDashboard, IconGraduation, IconPeople, IconStudent, IconCalendar, IconBook, IconWallet, IconReceipt, IconKey, IconSparkles, IconLogout, IconBell, IconCamera } from "./IOSIcons";

const navAdmin = [
  { href:"/dashboard", label:"Dashboard", Icon: IconDashboard },
  { href:"/academic-faculty", label:"Academic Faculty", Icon: IconGraduation },
  { href:"/staff-faculty", label:"Staff Faculty", Icon: IconPeople },
  { href:"/students", label:"Students", Icon: IconStudent },
  { href:"/admission-forms", label:"Admission Forms", Icon: IconBook },
  { href:"/attendance", label:"Attendance", Icon: IconCalendar },
  { href:"/homework", label:"Homework Tracker", Icon: IconBook },
  { href:"/fees-salary", label:"Fees & Salary", Icon: IconWallet },
  { href:"/fee-receipts", label:"Fee Receipts", Icon: IconReceipt },
  { href:"/portal-access", label:"Portal Access", Icon: IconKey },
  { href:"/teacher-live", label:"Teacher Live", Icon: IconCalendar },
  { href:"/data-manager", label:"Data Manager", Icon: IconWallet },
  { href:"/holiday-manager", label:"Holiday Manager", Icon: IconBell },
  { href:"/ai-tools", label:"AI Tools", Icon: IconSparkles },
];
const navTeacher = [
  { href:"/dashboard", label:"My Dashboard", Icon: IconDashboard },
  { href:"/ai-tools", label:"AI Communications", Icon: IconSparkles },
];

export default function Sidebar({ mobileOpen, setMobileOpen }:{ mobileOpen:boolean; setMobileOpen:(v:boolean)=>void }){
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const nav = user?.role==="teacher" ? navTeacher : navAdmin;
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden no-print" onClick={()=> setMobileOpen(false)} />}
      <aside className={`sidebar fixed left-0 top-0 h-full z-40 flex flex-col no-print transition-transform lg:translate-x-0 ${mobileOpen? "translate-x-0":"-translate-x-full lg:translate-x-0"}`} style={{width:"232px"}}>
        <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center border-b border-orange-100/50">
          <button onClick={()=> router.push("/profile")} className={`group w-[78px] h-[78px] rounded-full bg-white grid place-items-center overflow-hidden border-2 transition-all duration-300 ${user ? "logo-glow-live border-orange-200" : "border-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#FF6B1A] hover:shadow-[0_0_0_3px_rgba(255,107,26,0.14),0_8px_24px_rgba(255,107,26,0.18)]"}`}>
            <img src="/school-logo.png" alt="Jijau School Logo" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
          </button>
          <div className="mt-3 font-extrabold text-[13px] tracking-wide text-[#7A3D1F] leading-tight">JIJAU ENGLISH<br/>SCHOOL</div>
          <div className="text-[11px] font-bold tracking-[0.14em] text-[#C84F0A] mt-1">TUNGI [B.K.]</div>
          {user && <div className="mt-2 text-[10px] font-bold tracking-widest text-[#FF6B1A] bg-white px-2 py-1 rounded-full border border-orange-100">{user.role.toUpperCase()} - {user.displayName}</div>}
        </div>

        <nav className="flex-1 overflow-auto px-3 py-4 space-y-1">
          {nav.map(item=>{
            const active = pathname===item.href || (item.href!=="/dashboard" && pathname?.startsWith(item.href));
            const I=item.Icon;
            return (
              <Link key={item.href} href={item.href} onClick={()=> setMobileOpen(false)} className={`sidebar-item ${active?"active":""} glow-hover`}>
                <span className="w-7 h-7 rounded-xl grid place-items-center shrink-0 bg-white/70 border border-black/5" style={{background: active? "#FFF1E6":"rgba(255,255,255,0.7)"}}><I size={16} className={active? "text-[#FF6B1A]":"text-[#9A5A35]"} /></span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-orange-100/60">
          <button onClick={()=> logout()} className="sidebar-item w-full glow-hover">
            <span className="w-7 h-7 rounded-xl grid place-items-center bg-white border border-black/5"><IconLogout size={14} /></span> Sign Out
          </button>
          <div className="text-[10px] text-[#9A5A35]/70 text-center mt-3">© 2026 Jijau School</div>
        </div>
      </aside>
    </>
  );
}

