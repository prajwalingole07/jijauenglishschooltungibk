"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Types (unchanged)
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
  holidays: string[];
  setHolidays:(v:string[])=>void;
  classOptions: string[];
  setClassOptions:(v:string[])=>void;
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
  profilePhotos: Record<string, string>;
  updateProfilePhoto: (username: string, photoDataUrl: string) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

function genId(prefix:string){ return prefix+"_"+Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4); }
function receiptNo(prefix:string){
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,4);
  const rand2 = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5);
  return `${prefix}-2026-${rand}-${rand2}`;
}
const DEFAULT_CLASSES = ["Nursery","LKG","UKG","1st-A","1st-B","2nd-A","2nd-B","3rd-A","4th-A","5th-A","6th-A","7th-A","8th-A","9th-A","10th-A"];
const DEFAULT_HOLIDAYS = ["2026-08-15","2026-10-02","2026-11-12","2026-12-25","2026-01-26","2026-01-15","2026-03-08","2026-04-14","2026-05-01"];

// Persistence is now handled in firebase.ts via persistentLocalCache (modern API)
// Keeping this no-op for backwards compat; do NOT call enableIndexedDbPersistence again (deprecated + throws if already enabled)

export function StoreProvider({children}:{children:React.ReactNode}){
  const [students,setStudents]=useState<Student[]>([]);
  const [faculties,setFaculties]=useState<Faculty[]>([]);
  const [staff,setStaff]=useState<Staff[]>([]);
  const [attendance,setAttendance]=useState<AttendanceRecord[]>([]);
  const [teacherAttendance,setTeacherAttendance]=useState<TeacherAttendance[]>([]);
  const [homework,setHomework]=useState<Homework[]>([]);
  const [transactions,setTransactions]=useState<FeeTransaction[]>([]);
  const [salaryRecords,setSalaryRecords]=useState<SalaryRecord[]>([]);
  const [portalAccounts,setPortalAccounts]=useState<PortalAccount[]>([]);
  const [notices,setNotices]=useState<Notice[]>([]);
  const [holidays,setHolidays]=useState<string[]>(DEFAULT_HOLIDAYS);
  const [settings,setSettings]=useState<SchoolSettings>(DEFAULT_SETTINGS);
  const [classOptions,setClassOptions]=useState<string[]>(DEFAULT_CLASSES);
  const [profilePhotos,setProfilePhotos]=useState<Record<string,string>>(()=>{
    if(typeof window !== "undefined"){
      try{
        const raw = localStorage.getItem("jijau_profile_photos");
        if(raw) return JSON.parse(raw);
      }catch{}
    }
    return {};
  });

  // Real-time listeners — live sync across all devices (Firebase)
  // If Firestore rules block access, onSnapshot error handler logs a warning
  // with instructions to update rules in Firebase Console.
  function onSnapError(err: any, label: string) {
    const msg = String(err?.message || err);
    if (msg.includes("permission-denied") || msg.includes("Missing or insufficient permissions")) {
      console.error(`[live-sync] Firestore permission denied for "${label}". Fix: Firebase Console > Firestore > Rules > set allow read, write: if true; then Publish.`);
    } else if (msg.includes("unavailable") || msg.includes("offline")) {
      console.warn(`[live-sync] Firestore offline for "${label}" — will auto-sync when back online.`, msg);
    } else {
      console.warn(`[live-sync] ${label}:`, msg);
    }
  }
  useEffect(()=>{
    const unsubs: (()=>void)[] = [];
    // Students
    unsubs.push(onSnapshot(collection(db, "students"), snap=>{
      const arr: Student[] = snap.docs.map(d=> ({id:d.id, ...(d.data() as any)}));
      if(arr.length===0){
        // seed if empty (only once — check prevents overwrite loop)
        setDoc(doc(db, "students", SEED_STUDENT.id), SEED_STUDENT).catch(()=>{});
        setStudents([SEED_STUDENT]);
      } else {
        setStudents(arr);
      }
    }, (err)=> { onSnapError(err,"students"); setStudents([SEED_STUDENT]); }));
    unsubs.push(onSnapshot(collection(db, "faculties"), snap=>{
      const arr = snap.docs.map(d=> ({id:d.id, ...(d.data() as any)}));
      if(arr.length===0){
        const seeds: Faculty[] = [
          {id:"fac1", name:"Rajesh Patil", designation:"Senior Teacher", subject:"Mathematics", experience:8, className:"1st-A", mobile:"9876543211", aadhaar:"111122223333", baseSalary:45000, address:"Tungi BK", createdAt:new Date().toISOString()},
          {id:"fac2", name:"Sneha Deshmukh", designation:"Teacher", subject:"English", experience:5, className:"2nd-A", mobile:"9876543212", aadhaar:"111122223334", baseSalary:38000, address:"Tungi BK", createdAt:new Date().toISOString()},
        ];
        seeds.forEach(s=> setDoc(doc(db, "faculties", s.id), s).catch(()=>{}));
      } else setFaculties(arr as Faculty[]);
    }, (err)=> onSnapError(err,"faculties")));
    unsubs.push(onSnapshot(collection(db, "staff"), snap=>{
      const arr = snap.docs.map(d=> ({id:d.id, ...(d.data() as any)}));
      if(arr.length===0){
        const s: Staff = {id:"st1", name:"Mahesh Jadhav", role:"Clerk", baseSalary:25000, mobile:"9876543220", aadhaar:"222233334444", address:"Tungi BK", createdAt:new Date().toISOString()};
        setDoc(doc(db, "staff", s.id), s).catch(()=>{});
      } else setStaff(arr as Staff[]);
    }, (err)=> onSnapError(err,"staff")));
    unsubs.push(onSnapshot(collection(db, "attendance"), snap=> setAttendance(snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as AttendanceRecord))), (err)=> onSnapError(err,"attendance")));
    unsubs.push(onSnapshot(collection(db, "teacherAttendance"), snap=> setTeacherAttendance(snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as TeacherAttendance))), (err)=> onSnapError(err,"teacherAttendance")));
    unsubs.push(onSnapshot(collection(db, "homework"), snap=>{
      const arr = snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as Homework));
      if(arr.length===0){
        const hw: Homework = {id:"hw1", facultyId:"fac1", facultyName:"Rajesh Patil", className:"1st-A", subject:"Mathematics", title:"Addition Practice", description:"Solve page 24-25", assignedDate:"2026-08-27", dueDate:"2026-08-28", status:"Assigned"};
        setDoc(doc(db, "homework", hw.id), hw).catch(()=>{});
      } else setHomework(arr);
    }, (err)=> onSnapError(err,"homework")));
    unsubs.push(onSnapshot(collection(db, "transactions"), snap=>{
      const arr = snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as FeeTransaction));
      if(arr.length===0){
        const tx: FeeTransaction = {id:"tx1", studentId:"stu_wedf", receiptNo:"JES-2026-H1VA-3PPQW", date:"2026-08-27T10:30:00.000Z", amount:50000, paymentMode:"CASH", installment:"Installment 1", description:"Tuition Fee", collectedBy:"Prajwal (Admin)", academicYear:"2026-2027"};
        setDoc(doc(db, "transactions", tx.id), tx).catch(()=>{});
      } else setTransactions(arr);
    }, (err)=> onSnapError(err,"transactions")));
    unsubs.push(onSnapshot(collection(db, "salaryRecords"), snap=> setSalaryRecords(snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as SalaryRecord))), (err)=> onSnapError(err,"salaryRecords")));
    unsubs.push(onSnapshot(collection(db, "portalAccounts"), snap=> setPortalAccounts(snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as PortalAccount))), (err)=> onSnapError(err,"portalAccounts")));
    unsubs.push(onSnapshot(collection(db, "notices"), snap=> setNotices(snap.docs.map(d=> ({id:d.id, ...(d.data() as any)} as Notice))), (err)=> onSnapError(err,"notices")));
    // Meta docs
    unsubs.push(onSnapshot(doc(db, "meta", "settings"), snap=>{
      if(snap.exists()) setSettings(snap.data() as SchoolSettings);
      else setDoc(doc(db, "meta", "settings"), DEFAULT_SETTINGS).catch(()=>{});
    }, (err)=> onSnapError(err,"meta/settings")));
    unsubs.push(onSnapshot(doc(db, "meta", "holidays"), snap=>{
      if(snap.exists()) setHolidays((snap.data() as any).values || DEFAULT_HOLIDAYS);
      else setDoc(doc(db, "meta", "holidays"), {values: DEFAULT_HOLIDAYS}).catch(()=>{});
    }, (err)=> onSnapError(err,"meta/holidays")));
    unsubs.push(onSnapshot(doc(db, "meta", "classOptions"), snap=>{
      if(snap.exists()) setClassOptions((snap.data() as any).values || DEFAULT_CLASSES);
      else setDoc(doc(db, "meta", "classOptions"), {values: DEFAULT_CLASSES}).catch(()=>{});
    }, (err)=> onSnapError(err,"meta/classOptions")));
    // Sync profile photos across all devices in real-time
    unsubs.push(onSnapshot(collection(db, "profilePhotos"), snap=>{
      const map: Record<string, string> = {};
      snap.docs.forEach(d=>{
        const data = d.data() as any;
        if(data?.photo) map[d.id] = data.photo;
      });
      if(Object.keys(map).length > 0){
        setProfilePhotos(prev=> ({ ...prev, ...map }));
        try{
          const existing = JSON.parse(localStorage.getItem("jijau_profile_photos")||"{}");
          localStorage.setItem("jijau_profile_photos", JSON.stringify({ ...existing, ...map }));
          window.dispatchEvent(new CustomEvent("jijau_profile"));
        }catch{}
      }
    }, (err)=> onSnapError(err,"profilePhotos")));
    return ()=> unsubs.forEach(u=> u());
  },[]);

  const api: Store = {
    students, faculties, staff, attendance, teacherAttendance, homework, transactions, salaryRecords, portalAccounts, notices, holidays, settings, classOptions, setClassOptions: (v)=> setDoc(doc(db, "meta", "classOptions"), {values:v}),
    setHolidays:(v)=> setDoc(doc(db, "meta", "holidays"), {values:v}),
    addStudent:(s)=> {
      const id=genId("stu");
      const rec={...s, id, createdAt:new Date().toISOString()};
      setDoc(doc(db, "students", id), rec);
      try{ window.dispatchEvent(new CustomEvent("jijau_saved",{detail:{message:`✓ Student ${s.name} added`, type:"success"}})); }catch{}
    },
    updateStudent:(id,patch)=> { updateDoc(doc(db, "students", id), patch as any).catch(()=> setDoc(doc(db, "students", id), patch as any)); },
    deleteStudent:(id)=> {
      deleteDoc(doc(db, "students", id));
      // cascade deletes (client will also be reflected via listeners, but do firestore deletes)
      getDocs(collection(db, "transactions")).then(snap=> snap.forEach(d=> { if((d.data() as any).studentId===id) deleteDoc(d.ref); }));
      getDocs(collection(db, "attendance")).then(snap=> snap.forEach(d=> { if((d.data() as any).studentId===id) deleteDoc(d.ref); }));
    },
    addFaculty:(f)=> { const id=genId("fac"); setDoc(doc(db, "faculties", id), {...f, id, createdAt:new Date().toISOString()}); },
    updateFaculty:(id,patch)=> updateDoc(doc(db, "faculties", id), patch as any),
    deleteFaculty:(id)=> deleteDoc(doc(db, "faculties", id)),
    addStaff:(s)=> { const id=genId("stf"); setDoc(doc(db, "staff", id), {...s, id, createdAt:new Date().toISOString()}); },
    updateStaff:(id,patch)=> updateDoc(doc(db, "staff", id), patch as any),
    deleteStaff:(id)=> deleteDoc(doc(db, "staff", id)),
    upsertAttendance:(date,className,entries)=>{
      // delete old for date/class then add new
      getDocs(collection(db, "attendance")).then(snap=>{
        snap.forEach(d=>{
          const v=d.data() as any;
          if(v.date===date && v.className===className) deleteDoc(d.ref);
        });
        entries.forEach(e=>{
          const id=genId("att");
          setDoc(doc(db, "attendance", id), {id, date, className, studentId:e.studentId, status:e.status});
        });
      });
    },
    upsertTeacherAttendance:(date, entries)=>{
      getDocs(collection(db, "teacherAttendance")).then(snap=>{
        snap.forEach(d=>{ if((d.data() as any).date===date) deleteDoc(d.ref); });
        entries.forEach(e=>{
          const id=genId("tatt");
          setDoc(doc(db, "teacherAttendance", id), {id, date, facultyId:e.facultyId, status:e.status, markedBy:e.markedBy, updatedAt:new Date().toISOString()});
        });
      });
    },
    markTeacherSelf:(facultyId, date, status)=>{
      getDocs(collection(db, "teacherAttendance")).then(snap=>{
        snap.forEach(d=>{ const v=d.data() as any; if(v.date===date && v.facultyId===facultyId) deleteDoc(d.ref); });
        const id=genId("tatt");
        setDoc(doc(db, "teacherAttendance", id), {id, date, facultyId, status, markedBy:"self", updatedAt:new Date().toISOString()});
      });
    },
    addHomework:(h)=> { const id=genId("hw"); setDoc(doc(db, "homework", id), {...h, id}); },
    updateHomework:(id,patch)=> updateDoc(doc(db, "homework", id), patch as any),
    deleteHomework:(id)=> deleteDoc(doc(db, "homework", id)),
    collectFee:(tx)=>{
      const rec:FeeTransaction = {...tx, id:genId("tx"), receiptNo: receiptNo(settings.receiptPrefix || "JES")};
      setDoc(doc(db, "transactions", rec.id), rec);
      // update student's feesPaid
      const stu = students.find(s=> s.id===tx.studentId);
      if(stu) updateDoc(doc(db, "students", stu.id), {feesPaid: stu.feesPaid + tx.amount}).catch(()=>{});
      return rec;
    },
    deleteReceipt:(receiptNo)=>{
      const tx = transactions.find(t=> t.receiptNo===receiptNo);
      if(tx){
        // revert feesPaid
        const stu = students.find(s=> s.id===tx.studentId);
        if(stu) updateDoc(doc(db, "students", stu.id), {feesPaid: Math.max(0, stu.feesPaid - tx.amount)}).catch(()=>{});
        // find doc id by receiptNo
        getDocs(collection(db, "transactions")).then(snap=> snap.forEach(d=> { if((d.data() as any).receiptNo===receiptNo) deleteDoc(d.ref); }));
      }
    },
    addSalary:(r)=> { const id=genId("sal"); setDoc(doc(db, "salaryRecords", id), {...r, id}); },
    addPortal:(p)=>{
      const id=genId("por");
      const entry:PortalAccount={id, facultyId:p.facultyId, facultyName:p.facultyName, className:p.className, portalId:p.portalId, passwordHash:"hashed_"+p.password, status:p.status, createdAt:new Date().toISOString()};
      setDoc(doc(db, "portalAccounts", id), entry);
    },
    updatePortal:(id,patch)=> updateDoc(doc(db, "portalAccounts", id), patch as any),
    deletePortal:(id)=> deleteDoc(doc(db, "portalAccounts", id)),
    updateSettings:(patch)=> updateDoc(doc(db, "meta", "settings"), patch).catch(()=> setDoc(doc(db, "meta", "settings"), {...DEFAULT_SETTINGS, ...patch})),
    addNotice:(n)=> { const id=genId("not"); const rec:Notice={...n, id, publishedAt:new Date().toISOString()}; setDoc(doc(db, "notices", id), rec); },
    deleteNotice:(id)=> deleteDoc(doc(db, "notices", id)),
    profilePhotos,
    updateProfilePhoto: async (username: string, photoDataUrl: string) => {
      let finalPhoto = photoDataUrl;
      try {
        if (typeof window !== "undefined" && photoDataUrl.startsWith("data:image")) {
          finalPhoto = await new Promise<string>((resolve) => {
            const img = new Image();
            img.onload = () => {
              let w = img.width;
              let h = img.height;
              const maxDim = 320;
              if (w > maxDim || h > maxDim) {
                if (w > h) {
                  h = Math.round((h * maxDim) / w);
                  w = maxDim;
                } else {
                  w = Math.round((w * maxDim) / h);
                  h = maxDim;
                }
              }
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
              } else {
                resolve(photoDataUrl);
              }
            };
            img.onerror = () => resolve(photoDataUrl);
            img.src = photoDataUrl;
          });
        }
      } catch {}

      setProfilePhotos(prev => ({ ...prev, [username]: finalPhoto }));
      try {
        const raw = localStorage.getItem("jijau_profile_photos");
        const m = raw ? JSON.parse(raw) : {};
        m[username] = finalPhoto;
        localStorage.setItem("jijau_profile_photos", JSON.stringify(m));
        window.dispatchEvent(new CustomEvent("jijau_profile"));
        window.dispatchEvent(new Event("storage"));
      } catch {}

      try {
        await setDoc(doc(db, "profilePhotos", username), {
          username,
          photo: finalPhoto,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn("[profilePhotos] Failed to sync to Firestore:", e);
      }
    },
  };
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}
export function useStore(){
  const ctx=useContext(StoreContext);
  if(!ctx) throw new Error("Store not found");
  return ctx;
}
