"use client";
import { useEffect } from "react";
import { requestNotificationPermission } from "@/lib/notifications";

export default function PwaRegister(){
  useEffect(()=>{
    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => {
          // Check for service worker updates
          reg.update().catch(()=>{});
        })
        .catch(()=>{});
    }

    // Auto-request notification permission on startup (mobile APK & browser)
    const timer = setTimeout(() => {
      requestNotificationPermission().catch(()=>{});
    }, 1500);

    return () => clearTimeout(timer);
  },[]);

  return null;
}
