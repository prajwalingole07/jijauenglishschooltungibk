"use client";
import jsPDF from "jspdf";

type AdmissionData = {
  student: any;
  settings: any;
  admissionNo: string;
  admissionDate: string;
};

const ORANGE = { r: 255, g: 107, b: 26 };
const LIGHT_ORANGE = { r: 255, g: 233, b: 214 };
const DARK = { r: 26, g: 43, b: 60 };
const MUTED = { r: 122, g: 111, b: 104 };
const GRAY = { r: 152, g: 162, b: 179 };

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

function makeBlurredWatermark(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const size = 500;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.filter = "blur(2px)";
        ctx.globalAlpha = 0.18;
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

function numberToWordsIndian(num: number): string {
  if (num === 0) return "Zero only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numToWords = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "");
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "");
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWords(n % 100000) : "");
    return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWords(n % 10000000) : "");
  };
  return numToWords(Math.floor(num)).trim() + " only";
}

export async function generateAdmissionPDF(data: AdmissionData): Promise<jsPDF> {
  const { student, settings, admissionNo, admissionDate } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  const pageW = 210;
  const pageH = 297;
  const margin = 8;
  const contentW = pageW - margin * 2;
  let y = margin;

  const schoolLogoData = await loadImageAsDataUrl("/school-logo.png");
  let studentPhotoData: string | null = student.photo || null;

  const setFont = (style: "normal" | "bold", size: number, color = DARK) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color.r, color.g, color.b);
  };

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  let watermarkData: string | null = null;
  if (schoolLogoData) {
    watermarkData = await makeBlurredWatermark(schoolLogoData);
    if (!watermarkData) watermarkData = schoolLogoData;
  }

  // HEADER - bigger
  const logoSize = 24;
  const logoX = (pageW - logoSize) / 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.7);
  doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2 + 0.5, "FD");
  if (schoolLogoData) {
    try {
      const isPng = schoolLogoData.includes("image/png");
      doc.addImage(schoolLogoData, isPng ? "PNG" : "JPEG", logoX + 1.4, y + 1.4, logoSize - 2.8, logoSize - 2.8, undefined, "FAST");
      doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
      doc.setLineWidth(0.6);
      doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2, "D");
    } catch {}
  }
  y += logoSize + 7;
  setFont("bold", 16, DARK);
  doc.text(settings.schoolName || "JIJAU ENGLISH SCHOOL", pageW / 2, y, { align: "center" });
  y += 6;
  setFont("bold", 10, ORANGE);
  doc.text(settings.schoolSub || "TUNGI (B.K.)", pageW / 2, y, { align: "center" });
  y += 5;
  setFont("normal", 8, MUTED);
  doc.text(`${settings.address || "Tungi BK, Maharashtra, India"}  9890522763  ${settings.email || "jijau.school@gmail.com"}`, pageW / 2, y, { align: "center" });
  y += 7;

  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 4;

  // ADMISSION FORM bar - bigger
  const barH = 10;
  doc.setFillColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.roundedRect(margin, y, contentW, barH, 3, 3, "F");
  setFont("bold", 11, { r: 255, g: 255, b: 255 });
  doc.text("ADMISSION FORM", pageW / 2, y + 6.5, { align: "center" });
  y += barH + 5;

  // Admission info row - bigger
  setFont("normal", 8.5, MUTED);
  doc.text("Admission No:", margin, y);
  setFont("bold", 8.5, ORANGE);
  doc.text(admissionNo, margin + 26, y);
  setFont("normal", 8.5, MUTED);
  doc.text("Admission Date:", pageW / 2 - 18, y);
  setFont("bold", 8.5, DARK);
  doc.text(admissionDate, pageW / 2 + 10, y);
  const ayLabel = "Academic Year:";
  const ayVal = student.academicYear || "2026-2027";
  const ayX = pageW - margin - doc.getTextWidth(`${ayLabel} ${ayVal}`);
  setFont("normal", 8.5, MUTED);
  doc.text(ayLabel, ayX, y);
  setFont("bold", 8.5, DARK);
  doc.text(ayVal, ayX + doc.getTextWidth(`${ayLabel} `), y);
  y += 8;

  // Student photo - bigger
  const photoW = 32;
  const photoH = 38;
  const photoX = (pageW - photoW) / 2;
  doc.setDrawColor(LIGHT_ORANGE.r, LIGHT_ORANGE.g, LIGHT_ORANGE.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(photoX, y, photoW, photoH, 2, 2, "D");
  if (studentPhotoData) {
    try {
      const isPng = studentPhotoData.includes("image/png");
      const pad = 1.5;
      doc.addImage(studentPhotoData, isPng ? "PNG" : "JPEG", photoX + pad, y + pad, photoW - pad * 2, photoH - pad * 2 - 4, undefined, "FAST");
    } catch {}
  } else {
    setFont("bold", 7, ORANGE);
    doc.text("PHOTO", photoX + photoW / 2, y + photoH / 2, { align: "center" });
  }
  y += photoH + 4;
  setFont("bold", 7, { r: 154, g: 106, b: 82 });
  doc.text("STUDENT PHOTO", pageW / 2, y, { align: "center" });
  y += 8;

  // Student details table - bigger row heights
  const colW = contentW / 2;
  const rowH = 11;
  const tableStartY = y;
  const fields: Array<{ label: string; value: string; full?: boolean }> = [
    { label: "Full Name", value: student.name || "-" },
    { label: "Roll Number", value: student.roll || "-" },
    { label: "Gender", value: student.gender || "-" },
    { label: "Category", value: student.category || "-" },
    { label: "Class Admitted To", value: student.className || "-" },
    { label: "Aadhaar Number", value: student.aadhaar || "-" },
    { label: "Mother Name", value: student.motherName || "-" },
    { label: "Parent Mobile", value: student.parentMobile || "-" },
    { label: "Address", value: student.address || "-", full: true },
    { label: "Total Fees (Rs.)", value: `Rs. ${Number(student.totalFees || 0).toLocaleString("en-IN")}` },
    { label: "Fees Paid (Rs.)", value: `Rs. ${Number(student.feesPaid || 0).toLocaleString("en-IN")}` },
    { label: "Balance (Rs.)", value: `Rs. ${(Number(student.totalFees || 0) - Number(student.feesPaid || 0)).toLocaleString("en-IN")}` },
    { label: "Admission Date (Record)", value: admissionDate },
  ];

  const drawCell = (x: number, yy: number, w: number, h: number, label: string, value: string) => {
    doc.setDrawColor(LIGHT_ORANGE.r, LIGHT_ORANGE.g, LIGHT_ORANGE.b);
    doc.setLineWidth(0.3);
    doc.rect(x, yy, w, h, "D");
    setFont("bold", 7, { r: 154, g: 106, b: 82 });
    doc.text(label.toUpperCase(), x + 2.5, yy + 4);
    const isFees = label.includes("Fees") || label.includes("Balance");
    if (isFees) {
      setFont("bold", 10, DARK);
      doc.text(value, x + 2.5, yy + 8.5);
      const num = Number(value.replace(/[^0-9]/g, "")) || 0;
      const words = num ? numberToWordsIndian(num) : "";
      if (words) {
        setFont("normal", 6.5, MUTED);
        const wLines = doc.splitTextToSize(words, w - 5);
        doc.text(wLines[0], x + 2.5, yy + 12.5);
      }
    } else {
      setFont("bold", 10, DARK);
      const maxW = w - 5;
      const lines = doc.splitTextToSize(value, maxW);
      if (lines.length === 1) {
        doc.text(lines[0], x + 2.5, yy + 8.5);
      } else {
        let ty = yy + 8;
        for (let i = 0; i < Math.min(lines.length, 2); i++) {
          doc.text(lines[i], x + 2.5, ty);
          ty += 4;
        }
      }
    }
  };

  const rows: Array<Array<{ label: string; value: string; full?: boolean }>> = [];
  for (let i = 0; i < fields.length; ) {
    if (fields[i].full) {
      rows.push([fields[i]]);
      i++;
    } else {
      const a = fields[i];
      const b = fields[i + 1] && !fields[i + 1].full ? fields[i + 1] : null;
      if (b) { rows.push([a, b]); i += 2; }
      else { rows.push([a]); i += 1; }
    }
  }
  let totalTableH = 0;
  for (const row of rows) {
    const isFeesRow = row.some((f) => f.label.includes("Fees") || f.label.includes("Balance"));
    totalTableH += row[0].full ? rowH + 3 : isFeesRow ? 15 : rowH;
  }
  if (watermarkData) {
    try {
      const isPng = watermarkData.includes("image/png");
      const wmSize = 78;
      const wmX = (pageW - wmSize) / 2;
      const wmY = tableStartY + totalTableH / 2 - wmSize / 2;
      doc.addImage(watermarkData, isPng ? "PNG" : "JPEG", wmX, wmY, wmSize, wmSize, undefined, "FAST");
    } catch {}
  }
  let curY = y;
  for (const row of rows) {
    const isFeesRow = row.some((f) => f.label.includes("Fees") || f.label.includes("Balance"));
    const h = row[0].full ? rowH + 3 : isFeesRow ? 15 : rowH;
    if (row.length === 1 && row[0].full) {
      drawCell(margin, curY, contentW, h, row[0].label, row[0].value);
    } else if (row.length === 2) {
      drawCell(margin, curY, colW, h, row[0].label, row[0].value);
      drawCell(margin + colW, curY, colW, h, row[1].label, row[1].value);
    } else {
      drawCell(margin, curY, colW, h, row[0].label, row[0].value);
    }
    curY += h;
  }
  y = curY + 4;

  // Declaration - bigger
  const declText = "I hereby declare that the information provided above is true to the best of my knowledge. I agree to abide by the rules and regulations of Jijau English School, Tungi (BK). I understand that fees once paid is non-refundable as per school policy.";
  const declH = 19;
  doc.setDrawColor(LIGHT_ORANGE.r, LIGHT_ORANGE.g, LIGHT_ORANGE.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, declH, 2, 2, "D");
  setFont("bold", 7.5, ORANGE);
  doc.text("Declaration", margin + 2.5, y + 5);
  setFont("normal", 7.5, { r: 90, g: 74, b: 66 });
  const declLines = doc.splitTextToSize(declText, contentW - 5);
  let dy = y + 9.5;
  for (const line of declLines) {
    doc.text(line, margin + 2.5, dy);
    dy += 4;
    if (dy > y + declH - 1) break;
  }
  y += declH + 7;

  // Signature section - bigger
  const sigY = y;
  const sigW = 48;
  const leftX = margin + 4;
  doc.setDrawColor(DARK.r, DARK.g, DARK.b);
  doc.setLineWidth(0.4);
  doc.line(leftX, sigY + 13, leftX + sigW, sigY + 13);
  setFont("bold", 8, DARK);
  doc.text("Parent/Guardian Signature", leftX + sigW / 2, sigY + 17.5, { align: "center" });
  setFont("normal", 7, MUTED);
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, leftX + sigW / 2, sigY + 21, { align: "center" });

  const sealSize = 26;
  const sealX = (pageW - sealSize) / 2;
  const sealY = sigY - 2;
  doc.setFillColor(255, 251, 240);
  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.6);
  doc.circle(sealX + sealSize / 2, sealY + sealSize / 2, sealSize / 2, "FD");
  doc.setLineWidth(0.25);
  doc.circle(sealX + sealSize / 2, sealY + sealSize / 2, sealSize / 2 - 1.8, "D");
  setFont("bold", 7, ORANGE);
  doc.text("SEAL", pageW / 2, sealY + sealSize / 2 - 1.5, { align: "center" });
  setFont("bold", 5.5, ORANGE);
  doc.text("OF SCHOOL", pageW / 2, sealY + sealSize / 2 + 3.5, { align: "center" });
  setFont("bold", 5.5, ORANGE);
  doc.text("SCHOOL SEAL", pageW / 2, sealY + sealSize + 5, { align: "center" });

  const rightX = pageW - margin - 4 - sigW;
  doc.setDrawColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.setLineWidth(0.6);
  doc.line(rightX, sigY + 13, rightX + sigW, sigY + 13);
  setFont("bold", 8.5, ORANGE);
  doc.text("Principal Signature", rightX + sigW / 2, sigY + 17.5, { align: "center" });
  setFont("bold", 8.5, DARK);
  doc.text("Dnyaneshwar Ingole", rightX + sigW / 2, sigY + 21.5, { align: "center" });
  setFont("normal", 7, MUTED);
  doc.text(`Principal, ${settings.schoolName || "JIJAU ENGLISH SCHOOL"}`, rightX + sigW / 2, sigY + 25, { align: "center" });

  setFont("normal", 7, GRAY);
  const footerLeft = `Generated via Jijau Portal  ${new Date().toLocaleString("en-GB")}  ${admissionNo}`;
  const footerRight = `ADM-${student.roll}`;
  doc.text(footerLeft, margin, pageH - 6);
  const fw = doc.getTextWidth(footerRight);
  doc.text(footerRight, pageW - margin - fw, pageH - 6);
  doc.setDrawColor(255, 233, 214);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 9, pageW - margin, pageH - 9);

  return doc;
}

function isNative(): boolean {
  try { return !!(window as any).Capacitor?.isNativePlatform?.(); } catch { return false; }
}

function sanitizeName(n:string){ return (n||'Student').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40) || 'Student'; }
export async function downloadAdmissionPDF(data: AdmissionData) {
  const doc = await generateAdmissionPDF(data);
  const safe = sanitizeName(data.student?.name);
  const fileName = `${safe}_${data.admissionNo}.pdf`;
  const { saveGeneratedPdf } = await import("./pdfDownload");
  await saveGeneratedPdf(doc, fileName);
}

export async function shareAdmissionPDF(data: AdmissionData) {
  const doc = await generateAdmissionPDF(data);
  const safe = sanitizeName(data.student?.name);
  const fileName = `${safe}_${data.admissionNo}.pdf`;
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const base64 = doc.output("datauristring").split(",")[1];
      try { await Filesystem.requestPermissions(); } catch {}
      const res = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await Share.share({ title: `Admission Form ${data.admissionNo}`, text: `Admission Form for ${data.student?.name} - ${data.admissionNo}`, url: res.uri, dialogTitle: "Share via WhatsApp" });
      return;
    } catch {}
  }
  try {
    const blob: any = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (typeof navigator.canShare === "function" && (navigator as any).canShare({ files: [file] })) {
      try { await (navigator as any).share({ title: `Admission Form ${data.admissionNo}`, text: `Admission Form for ${data.student?.name} - ${data.admissionNo}`, files: [file] }); return; } catch {}
    }
  } catch {}
  const msg = `*${data.settings.schoolName}*%0AAdmission Form: ${data.admissionNo}%0AStudent: ${data.student?.name}%0AClass: ${data.student?.className}%0APDF will download to Downloads — please attach manually if needed`;
  window.open(`https://wa.me/?text=${msg}`, "_blank");
  const { saveGeneratedPdf } = await import("./pdfDownload");
  await saveGeneratedPdf(doc, fileName);
}

export async function printAdmissionPDF(data: AdmissionData) {
  const doc = await generateAdmissionPDF(data);
  const safe = sanitizeName(data.student?.name);
  if (isNative()) {
    try {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const { Share } = await import("@capacitor/share");
      const fileName = `${safe}_${data.admissionNo}.pdf`;
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
    w.onload = () => {
      setTimeout(() => w.print(), 300);
    };
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.click();
  }
}

export async function previewAdmissionPDF(data: AdmissionData): Promise<string> {
  const doc = await generateAdmissionPDF(data);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}
