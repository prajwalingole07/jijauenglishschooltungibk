"use client";
import { useStore } from "@/lib/store";
import { StatCard } from "@/components/UI";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCalendar, IconGraduation, IconPeople, IconWallet, IconStudent } from "@/components/IOSIcons";
import { useAuth } from "@/lib/auth";
import LiveIndicator from "@/components/LiveIndicator";

function CircularProgress({value}:{value:number}){
  const r=54, c=2*Math.PI*r, off=c - (value/100)*c;
  const [pulse, setPulse]=useState(false);
  useEffect(()=>{
    const id=setInterval(()=> setPulse(p=> !p), 1400);
    return ()=> clearInterval(id);
  },[]);
  return (
    <div className={`relative w-[132px] h-[132px] mx-auto transition-transform duration-700 ${pulse? "scale-[1.02]":"scale-100"}`}>
      <div className={`absolute inset-0 rounded-full ${pulse? "shadow-[0_0_0_14px_rgba(255,107,26,0.08),0_0_28px_rgba(255,107,26,0.18)]":"shadow-[0_0_0_8px_rgba(255,107,26,0.04)]"} transition-all duration-700`} style={{borderRadius:"50%"}} />
      <svg width="132" height="132" className="rotate-[-90deg] relative">
        <circle cx="66" cy="66" r={r} stroke="#FFF1E6" strokeWidth="10" fill="none"/>
        <circle cx="66" cy="66" r={r} stroke="#FF6B1A" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{transition:"stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)", filter: pulse? "drop-shadow(0 0 6px rgba(255,107,26,0.45))":"none"}}/>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className={`text-[28px] font-black leading-none transition-all duration-700 ${pulse? "text-[#FF7A00] scale-[1.03]":"text-[#FF6B1A]"}`}>{value}%</div>
          <div className="text-[10px] font-bold tracking-[0.16em] text-[#9A6A52] mt-1">AVERAGE</div>
        </div>
      </div>
      <div className={`absolute inset-[-6px] rounded-full border-2 border-[#FF6B1A]/20 ${pulse? "animate-ping opacity-0":"opacity-0"}`} style={{animationDuration:"1.4s"}} />
    </div>
  );
}

export default function Dashboard(){
  const { user } = useAuth() as any;
  const isTeacher = user?.role==="teacher";
  if(isTeacher) return <TeacherDashboard />;
  const { students, faculties, staff, transactions, attendance } = useStore();
  const totalStudents = students.length;
  const totalStaff = faculties.length + staff.length;
  const feesCollected = transactions.reduce((a,b)=> a+b.amount, 0);
  const totalExpected = students.reduce((a,b)=> a+b.totalFees, 0);
  const outstanding = Math.max(0, totalExpected - feesCollected);
  const totalAtt = attendance.length;
  const present = attendance.filter(a=> a.status==="Present").length;
  const avg = totalAtt? Math.round((present/totalAtt)*100) : 94;

  const recent = [...students].sort((a,b)=> b.createdAt.localeCompare(a.createdAt)).slice(0,4);
  const todayStr = new Date().toLocaleDateString("en-GB",{ day:"2-digit", month:"long", year:"numeric"});

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#1A2B3C] leading-none">Dashboard Overview</h1>
          <p className="text-sm text-[#7A6F68] mt-2">Welcome back, {user?.displayName || "Admin"}. Here is what&apos;s happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <div className="card px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFF1E6] grid place-items-center text-[#FF6B1A]"><IconCalendar size={16} /></div>
            <div className="text-sm font-bold text-[#2D2D2D]">{todayStr}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="TOTAL STUDENTS" value={String(totalStudents)} icon={<IconGraduation size={20} />} color="peach" />
        <StatCard label="TOTAL STAFF" value={String(totalStaff)} icon={<IconPeople size={20} />} color="pink" />
        <StatCard label="FEES COLLECTED" value={`Rs. ${feesCollected.toLocaleString("en-IN")}`} icon={<IconWallet size={20} />} color="green" />
        <StatCard label="OUTSTANDING DUES" value={`Rs. ${outstanding.toLocaleString("en-IN")}`} icon={<IconCalendar size={20} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 lg:col-span-1">
          <h3 className="font-extrabold text-[#1A2B3C]">Student Attendance Trends</h3>
          <p className="text-xs text-[#98A2B3] mt-1">Tracking daily presence across all standards</p>
          <div className="mt-6"><CircularProgress value={avg} /></div>
          <p className="text-center text-sm text-[#7A6F68] mt-4">Average attendance computed from {totalAtt||"sample"} records</p>
          <Link href="/attendance" className="btn-primary w-full mt-5 block text-center">View Attendance</Link>
        </div>

        <div className="card p-0 overflow-hidden lg:col-span-2">
          <div className="p-5 flex items-center justify-between">
            <h3 className="font-extrabold text-[#1A2B3C]">Recent Registrations</h3>
            <Link href="/students" className="text-sm font-bold text-[#FF6B1A]">View All →</Link>
          </div>
          <div className="px-2 pb-2 space-y-2">
            {recent.map(s=>(
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#FFF9F3] border border-transparent hover:border-orange-100 transition">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FFD8B8] to-[#FFB088] grid place-items-center font-black text-white shrink-0">{s.name.charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-[#2D2D2D] truncate">{s.name}</div>
                  <div className="text-xs text-[#98A2B3]">{s.className} - Roll {s.roll}</div>
                </div>
                <div className="text-xs text-[#7A6F68] hidden sm:block">{new Date(s.createdAt).toLocaleDateString("en-GB")}</div>
                <span className={`badge ${s.feesPaid>=s.totalFees? "badge-green":"badge-orange"}`}>{s.feesPaid>=s.totalFees? "Completed":"Pending"}</span>
              </div>
            ))}
            {recent.length===0 && <div className="p-8 text-center text-sm text-[#98A2B3]">No registrations</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs font-bold tracking-[0.12em] text-[#9A6A52]">TOTAL EXPECTED FEES</div>
          <div className="text-2xl font-black mt-2">Rs. {totalExpected.toLocaleString("en-IN")}</div>
          <div className="text-xs text-[#98A2B3] mt-1">From {totalStudents} students</div>
        </div>
        <div className="card p-5 border-l-4 border-l-[#16A34A]">
          <div className="text-xs font-bold tracking-[0.12em] text-[#15803D]">FEES COLLECTED</div>
          <div className="text-2xl font-black text-[#16A34A] mt-2">Rs. {feesCollected.toLocaleString("en-IN")}</div>
          <div className="text-xs text-[#98A2B3] mt-1">{transactions.length} receipts issued</div>
        </div>
        <div className="card p-5 border-l-4 border-l-[#DC2626]">
          <div className="text-xs font-bold tracking-[0.12em] text-[#DC2626]">OUTSTANDING</div>
          <div className="text-2xl font-black text-[#DC2626] mt-2">Rs. {outstanding.toLocaleString("en-IN")}</div>
          <div className="text-xs text-[#98A2B3] mt-1">Pending collection</div>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard(){
  const { students, faculties, attendance, teacherAttendance, homework, upsertAttendance, markTeacherSelf } = useStore();
  const { user } = useAuth() as any;
  const faculty = faculties.find(f=> f.id===user?.facultyId);
  const className = faculty?.className || "1st-A";
  const teacherName = user?.displayName?.replace(" (Teacher)","") || faculty?.name || "Teacher";
  const [tab,setTab]=useState<"Dashboard"|"Self Attendance"|"Student Attendance"|"Homework Hub">("Dashboard");
  const todayIso = new Date().toISOString().slice(0,10);
  const classStudents = students.filter(s=> s.className===className);
  const todayAtt = attendance.filter(a=> a.date===todayIso && a.className===className);
  const presentToday = todayAtt.filter(a=> a.status==="Present").length;
  const absentToday = classStudents.length - presentToday;
  const selfRec = teacherAttendance.find(t=> t.facultyId===user?.facultyId && t.date===todayIso);
  const [localAtt,setLocalAtt]=useState<Record<string,"Present"|"Absent">>({});
  const getSt = (id:string)=> localAtt[id] || (todayAtt.find(a=> a.studentId===id)?.status as any) || "Present";
  
  const saveStudentAtt = ()=>{
    const entries = classStudents.map(s=> ({studentId:s.id, status:getSt(s.id) as "Present"|"Absent"}));
    upsertAttendance(todayIso, className, entries);
    setLocalAtt({});
    try{
      window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Student attendance saved for ${className}`, type:"success"}}));
    }catch{}
  };

  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-6+i);
    const iso=d.toISOString().slice(0,10);
    const dayAtt=attendance.filter(a=> a.date===iso && a.className===className);
    const p=dayAtt.filter(a=> a.status==="Present").length;
    return {iso, label: d.toLocaleDateString("en-GB",{day:"2-digit", month:"short"}), present:p, total:classStudents.length};
  });

  return (
    <div className="space-y-4">
      {/* Welcome card */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#FFF1E6] border-2 border-white shadow-md grid place-items-center">
            {faculty?.photo ? <img src={faculty.photo} alt={teacherName} className="w-full h-full object-cover"/> : <span className="font-black text-[#FF6B1A] text-lg">{teacherName.charAt(0)}</span>}
          </div>
          <div>
            <div className="font-black text-lg text-[#1A2B3C]">Welcome back, {teacherName}!</div>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="bg-[#FFF1E6] text-[#FF6B1A] text-xs font-bold px-2.5 py-1 rounded-full">Class Teacher: {className}</span>
              <span className="bg-white border text-[#5A4A42] text-xs font-bold px-2.5 py-1 rounded-full">Session 2026-27</span>
            </div>
          </div>
        </div>
        <div className="bg-[#FF6B1A] text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 shadow-md">
          <span className="w-5 h-5 rounded-full bg-white/20 grid place-items-center">🕒</span> {new Date().toLocaleDateString("en-GB")}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 flex flex-wrap gap-1 w-fit shadow-sm border">
        {["Dashboard","Self Attendance","Student Attendance","Homework Hub"].map(t=>(
          <button key={t} onClick={()=> setTab(t as any)} className={`px-4 py-2 rounded-xl text-sm font-bold transition ${tab===t? "bg-[#FF6B1A] text-white shadow":"text-[#7A6F68] hover:bg-[#FFF7ED]"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="Dashboard" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 flex justify-between items-center">
              <div><div className="text-xs font-bold tracking-widest text-[#98A2B3]">TOTAL STUDENTS</div><div className="text-3xl font-black mt-1">{classStudents.length}</div></div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF1E6] grid place-items-center text-[#FF6B1A]">🎓</div>
            </div>
            <div className="card p-5 flex justify-between items-center border-l-4 border-l-[#16A34A]">
              <div><div className="text-xs font-bold tracking-widest text-[#16A34A]">PRESENT TODAY</div><div className="text-3xl font-black mt-1 text-[#16A34A]">{presentToday}</div></div>
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] grid place-items-center text-[#16A34A]">✓</div>
            </div>
            <div className="card p-5 flex justify-between items-center border-l-4 border-l-[#DC2626]">
              <div><div className="text-xs font-bold tracking-widest text-[#DC2626]">ABSENT TODAY</div><div className="text-3xl font-black mt-1 text-[#DC2626]">{Math.max(0,absentToday)}</div></div>
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] grid place-items-center text-[#DC2626]">✕</div>
            </div>
          </div>
          <div className="card p-6">
            <div className="font-black text-sm flex items-center gap-2">📈 STUDENT ATTENDANCE ANALYTICS</div>
            <div className="text-xs font-bold tracking-widest text-[#98A2B3] mt-1">LAST 7 ACTIVE DAYS TREND</div>
            <div className="mt-6">
              {classStudents.length===0? <div className="text-sm text-[#98A2B3] text-center py-8">No students in {className}. Admin will add students.</div> : (
                <div className="space-y-3">
                  {last7.map(d=>(
                    <div key={d.iso} className="flex items-center gap-3">
                      <div className="text-xs font-bold text-[#7A6F68] w-16">{d.label}</div>
                      <div className="flex-1 h-3 bg-[#FFF1E6] rounded-full overflow-hidden">
                        <div className="h-full bg-[#FF6B1A] rounded-full transition-all" style={{width: `${d.total? (d.present/d.total)*100 : 0}%`}} />
                      </div>
                      <div className="text-xs font-black w-12 text-right">{d.present}/{d.total||0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab==="Self Attendance" && (
        <div className="card p-6 space-y-4">
          <h3 className="font-black text-[#1A2B3C]">Self Attendance - Mark Your Presence</h3>
          <p className="text-sm text-[#7A6F68]">Date: {todayIso} - {selfRec? `Already marked: ${selfRec.status} ${selfRec.markedBy==="self"?"(self)":""}` : "Not marked yet"} - You can update from home, admin can edit if wrong.</p>
          <div className="flex gap-3">
            <button onClick={()=> { if(user?.facultyId) { markTeacherSelf(user.facultyId, todayIso, "Present"); window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"✓ Marked Present for today", type:"success"}})); }}} className="btn-primary !bg-[#16A34A]">✓ Mark Present</button>
            <button onClick={()=> { if(user?.facultyId) { markTeacherSelf(user.facultyId, todayIso, "Absent"); window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Marked Absent for today", type:"info"}})); }}} className="btn-secondary !text-[#DC2626]">✕ Mark Absent</button>
          </div>
          {selfRec && <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-black ${selfRec.status==="Present"?"bg-[#DCFCE7] text-[#16A34A]":"bg-[#FEE2E2] text-[#DC2626]"}`}>{selfRec.status}</div>}
        </div>
      )}

      {tab==="Student Attendance" && (
        <div className="space-y-3">
          <div className="card p-4 flex flex-wrap gap-3 justify-between items-center">
            <div className="font-bold">Student Attendance - {className} - {todayIso}</div>
            <button onClick={saveStudentAtt} className="btn-primary">Save Attendance</button>
          </div>
          {classStudents.length===0? <div className="card p-8 text-center text-sm text-[#98A2B3]">No students in {className}</div> : (
            <div className="j-table-wrap">
              <table className="j-table">
                <thead><tr><th>Roll</th><th>Name</th><th>Present</th><th>Absent</th></tr></thead>
                <tbody>
                  {classStudents.map(s=>{
                    const st=getSt(s.id);
                    return (
                      <tr key={s.id}>
                        <td className="font-mono font-bold">{s.roll}</td>
                        <td className="font-bold">{s.name}</td>
                        <td><label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={st==="Present"} onChange={()=> setLocalAtt(p=> ({...p,[s.id]:"Present"}))} className="accent-[#16A34A] w-4 h-4"/><span className="text-sm text-[#16A34A] font-bold">Present</span></label></td>
                        <td><label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={st==="Absent"} onChange={()=> setLocalAtt(p=> ({...p,[s.id]:"Absent"}))} className="accent-[#DC2626] w-4 h-4"/><span className="text-sm text-[#DC2626] font-bold">Absent</span></label></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==="Homework Hub" && (
        <div className="card p-6">
          <h3 className="font-black text-[#1A2B3C]">Homework Hub - {className}</h3>
          <div className="mt-4 space-y-2">
            {homework.filter(h=> h.className===className).length===0? <div className="text-sm text-[#98A2B3]">No homework for {className}. Create via Homework Tracker.</div> :
              homework.filter(h=> h.className===className).map(h=>(
                <div key={h.id} className="p-3 bg-[#FFFBF0] border border-orange-100 rounded-xl">
                  <div className="font-bold text-sm">{h.title} - {h.subject}</div>
                  <div className="text-xs text-[#7A6F68]">{h.description}</div>
                  <div className="text-xs text-[#98A2B3] mt-1">Due: {h.dueDate} - {h.status}</div>
                </div>
              ))}
          </div>
          <Link href="/homework" className="btn-primary mt-4 inline-block">Go to Homework Tracker</Link>
        </div>
      )}
    </div>
  );
}
