import { jsPDF } from "jspdf";
import { AnalysisResult, Role } from "../types";

/**
 * Generate a professional PDF report from an AnalysisResult.
 */
export function exportAnalysisPDF(
  analysis: AnalysisResult,
  role: Role,
  language: string,
  filename?: string
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      // Add page header line
      doc.setDrawColor(99, 102, 241); // indigo-500
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
    }
  };

  // =============== HEADER ===============
  // Gradient-like header bar
  doc.setFillColor(30, 27, 75); // dark indigo
  doc.rect(0, 0, pageWidth, 45, "F");

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NyayRakshak AI", margin, 20);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Contract Risk Analysis Report", margin, 28);

  // Report date + role
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 255);
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${dateStr}  |  Role: ${role}  |  Language: ${language}`, margin, 36);

  y = 55;

  // =============== RISK SCORE SECTION ===============
  doc.setTextColor(30, 27, 75);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Risk Assessment", margin, y);
  y += 8;

  // Score box
  const scoreColor =
    analysis.risk_level === "Safe"
      ? { r: 34, g: 197, b: 94 }
      : analysis.risk_level === "Moderate"
      ? { r: 234, g: 179, b: 8 }
      : { r: 239, g: 68, b: 68 };

  doc.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
  doc.roundedRect(margin, y, 30, 18, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${analysis.risk_score}`, margin + 15, y + 9, { align: "center" });
  doc.setFontSize(6);
  doc.text("/ 100", margin + 15, y + 14, { align: "center" });

  // Risk level label
  doc.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${analysis.risk_level} Risk`, margin + 36, y + 8);

  // Scale reference
  doc.setTextColor(130, 130, 150);
  doc.setFontSize(7);
  doc.text("SAFE (0-30)  •  MODERATE (31-60)  •  HIGH (61-100)", margin + 36, y + 14);
  y += 24;

  // Summary
  doc.setTextColor(60, 60, 80);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(analysis.summary, contentWidth);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 4.5 + 6;

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // =============== CLAUSES SECTION ===============
  doc.setTextColor(30, 27, 75);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Clause-by-Clause Analysis", margin, y);
  y += 10;

  analysis.clauses.forEach((clause, idx) => {
    addPageIfNeeded(60);

    const riskColor =
      clause.risk_level === "Safe"
        ? { r: 34, g: 197, b: 94, bg: { r: 240, g: 253, b: 244 } }
        : clause.risk_level === "Moderate"
        ? { r: 180, g: 140, b: 8, bg: { r: 254, g: 252, b: 232 } }
        : { r: 220, g: 50, b: 50, bg: { r: 254, g: 242, b: 242 } };

    // Clause card background
    doc.setFillColor(riskColor.bg.r, riskColor.bg.g, riskColor.bg.b);
    doc.roundedRect(margin, y, contentWidth, 6, 1, 1, "F");

    // Risk badge
    doc.setFillColor(riskColor.r, riskColor.g, riskColor.b);
    doc.roundedRect(margin + 1, y + 1, 22, 4, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.text(`${clause.risk_level.toUpperCase()} RISK`, margin + 12, y + 4, { align: "center" });

    // Category
    doc.setTextColor(riskColor.r, riskColor.g, riskColor.b);
    doc.setFontSize(7);
    doc.text(clause.category.toUpperCase(), margin + 26, y + 4);

    // Clause number
    doc.setTextColor(130, 130, 150);
    doc.setFontSize(7);
    doc.text(`#${idx + 1}`, margin + contentWidth - 8, y + 4);

    y += 10;

    // Clause text (quoted)
    doc.setTextColor(40, 40, 60);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const clauseLines = doc.splitTextToSize(`"${clause.clause_text}"`, contentWidth - 4);
    addPageIfNeeded(clauseLines.length * 4 + 20);
    doc.text(clauseLines, margin + 2, y);
    y += clauseLines.length * 4 + 4;

    // Explanation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(99, 102, 241); // indigo
    doc.text("PLAIN LANGUAGE EXPLANATION", margin + 2, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 80);
    doc.setFontSize(8);
    const explLines = doc.splitTextToSize(clause.explanation, contentWidth - 4);
    addPageIfNeeded(explLines.length * 4 + 10);
    doc.text(explLines, margin + 2, y);
    y += explLines.length * 4 + 3;

    // Suggestion (if moderate/high)
    if (clause.suggestion && clause.risk_level !== "Safe") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129); // emerald
      doc.text("SUGGESTED IMPROVEMENT", margin + 2, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 80);
      doc.setFontSize(8);
      const sugLines = doc.splitTextToSize(clause.suggestion, contentWidth - 4);
      addPageIfNeeded(sugLines.length * 4 + 6);
      doc.text(sugLines, margin + 2, y);
      y += sugLines.length * 4 + 3;
    }

    // Role impact
    if (clause.role_impact) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(234, 88, 12); // orange
      doc.text(`IMPACT ON ${role.toUpperCase()}`, margin + 2, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 80);
      doc.setFontSize(8);
      const impLines = doc.splitTextToSize(clause.role_impact, contentWidth - 4);
      addPageIfNeeded(impLines.length * 4 + 6);
      doc.text(impLines, margin + 2, y);
      y += impLines.length * 4 + 3;
    }

    y += 6; // spacing between clauses

    // Subtle divider between clauses
    if (idx < analysis.clauses.length - 1) {
      addPageIfNeeded(4);
      doc.setDrawColor(220, 220, 230);
      doc.setLineWidth(0.2);
      doc.line(margin + 10, y, pageWidth - margin - 10, y);
      y += 6;
    }
  });

  // =============== FOOTER ON EVERY PAGE ===============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 245, 250);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setTextColor(140, 140, 160);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Generated by NyayRakshak AI — Your AI-Powered Legal Guardian",
      pageWidth / 2,
      pageHeight - 5,
      { align: "center" }
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  // Save
  const reportName = filename
    ? `NyayRakshak_Report_${filename.replace(/\.[^/.]+$/, "")}.pdf`
    : "NyayRakshak_Contract_Report.pdf";
  doc.save(reportName);
}
