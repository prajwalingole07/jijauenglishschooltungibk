"use client";
import jsPDF from "jspdf";

type ReceiptData = {
  tx: any;
  student: any;
  transactions: any[];
  settings: any;
};

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch {}
  return null;
}

export async function generateReceiptPDF(data: ReceiptData): Promise<jsPDF> {
  const { tx, student, transactions, settings } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageW = 210, pageH = 297, margin = 8, contentW = pageW - margin * 2;
  let y = margin;
  const logoData = await loadImageAsDataUrl("/school-logo.png");
  const bal = student ? student.totalFees - student.feesPaid : 0;
  const recent = [tx, ...transactions.filter((t: any) => t.id !== tx.id)].slice(0, 5);
  const setFont = (style: "normal" | "bold", size: number, color = { r: 26, g: 43, b: 60 }) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color.r, color.g, color.b);
  };
  const ORANGE = { r: 255, g: 107, b: 26 };
  const MUTED = { r: 122, g: 111, b: 104 };
  const GRAY = { r: 152, g: 162, b: 179 };
  const DARK = { r: 26, g: 43, b: 60 };

  // Header - bigger
  const logoSize = 22;
  const logoX = (pageW - logoSize) / 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.7);
  doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2 + 0.5, "FD");
  if (logoData) {
    try {
      const isPng = logoData.includes("image/png");
      doc.addImage(logoData, isPng ? "PNG" : "JPEG", logoX + 1.4, y + 1.4, logoSize - 2.8, logoSize - 2.8, undefined, "FAST");
      doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
      doc.setLineWidth(0.5);
      doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2, "D");
    } catch {}
  }
  y += logoSize + 8;
  setFont("bold", 16, DARK);
  doc.text(settings.schoolName || "JIJAU ENGLISH SCHOOL", pageW / 2, y, { align: "center" });
  y += 6;
  setFont("bold", 10, ORANGE);
  doc.text(settings.schoolSub || "TUNGI (B.K.)", pageW / 2, y, { align: "center" });
  y += 5;
  setFont("normal", 8, MUTED);
  doc.text(`${settings.address || "Tungi BK, Maharashtra, India"}  9890522763  ${settings.email || "jijau.school@gmail.com"}`, pageW / 2, y, { align: "center" });
  y += 4;
  setFont("bold", 7, GRAY);
  doc.text("ESTD. 2005    UDISE: 2725XXXXX  -  Fee Receipt", pageW / 2, y, { align: "center" });
  y += 5;
  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // Receipt badge and number - bigger
  doc.setFillColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.roundedRect(pageW - margin - 36, y - 7, 36, 9, 2, 2, "F");
  setFont("bold", 8, { r: 255, g: 255, b: 255 });
  doc.text("FEE RECEIPT", pageW - margin - 18, y - 1.2, { align: "center" });
  setFont("bold", 10, ORANGE);
  doc.text(tx.receiptNo, pageW - margin, y + 7, { align: "right" });
  setFont("normal", 7, MUTED);
  doc.text(new Date(tx.date).toLocaleString("en-GB"), pageW - margin, y + 11, { align: "right" });
  y += 15;

  // Student info grid - bigger boxes
  const colW = contentW / 2;
  const drawInfo = (x: number, yy: number, w: number, label: string, value: string) => {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(240, 240, 240);
    doc.roundedRect(x, yy, w, 12, 2, 2, "FD");
    setFont("bold", 7, GRAY);
    doc.text(label.toUpperCase(), x + 2.5, yy + 4.5);
    setFont("bold", 10, DARK);
    doc.text(value || "-", x + 2.5, yy + 9);
  };
  drawInfo(margin, y, colW - 1, "Student Name", student?.name || "-");
  drawInfo(margin + colW + 1, y, colW - 1, "Class", student?.className || "-");
  y += 14;
  drawInfo(margin, y, colW - 1, "Academic Year", tx.academicYear || "-");
  drawInfo(margin + colW + 1, y, colW - 1, "Installment", tx.installment || "-");
  y += 14;
  drawInfo(margin, y, colW - 1, "Payment Mode", tx.paymentMode || "-");
  drawInfo(margin + colW + 1, y, colW - 1, "TXN No.", (tx as any).txnNo || (tx as any).utr || "-");
  y += 17;

  // Description and amount - bigger
  setFont("bold", 8.5, GRAY);
  doc.text("DESCRIPTION", margin, y);
  doc.text("AMOUNT", pageW - margin, y, { align: "right" });
  y += 5;
  setFont("bold", 10, DARK);
  doc.text(tx.description || "Tuition Fee", margin, y);
  setFont("bold", 10, DARK);
  doc.text(`Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, pageW - margin, y, { align: "right" });
  y += 7;
  doc.setDrawColor(255, 233, 214);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  setFont("bold", 13, DARK);
  doc.text("Amount Received", margin, y);
  setFont("bold", 18, ORANGE);
  doc.text(`Rs. ${Number(tx.amount).toLocaleString("en-IN")}`, pageW - margin, y, { align: "right" });
  y += 11;

  // Totals - bigger
  const boxW = contentW / 3 - 1;
  const drawBox = (x: number, label: string, value: string, color: any, bg: any) => {
    doc.setFillColor(bg.r, bg.g, bg.b);
    doc.setDrawColor(230, 230, 230);
    doc.roundedRect(x, y, boxW, 16, 2, 2, "FD");
    setFont("bold", 7.5, GRAY);
    doc.text(label, x + boxW / 2, y + 5.5, { align: "center" });
    setFont("bold", 12, color);
    doc.text(value, x + boxW / 2, y + 12, { align: "center" });
  };
  drawBox(margin, "TOTAL FEES", `Rs. ${(student?.totalFees || 0).toLocaleString("en-IN")}`, DARK, { r: 249, g: 250, b: 251 });
  drawBox(margin + boxW + 1.5, "TOTAL PAID", `Rs. ${(student?.feesPaid || 0).toLocaleString("en-IN")}`, { r: 22, g: 101, b: 52 }, { r: 220, g: 252, b: 231 });
  drawBox(margin + (boxW + 1.5) * 2, "REMAINING", `Rs. ${Math.max(0, bal).toLocaleString("en-IN")}`, { r: 220, g: 38, b: 38 }, { r: 254, g: 226, b: 226 });
  y += 21;

  // Payment history - bigger
  setFont("bold", 8.5, GRAY);
  doc.text("FEE PAYMENT HISTORY", margin, y);
  y += 5;
  doc.setFillColor(255, 247, 237);
  doc.rect(margin, y, contentW, 8, "F");
  setFont("bold", 7.5, GRAY);
  doc.text("DATE", margin + 2, y + 5.2);
  doc.text("DESCRIPTION", pageW / 2, y + 5.2, { align: "center" });
  doc.text("AMOUNT", pageW - margin - 2, y + 5.2, { align: "right" });
  y += 8;
  for (const t of recent) {
    if (y > pageH - 32) {
      doc.addPage();
      y = margin;
    }
    setFont("normal", 8, MUTED);
    doc.text(new Date(t.date).toLocaleString("en-GB"), margin + 2, y + 4.5);
    setFont("bold", 8, { r: 255, g: 107, b: 26 });
    doc.text(t.description, pageW / 2, y + 4.5, { align: "center" });
    setFont("bold", 8, DARK);
    doc.text(`Rs. ${Number(t.amount).toLocaleString("en-IN")}`, pageW - margin - 2, y + 4.5, { align: "right" });
    doc.setDrawColor(255, 233, 214);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7, pageW - margin, y + 7);
    y += 7.5;
  }
  y += 10;
  // push signature lower with more space - keep near bottom
  const sigBlockH = 28;
  if (y < pageH - 40 - sigBlockH) y = pageH - 40 - sigBlockH;
  setFont("normal", 7, MUTED);
  doc.text("This receipt confirms the payment recorded in the school management system.", margin, y);
  setFont("bold", 8, DARK);
  doc.text("AUTHORISED SIGNATURE", pageW - margin, y, { align: "right" });
  y += 14;
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.4);
  const sigX = pageW - margin - 48;
  doc.line(sigX, y, pageW - margin, y);
  y += 6;
  setFont("bold", 9, DARK);
  doc.text("Dnyaneshwar Ingole", pageW - margin - 24, y, { align: "center" });
  y += 5;
  setFont("normal", 7, GRAY);
  doc.text("Principal", pageW - margin - 24, y, { align: "center" });
  setFont("normal", 7, GRAY);
  doc.text(`Generated via Jijau Portal - ${new Date().toLocaleString("en-GB")} - ${tx.receiptNo}`, margin, pageH - 6);
  doc.setDrawColor(255, 233, 214);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 9, pageW - margin, pageH - 9);

  return doc;
}

function isNative(): boolean {
  try { return !!(window as any).Capacitor?.isNativePlatform?.(); } catch { return false; }
}
function sanitizeNameR(n:string){ return (n||'Student').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40) || 'Student'; }

export async function downloadReceiptPDF(data: ReceiptData) {
  const doc = await generateReceiptPDF(data);
  const safe = sanitizeNameR(data.student?.name);
  const fileName = `${safe}_${data.tx.receiptNo}.pdf`;
  const { saveGeneratedPdf } = await import("./pdfDownload");
  await saveGeneratedPdf(doc, fileName);
}

export async function printReceiptPDF(data: ReceiptData) {
  const doc = await generateReceiptPDF(data);
  const safe = sanitizeNameR(data.student?.name);
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const fileName = `${safe}_${data.tx.receiptNo}.pdf`;
      const base64 = doc.output("datauristring").split(",")[1];
      const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title: fileName, url: res.uri, dialogTitle: "Print / Share PDF" });
      return;
    } catch {}
  }
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) {
    w.onload = () => setTimeout(() => w.print(), 300);
  }
}

export async function shareReceiptPDF(data: ReceiptData) {
  const doc = await generateReceiptPDF(data);
  const safe2 = sanitizeNameR(data.student?.name);
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const fileName = `${safe2}_${data.tx.receiptNo}.pdf`;
      const base64 = doc.output("datauristring").split(",")[1];
      const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title: `Fee Receipt ${data.tx.receiptNo}`, text: `Fee Receipt for ${data.student?.name} - Rs. ${Number(data.tx.amount).toLocaleString("en-IN")}`, url: res.uri, dialogTitle: "Share via WhatsApp" });
      return;
    } catch {}
  }
  const blob = doc.output("blob");
  const file = new File([blob], `${safe2}_${data.tx.receiptNo}.pdf`, { type: "application/pdf" });
  if (typeof navigator.canShare === "function" && (navigator as any).canShare({ files: [file] })) {
    try {
      await (navigator as any).share({ title: `Fee Receipt ${data.tx.receiptNo}`, text: `Fee Receipt for ${data.student?.name} - Rs. ${Number(data.tx.amount).toLocaleString("en-IN")}`, files: [file] });
      return;
    } catch {}
  }
  const msg = `*${data.settings.schoolName}*%0AFee Receipt: ${data.tx.receiptNo}%0AStudent: ${data.student?.name}%0AAmount: Rs. ${Number(data.tx.amount).toLocaleString("en-IN")}%0ADate: ${new Date(data.tx.date).toLocaleDateString("en-GB")}%0A%0A*PDF attached - please download from portal*`;
  window.open(`https://wa.me/?text=${msg}`, "_blank");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe2}_${data.tx.receiptNo}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
