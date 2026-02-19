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

type RGB = readonly [number, number, number];

const DARK_BG: RGB = [18, 24, 38];
const CARD_BG: RGB = [28, 38, 58];
const CARD_BORDER: RGB = [45, 58, 85];
const NAVY: RGB = [22, 30, 48];
const GOLD: RGB = [200, 149, 108];
const WHITE: RGB = [240, 245, 255];
const TEXT_LIGHT: RGB = [190, 205, 225];
const TEXT_MUTED: RGB = [120, 140, 170];
const SUCCESS: RGB = [40, 210, 130];
const WARNING: RGB = [245, 185, 50];
const DANGER: RGB = [245, 75, 75];
const CYAN: RGB = [55, 195, 240];
const TEAL: RGB = [40, 205, 165];

function getScoreColor(pct: number): RGB {
  if (pct >= 80) return SUCCESS;
  if (pct >= 60) return CYAN;
  if (pct >= 40) return WARNING;
  return DANGER;
}

function getDecisionInfo(decision: string): { label: string; color: RGB } {
  if (decision.includes('PROCEED') || decision.includes('QUOTE'))
    return { label: 'APPROVED', color: SUCCESS };
  if (decision.includes('REFER') || decision.includes('REVIEW'))
    return { label: 'REFERRED', color: WARNING };
  return { label: 'DECLINED', color: DANGER };
}

function card(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setFillColor(...CARD_BG);
  doc.roundedRect(x, y, w, h, 3, 3, 'F');
  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, 'S');
}

function progressBar(
  doc: jsPDF, x: number, y: number, w: number, h: number,
  pct: number, color: RGB
) {
  doc.setFillColor(40, 52, 78);
  doc.roundedRect(x, y, w, h, h / 2, h / 2, 'F');
  const fillW = Math.max(h, (Math.min(pct, 100) / 100) * w);
  doc.setFillColor(...color);
  doc.roundedRect(x, y, fillW, h, h / 2, h / 2, 'F');
}

function drawScoreRing(doc: jsPDF, cx: number, cy: number, score: number, radius: number) {
  const color = getScoreColor(score);
  // Background ring
  doc.setDrawColor(40, 52, 78);
  doc.setLineWidth(2.5);
  doc.circle(cx, cy, radius, 'S');
  // Score arc segments
  doc.setDrawColor(...color);
  doc.setLineWidth(2.5);
  const pct = score / 100;
  const startA = -Math.PI / 2;
  const segments = Math.floor(pct * 72);
  for (let i = 0; i < segments; i++) {
    const a1 = startA + (i / 72) * 2 * Math.PI;
    const a2 = startA + ((i + 1) / 72) * 2 * Math.PI;
    doc.line(
      cx + radius * Math.cos(a1), cy + radius * Math.sin(a1),
      cx + radius * Math.cos(a2), cy + radius * Math.sin(a2)
    );
  }
  // Score text
  doc.setTextColor(...color);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(String(score), cx, cy + 1, { align: 'center' });
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100', cx, cy + 8, { align: 'center' });
  doc.setFontSize(7);
  doc.text('Minimum: 60', cx, cy + 13, { align: 'center' });
}

export function generateScorecard(data: PdfData): void {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 12;
  const cw = pw - mx * 2;

  const refId = `MFS-${new Date().getFullYear()}-${data.score.submission_id?.slice(0, 8).toUpperCase() || 'XXXX'}`;
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dec = getDecisionInfo(data.score.decision || 'PENDING');
  const sections = data.score.section_scores || [];
  const strongSections = sections.filter(s => s.percentage >= 70);
  const weakSections = sections.filter(s => s.percentage < 70);

  // ════════════════════════════════════════════════════════════
  //  PAGE 1 — DECISION OVERVIEW
  // ════════════════════════════════════════════════════════════
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pw, ph, 'F');

  // Gold top accent
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pw, 1.2, 'F');

  // Header
  let y = 6;
  doc.setTextColor(...WHITE);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MAYFLOWER SPECIALTY', mx, y + 4);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('AI Liability Underwriting — Decision Scorecard', mx, y + 9);

  doc.setFontSize(6.5);
  doc.text(`Ref: ${refId}  |  ${dateStr}  |  CONFIDENTIAL`, pw - mx, y + 4, { align: 'right' });

  y = 20;

  // Page title
  doc.setTextColor(...WHITE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment Complete', pw / 2, y, { align: 'center' });

  y = 28;

  // ─── LEFT: Main Score Card ───
  const leftW = cw * 0.56;
  const leftH = 120;
  card(doc, mx, y, leftW, leftH);

  // Score ring
  const cx = mx + leftW / 2;
  const cy = y + 32;
  drawScoreRing(doc, cx, cy, data.score.composite_governance_score, 16);

  // Full-width progress bar
  const barY = cy + 19;
  progressBar(doc, mx + 12, barY, leftW - 24, 3,
    data.score.composite_governance_score, getScoreColor(data.score.composite_governance_score));

  // 60 threshold marker
  const threshX = mx + 12 + (60 / 100) * (leftW - 24);
  doc.setFillColor(...WHITE);
  doc.circle(threshX, barY + 1.5, 1, 'F');

  // Decision badge
  const badgeY = barY + 9;
  const badgeW = 48;
  const badgeX = cx - badgeW / 2;
  doc.setFillColor(
    Math.floor(dec.color[0] * 0.12 + CARD_BG[0] * 0.88),
    Math.floor(dec.color[1] * 0.12 + CARD_BG[1] * 0.88),
    Math.floor(dec.color[2] * 0.12 + CARD_BG[2] * 0.88)
  );
  doc.roundedRect(badgeX, badgeY, badgeW, 9, 2, 2, 'F');
  doc.setDrawColor(...dec.color);
  doc.setLineWidth(0.4);
  doc.roundedRect(badgeX, badgeY, badgeW, 9, 2, 2, 'S');
  doc.setTextColor(...dec.color);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`✓  ${dec.label}`, cx, badgeY + 6.5, { align: 'center' });

  // Decision Path Summary
  const dpY = badgeY + 16;
  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Decision Path Summary', mx + 10, dpY);

  doc.setDrawColor(...CARD_BORDER);
  doc.setLineWidth(0.2);
  doc.line(mx + 10, dpY + 2, mx + leftW - 10, dpY + 2);

  doc.setTextColor(...TEXT_LIGHT);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('This risk was approved based on:', mx + 10, dpY + 7);

  // Generate reasons from strong sections
  const reasons: string[] = [];
  strongSections.forEach(s => {
    const nm = s.section_name.toLowerCase();
    if (nm.includes('governance')) reasons.push('Strong governance framework (NIST-aligned)');
    else if (nm.includes('incident')) reasons.push('Documented incident response procedures');
    else if (nm.includes('data')) reasons.push('Robust data quality and privacy controls');
    else if (nm.includes('compliance') || nm.includes('regulatory')) reasons.push('Regulatory compliance documentation in place');
    else if (nm.includes('use') || nm.includes('impact')) reasons.push('Documented human oversight (HITL model)');
    else if (nm.includes('system') || nm.includes('critical')) reasons.push('System criticality assessment documented');
    else reasons.push(`${s.section_name}: ${s.rating}`);
  });

  // Check claims
  const claimsOk = (data.score.underwriting_checks || []).some(
    c => c.check_name.toLowerCase().includes('claims') &&
      (c.result.includes('PASS') || c.result.includes('OK'))
  );
  if (claimsOk) reasons.push('No historical claims or regulatory issues');

  // Bias testing mention
  const biasOk = (data.score.underwriting_checks || []).some(
    c => c.check_name.toLowerCase().includes('bias') || c.check_name.toLowerCase().includes('restricted')
  );
  if (biasOk) reasons.push('Quarterly bias testing with audit trail');

  let bY = dpY + 12;
  reasons.slice(0, 5).forEach(r => {
    doc.setTextColor(...SUCCESS);
    doc.setFontSize(8);
    doc.text('✓', mx + 12, bY);
    doc.setFontSize(7);
    doc.text(r, mx + 17, bY);
    bY += 5;
  });

  // Flags for monitoring (inside left card)
  if (weakSections.length > 0) {
    bY += 2;
    doc.setDrawColor(...CARD_BORDER);
    doc.line(mx + 10, bY - 2, mx + leftW - 10, bY - 2);

    doc.setTextColor(...WARNING);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠  Flags for Monitoring', mx + 10, bY + 2);
    bY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...TEXT_MUTED);
    weakSections.forEach(s => {
      doc.text(`•  ${s.section_name} (${s.percentage.toFixed(0)}%) — recommend review`, mx + 12, bY);
      bY += 4;
    });

    // Add relevant notes
    const flagNotes = (data.score.notes || []).filter(n =>
      n.toLowerCase().includes('below') || n.toLowerCase().includes('gap') ||
      n.toLowerCase().includes('recommend')
    );
    flagNotes.slice(0, 2).forEach(n => {
      const txt = doc.splitTextToSize(`•  ${n}`, leftW - 28);
      doc.text(txt[0], mx + 12, bY);
      bY += 4;
    });
  }

  // ─── RIGHT: Score Breakdown ───
  const rightX = mx + leftW + 4;
  const rightW = cw - leftW - 4;

  // Score Breakdown card
  const sbH = 10 + sections.length * 9;
  card(doc, rightX, y, rightW, sbH);

  doc.setTextColor(...TEAL);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('📊  Score Breakdown', rightX + 7, y + 8);

  let sbY = y + 15;
  sections.forEach(s => {
    const pct = s.percentage;
    const color = getScoreColor(pct);

    doc.setTextColor(...TEXT_LIGHT);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(s.section_name, rightX + 7, sbY);

    doc.setTextColor(...WHITE);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(`${s.raw_score}/${s.max_score}`, rightX + rightW - 7, sbY, { align: 'right' });

    progressBar(doc, rightX + 7, sbY + 2, rightW - 14, 2, pct, color);
    sbY += 9;
  });

  // Underwriter Controls card
  const ucY = y + sbH + 5;
  const multipliers = data.score.factor_multipliers || [];
  const topMultipliers = multipliers.slice(0, 4);
  const ucH = 14 + topMultipliers.length * 9;
  card(doc, rightX, ucY, rightW, ucH);

  doc.setTextColor(...TEAL);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('⚙  Factor Multipliers', rightX + 7, ucY + 8);

  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Factors affecting final score', rightX + 7, ucY + 13);

  let ucItemY = ucY + 19;
  topMultipliers.forEach(f => {
    doc.setTextColor(...TEXT_LIGHT);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(f.name, rightX + 7, ucItemY);

    const valColor: RGB = f.value > 1 ? DANGER : f.value < 1 ? SUCCESS : TEXT_LIGHT;
    doc.setTextColor(...valColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(f.value * 100).toFixed(0)}%`, rightX + rightW - 7, ucItemY, { align: 'right' });

    // Slider visualization
    const sliderY = ucItemY + 2;
    const sliderW = rightW - 14;
    progressBar(doc, rightX + 7, sliderY, sliderW, 1.5, f.value * 50, valColor);

    // Dot marker
    const dotX = rightX + 7 + (f.value / 2) * sliderW;
    doc.setFillColor(...valColor);
    doc.circle(dotX, sliderY + 0.75, 1.5, 'F');
    doc.setDrawColor(...DARK_BG);
    doc.setLineWidth(0.3);
    doc.circle(dotX, sliderY + 0.75, 1.5, 'S');

    ucItemY += 9;
  });

  // ─── Company info strip ───
  const infoY = y + leftH + 4;
  card(doc, mx, infoY, cw, 14);

  const infoCols = [
    { label: 'ORGANIZATION', val: data.companyInfo.organization_name },
    { label: 'INDUSTRY', val: data.companyInfo.industry_sector },
    { label: 'REVENUE', val: `$${data.companyInfo.annual_revenue_millions}M` },
    { label: 'EMPLOYEES', val: String(data.companyInfo.number_of_employees) },
    { label: 'POLICY', val: data.companyInfo.policy_type.replace('AI ', '') },
    { label: 'SCOPE', val: data.companyInfo.geographic_scope },
  ];
  const colW2 = cw / infoCols.length;
  infoCols.forEach((c, i) => {
    const ix = mx + 6 + i * colW2;
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(c.label, ix, infoY + 5);
    doc.setTextColor(...WHITE);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    const txt = doc.splitTextToSize(c.val, colW2 - 4);
    doc.text(txt[0], ix, infoY + 10);
  });

  // ════════════════════════════════════════════════════════════
  //  PAGE 2 — DETAILED ANALYSIS
  // ════════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pw, ph, 'F');
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, pw, 0.8, 'F');

  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MAYFLOWER SPECIALTY', mx, 7);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(6);
  doc.text(`${refId}  —  Detailed Analysis  —  ${data.companyInfo.organization_name}`, pw - mx, 7, { align: 'right' });

  y = 14;

  // Underwriting Checks
  if (data.score.underwriting_checks && data.score.underwriting_checks.length > 0) {
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Underwriting Checks', mx, y + 3);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [['Check', 'Result', 'Detail']],
      body: data.score.underwriting_checks.map(c => [c.check_name, c.result, c.detail || '']),
      margin: { left: mx, right: mx },
      styles: {
        fontSize: 6.5, cellPadding: 2.5,
        textColor: TEXT_LIGHT as any, lineColor: CARD_BORDER as any,
        lineWidth: 0.2, fillColor: CARD_BG as any,
      },
      headStyles: {
        fillColor: NAVY as any, textColor: TEAL as any,
        fontStyle: 'bold', fontSize: 6,
      },
      alternateRowStyles: { fillColor: [22, 32, 52] as any },
      didParseCell: (hd: any) => {
        if (hd.section === 'body' && hd.column.index === 1) {
          const r = (hd.cell.raw as string).toUpperCase();
          hd.cell.styles.fontStyle = 'bold';
          if (r.includes('PASS') || r.includes('OK')) hd.cell.styles.textColor = SUCCESS as any;
          else if (r.includes('FAIL') || r.includes('DECLINE')) hd.cell.styles.textColor = DANGER as any;
          else hd.cell.styles.textColor = WARNING as any;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Full Factor Multipliers table
  if (multipliers.length > 0) {
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Factor Multipliers — Full Detail', mx, y + 3);
    y += 7;

    autoTable(doc, {
      startY: y,
      head: [['Code', 'Factor', 'Multiplier', 'Source']],
      body: multipliers.map(f => [f.code, f.name, f.value.toFixed(2), f.source]),
      margin: { left: mx, right: mx },
      styles: {
        fontSize: 6.5, cellPadding: 2.5,
        textColor: TEXT_LIGHT as any, lineColor: CARD_BORDER as any,
        lineWidth: 0.2, fillColor: CARD_BG as any,
      },
      headStyles: {
        fillColor: NAVY as any, textColor: TEAL as any,
        fontStyle: 'bold', fontSize: 6,
      },
      alternateRowStyles: { fillColor: [22, 32, 52] as any },
      didParseCell: (hd: any) => {
        if (hd.section === 'body' && hd.column.index === 2) {
          const v = parseFloat(hd.cell.raw as string);
          hd.cell.styles.fontStyle = 'bold';
          if (v > 1) hd.cell.styles.textColor = DANGER as any;
          else if (v < 1) hd.cell.styles.textColor = SUCCESS as any;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Premium
  if (data.score.premium) {
    if (y > 220) { doc.addPage(); doc.setFillColor(...DARK_BG); doc.rect(0, 0, pw, ph, 'F'); y = 15; }

    doc.setTextColor(...GOLD);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Premium Indication', mx, y + 3);
    y += 7;

    const entries = Object.entries(data.score.premium);
    const cols = Math.min(entries.length, 5);
    const premColW = (cw - 10) / cols;

    for (let row = 0; row < Math.ceil(entries.length / cols); row++) {
      const rowEntries = entries.slice(row * cols, (row + 1) * cols);
      card(doc, mx, y, cw, 16);
      rowEntries.forEach(([key, val], i) => {
        const px = mx + 6 + i * premColW;
        doc.setTextColor(...TEXT_MUTED);
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(key.replace(/_/g, ' ').toUpperCase(), px, y + 5.5);
        doc.setTextColor(...WHITE);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        const disp = typeof val === 'number' ? val.toLocaleString() : String(val);
        doc.text(disp, px, y + 11);
      });
      y += 20;
    }
    y += 2;
  }

  // Notes
  if (data.score.notes && data.score.notes.length > 0) {
    if (y > 240) { doc.addPage(); doc.setFillColor(...DARK_BG); doc.rect(0, 0, pw, ph, 'F'); y = 15; }
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Underwriting Notes', mx, y + 3);
    y += 6;
    card(doc, mx, y, cw, 5 + data.score.notes.length * 4.5);
    let ny = y + 5;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    data.score.notes.forEach(n => {
      const lines = doc.splitTextToSize(`•  ${n}`, cw - 18);
      doc.text(lines[0], mx + 6, ny);
      ny += 4.5;
    });
    y = ny + 6;
  }

  // Decline reasons
  if (data.score.decline_reasons && data.score.decline_reasons.length > 0) {
    card(doc, mx, y, cw, 8 + data.score.decline_reasons.length * 5);
    doc.setTextColor(...DANGER);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Decline Reasons', mx + 6, y + 6);
    let dy = y + 12;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    data.score.decline_reasons.forEach(r => {
      doc.text(`•  ${r}`, mx + 8, dy);
      dy += 5;
    });
    y = dy + 4;
  }

  // Documents + Attestation
  if (y > 240) { doc.addPage(); doc.setFillColor(...DARK_BG); doc.rect(0, 0, pw, ph, 'F'); y = 15; }

  if (data.uploadedDocs.length > 0) {
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Documents Submitted', mx, y + 3);
    y += 6;
    card(doc, mx, y, cw, 4 + data.uploadedDocs.length * 4.5);
    let dy2 = y + 4.5;
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    data.uploadedDocs.forEach(d => {
      doc.setTextColor(...TEAL);
      doc.text('●', mx + 6, dy2);
      doc.setTextColor(...TEXT_LIGHT);
      doc.text(`${d.docType}: `, mx + 10, dy2);
      doc.setTextColor(...TEXT_MUTED);
      doc.text(d.filename, mx + 10 + doc.getTextWidth(`${d.docType}: `), dy2);
      dy2 += 4.5;
    });
    y = dy2 + 5;
  }

  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Attestation', mx, y + 3);
  y += 6;
  card(doc, mx, y, cw, 15);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_LIGHT);
  doc.text(`Attested by: ${data.signingInfo.full_name}, ${data.signingInfo.title}`, mx + 6, y + 5.5);
  doc.text(`Email: ${data.signingInfo.email}`, mx + 6, y + 10);
  doc.text(`Date: ${data.signingInfo.date}`, mx + 6, y + 14);

  // ─── Footers ───
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, ph - 9, pw, 9, 'F');
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(5.5);
    doc.text('Mayflower Specialty — Confidential Underwriting Document — Not for Distribution', mx, ph - 3.5);
    doc.text(`Page ${i} of ${pages}`, pw - mx, ph - 3.5, { align: 'right' });
  }

  const filename = `Mayflower_Scorecard_${data.companyInfo.organization_name.replace(/\s+/g, '_')}_${refId}.pdf`;
  doc.save(filename);
}
