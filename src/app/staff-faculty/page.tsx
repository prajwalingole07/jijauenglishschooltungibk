"use client";
import React, { useState, useRef } from "react";
import { useStore, Staff } from "@/lib/store";
import { SearchBox, Empty } from "@/components/UI";
import { IconEdit, IconTrash, IconCamera } from "@/components/IOSIcons";
import { useAuth } from "@/lib/auth";
import { saveToPhotoFolder } from "@/lib/photoStorage";

export default function StaffFaculty(){
  const { user } = useAuth() as any;
  if(user?.role==="teacher"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Access Restricted</div>
        <div className="text-sm text-[#7A6F68]">Staff Faculty details are only for Admin/Founder.</div>
        <a href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</a>
      </div>
    );
  }
  const { staff, addStaff, updateStaff, deleteStaff } = useStore();
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<Staff|null>(null);
  const filtered = staff.filter(s=> !q || `${s.name} ${s.role}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Staff Faculty Directory</h1>
          <p className="text-sm text-[#7A6F68] mt-1">Clerical, Maintenance & Support Members</p>
        </div>
        <button onClick={()=> {setEdit(null); setOpen(true);}} className="btn-primary">+ Add Staff Member</button>
      </div>
      <div className="card p-3 flex gap-3"><SearchBox value={q} onChange={setQ} placeholder="Search staff or role..." /><span className="hidden sm:inline-flex items-center text-xs font-bold text-[#7A6F68] px-3">{filtered.length} members</span></div>
      {filtered.length===0? <Empty title="No staff found" actionLabel="+ Add Staff" onAction={()=> setOpen(true)} /> :
      <div className="j-table-wrap"><table className="j-table"><thead><tr><th>Staff</th><th>Role</th><th>Base Salary</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{filtered.map(s=>(
          <tr key={s.id}>
            <td><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full overflow-hidden bg-[#FFE4E6] grid place-items-center font-black text-[#E11D48] border border-orange-100">{s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : s.name.charAt(0)}</div><span className="font-bold">{s.name}</span></div></td>
            <td><span className="badge badge-orange">{s.role}</span></td>
            <td className="font-bold">Rs. {s.baseSalary.toLocaleString("en-IN")}</td>
            <td className="font-mono text-sm">{s.mobile}</td>
            <td><span className="badge badge-green">Active</span></td>
            <td><div className="flex gap-1.5"><button onClick={()=> {setEdit(s); setOpen(true);}} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center"><IconEdit size={14}/></button><button onClick={()=> {if(confirm(`Delete ${s.name}?`)) deleteStaff(s.id);}} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] grid place-items-center"><IconTrash size={14}/></button></div></td>
          </tr>
        ))}</tbody></table></div>}
      {open && <StaffModal initial={edit} onClose={()=> setOpen(false)} onSave={(d:any)=>{ if(edit) updateStaff(edit.id,d); else addStaff(d); setOpen(false);}} />}
    </div>
  );
}
function StaffModal({initial,onClose,onSave}:{initial:Staff|null;onClose:()=>void;onSave:(d:any)=>void}){
  const { user } = useAuth() as any;
  const [form,setForm]=useState<any>(initial|| {name:"", role:"Clerk", baseSalary:20000, mobile:"", aadhaar:"", address:"", photo:""});
  const [err,setErr]=useState("");
  const fileRef=useRef<HTMLInputElement>(null);
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    if(file.size>2*1024*1024){ setErr("Image too large (max 2MB)"); return; }
    const r=new FileReader(); r.onload=()=>{
      const data=r.result as string;
      setForm((p:any)=> ({...p, photo:data}));
      if(user && data) saveToPhotoFolder({ name: form.name || file.name.replace(/\.[^/.]+$/,"") || "staff", dataUrl: data, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "staff" });
    }; r.readAsDataURL(file);
  };
  const submit=()=>{
    if(!form.name.trim()) return setErr("Full name required");
    if(!/^\d{10}$/.test(form.mobile)) return setErr("Mobile must be 10 digits");
    if(form.aadhaar && !/^\d{12}$/.test(form.aadhaar)) return setErr("Aadhaar must be 12 digits");
    if(form.photo && user) saveToPhotoFolder({ name: form.name, dataUrl: form.photo, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "staff" });
    onSave({...form, baseSalary:Number(form.baseSalary)});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={e=> e.stopPropagation()}>
      <div className="modal-head flex items-center justify-between"><h2 className="text-xl font-extrabold">Staff Enrollment</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border grid place-items-center">X</button></div>
      <div className="modal-body space-y-4">
        <div className="flex flex-col items-center gap-2">
          <button type="button" onClick={()=> fileRef.current?.click()} className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-dashed border-[#FFD4B8] grid place-items-center mx-auto hover:border-[#FF6B1A] hover:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] transition-all group relative">
            {form.photo ? <img src={form.photo} alt="staff" className="w-full h-full object-cover" /> : <span className="text-[#FF6B1A]"><IconCamera size={22}/></span>}
            <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] font-bold py-1 text-center opacity-0 group-hover:opacity-100 transition">ADD PHOTO</span>
          </button>
          <span className="text-xs font-bold text-[#FF6B1A]">Add Photo - click to upload</span>
          {form.photo && <button type="button" onClick={()=> setForm({...form,photo:""})} className="text-xs text-[#DC2626] font-bold">Remove Photo</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-sm p-3 rounded-xl">{err}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label><span className="j-label">Full Name *</span><input className="j-input" value={form.name} onChange={e=> setForm({...form,name:e.target.value})} /></label>
          <label><span className="j-label">Role / Duty</span><select className="j-select" value={form.role} onChange={e=> setForm({...form,role:e.target.value})}><option>Clerk</option><option>Peon</option><option>Security</option><option>Cleaner</option><option>Driver</option><option>Helper</option><option>Accountant</option><option>Other</option></select></label>
          <label><span className="j-label">Base Salary (Rs. )</span><input type="number" className="j-input" value={form.baseSalary} onChange={e=> setForm({...form,baseSalary:e.target.value})} /></label>
          <label><span className="j-label">Mobile (10 Digits) *</span><input className="j-input" value={form.mobile} onChange={e=> setForm({...form,mobile:e.target.value})} /></label>
          <label><span className="j-label">Aadhaar (12 Digits)</span><input className="j-input" value={form.aadhaar} onChange={e=> setForm({...form,aadhaar:e.target.value})} /></label>
          <label className="sm:col-span-2"><span className="j-label">Address</span><textarea className="j-textarea" value={form.address} onChange={e=> setForm({...form,address:e.target.value})} /></label>
        </div>
        <button onClick={submit} className="btn-primary w-full py-3">{initial? "Update Staff":"Register Staff"}</button>
      </div>
    </div></div>
  );
}


