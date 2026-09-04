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
  const [open, setOpen] = useState(false);
  const { isSyncing, syncNow, pingLatency, serverUrl, setServerUrl } = useStore();
  const [inputUrl, setInputUrl] = useState(serverUrl);

  useEffect(() => {
    setInputUrl(serverUrl);
  }, [serverUrl]);

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

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setServerUrl(inputUrl);
    setOpen(false);
    syncNow();
    // Popup notification disabled intentionally.
    // Live sync still runs normally via syncNow().
  };

  return (
    <>
      <button
        type="button"
        onClick={() => interactive && setOpen(true)}
        title={online ? `Live Server Connected (${pingLatency}ms) - Click to manage` : "Offline"}
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
        {showText && (
          <span>
            {online ? (isSyncing ? "SYNCING..." : `LIVE ${pingLatency > 0 ? `${pingLatency}ms` : ""}`) : "OFFLINE"}
          </span>
        )}
      </button>

      {/* Live Server Sync Hub Modal */}
      {open && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-orange-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#16A34A] animate-pulse" />
                <h3 className="text-lg font-extrabold text-[#1A2B3C]">Live Server & Cloud Sync</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FFF1E6] text-[#FF6B1A] font-black grid place-items-center hover:bg-[#FF6B1A] hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 bg-[#FFF8F2] border border-orange-100 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#9A6A52]">STATUS</div>
                  <div className="font-extrabold text-[#16A34A] flex items-center gap-1.5 mt-0.5">
                    <span>● Real-Time Cloud Sync Active</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#9A6A52]">LATENCY</div>
                  <div className="font-black text-[#FF6B1A] text-base">{pingLatency} ms</div>
                </div>
              </div>

              <form onSubmit={handleSaveUrl} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-black tracking-wider text-[#FF6B1A] block mb-1.5">
                    CUSTOM LIVE SERVER URL (OPTIONAL)
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://your-school-portal.vercel.app"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="j-input !h-[44px] text-xs font-mono"
                  />
                  <p className="text-[11px] text-[#98A2B3] mt-1.5 leading-snug">
                    Leave blank to use default real-time serverless sync. For standalone APK on mobile, you can paste your live Vercel URL here to sync with the website.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={() => syncNow()}
                    className="flex-1 btn-secondary !py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>{isSyncing ? "Syncing..." : "Force Sync Now"}</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary !py-2.5 text-xs font-bold"
                  >
                    Save & Reconnect
                  </button>
                </div>
              </form>
            </div>

            <div className="p-3 bg-[#F8FAFC] border rounded-xl text-[11px] text-[#64748B] flex items-center gap-2">
              <span>🔒</span>
              <span>Edits in browser & APK sync automatically every 2.5s with zero data loss.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
