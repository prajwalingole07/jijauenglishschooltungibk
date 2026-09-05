import { generateAdmissionPDF } from "./src/lib/admissionPdf.ts";
const student = { name: "wedf", roll: "562", gender: "Male", category: "OPEN", className: "1st-A", aadhaar: "123412341234", motherName: "Sunita", parentMobile: "9876543210", address: "Tungi BK, Maharashtra", totalFees: 100000, feesPaid: 50000, academicYear: "2026-2027", admissionDate: "27/08/2026", photo: null };
const settings = { schoolName: "JIJAU ENGLISH SCHOOL", schoolSub: "TUNGI (B.K.)", address: "Tungi BK, Maharashtra, India", phone: "9890522763", email: "jijau.school@gmail.com" };
const doc = await generateAdmissionPDF({ student, settings, admissionNo: "ADM-562-2026", admissionDate: "27/08/2026" });
doc.save("C:/Users/prajw/Downloads/Admission_Form_ADM-562-2026-WHITEHEADER.pdf");
console.log("saved white header");
