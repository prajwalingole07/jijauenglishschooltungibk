"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { useStore, Faculty } from "@/lib/store";
import { SearchBox, Empty } from "@/components/UI";
import { IconEdit, IconTrash, IconCamera } from "@/components/IOSIcons";
import { useAuth } from "@/lib/auth";
import { saveToPhotoFolder } from "@/lib/photoStorage";

export default function AcademicFaculty(){
  const { user } = useAuth() as any;
  if(user?.role==="teacher"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Access Restricted</div>
        <div className="text-sm text-[#7A6F68]">Academic Faculty details are only for Admin/Founder.</div>
        <Link href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</Link>
      </div>
    );
  }
  const { faculties, classOptions, addFaculty, updateFaculty, deleteFaculty } = useStore();
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<Faculty|null>(null);
  const filtered = faculties.filter(f=> !q || `${f.name} ${f.subject} ${f.designation} ${f.className}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Academic Faculty Directory</h1>
          <p className="text-sm text-[#7A6F68] mt-1">Manage academic members and their profiles.</p>
        </div>
        <button onClick={()=> { setEdit(null); setOpen(true); }} className="btn-primary">+ Add Faculty Member</button>
      </div>

      <div className="card p-3 flex gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search faculty, subject or class..." />
        <span className="hidden sm:inline-flex items-center text-xs font-bold text-[#7A6F68] px-3">{filtered.length} members</span>
      </div>

      {filtered.length===0? <Empty title="No faculty found" actionLabel="+ Add Faculty" onAction={()=> setOpen(true)} /> :
      <div className="j-table-wrap">
        <table className="j-table">
          <thead><tr><th>Faculty</th><th>Designation</th><th>Subject</th><th>Exp</th><th>Class</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(f=>(
              <tr key={f.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FFF1E6] grid place-items-center font-black text-[#FF6B1A] border border-orange-100">{f.photo ? <img src={f.photo} alt={f.name} className="w-full h-full object-cover" /> : f.name.charAt(0)}</div>
                    <div className="font-bold text-[#2D2D2D]">{f.name}</div>
                  </div>
                </td>
                <td className="text-[#7A6F68]">{f.designation}</td>
                <td><span className="badge badge-blue">{f.subject}</span></td>
                <td>{f.experience} yrs</td>
                <td className="font-bold">{f.className}</td>
                <td className="font-mono text-sm">{f.mobile}</td>
                <td><span className="badge badge-green">Active</span></td>
                <td>
                  <div className="flex gap-1.5">
                    <button onClick={()=> { setEdit(f); setOpen(true); }} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center hover:bg-[#FF6B1A] hover:text-white transition"><IconEdit size={14}/></button>
                    <button onClick={()=> { if(confirm(`Delete ${f.name}?`)) deleteFaculty(f.id); }} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] grid place-items-center hover:bg-[#DC2626] hover:text-white transition"><IconTrash size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {open && <FacultyModal initial={edit} classOptions={classOptions} onClose={()=> setOpen(false)} onSave={(data)=>{
        if(edit) updateFaculty(edit.id, data as any);
        else addFaculty(data as any);
        setOpen(false);
      }} />}
    </div>
  );
}

function FacultyModal({initial, classOptions, onClose, onSave}:{initial:Faculty|null; classOptions:string[]; onClose:()=>void; onSave:(d:any)=>void}){
  const { user } = useAuth() as any;
  const [form,setForm]=useState<any>(initial|| {name:"", designation:"Teacher", subject:"", experience:1, className:classOptions[0], mobile:"", aadhaar:"", baseSalary:30000, address:"", photo:""});
  const [err,setErr]=useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size>2*1024*1024){ setErr("Image too large (max 2MB)"); return; }
    const r=new FileReader(); r.onload=()=>{
      const data=r.result as string;
      setForm((p:any)=> ({...p, photo:data}));
      if(user && data) saveToPhotoFolder({ name: form.name || file.name.replace(/\.[^/.]+$/,"") || "faculty", dataUrl: data, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "faculty" });
    }; r.readAsDataURL(file);
  };
  const submit=()=>{
    if(!form.name.trim()) return setErr("Full name required");
    if(!/^\d{10}$/.test(form.mobile)) return setErr("Mobile must be 10 digits");
    if(form.aadhaar && !/^\d{12}$/.test(form.aadhaar)) return setErr("Aadhaar must be 12 digits");
    if(form.photo && user) saveToPhotoFolder({ name: form.name, dataUrl: form.photo, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "faculty" });
    onSave({...form, experience:Number(form.experience), baseSalary:Number(form.baseSalary)});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=> e.stopPropagation()}>
        <div className="modal-head flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#1A2B3C]">Faculty Enrollment</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border grid place-items-center">X</button>
        </div>
        <div className="modal-body space-y-4">
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={()=> fileRef.current?.click()} className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-dashed border-[#FFD4B8] grid place-items-center mx-auto hover:border-[#FF6B1A] hover:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] transition-all group relative">
              {form.photo ? <img src={form.photo} alt="faculty" className="w-full h-full object-cover" /> : <span className="text-[#FF6B1A]"><IconCamera size={22}/></span>}
              <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] font-bold py-1 text-center opacity-0 group-hover:opacity-100 transition">ADD PHOTO</span>
            </button>
            <span className="text-xs font-bold text-[#FF6B1A]">Add Photo - click to upload</span>
            {form.photo && <button type="button" onClick={()=> setForm({...form,photo:""})} className="text-xs text-[#DC2626] font-bold">Remove Photo</button>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
          </div>
          {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-sm p-3 rounded-xl">{err}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label><span className="j-label">Full Name *</span><input className="j-input" value={form.name} onChange={e=> setForm({...form,name:e.target.value})} placeholder="Enter name"/></label>
            <label><span className="j-label">Designation</span><select className="j-select" value={form.designation} onChange={e=> setForm({...form,designation:e.target.value})}><option>Teacher</option><option>Senior Teacher</option><option>Head Teacher</option><option>Principal</option><option>Other</option></select></label>
            <label><span className="j-label">Subject Expertise</span><input className="j-input" value={form.subject} onChange={e=> setForm({...form,subject:e.target.value})} placeholder="e.g. Mathematics"/></label>
            <label><span className="j-label">Experience (Years)</span><input type="number" className="j-input" value={form.experience} onChange={e=> setForm({...form,experience:e.target.value})} /></label>
            <label><span className="j-label">Allot Class</span><select className="j-select" value={form.className} onChange={e=> setForm({...form,className:e.target.value})}>{classOptions.map(c=> <option key={c}>{c}</option>)}</select></label>
            <label><span className="j-label">Mobile Number (10 Digits) *</span><input className="j-input" value={form.mobile} onChange={e=> setForm({...form,mobile:e.target.value})} placeholder="9876543210"/></label>
            <label><span className="j-label">Aadhaar (12 Digits)</span><input className="j-input" value={form.aadhaar} onChange={e=> setForm({...form,aadhaar:e.target.value})} placeholder="123412341234"/></label>
            <label><span className="j-label">Base Salary (Rs. )</span><input type="number" className="j-input" value={form.baseSalary} onChange={e=> setForm({...form,baseSalary:e.target.value})} /></label>
            <label className="sm:col-span-2"><span className="j-label">Address</span><textarea className="j-textarea" value={form.address} onChange={e=> setForm({...form,address:e.target.value})} placeholder="Full address"/></label>
          </div>
          <button onClick={submit} className="btn-primary w-full py-3 text-base">{initial? "Update Directory":"Register in Directory"}</button>
        </div>
      </div>
    </div>
  );
}


