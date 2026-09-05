"use client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { SearchBox } from "@/components/UI";

export default function TeacherLivePage(){
  const { faculties, teacherAttendance } = useStore();
  const { user } = useAuth() as any;
  if(user?.role!=="admin" && user?.role!=="founder"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Admin/Founder Only</div>
        <div className="text-sm text-[#7A6F68]">Teacher live days count is only for Admin and Founder.</div>
        <a href="/dashboard" className="btn-primary inline-block mt-2">Go to Dashboard</a>
      </div>
    );
  }
  // Compute live days count per teacher from login (teacherAttendance Present)
  const today = new Date().toISOString().slice(0,10);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Teacher Live - Present Days</h1>
        <p className="text-sm text-[#7A6F68]">Live days count from login - Auto-captured via attendance - <span className="bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full text-xs font-black">LIVE</span> updates</p>
      </div>
      <div className="card p-4 flex flex-wrap gap-2 items-center justify-between">
        <div className="text-sm"><span className="font-black">{faculties.length}</span> teachers - <span className="text-[#16A34A] font-bold">{teacherAttendance.filter(t=> t.status==="Present").length} present records</span></div>
        <div className="text-xs bg-[#FFF7ED] px-3 py-1.5 rounded-full border">Today: {today}</div>
      </div>
      <div className="j-table-wrap">
        <table className="j-table">
          <thead><tr><th>Faculty</th><th>Class</th><th>Subject</th><th>Live Present Days</th><th>Today</th><th>Last Present</th></tr></thead>
          <tbody>
            {faculties.map(f=>{
              const presentDays = new Set(teacherAttendance.filter(t=> t.facultyId===f.id && t.status==="Present").map(t=> t.date)).size;
              const todayRec = teacherAttendance.find(t=> t.facultyId===f.id && t.date===today);
              const lastPresent = [...teacherAttendance].filter(t=> t.facultyId===f.id && t.status==="Present").sort((a,b)=> b.date.localeCompare(a.date))[0]?.date || "-";
              return (
                <tr key={f.id}>
                  <td className="font-bold flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#FFF1E6] grid place-items-center text-[#FF6B1A] font-black text-xs">{f.name.charAt(0)}</span>
                    {f.name}
                  </td>
                  <td><span className="badge badge-blue">{f.className}</span></td>
                  <td className="text-sm">{f.subject}</td>
                  <td className="font-black text-[#FF6B1A]">{presentDays} days <span className="text-xs font-normal text-[#98A2B3]">live</span></td>
                  <td>{todayRec ? <span className={`badge ${todayRec.status==="Present"?"badge-green":"badge-red"}`}>{todayRec.status}</span> : <span className="badge badge-gray">Not marked</span>}</td>
                  <td className="text-xs font-mono">{lastPresent}</td>
                </tr>
              );
            })}
            {faculties.length===0 && <tr><td colSpan={6} className="text-center py-8 text-sm text-[#98A2B3]">No faculty</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card p-4 bg-[#FFFBF0] border-orange-100 text-xs text-[#7A6F68]">
        <div className="font-black text-[#FF6B1A]">How it works</div>
        <ul className="list-disc ml-4 mt-2 space-y-1">
          <li>Every time a teacher marks <b>Present</b> (self or admin), it is recorded with date + markedBy and counted live.</li>
          <li>Count is distinct dates where status is Present, from first login till today.</li>
          <li>Visible only to Admin/Founder - teachers cannot see others' counts.</li>
        </ul>
      </div>
    </div>
  );
}

