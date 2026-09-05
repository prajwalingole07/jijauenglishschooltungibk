"use client";
import React, { useState } from "react";
import { useStore, Notice } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { SearchBox, Empty } from "@/components/UI";
import { IconBell, IconTrash, IconSparkles } from "@/components/IOSIcons";
import { sendMobileDeviceNotification, requestNotificationPermission } from "@/lib/notifications";

export default function NoticesPage() {
  const { notices, addNotice, deleteNotice, classOptions } = useStore();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "founder";
  const [q, setQ] = useState("");
  const [targetFilter, setTargetFilter] = useState("All");

  // Form state for Admin / Founder
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("All Teachers & Staff");
  const [priority, setPriority] = useState<"Normal" | "Important" | "Urgent">("Important");
  const [isSending, setIsSending] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  const targets = [
    "All Teachers & Staff",
    "All Teachers",
    "Primary Section (Nursery - 4th)",
    "Secondary Section (5th - 10th)",
    "General School Circular",
    ...classOptions.map((c) => `Class ${c}`),
  ];

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      window.dispatchEvent(
        new CustomEvent("jijau_saved", {
          detail: { message: "✓ Notifications Enabled on this device!", type: "success" },
        })
      );
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSending(true);
    const publisherName = user?.displayName || "School Admin";
    const fullTitle = `${priority === "Urgent" ? "🚨 " : priority === "Important" ? "📢 " : "ℹ️ "}${title.trim()}`;

    // 1. Add to School Store (pushes to Cloud and triggers live sync across all APKs/Browsers)
    addNotice({
      title: fullTitle,
      content: content.trim(),
      publishedBy: publisherName,
      target: target,
    });

    // 2. Trigger Mobile Device Notification on this phone/device
    await sendMobileDeviceNotification(`Jijau School: ${fullTitle}`, {
      body: `${content.trim() || "New announcement published."}\nTarget: ${target} • From: ${publisherName}`,
      url: "/notices",
    });

    // Reset form
    setTitle("");
    setContent("");
    setIsSending(false);

    window.dispatchEvent(
      new CustomEvent("jijau_saved", {
        detail: { message: "📢 Notification sent to all mobile devices & teachers!", type: "live" },
      })
    );
  };

  const filtered = notices.filter((n) => {
    const okQ = !q || `${n.title} ${n.content} ${n.target} ${n.publishedBy}`.toLowerCase().includes(q.toLowerCase());
    const okT = targetFilter === "All" || n.target === targetFilter;
    return okQ && okT;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C] leading-none">Notices & Push Notifications</h1>
          <p className="text-sm text-[#7A6F68] mt-2">
            Publish official announcements, circulars & instant notifications directly to teachers&apos; mobile devices.
          </p>
        </div>
        <button
          onClick={handleRequestPermission}
          className="btn-secondary flex items-center gap-2 text-xs font-bold py-2.5 px-4"
        >
          <span>🔔</span> {notifGranted ? "Notifications Active" : "Enable Mobile Notifications"}
        </button>
      </div>

      {/* Admin Publish Box */}
      {isAdmin && (
        <div className="card p-5 md:p-6 border-2 border-orange-100 bg-gradient-to-br from-white via-[#FFFBF6] to-[#FFF4E8] shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B1A] text-white grid place-items-center shadow-md">
              <IconBell size={20} />
            </div>
            <div>
              <h2 className="font-extrabold text-[#1A2B3C] text-base">Send Push Notification to Teachers & Staff</h2>
              <p className="text-xs text-[#7A6F68]">Instantly broadcasts to mobile notification bars and app</p>
            </div>
          </div>

          <form onSubmit={handlePublish} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="j-label">Notice / Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent: Staff Meeting today at 3:30 PM"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="j-input !bg-white"
                />
              </div>

              <div>
                <label className="j-label">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="j-select !bg-white"
                >
                  <option value="Normal">Normal Notice</option>
                  <option value="Important">📢 Important Notice</option>
                  <option value="Urgent">🚨 Urgent / Action Required</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="j-label">Target Audience</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="j-select !bg-white"
                >
                  {targets.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="j-label">Notice Message / Details</label>
                <textarea
                  rows={2}
                  placeholder="Enter detailed notice content, instructions, or agenda..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="j-textarea !bg-white !min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#98A2B3] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Will alert on all connected mobile phones, APKs and browsers instantly.
              </div>

              <button
                type="submit"
                disabled={isSending || !title.trim()}
                className="btn-primary flex items-center gap-2 !py-2.5 !px-6 text-sm !rounded-xl shadow-lg disabled:opacity-50"
              >
                <span>📢</span>
                <span>{isSending ? "Broadcasting..." : "Send Notification to Mobile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search */}
      <div className="card p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <SearchBox value={q} onChange={setQ} placeholder="Search notice title, content, target..." />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#7A6F68] hidden sm:inline">Target:</span>
          <select
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            className="j-select !w-auto !h-[38px] text-xs font-semibold"
          >
            <option value="All">All Targets</option>
            {targets.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notices List */}
      {filtered.length === 0 ? (
        <Empty
          title="NO NOTICES PUBLISHED YET"
          actionLabel={isAdmin ? "+ Create Notice" : undefined}
          onAction={isAdmin ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((n) => {
            const dateStr = n.publishedAt
              ? new Date(n.publishedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            const isUrgent = n.title.includes("🚨") || n.title.toLowerCase().includes("urgent");

            return (
              <div
                key={n.id}
                className={`card p-5 space-y-3 transition-all hover:shadow-md ${
                  isUrgent ? "border-l-4 border-l-[#DC2626] bg-[#FFF8F8]" : "border-l-4 border-l-[#FF6B1A]"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-extrabold text-base text-[#1A2B3C] leading-snug">{n.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="badge badge-orange text-[10px]">{n.target}</span>
                      <span className="text-[11px] text-[#98A2B3]">By {n.publishedBy}</span>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      title="Delete Notice"
                      onClick={() => {
                        if (confirm("Delete this notice?")) deleteNotice(n.id);
                      }}
                      className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] grid place-items-center hover:bg-[#DC2626] hover:text-white transition shrink-0"
                    >
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>

                {n.content && (
                  <p className="text-sm text-[#5A4A42] whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-black/[0.04] leading-relaxed">
                    {n.content}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-xs text-[#98A2B3]">
                  <span>🕒 {dateStr}</span>
                  <button
                    onClick={() => {
                      const shareText = `*${n.title}*\n${n.content ? n.content + "\n" : ""}Target: ${n.target}\n- ${n.publishedBy} (Jijau School)`;
                      if (navigator.share) {
                        navigator.share({ title: n.title, text: shareText }).catch(() => {});
                      } else {
                        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                      }
                    }}
                    className="text-[#FF6B1A] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>📤 Share</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
