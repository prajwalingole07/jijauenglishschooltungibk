"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { IconDashboard, IconStudent, IconCalendar, IconBook, IconWallet } from "./IOSIcons";

const adminNav = [
  { href: "/dashboard", label: "Home", Icon: IconDashboard },
  { href: "/students", label: "Students", Icon: IconStudent },
  { href: "/attendance", label: "Attend", Icon: IconCalendar },
  { href: "/homework", label: "HW", Icon: IconBook },
  { href: "/fees-salary", label: "Fees", Icon: IconWallet },
];

const teacherNav = [
  { href: "/dashboard", label: "Home", Icon: IconDashboard },
  { href: "/students", label: "Students", Icon: IconStudent },
  { href: "/attendance", label: "Attend", Icon: IconCalendar },
  { href: "/homework", label: "HW", Icon: IconBook },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const nav = user?.role === "teacher" ? teacherNav : adminNav;
  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 flex justify-around items-center h-[64px] px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", height: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const I = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3.5 py-1.5 rounded-2xl transition-all ${
              active
                ? "bg-orange-50 text-[#FF6B1A] font-black scale-105 shadow-sm border border-orange-200/60"
                : "text-slate-500 hover:text-slate-800 font-semibold"
            }`}
          >
            <span className={`w-6 h-6 grid place-items-center transition-transform ${active ? "scale-110" : ""}`}>
              <I size={19} className={active ? "text-[#FF6B1A]" : "text-slate-400"} />
            </span>
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
