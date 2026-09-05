"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { IconDashboard, IconStudent, IconCalendar, IconBook, IconWallet, IconBell } from "./IOSIcons";

const adminNav = [
  { href: "/dashboard", label: "Home", Icon: IconDashboard },
  { href: "/students", label: "Students", Icon: IconStudent },
  { href: "/attendance", label: "Attend", Icon: IconCalendar },
  { href: "/notices", label: "Notices", Icon: IconBell },
  { href: "/fees-salary", label: "Fees", Icon: IconWallet },
];

const teacherNav = [
  { href: "/dashboard", label: "Home", Icon: IconDashboard },
  { href: "/students", label: "Students", Icon: IconStudent },
  { href: "/attendance", label: "Attend", Icon: IconCalendar },
  { href: "/notices", label: "Notices", Icon: IconBell },
  { href: "/homework", label: "Homework", Icon: IconBook },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  // Default to admin nav until auth hydrates so buttons are tappable instantly
  const nav = user?.role === "teacher" ? teacherNav : adminNav;

  return (
    <nav className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-black/10 flex justify-around items-center px-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[max(6px,env(safe-area-inset-bottom))] pt-1.5" style={{ minHeight: "64px" }}>
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const I = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all select-none min-w-[58px] min-h-[48px] active:scale-95 touch-manipulation ${
              active ? "bg-[#FFF1E6] text-[#FF6B1A] shadow-sm font-black" : "text-[#9A5A35] font-semibold hover:bg-black/[0.02] active:bg-black/[0.06]"
            }`}
          >
            <span className={`relative w-6 h-6 grid place-items-center ${active ? "scale-110" : ""} transition-transform pointer-events-none`}>
              <I size={18} className={active ? "text-[#FF6B1A]" : "text-[#9A5A35]"} />
            </span>
            <span className="text-[10px] tracking-tight leading-tight pointer-events-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
