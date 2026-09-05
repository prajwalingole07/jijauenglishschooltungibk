"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function DataManager(){
  const { user } = useAuth() as any;
  const { students, faculties, staff, attendance, teacherAttendance, homework, transactions, salaryRecords, portalAccounts, notices, holidays, settings } = useStore();
  const [year,setYear]=useState(settings.academicYear || "2026-2027");
  const [backupMsg,setBackupMsg]=useState("");

  if(user?.role!=="admin" && user?.role!=="founder"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Admin Only - Data Manager</div>
        <div className="text-sm text-[#7A6F68]">Only Admin and Founder can refresh data, backup and view previous years.</div>
        <a href="/dashboard" className="btn-primary inline-block mt-2">Go to Dashboard</a>
      </div>
    );
  }

  const academicYears = ["2024-2025","2025-2026","2026-2027","2027-2028"];
  const filterByYear = (arr:any[], year: string)=>{
    // Filter by academicYear field or by createdAt/admissionDate year
    return arr.filter((x:any)=>{
      const ay = x.academicYear || x.academic_year;
      if(ay) return ay===year;
      const d = x.admissionDate || x.createdAt || x.date || x.assignedDate;
      if(!d) return false;
      const y = new Date(d).getFullYear();
      // Map year string "2026-2027" to check if date falls in that academic year (June-May)
      const start = parseInt(year.split("-")[0]);
      return y===start || y===start+1;
    });
  };

  const yearStudents = filterByYear(students, year);
  const yearTransactions = filterByYear(transactions, year);
  const yearAttendance = filterByYear(attendance, year);
  const yearHomework = filterByYear(homework, year);

  const doBackup = ()=>{
    const data = localStorage.getItem("jijau_store_v2");
    if(!data){ setBackupMsg("No data to backup"); return; }
    const backupKey = `jijau_backup_${new Date().toISOString().slice(0,10)}_${Date.now()}`;
    localStorage.setItem(backupKey, data);
    // Keep list of backups
    const listRaw = localStorage.getItem("jijau_backup_list");
    const list = listRaw ? JSON.parse(listRaw) : [];
    list.unshift({ key: backupKey, date: new Date().toISOString(), year, size: data.length });
    localStorage.setItem("jijau_backup_list", JSON.stringify(list.slice(0,10)));
    // Also download as file
    const blob = new Blob([data], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`jijau-backup-${year}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg(`✓ Backup created (${(data.length/1024).toFixed(1)} KB) and downloaded`);
    setTimeout(()=> setBackupMsg(""), 4000);
  };

  const doRefreshAll = ()=>{
    if(!confirm(`Refresh Data All for ${year}?\n\nThis will:\n1. Backup current data first\n2. Delete ALL records for ${year} (students, attendance, homework, fees)\n\nBackup will be kept. Continue?`)) return;
    doBackup();
    setTimeout(()=>{
      // For demo, we will clear students/transactions/attendance/homework for that year, but keep backup
      // In real, we would filter and remove
      if(confirm(`Delete all data for ${year} now? (Cannot be undone, but backup exists)`)){
        // We need to actually delete via store - we can do via direct localStorage manipulation for demo
        try{
          const raw = localStorage.getItem("jijau_store_v2");
          if(!raw) return;
          const p = JSON.parse(raw);
          const keepStudents = (p.students||[]).filter((s:any)=> s.academicYear!==year && !(s.admissionDate||"").startsWith(year.split("-")[0]));
          const keepTransactions = (p.transactions||[]).filter((t:any)=> t.academicYear!==year);
          const keepAttendance = (p.attendance||[]).filter((a:any)=> !a.date.startsWith(year.split("-")[0]));
          const keepHomework = (p.homework||[]).filter((h:any)=> h.academicYear!==year && !h.assignedDate.startsWith(year.split("-")[0]));
          p.students = keepStudents;
          p.transactions = keepTransactions;
          p.attendance = keepAttendance;
          p.homework = keepHomework;
          localStorage.setItem("jijau_store_v2", JSON.stringify(p));
          alert(`Refreshed: Removed data for ${year}. Backup kept. Please refresh page.`);
          location.reload();
        }catch(e){ alert("Refresh failed: "+e); }
      }
    }, 800);
  };

  const backups = (()=>{ try{ const raw=localStorage.getItem("jijau_backup_list"); return raw? JSON.parse(raw):[]; }catch{ return []; }})();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Data Manager - Refresh & Archive</h1>
        <p className="text-sm text-[#7A6F68]">Admin only - Backup before delete - View previous year data by selecting academic year</p>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-bold">Academic Year:</span>
        <select value={year} onChange={e=> setYear(e.target.value)} className="j-select !w-auto min-w-[160px]">
          {academicYears.map(y=> <option key={y}>{y}</option>)}
        </select>
        <span className="text-xs bg-[#FFF7ED] px-3 py-1.5 rounded-full border">Viewing: <b className="text-[#FF6B1A]">{year}</b></span>
        <span className="text-xs text-[#98A2B3]">Current: {settings.academicYear}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center"><div className="text-xs font-bold tracking-widest text-[#9A6A52]">STUDENTS ({year})</div><div className="text-2xl font-black">{yearStudents.length}</div><div className="text-xs text-[#98A2B3]">admissions</div></div>
        <div className="card p-4 text-center"><div className="text-xs font-bold tracking-widest text-[#9A6A52]">ATTENDANCE ({year})</div><div className="text-2xl font-black">{yearAttendance.length}</div><div className="text-xs text-[#98A2B3]">records</div></div>
        <div className="card p-4 text-center"><div className="text-xs font-bold tracking-widest text-[#9A6A52]">HOMEWORK ({year})</div><div className="text-2xl font-black">{yearHomework.length}</div></div>
        <div className="card p-4 text-center"><div className="text-xs font-bold tracking-widest text-[#9A6A52]">FEES COLLECTED ({year})</div><div className="text-2xl font-black text-[#16A34A]">Rs. {yearTransactions.reduce((a,b)=> a+b.amount,0).toLocaleString("en-IN")}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-black text-[#1A2B3C]">Refresh Data All</h3>
          <p className="text-sm text-[#7A6F68] mt-1">Delete old data for selected year and keep backup. Use when starting new academic year.</p>
          <div className="mt-4 space-y-2">
            <button onClick={doBackup} className="btn-secondary w-full">💾 Backup Current Data (Download JSON)</button>
            <button onClick={doRefreshAll} className="btn-primary w-full bg-[#DC2626] hover:bg-[#991B1B]">🗑 Refresh Data All for {year} (Backup + Delete)</button>
            {backupMsg && <div className="bg-[#DCFCE7] text-[#166534] text-sm p-3 rounded-xl font-bold">{backupMsg}</div>}
          </div>
          <div className="text-xs text-[#98A2B3] mt-3">Backups are stored in browser + downloaded as JSON. Keep them safe. Max 10 backups kept.</div>
        </div>
        <div className="card p-6">
          <h3 className="font-black text-[#1A2B3C]">Backups</h3>
          {backups.length===0? <div className="text-sm text-[#98A2B3] mt-2">No backups yet. Click Backup to create.</div> :
            <div className="mt-3 space-y-2 max-h-[220px] overflow-auto">
              {backups.map((b:any)=>(
                <div key={b.key} className="flex justify-between items-center p-2.5 bg-[#FFFBF0] border rounded-xl text-xs">
                  <div><div className="font-bold">{b.key}</div><div className="text-[#98A2B3]">{new Date(b.date).toLocaleString("en-GB")} - {(b.size/1024).toFixed(1)} KB - {b.year}</div></div>
                  <button onClick={()=>{
                    const data=localStorage.getItem(b.key);
                    if(!data) return alert("Backup not found");
                    const blob=new Blob([data],{type:"application/json"});
                    const url=URL.createObjectURL(blob);
                    const a=document.createElement("a");
                    a.href=url; a.download=`${b.key}.json`; a.click();
                  }} className="btn-secondary !py-1 text-xs">Download</button>
                </div>
              ))}
            </div>
          }
        </div>
      </div>

      <div className="card p-4 bg-[#FFFBF0] border-orange-100 text-xs">
        <div className="font-black text-[#FF6B1A]">How year filter works</div>
        <div className="text-[#7A6F68] mt-1">Select any academic year (e.g., 2026-2027) to filter students, attendance, homework, fees for that year. Data is filtered by <b>academicYear</b> field or by date year. Historical data remains in backups even after Refresh.</div>
      </div>
    </div>
  );
}

