// Universal, wrapper-agnostic "save this PDF to the phone" helper.
//
// Why this exists: a plain WebView-based APK wrapper (web2app, Median, GoNative, etc.)
// has no Capacitor bridge and generally does NOT catch client-only blob:/data: URI
// downloads triggered by JS (e.g. jsPDF's doc.save(), or a hidden <a download> click).
// Those only reliably work in a real desktop/mobile browser.
//
// The one download mechanism that works everywhere — Capacitor apps, plain WebView
// wrapper apps, and normal browsers alike — is a genuine HTTP response with a
// Content-Disposition: attachment header, because that is what Android's native
// download handling (DownloadManager) is built to catch regardless of which app
// is hosting the WebView.
//
// Strategy, in order:
//   1. If running inside a real Capacitor native app, use Capacitor Filesystem (best:
//      no network needed, saves straight to Documents).
//   2. Otherwise, POST the PDF bytes to our own server and navigate to the response
//      via a real form submission — this triggers a genuine HTTP download that any
//      WebView wrapper (including web2app) will save to the Downloads folder.
//   3. If that fails for any reason (e.g. fully offline), fall back to the plain
//      browser blob download, which still works in normal desktop/mobile browsers.

export async function saveGeneratedPdf(doc: any, fileName: string): Promise<void> {
  const isCapacitorNative = !!(window as any).Capacitor?.isNativePlatform?.();

  if (isCapacitorNative) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64 = doc.output("datauristring").split(",")[1];
      try { await Filesystem.requestPermissions(); } catch {}
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
      return;
    } catch {
      // fall through to the server-route method below
    }
  }

  try {
    const base64 = doc.output("datauristring").split(",")[1];
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download-pdf";
    form.style.display = "none";

    const fileInput = document.createElement("input");
    fileInput.type = "hidden";
    fileInput.name = "base64";
    fileInput.value = base64;
    form.appendChild(fileInput);

    const nameInput = document.createElement("input");
    nameInput.type = "hidden";
    nameInput.name = "fileName";
    nameInput.value = fileName;
    form.appendChild(nameInput);

    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { try { document.body.removeChild(form); } catch {} }, 2000);
    return;
  } catch {
    // fall through to the plain blob fallback below
  }

  // Last-resort fallback for normal browsers without network access
  doc.save(fileName);
}
