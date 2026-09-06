"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStore, Student } from "@/lib/store";
import { SearchBox, PillTabs, Empty } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { IconEye, IconReceipt, IconWallet, IconEdit, IconTrash, IconCamera, IconBook } from "@/components/IOSIcons";
import { saveToPhotoFolder } from "@/lib/photoStorage";

export default function StudentsPage(){
  const { students, classOptions, transactions, faculties, addStudent, updateStudent, deleteStudent, collectFee } = useStore();
  const { user } = useAuth();
  const router = useRouter();
  const isTeacher = user?.role==="teacher";
  const teacherClass = isTeacher ? (faculties.find(f=> f.id===user?.facultyId)?.className || "") : "";
  const [q,setQ]=useState("");
  const [filter,setFilter]=useState("All");
  const [open,setOpen]=useState(false);
  const [edit,setEdit]=useState<Student|null>(null);
  const [ledger,setLedger]=useState<Student|null>(null);
  const [feeModal,setFeeModal]=useState<Student|null>(null);
  const [detail,setDetail]=useState<Student|null>(null);

  const filtered = students.filter(s=>{
    if(isTeacher && s.className!==teacherClass) return false;
    const okQ = !q || `${s.name} ${s.parentMobile} ${s.className} ${s.roll}`.toLowerCase().includes(q.toLowerCase());
    const balance = s.totalFees - s.feesPaid;
    const status = balance<=0? "Completed":"Pending";
    const okF = filter==="All" || status===filter;
    return okQ && okF;
  });

  const exportCsv = ()=>{
    const header="Roll,Name,Gender,Class,Category,Parent Contact,Total Fee,Paid,Balance,Status";
    const rows = filtered.map(s=> `${s.roll},"${s.name}",${s.gender},${s.className},${s.category},${s.parentMobile},${s.totalFees},${s.feesPaid},${s.totalFees - s.feesPaid},${s.feesPaid>=s.totalFees?"Completed":"Pending"}`);
    const blob=new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="student_ledger.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Student Records</h1>
          <p className="text-sm text-[#7A6F68]">Manage Enrollments & Academic Ledger</p>
        </div>
        <div className="flex gap-2">
          {!isTeacher && <button onClick={exportCsv} className="btn-secondary glow-hover">Export Ledger</button>}
          {!isTeacher && <button onClick={()=> {setEdit(null); setOpen(true);}} className="btn-primary glow-hover">+ New Enrollment</button>}
        </div>
      </div>

      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, contact or class..." />
        {!isTeacher && <PillTabs tabs={["All","Completed","Pending"]} active={filter} onChange={setFilter} />}
      </div>

      {filtered.length===0? <Empty title="NO RECORDS FOUND" actionLabel={!isTeacher ? "+ New Enrollment" : undefined} onAction={!isTeacher ? ()=> setOpen(true) : undefined} /> :
      <div className="j-table-wrap">
        <table className="j-table">
          <thead><tr><th>Roll #</th><th>Student Name</th><th>Gender</th><th>Parent Contact</th><th>Class</th><th>Category</th>{!isTeacher && <><th>Total Fee</th><th>Fee Paid</th><th>Fee Balance</th><th>Status</th></>}<th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(s=>{
              const bal = s.totalFees - s.feesPaid;
              const done = bal<=0;
              return (
                <tr key={s.id}>
                  <td className="font-mono font-bold">{s.roll}</td>
                  <td><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full overflow-hidden bg-[#FFF1E6] grid place-items-center shrink-0 border border-orange-100">{s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : <span className="font-bold text-[#FF6B1A] text-xs">{s.name.charAt(0)}</span>}</div><button onClick={()=> setDetail(s)} className="font-bold text-[#2D2D2D] hover:text-[#FF6B1A] text-left">{s.name}</button></div><div className="text-xs text-[#98A2B3] ml-10">{s.motherName? `Mother: ${s.motherName}`:""}</div></td>
                  <td>{s.gender}</td>
                  <td className="font-mono text-sm">{s.parentMobile}</td>
                  <td><span className="badge badge-blue">{s.className}</span></td>
                  <td>{s.category}</td>
                  {!isTeacher && <>
                    <td>Rs. {s.totalFees.toLocaleString("en-IN")}</td>
                    <td className="text-[#16A34A] font-bold">Rs. {s.feesPaid.toLocaleString("en-IN")}</td>
                    <td className={`${bal>0? "text-[#DC2626]":"text-[#16A34A]"} font-bold`}>Rs. {bal.toLocaleString("en-IN")}</td>
                    <td><span className={`badge ${done? "badge-green":"badge-red"}`}>{done?"Completed":"Pending"}</span></td>
                  </>}
                  <td>
                    <div className="flex gap-1">
                      <button title="View" onClick={()=> setDetail(s)} className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] grid place-items-center"><IconEye size={14}/></button>
                      {isTeacher ? <button title="Admission Form" onClick={()=> router.push(`/admission-forms?studentId=${encodeURIComponent(s.id)}`)} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center"><IconBook size={14}/></button> : <>
                        <button title="Fee ledger" onClick={()=> setLedger(s)} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center"><IconReceipt size={14}/></button>
                        <button title="Collect Fee" onClick={()=> setFeeModal(s)} className="w-8 h-8 rounded-lg bg-[#DCFCE7] text-[#16A34A] grid place-items-center"><IconWallet size={14}/></button>
                        <button onClick={()=> {setEdit(s); setOpen(true);}} className="w-8 h-8 rounded-lg bg-[#FFF1E6] text-[#FF6B1A] grid place-items-center"><IconEdit size={14}/></button>
                        <button onClick={()=> {if(confirm(`Delete ${s.name}? This will remove ledger & receipts.`)) deleteStudent(s.id);}} className="w-8 h-8 rounded-lg bg-[#FEE2E2] text-[#DC2626] grid place-items-center"><IconTrash size={14}/></button>
                      </>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {open && <StudentModal initial={edit} classOptions={classOptions} onClose={()=> setOpen(false)} onSave={(data:any)=>{
        if(edit) updateStudent(edit.id, data);
        else addStudent(data);
        setOpen(false);
      }} />}

      {detail && <StudentProfile student={detail} isTeacher={isTeacher} onClose={()=> setDetail(null)} onEdit={()=> {setEdit(detail); setDetail(null); setOpen(true);}} onAdmission={()=> router.push(`/admission-forms?studentId=${encodeURIComponent(detail.id)}`)} />}

      {ledger && <LedgerModal student={ledger} transactions={transactions.filter(t=> t.studentId===ledger.id)} onClose={()=> setLedger(null)} onCollect={()=> {setFeeModal(ledger); setLedger(null);}} />}

      {feeModal && <FeeCollectModal student={feeModal} onClose={()=> setFeeModal(null)} onCollect={(amt,mode,install,desc)=>{
        const bal = feeModal.totalFees - feeModal.feesPaid;
        if(amt>bal) return alert(`Amount exceeds balance Rs. ${bal}`);
        collectFee({studentId:feeModal.id, date:new Date().toISOString(), amount:amt, paymentMode:mode, installment:install, description:desc, collectedBy:"Prajwal (Admin)", academicYear:feeModal.academicYear});
        setFeeModal(null);
      }} />}
    </div>
  );
}

function StudentModal({initial, classOptions, onClose, onSave}:{initial:Student|null; classOptions:string[]; onClose:()=>void; onSave:(d:any)=>void}){
  const { user } = useAuth() as any;
  const [f,setF]=useState<any>(initial|| {name:"", gender:"Male", roll:"", aadhaar:"", className:classOptions[0]||"1st-A", category:"OPEN", motherName:"", parentMobile:"", address:"", totalFees:100000, feesPaid:0, academicYear:"2026-2027", admissionDate: new Date().toISOString().slice(0,10), photo:""});
  const [err,setErr]=useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size> 2*1024*1024) { setErr("Image too large (max 2MB)"); return; }
    const reader = new FileReader();
    reader.onload = ()=> {
      const data = reader.result as string;
      setF((prev:any)=> ({...prev, photo: data}));
      if(user && data){
        saveToPhotoFolder({ name: f.name || file.name.replace(/\.[^/.]+$/,"") || "student", dataUrl: data, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "student" });
      }
    };
    reader.readAsDataURL(file);
  };
  const submit=()=>{
    if(!f.name.trim()) return setErr("Full name required");
    if(!f.roll.trim()) return setErr("Roll number required");
    if(!/^\d{10}$/.test(f.parentMobile)) return setErr("Parent mobile must be 10 digits");
    if(f.aadhaar && !/^\d{12}$/.test(f.aadhaar)) return setErr("Aadhaar must be 12 digits");
    if(Number(f.feesPaid)>Number(f.totalFees)) return setErr("Fees Paid cannot exceed Total Fees");
    if(f.photo && user){
      saveToPhotoFolder({ name: f.name, dataUrl: f.photo, teacherUsername: user.username, teacherName: user.displayName.replace(" (Teacher)",""), source: "student" });
    }
    onSave({...f, totalFees:Number(f.totalFees), feesPaid:Number(f.feesPaid)});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={e=> e.stopPropagation()}>
      <div className="modal-head flex items-center justify-between"><h2 className="text-xl font-extrabold">Register New Student</h2><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border grid place-items-center">X</button></div>
      <div className="modal-body space-y-4">
        <div className="flex flex-col items-center gap-2">
          <button type="button" onClick={()=> fileRef.current?.click()} className="w-20 h-20 rounded-full overflow-hidden bg-white border-2 border-dashed border-[#FFD4B8] grid place-items-center mx-auto hover:border-[#FF6B1A] hover:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] transition-all group relative">
            {f.photo ? <img src={f.photo} alt="photo" className="w-full h-full object-cover group-hover:opacity-90" /> : <span className="text-[#FF6B1A]"><IconCamera size={22}/></span>}
            <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] font-bold py-1 text-center opacity-0 group-hover:opacity-100 transition">ADD PHOTO</span>
          </button>
          <span className="text-xs font-bold text-[#FF6B1A]">Add Photo - click to upload</span>
          {f.photo && <button type="button" onClick={()=> setF({...f,photo:""})} className="text-xs text-[#DC2626] font-bold">Remove Photo</button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>
        {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-sm p-3 rounded-xl">{err}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label><span className="j-label">Full Name *</span><input className="j-input" value={f.name} onChange={e=> setF({...f,name:e.target.value})} placeholder="Enter student name"/></label>
          <label><span className="j-label">Gender</span><select className="j-select" value={f.gender} onChange={e=> setF({...f,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></label>
          <label><span className="j-label">Roll Number *</span><input className="j-input" value={f.roll} onChange={e=> setF({...f,roll:e.target.value})} /></label>
          <label><span className="j-label">Aadhaar Number</span><input className="j-input" value={f.aadhaar} onChange={e=> setF({...f,aadhaar:e.target.value})} /></label>
          <label><span className="j-label">Class *</span><select className="j-select" value={f.className} onChange={e=> setF({...f,className:e.target.value})}>{classOptions.map(c=> <option key={c}>{c}</option>)}</select></label>
          <label><span className="j-label">Caste Category</span><select className="j-select" value={f.category} onChange={e=> setF({...f,category:e.target.value})}><option>OPEN</option><option>OBC</option><option>SC</option><option>ST</option><option>VJNT</option><option>SBC</option><option>Other</option></select></label>
          <label><span className="j-label">Mother Name</span><input className="j-input" value={f.motherName} onChange={e=> setF({...f,motherName:e.target.value})} /></label>
          <label><span className="j-label">Parent Mobile *</span><input className="j-input" value={f.parentMobile} onChange={e=> setF({...f,parentMobile:e.target.value})} /></label>
          <label className="sm:col-span-2"><span className="j-label">Address</span><textarea className="j-textarea" value={f.address} onChange={e=> setF({...f,address:e.target.value})} /></label>
          <label><span className="j-label">Total Fees (Rs. )</span><input type="number" className="j-input" value={f.totalFees} onChange={e=> setF({...f,totalFees:e.target.value})} /></label>
          <label><span className="j-label">Fees Paid (Rs. )</span><input type="number" className="j-input" value={f.feesPaid} onChange={e=> setF({...f,feesPaid:e.target.value})} /></label>
          <label><span className="j-label">Admission Date *</span><input type="date" className="j-input" value={f.admissionDate} onChange={e=> setF({...f,admissionDate:e.target.value})} /></label>
        </div>
        <button onClick={submit} className="btn-primary w-full py-3 text-base">Complete Registration</button>
      </div>
    </div></div>
  );
}

function StudentProfile({student,isTeacher,onClose,onEdit,onAdmission}:{student:Student; isTeacher:boolean; onClose:()=>void; onEdit:()=>void; onAdmission:()=>void}){
  const bal = student.totalFees - student.feesPaid;
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card max-w-[560px]" onClick={e=> e.stopPropagation()}>
      <div className="p-6">
        <div className="flex justify-between items-start"><h3 className="text-xl font-extrabold">{student.name}</h3><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border grid place-items-center">X</button></div>
        <div className="flex gap-4 mt-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#FFF1E6] grid place-items-center text-2xl font-black text-[#FF6B1A] border border-orange-100">{student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" /> : student.name.charAt(0)}</div>
          <div className="text-sm space-y-1">
            <div><b>Roll:</b> {student.roll} - <b>Gender:</b> {student.gender} - <b>Class:</b> {student.className}</div>
            <div><b>Category:</b> {student.category} - <b>Aadhaar:</b> {student.aadhaar||"-"}</div>
            <div><b>Mother:</b> {student.motherName||"-"} - <b>Parent:</b> {student.parentMobile}</div>
            <div><b>Address:</b> {student.address||"-"}</div>
            <div><b>Year:</b> {student.academicYear} - <b>Admission:</b> {(student as any).admissionDate || "-"}</div>
          </div>
        </div>
        {!isTeacher && <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="card p-3 text-center"><div className="text-xs font-bold text-[#9A6A52]">TOTAL FEES</div><div className="font-black">Rs. {student.totalFees.toLocaleString("en-IN")}</div></div>
          <div className="card p-3 text-center border-l-4 border-l-[#16A34A]"><div className="text-xs font-bold text-[#16A34A]">PAID</div><div className="font-black text-[#16A34A]">Rs. {student.feesPaid.toLocaleString("en-IN")}</div></div>
          <div className="card p-3 text-center border-l-4 border-l-[#DC2626]"><div className="text-xs font-bold text-[#DC2626]">BALANCE</div><div className="font-black text-[#DC2626]">Rs. {bal.toLocaleString("en-IN")}</div></div>
        </div>}
        {isTeacher ? <button onClick={onAdmission} className="btn-primary w-full mt-6">Admission Form</button> : <button onClick={onEdit} className="btn-primary w-full mt-6">Edit Student</button>}
      </div>
    </div></div>
  );
}

function LedgerModal({student, transactions, onClose, onCollect}:{student:Student; transactions:any[]; onClose:()=>void; onCollect:()=>void}){
  const totalPaid = transactions.reduce((a,b)=> a+b.amount,0);
  const bal = student.totalFees - student.feesPaid;
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card" onClick={e=> e.stopPropagation()}>
      <div className="p-6">
        <div className="flex justify-between"><h3 className="font-extrabold text-lg">{student.name} - Fee Ledger</h3><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border">X</button></div>
        <div className="text-sm text-[#7A6F68]">{student.className} - {student.academicYear}</div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-[#FFF7ED] p-3 rounded-xl text-center"><div className="text-xs font-bold">TOTAL</div><div className="font-black">Rs. {student.totalFees.toLocaleString("en-IN")}</div></div>
          <div className="bg-[#DCFCE7] p-3 rounded-xl text-center"><div className="text-xs font-bold text-[#16A34A]">PAID</div><div className="font-black text-[#16A34A]">Rs. {student.feesPaid.toLocaleString("en-IN")}</div></div>
          <div className="bg-[#FEE2E2] p-3 rounded-xl text-center"><div className="text-xs font-bold text-[#DC2626]">REMAINING</div><div className="font-black text-[#DC2626]">Rs. {bal.toLocaleString("en-IN")}</div></div>
        </div>
        <button onClick={onCollect} className="btn-primary w-full mt-4">Collect Fee</button>
        <div className="mt-4 j-table-wrap">
          <table className="j-table" style={{minWidth:"580px"}}>
            <thead><tr><th>Receipt</th><th>Date</th><th>Desc</th><th>Mode</th><th>Amount</th></tr></thead>
            <tbody>
              {transactions.length===0? <tr><td colSpan={5} className="text-center text-sm text-[#98A2B3] py-6">No transactions</td></tr> :
              transactions.map((t:any)=>(
                <tr key={t.id}><td className="font-mono text-xs font-bold">{t.receiptNo}</td><td className="text-xs">{new Date(t.date).toLocaleString("en-GB")}</td><td className="text-xs">{t.description}</td><td><span className="badge badge-orange">{t.paymentMode}</span></td><td className="font-bold text-[#16A34A]">Rs. {t.amount.toLocaleString("en-IN")}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div></div>
  );
}

function FeeCollectModal({student,onClose,onCollect}:{student:Student; onClose:()=>void; onCollect:(amt:number,mode:string,install:string,desc:string)=>void}){
  const bal = student.totalFees - student.feesPaid;
  const [amt,setAmt]=useState(bal>0? Math.min(5000, bal):0);
  const [mode,setMode]=useState("CASH");
  const [install,setInstall]=useState("Installment 1");
  const [desc,setDesc]=useState("Tuition Fee");
  return (
    <div className="modal-backdrop" onClick={onClose}><div className="modal-card max-w-[520px]" onClick={e=> e.stopPropagation()}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between"><h3 className="font-extrabold text-lg">Collect Fee - {student.name}</h3><button onClick={onClose} className="w-8 h-8 rounded-full bg-white border">X</button></div>
        <div className="bg-[#FFF7ED] p-3 rounded-xl text-sm">Balance: <b className="text-[#DC2626]">Rs. {bal.toLocaleString("en-IN")}</b> - Total: Rs. {student.totalFees.toLocaleString("en-IN")}</div>
        <label><span className="j-label">Payment Amount (Rs. ) *</span><input type="number" className="j-input" value={amt} onChange={e=> setAmt(Number(e.target.value))} max={bal} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label><span className="j-label">Payment Mode</span><select className="j-select" value={mode} onChange={e=> setMode(e.target.value)}><option>CASH</option><option>UPI</option><option>ONLINE</option><option>BANK TRANSFER</option><option>CHEQUE</option><option>OTHER</option></select></label>
          <label><span className="j-label">Installment</span><select className="j-select" value={install} onChange={e=> setInstall(e.target.value)}><option>Installment 1</option><option>Installment 2</option><option>Installment 3</option><option>Full Payment</option></select></label>
        </div>
        <label><span className="j-label">Description</span><input className="j-input" value={desc} onChange={e=> setDesc(e.target.value)} /></label>
        <button onClick={()=> onCollect(Number(amt),mode,install,desc)} className="btn-primary w-full py-3">Collect Rs. {Number(amt).toLocaleString("en-IN")}</button>
      </div>
    </div></div>
  );
}


