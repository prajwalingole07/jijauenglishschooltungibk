"use client";
import { useAuth } from "@/lib/auth";
import { useRef, useState, useEffect } from "react";
import { saveToPhotoFolder } from "@/lib/photoStorage";

export default function ProfileModal({onClose}:{onClose:()=>void}){
  const { user, updateProfilePhoto } = useAuth() as any;
  const isFounder = user?.role==="founder";
  const isTeacher = user?.role==="teacher";
  const name = user?.displayName || "Prajwal (Admin)";
  const initial = name.charAt(0).toUpperCase();
  const roleLabel = isFounder? "FOUNDER" : isTeacher? "TEACHER" : "ADMINISTRATOR";
  const bioTitle = isFounder ? "Founder - Jijau English School" : isTeacher ? "Faculty Member" : "Administrator - Lead Operations";
  const [photo, setPhoto]=useState<string | null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    try{
      const raw=localStorage.getItem("jijau_profile_photos");
      if(raw){ const m=JSON.parse(raw); if(user && m[user.username]) setPhoto(m[user.username]); }
    }catch{}
  },[user]);
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>2*1024*1024){ alert("Max 2MB"); return; }
    const r=new FileReader(); r.onload=()=>{
      const data=r.result as string; setPhoto(data);
      try{
        const raw=localStorage.getItem("jijau_profile_photos");
        const m=raw? JSON.parse(raw):{};
        if(user) m[user.username]=data;
        localStorage.setItem("jijau_profile_photos", JSON.stringify(m));
        if(updateProfilePhoto) updateProfilePhoto(data);
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("jijau_profile"));
        // Save to central photo folder (teacher only, but also for admin/founder for relogin persistence)
        if(user){
          saveToPhotoFolder({ name: (user.displayName||"profile").replace(" (Teacher)",""), dataUrl: data, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "profile" });
        }
      }catch{}
    }; r.readAsDataURL(f);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-[24px] w-full max-w-[720px] max-h-[92vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.22)] border border-white" onClick={e=> e.stopPropagation()}>
        {/* Header orange */}
        <div className="h-[86px] bg-gradient-to-r from-[#FF7A00] to-[#FF4D00] relative">
          <button onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white grid place-items-center hover:bg-white hover:text-[#FF6B1A] transition">X</button>
        </div>
        <div className="px-6 md:px-8 pb-6 bg-[#FFFBF0] -mt-10 relative">
          <div className="flex gap-4 items-end">
            <button type="button" onClick={()=> fileRef.current?.click()} className="relative w-[84px] h-[84px] rounded-full bg-gradient-to-br from-[#FF8A2A] to-[#FF6B1A] border-[4px] border-white shadow-[0_8px_24px_rgba(255,107,26,0.25)] grid place-items-center text-white font-black text-3xl shrink-0 overflow-hidden group hover:shadow-[0_0_0_4px_rgba(255,107,26,0.18)] transition-all">
              {photo ? <img src={photo} alt={name} className="w-full h-full object-cover" /> : initial}
              <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <span className="w-8 h-8 rounded-full bg-white/90 grid place-items-center text-[#FF6B1A] text-sm">📷</span>
              </span>
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-[#FF6B1A] grid place-items-center text-xs shadow-md">📷</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <div className="pb-2">
              <div className="font-black text-lg text-[#1A2B3C] tracking-wide">{name.toUpperCase()}</div>
              <div className="mt-1 inline-flex bg-[#FF6B1A] text-white text-[10px] font-black tracking-[0.14em] px-2.5 py-1 rounded-full">{roleLabel}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-[1.35fr_0.9fr] gap-6 mt-6">
            <div className="text-[11px] leading-relaxed text-[#5A4A42]">
              <div className="text-[10px] font-black tracking-[0.16em] text-[#FF6B1A] mb-2">◎ BIOGRAPHY</div>
              {isTeacher ? (
                <>
                  <p className="font-bold text-[#1A2B3C] mb-2">Myself, {name}, serving as Faculty at Jijau English School Tungi (BK).</p>
                  <p className="mb-3">Dedicated educator committed to nurturing young minds. I leverage modern pedagogy and continuous learning to bridge curriculum and student growth. My classroom emphasizes discipline, creativity, and supportive mentorship.</p>
                  <p className="mb-3">I maintain detailed attendance, homework compliance, and student progress tracking to ensure each learner achieves their best.</p>
                </>
              ) : isFounder ? (
                <>
                  <p className="font-bold text-[#1A2B3C] mb-2">Myself, Dnyaneshwar Ingole, Founder of Jijau English School Tungi (BK).</p>
                  <p className="mb-3">Visionary founder driving the school&apos;s mission to deliver quality English education in rural Maharashtra. Established Jijau with a commitment to accessible, disciplined, and values-based learning for every child.</p>
                  <p className="mb-3">My leadership focuses on infrastructure, academic excellence, and community trust - ensuring Jijau remains a beacon of modern education in Tungi (BK). Full administrative access across the portal.</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#1A2B3C] mb-2">Myself, Prajwal (Admin), serving as the Lead Administrator of Jijau English School Tungi (BK), am the strategic architect behind the school&apos;s digital transformation.</p>
                  <p className="mb-3">My role is pivotal in ensuring that the intricate gears of our institution turn with precision and efficiency. With a robust background in school operations and information management, I have been instrumental in streamlining the complex systems of attendance, payroll, and academic tracking that power our daily excellence.</p>
                  <p className="mb-3">I believe that a school&apos;s success is built upon a foundation of organized data and transparent communication. By leveraging cutting-edge technology, I work to bridge the gap between administrative requirements and educational goals. My leadership ensures that our faculty can focus on what they do best-teaching-while I maintain a seamless operational environment that supports the entire academic community of Jijau English School Tungi (BK).</p>
                </>
              )}
              <p>Dedicated to continuous improvement, I am constantly exploring new ways to enhance our institutional efficiency. My commitment to Jijau English School Tungi (BK) is reflected in the reliability of our digital infrastructure and the professionalism of our administrative services, ensuring that we remain a leader in modern education in Tungi (BK).</p>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
                <div className="text-[10px] font-black tracking-[0.14em] text-[#FF6B1A]">OFFICIAL INFORMATION</div>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 rounded-lg bg-[#FFF1E6] grid place-items-center">👤</span><div><div className="text-[10px] text-[#98A2B3] font-bold tracking-widest">DESIGNATION</div><div className="font-bold text-[#1A2B3C]">{isFounder?"Founder": isTeacher? "Faculty" : "Admin Head"}</div></div></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 rounded-lg bg-[#F3E8FF] grid place-items-center">🎓</span><div><div className="text-[10px] text-[#98A2B3] font-bold tracking-widest">EXPERIENCE</div><div className="font-bold">10+ Years</div></div></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 rounded-lg bg-[#DCFCE7] grid place-items-center">📞</span><div><div className="text-[10px] text-[#98A2B3] font-bold tracking-widest">CONTACT</div><div className="font-bold">Confidential</div></div></div>
                  <div className="flex gap-3 items-center"><span className="w-6 h-6 rounded-lg bg-[#FFF1E6] grid place-items-center">📍</span><div><div className="text-[10px] text-[#98A2B3] font-bold tracking-widest">LOCATION</div><div className="font-bold">Tungi, BK</div></div></div>
                </div>
              </div>
              <div className="bg-[#FF6B1A] rounded-2xl p-4 text-white shadow-[0_8px_20px_rgba(255,107,26,0.25)]">
                <div className="text-[10px] font-bold tracking-widest opacity-90">◎ PORTAL STATUS</div>
                <div className="font-black text-sm mt-1">ACTIVE</div>
                <div className="text-[10px] opacity-80 mt-1">Verified School ID: jijau@2026</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-orange-100 flex justify-between items-center text-[10px] text-[#98A2B3]">
            <span className="flex items-center gap-2"><img src="/school-logo.png" alt="logo" className="w-5 h-5 rounded-full object-cover" /> JIJAU ENGLISH SCHOOL, TUNGI (BK)</span>
            <span className="font-bold tracking-widest">EST. 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}

