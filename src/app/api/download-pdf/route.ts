import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { base64, filename } = await req.json();
    if (!base64) {
      return NextResponse.json({ error: "Missing base64 data" }, { status: 400 });
    }

    const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const buffer = Buffer.from(cleanBase64, "base64");
    const safeFilename = (filename || "document.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to stream PDF" }, { status: 500 });
  }
}
