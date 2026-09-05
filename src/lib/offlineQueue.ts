"use client";

const QUEUE_KEY = "jijau_offline_queue_v1";
const PENDING_FLAG = "jijau_offline_pending";

type QueuedOp = {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
};

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function enqueueOp(type: string, payload: any) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const queue: QueuedOp[] = raw ? JSON.parse(raw) : [];
    queue.push({ id: Math.random().toString(36).slice(2, 9), type, payload, timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    localStorage.setItem(PENDING_FLAG, "1");
  } catch {}
}

export function getQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearQueue() {
  try {
    localStorage.removeItem(QUEUE_KEY);
    localStorage.removeItem(PENDING_FLAG);
  } catch {}
}

export function hasPending(): boolean {
  try {
    return localStorage.getItem(PENDING_FLAG) === "1" || getQueue().length > 0;
  } catch {
    return false;
  }
}

// Live edits sync silently in the background (no popup)
export function notifyLiveEdit(_message: string) {
  // Silent - live sync happens seamlessly without popup alerts
}

export function notifySaved(message: string, type: "success" | "info" | "error" = "success") {
  try {
    window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message, type } }));
    // Also via storage event for cross-tab
    localStorage.setItem("__jijau_saved_ping", JSON.stringify({ message, type, at: Date.now() }));
  } catch {}
}

// For PDF uploads and other saves, show popup
export function showUploadPopup(fileName: string) {
  notifySaved(`📄 ${fileName} uploaded - saved successfully`, "success");
}

export function showSavedPopup(action: string) {
  notifySaved(`✓ ${action} saved`, "success");
}

