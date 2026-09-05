"use client";
import { useState, useEffect, useRef } from "react";
import { useStore, Homework } from "@/lib/store";
import { SearchBox, Empty } from "@/components/UI";
import { IconEdit, IconTrash, IconCamera, IconBell } from "@/components/IOSIcons";
import { useAuth } from "@/lib/auth";

// Default holidays - can be extended via settings
const DEFAULT_HOLIDAYS = ["2026-08-15", "2026-10-02", "2026-11-12", "2026-12-25", "2026-01-26"];

export default function HomeworkPage(){
  const { homework, faculties, addHomework, updateHomework, deleteHomework } = useStore();
  const { user } = useAuth() as any;
  const [q,setQ]=useState("");
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<Homework|null>(null);
  const [holidays,setHolidays]=useState<string[]>(()=>{
    try{
      const raw=localStorage.getItem("jijau_holidays");
      return raw? JSON.parse(raw): DEFAULT_HOLIDAYS;
    }catch{ return DEFAULT_HOLIDAYS; }
  });
  const [showReminder,setShowReminder]=useState(false);
  const [reminderMsg,setReminderMsg]=useState("");

  const filtered = homework.filter(h=> !q || `${h.facultyName} ${h.className} ${h.subject}`.toLowerCase().includes(q.toLowerCase()));
  const todayStr = new Date().toISOString().slice(0,10);
  const isHolidayToday = holidays.includes(todayStr);

  // Daily reminder: once per day, ONLY to logged-in teachers who haven't posted (excluding holidays)
  useEffect(()=>{
    if(isHolidayToday) return;
    if(user?.role!=="teacher") return; // only for logged-in teachers
    const lastReminder = localStorage.getItem(`jijau_homework_reminder_${user?.username}_${todayStr}`);
    if(lastReminder) return; // already shown today for this teacher

    // Check if THIS logged-in teacher has posted homework today
    const teachersWithHomeworkToday = new Set(homework.filter(h=> h.assignedDate===todayStr).map(h=> h.facultyId));
    const myFacultyId = faculties.find(f=> f.id===user?.facultyId)?.id || user?.facultyId;
    const hasPosted = myFacultyId ? teachersWithHomeworkToday.has(myFacultyId) : false;
    
    if(!hasPosted && myFacultyId){
      const timer = setTimeout(()=>{
        const msg = `📚 Reminder: You haven't posted homework for ${todayStr} (Class ${faculties.find(f=> f.id===myFacultyId)?.className || ""}). Please post before EOD!`;
        setReminderMsg(msg);
        setShowReminder(true);
        localStorage.setItem(`jijau_homework_reminder_${user?.username}_${todayStr}`, "1");
        if("Notification" in window && Notification.permission==="granted"){
          new Notification("Homework Reminder", { body: msg, icon: "/school-logo.png" });
        }
        window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message: msg, type: "live" } }));
      }, 2000);
      return ()=> clearTimeout(timer);
    }
    // For admin/founder, show summary for all logged-in teachers (if any logged-in teachers exist)
    if(user?.role==="admin" || user?.role==="founder"){
      try{
        const loggedInRaw = localStorage.getItem("jijau_logged_in_teachers");
        const loggedInTeachers: string[] = loggedInRaw ? JSON.parse(loggedInRaw) : [];
        // Filter to those who are still considered online (last 30 min)
        const now = Date.now();
        const onlineTeachers = loggedInTeachers.filter((id:any)=>{
          try{
            const ts = localStorage.getItem(`jijau_teacher_last_seen_${id}`);
            return ts && (now - parseInt(ts) < 30*60*1000);
          }catch{ return false; }
        });
        const teachersWithHomeworkToday2 = new Set(homework.filter(h=> h.assignedDate===todayStr).map(h=> h.facultyId));
        const loggedInWithoutHomework = faculties.filter(f=> onlineTeachers.includes(f.id) && !teachersWithHomeworkToday2.has(f.id));
        if(loggedInWithoutHomework.length>0){
          const lastAdminReminder = localStorage.getItem(`jijau_homework_reminder_admin_${todayStr}`);
          if(!lastAdminReminder){
            const timer2 = setTimeout(()=>{
              const names = loggedInWithoutHomework.map(t=> t.name).join(", ");
              const msg2 = `📚 Live: ${loggedInWithoutHomework.length} logged-in teacher(s) haven't posted homework today: ${names}`;
              setReminderMsg(msg2);
              setShowReminder(true);
              localStorage.setItem(`jijau_homework_reminder_admin_${todayStr}`, "1");
              window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message: msg2, type: "live" } }));
            }, 2500);
            return ()=> clearTimeout(timer2);
          }
        }
      }catch{}
    }
  },[homework, faculties, todayStr, isHolidayToday, user]);

  // Request notification permission on mount for teachers
  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default"){
      Notification.requestPermission().catch(()=>{});
    }
  },[]);

  const shareWithImage = async (h: Homework)=>{
    const text = `📚 Homework for ${h.className} - ${h.subject}: ${h.title}\n${h.description}\nDue: ${h.dueDate} - Assigned: ${h.assignedDate}`;
    const shareData: any = { title: `Homework: ${h.title}`, text };
    
    // If homework has image, try to share it
    if((h as any).image){
      try{
        const res = await fetch((h as any).image);
        const blob = await res.blob();
        const file = new File([blob], `homework-${h.className}.jpg`, { type: blob.type });
        shareData.files = [file];
      }catch{}
    }

    // Try Web Share API with files (for APK WebView and modern browsers)
    if(navigator.canShare && shareData.files && navigator.canShare({files: shareData.files})){
      try{ await (navigator as any).share(shareData); return; }catch{}
    }
    // Try Web Share without files
    if((navigator as any).share && !shareData.files){
      try{ await (navigator as any).share({ title: shareData.title, text: shareData.text }); return; }catch{}
    }
    // Fallback: WhatsApp with image handling
    if((h as any).image){
      // For WhatsApp, we can't directly share image via wa.me, so we open WhatsApp with text and also trigger download of image
      const msg = encodeURIComponent(text + "\n\n(Image attached - please download from portal)");
      window.open(`https://wa.me/?text=${msg}`, "_blank");
      // Also download image for manual sharing
      const a=document.createElement("a");
      a.href=(h as any).image;
      a.download=`homework-${h.className}-${h.dueDate}.jpg`;
      a.click();
    } else {
      const msg = encodeURIComponent(text);
      window.open(`https://wa.me/?text=${msg}`, "_blank");
    }
  };

  return (
    <div className="space-y-4">
      {/* Daily Reminder Live Alert */}
      {showReminder && (
        <div className="card p-4 bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] border-orange-200 flex gap-3 items-start relative animate-in slide-in-from-top-2">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B1A] text-white grid place-items-center shrink-0 animate-pulse">🔔</div>
          <div className="flex-1">
            <div className="font-black text-sm text-[#7A3D1F] flex items-center gap-2">Daily Reminder <span className="bg-[#FF6B1A] text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">LIVE</span></div>
            <div className="text-sm text-[#7A6F68] mt-1">{reminderMsg}</div>
            <div className="text-xs text-[#9A5A35] mt-1">Expected holidays this month: {holidays.filter(d=> d.startsWith(todayStr.slice(0,7))).join(", ") || "None"} - {isHolidayToday? "Today is a holiday - no homework expected" : "All teachers: please post homework"}</div>
          </div>
          <button onClick={()=> setShowReminder(false)} className="w-8 h-8 rounded-full bg-white border grid place-items-center shrink-0 hover:bg-[#FEE2E2]">✕</button>
        </div>
      )}

      {isHolidayToday && (
        <div className="card p-3 bg-[#EFF6FF] border-blue-200 flex items-center gap-2 text-sm">
          <span className="w-8 h-8 rounded-lg bg-[#DBEAFE] grid place-items-center">🎉</span>
          <span className="font-bold text-[#1E40AF]">Today is a holiday ({todayStr}) - no homework reminder</span>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">HOMEWORK TRACKER</h1>
          <p className="text-sm text-[#7A6F68]">Daily compliance monitor for all classes - One reminder daily (holidays excluded)</p>
        </div>
        <button onClick={()=> {setEdit(null); setOpen(true);}} className="btn-primary flex items-center gap-2"><span className="text-lg">+</span> Add Homework</button>
      </div>

      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e=> setDate(e.target.value)} className="j-input !w-auto" />
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Search teacher or class..." />
        <span className="text-xs bg-[#F3F4F6] px-2 py-1 rounded-full">{filtered.length} records</span>
      </div>

      {filtered.length===0? <Empty title="No homework assigned" actionLabel="+ Add Homework" onAction={()=> setOpen(true)} /> :
      <div className="j-table-wrap">
        <table className="j-table">
          <thead><tr><th>Faculty Member</th><th>Allocated Class</th><th>Subject</th><th>Homework</th><th>Image</th><th>Assigned Date</th><th>Due Date</th><th>Status</th><th>Details</th><th>Share</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(h=>(
              <tr key={h.id}>
                <td className="font-bold">{h.facultyName}</td>
                <td><span className="badge badge-blue">{h.className}</span></td>
                <td>{h.subject}</td>
                <td className="max-w-[200px]"><div className="font-bold text-sm truncate">{h.title}</div><div className="text-xs text-[#98A2B3] truncate">{h.description}</div></td>
                <td>{(h as any).image ? <img src={(h as any).image} alt="hw" className="w-12 h-12 rounded-lg object-cover border cursor-pointer" onClick={()=> window.open((h as any).image, "_blank")} /> : <span className="text-xs text-[#98A2B3]">-</span>}</td>
                <td className="text-xs">{h.assignedDate}</td>
                <td className="text-xs">{h.dueDate}</td>
                <td><span className={`badge ${h.status==="Completed"?"badge-green": h.status==="Pending"?"badge-red": h.status==="Not Submitted"?"badge-gray":"badge-orange"}`}>{h.status}</span></td>
                <td><button onClick={()=> alert(`${h.title}\n\n${h.description}${(h as any).image?"\n\n[Image attached]":""}`)} className="text-xs font-bold text-[#FF6B1A] hover:underline">View</button></td>
                <td><button onClick={()=> shareWithImage(h)} className="w-8 h-8 rounded-lg bg-[#25D366] text-white grid place-items-center hover:scale-105 transition" title="Share on WhatsApp with image">💬</button></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={()=> {setEdit(h); setOpen(true);}} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center hover:bg-[#FF6B1A] hover:text-white transition" title="Edit homework"><IconEdit size={14}/></button>
                    <button onClick={()=> {if(confirm("Delete homework?")) deleteHomework(h.id);}} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] grid place-items-center hover:bg-[#DC2626] hover:text-white transition" title="Delete"><IconTrash size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {open && <HomeworkModal initial={edit} faculties={faculties} onClose={()=> setOpen(false)} onSave={(d:any)=>{ if(edit) updateHomework(edit.id,d); else addHomework(d); setOpen(false); window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message: edit? "✏️ Homework updated" : "✓ Homework added", type: "success" }})); }} />}
    </div>
  );
}

function HomeworkModal({initial, faculties, onClose, onSave}:{initial:Homework|null; faculties:any[]; onClose:()=>void; onSave:(d:any)=>void}){
  const [form,setForm]=useState<any>(initial|| {facultyId: faculties[0]?.id||"", facultyName: faculties[0]?.name||"", className: faculties[0]?.className||"1st-A", subject: faculties[0]?.subject||"", title:"", description:"", assignedDate: new Date().toISOString().slice(0,10), dueDate: new Date().toISOString().slice(0,10), status:"Assigned", image:""});
  const fileRef=useRef<HTMLInputElement>(null);
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size> 5*1024*1024){ alert("Image too large (max 5MB)"); return; }
    const r=new FileReader();
    r.onload=()=> setForm((p:any)=> ({...p, image: r.result as string }));
    r.readAsDataURL(file);
  };
  const submit=()=>{
    if(!form.title.trim()) return alert("Title required");
    const fac = faculties.find((f:any)=> f.id===form.facultyId);
    onSave({...form, facultyName: fac? fac.name: form.facultyName, className: fac? fac.className: form.className, subject: fac? fac.subject: form.subject});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card max-w-[560px]" onClick={e=> e.stopPropagation()}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-extrabold text-lg">{initial? "Edit Homework":"Create Homework"}</h3><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border">X</button></div>
        <label><span className="j-label">Faculty Member</span>
          <select className="j-select" value={form.facultyId} onChange={e=> { const f=faculties.find((x:any)=> x.id===e.target.value); setForm({...form, facultyId:e.target.value, facultyName:f?.name||"", className:f?.className||form.className, subject:f?.subject||form.subject}); }}>
            {faculties.length===0? <option value="">No faculty - add faculty first</option>: faculties.map((f:any)=> <option key={f.id} value={f.id}>{f.name} - {f.className} ({f.subject})</option>)}
          </select>
        </label>
        <label><span className="j-label">Homework Title *</span><input className="j-input" value={form.title} onChange={e=> setForm({...form,title:e.target.value})} placeholder="e.g. Addition Practice" /></label>
        <label><span className="j-label">Description</span><textarea className="j-textarea" value={form.description} onChange={e=> setForm({...form,description:e.target.value})} placeholder="Details..." /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="j-label">Assigned Date</span><input type="date" className="j-input" value={form.assignedDate} onChange={e=> setForm({...form,assignedDate:e.target.value})} /></label>
          <label><span className="j-label">Due Date</span><input type="date" className="j-input" value={form.dueDate} onChange={e=> setForm({...form,dueDate:e.target.value})} /></label>
        </div>
        <label><span className="j-label">Status</span><select className="j-select" value={form.status} onChange={e=> setForm({...form,status:e.target.value})}><option>Assigned</option><option>Completed</option><option>Pending</option><option>Not Submitted</option></select></label>
        <label><span className="j-label">Homework Image (optional)</span>
          <div className="flex gap-3 items-center">
            <button type="button" onClick={()=> fileRef.current?.click()} className="btn-secondary flex items-center gap-2"><IconCamera size={16}/> {form.image? "Change Image":"Add Image"}</button>
            {form.image && <><img src={form.image} alt="preview" className="w-14 h-14 rounded-lg object-cover border" /><button type="button" onClick={()=> setForm({...form,image:""})} className="text-xs text-[#DC2626] font-bold">Remove</button></>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          <span className="text-xs text-[#98A2B3]">Image will be shared on WhatsApp with homework</span>
        </label>
        <button onClick={submit} className="btn-primary w-full py-3">{initial? "Update":"Create"}</button>
      </div>
    </div></div>
  );
}

