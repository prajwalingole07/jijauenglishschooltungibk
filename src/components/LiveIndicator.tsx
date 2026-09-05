"use client";
import { useEffect, useState } from "react";

export default function LiveIndicator({ showText = true, size = "normal" }: { showText?: boolean; size?: "normal" | "small" }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Keep it LIVE only - no buffering, just navigator.onLine check, no fetch
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    update();
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const isSmall = size === "small";
  return (
    <span
      title={online ? "Live" : "Offline"}
      className={`inline-flex items-center gap-1.5 rounded-full font-black tracking-widest border select-none ${
        online
          ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] shadow-[0_0_0_2px_rgba(34,197,94,0.12)]"
          : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
      } ${isSmall ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
    >
      <span className={`rounded-full ${online ? "bg-[#16A34A] animate-pulse" : "bg-[#DC2626]"} ${isSmall ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
      {showText && (online ? "LIVE" : "OFFLINE")}
    </span>
  );
}
