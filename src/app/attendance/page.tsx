"use client";
import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/lib/store";
import { PillTabs } from "@/components/UI";
import { useAuth } from "@/lib/auth";

export default function AttendancePage(){
  const { students, faculties, attendance, teacherAttendance, upsertAttendance, upsertTeacherAttendance, markTeacherSelf, classOptions } = useStore();
  const { user } = useAuth();
  const isTeacher = user?.role==="teacher";
  const isAdmin = user?.role==="admin" || user?.role==="founder";
  const teacherClass = isTeacher ? (faculties.find(f=> f.id===user?.facultyId)?.className || classOptions[0]) : null;
  const [tab,setTab]=useState("Students");
  const [cls,setCls]=useState(isTeacher && teacherClass ? teacherClass : (classOptions[0]||"1st-A"));
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [teacherLocal,setTeacherLocal]=useState<Record<string,"Present"|"Absent">>({});
  useEffect(()=>{ if(isTeacher && teacherClass) setCls(teacherClass); },[isTeacher, teacherClass]);

  const classStudents = useMemo(()=> students.filter(s=> s.className===cls),[students,cls]);
  const existing = useMemo(()=> attendance.filter(a=> a.date===date && a.className===cls),[attendance,date,cls]);
  const existingMap = new Map(existing.map(e=> [e.studentId, e.status]));
  const [local,setLocal]=useState<Record<string,"Present"|"Absent">>({});

  // sync local when date/class changes
  const getStatus = (id:string):"Present"|"Absent" => local[id] || (existingMap.get(id) as any) || "Present";

  const submit = ()=>{
    const entries = classStudents.map(s=> ({studentId:s.id, status:getStatus(s.id) as "Present"|"Absent"}));
    upsertAttendance(date, cls, entries);
    alert("Attendance saved!");
  };

  const exportAtt = ()=>{
    const header="Date,Class,Roll,Name,Status";
    const rows = attendance.map(a=>{
      const s=students.find(x=> x.id===a.studentId);
      return `${a.date},${a.className},${s?.roll||""},"${s?.name||""}",${a.status}`;
    });
    const blob=new Blob([[header,...rows].join("\n")],{type:"text/csv"});
    const url=URL.createObjectURL(blob); const el=document.createElement("a"); el.href=url; el.download="attendance.csv"; el.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">School Attendance</h1>
        <p className="text-sm text-[#7A6F68]">Monitor and manage daily presence records.</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e=> setDate(e.target.value)} className="j-input !w-auto" />
          <PillTabs tabs={["Students","Teachers Attendance"]} active={tab} onChange={setTab} />
        </div>
        <button onClick={exportAtt} className="btn-secondary">Export Excel</button>
      </div>

      {tab==="Students" ? (
        <div className="space-y-3">
          <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#2D2D2D]">Daily Attendance</span>
              <select value={cls} onChange={e=> setCls(e.target.value)} className="j-select !w-auto min-w-[140px]" disabled={!!isTeacher}>
                {(isTeacher && teacherClass ? [teacherClass] : classOptions).map(c=> <option key={c}>{c}</option>)}
              </select>
              {isTeacher && <span className="text-xs font-bold text-[#FF6B1A] bg-[#FFF1E6] px-2 py-1 rounded-full">Assigned: {teacherClass}</span>}
              <span className="text-xs text-[#98A2B3] hidden sm:inline">{classStudents.length} students</span>
            </div>
            <button onClick={submit} className="btn-primary">Submit</button>
          </div>

          {classStudents.length===0? (
            <div className="card p-10 text-center text-sm text-[#98A2B3]">No students in {cls}. Add students first.</div>
          ):(
            <div className="j-table-wrap">
              <table className="j-table">
                <thead><tr><th>Roll #</th><th>Name</th><th>Present</th><th>Absent</th></tr></thead>
                <tbody>
                  {classStudents.map(s=>{
                    const st=getStatus(s.id);
                    return (
                      <tr key={s.id}>
                        <td className="font-mono font-bold">{s.roll}</td>
                        <td className="font-bold">{s.name}</td>
                        <td><label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={st==="Present"} onChange={()=> setLocal(prev=> ({...prev,[s.id]:"Present"}))} className="accent-[#16A34A] w-4 h-4"/> <span className="text-sm text-[#16A34A] font-bold">Present</span></label></td>
                        <td><label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={st==="Absent"} onChange={()=> setLocal(prev=> ({...prev,[s.id]:"Absent"}))} className="accent-[#DC2626] w-4 h-4"/> <span className="text-sm text-[#DC2626] font-bold">Absent</span></label></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="card p-4">
            <h4 className="font-bold text-sm">Attendance History - {cls} on {date}</h4>
            <div className="text-xs text-[#98A2B3] mt-1">{existing.length? `${existing.filter(e=>e.status==="Present").length} present / ${existing.length} total`:"No record for this date yet. Submit to save."}</div>
          </div>
        </div>
      ):(
        <div className="space-y-3">
          {isTeacher && (
            <div className="card p-6 border-l-4 border-l-[#FF6B1A]">
              <h3 className="font-black text-[#1A2B3C]">Mark Your Attendance</h3>
              <p className="text-sm text-[#98A2B3] mt-1">You can mark present from home - Date: {date} {teacherAttendance.find(t=> t.facultyId===user?.facultyId && t.date===date) ? `- Already marked: ${teacherAttendance.find(t=> t.facultyId===user?.facultyId && t.date===date)?.status}` : "- Not marked yet"}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={()=> { if(user?.facultyId) { markTeacherSelf(user.facultyId, date, "Present"); alert("Marked Present for "+date+" (recorded)"); }}} className="btn-primary !bg-[#16A34A] hover:!bg-[#15803D]">✓ Mark Present</button>
                <button onClick={()=> { if(user?.facultyId) { markTeacherSelf(user.facultyId, date, "Absent"); alert("Marked Absent for "+date); }}} className="btn-secondary !text-[#DC2626]">✕ Mark Absent</button>
                <span className="text-xs text-[#98A2B3] self-center">Your record is live - Admin/Founder can edit if wrong</span>
              </div>
            </div>
          )}
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold">Teachers Attendance</h3>
                <p className="text-sm text-[#98A2B3] mt-1">Mark faculty present/absent for {date} {isTeacher? "- You can edit your own, admin can edit all" : "- Admin/Founder can edit any (including self-marked from home)"}</p>
              </div>
              {isAdmin && <button onClick={()=>{
                const entries=faculties.map(f=>{
                  const existing=teacherAttendance.find(t=> t.facultyId===f.id && t.date===date);
                  const st=teacherLocal[f.id] || existing?.status || "Present";
                  return {facultyId:f.id, status:st as "Present"|"Absent", markedBy: user?.displayName};
                });
                upsertTeacherAttendance(date, entries);
                setTeacherLocal({});
                alert("Teacher attendance saved (live update)");
              }} className="btn-primary">Save Teachers Attendance</button>}
            </div>
            <div className="mt-4 j-table-wrap">
              <table className="j-table">
                <thead><tr><th>Faculty</th><th>Class</th><th>Subject</th><th>Present</th><th>Absent</th><th>Status</th></tr></thead>
                <tbody>
                  {faculties.map(f=>{
                    const rec=teacherAttendance.find(t=> t.facultyId===f.id && t.date===date);
                    const cur=teacherLocal[f.id] || rec?.status || "Present";
                    const isSelf = isTeacher && f.id===user?.facultyId;
                    const canEdit = isAdmin || isSelf;
                    return (
                      <tr key={f.id}>
                        <td className="font-bold">{f.name} {rec?.markedBy==="self" && <span className="text-[10px] bg-[#DCFCE7] text-[#16A34A] px-1.5 py-0.5 rounded-full ml-1">self</span>}</td>
                        <td>{f.className}</td>
                        <td>{f.subject}</td>
                        <td>{canEdit ? <label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={cur==="Present"} onChange={()=> setTeacherLocal(p=> ({...p,[f.id]:"Present"}))} className="accent-[#16A34A] w-4 h-4"/><span className="text-sm text-[#16A34A] font-bold">Present</span></label> : <span className="text-sm text-[#98A2B3]">{cur==="Present"?"● Present":""}</span>}</td>
                        <td>{canEdit ? <label className="inline-flex items-center gap-2 cursor-pointer"><input type="radio" checked={cur==="Absent"} onChange={()=> setTeacherLocal(p=> ({...p,[f.id]:"Absent"}))} className="accent-[#DC2626] w-4 h-4"/><span className="text-sm text-[#DC2626] font-bold">Absent</span></label> : <span className="text-sm text-[#98A2B3]">{cur==="Absent"?"● Absent":""}</span>}</td>
                        <td>{rec? <span className={`badge ${rec.status==="Present"?"badge-green":"badge-red"}`}>{rec.status}</span> : <span className="badge badge-gray">Not Marked</span>}</td>
                      </tr>
                    );
                  })}
                  {faculties.length===0 && <tr><td colSpan={6} className="text-center py-6 text-sm text-[#98A2B3]">No faculty</td></tr>}
                </tbody>
              </table>
            </div>
            {!isAdmin && isTeacher && <div className="text-xs text-[#98A2B3] mt-3 text-center">Admin/Founder can edit your attendance if marked wrong or if you worked from home.</div>}
          </div>
        </div>
      )}
    </div>
  );
}


