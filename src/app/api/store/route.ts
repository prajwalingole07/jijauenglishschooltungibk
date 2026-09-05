import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TMP_PATH = path.join("/tmp", "jijau_store.json");
const KV_KEY = "jijau_store_v2";
const CLOUD_FALLBACK_URL = "https://kvdb.io/5q3LzGjS8f8m9m3Q5y1/jijau_school_v2";

let mem: any = null;

// Universal CORS & zero-cache headers for WebToApp / APK / multi-device live access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

function getRedisConfig(): { url: string; token: string; isKV: boolean } | null {
  const env: any = process.env;
  const urlKey = Object.keys(env).find(
    (k) => k.endsWith("_REST_URL") && (k.includes("KV") || k.includes("UPSTASH") || k.includes("REDIS"))
  );
  const tokenKey = Object.keys(env).find(
    (k) => k.endsWith("_REST_TOKEN") && (k.includes("KV") || k.includes("UPSTASH") || k.includes("REDIS"))
  );
  if (urlKey && tokenKey && env[urlKey] && env[tokenKey]) {
    return { url: env[urlKey], token: env[tokenKey], isKV: urlKey.includes("KV_REST") };
  }
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN, isKV: true };
  }
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, isKV: false };
  }
  return null;
}

// 1. Tier 1: Vercel KV / Upstash Redis
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
  } catch {
    return null;
  }
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
  } catch {
    return false;
  }
}

// 2. Tier 2: Global Real-Time Cloud KV (Zero-config persistent backend)
async function cloudFallbackGet(): Promise<any | null> {
  try {
    const res = await fetch(CLOUD_FALLBACK_URL, {
      headers: { "Cache-Control": "no-cache" },
      next: { revalidate: 0 },
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {}
  return null;
}

async function cloudFallbackSet(data: any): Promise<boolean> {
  try {
    const res = await fetch(CLOUD_FALLBACK_URL, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// 3. Tier 3: Local File / Memory Cache
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
  try {
    fs.writeFileSync(TMP_PATH, JSON.stringify(data), "utf-8");
  } catch {}
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  // 1. Check Vercel KV / Upstash
  const kvData = await kvGet();
  if (kvData) {
    mem = kvData;
    return NextResponse.json({ ...kvData, _source: "kv" }, { headers: corsHeaders });
  }

  // 2. Check Global Cloud Sync Fallback
  const cloudData = await cloudFallbackGet();
  if (cloudData && !cloudData.empty) {
    mem = cloudData;
    fileSet(cloudData);
    return NextResponse.json({ ...cloudData, _source: "cloud_live" }, { headers: corsHeaders });
  }

  // 3. Fallback to Local Memory / File
  const data = fileGet();
  if (data) {
    return NextResponse.json({ ...data, _source: "local" }, { headers: corsHeaders });
  }

  return NextResponse.json({ empty: true, _updatedAt: 0, _source: "init" }, { headers: corsHeaders });
}

function mergeById(a: any[] | undefined, b: any[] | undefined) {
  if (!a) return b || [];
  if (!b) return a || [];
  const m = new Map<string, any>();
  for (const x of a) if (x?.id) m.set(x.id, x);
  for (const x of b) if (x?.id) m.set(x.id, x);
  return Array.from(m.values());
}

function applyDeletes(arr: any[] | undefined, delIds: string[] | undefined) {
  if (!arr || !delIds || delIds.length === 0) return arr;
  const del = new Set(delIds);
  return arr.filter((x: any) => !del.has(x.id));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const existing = (await kvGet()) || (await cloudFallbackGet()) || fileGet() || {};

    let merged: any = {
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

    // Apply explicit item deletions
    if (body._deletedStudents) merged.students = applyDeletes(merged.students, body._deletedStudents);
    if (body._deletedTransactions) merged.transactions = applyDeletes(merged.transactions, body._deletedTransactions);
    if (body._deletedFaculties) merged.faculties = applyDeletes(merged.faculties, body._deletedFaculties);
    if (body._deletedStaff) merged.staff = applyDeletes(merged.staff, body._deletedStaff);
    if (body._deletedHomework) merged.homework = applyDeletes(merged.homework, body._deletedHomework);
    if (body._deletedSalaryRecords) merged.salaryRecords = applyDeletes(merged.salaryRecords, body._deletedSalaryRecords);
    if (body._deletedPortalAccounts) merged.portalAccounts = applyDeletes(merged.portalAccounts, body._deletedPortalAccounts);
    if (body._deletedNotices) merged.notices = applyDeletes(merged.notices, body._deletedNotices);

    // If client requested force overwrite (e.g. restore / reset)
    if (body._forceOverwrite) {
      merged = { ...body, _updatedAt: Date.now() };
    }

    // Persist across all tiers
    const okKv = await kvSet(merged);
    const okCloud = await cloudFallbackSet(merged);
    fileSet(merged);
    mem = merged;

    return NextResponse.json(
      {
        ok: true,
        _updatedAt: merged._updatedAt,
        cloud: okKv || okCloud,
        merged: true,
        serverTime: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
