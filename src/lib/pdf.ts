import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ReportSummary } from "../types";

// Extend jsPDF with autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: any;
  }
}

export function generateReportPDF(summary: ReportSummary) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(26, 54, 93); // #1a365d
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Tensor MedAI Report", 15, 25);
  
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date(summary.date).toLocaleDateString()}`, 15, 33);

  // Patient Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 15, 50);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let y = 58;
  doc.text(`Report Type: ${summary.report_type}`, 15, y);
  if (summary.patient_age) {
    y += 6;
    doc.text(`Age: ${summary.patient_age}`, 15, y);
  }
  if (summary.patient_gender) {
    y += 6;
    doc.text(`Gender: ${summary.patient_gender}`, 15, y);
  }

  // Summary
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Summary", 15, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const splitSummary = doc.splitTextToSize(summary.plain_summary, pageWidth - 30);
  doc.text(splitSummary, 15, y);
  y += (splitSummary.length * 5) + 5;

  // Key Findings
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Key Findings", 15, y);
  
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  summary.key_findings.forEach((finding) => {
    doc.text(`• ${finding}`, 15, y);
    y += 6;
  });

  // Abnormal Flags Table
  if (summary.abnormal_flags.length > 0) {
    y += 5;
    doc.autoTable({
      startY: y,
      head: [["Parameter", "Value", "Normal Range", "Severity", "Explanation"]],
      body: summary.abnormal_flags.map((flag) => [
        flag.parameter,
        flag.value,
        flag.normal_range || "N/A",
        flag.severity,
        flag.explanation,
      ]),
      headStyles: { fillColor: [26, 54, 93] },
      columnStyles: {
        3: { fontStyle: "bold" },
      },
      didParseCell: function (data: any) {
        if (data.section === "body" && data.column.index === 3) {
          const val = data.cell.raw;
          if (val === "High") data.cell.styles.textColor = [255, 0, 0];
          if (val === "Medium") data.cell.styles.textColor = [255, 140, 0];
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recommendations
  if (summary.recommendations.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Recommendations", 15, y);
    
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    summary.recommendations.forEach((rec) => {
      doc.text(`• ${rec}`, 15, y);
      y += 6;
    });
  }

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const splitDisclaimer = doc.splitTextToSize(summary.disclaimer, pageWidth - 30);
  doc.text(splitDisclaimer, 15, doc.internal.pageSize.getHeight() - 20);

  doc.save(`Medical_Report_${summary.id.slice(0, 8)}.pdf`);
}
