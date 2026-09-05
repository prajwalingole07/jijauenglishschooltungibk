"use client";
import Link from "next/link";

export default function PhotoGallery(){
  return (
    <div className="card p-10 text-center space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">📁</div>
      <div className="font-black">Photo Gallery Removed</div>
      <div className="text-sm text-[#7A6F68]">As per latest update, Photo Gallery and Photo Storage Folder have been removed from Teacher Portal. Teachers now use My Dashboard only (students, attendance, homework).</div>
      <Link href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</Link>
    </div>
  );
}
