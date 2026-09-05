import { NextRequest, NextResponse } from "next/server";

// Generic WebView wrappers (web2app, Median, GoNative, etc.) only reliably save files
// that arrive as a real HTTP response with a Content-Disposition header — they generally
// do NOT catch client-only blob:/data: URI "downloads" triggered purely in JavaScript.
// This route turns a PDF that was generated in the browser into a real downloadable
// HTTP response, so the wrapper app's built-in download handling picks it up and saves
// it to the phone's Downloads folder, exactly like downloading any normal file from a website.

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const base64 = String(form.get("base64") || "");
    const fileName = String(form.get("fileName") || "document.pdf");

    if (!base64) {
      return NextResponse.json({ error: "Missing PDF data" }, { status: 400 });
    }

    const bytes = Buffer.from(base64, "base64");
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
