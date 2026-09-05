"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export default function LiveIndicator({
  showText = true,
  size = "normal",
  interactive = true,
}: {
  showText?: boolean;
  size?: "normal" | "small";
  interactive?: boolean;
}) {
  const [online, setOnline] = useState(true);
  const { isSyncing, syncNow, pingLatency } = useStore();

  useEffect(() => {
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
    <button
      type="button"
      onClick={() => interactive && syncNow()}
      title={online ? `Live Server Connected (${pingLatency}ms)` : "Offline"}
      className={`inline-flex items-center gap-1.5 rounded-full font-black tracking-widest border select-none transition-all duration-300 ${
        interactive ? "cursor-pointer hover:scale-105 active:scale-95" : ""
      } ${
        online
          ? "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] shadow-[0_0_0_2px_rgba(34,197,94,0.14)]"
          : "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]"
      } ${isSmall ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
    >
      <span className="relative flex h-2 w-2">
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${online ? "bg-[#16A34A]" : "bg-[#DC2626]"}`} />
      </span>
      {showText && <span>{online ? (isSyncing ? "SYNCING..." : `LIVE ${pingLatency > 0 ? `${pingLatency}ms` : ""}`) : "OFFLINE"}</span>}
    </button>
  );
}
