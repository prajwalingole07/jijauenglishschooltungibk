"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type Toast = { id: string; message: string; type: "success" | "info" | "error"; duration?: number };

const ToastContext = createContext<{ show: (msg: string, type?: Toast["type"], duration?: number) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = (message: string, type: Toast["type"] = "success", duration = 3000) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((p) => [...p, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts((p) => p.filter((t) => t.id !== id));
    }, duration);
  };

  useEffect(() => {
    // Only listen for explicit saved events when user performs an action
    const onSaved = (e: any) => {
      const detail = e.detail;
      if (detail?.message) {
        show(detail.message, detail.type || "success", 2800);
      }
    };
    window.addEventListener("jijau_saved" as any, onSaved);
    return () => {
      window.removeEventListener("jijau_saved" as any, onSaved);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 ${
              t.type === "success"
                ? "bg-[#DCFCE7] text-[#166534] border-[#86EFAC]"
                : t.type === "error"
                ? "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]"
                : "bg-white text-[#1A2B3C] border-black/10"
            }`}
          >
            <span className="text-base">
              {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
