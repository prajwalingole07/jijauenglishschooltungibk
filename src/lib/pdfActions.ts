"use client";

import jsPDF from "jspdf";

function isNativePlatform(): boolean {
  try {
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

async function saveOnWeb(doc: jsPDF, fileName: string) {
  const blob = doc.output("blob");
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch {
      // Fall back to a standard browser download.
    }
  }

  const url = blobToUrl(blob);
  try {
    triggerDownload(url, fileName);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

export async function savePdfDocument(doc: jsPDF, fileName: string) {
  if (isNativePlatform()) {
    try {
      const base64 = doc.output("datauristring").split(",")[1];
      const And = (window as any).Android;
      if (And?.savePdf) {
        And.savePdf(base64, fileName);
        return;
      }
    } catch {}
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const base64 = doc.output("datauristring").split(",")[1];
      try {
        await Filesystem.requestPermissions();
      } catch {}
      await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Documents });
      return;
    } catch {}
  }

  await saveOnWeb(doc, fileName);
}

export async function printPdfDocument(doc: jsPDF) {
  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const fileName = `print_${Date.now()}.pdf`;
      const base64 = doc.output("datauristring").split(",")[1];
      const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title: fileName, url: res.uri, dialogTitle: "Print / Share PDF" });
      return;
    } catch {}
  }

  const blob = doc.output("blob");
  const url = blobToUrl(blob);
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) {
    win.onload = () => setTimeout(() => win.print(), 300);
  } else {
    triggerDownload(url, `print_${Date.now()}.pdf`);
  }
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

type SharePdfOptions = {
  fileName: string;
  title: string;
  text: string;
  whatsappFallbackText: string;
};

export async function sharePdfDocument(doc: jsPDF, options: SharePdfOptions) {
  const { fileName, title, text, whatsappFallbackText } = options;

  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = doc.output("datauristring").split(",")[1];
      const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title, text, url: res.uri, dialogTitle: "Share via WhatsApp" });
      return;
    } catch {}
  }

  const blob = doc.output("blob");
  const file = new File([blob], fileName, { type: "application/pdf" });
  const shareApi = navigator as any;
  if (typeof shareApi.share === "function") {
    try {
      // Attempt the file share directly. Some Android browsers incorrectly
      // report canShare({ files }) as false even though the share sheet accepts it.
      await shareApi.share({ title, text, files: [file] });
      return;
    } catch {
      // Continue to the compatibility fallback below.
    }
  }

  const fallbackUrl = blobToUrl(blob);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(whatsappFallbackText)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
  triggerDownload(fallbackUrl, fileName);
  setTimeout(() => URL.revokeObjectURL(fallbackUrl), 1500);
}
