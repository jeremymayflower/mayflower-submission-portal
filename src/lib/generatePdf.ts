import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ScoreResponse } from '../services/api';

interface PdfData {
  companyInfo: {
    organization_name: string;
    industry_sector: string;
    annual_revenue_millions: number | '';
    number_of_employees: number | '';
    policy_type: string;
    geographic_scope: string;
  };
  profile: {
    ai_use_cases: string[];
    coverage_lines: string[];
    effective_date: string;
    current_carriers: string;
    models_in_production: string;
  };
  uploadedDocs: { docType: string; filename: string }[];
  signingInfo: {
    full_name: string;
    title: string;
    email: string;
    date: string;
  };
  score: ScoreResponse;
}

const NAVY = [27, 42, 74] as const;
const GOLD = [200, 149, 108] as const;
const WHITE = [255, 255, 255] as const;
const CREAM = [248, 247, 244] as const;
const TEXT = [27, 42, 74] as const;
const MUTED = [100, 116, 139] as const;
const SUCCESS = [45, 125, 70] as const;
const WARNING = [212, 160, 48] as const;
const DANGER = [220, 38, 38] as const;

function getRatingColor(rating: string): readonly [number, number, number] {
  const r = rating.toLowerCase();
  if (r.includes('strong') || r.includes('excellent') || r.includes('good')) return SUCCESS;
  if (r.includes('moderate') || r.includes('adequate') || r.includes('developing')) return WARNING;
  return DANGER;
}

function getDecisionColor(decision: string): readonly [number, number, number] {
  if (decision.includes('PROCEED') || decision.includes('QUOTE')) return SUCCESS;
  if (decision.includes('REFER') || decision.includes('REVIEW')) return WARNING;
  return DANGER;
}

export function generateScorecard(data: PdfData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ─── HEADER BAR ───
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 38, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MAYFLOWER SPECIALTY', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI Liability Underwriting — Decision Scorecard', margin, 24);

  // Reference + Date
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 210);
  const refId = `MFS-${new Date().getFullYear()}-${data.score.submission_id?.slice(0, 8).toUpperCase() || 'XXXX'}`;
  doc.text(`Ref: ${refId}`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth - margin, 22, { align: 'right' });
  doc.text('CONFIDENTIAL — INTERNAL USE ONLY', pageWidth - margin, 28, { align: 'right' });

  y = 46;

  // ─── DECISION BANNER ───
  const decision = data.score.decision || 'PENDING REVIEW';
  const decColor = getDecisionColor(decision);
  doc.setFillColor(...decColor);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`DECISION: ${decision}`, pageWidth / 2, y + 10.5, { align: 'center' });

  y += 22;

  // ─── TOP METRICS ROW ───
  const metricW = contentWidth / 3 - 2;
  const metrics = [
    { label: 'Composite Score', value: `${data.score.composite_governance_score}/100`, sub: data.score.composite_status || '' },
    { label: 'Organization', value: data.companyInfo.organization_name, sub: data.companyInfo.industry_sector },
    { label: 'Revenue / Employees', value: `$${data.companyInfo.annual_revenue_millions}M`, sub: `${data.companyInfo.number_of_employees} employees` },
  ];

  metrics.forEach((m, i) => {
    const x = margin + i * (metricW + 3);
    doc.setFillColor(...CREAM);
    doc.roundedRect(x, y, metricW, 22, 2, 2, 'F');
    doc.setDrawColor(220, 220, 215);
    doc.roundedRect(x, y, metricW, 22, 2, 2, 'S');

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label.toUpperCase(), x + 4, y + 6);

    doc.setTextColor(...TEXT);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, x + 4, y + 13.5);

    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(m.sub, x + 4, y + 19);
  });

  y += 28;

  // ─── SECTION SCORES TABLE ───
  doc.setTextColor(...NAVY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Governance Section Scores', margin, y);
  y += 3;

  const sectionRows = (data.score.section_scores || []).map(s => [
    s.section_name,
    `${(s.weight * 100).toFixed(0)}%`,
    `${s.raw_score}/${s.max_score}`,
    `${s.percentage.toFixed(0)}%`,
    s.rating,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Section', 'Weight', 'Raw Score', 'Percentage', 'Rating']],
    body: sectionRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      textColor: TEXT as any,
      lineColor: [220, 220, 215],
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: NAVY as any,
      textColor: WHITE as any,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: CREAM as any,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
    },
    didParseCell: (hookData: any) => {
      // Color the rating cell
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const rating = hookData.cell.raw as string;
        hookData.cell.styles.textColor = getRatingColor(rating) as any;
        hookData.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ─── FACTOR MULTIPLIERS ───
  if (data.score.factor_multipliers && data.score.factor_multipliers.length > 0) {
    // Check if we need a new page
    if (y > 230) {
      doc.addPage();
      y = 18;
    }

    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Factor Multipliers', margin, y);
    y += 3;

    const factorRows = data.score.factor_multipliers.map(f => [
      f.code,
      f.name,
      f.value.toFixed(2),
      f.source,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Factor', 'Multiplier', 'Source']],
      body: factorRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: TEXT as any,
        lineColor: [220, 220, 215],
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: NAVY as any,
        textColor: WHITE as any,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: CREAM as any,
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const val = parseFloat(hookData.cell.raw as string);
          if (val > 1) hookData.cell.styles.textColor = DANGER as any;
          else if (val < 1) hookData.cell.styles.textColor = SUCCESS as any;
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── UNDERWRITING CHECKS ───
  if (data.score.underwriting_checks && data.score.underwriting_checks.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 18;
    }

    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Underwriting Checks', margin, y);
    y += 3;

    const checkRows = data.score.underwriting_checks.map(c => [
      c.check_name,
      c.result,
      c.detail,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Check', 'Result', 'Detail']],
      body: checkRows,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: TEXT as any,
        lineColor: [220, 220, 215],
        lineWidth: 0.25,
      },
      headStyles: {
        fillColor: NAVY as any,
        textColor: WHITE as any,
        fontStyle: 'bold',
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: CREAM as any,
      },
      didParseCell: (hookData: any) => {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const result = (hookData.cell.raw as string).toUpperCase();
          if (result.includes('PASS') || result.includes('OK') || result.includes('CLEAR')) {
            hookData.cell.styles.textColor = SUCCESS as any;
          } else if (result.includes('FAIL') || result.includes('FLAG') || result.includes('DECLINE')) {
            hookData.cell.styles.textColor = DANGER as any;
          } else {
            hookData.cell.styles.textColor = WARNING as any;
          }
          hookData.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ─── PREMIUM / COVERAGE (if available) ───
  if (data.score.premium) {
    if (y > 245) {
      doc.addPage();
      y = 18;
    }

    doc.setTextColor(...NAVY);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Premium Indication', margin, y);
    y += 5;

    doc.setFillColor(...CREAM);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
    doc.setDrawColor(220, 220, 215);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

    doc.setTextColor(...TEXT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    const premKeys = Object.entries(data.score.premium);
    let px = margin + 4;
    premKeys.forEach(([key, val]) => {
      doc.setTextColor(...MUTED);
      doc.setFontSize(6.5);
      doc.text(key.replace(/_/g, ' ').toUpperCase(), px, y + 6);
      doc.setTextColor(...TEXT);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(String(val), px, y + 12);
      doc.setFont('helvetica', 'normal');
      px += 42;
    });

    y += 24;
  }

  // ─── NOTES / DECLINE REASONS ───
  if (y > 250) {
    doc.addPage();
    y = 18;
  }

  if (data.score.decline_reasons && data.score.decline_reasons.length > 0) {
    doc.setTextColor(...DANGER);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Decline Reasons', margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    data.score.decline_reasons.forEach(r => {
      doc.text(`• ${r}`, margin + 2, y);
      y += 5;
    });
    y += 3;
  }

  if (data.score.notes && data.score.notes.length > 0) {
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Underwriting Notes', margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    data.score.notes.forEach(n => {
      const lines = doc.splitTextToSize(n, contentWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 2;
    });
    y += 3;
  }

  // ─── DOCUMENTS SUBMITTED ───
  if (data.uploadedDocs.length > 0) {
    if (y > 255) { doc.addPage(); y = 18; }
    doc.setTextColor(...NAVY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Documents Submitted', margin, y);
    y += 5;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    data.uploadedDocs.forEach(d => {
      doc.text(`• ${d.docType}: ${d.filename}`, margin + 2, y);
      y += 4;
    });
    y += 4;
  }

  // ─── ATTESTATION / SIGNING ───
  if (y > 255) { doc.addPage(); y = 18; }
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Attestation', margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);
  doc.text(`Attested by: ${data.signingInfo.full_name}, ${data.signingInfo.title}`, margin + 2, y);
  y += 4;
  doc.text(`Email: ${data.signingInfo.email}`, margin + 2, y);
  y += 4;
  doc.text(`Date: ${data.signingInfo.date}`, margin + 2, y);
  y += 8;

  // ─── FOOTER ───
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFillColor(...NAVY);
    doc.rect(0, pageH - 12, pageWidth, 12, 'F');

    doc.setTextColor(180, 180, 190);
    doc.setFontSize(6.5);
    doc.text('Mayflower Specialty — Confidential Underwriting Document — Not for Distribution', margin, pageH - 5);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageH - 5, { align: 'right' });
  }

  // Save
  const filename = `Mayflower_Scorecard_${data.companyInfo.organization_name.replace(/\s+/g, '_')}_${refId}.pdf`;
  doc.save(filename);
}
