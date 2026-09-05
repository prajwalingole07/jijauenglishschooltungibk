"use client";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

type HolidayRange = { id: string; from: string; to: string; reason: string };

export default function HolidayManager(){
  const { user } = useAuth() as any;
  const { holidays, setHolidays } = useStore() as any;
  // holidays is string[] of dates, but for festival ranges we store as "YYYY-MM-DD:YYYY-MM-DD:Reason" or use separate key
  const [rangeFrom,setRangeFrom]=useState(new Date().toISOString().slice(0,10));
  const [rangeTo,setRangeTo]=useState(new Date(Date.now()+ 5*86400000).toISOString().slice(0,10));
  const [reason,setReason]=useState("Festival Holidays");

  if(user?.role!=="admin" && user?.role!=="founder"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">Admin/Founder Only</div>
        <div className="text-sm text-[#7A6F68]">Holiday Manager is only for Admin and Founder.</div>
        <Link href="/dashboard" className="btn-primary inline-block mt-2">Go to Dashboard</Link>
      </div>
    );
  }

  // Parse holidays that are ranges: store as "from:to:reason" or single date
  const holidayRanges: HolidayRange[] = (()=> {
    try{
      const raw = localStorage.getItem("jijau_holiday_ranges");
      if(raw) return JSON.parse(raw);
    }catch{}
    return [];
  })();

  const [ranges,setRanges]=useState<HolidayRange[]>(()=>{
    try{
      const raw=localStorage.getItem("jijau_holiday_ranges");
      return raw? JSON.parse(raw): [];
    }catch{ return []; }
  });

  const saveRanges = (newRanges: HolidayRange[])=>{
    localStorage.setItem("jijau_holiday_ranges", JSON.stringify(newRanges));
    setRanges(newRanges);
    // Also expand to holidays string[] for blocking logic
    const expanded: string[] = [];
    newRanges.forEach(r=>{
      const from = new Date(r.from);
      const to = new Date(r.to);
      for(let d=new Date(from); d<=to; d.setDate(d.getDate()+1)){
        expanded.push(d.toISOString().slice(0,10));
      }
    });
    // Merge with existing single-date holidays
    const merged = Array.from(new Set([...(holidays as string[]), ...expanded]));
    setHolidays(merged);
    localStorage.setItem("jijau_holiday_ranges_expanded", JSON.stringify(expanded));
  };

  const addRange = ()=>{
    if(!rangeFrom || !rangeTo) return alert("Select from and to dates");
    if(new Date(rangeFrom) > new Date(rangeTo)) return alert("From date must be before To date");
    const newRange: HolidayRange = { id: Math.random().toString(36).slice(2,9), from: rangeFrom, to: rangeTo, reason };
    const newRanges = [...ranges, newRange];
    saveRanges(newRanges);
    // Also notify teachers via live
    try{
      window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`🏖️ Holiday: ${reason} from ${rangeFrom} to ${rangeTo} - teachers blocked`, type:"info"}}));
      if("Notification" in window && Notification.permission==="granted"){
        new Notification("Holiday Declared",{body: `${reason}: ${rangeFrom} to ${rangeTo}`, icon:"/school-logo.png"});
      }
    }catch{}
  };

  const removeRange = (id:string)=>{
    if(!confirm("Remove this holiday range? Teachers will be able to login again for those dates.")) return;
    const newRanges = ranges.filter(r=> r.id!==id);
    saveRanges(newRanges);
  };

  const isTodayHoliday = (()=> {
    const today = new Date().toISOString().slice(0,10);
    return ranges.some(r=> today >= r.from && today <= r.to);
  })();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">Holiday Manager - Festival Holidays</h1>
        <p className="text-sm text-[#7A6F68]">When school is on holidays from <b>this to this</b>, no teacher can login - only Admin and Founder can login. Set festival seasons here.</p>
      </div>

      {isTodayHoliday && (
        <div className="card p-4 bg-[#FEE2E2] border-red-200 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#DC2626] text-white grid place-items-center">🎉</span>
          <div>
            <div className="font-black text-[#991B1B]">Today is a Holiday - Teachers Blocked</div>
            <div className="text-sm text-[#7A6F68]">Teachers cannot login today. Only Admin/Founder can login. Reason: {ranges.find(r=> new Date().toISOString().slice(0,10) >= r.from && new Date().toISOString().slice(0,10) <= r.to)?.reason}</div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="font-black">Add Festival Holiday Range</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
          <label><span className="j-label">From Date</span><input type="date" value={rangeFrom} onChange={e=> setRangeFrom(e.target.value)} className="j-input" /></label>
          <label><span className="j-label">To Date</span><input type="date" value={rangeTo} onChange={e=> setRangeTo(e.target.value)} className="j-input" /></label>
          <label className="sm:col-span-2"><span className="j-label">Reason (Festival)</span><input value={reason} onChange={e=> setReason(e.target.value)} placeholder="e.g. Diwali Holidays" className="j-input" /></label>
        </div>
        <button onClick={addRange} className="btn-primary w-full mt-4">Add Holiday Range - Block Teachers</button>
        <div className="text-xs text-[#98A2B3] mt-2">During these dates, teacher login will be blocked with message “School is on holidays - contact Admin”. Admin/Founder can still login.</div>
      </div>

      <div className="card p-6">
        <h3 className="font-black">Active Holiday Ranges</h3>
        {ranges.length===0? <div className="text-sm text-[#98A2B3] mt-3">No festival holidays set. Add above.</div> :
          <div className="mt-3 space-y-2">
            {ranges.map(r=>(
              <div key={r.id} className="flex justify-between items-center p-3 bg-[#FFFBF0] border rounded-xl">
                <div>
                  <div className="font-bold text-sm">{r.reason}</div>
                  <div className="text-xs text-[#7A6F68]">{r.from} → {r.to} - {Math.ceil((new Date(r.to).getTime()-new Date(r.from).getTime())/86400000)+1} days</div>
                </div>
                <button onClick={()=> removeRange(r.id)} className="btn-secondary !py-1.5 text-xs bg-[#FEE2E2] text-[#DC2626]">Remove</button>
              </div>
            ))}
          </div>
        }
      </div>

      <div className="card p-4 bg-[#FFFBF0] border-orange-100 text-xs">
        <div className="font-black text-[#FF6B1A]">How it works</div>
        <ul className="list-disc ml-4 mt-2 space-y-1 text-[#7A6F68]">
          <li>Set <b>From</b> and <b>To</b> dates for festival holidays (e.g., Diwali 2026-10-20 to 2026-10-26).</li>
          <li>During those dates, <b>no teacher can login</b> - they see “School is on holidays till {`{to}`}, contact Admin”.</li>
          <li>Only <b>Admin (prajwal77)</b> and <b>Founder (jijau2026)</b> can login during holidays.</li>
          <li>Teachers' attendance and homework reminders are also paused on holidays.</li>
          <li>Remove the range to re-enable teacher login.</li>
        </ul>
      </div>
    </div>
  );
}

