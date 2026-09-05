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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-black/10 flex justify-around items-center h-[64px] px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
        const I = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? "bg-[#FFF1E6] text-[#FF6B1A] shadow-sm" : "text-[#9A5A35]"}`}
          >
            <span className={`w-6 h-6 grid place-items-center ${active ? "scale-110" : ""} transition-transform`}>
              <I size={18} className={active ? "text-[#FF6B1A]" : "text-[#9A5A35]"} />
            </span>
            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
