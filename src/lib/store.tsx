"use client";
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

// Types
export type Student = {
  id: string; name: string; gender: "Male"|"Female"|"Other"; roll: string; aadhaar: string;
  className: string; category: string; motherName: string; parentMobile: string;
  address: string; totalFees: number; feesPaid: number; photo?: string;
  academicYear: string; admissionDate: string; createdAt: string;
};
export type Faculty = {
  id: string; name: string; designation: string; subject: string; experience: number;
  className: string; mobile: string; aadhaar: string; baseSalary: number; address: string; photo?: string; createdAt: string;
};
export type Staff = {
  id: string; name: string; role: string; baseSalary: number; mobile: string; aadhaar: string; address: string; photo?: string; createdAt: string;
};
export type AttendanceRecord = { id:string; date:string; className:string; studentId:string; status:"Present"|"Absent"; };
export type TeacherAttendance = { id:string; date:string; facultyId:string; status:"Present"|"Absent"; markedBy?:string; updatedAt?:string; };
export type Homework = { id:string; facultyId:string; facultyName:string; className:string; subject:string; title:string; description:string; assignedDate:string; dueDate:string; status:"Assigned"|"Completed"|"Pending"|"Not Submitted"; image?:string; };
export type FeeTransaction = { id:string; studentId:string; receiptNo:string; date:string; amount:number; paymentMode:string; installment:string; description:string; collectedBy:string; academicYear:string; proofImage?:string; utr?:string; txnNo?:string; };
export type SalaryRecord = { id:string; personId:string; personType:"faculty"|"staff"; month:string; amount:number; status:"Paid"|"Pending"|"Partial"; date:string; proofImage?:string; utr?:string; mode?:string; };
export type PortalAccount = { id:string; facultyId:string; facultyName:string; className:string; portalId:string; passwordHash:string; status:"Active"|"Disabled"; createdAt:string; };
export type Notice = { id:string; title:string; content:string; publishedBy:string; publishedAt:string; target:string; };
export type HolidayRange = { id:string; name:string; from:string; to:string; };
export type SchoolSettings = { schoolName:string; schoolSub:string; address:string; phone:string; email:string; academicYear:string; receiptPrefix:string; signatureName:string; currency:string; logo?:string; };
export type ProfilePhotos = Record<string, string>;

const SEED_STUDENT: Student = {
  id:"stu_wedf", name:"wedf", gender:"Male", roll:"562", aadhaar:"123412341234", className:"1st-A", category:"OPEN", motherName:"Sunita", parentMobile:"9876543210", address:"Tungi BK, Maharashtra", totalFees:100000, feesPaid:50000, academicYear:"2026-2027", admissionDate:"2026-08-27", createdAt:"2026-08-27T10:00:00.000Z"
};

const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName:"JIJAU ENGLISH SCHOOL",
  schoolSub:"TUNGI (B.K.)",
  address:"Tungi BK, Maharashtra, India",
  phone:"+91 98765 43210",
  email:"jijau.school@gmail.com",
  academicYear:"2026-2027",
  receiptPrefix:"JES",
  signatureName:"Prajwal (Admin)",
  currency:"Rs. "
};

type Store = {
  students: Student[]; faculties: Faculty[]; staff: Staff[];
  attendance: AttendanceRecord[]; teacherAttendance: TeacherAttendance[]; homework: Homework[]; transactions: FeeTransaction[];
  salaryRecords: SalaryRecord[]; portalAccounts: PortalAccount[]; settings: SchoolSettings; notices: Notice[];
  profilePhotos: ProfilePhotos;
  addStudent:(s:Omit<Student,"id"|"createdAt">)=>void;
  updateStudent:(id:string, patch:Partial<Student>)=>void;
  deleteStudent:(id:string)=>void;
  addFaculty:(f:Omit<Faculty,"id"|"createdAt">)=>void;
  updateFaculty:(id:string, patch:Partial<Faculty>)=>void;
  deleteFaculty:(id:string)=>void;
  addStaff:(s:Omit<Staff,"id"|"createdAt">)=>void;
  updateStaff:(id:string,patch:Partial<Staff>)=>void;
  deleteStaff:(id:string)=>void;
  upsertAttendance:(date:string, className:string, entries:{studentId:string,status:"Present"|"Absent"}[])=>void;
  upsertTeacherAttendance:(date:string, entries:{facultyId:string,status:"Present"|"Absent", markedBy?:string}[])=>void;
  markTeacherSelf:(facultyId:string, date:string, status:"Present"|"Absent")=>void;
  addHomework:(h:Omit<Homework,"id">)=>void;
  updateHomework:(id:string,patch:Partial<Homework>)=>void;
  deleteHomework:(id:string)=>void;
  collectFee:(tx: Omit<FeeTransaction,"id"|"receiptNo">)=> FeeTransaction;
  deleteReceipt:(receiptNo:string)=>void;
  addSalary:(r:Omit<SalaryRecord,"id">)=>void;
  addPortal:(p:Omit<PortalAccount,"id"|"createdAt"|"passwordHash"> & {password:string})=>void;
  updatePortal:(id:string,patch:Partial<PortalAccount>)=>void;
  deletePortal:(id:string)=>void;
  updateSettings:(patch:Partial<SchoolSettings>)=>void;
  addNotice:(n:Omit<Notice,"id"|"publishedAt">)=>void;
  deleteNotice:(id:string)=>void;
  holidays: string[];
  setHolidays:(v:string[])=>void;
  classOptions: string[];
  setClassOptions:(v:string[])=>void;
  setProfilePhoto:(username:string, dataUrl:string)=>void;
  clearProfilePhoto:(username:string)=>void;
  syncNow:()=>Promise<void>;
  isSyncing: boolean;
  serverUrl: string;
  setServerUrl:(url:string)=>void;
  pingLatency: number;
};

const StoreContext = createContext<Store | null>(null);
const LS_KEY="jijau_store_v2";
const SERVER_URL_KEY="jijau_live_server_url";

function genId(prefix:string){ return prefix+"_"+Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
function receiptNo(prefix:string){
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);
  const rand2 = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
  return `${prefix}-2026-${rand}-${rand2}`;
}
const DEFAULT_CLASSES = ["Nursery","LKG","UKG","1st-A","1st-B","2nd-A","2nd-B","3rd-A","4th-A","5th-A","6th-A","7th-A","8th-A","9th-A","10th-A"];
const DEFAULT_HOLIDAYS = ["2026-08-15","2026-10-02","2026-11-12","2026-12-25","2026-01-26","2026-01-15","2026-03-08","2026-04-14","2026-05-01"];

export function StoreProvider({children}:{children:React.ReactNode}){
  const [students,setStudents]=useState<Student[]>([SEED_STUDENT]);
  const [faculties,setFaculties]=useState<Faculty[]>([
    {id:"fac1", name:"Rajesh Patil", designation:"Senior Teacher", subject:"Mathematics", experience:8, className:"1st-A", mobile:"9876543211", aadhaar:"111122223333", baseSalary:45000, address:"Tungi BK", createdAt:new Date().toISOString()},
    {id:"fac2", name:"Sneha Deshmukh", designation:"Teacher", subject:"English", experience:5, className:"2nd-A", mobile:"9876543212", aadhaar:"111122223334", baseSalary:38000, address:"Tungi BK", createdAt:new Date().toISOString()},
  ]);
  const [staff,setStaff]=useState<Staff[]>([
    {id:"st1", name:"Mahesh Jadhav", role:"Clerk", baseSalary:25000, mobile:"9876543220", aadhaar:"222233334444", address:"Tungi BK", createdAt:new Date().toISOString()},
  ]);
  const [attendance,setAttendance]=useState<AttendanceRecord[]>([]);
  const [teacherAttendance,setTeacherAttendance]=useState<TeacherAttendance[]>([]);
  const [homework,setHomework]=useState<Homework[]>([
    {id:"hw1", facultyId:"fac1", facultyName:"Rajesh Patil", className:"1st-A", subject:"Mathematics", title:"Addition Practice", description:"Solve page 24-25", assignedDate:"2026-08-27", dueDate:"2026-08-28", status:"Assigned"},
  ]);
  const [transactions,setTransactions]=useState<FeeTransaction[]>([
    {id:"tx1", studentId:"stu_wedf", receiptNo:"JES-2026-H1VA-3PPQW", date:"2026-08-27T10:30:00.000Z", amount:50000, paymentMode:"CASH", installment:"Installment 1", description:"Tuition Fee", collectedBy:"Prajwal (Admin)", academicYear:"2026-2027"}
  ]);
  const [salaryRecords,setSalaryRecords]=useState<SalaryRecord[]>([]);
  const [portalAccounts,setPortalAccounts]=useState<PortalAccount[]>([]);
  const [notices,setNotices]=useState<Notice[]>([]);
  const [profilePhotos,setProfilePhotos]=useState<ProfilePhotos>({});
  const [holidays,setHolidays]=useState<string[]>(DEFAULT_HOLIDAYS);
  const [settings,setSettings]=useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [classOptions,setClassOptions]=useState<string[]>(DEFAULT_CLASSES);
  const [hydrated,setHydrated]=useState(false);
  const [isSyncing,setIsSyncing]=useState(false);
  const [pingLatency,setPingLatency]=useState(24);
  const [serverUrl,setServerUrlState]=useState<string>(()=>{
    if(typeof window!=="undefined"){
      return localStorage.getItem(SERVER_URL_KEY) || "";
    }
    return "";
  });

  const lastCloudAt = useRef(0);
  const isPushing = useRef(false);
  const pendingDeletes = useRef<{students:string[], transactions:string[], faculties:string[], staff:string[], homework:string[], salaryRecords:string[], portalAccounts:string[], notices:string[], attendance:string[], teacherAttendance:string[]}>({students:[], transactions:[], faculties:[], staff:[], homework:[], salaryRecords:[], portalAccounts:[], notices:[], attendance:[], teacherAttendance:[]});

  const setServerUrl = (url:string)=>{
    const clean = url.trim().replace(/\/+$/, "");
    setServerUrlState(clean);
    if(typeof window!=="undefined"){
      if(clean) localStorage.setItem(SERVER_URL_KEY, clean);
      else localStorage.removeItem(SERVER_URL_KEY);
    }
  };

  const getApiUrl = useCallback(()=>{
    if(serverUrl && serverUrl.startsWith("http")){
      return `${serverUrl}/api/store`;
    }
    return "/api/store";
  }, [serverUrl]);

  // Cloud sync helpers
  const applyPayload = useCallback((p:any)=>{
    if(!p || p.empty) return false;
    if(p.students) {
      const patched = (p.students as Student[]).map((s:any)=> ({...s, admissionDate: s.admissionDate || (s.createdAt ? s.createdAt.slice(0,10) : new Date().toISOString().slice(0,10))}));
      setStudents(patched);
    }
    if(p.faculties) setFaculties(p.faculties);
    if(p.staff) setStaff(p.staff);
    if(p.attendance) setAttendance(p.attendance);
    if(p.teacherAttendance) setTeacherAttendance(p.teacherAttendance);
    if(p.homework) setHomework(p.homework);
    if(p.transactions) setTransactions(p.transactions);
    if(p.salaryRecords) setSalaryRecords(p.salaryRecords);
    if(p.portalAccounts) setPortalAccounts(p.portalAccounts);
    if(p.notices) setNotices(p.notices);
    if(p.profilePhotos) setProfilePhotos(p.profilePhotos);
    if(p.holidays) setHolidays(p.holidays);
    if(p.settings) setSettings(p.settings);
    if(p.classOptions) setClassOptions(p.classOptions);
    if(p._updatedAt) lastCloudAt.current = p._updatedAt;
    return true;
  }, []);

  const fetchCloud = useCallback(async()=>{
    if (isPushing.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const t0 = performance.now();
    try{
      setIsSyncing(true);
      const url = getApiUrl();
      const r = await fetch(url, { cache: "no-store" });
      const lat = Math.round(performance.now() - t0);
      setPingLatency(lat);

      if(r.ok){
        const p = await r.json();
        if(p && !p.empty && p._updatedAt && p._updatedAt > lastCloudAt.current){
          applyPayload(p);
          try{
            window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`⚡ Live synced (${lat}ms)`, type:"info"}}));
          }catch{}
        }
      }
    }catch{}
    finally{
      setIsSyncing(false);
    }
  }, [applyPayload, getApiUrl]);

  // Initial load
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      // 1. try cloud first
      try{
        const url = getApiUrl();
        const r = await fetch(url, { cache: "no-store" });
        if(r.ok){
          const p = await r.json();
          if(p && !p.empty && p._updatedAt){
            if(!cancelled) applyPayload(p);
          }
        }
      }catch{}
      // 2. fallback to localStorage if cloud empty
      try{
        const raw=localStorage.getItem(LS_KEY);
        if(raw){
          const p=JSON.parse(raw);
          if(!lastCloudAt.current){
            applyPayload(p);
          }
        }
      }catch{}
      if(!cancelled) setHydrated(true);
    })();
    return()=>{ cancelled=true; };
  },[applyPayload, getApiUrl]);

  // live sync: listen to storage changes from other tabs / roles
  useEffect(()=>{
    const onStorage=(e:StorageEvent)=>{
      if(e.key!==LS_KEY || !e.newValue) return;
      try{
        const p=JSON.parse(e.newValue);
        applyPayload(p);
      }catch{}
    };
    window.addEventListener("storage",onStorage);
    return ()=> window.removeEventListener("storage",onStorage);
  },[applyPayload]);

  // Fast Cloud Live Sync: Poll every 2.5 seconds + on window focus & online
  useEffect(()=>{
    const interval = setInterval(() => {
      if (typeof navigator !== "undefined" && navigator.onLine) {
        fetchCloud();
      }
    }, 1800);
    const onFocus = () => fetchCloud();
    const onVis = () => { if(document.visibilityState==="visible") fetchCloud(); };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return ()=>{
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  },[fetchCloud]);

  // Save to LocalStorage & Push to Cloud Live Server on state change
  useEffect(()=>{
    if(!hydrated) return;
    const payload = {
      students, faculties, staff, attendance, teacherAttendance, homework,
      transactions, salaryRecords, portalAccounts, notices, holidays, settings, classOptions,
      profilePhotos,
      _savedAt: new Date().toISOString()
    };
    try{ localStorage.setItem(LS_KEY, JSON.stringify(payload)); }catch{}

    // Debounced cloud push (250ms)
    const timeout = setTimeout(async ()=>{
      if(isPushing.current) return;
      isPushing.current = true;
      try{
        const dels = pendingDeletes.current;
        const pushBody = {
          ...payload,
          _deletedStudents: dels.students.slice(),
          _deletedTransactions: dels.transactions.slice(),
          _deletedFaculties: dels.faculties.slice(),
          _deletedStaff: dels.staff.slice(),
          _deletedHomework: dels.homework.slice(),
          _deletedSalaryRecords: dels.salaryRecords.slice(),
          _deletedPortalAccounts: dels.portalAccounts.slice(),
          _deletedNotices: dels.notices.slice(),
        };

        const url = getApiUrl();
        const r = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pushBody)
        });

        if(r.ok){
          const res = await r.json();
          if(res._updatedAt) lastCloudAt.current = res._updatedAt;
          // Clear pending deletes
          pendingDeletes.current = {students:[], transactions:[], faculties:[], staff:[], homework:[], salaryRecords:[], portalAccounts:[], notices:[], attendance:[], teacherAttendance:[]};
        }
      }catch{}
      finally{
        isPushing.current = false;
      }
    }, 250);

    return () => clearTimeout(timeout);
  },[students, faculties, staff, attendance, teacherAttendance, homework, transactions, salaryRecords, portalAccounts, notices, holidays, settings, classOptions, profilePhotos, hydrated, getApiUrl]);

  const api:Store = {
    students, faculties, staff, attendance, teacherAttendance, homework, transactions, salaryRecords, portalAccounts, settings, notices, holidays, classOptions, profilePhotos,
    isSyncing,
    serverUrl,
    setServerUrl,
    pingLatency,
    syncNow: fetchCloud,
    setClassOptions:(v)=> setClassOptions(v),
    setProfilePhoto:(username, dataUrl)=> {
      setProfilePhotos(prev => ({ ...prev, [username]: dataUrl }));
    },
    clearProfilePhoto:(username)=> {
      setProfilePhotos(prev => {
        const next = { ...prev };
        delete next[username];
        return next;
      });
    },
    addStudent:(s)=> {
      const fullDate = s.admissionDate || new Date().toISOString().slice(0,10);
      const rec:Student = {...s, id:genId("stu"), admissionDate:fullDate, createdAt:new Date().toISOString()};
      setStudents(prev=> [rec, ...prev]);
      try{
        window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Student ${s.name} added`, type:"success"}}));
        window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: New student ${s.name} (${s.className})`}}));
      }catch{}
    },
    updateStudent:(id,patch)=> {
      setStudents(prev=> prev.map(x=> x.id===id? {...x,...patch}:x));
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"✏️ Student updated", type:"success"}})); }catch{}
    },
    deleteStudent:(id)=> {
      pendingDeletes.current.students.push(id);
      setStudents(prev=> prev.filter(x=> x.id!==id));
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Student removed", type:"info"}})); }catch{}
    },
    addFaculty:(f)=> { setFaculties(prev=> [{...f, id:genId("fac"), createdAt:new Date().toISOString()}, ...prev]); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Faculty ${f.name} added`, type:"success"}})); }catch{} },
    updateFaculty:(id,patch)=> { setFaculties(prev=> prev.map(x=> x.id===id? {...x,...patch}:x)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Faculty updated", type:"success"}})); }catch{} },
    deleteFaculty:(id)=> { pendingDeletes.current.faculties.push(id); setFaculties(prev=> prev.filter(x=> x.id!==id)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Faculty deleted", type:"info"}})); }catch{} },
    addStaff:(s)=> { setStaff(prev=> [{...s, id:genId("st"), createdAt:new Date().toISOString()}, ...prev]); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Staff ${s.name} added`, type:"success"}})); }catch{} },
    updateStaff:(id,patch)=> { setStaff(prev=> prev.map(x=> x.id===id? {...x,...patch}:x)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Staff updated", type:"success"}})); }catch{} },
    deleteStaff:(id)=> { pendingDeletes.current.staff.push(id); setStaff(prev=> prev.filter(x=> x.id!==id)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Staff deleted", type:"info"}})); }catch{} },
    upsertAttendance:(date, className, entries)=>{
      setAttendance(prev=>{
        const filtered = prev.filter(a=> !(a.date===date && a.className===className));
        const newRecords:AttendanceRecord[] = entries.map(e=> ({id:genId("att"), date, className, studentId:e.studentId, status:e.status}));
        return [...filtered, ...newRecords];
      });
      try{ window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: Attendance updated for ${className}`}})); }catch{}
    },
    upsertTeacherAttendance:(date, entries)=>{
      setTeacherAttendance(prev=>{
        const facultyIds = new Set(entries.map(e=> e.facultyId));
        const filtered = prev.filter(a=> !(a.date===date && facultyIds.has(a.facultyId)));
        const newRecords:TeacherAttendance[] = entries.map(e=> ({id:genId("tatt"), date, facultyId:e.facultyId, status:e.status, markedBy:e.markedBy||"admin", updatedAt:new Date().toISOString()}));
        return [...filtered, ...newRecords];
      });
      try{ window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: Teacher attendance saved for ${date}`}})); }catch{}
    },
    markTeacherSelf:(facultyId, date, status)=>{
      setTeacherAttendance(prev=>{
        const filtered=prev.filter(a=> !(a.date===date && a.facultyId===facultyId));
        return [...filtered, {id:genId("tatt"), date, facultyId, status, markedBy:"self", updatedAt:new Date().toISOString()}];
      });
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Self attendance marked ${status}`, type:"success"}})); }catch{}
    },
    addHomework:(h)=> { setHomework(prev=> [{...h, id:genId("hw")}, ...prev]); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Homework "${h.title}" added`, type:"success"}})); window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: New homework ${h.title} for ${h.className}`}})); }catch{} },
    updateHomework:(id,patch)=> { setHomework(prev=> prev.map(x=> x.id===id? {...x,...patch}:x)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"✏️ Homework updated", type:"success"}})); }catch{} },
    deleteHomework:(id)=> { pendingDeletes.current.homework.push(id); setHomework(prev=> prev.filter(x=> x.id!==id)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Homework deleted", type:"info"}})); }catch{} },
    collectFee:(tx)=>{
      const rec:FeeTransaction = {...tx, id:genId("tx"), receiptNo: receiptNo(settings.receiptPrefix || "JES")};
      setTransactions(prev=> [rec, ...prev]);
      setStudents(prev=> prev.map(s=> s.id===tx.studentId? {...s, feesPaid: s.feesPaid + tx.amount}:s));
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Fee Rs. ${tx.amount.toLocaleString("en-IN")} collected`, type:"success"}})); window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: Fee collected Rs. ${tx.amount.toLocaleString("en-IN")}`}})); }catch{}
      return rec;
    },
    deleteReceipt:(receiptNo)=>{
      const tx = transactions.find(t=> t.receiptNo===receiptNo);
      if(tx){ pendingDeletes.current.transactions.push(tx.id); }
      if(tx){
        setStudents(prev=> prev.map(s=> s.id===tx.studentId? {...s, feesPaid: Math.max(0, s.feesPaid - tx.amount)}:s));
        setTransactions(prev=> prev.filter(t=> t.receiptNo!==receiptNo));
      }
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Receipt deleted", type:"info"}})); }catch{}
    },
    addSalary:(r)=> { setSalaryRecords(prev=> [{...r, id:genId("sal")}, ...prev]); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Salary Rs. ${r.amount.toLocaleString("en-IN")} recorded`, type:"success"}})); }catch{} },
    addPortal:(p)=>{
      const entry:PortalAccount={id:genId("por"), facultyId:p.facultyId, facultyName:p.facultyName, className:p.className, portalId:p.portalId, passwordHash:"hashed_"+p.password, status:p.status, createdAt:new Date().toISOString()};
      setPortalAccounts(prev=> [entry, ...prev]);
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"✓ Portal created", type:"success"}})); }catch{}
    },
    updatePortal:(id,patch)=> { setPortalAccounts(prev=> prev.map(x=> x.id===id? {...x,...patch}:x)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Portal updated", type:"info"}})); }catch{} },
    deletePortal:(id)=> { pendingDeletes.current.portalAccounts.push(id); setPortalAccounts(prev=> prev.filter(x=> x.id!==id)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Portal deleted", type:"info"}})); }catch{} },
    updateSettings:(patch)=> { setSettings(prev=> ({...prev,...patch})); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Settings saved", type:"success"}})); }catch{} },
    addNotice:(n)=> {
      const rec:Notice={...n, id:genId("not"), publishedAt:new Date().toISOString()};
      setNotices(prev=> [rec,...prev]);
      try{
        window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`📢 Notice published: ${n.title}`, type:"success"}}));
        window.dispatchEvent(new CustomEvent("jijau_live_edit",{detail:{message:`Live: New notice "${n.title}"`}}));
        import("@/lib/notifications").then(m => {
          m.sendMobileDeviceNotification(`Jijau School: ${n.title}`, {
            body: n.content ? `${n.content}\nTarget: ${n.target}` : `New notice for ${n.target}`,
            url: "/notices",
          });
        }).catch(()=>{});
      }catch{}
    },
    deleteNotice:(id)=> { pendingDeletes.current.notices.push(id); setNotices(prev=> prev.filter(x=> x.id!==id)); try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:"Notice deleted", type:"info"}})); }catch{} },
    setHolidays:(v)=> setHolidays(v),
  };
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
export function useStore(){
  const ctx=useContext(StoreContext);
  if(!ctx) throw new Error("Store not found");
  return ctx;
}
