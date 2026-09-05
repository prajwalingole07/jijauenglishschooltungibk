"use client";
import React from "react";

export function Card({children, className=""}:{children:React.ReactNode; className?:string}){
  return <div className={`card p-5 ${className}`}>{children}</div>;
}
export function PillTabs({tabs, active, onChange}:{tabs:string[]; active:string; onChange:(v:string)=>void}){
  return (
    <div className="flex gap-1.5 p-1 bg-white rounded-full border border-black/5 w-fit shadow-sm">
      {tabs.map(t=>(
        <button key={t} onClick={()=> onChange(t)} className={`tab-pill ${active===t? "active":"inactive"}`}>{t}</button>
      ))}
    </div>
  );
}
import { IconSearch, IconBook } from "./IOSIcons";
export function SearchBox({value,onChange,placeholder}:{value:string; onChange:(v:string)=>void; placeholder:string}){
  return (
    <div className="search-wrap flex-1 min-w-[220px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3]"><IconSearch size={16} /></span>
      <input className="j-input" placeholder={placeholder} value={value} onChange={e=> onChange(e.target.value)} />
    </div>
  );
}
export function Empty({title, actionLabel, onAction}:{title:string; actionLabel?:string; onAction?:()=>void}){
  return (
    <div className="card p-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF2E2] grid place-items-center mx-auto"><IconBook size={22} className="text-[#FF6B1A]" /></div>
      <div className="mt-3 font-bold text-[#2D2D2D]">{title}</div>
      <div className="text-sm text-[#98A2B3] mt-1">No records found</div>
      {actionLabel && onAction && <button onClick={onAction} className="btn-primary mt-4">{actionLabel}</button>}
    </div>
  );
}
export function StatCard({label, value, sub, icon, color}:{label:string; value:string; sub?:string; icon:React.ReactNode; color:string}){
  const map:any={peach:"icon-peach", pink:"icon-pink", green:"icon-green", blue:"icon-blue", amber:"icon-amber"};
  return (
    <div className="card p-5 flex items-center justify-between card-hover">
      <div>
        <div className="text-[11px] font-bold tracking-[0.12em] text-[#9A6A52]">{label}</div>
        <div className="text-[28px] font-extrabold text-[#1A2B3C] leading-none mt-2" style={{color: color==="green"?"#16A34A": color==="red"?"#DC2626":undefined}}>{value}</div>
        {sub && <div className="text-xs text-[#98A2B3] mt-1">{sub}</div>}
      </div>
      <div className={`icon-soft ${map[color]||"icon-peach"}`}>{icon}</div>
    </div>
  );
}

