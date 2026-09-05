import { NextRequest, NextResponse } from "next/server";
import { getDb, STORE_COLLECTION, STORE_DOC } from "@/lib/firestore";

// Universal CORS & zero-cache headers for Web + APK live access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

// Small in-process cache so bursts of requests on the same warm instance
// don't all hit Firestore. This is NOT the source of truth — Firestore is.
let mem: any = null;

async function dbGet(): Promise<any | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db.collection(STORE_COLLECTION).doc(STORE_DOC).get();
    if (!snap.exists) return null;
    return snap.data();
  } catch (e) {
    console.error("Firestore GET failed:", e);
    return null;
  }
}

async function dbSet(data: any): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.collection(STORE_COLLECTION).doc(STORE_DOC).set(data, { merge: false });
    return true;
  } catch (e) {
    console.error("Firestore SET failed:", e);
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const data = await dbGet();
  if (data) {
    mem = data;
    return NextResponse.json({ ...data, _source: "firestore" }, { headers: corsHeaders });
  }

  if (mem) {
    return NextResponse.json({ ...mem, _source: "memory_cache" }, { headers: corsHeaders });
  }

  const configured = !!getDb();
  return NextResponse.json(
    {
      empty: true,
      _updatedAt: 0,
      _source: configured ? "init" : "not_configured",
      _hint: configured
        ? undefined
        : "Firestore env vars (FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) are not set on this deployment yet.",
    },
    { headers: corsHeaders }
  );
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
    const existing = (await dbGet()) || mem || {};

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
      profilePhotos: body.profilePhotos || existing.profilePhotos,
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

    const okDb = await dbSet(merged);
    mem = merged;

    return NextResponse.json(
      {
        ok: true,
        _updatedAt: merged._updatedAt,
        cloud: okDb,
        merged: true,
        serverTime: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}
