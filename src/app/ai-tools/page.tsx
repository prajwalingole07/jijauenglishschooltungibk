"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

const tools = [
  {id:"assistant", name:"Student Assistant", desc:"Summarize academic / attendance / fee info", color:"bg-[#FFF1E6] text-[#FF6B1A]"},
  {id:"attendance", name:"Attendance Insights", desc:"Analyze trends & absent lists", color:"bg-[#DBEAFE] text-[#2563EB]"},
  {id:"fees", name:"Fee Insights", desc:"Identify outstanding & payment trends", color:"bg-[#DCFCE7] text-[#16A34A]"},
  {id:"homework", name:"Homework Assistant", desc:"Generate ideas by class & subject", color:"bg-[#FEF3C7] text-[#D97706]"},
  {id:"notice", name:"Notice Generator", desc:"Create school notices instantly", color:"bg-[#F3E8FF] text-[#7C3AED]"},
  {id:"report", name:"Report Generator", desc:"Generate student / class reports", color:"bg-[#FFE4E6] text-[#E11D48]"},
];

export default function AiTools(){
  const { user } = useAuth() as any;
  if(user?.role==="teacher"){
    return (
      <div className="card p-10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] grid place-items-center mx-auto">🔒</div>
        <div className="font-black">AI Tools - Removed for Teachers</div>
        <div className="text-sm text-[#7A6F68]">As per latest update, AI Communications has been removed from Teacher Portal. Teachers use My Dashboard only.</div>
        <a href="/dashboard" className="btn-primary inline-block mt-2">Go to My Dashboard</a>
      </div>
    );
  }
  const { students, attendance, transactions } = useStore();
  const [active,setActive]=useState("assistant");
  const [input,setInput]=useState("");
  const [output,setOutput]=useState("");

  const run = ()=>{
    if(!input.trim()) return;
    // simple deterministic mock AI
    if(active==="assistant"){
      const s=students.find(x=> x.name.toLowerCase().includes(input.toLowerCase()));
      if(s){
        const bal=s.totalFees - s.feesPaid;
        setOutput(`📘 Student: ${s.name} (${s.className}, Roll ${s.roll})\n- Gender: ${s.gender} | Category: ${s.category}\n- Fees: Paid Rs. ${s.feesPaid.toLocaleString("en-IN")} / Total Rs. ${s.totalFees.toLocaleString("en-IN")} | Balance Rs. ${bal.toLocaleString("en-IN")}\n- Parent: ${s.parentMobile}\n- Address: ${s.address}\n- Attendance records: ${attendance.filter(a=> a.studentId===s.id).length} days`);
      } else setOutput(`No student matching "${input}". Try names like "${students[0]?.name||"wedf"}".`);
    } else if(active==="attendance"){
      const total=attendance.length; const present=attendance.filter(a=> a.status==="Present").length;
      const pct= total? Math.round(present/total*100):94;
      setOutput(`📊 Attendance Insights\n- Overall: ${pct}% present (${present}/${total||0} records)\n- Suggestion: Follow up with frequently absent students in ${students[0]?.className||"1st-A"}.\n- Weekly trend: Stable (simulated).`);
    } else if(active==="fees"){
      const collected=transactions.reduce((a,b)=> a+b.amount,0);
      const expected=students.reduce((a,b)=> a+b.totalFees,0);
      setOutput(`💰 Fee Insights\n- Collected: Rs. ${collected.toLocaleString("en-IN")} / Expected Rs. ${expected.toLocaleString("en-IN")}\n- Outstanding: Rs. ${Math.max(0,expected-collected).toLocaleString("en-IN")}\n- Top pending: ${students.filter(s=> s.feesPaid < s.totalFees).slice(0,3).map(s=> `${s.name} (Rs. ${(s.totalFees - s.feesPaid).toLocaleString("en-IN")})`).join(", ")||"None"}`);
    } else if(active==="homework"){
      setOutput(`📚 Homework Idea for "${input || "Mathematics - 1st-A"}":\n- Topic: Fun with Numbers - Addition & Patterns\n- Tasks: (1) Solve 10 sums, (2) Draw number line, (3) Create 5 word problems\n- Due: Tomorrow - Estimated: 30 mins`);
    } else if(active==="notice"){
      setOutput(`📢 NOTICE - JIJAU ENGLISH SCHOOL, TUNGI (B.K.)\nDate: ${new Date().toLocaleDateString("en-GB")}\nSubject: ${input||"General Announcement"}\n\nDear Parents & Students,\nThis is to inform you that ${input||"the scheduled event"} will be held as planned. Please ensure compliance.\n\n- Principal`);
    } else if(active==="report"){
      setOutput(`📄 Report for "${input||students[0]?.className||"1st-A"}"\n- Students: ${students.filter(s=> s.className.includes(input) || !input).length}\n- Avg Fee Paid: Rs. ${Math.round(students.reduce((a,b)=> a+b.feesPaid,0)/Math.max(1,students.length)).toLocaleString("en-IN")}\n- Attendance: ${attendance.length? "Available":"No records yet"}\n- Generated at ${new Date().toLocaleString("en-GB")}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[28px] font-extrabold text-[#1A2B3C]">AI Tools</h1>
        <p className="text-sm text-[#7A6F68]">Premium AI assistants - consistent with Warm Sunset Glass theme. No record is modified without confirmation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map(t=>(
          <button key={t.id} onClick={()=> {setActive(t.id); setOutput("");}} className={`card p-5 text-left card-hover ${active===t.id? "ring-2 ring-[#FF6B1A]":""}`}>
            <div className={`w-10 h-10 rounded-xl grid place-items-center text-lg ${t.color}`}>✦</div>
            <div className="font-extrabold mt-3">{t.name}</div>
            <div className="text-xs text-[#98A2B3] mt-1">{t.desc}</div>
            {active===t.id && <div className="mt-3 text-xs font-black text-[#FF6B1A]">● Active</div>}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="font-extrabold text-[#1A2B3C] capitalize">{tools.find(t=> t.id===active)?.name}</h3>
        <div className="flex gap-2">
          <input className="j-input flex-1" placeholder={active==="assistant"? "Enter student name (e.g. wedf)": active==="notice"? "Enter notice subject": "Enter class / topic"} value={input} onChange={e=> setInput(e.target.value)} onKeyDown={e=> e.key==="Enter" && run()} />
          <button onClick={run} className="btn-primary whitespace-nowrap">Generate ✨</button>
        </div>
        {output && <pre className="bg-[#FFF7ED] p-4 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border border-orange-100">{output}</pre>}
        {!output && <div className="bg-[#F9FAFB] p-6 rounded-xl text-center text-sm text-[#98A2B3]">Enter a prompt and click Generate. AI never auto-modifies records.</div>}
        <div className="flex gap-2">
          <button onClick={()=> { if(output) { navigator.clipboard.writeText(output); alert("Copied!"); }}} className="btn-secondary text-xs">Copy</button>
          <button onClick={()=> { if(output) { const blob=new Blob([output],{type:"text/plain"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`${active}_output.txt`; a.click(); }}} className="btn-secondary text-xs">Download</button>
          <button onClick={()=> { const msg=encodeURIComponent(output||"AI output from Jijau Portal"); window.open(`https://wa.me/?text=${msg}`,"_blank"); }} className="btn-secondary text-xs">Share WhatsApp</button>
        </div>
      </div>
    </div>
  );
}


