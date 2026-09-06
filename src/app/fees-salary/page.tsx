"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { PillTabs, SearchBox } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { IconWallet, IconReceipt, IconCamera, IconWhatsapp } from "@/components/IOSIcons";
import { downloadReceiptPDF, printReceiptPDF, shareReceiptPDF } from "@/lib/receiptPdf";

export default function FeesSalary(){
  const { students, faculties, staff, transactions, salaryRecords, addSalary, collectFee, settings } = useStore();
  const { user } = useAuth();
  const isTeacher = user?.role==="teacher";
  const [tab,setTab]=useState("Student Fees");
  const [q,setQ]=useState("");
  const [studentFeeOpen,setStudentFeeOpen]=useState<any|null>(null);
  const [salaryOpen,setSalaryOpen]=useState<{id:string; name:string; type:"faculty"|"staff"}|null>(null);
  const [receiptOpen,setReceiptOpen]=useState<any|null>(null);

  if(isTeacher){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black text-[#1A2B3C]">Access Restricted</div>
        <div className="text-sm text-[#7A6F68]">Fees & salary details are only for Admin and Founder. Teachers can use Dashboard for students, attendance and homework.</div>
        <Link href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</Link>
      </div>
    );
  }

  const totalExpected = students.reduce((a,b)=> a+b.totalFees,0);
  const feesCollected = transactions.reduce((a,b)=> a+b.amount,0);
  const outstanding = Math.max(0, totalExpected - feesCollected);

  const filteredStudents = students.filter(s=> !q || `${s.name} ${s.className}`.toLowerCase().includes(q.toLowerCase()));
  const filteredFaculty = faculties.filter(f=> !q || f.name.toLowerCase().includes(q.toLowerCase()));
  const filteredStaff = staff.filter(s=> !q || s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">FEES & SALARY</h1>
        <p className="text-sm text-[#7A6F68]">Tracking school revenues and staff payroll for JIJAU ENGLISH SCHOOL TUNGI (BK).</p>
      </div>

      <PillTabs tabs={["Student Fees","Academic Faculty Salary","Staff Faculty Salary"]} active={tab} onChange={setTab} />

      {tab==="Student Fees" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5"><div className="text-xs font-bold tracking-[0.12em] text-[#9A6A52]">TOTAL EXPECTED FEES</div><div className="text-2xl font-black mt-1">Rs. {totalExpected.toLocaleString("en-IN")}</div></div>
            <div className="card p-5 border-l-4 border-l-[#16A34A]"><div className="text-xs font-bold tracking-[0.12em] text-[#16A34A]">FEES COLLECTED</div><div className="text-2xl font-black text-[#16A34A] mt-1">Rs. {feesCollected.toLocaleString("en-IN")}</div></div>
            <div className="card p-5 border-l-4 border-l-[#DC2626]"><div className="text-xs font-bold tracking-[0.12em] text-[#DC2626]">OUTSTANDING DUES</div><div className="text-2xl font-black text-[#DC2626] mt-1">Rs. {outstanding.toLocaleString("en-IN")}</div></div>
          </div>

          <div className="card p-3 flex gap-3 items-center">
            <SearchBox value={q} onChange={setQ} placeholder="Search student..." />
            <span className="text-xs font-bold text-[#7A6F68] hidden sm:block">{filteredStudents.length} students</span>
          </div>

          <div className="j-table-wrap">
            <table className="j-table">
              <thead><tr><th>Student Name</th><th>Class</th><th>Expected Fee</th><th>Total Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredStudents.map(s=>{
                  const bal=s.totalFees - s.feesPaid;
                  return (
                    <tr key={s.id}>
                      <td className="font-bold flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-[#DCFCE7] grid place-items-center text-[#16A34A] text-xs font-black">{s.name.charAt(0)}</span>{s.name}</td>
                      <td><span className="badge badge-blue">{s.className}</span></td>
                      <td>Rs. {s.totalFees.toLocaleString("en-IN")}</td>
                      <td className="text-[#16A34A] font-bold">Rs. {s.feesPaid.toLocaleString("en-IN")}</td>
                      <td className={`${bal>0? "text-[#DC2626]":"text-[#16A34A]"} font-bold`}>Rs. {bal.toLocaleString("en-IN")}</td>
                      <td><span className={`badge ${bal<=0? "badge-green":"badge-red"}`}>{bal<=0? "Completed":"Pending"}</span></td>
                      <td><button onClick={()=> setStudentFeeOpen(s)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"><IconReceipt size={12}/> View Ledger</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="Academic Faculty Salary" && (
        <div className="space-y-3">
          <div className="card p-3 flex gap-3 items-center"><SearchBox value={q} onChange={setQ} placeholder="Search faculty..." /></div>
          <div className="j-table-wrap">
            <table className="j-table">
              <thead><tr><th>Employee Name</th><th>Designation</th><th>Base Salary</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredFaculty.map(f=>{
                  const recs = salaryRecords.filter(r=> r.personId===f.id);
                  const paid = recs.reduce((a,b)=> a+b.amount,0);
                  const status = paid>=f.baseSalary? "Paid": paid>0? "Partial":"Pending";
                  return (
                    <tr key={f.id}>
                      <td className="font-bold">{f.name}<div className="text-xs text-[#98A2B3]">{f.designation}</div></td>
                      <td className="text-xs">{f.className}</td>
                      <td>Rs. {f.baseSalary.toLocaleString("en-IN")}</td>
                      <td className="font-bold text-[#16A34A]">Rs. {paid.toLocaleString("en-IN")}</td>
                      <td><span className={`badge ${status==="Paid"?"badge-green": status==="Partial"?"badge-orange":"badge-red"}`}>{status}</span></td>
                      <td><button onClick={()=> setSalaryOpen({id:f.id, name:f.name, type:"faculty"})} className="btn-secondary !py-1.5 !px-3 text-xs">View Ledger</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="Staff Faculty Salary" && (
        <div className="space-y-3">
          <div className="card p-3 flex gap-3 items-center"><SearchBox value={q} onChange={setQ} placeholder="Search staff..." /></div>
          <div className="j-table-wrap">
            <table className="j-table">
              <thead><tr><th>Employee Name</th><th>Role</th><th>Base Salary</th><th>Paid</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredStaff.map(s=>{
                  const recs = salaryRecords.filter(r=> r.personId===s.id);
                  const paid = recs.reduce((a,b)=> a+b.amount,0);
                  const status = paid>=s.baseSalary? "Paid": paid>0? "Partial":"Pending";
                  return (
                    <tr key={s.id}>
                      <td className="font-bold">{s.name}<div className="text-xs text-[#98A2B3]">{s.role}</div></td>
                      <td className="text-xs">{s.role}</td>
                      <td>Rs. {s.baseSalary.toLocaleString("en-IN")}</td>
                      <td className="font-bold text-[#16A34A]">Rs. {paid.toLocaleString("en-IN")}</td>
                      <td><span className={`badge ${status==="Paid"?"badge-green": status==="Partial"?"badge-orange":"badge-red"}`}>{status}</span></td>
                      <td><button onClick={()=> setSalaryOpen({id:s.id, name:s.name, type:"staff"})} className="btn-secondary !py-1.5 !px-3 text-xs">View Ledger</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {studentFeeOpen && <StudentFeeProfile student={studentFeeOpen} transactions={transactions.filter(t=> t.studentId===studentFeeOpen.id)} onClose={()=> setStudentFeeOpen(null)} onViewReceipt={(tx:any)=> setReceiptOpen({tx, student:studentFeeOpen})} onSave={(data:any)=>{
        const tx=collectFee({studentId:studentFeeOpen.id, date:data.date, amount:data.amount, paymentMode:data.mode, installment:data.installment, description:data.desc, collectedBy: user?.displayName||"Admin", academicYear:studentFeeOpen.academicYear, proofImage:data.proof, utr:data.utr, txnNo:data.txnNo} as any);
        setStudentFeeOpen(null);
        setReceiptOpen({tx, student:students.find(s=> s.id===studentFeeOpen.id) || studentFeeOpen});
      }} />}

      {salaryOpen && <StaffSalaryProfile person={salaryOpen} faculties={faculties} staff={staff} salaryRecords={salaryRecords.filter(r=> r.personId===salaryOpen.id)} onClose={()=> setSalaryOpen(null)} onCommit={(data:any)=>{
        addSalary({personId:salaryOpen.id, personType:salaryOpen.type, amount:data.amount, month:data.month, status:"Paid", date:data.date, proofImage:data.proof, utr:data.utr, mode:data.mode} as any);
        setSalaryOpen(null);
      }} />}

      {receiptOpen && <FeeReceiptPopup tx={receiptOpen.tx} student={receiptOpen.student} transactions={transactions.filter(t=> t.studentId===receiptOpen.student.id)} settings={settings} onClose={()=> setReceiptOpen(null)} />}
    </div>
  );
}

// Student Fee Profile - green header like 005728 & 014031
function StudentFeeProfile({student, transactions, onClose, onSave, onViewReceipt}:{student:any; transactions:any[]; onClose:()=>void; onSave:(d:any)=>void; onViewReceipt?:(tx:any)=>void}){
  const bal=student.totalFees - student.feesPaid;
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [mode,setMode]=useState("Cash");
  const [install,setInstall]=useState("Full Payment");
  const [desc,setDesc]=useState("Tuition / Term Fee");
  const [proof,setProof]=useState<string>("");
  const [utr,setUtr]=useState("");
  const [err,setErr]=useState("");
  const isOnline = /Online|UPI|Transfer/i.test(mode);
  const fileRef=useRef<HTMLInputElement>(null);
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>2*1024*1024){ setErr("Proof too large (max 2MB)"); return; }
    const r=new FileReader(); r.onload=()=> setProof(r.result as string); r.readAsDataURL(f);
  };
  const save=()=>{
    const amt=Number(amount);
    if(!amt || amt<=0) return setErr("Enter valid amount");
    if(amt>bal) return setErr(`Amount exceeds remaining Rs. ${bal.toLocaleString("en-IN")}`);
    if(isOnline && !proof && !utr) return setErr("For Online payments, upload proof screenshot or enter UTR/TXN No. compulsory");
    onSave({amount:amt, date:new Date(date).toISOString(), mode, installment:install, desc, proof, utr, txnNo:utr});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[880px] max-h-[92vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.28)] border flex flex-col" onClick={e=> e.stopPropagation()}>
        <div className="bg-[#22C55E] text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div><div className="font-black text-lg tracking-wide">STUDENT FEE PROFILE</div><div className="text-xs font-bold opacity-90">{student.name} - Class {student.className}</div></div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline bg-white/20 px-3 py-1 rounded-full text-xs font-black tracking-widest">PRAJWAL(ADMIN)</span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white hover:text-[#22C55E] transition">X</button>
          </div>
        </div>
        <div className="flex-1 overflow-auto grid md:grid-cols-[1.1fr_1.2fr] gap-0">
          <div className="p-5 bg-[#FEFEFE] border-r">
            <div className="text-[11px] font-black tracking-[0.14em] text-[#22C55E] flex items-center gap-2">◎ FEE COLLECTION LEDGER</div>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {transactions.length===0? <div className="text-sm text-[#98A2B3] text-center py-10">No receipts yet</div> :
                transactions.map((t:any)=>(
                  <div key={t.id} className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="font-black text-lg">Rs. {t.amount.toLocaleString("en-IN")}</div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${/Online/i.test(t.paymentMode)? "bg-[#DCFCE7] text-[#16A34A]":"bg-[#DCFCE7] text-[#16A34A]"}`}>{t.paymentMode?.includes("Online") ? "Online" : t.paymentMode==="Cash" ? "Cash" : t.paymentMode} Receipt</span>
                    </div>
                    <div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">{t.paymentMode} RECEIPT</div>
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span className="text-[#7A6F68]">{new Date(t.date).toLocaleDateString("en-GB")}</span>
                      <button onClick={()=> onViewReceipt?.(t)} className="text-[#16A34A] font-black flex items-center gap-1 hover:text-[#15803D] hover:underline bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#86EFAC] transition">
                        <IconReceipt size={12}/> Receipt
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-4 text-center"><div className="text-[10px] font-black tracking-widest text-[#3B82F6]">TOTAL COURSE FEE</div><div className="text-xl font-black mt-1">Rs. {student.totalFees.toLocaleString("en-IN")}</div></div>
              <div className="bg-[#FEF2F2] border border-red-100 rounded-xl p-4 text-center"><div className="text-[10px] font-black tracking-widest text-[#DC2626]">REMAINING BALANCE</div><div className="text-xl font-black mt-1 text-[#DC2626]">Rs. {bal.toLocaleString("en-IN")}</div></div>
            </div>
            <div className="mt-5 text-[11px] font-black tracking-[0.14em] text-[#22C55E]">◎ RECORD FEE PAYMENT</div>
            <div className="mt-3 space-y-3">
              {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-xs p-2.5 rounded-xl">{err}</div>}
              <div className="grid grid-cols-2 gap-3">
                <label><span className="j-label !text-[10px]">AMOUNT COLLECTED (Rs. )</span><input type="number" className="j-input !h-10" value={amount} onChange={e=> setAmount(e.target.value)} placeholder="" /></label>
                <label><span className="j-label !text-[10px]">COLLECTION DATE</span><input type="date" className="j-input !h-10" value={date} onChange={e=> setDate(e.target.value)} /></label>
              </div>
              <label><span className="j-label !text-[10px]">COLLECTION MODE</span>
                <select className="j-select !h-10" value={mode} onChange={e=> setMode(e.target.value)}>
                  <option>Cash</option><option>Online (UPI)</option>
                </select>
              </label>
              {isOnline && (
                <div className="space-y-2">
                  <div onClick={()=> fileRef.current?.click()} className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#FF6B1A] hover:bg-[#FFF7ED] transition">
                    {proof? <img src={proof} alt="proof" className="max-h-32 mx-auto rounded-lg" /> : <div className="text-xs font-bold text-[#98A2B3]">Click to upload transaction proof</div>}
                    <div className="text-[10px] text-[#98A2B3] mt-1">{proof? "Click to change":"Screenshot / UTR proof required for Online"}</div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  <label><span className="j-label !text-[10px]">UTR / TXN No. (compulsory for Online)</span><input className="j-input !h-10" value={utr} onChange={e=> setUtr(e.target.value)} placeholder="Enter UTR or Transaction ID" /></label>
                </div>
              )}
              <label><span className="j-label !text-[10px]">INSTALLMENT</span><select className="j-select !h-10" value={install} onChange={e=> setInstall(e.target.value)}><option>Full Payment</option><option>Installment 1</option><option>Installment 2</option><option>Installment 3</option></select></label>
              <label><span className="j-label !text-[10px]">DESCRIPTION</span><input className="j-input !h-10" value={desc} onChange={e=> setDesc(e.target.value)} /></label>
              <button onClick={save} className="w-full bg-[#22C55E] text-white font-black py-3 rounded-xl shadow-[0_6px_16px_rgba(34,197,94,0.28)] hover:bg-[#16A34A] transition">Save Fee Record</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Staff Salary Profile - orange header like 010133
function StaffSalaryProfile({person, faculties, staff, salaryRecords, onClose, onCommit}:{person:{id:string; name:string; type:"faculty"|"staff"}; faculties:any[]; staff:any[]; salaryRecords:any[]; onClose:()=>void; onCommit:(d:any)=>void}){
  const info = person.type==="faculty" ? faculties.find(f=> f.id===person.id) : staff.find(s=> s.id===person.id);
  const monthly=info?.baseSalary||20000;
  const totalPaid=salaryRecords.reduce((a,b)=> a+b.amount,0);
  const [amount,setAmount]=useState("");
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [mode,setMode]=useState("Cash");
  const [proof,setProof]=useState<string>("");
  const [utr,setUtr]=useState("");
  const [err,setErr]=useState("");
  const isOnline=/Online|UPI|Transfer/i.test(mode);
  const fileRef=useRef<HTMLInputElement>(null);
  const onFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>2*1024*1024){ setErr("Proof too large"); return;}
    const r=new FileReader(); r.onload=()=> setProof(r.result as string); r.readAsDataURL(f);
  };
  const commit=()=>{
    const amt=Number(amount); if(!amt|| amt<=0) return setErr("Enter amount");
    if(isOnline && !proof && !utr) return setErr("For Online, upload proof or enter UTR compulsory");
    onCommit({amount:amt, date:new Date(date).toISOString(), mode, proof, utr, month:date.slice(0,7)});
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[880px] max-h-[92vh] overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.28)] border flex flex-col" onClick={e=> e.stopPropagation()}>
        <div className="bg-[#FF6B1A] text-white px-6 py-4 flex justify-between items-center">
          <div><div className="font-black text-lg">STAFF SALARY PROFILE</div><div className="text-xs font-bold opacity-90">Comprehensive Ledger & Audit Log</div></div>
          <div className="flex items-center gap-3"><span className="hidden sm:inline bg-white/20 px-3 py-1 rounded-full text-xs font-black">PRAJWAL(ADMIN)</span><button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 grid place-items-center hover:bg-white hover:text-[#FF6B1A]">X</button></div>
        </div>
        <div className="flex-1 overflow-auto grid md:grid-cols-[1.1fr_1.2fr] gap-0">
          <div className="p-5 bg-[#FEFEFE] border-r">
            <div className="text-[11px] font-black tracking-[0.14em] text-[#FF6B1A]">◎ TRANSACTION AUDIT TRAIL</div>
            <div className="mt-4 space-y-3 max-h-[420px] overflow-auto pr-1">
              {salaryRecords.length===0? <div className="text-sm text-[#98A2B3] text-center py-10">No salary payments yet</div> :
                salaryRecords.map((r:any)=>(
                  <div key={r.id} className="bg-white border border-black/5 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between"><span className="font-black">Rs. {r.amount.toLocaleString("en-IN")}</span><span className="text-xs font-bold px-2 py-1 rounded-full bg-[#FFEDD5] text-[#C2410C]">{r.mode||"Online"}</span></div>
                    <div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">ONLINE PAYMENT</div>
                    <div className="mt-3 flex justify-between text-xs"><span className="text-[#7A6F68]">{new Date(r.date).toLocaleString("en-GB")}</span>{r.proofImage? <a href={r.proofImage} target="_blank" className="text-[#FF6B1A] font-bold flex items-center gap-1">◎ View Proof</a> : r.utr? <span className="font-mono text-[#FF6B1A] text-xs">{r.utr}</span> : null}</div>
                  </div>
                ))}
            </div>
          </div>
          <div className="p-5 bg-white">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-4 text-center"><div className="text-[10px] font-black tracking-widest text-[#3B82F6]">MONTHLY SALARY</div><div className="text-xl font-black">Rs. {monthly.toLocaleString("en-IN")}</div></div>
              <div className="bg-[#DCFCE7] border border-green-100 rounded-xl p-4 text-center"><div className="text-[10px] font-black tracking-widest text-[#16A34A]">TOTAL PAID</div><div className="text-xl font-black text-[#16A34A]">Rs. {totalPaid.toLocaleString("en-IN")}</div></div>
            </div>
            <div className="mt-5 text-[11px] font-black tracking-[0.14em] text-[#FF6B1A]">◎ RECORD SALARY PAYMENT</div>
            <div className="mt-3 space-y-3">
              {err && <div className="bg-[#FEE2E2] text-[#DC2626] text-xs p-2.5 rounded-xl">{err}</div>}
              <div className="grid grid-cols-2 gap-3">
                <label><span className="j-label !text-[10px]">AMOUNT DISBURSED (Rs. )</span><input type="number" className="j-input !h-10" value={amount} onChange={e=> setAmount(e.target.value)} /></label>
                <label><span className="j-label !text-[10px]">DATE</span><input type="date" className="j-input !h-10" value={date} onChange={e=> setDate(e.target.value)} /></label>
              </div>
              <label><span className="j-label !text-[10px]">MODE</span>
                <select className="j-select !h-10" value={mode} onChange={e=> setMode(e.target.value)}>
                  <option>Cash</option><option>Online (UPI)</option>
                </select>
              </label>
              {isOnline && (
                <div className="space-y-2">
                  <div onClick={()=> fileRef.current?.click()} className="border-2 border-dashed border-orange-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#FF6B1A] hover:bg-[#FFF7ED] transition">
                    {proof? <img src={proof} alt="proof" className="max-h-32 mx-auto rounded-lg" /> : <div className="text-xs font-bold text-[#98A2B3] flex items-center justify-center gap-2"><IconCamera size={16}/> Click to upload transaction proof</div>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  <label><span className="j-label !text-[10px]">UTR / TXN No. (compulsory for Online)</span><input className="j-input !h-10" value={utr} onChange={e=> setUtr(e.target.value)} placeholder="Enter UTR" /></label>
                </div>
              )}
              <button onClick={commit} className="w-full bg-[#FF6B1A] text-white font-black py-3 rounded-xl shadow-[0_6px_16px_rgba(255,107,26,0.28)] hover:bg-[#EF5A00] transition">Commit Payment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fee Receipt Popup - uses same jsPDF generator as Fee Receipts page
function FeeReceiptPopup({tx, student, transactions, settings, onClose}:{tx:any; student:any; transactions:any[]; settings:any; onClose:()=>void}){
  const { deleteReceipt } = useStore();
  const bal=student.totalFees - student.feesPaid;
  const recent=[tx, ...transactions.filter((t:any)=> t.id!==tx.id)].slice(0,5);
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [contentH, setContentH] = useState(1123);
  const pinchRef = useRef<{dist:number; zoom:number} | null>(null);
  const scale = Math.min(3, Math.max(0.45, baseScale * zoom));
  useEffect(()=>{
    const update=()=>{
      const el=wrapperRef.current;
      if(!el) return;
      const containerW=el.clientWidth;
      const a4W=794;
      setBaseScale(Math.min(1, containerW / a4W));
    };
    update();
    window.addEventListener("resize", update);
    return ()=> window.removeEventListener("resize", update);
  },[]);
  useEffect(()=>{
    const el=printRef.current;
    if(!el) return;
    const upd=()=> setContentH(el.scrollHeight || 1123);
    upd();
    const ro=new ResizeObserver(upd);
    ro.observe(el);
    return ()=> ro.disconnect();
  },[scale]);
  const onTouchStart = (e:React.TouchEvent)=>{
    if(e.touches.length===2){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      pinchRef.current={dist:Math.hypot(dx,dy), zoom};
    }
  };
  const onTouchMove = (e:React.TouchEvent)=>{
    if(e.touches.length===2 && pinchRef.current){
      const dx=e.touches[0].clientX-e.touches[1].clientX;
      const dy=e.touches[0].clientY-e.touches[1].clientY;
      const dist=Math.hypot(dx,dy);
      const factor=dist/pinchRef.current.dist;
      setZoom(Math.min(3, Math.max(0.5, pinchRef.current.zoom*factor)));
    }
  };
  const onTouchEnd = ()=>{ pinchRef.current=null; };
  const handlePrint=async()=>{
    await printReceiptPDF({ tx, student, transactions, settings });
  };
  const handleDownload=async()=>{
    await downloadReceiptPDF({ tx, student, transactions, settings });
  };
  const handleShare=async()=>{
    await shareReceiptPDF({ tx, student, transactions, settings });
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-[#F3F4F6] rounded-2xl w-full max-w-[900px] max-h-[92vh] overflow-auto shadow-[0_24px_64px_rgba(0,0,0,0.28)] relative" onClick={e=> e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border shadow-lg grid place-items-center z-20 hover:bg-[#FEE2E2] font-black">X</button>
        <div className="sticky top-0 bg-white border-b px-4 py-3 pr-12 flex flex-wrap gap-2 justify-between items-center z-10">
          <div className="text-sm font-black">Fee Receipt - {tx.receiptNo}</div>
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint} className="btn-secondary !py-2 text-xs">Print A4</button>
            <button onClick={handleDownload} className="btn-primary !py-2 text-xs">Download PDF</button>
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              <button onClick={()=> setZoom(z=>Math.max(0.5,z-0.2))} className="w-7 h-7 rounded bg-gray-100 grid place-items-center font-black">-</button>
              <span className="text-xs font-bold w-10 text-center">{Math.round(scale*100)}%</span>
              <button onClick={()=> setZoom(z=>Math.min(3,z+0.2))} className="w-7 h-7 rounded bg-gray-100 grid place-items-center font-black">+</button>
              {zoom!==1 && <button onClick={()=> setZoom(1)} className="text-xs font-bold text-[#FF6B1A] ml-1">Reset</button>}
            </div>
          </div>
        </div>
        <div ref={wrapperRef} className="p-2 overflow-auto" style={{touchAction:"pan-x pan-y pinch-zoom", WebkitOverflowScrolling:"touch"}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{width:`${794*scale}px`, height:`${contentH*scale}px`, margin:"0 auto", position:"relative"}}>
        <div ref={printRef} className="bg-white shadow-lg absolute top-0 left-0" style={{width:"210mm", minHeight:"297mm", padding:"12mm", boxSizing:"border-box", transform:`scale(${scale})`, transformOrigin:"top left"}}>
          <div className="relative z-10">
            <img src="/school-logo.png" alt="logo" className="w-[68px] h-[68px] rounded-full object-cover border-2 border-[#FF6B1A] bg-white" />
            <div className="flex-1">
              <div className="font-black text-[16px]">Jijau English School</div>
              <div className="text-[11px] font-bold text-[#7A6F68]">TUNGI (BK)</div>
              <div className="text-[10px] text-[#98A2B3]">Tungi BK, Maharashtra, India</div>
              <div className="text-[10px] text-[#98A2B3]">+91 9890522763</div>
            </div>
            <div className="text-right">
              <span className="bg-[#FF6B1A] text-white text-[10px] font-black px-3 py-1.5 rounded-full">FEE RECEIPT</span>
              <div className="font-mono font-black text-xs mt-1">{tx.receiptNo}</div>
              <div className="text-[10px] text-[#98A2B3]">{new Date(tx.date).toLocaleString("en-GB")}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">STUDENT NAME</div><div className="font-bold text-sm">{student.name}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">CLASS</div><div className="font-bold">{student.className}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">ACADEMIC YEAR</div><div className="font-bold">{tx.academicYear}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">INSTALLMENT</div><div className="font-bold">{tx.installment}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">PAYMENT MODE</div><div className="font-bold">{tx.paymentMode}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">TXN NO.</div><div className="font-mono font-bold">{tx.txnNo|| tx.utr|| "-"}</div></div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs font-bold tracking-widest text-[#98A2B3]">DESCRIPTION</div>
            <div className="text-xs font-bold tracking-widest text-[#98A2B3]">AMOUNT</div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm font-bold">{tx.description}</span>
            <span className="text-sm font-black">Rs. {tx.amount.toLocaleString("en-IN")}</span>
          </div>
          <div className="mt-3 border-t border-dashed pt-3 flex justify-between items-center">
            <span className="font-black">Amount Received</span>
            <span className="text-3xl font-black text-[#FF6B1A]">Rs. {tx.amount.toLocaleString("en-IN")}</span>
           </div>
           <div className="grid grid-cols-3 gap-2 mt-4">
             <div className="bg-[#F9FAFB] p-3 rounded-xl text-center border"><div className="text-[10px] font-bold">TOTAL FEES</div><div className="font-black text-base">Rs. {student.totalFees.toLocaleString("en-IN")}</div></div>
             <div className="bg-[#DCFCE7] p-3 rounded-xl text-center border border-green-200"><div className="text-[10px] font-bold text-[#16A34A]">TOTAL PAID</div><div className="font-black text-[#16A34A] text-base">Rs. {student.feesPaid.toLocaleString("en-IN")}</div></div>
             <div className="bg-[#FEE2E2] p-3 rounded-xl text-center border border-red-200"><div className="text-[10px] font-bold text-[#DC2626]">REMAINING</div><div className="font-black text-[#DC2626] text-base">Rs. {Math.max(0,bal).toLocaleString("en-IN")}</div></div>
          </div>
           <div className="mt-5 text-xs font-black tracking-widest text-[#98A2B3]">FEE PAYMENT HISTORY</div>
           <div className="mt-2 space-y-2">
             {recent.map((t:any)=>(
               <div key={t.id} className="flex justify-between text-sm bg-[#FFFBF0] p-3 rounded-lg border border-orange-100">
                 <span className="text-[#5A4A42] font-medium">{new Date(t.date).toLocaleString("en-GB")}</span>
                 <span className="font-black text-[#FF6B1A]">{t.description}</span>
                 <span className="font-black text-sm">Rs. {t.amount.toLocaleString("en-IN")}</span>
               </div>
             ))}
          </div>
          <div className="mt-6 flex justify-between text-[11px] text-[#98A2B3] border-t pt-4">
            <span>This receipt confirms the payment recorded in the school management system.</span>
           <span className="text-right font-bold text-[#1A2B3C]">AUTHORISED SIGNATURE<div className="mt-10 border-t border-[#1A2B3C] w-[160px] ml-auto pt-2 font-black text-center">Dnyaneshwar Ingole</div></span>
           </div>
         </div>
         </div>
         </div>
        <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2 sticky bottom-0 bg-[#F3F4F6] border-t">
           <button onClick={handlePrint} className="flex-1 btn-primary">Print</button>
           <button onClick={handleShare} className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">💬 WhatsApp PDF</button>
           <button onClick={handleDownload} className="flex-1 btn-secondary">Download PDF</button>
           <button onClick={()=> { if(confirm("Delete receipt?")){ deleteReceipt(tx.receiptNo); onClose(); } }} className="bg-white border border-red-200 text-[#DC2626] font-black px-3 py-3 rounded-xl">Delete</button>
         </div>
      </div>
    </div>
  );
}



