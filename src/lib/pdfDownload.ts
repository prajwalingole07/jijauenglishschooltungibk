// Universal, wrapper-agnostic "save this PDF to the phone/Downloads" helper.
// Requirements: when user taps Download PDF on mobile, file must land in
// phone storage Downloads/Documents folder without requiring extra steps.

function isCapacitorNative(): boolean {
  try { return !!(window as any).Capacitor?.isNativePlatform?.(); } catch { return false; }
}

function showToast(msg: string, type: "success"|"info"|"error" = "success") {
  try { window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message: msg, type } })); } catch {}
}

export async function saveGeneratedPdf(doc: any, fileName: string): Promise<void> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "document.pdf";
  const withPdf = safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;

  // 1. Custom Android WebView bridge (web2app / median) — direct save to Downloads via native code
  try {
    const And = (window as any).Android;
    if (And?.savePdf) {
      const base64 = doc.output("datauristring").split(",")[1];
      And.savePdf(base64, withPdf);
      showToast(`✓ ${withPdf} saved to Downloads`, "success");
      return;
    }
  } catch {}

  // 2. Capacitor native — try multiple directories to land in visible storage
  if (isCapacitorNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64 = doc.output("datauristring").split(",")[1];
      try { await Filesystem.requestPermissions(); } catch {}
      // Try Documents first (maps to /Documents on Android, visible in file manager)
      // This is the most reliable for Capacitor on Android 10+
      try {
        await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Documents });
        showToast(`✓ ${withPdf} saved to Documents`, "success");
        // Also try to trigger share sheet so user can see file location, but file is already saved
        return;
      } catch {}
      // Fallback: try Cache + Share if Documents write fails
      try {
        const { Share } = await import("@capacitor/share");
        const res = await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Cache });
        await Share.share({ title: withPdf, url: res.uri, dialogTitle: "PDF saved — choose Downloads" });
        showToast(`✓ ${withPdf} ready — pick Downloads to save`, "success");
        return;
      } catch {}
      // Last native fallback: ExternalStorage (Android 9 and below)
      try {
        const DirAny: any = Directory as any;
        if (DirAny.ExternalStorage) {
          await Filesystem.writeFile({ path: withPdf, data: base64, directory: DirAny.ExternalStorage });
          showToast(`✓ ${withPdf} saved to storage`, "success");
          return;
        }
      } catch {}
    } catch {
      // fall through to HTTP download method
    }
  }

  // 3. Web wrapper / PWA — POST to /api/download-pdf so Android DownloadManager catches it
  // This works in plain WebView wrappers (web2app etc.) where blob downloads are ignored,
  // because it is a real HTTP response with Content-Disposition: attachment
  try {
    const base64 = doc.output("datauristring").split(",")[1];
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download-pdf";
    form.style.display = "none";
    // Use target _self so DownloadManager handles it; do not open new tab which wrapper may block
    form.target = "_self";

    const fileInput = document.createElement("input");
    fileInput.type = "hidden";
    fileInput.name = "base64";
    fileInput.value = base64;
    form.appendChild(fileInput);

    const nameInput = document.createElement("input");
    nameInput.type = "hidden";
    nameInput.name = "fileName";
    nameInput.value = withPdf;
    form.appendChild(nameInput);

    document.body.appendChild(form);
    form.submit();
    // Keep form briefly then cleanup; browser will have started download
    setTimeout(() => { try { document.body.removeChild(form); } catch {} }, 3000);
    showToast(`⬇️ Downloading ${withPdf} to Downloads…`, "success");
    return;
  } catch {
    // fall through to blob fallback
  }

  // 4. Last-resort fallback for desktop browsers — trigger blob download
  try {
    doc.save(withPdf);
    showToast(`✓ ${withPdf} download started`, "success");
  } catch (e:any) {
    showToast(`Download failed: ${e?.message || "unknown"}`, "error");
    throw e;
  }
}
