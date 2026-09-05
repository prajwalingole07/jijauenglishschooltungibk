"use client";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { SearchBox, Empty } from "@/components/UI";
import { IconBook, IconCamera } from "@/components/IOSIcons";
import { downloadAdmissionPDF, printAdmissionPDF } from "@/lib/admissionPdf";

export default function AdmissionForms(){
  const { students, settings } = useStore();
  const [q,setQ]=useState("");
  const [view,setView]=useState<any|null>(null);
  const filtered = students.filter(s=> !q || `${s.name} ${s.roll} ${s.className} ${s.parentMobile}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Admission Forms</h1>
          <p className="text-sm text-[#7A6F68]">Official admission records - printable with school header & logo. Data filled from student enrollment.</p>
        </div>
        <div className="text-xs bg-[#FFF7ED] border border-orange-100 px-3 py-2 rounded-xl">
          <span className="font-black text-[#FF6B1A]">{filtered.length}</span> <span className="text-[#7A6F68]">admissions</span>
        </div>
      </div>

      <div className="card p-3 flex gap-3 items-center">
        <SearchBox value={q} onChange={setQ} placeholder="Search by name, roll or class..." />
        <span className="hidden sm:inline text-xs font-bold text-[#7A6F68]">Admission Date kept as record</span>
      </div>

      {filtered.length===0? <Empty title="No admissions found" /> : (
        <div className="j-table-wrap">
          <table className="j-table">
            <thead><tr><th>Admission No</th><th>Student</th><th>Class</th><th>Admission Date</th><th>Contact</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td className="font-mono font-black text-[#FF6B1A]">ADM-{s.roll}-{new Date((s as any).admissionDate || s.createdAt).getFullYear()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#FFF1E6] border border-orange-100 grid place-items-center shrink-0">
                        {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover"/> : <span className="font-black text-[#FF6B1A] text-xs">{s.name.charAt(0)}</span>}
                      </div>
                      <div>
                        <div className="font-bold text-sm">{s.name}</div>
                        <div className="text-xs text-[#98A2B3]">{s.gender} - {s.category}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{s.className}</span></td>
                  <td className="font-mono text-sm font-bold">{(s as any).admissionDate || new Date(s.createdAt).toLocaleDateString("en-GB")}</td>
                  <td className="font-mono text-sm">{s.parentMobile}</td>
                  <td><button onClick={()=> setView(s)} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1"><IconBook size={12}/> View Form</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && <AdmissionFormModal student={view} settings={settings} onClose={()=> setView(null)} />}
    </div>
  );
}

function AdmissionFormModal({student, settings, onClose}:{student:any; settings:any; onClose:()=>void}){
  const printRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const admNo = `ADM-${student.roll}-${new Date((student as any).admissionDate || student.createdAt).getFullYear()}`;
  const admDate = (student as any).admissionDate ? new Date((student as any).admissionDate).toLocaleDateString("en-GB") : new Date(student.createdAt).toLocaleDateString("en-GB");
  const handlePrint = ()=> printAdmissionPDF({ student, settings, admissionNo: admNo, admissionDate: admDate });
  const handleDownload = ()=> downloadAdmissionPDF({ student, settings, admissionNo: admNo, admissionDate: admDate });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [contentH, setContentH] = useState(1123);
  const pinchRef = useRef<{dist:number; zoom:number} | null>(null);
  const effectiveScale = Math.min(3, Math.max(0.45, baseScale * zoom));
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
  },[effectiveScale]);
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
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-[#F3F4F6] rounded-2xl w-full max-w-[860px] max-h-[92vh] overflow-auto shadow-[0_24px_64px_rgba(0,0,0,0.28)] relative" onClick={e=> e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white border shadow-lg grid place-items-center z-20 hover:bg-[#FEE2E2] font-black">X</button>
        <div className="sticky top-0 bg-white border-b px-4 py-3 pr-12 flex flex-wrap gap-2 justify-between items-center z-10">
          <div className="text-sm font-black">Admission Form - {student.name}</div>
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint} className="btn-primary !py-2 text-xs">Print</button>
            <button onClick={handleDownload} className="btn-secondary !py-2 text-xs">Download PDF</button>
            <div className="flex items-center gap-1 ml-2 border-l pl-2">
              <button onClick={()=> setZoom(z=>Math.max(0.5,z-0.2))} className="w-7 h-7 rounded bg-gray-100 grid place-items-center font-black">-</button>
              <span className="text-xs font-bold w-10 text-center">{Math.round(effectiveScale*100)}%</span>
              <button onClick={()=> setZoom(z=>Math.min(3,z+0.2))} className="w-7 h-7 rounded bg-gray-100 grid place-items-center font-black">+</button>
              {zoom!==1 && <button onClick={()=> setZoom(1)} className="text-xs font-bold text-[#FF6B1A] ml-1">Reset</button>}
            </div>
          </div>
        </div>

        <div ref={wrapperRef} className="p-2 overflow-auto" style={{touchAction:"pan-x pan-y pinch-zoom", WebkitOverflowScrolling:"touch"}} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div style={{width:`${794*effectiveScale}px`, height:`${contentH*effectiveScale}px`, margin:"0 auto", position:"relative"}}>
        <div ref={printRef} className="bg-white shadow-lg absolute top-0 left-0" style={{width:"210mm", minHeight:"297mm", padding:"12mm", boxSizing:"border-box", transform:`scale(${effectiveScale})`, transformOrigin:"top left"}}>
          {/* Watermark - blurred logo centered between fees table and seal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-0">
            <img src="/school-logo.png" alt="watermark" className="w-[220px] h-[220px] object-contain opacity-[0.18]" style={{filter:"blur(1px)"}} />
          </div>
          {/* School header - single, centered, round logo with orange border like dashboard */}
          <div className="flex flex-col items-center text-center pb-3 border-b-[3px] border-[#FF6B1A] relative z-10">
            <img src="/school-logo.png" alt="logo" className="w-[78px] h-[78px] rounded-full object-cover border-2 border-[#FF6B1A] bg-white" />
            <div className="font-black text-[18px] leading-none tracking-wide mt-2" style={{color:"#1A2B3C"}}>{settings.schoolName}</div>
            <div className="font-black text-[13px] tracking-[0.14em] text-[#FF6B1A]">{settings.schoolSub}</div>
            <div className="text-xs text-[#7A6F68] mt-1">{settings.address}  9890522763  {settings.email}</div>
          </div>

          <div className="bg-[#FF6B1A] text-white text-center py-2.5 font-black tracking-[0.12em] text-sm mt-4 rounded-xl">ADMISSION FORM</div>
          <div className="flex flex-wrap justify-between gap-2 mt-3 text-xs">
            <span><b>Admission No:</b> <span className="font-mono font-black text-[#FF6B1A]">{admNo}</span></span>
            <span><b>Admission Date:</b> {admDate}</span>
            <span><b>Academic Year:</b> {student.academicYear}</span>
          </div>

          {/* Student photo centered above name & roll */}
          <div className="flex justify-center mt-5">
            <div className="text-center">
              <div className="w-[110px] h-[132px] border-2 border-[#FF6B1A] rounded-xl overflow-hidden bg-[#FFFBF0] grid place-items-center shadow-sm mx-auto">
                {student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-[#FF6B1A]">Photo</span>}
              </div>
              <div className="text-[9px] font-bold tracking-widest text-[#9A6A52] mt-1.5">STUDENT PHOTO</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 mt-4 border border-[#FFE9D6] rounded-xl overflow-hidden">
            {/* Watermark removed from table - now big, little up, below photo and above seal (see outer watermark) */}
            <Field label="Full Name" value={student.name} />
            <Field label="Roll Number" value={student.roll} />
            <Field label="Gender" value={student.gender} />
            <Field label="Category" value={student.category} />
            <Field label="Class Admitted To" value={student.className} />
            <Field label="Aadhaar Number" value={student.aadhaar || "—"} />
            <Field label="Mother Name" value={student.motherName || "—"} />
            <Field label="Parent Mobile" value={student.parentMobile} />
            <Field label="Address" value={student.address || "—"} full />
            <Field label="Total Fees (Rs.)" value={`Rs. ${Number(student.totalFees).toLocaleString("en-IN")}`} />
            <Field label="Fees Paid (Rs.)" value={`Rs. ${Number(student.feesPaid).toLocaleString("en-IN")}`} />
            <Field label="Balance (Rs.)" value={`Rs. ${(Number(student.totalFees)-Number(student.feesPaid)).toLocaleString("en-IN")}`} />
            <Field label="Admission Date (Record)" value={admDate} />
          </div>

          <div className="mt-4 bg-[#FFFBF0] border border-orange-100 rounded-xl p-3 text-xs">
            <div className="font-black text-[#FF6B1A]">Declaration</div>
            <div className="text-[#5A4A42] mt-1 leading-relaxed">I hereby declare that the information provided above is true to the best of my knowledge. I agree to abide by the rules and regulations of Jijau English School, Tungi (BK). I understand that fees once paid is non-refundable as per school policy.</div>
          </div>

          <div className="mt-8 flex justify-between items-end text-xs gap-2">
            <div className="text-center flex-1">
              <div className="w-[150px] mx-auto border-t border-[#1A2B3C] pt-1.5 font-bold">Parent/Guardian Signature</div>
              <div className="text-[10px] text-[#98A2B3] mt-1">Date: {new Date().toLocaleDateString("en-GB")}</div>
            </div>
            <div className="text-center flex-1 flex flex-col items-center">
              <div className="w-[110px] h-[110px] rounded-full border-[3px] border-[#FF6B1A] bg-white grid place-items-center overflow-hidden shadow-[0_4px_12px_rgba(255,107,26,0.18)] relative">
                <img src="/school-logo.png" alt="seal" className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 rounded-full border border-[#FF6B1A]/20"></div>
              </div>
              <div className="text-[8px] font-black tracking-[0.14em] text-[#FF6B1A] mt-1">SCHOOL SEAL</div>
            </div>
            <div className="text-center flex-1">
              <div className="w-[150px] mx-auto border-t-2 border-[#FF6B1A] pt-1.5 font-black text-[#FF6B1A]">Principal Signature</div>
              <div className="text-xs font-black text-[#1A2B3C] mt-1">Dnyaneshwar Ingole</div>
              <div className="text-[10px] text-[#98A2B3]">Principal, {settings.schoolName}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-between text-[10px] text-[#98A2B3] border-t pt-3">
            <span>Generated via Jijau Portal - {new Date().toLocaleString("en-GB")}</span>
          <span className="font-mono">ADM-{student.roll}</span>
           </div>
         </div>
         </div>
         </div>

          <div className="p-3 flex gap-2 sticky bottom-0 bg-[#F3F4F6] border-t">
           <button onClick={handlePrint} className="flex-1 btn-primary min-h-[44px] touch-manipulation">Print</button>
           <button onClick={async ()=>{
             const { shareAdmissionPDF } = await import("@/lib/admissionPdf");
             await shareAdmissionPDF({ student, settings, admissionNo: admNo, admissionDate: admDate });
           }} className="flex-1 bg-[#25D366] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px] touch-manipulation active:scale-95">💬 WhatsApp PDF</button>
           <button onClick={handleDownload} className="flex-1 btn-secondary min-h-[44px] touch-manipulation">Download PDF</button>
         </div>
      </div>
    </div>
  );
}

function Field({label, value, full}:{label:string; value:string; full?:boolean}){
  return (
    <div className={`p-3 border-b border-r border-[#FFE9D6] ${full? "col-span-2": ""} bg-white`}>
      <div className="text-[10px] font-black tracking-[0.08em] text-[#9A6A52] uppercase">{label}</div>
      <div className="font-bold text-sm mt-1 break-words">{value}</div>
    </div>
  );
}



