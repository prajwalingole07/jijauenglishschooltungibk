"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { SearchBox } from "@/components/UI";
import { useAuth } from "@/lib/auth";
import { IconWhatsapp } from "@/components/IOSIcons";
import { generateReceiptPDF } from "@/lib/receiptPdf";
import { saveGeneratedPdf } from "@/lib/pdfDownload";

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

  const handleDirectPrint = async (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    const doc = await generateReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
    const blob:any = doc.output("blob");
    const url=URL.createObjectURL(blob);
    const w=window.open(url,"_blank");
    if(w) w.onload=()=> setTimeout(()=> w.print(),300);
  };
  const handleDirectDownload = async (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    const doc = await generateReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
    await saveGeneratedPdf(doc, `${tx.receiptNo}.pdf`);
  };
  const handleDirectShare = async (tx:any)=>{
    const s=students.find(x=> x.id===tx.studentId);
    const doc = await generateReceiptPDF({ tx, student:s, transactions: transactions.filter((t:any)=> t.studentId===tx.studentId), settings });
    const fileName = `${tx.receiptNo}.pdf`;
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if(isNative){
      try{
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");
        const base64 = doc.output("datauristring").split(",")[1];
        try{ await Filesystem.requestPermissions(); }catch{}
        const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
        await Share.share({ title:`Fee Receipt ${tx.receiptNo}`, text:`Fee Receipt for ${s?.name} - Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, url: res.uri, dialogTitle: "Share via WhatsApp" });
        return;
      }catch{}
    }
    const blob:any = doc.output("blob");
    const file=new File([blob], fileName,{type:"application/pdf"});
    if(typeof navigator.canShare === "function" && (navigator as any).canShare({files:[file]})){
      try{ await (navigator as any).share({ title:`Fee Receipt ${tx.receiptNo}`, text:`Fee Receipt for ${s?.name} - Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, files:[file]}); return; }catch{}
    }
    const msg=`*${settings.schoolName}*%0AFee Receipt: ${tx.receiptNo}%0AStudent: ${s?.name}%0AAmount: Rs. ${Number(tx.amount).toLocaleString("en-IN")}%0ADate: ${new Date(tx.date).toLocaleDateString("en-GB")}`;
    window.open(`https://wa.me/?text=${msg}`,"_blank");
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=fileName; a.click();
  };

  const totalCollected = transactions.reduce((a,b)=> a+b.amount,0);
  const cash = transactions.filter(t=> t.paymentMode==="Cash").reduce((a,b)=> a+b.amount,0);
  const online = totalCollected - cash;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">FEE RECEIPTS</h1>
        <p className="text-sm text-[#7A6F68]">Every issued fee receipt for JIJAU ENGLISH SCHOOL TUNGI (BK), ready to preview, print or share.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5"><div className="text-xs font-bold tracking-[0.12em] text-[#9A6A52]">TOTAL RECEIPTS ISSUED</div><div className="text-3xl font-black mt-1">{transactions.length}</div></div>
        <div className="card p-5 border-l-4 border-l-[#16A34A]"><div className="text-xs font-bold tracking-[0.12em] text-[#16A34A]">TOTAL AMOUNT COLLECTED</div><div className="text-3xl font-black text-[#16A34A] mt-1">Rs. {totalCollected.toLocaleString("en-IN")}</div></div>
        <div className="card p-5"><div className="text-xs font-bold tracking-[0.12em] text-[#9A6A52]">CASH / ONLINE SPLIT</div><div className="text-sm font-bold mt-2">Cash Rs. {cash.toLocaleString("en-IN")} - Online Rs. {online.toLocaleString("en-IN")}</div><div className="w-full h-2 bg-[#FFF1E6] rounded-full mt-3 overflow-hidden"><div className="h-full bg-[#FF6B1A]" style={{width: totalCollected? `${(cash/totalCollected)*100}%`:"0%"}} /></div></div>
      </div>

      <div className="bg-[#FF6B1A] rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="text-white font-extrabold">All Fee Receipts</div>
        <div className="flex-1 min-w-[220px] max-w-[360px]"><SearchBox value={q} onChange={setQ} placeholder="Search by student or receipt number" /></div>
        <select value={mode} onChange={e=> setMode(e.target.value)} className="j-select !w-auto bg-white">
          <option>All Modes</option><option>Cash</option><option>Online (UPI)</option>
        </select>
      </div>

      {filtered.length===0? (
        <div className="card p-10 text-center text-sm text-[#98A2B3]">No receipts. Collect a fee to generate receipt.</div>
      ):(
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(tx=>{
            const s=students.find(x=> x.id===tx.studentId);
            return (
              <div key={tx.id} className="card p-4 space-y-3 card-hover">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-extrabold text-[#1A2B3C]">{s?.name||"Unknown"}</div>
                    <div className="text-xs text-[#98A2B3]">{s?.className||""} - {tx.paymentMode}</div>
                  </div>
                  <span className="badge badge-orange">{tx.paymentMode}</span>
                </div>
                <div className="bg-[#FFF7ED] p-3 rounded-xl">
                  <div className="text-[11px] font-bold tracking-[0.08em] text-[#9A6A52]">RECEIPT NUMBER</div>
                  <div className="font-mono font-black text-sm">{tx.receiptNo}</div>
                  <div className="text-xs text-[#7A6F68] mt-1">{new Date(tx.date).toLocaleString("en-GB")}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-black text-[#16A34A]">Rs. {tx.amount.toLocaleString("en-IN")}</div>
                  <span className="text-xs text-[#98A2B3]">{tx.installment}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={()=> setPreview(tx)} className="btn-secondary !py-2 text-xs">View</button>
                  <button onClick={()=> handleDirectPrint(tx)} className="btn-secondary !py-2 text-xs">Print</button>
                  <button onClick={()=> handleDirectShare(tx)} className="btn-primary !py-2 text-xs flex items-center justify-center gap-1"><IconWhatsapp size={14}/> WhatsApp PDF</button>
                </div>
                <button onClick={()=> { if(confirm(`Delete receipt ${tx.receiptNo}? This will adjust student balance.`)) deleteReceipt(tx.receiptNo); }} className="w-full text-xs font-bold text-[#DC2626] hover:underline">Delete Receipt</button>
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
  const handlePrint = async ()=>{
    const doc = await generateReceiptPDF({ tx, student, transactions, settings });
    const blob: any = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if(w){ w.onload = ()=> setTimeout(()=> w.print(), 300); }
  };
  const handleDownload = async ()=>{
    const doc = await generateReceiptPDF({ tx, student, transactions, settings });
    const safe = (student?.name||'Student').replace(/[^a-zA-Z0-9]+/g,'_').slice(0,40);
    const fileName = `${safe}_${tx.receiptNo}.pdf`;
    await saveGeneratedPdf(doc, fileName);
  };
  const handleShare = async ()=>{
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if(isNative){
      try{
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");
        const doc2 = await generateReceiptPDF({ tx, student, transactions, settings });
        const fileName = `${tx.receiptNo}.pdf`;
        const base64 = doc2.output("datauristring").split(",")[1];
        try{ await Filesystem.requestPermissions(); }catch{}
        const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
        await Share.share({ title: `Fee Receipt ${tx.receiptNo}`, text: `Fee Receipt for ${student?.name} - Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, url: res.uri, dialogTitle: "Share via WhatsApp" });
        return;
      }catch{}
    }
    const doc = await generateReceiptPDF({ tx, student, transactions, settings });
    const blob: any = doc.output("blob");
    const file = new File([blob], `${tx.receiptNo}.pdf`, { type: "application/pdf" });
    if(typeof navigator.canShare === "function" && (navigator as any).canShare({files:[file]})){
      try{ await (navigator as any).share({ title: `Fee Receipt ${tx.receiptNo}`, text: `Fee Receipt for ${student?.name} - Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, files:[file]}); return; }catch{}
    }
    const msg = `*${settings.schoolName}*%0AFee Receipt: ${tx.receiptNo}%0AStudent: ${student?.name}%0AAmount: Rs. ${Number(tx.amount).toLocaleString("en-IN")}%0ADate: ${new Date(tx.date).toLocaleDateString("en-GB")}`;
    window.open(`https://wa.me/?text=${msg}`,"_blank");
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`${tx.receiptNo}.pdf`; a.click();
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
        <div ref={printRef} className="bg-white shadow-lg absolute top-0 left-0" style={{width:"210mm", minHeight:"297mm", padding:"10mm", boxSizing:"border-box", transform:`scale(${scale})`, transformOrigin:"top left"}}>
          <div className="flex gap-3 pb-4 border-b-[3px] border-[#FF6B1A]">
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
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">STUDENT NAME</div><div className="font-bold text-sm">{student?.name}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">CLASS</div><div className="font-bold">{student?.className}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">ACADEMIC YEAR</div><div className="font-bold">{tx.academicYear}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">INSTALLMENT</div><div className="font-bold">{tx.installment}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">PAYMENT MODE</div><div className="font-bold">{tx.paymentMode}</div></div>
            <div className="bg-[#F9FAFB] p-3 rounded-xl border border-black/5"><div className="text-[10px] font-bold tracking-widest text-[#98A2B3]">TXN NO.</div><div className="font-mono font-bold">{(tx as any).txnNo|| (tx as any).utr|| "-"}</div></div>
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
             <div className="bg-[#F9FAFB] p-3 rounded-xl text-center border"><div className="text-[10px] font-bold">TOTAL FEES</div><div className="font-black text-base">Rs. {(student?.totalFees||0).toLocaleString("en-IN")}</div></div>
             <div className="bg-[#DCFCE7] p-3 rounded-xl text-center border border-green-200"><div className="text-[10px] font-bold text-[#16A34A]">TOTAL PAID</div><div className="font-black text-[#16A34A] text-base">Rs. {(student?.feesPaid||0).toLocaleString("en-IN")}</div></div>
             <div className="bg-[#FEE2E2] p-3 rounded-xl text-center border border-red-200"><div className="text-[10px] font-bold text-[#DC2626]">REMAINING</div><div className="font-black text-[#DC2626] text-base">Rs. {Math.max(0,bal).toLocaleString("en-IN")}</div></div>
          </div>
          <div className="mt-5 text-xs font-black tracking-widest text-[#98A2B3]">FEE PAYMENT HISTORY</div>
           <div className="mt-2 space-y-2">
             {transactions.map((t:any)=>(
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
         <div className="p-3 flex gap-2 sticky bottom-0 bg-[#F3F4F6] border-t">
           <button onClick={handlePrint} className="flex-1 btn-primary">Print</button>
           <button onClick={handleShare} className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">💬 WhatsApp PDF</button>
           <button onClick={handleDownload} className="flex-1 btn-secondary">Download PDF</button>
         </div>
      </div>
    </div>
  );
}


