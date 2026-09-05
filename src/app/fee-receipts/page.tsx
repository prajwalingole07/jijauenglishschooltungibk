"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { SearchBox } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { IconWhatsapp } from "@/components/IOSIcons";
import { generateReceiptPDF, downloadReceiptPDF, shareReceiptPDF, printReceiptPDF } from "@/lib/receiptPdf";

export default function FeeReceipts(){
  const { transactions, students, settings, deleteReceipt } = useStore();
  const { user } = useAuth() as any;
  if(user?.role==="teacher"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Access Restricted</div>
        <div className="text-sm text-[#7A6F68]">Fee receipts are only for Admin/Founder. Teachers see only Dashboard.</div>
        <a href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</a>
      </div>
    );
  }
  const [q,setQ]=useState("");
  const [mode,setMode]=useState("All Modes");
  const [preview,setPreview]=useState<any|null>(null);

  const filtered = transactions.filter(t=>{
    const s=students.find(x=> x.id===t.studentId);
    const okQ = !q || `${s?.name||""} ${t.receiptNo}`.toLowerCase().includes(q.toLowerCase());
    const okM = mode==="All Modes" || t.paymentMode===mode || (mode==="Online (UPI)" && /Online|UPI/i.test(t.paymentMode));
    return okQ && okM;
  });

  const handleDirectPrint = (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    printReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
  };
  const handleDirectDownload = (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    downloadReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
  };
  const handleDirectShare = (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    shareReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
  };

  const totalCollected = transactions.reduce((a,b)=> a+b.amount,0);
  const cash = transactions.filter(t=> t.paymentMode==="Cash").reduce((a,b)=> a+b.amount,0);
  const online = totalCollected - cash;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">Fee Receipts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Manage, print, download, and share fee receipts for Jijau English School.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-white/90 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 shadow-sm self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          {transactions.length} Total Receipts
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="card p-5 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm rounded-2xl">
          <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase">Receipts Issued</div>
          <div className="text-3xl font-black text-slate-800 mt-1.5">{transactions.length}</div>
          <div className="text-xs text-slate-500 mt-1">Verified transactions recorded</div>
        </div>
        <div className="card p-5 bg-white/90 backdrop-blur-sm border border-emerald-200/80 shadow-sm rounded-2xl">
          <div className="text-[11px] font-black tracking-wider text-emerald-600 uppercase">Total Amount Collected</div>
          <div className="text-3xl font-black text-emerald-600 mt-1.5">Rs. {totalCollected.toLocaleString("en-IN")}</div>
          <div className="text-xs text-emerald-700/70 mt-1">Academic Year 2026-2027</div>
        </div>
        <div className="card p-5 bg-white/90 backdrop-blur-sm border border-orange-200/80 shadow-sm rounded-2xl">
          <div className="text-[11px] font-black tracking-wider text-orange-600 uppercase">Cash / Online Split</div>
          <div className="text-sm font-bold text-slate-700 mt-2 flex justify-between">
            <span>Cash: Rs. {cash.toLocaleString("en-IN")}</span>
            <span>UPI: Rs. {online.toLocaleString("en-IN")}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all" style={{width: totalCollected? `${(cash/totalCollected)*100}%`:"0%"}} />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#FF6B1A] to-[#FF8A2A] rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-wrap gap-2.5 items-center justify-between">
        <div className="text-white font-extrabold text-sm sm:text-base flex items-center gap-2">
          <span>🧾</span>
          <span>Receipt Directory</span>
        </div>
        <div className="flex-1 min-w-[200px] max-w-[380px]">
          <SearchBox value={q} onChange={setQ} placeholder="Search student name or receipt #" />
        </div>
        <select value={mode} onChange={e=> setMode(e.target.value)} className="j-select !w-auto !h-10 bg-white text-xs sm:text-sm font-bold text-slate-700 rounded-xl">
          <option>All Modes</option>
          <option>Cash</option>
          <option>Online (UPI)</option>
        </select>
      </div>

      {filtered.length===0? (
        <div className="card p-12 text-center text-slate-400 bg-white/80 rounded-2xl border border-dashed border-slate-300">
          <div className="text-3xl mb-2">📄</div>
          <div className="font-bold text-slate-600">No receipts found</div>
          <div className="text-xs text-slate-400 mt-1">Collect a fee from the Fees & Salary section to generate receipts.</div>
        </div>
      ):(
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tx=>{
            const s=students.find(x=> x.id===tx.studentId);
            return (
              <div key={tx.id} className="card p-4 sm:p-5 space-y-3.5 bg-white/95 border border-slate-200/90 shadow-sm hover:shadow-md transition-all rounded-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-black text-slate-800 text-base">{s?.name||"Unknown"}</div>
                    <div className="text-xs font-semibold text-slate-500 mt-0.5">{s?.className||"Class -"} • {tx.installment}</div>
                  </div>
                  <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full border ${/Online|UPI/i.test(tx.paymentMode)? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                    {tx.paymentMode}
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                  <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Receipt No.</div>
                  <div className="font-mono font-black text-sm text-slate-800 tracking-wide mt-0.5">{tx.receiptNo}</div>
                  <div className="text-xs text-slate-500 mt-1">{new Date(tx.date).toLocaleDateString("en-GB")} at {new Date(tx.date).toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"})}</div>
                </div>
                
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Amount Paid</div>
                    <div className="text-2xl font-black text-emerald-600">Rs. {tx.amount.toLocaleString("en-IN")}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <span className="font-bold text-slate-700">{tx.description || "Tuition Fee"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  <button onClick={()=> setPreview(tx)} className="btn-secondary !py-2 text-xs font-bold text-center">View</button>
                  <button onClick={()=> handleDirectDownload(tx)} className="btn-secondary !py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 flex items-center justify-center gap-1">📥 Download</button>
                  <button onClick={()=> handleDirectPrint(tx)} className="btn-secondary !py-2 text-xs font-bold text-center">Print</button>
                  <button onClick={()=> handleDirectShare(tx)} className="btn-primary !py-2 text-xs font-bold flex items-center justify-center gap-1"><IconWhatsapp size={14}/> WhatsApp</button>
                </div>

                <div className="border-t border-slate-100 pt-2 flex justify-end">
                  <button onClick={()=> { if(confirm(`Delete receipt ${tx.receiptNo}? This will adjust student balance.`)) deleteReceipt(tx.receiptNo); }} className="text-xs font-bold text-rose-500 hover:text-rose-700 transition">Delete Receipt</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && <ReceiptPreview tx={preview} student={students.find(s=> s.id===preview.studentId)} settings={settings} transactions={transactions.filter(t=> t.studentId===preview.studentId)} onClose={()=> setPreview(null)} />}
    </div>
  );
}

function ReceiptPreview({tx, student, settings, transactions, onClose}:{tx:any; student:any; settings:any; transactions:any[]; onClose:()=>void}){
  const bal = student? student.totalFees - student.feesPaid : 0;
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

  const handlePrint = ()=> printReceiptPDF({ tx, student, transactions, settings });
  const handleDownload = ()=> downloadReceiptPDF({ tx, student, transactions, settings });
  const handleShare = ()=> shareReceiptPDF({ tx, student, transactions, settings });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-slate-100 rounded-2xl w-full max-w-[900px] max-h-[92dvh] overflow-auto shadow-[0_24px_64px_rgba(0,0,0,0.28)] relative border border-white" onClick={e=> e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md grid place-items-center z-20 hover:bg-rose-50 hover:text-rose-600 font-black transition">✕</button>
        
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 pr-12 flex flex-wrap gap-2 justify-between items-center z-10">
          <div className="text-sm font-black text-slate-800">Fee Receipt — {tx.receiptNo}</div>
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={handleDownload} className="btn-primary !py-2 text-xs flex items-center gap-1">📥 Download PDF</button>
            <button onClick={handleShare} className="bg-[#25D366] text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 hover:opacity-90"><IconWhatsapp size={14}/> WhatsApp</button>
            <button onClick={handlePrint} className="btn-secondary !py-2 text-xs">Print A4</button>
            <div className="hidden sm:flex items-center gap-1 ml-2 border-l pl-2">
              <button onClick={()=> setZoom(z=>Math.max(0.5,z-0.2))} className="w-7 h-7 rounded bg-slate-100 grid place-items-center font-black">-</button>
              <span className="text-xs font-bold w-10 text-center">{Math.round(scale*100)}%</span>
              <button onClick={()=> setZoom(z=>Math.min(3,z+0.2))} className="w-7 h-7 rounded bg-slate-100 grid place-items-center font-black">+</button>
              {zoom!==1 && <button onClick={()=> setZoom(1)} className="text-xs font-bold text-[#FF6B1A] ml-1">Reset</button>}
            </div>
          </div>
        </div>

        <div ref={wrapperRef} className="p-3 overflow-auto" style={{touchAction:"pan-x pan-y pinch-zoom", WebkitOverflowScrolling:"touch"}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div style={{width:`${794*scale}px`, height:`${contentH*scale}px`, margin:"0 auto", position:"relative"}}>
            <div ref={printRef} className="bg-white shadow-xl absolute top-0 left-0 rounded-sm" style={{width:"210mm", minHeight:"297mm", padding:"12mm", boxSizing:"border-box", transform:`scale(${scale})`, transformOrigin:"top left"}}>
              <div className="flex gap-4 pb-4 border-b-[3px] border-[#FF6B1A] items-center">
                <img src="/school-logo.png" alt="logo" className="w-[72px] h-[72px] rounded-full object-cover border-2 border-[#FF6B1A] bg-white shadow-sm" />
                <div className="flex-1">
                  <div className="font-black text-xl text-slate-800 tracking-tight">{settings.schoolName || "Jijau English School"}</div>
                  <div className="text-xs font-black tracking-widest text-[#FF6B1A]">{settings.schoolSub || "TUNGI (BK)"}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{settings.address || "Tungi BK, Maharashtra, India"} • {settings.phone || "+91 9890522763"}</div>
                </div>
                <div className="text-right">
                  <span className="bg-[#FF6B1A] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-sm tracking-wider">FEE RECEIPT</span>
                  <div className="font-mono font-black text-sm text-slate-800 mt-1.5">{tx.receiptNo}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.date).toLocaleString("en-GB")}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Name</div>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{student?.name || "-"}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class Admitted</div>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{student?.className || "-"}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Academic Year</div>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{tx.academicYear || "2026-2027"}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Payment Mode</div>
                  <div className="font-black text-slate-800 text-sm mt-0.5">{tx.paymentMode} {tx.utr ? `(${tx.utr})` : ""}</div>
                </div>
              </div>

              <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 flex justify-between text-xs font-black text-slate-600 uppercase tracking-wider">
                  <span>Description</span>
                  <span>Amount</span>
                </div>
                <div className="p-4 flex justify-between items-center border-b border-slate-100">
                  <span className="font-bold text-slate-700 text-sm">{tx.description || "Tuition Fee"} ({tx.installment})</span>
                  <span className="font-black text-slate-800 text-base">Rs. {Number(tx.amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-orange-50/50 p-4 flex justify-between items-center">
                  <span className="font-black text-slate-800 text-base">Amount Received</span>
                  <span className="font-black text-2xl text-[#FF6B1A]">Rs. {Number(tx.amount).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Total Fees</div>
                  <div className="font-black text-slate-700 text-base mt-0.5">Rs. {(student?.totalFees || 0).toLocaleString("en-IN")}</div>
                </div>
                <div className="border border-emerald-200 rounded-xl p-3 text-center bg-emerald-50/50">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase">Total Paid</div>
                  <div className="font-black text-emerald-700 text-base mt-0.5">Rs. {(student?.feesPaid || 0).toLocaleString("en-IN")}</div>
                </div>
                <div className="border border-rose-200 rounded-xl p-3 text-center bg-rose-50/50">
                  <div className="text-[10px] font-bold text-rose-500 uppercase">Remaining</div>
                  <div className="font-black text-rose-600 text-base mt-0.5">Rs. {Math.max(0, bal).toLocaleString("en-IN")}</div>
                </div>
              </div>

              <div className="mt-12 flex justify-between items-end pt-8 border-t border-dashed border-slate-200 text-xs text-slate-500">
                <div>
                  <div>Generated via Jijau Portal</div>
                  <div className="font-mono text-[10px] text-slate-400 mt-0.5">{tx.receiptNo}</div>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-black text-slate-700">Dnyaneshwar Ingole</div>
                  <div className="text-[10px] text-slate-400 uppercase">Authorised Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
