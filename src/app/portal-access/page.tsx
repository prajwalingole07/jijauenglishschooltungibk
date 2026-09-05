"use client";
import { useState } from "react";
import { useStore, PortalAccount } from "@/lib/store";
import { SearchBox, Empty } from "@/components/UI";
import { useAuth } from "@/lib/auth";

export default function PortalAccess(){
  const { portalAccounts, faculties, addPortal, updatePortal, deletePortal } = useStore();
  const { user } = useAuth();
  const isTeacher = user?.role==="teacher";
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<PortalAccount|null>(null);

  const filtered = portalAccounts.filter(p=> !q || `${p.portalId} ${p.facultyName}`.toLowerCase().includes(q.toLowerCase()));

  // Teacher view: Notices & Announcements
  if(isTeacher){
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Notices & Announcements</h1>
          <p className="text-sm text-[#7A6F68]">Teacher portal - view school notices. You cannot modify admin portals.</p>
        </div>
        <div className="grid gap-4">
          <div className="card p-5 glow-hover">
            <div className="text-sm font-black text-[#FF6B1A]">📢 NOTICE - Annual Day</div>
            <div className="text-sm mt-2 text-[#5A4A42]">Annual Day celebration on 15th Dec. All teachers to coordinate class performances. - Admin</div>
            <div className="text-xs text-[#98A2B3] mt-2">Posted: 27 Aug 2026</div>
          </div>
          <div className="card p-5 glow-hover">
            <div className="text-sm font-black text-[#2563EB]">🔔 Announcement - Staff Meeting</div>
            <div className="text-sm mt-2 text-[#5A4A42]">Staff meeting on Monday 9AM in Principal cabin. Attendance mandatory.</div>
            <div className="text-xs text-[#98A2B3] mt-2">Posted: 26 Aug 2026</div>
          </div>
        </div>
        <div className="card p-5 text-center text-sm text-[#98A2B3]">You are logged in as <b className="text-[#FF6B1A]">{user?.displayName}</b>. Contact Admin/Founder to update your portal.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Portal Access Management</h1>
          <p className="text-sm text-[#7A6F68]">Configure digital credentials (case-sensitive passwords) for faculty.</p>
        </div>
        <button onClick={()=> {setEdit(null); setOpen(true);}} className="btn-primary glow-hover">+ Create New Portal</button>
      </div>

      <div className="card p-3 flex gap-3 items-center">
        <SearchBox value={q} onChange={setQ} placeholder="Search portal ID or name..." />
        <span className="text-xs font-bold text-[#7A6F68] hidden sm:block">{filtered.length} portals</span>
      </div>

      {filtered.length===0? <Empty title="No portals created yet. Click &quot;+&quot; to start." actionLabel="+ Create Portal" onAction={()=> setOpen(true)} /> :
      <div className="j-table-wrap">
        <table className="j-table">
          <thead><tr><th>Faculty Member</th><th>Allocated Class</th><th>Portal ID</th><th>Account Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(p=>(
              <tr key={p.id}>
                <td className="font-bold">{p.facultyName}</td>
                <td><span className="badge badge-blue">{p.className}</span></td>
                <td className="font-mono font-bold">{p.portalId}</td>
                <td><span className={`badge ${p.status==="Active"?"badge-green":"badge-gray"}`}>{p.status}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={()=>{ setEdit(p); setOpen(true); }} className="w-8 h-8 rounded-lg bg-[#FFF1E6] grid place-items-center">✎</button>
                    <button onClick={()=> updatePortal(p.id, {status: p.status==="Active"?"Disabled":"Active"})} className="w-8 h-8 rounded-lg bg-[#EFF6FF] grid place-items-center">{p.status==="Active"?"🔒":"🔓"}</button>
                    <button onClick={()=> { if(confirm("Delete portal?")) deletePortal(p.id);}} className="w-8 h-8 rounded-lg bg-[#FEE2E2] grid place-items-center">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}

      {open && <PortalModal key={edit?.id || "new"} initial={edit} faculties={faculties} onClose={()=> {setOpen(false); setEdit(null);}} onSave={(data:any)=>{
        if(edit) updatePortal(edit.id, {facultyName:data.facultyName, className:data.className, portalId:data.portalId, status:data.status});
        else addPortal(data);
        setOpen(false); setEdit(null);
      }} />}
    </div>
  );
}

function PortalModal({initial, faculties, onClose, onSave}:{initial:PortalAccount|null; faculties:any[]; onClose:()=>void; onSave:(d:any)=>void}){
  const [form,setForm]=useState<any>(()=>{
    if(initial) return {facultyId:initial.facultyId, facultyName:initial.facultyName, className:initial.className, portalId:initial.portalId, password:"", confirm:"", status:initial.status};
    const f=faculties[0];
    return {facultyId:f?.id||"", facultyName:f?.name||"", className:f?.className||"1st-A", portalId:"", password:"", confirm:"", status:"Active"};
  });
  const [err,setErr]=useState("");
  const submit=()=>{
    if(!form.portalId.trim()) return setErr("Portal ID required");
    if(!initial && form.password.length<6) return setErr("Password min 6 chars");
    if(!initial && form.password!==form.confirm) return setErr("Passwords do not match");
    const fac = faculties.find((x:any)=> x.id===form.facultyId);
    onSave({...form, facultyName: fac? fac.name: form.facultyName, className: fac? fac.className: form.className});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card max-w-[520px]" onClick={e=> e.stopPropagation()}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-extrabold text-lg">{initial? "Edit Portal":"Create Faculty Portal"}</h3><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border">X</button></div>
        {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-sm p-3 rounded-xl">{err}</div>}
        <label><span className="j-label">Faculty *</span>
          <select className="j-select" value={form.facultyId} onChange={e=> { const fac=faculties.find((x:any)=> x.id===e.target.value); setForm({...form, facultyId:e.target.value, facultyName:fac?.name||"", className:fac?.className||form.className}); }}>
            {faculties.length===0? <option value="">No faculty - add faculty first</option>: faculties.map((f:any)=> <option key={f.id} value={f.id}>{f.name} - {f.className}</option>)}
          </select>
        </label>
        <label><span className="j-label">Portal ID *</span><input className="j-input font-mono" value={form.portalId} onChange={e=> setForm({...form,portalId:e.target.value})} placeholder="e.g. rajesh.patil01" /></label>
        {!initial && <>
          <label><span className="j-label">Password *</span><input type="password" className="j-input" value={form.password} onChange={e=> setForm({...form,password:e.target.value})} /></label>
          <label><span className="j-label">Confirm Password *</span><input type="password" className="j-input" value={form.confirm} onChange={e=> setForm({...form,confirm:e.target.value})} /></label>
        </>}
        <label><span className="j-label">Allocated Class</span><input className="j-input" value={form.className} onChange={e=> setForm({...form,className:e.target.value})} /></label>
        <label><span className="j-label">Account Status</span><select className="j-select" value={form.status} onChange={e=> setForm({...form,status:e.target.value})}><option>Active</option><option>Disabled</option></select></label>
        <button onClick={submit} className="btn-primary w-full py-3">{initial? "Update Portal":"Create Portal"}</button>
        <div className="text-xs text-[#98A2B3] text-center">Password never shown in plain text. Stored as hash.</div>
      </div>
    </div></div>
  );
}


