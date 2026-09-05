import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TMP_PATH = path.join("/tmp", "jijau_store.json");
const KV_KEY = "jijau_store";
let mem: any = null;

function getRedisConfig(): {url:string; token:string; isKV:boolean} | null {
  const env:any = process.env;
  // Find any REST URL/TOKEN pair, handling custom prefix like STORAGE_*
  const urlKey = Object.keys(env).find(k => k.endsWith("_REST_URL") && (k.includes("KV") || k.includes("UPSTASH") || k.includes("REDIS")));
  const tokenKey = Object.keys(env).find(k => k.endsWith("_REST_TOKEN") && (k.includes("KV") || k.includes("UPSTASH") || k.includes("REDIS")));
  if (urlKey && tokenKey && env[urlKey] && env[tokenKey]) {
    return { url: env[urlKey], token: env[tokenKey], isKV: urlKey.includes("KV_REST") };
  }
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN, isKV: true };
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, isKV: false };
  return null;
}
async function kvGet(): Promise<any | null> {
  try {
    const cfg = getRedisConfig();
    if (!cfg) return null;
    if (cfg.isKV) {
      const { kv } = await import("@vercel/kv");
      return await kv.get(KV_KEY);
    } else {
      const { Redis } = await import("@upstash/redis");
      const r = new Redis({ url: cfg.url, token: cfg.token });
      return await r.get(KV_KEY);
    }
  } catch { return null; }
}
async function kvSet(data: any): Promise<boolean> {
  try {
    const cfg = getRedisConfig();
    if (!cfg) return false;
    if (cfg.isKV) {
      const { kv } = await import("@vercel/kv");
      await kv.set(KV_KEY, data);
      return true;
    } else {
      const { Redis } = await import("@upstash/redis");
      const r = new Redis({ url: cfg.url, token: cfg.token });
      await r.set(KV_KEY, data);
      return true;
    }
  } catch { return false; }
}

function fileGet(): any | null {
  if (mem) return mem;
  try {
    if (fs.existsSync(TMP_PATH)) {
      const raw = fs.readFileSync(TMP_PATH, "utf-8");
      mem = JSON.parse(raw);
      return mem;
    }
  } catch {}
  return null;
}
function fileSet(data: any) {
  mem = data;
  try { fs.writeFileSync(TMP_PATH, JSON.stringify(data), "utf-8"); } catch {}
}

export async function GET() {
  // Try KV first, then file/mem
  const kvData = await kvGet();
  if (kvData) {
    mem = kvData;
    return NextResponse.json(kvData, { headers: { "Cache-Control": "no-store" } });
  }
  const data = fileGet();
  return NextResponse.json(data || { empty: true }, { headers: { "Cache-Control": "no-store" } });
}

function mergeById(a:any[]|undefined, b:any[]|undefined){
  if(!a) return b||[];
  if(!b) return a||[];
  const m=new Map<string,any>();
  for(const x of a) if(x?.id) m.set(x.id, x);
  for(const x of b) if(x?.id) m.set(x.id, x);
  return Array.from(m.values());
}
function applyDeletes(arr:any[]|undefined, delIds:string[]|undefined){
  if(!arr || !delIds || delIds.length===0) return arr;
  const del=new Set(delIds);
  return arr.filter((x:any)=> !del.has(x.id));
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = (await kvGet()) || fileGet() || {};
    // Merge arrays by id to prevent one device's stale 1-student overwriting 3-students
    let merged:any = {
      students: mergeById(existing.students, body.students),
      faculties: mergeById(existing.faculties, body.faculties),
      staff: mergeById(existing.staff, body.staff),
      attendance: mergeById(existing.attendance, body.attendance),
      teacherAttendance: mergeById(existing.teacherAttendance, body.teacherAttendance),
      homework: mergeById(existing.homework, body.homework),
      transactions: mergeById(existing.transactions, body.transactions),
      salaryRecords: mergeById(existing.salaryRecords, body.salaryRecords),
      portalAccounts: mergeById(existing.portalAccounts, body.portalAccounts),
      notices: mergeById(existing.notices, body.notices),
      holidays: body.holidays || existing.holidays,
      settings: body.settings || existing.settings,
      classOptions: body.classOptions || existing.classOptions,
      _updatedAt: Date.now(),
    };
    // Apply explicit deletes
    if(body._deletedStudents) merged.students = applyDeletes(merged.students, body._deletedStudents);
    if(body._deletedTransactions) merged.transactions = applyDeletes(merged.transactions, body._deletedTransactions);
    if(body._deletedFaculties) merged.faculties = applyDeletes(merged.faculties, body._deletedFaculties);
    if(body._deletedStaff) merged.staff = applyDeletes(merged.staff, body._deletedStaff);
    if(body._deletedHomework) merged.homework = applyDeletes(merged.homework, body._deletedHomework);
    if(body._deletedSalaryRecords) merged.salaryRecords = applyDeletes(merged.salaryRecords, body._deletedSalaryRecords);
    if(body._deletedPortalAccounts) merged.portalAccounts = applyDeletes(merged.portalAccounts, body._deletedPortalAccounts);
    if(body._deletedNotices) merged.notices = applyDeletes(merged.notices, body._deletedNotices);
    // Handle deletions: if client explicitly deleted (body has fewer ids and server had more), we need to respect deletes
    // Detect deletions by checking if body array is present and missing ids that were in server but client intentionally removed
    // For now, if body array length < existing length and body array ids are subset, we treat missing as deleted only if body._deletedIds provided
    // To support proper delete, client sends full current state; server merging union will resurrect deleted items.
    // So we check if body has _deletedStudentIds etc? For simplicity, if body.students.length < existing.students.length, we assume deletions and use body's array as source truth
    // We detect explicit delete by comparing: if body.students and existing.students and body.students.length + 5 < existing.students.length, keep body (allow delete)
    // Simpler: if body._forceOverwrite, use body directly. We use heuristic: if body has students and existing has more, but body was just edited (has recent _updatedAt), we should honor body's deletions if body doesn't contain some ids but those ids were deleted recently.
    // For immediate fix, if client sends students array that is strictly subset of existing and client just deleted, we should keep client's array (allow delete).
    // We detect by: if body.students and existing.students and body.students.length < existing.students.length) {
    //   const bodyIds = new Set(body.students.map((x:any)=>x.id));
    //   const missing = existing.students.filter((x:any)=> !bodyIds.has(x.id));
    //   // if missing items were not updated in last 5 min, treat as deleted
    //   merged.students = body.students;
    // }
    // For now, keep merge to prevent auto-delete bug reported (3 vs 1)
    body._updatedAt = merged._updatedAt;
    Object.assign(merged, { _updatedAt: body._updatedAt });
    const ok = await kvSet(merged);
    if (!ok) fileSet(merged);
    else mem = merged;
    return NextResponse.json({ ok: true, _updatedAt: merged._updatedAt, kv: ok, merged: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
