// Silent direct download — no filename prompt, no location chooser.
// When user taps Download PDF → file goes straight to phone storage.
// When user taps WhatsApp → file is directly attached via system share sheet.

function isCapacitorNative(): boolean {
  try { return !!(window as any).Capacitor?.isNativePlatform?.(); } catch { return false; }
}

function showToast(msg: string, type: "success"|"info"|"error" = "success") {
  try { window.dispatchEvent(new CustomEvent("jijau_saved", { detail: { message: msg, type } })); } catch {}
}

export async function saveGeneratedPdf(doc: any, fileName: string): Promise<void> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "document.pdf";
  const withPdf = safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
  const base64 = doc.output("datauristring").split(",")[1];

  // 1. Custom Android bridge (web2app/median) — silent save to Downloads, no dialog
  try {
    const And = (window as any).Android;
    if (And?.savePdf) {
      And.savePdf(base64, withPdf);
      showToast(`✓ ${withPdf} saved`, "success");
      return;
    }
    if (And?.downloadPdf) {
      And.downloadPdf(base64, withPdf);
      showToast(`✓ ${withPdf} saved`, "success");
      return;
    }
  } catch {}

  // 2. Capacitor native — silent write to public storage, no chooser
  if (isCapacitorNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      try { await Filesystem.requestPermissions(); } catch {}
      const DirAny: any = Directory as any;
      try {
        if (DirAny.ExternalStorage !== undefined) {
          await Filesystem.writeFile({ path: `Download/${withPdf}`, data: base64, directory: DirAny.ExternalStorage });
          showToast(`✓ ${withPdf} saved to Downloads`, "success");
          return;
        }
      } catch {}
      try {
        if (DirAny.External !== undefined) {
          await Filesystem.writeFile({ path: `Download/${withPdf}`, data: base64, directory: DirAny.External });
          showToast(`✓ ${withPdf} saved to Downloads`, "success");
          return;
        }
      } catch {}
      try {
        await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Documents });
        showToast(`✓ ${withPdf} saved`, "success");
        return;
      } catch {}
      try {
        await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Data });
        showToast(`✓ ${withPdf} saved`, "success");
        return;
      } catch {}
    } catch {}
  }

  // 3. Web / PWA / WebView wrapper — use hidden form POST to /api/download-pdf
  // This triggers Android DownloadManager silently (no filename/location prompt) because
  // server sends Content-Disposition: attachment; filename="..."
  try {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/download-pdf";
    form.style.display = "none";
    form.target = "_self";
    const a = document.createElement("input"); a.type="hidden"; a.name="base64"; a.value=base64; form.appendChild(a);
    const b = document.createElement("input"); b.type="hidden"; b.name="fileName"; b.value=withPdf; form.appendChild(b);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => { try { document.body.removeChild(form); } catch {} }, 3000);
    showToast(`⬇️ ${withPdf} downloading…`, "success");
    return;
  } catch {}

  // 4. Final fallback — anchor download (no prompt beyond browser default)
  try {
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = withPdf;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { try { document.body.removeChild(link); URL.revokeObjectURL(url); } catch {} }, 2000);
    showToast(`⬇️ ${withPdf} downloading…`, "success");
    return;
  } catch (e:any) {
    showToast(`Download failed`, "error");
    throw e;
  }
}

// Direct attach for WhatsApp — shares the PDF file itself, not text.
// Uses Capacitor Share (file:// URI) or Web Share API with files. No extra download.
export async function sharePdfFileDirectly(doc: any, fileName: string, shareTitle: string, shareText: string): Promise<boolean> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_") || "document.pdf";
  const withPdf = safeName.toLowerCase().endsWith(".pdf") ? safeName : `${safeName}.pdf`;
  if (isCapacitorNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = doc.output("datauristring").split(",")[1];
      try { await Filesystem.requestPermissions(); } catch {}
      const res = await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Cache });
      await Share.share({ title: shareTitle, text: shareText, url: res.uri, dialogTitle: "Share PDF via WhatsApp" });
      return true;
    } catch {}
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = doc.output("datauristring").split(",")[1];
      const res = await Filesystem.writeFile({ path: withPdf, data: base64, directory: Directory.Documents });
      await Share.share({ title: shareTitle, text: shareText, url: res.uri, dialogTitle: "Share PDF via WhatsApp" });
      return true;
    } catch {}
  }
  try {
    const blob = doc.output("blob");
    const file = new File([blob], withPdf, { type: "application/pdf" });
    const canShareFiles = typeof navigator.canShare === "function" && (navigator as any).canShare({ files: [file] });
    if (canShareFiles) {
      await (navigator as any).share({ title: shareTitle, text: shareText, files: [file] });
      return true;
    }
    if (typeof navigator.share === "function") {
      try { await (navigator as any).share({ title: shareTitle, text: shareText, files: [file] }); return true; } catch {}
    }
  } catch {}
  return false;
}
