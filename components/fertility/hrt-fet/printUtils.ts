'use client';

import { HrtFetRowData } from './types';

export const openPrintWindow = (title: string, bodyHtml: string, hospitalName: string, branchSubtitle: string) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups for printing.'); return; }
    win.document.write(`<!DOCTYPE html>
<html><head>
<title>${title}</title>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4 landscape; margin: 8mm 10mm; }
  @media print {
    body { padding: 0 !important; margin: 0 !important; }
  }
  body { font-family: 'Arial', sans-serif; font-size: 8.5pt; color: #111827; background: white; padding: 6mm 8mm; }
  .clinic-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0B4F6C; padding-bottom: 6px; margin-bottom: 10px; }
  .clinic-name { font-size: 13pt; font-weight: 800; color: #0B4F6C; }
  .clinic-sub { font-size: 7.5pt; color: #6b7280; margin-top: 1px; }
  .doc-title { font-size: 10pt; font-weight: 700; color: #1a6e8e; text-align: right; }
  .doc-sub { font-size: 7.5pt; color: #6b7280; text-align: right; }
  table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
  thead { display: table-header-group; }
  th { background: #0B4F6C; color: white; padding: 3pt 4pt; text-align: left; font-weight: 700; font-size: 6.8pt; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; }
  td { padding: 2.5pt 4pt; border-bottom: 0.5pt solid #e2e8f0; vertical-align: top; }
  tr { page-break-inside: avoid; }
  tr:nth-child(even) td { background: #f8fafc; }
  .phase-badge { display: inline-block; padding: 1pt 4pt; border-radius: 3pt; font-size: 7pt; font-weight: 700; }
  .et-row td { background: #fff0f0 !important; font-weight: 700; }
  .p0-row td { background: #fffbeb !important; }
  .e-day { display: inline-block; background: #ccfbf1; color: #065f46; padding: 1pt 4pt; border-radius: 3pt; font-size: 7pt; font-weight: 700; }
  .footer { margin-top: 12px; padding-top: 6px; border-top: 1pt solid #d1d5db; display: flex; justify-content: space-between; font-size: 7pt; color: #6b7280; page-break-inside: avoid; }
  /* Calendar grid */
  .week-block { margin-bottom: 8px; page-break-inside: avoid; }
  .week-label { background: #0B4F6C; color: white; padding: 2.5pt 5pt; font-size: 7.5pt; font-weight: 800; border-radius: 3pt 3pt 0 0; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); border: 0.5pt solid #d1d5db; }
  .cal-day-header { background: #1a6e8e; color: white; text-align: center; padding: 3pt; font-size: 7pt; font-weight: 800; text-transform: uppercase; border-right: 0.5pt solid #d1d5db; }
  .cal-day-header:last-child { border-right: none; }
  .cal-cell { min-height: 52pt; padding: 3pt; border-right: 0.5pt solid #e2e8f0; border-top: 0.5pt solid #e2e8f0; vertical-align: top; }
  .cal-cell:last-child { border-right: none; }
  .cal-date { font-weight: 800; font-size: 7.5pt; margin-bottom: 1.5pt; }
  .cal-phase { font-size: 6pt; color: #6b7280; font-style: italic; margin-bottom: 1.5pt; }
  .cal-scan { background: #ecfeff; border: 0.5pt solid #a5f3fc; padding: 1pt 2.5pt; border-radius: 2pt; font-size: 6pt; font-weight: 700; color: #0e7490; margin-bottom: 1.5pt; }
  .cal-med { background: #e0f2fe; border: 0.5pt solid #bae6fd; padding: 1pt 2.5pt; border-radius: 2pt; font-size: 6pt; font-weight: 600; color: #0369a1; margin-bottom: 1.5pt; }
  .cal-et { font-size: 6.5pt; font-weight: 800; color: #be123c; margin-top: 1.5pt; }
  .cal-empty { background: #f9fafb; }
  .cal-p0 { background: #fffbeb; }
  .cal-transfer { background: #fff0f0; }
</style>
</head><body>
<div class="clinic-header">
  <div>
    <div class="clinic-name">${hospitalName}</div>
    <div class="clinic-sub">${branchSubtitle}</div>
  </div>
  <div>
    <div class="doc-title">${title}</div>
    <div class="doc-sub">Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
  </div>
</div>
${bodyHtml}
<div class="footer">
  <span>VaidyaMD HMS · Confidential Clinical Document</span>
  <span>Printed: ${new Date().toLocaleString('en-IN')}</span>
  <span>Doctor Signature: ____________________</span>
</div>
</body></html>`);
    win.document.close();
    win.focus();
    win.onafterprint = () => { win.close(); };
    setTimeout(() => { win.print(); }, 400);
  };

export const handlePrintTable = (rows: HrtFetRowData[], hospitalName: string, branchSubtitle: string) => {
    const tableRows = rows.map((row) => {
      const isET = row.embryo_stage && row.embryo_stage !== '';
      const isP0 = row.phase?.includes('P0');
      return `<tr class="${isET ? 'et-row' : isP0 ? 'p0-row' : ''}">
        <td style="font-weight:800">${row.cycle_day}</td>
        <td>${row.display_date}<br/><span style="color:#9ca3af;font-size:7pt">${row.day_of_week}</span></td>
        <td>${row.estrogen_day ? `<span class="e-day">E${row.estrogen_day}</span>` : '—'}</td>
        <td style="font-size:7.5pt">${row.phase}</td>
        <td style="font-weight:700">${row.medication || '—'}</td>
        <td>${row.dose || '—'}</td>
        <td>${row.route || '—'} ${row.frequency ? `· ${row.frequency}` : ''}</td>
        <td>${row.monitoring_criteria || '—'}</td>
        <td style="font-weight:700;color:#0369a1">${row.result_value || '—'}</td>
        <td>${row.embryo_stage || '—'}</td>
        <td style="color:#6b7280;font-size:7pt">${row.notes || ''}</td>
      </tr>`;
    }).join('');

    const html = `
<table>
  <thead>
    <tr>
      <th>Day</th><th>Date</th><th>E-Day</th><th>Phase</th><th>Medication</th>
      <th>Dose</th><th>Route / Freq</th><th>Monitoring</th><th>Result</th><th>Embryo Stage</th><th>Notes</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
<p style="margin-top:8px;font-size:7.5pt;color:#6b7280;">P0 = Progesterone Start Day. ET = Embryo Transfer Day. E# = Estrogen Day Number.</p>`;

    openPrintWindow('HRT FET Protocol — Day-by-Day Schedule', html, hospitalName, branchSubtitle);
  };

export const handlePrintCalendar = (rows: HrtFetRowData[], hospitalName: string, branchSubtitle: string) => {
    const DAYS_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const groupedWeeks: (HrtFetRowData | null)[][] = [];
    let weekBuf: (HrtFetRowData | null)[] = [];
    let firstRow = true;
    rows.forEach((r) => {
      const dow = r.day_of_week?.slice(0, 3) || 'Mon';
      const dowIdx = DAYS_ORDER.indexOf(dow);
      if (firstRow) {
        for (let i = 0; i < (dowIdx < 0 ? 0 : dowIdx); i++) weekBuf.push(null);
        firstRow = false;
      }
      weekBuf.push(r);
      if (weekBuf.length === 7) { groupedWeeks.push([...weekBuf]); weekBuf = []; }
    });
    if (weekBuf.length > 0) {
      while (weekBuf.length < 7) weekBuf.push(null);
      groupedWeeks.push(weekBuf);
    }

    const weeksHtml = groupedWeeks.map((week, wi) => {
      const cellsHtml = week.map((row) => {
        if (!row) return `<div class="cal-cell cal-empty"></div>`;
        const isP0 = row.phase?.includes('P0');
        const isET = row.embryo_stage && row.embryo_stage !== '';
        return `<div class="cal-cell ${isET ? 'cal-transfer' : isP0 ? 'cal-p0' : ''}">
          <div class="cal-date">${row.display_date}${row.estrogen_day ? ` <span style="background:#ccfbf1;color:#065f46;padding:0 3pt;border-radius:2pt;font-size:6pt;font-weight:800">E${row.estrogen_day}</span>` : ''}</div>
          ${row.phase ? `<div class="cal-phase">${row.phase}</div>` : ''}
          ${row.monitoring_criteria ? `<div class="cal-scan">${row.monitoring_criteria}</div>` : ''}
          ${row.result_value ? `<div style="font-size:7pt;font-weight:700;color:#4338ca">${row.result_value}</div>` : ''}
          ${row.medication ? `<div class="cal-med">${row.medication}${row.dose ? ` — ${row.dose}` : ''}${row.frequency ? ` × ${row.frequency}` : ''}</div>` : ''}
          ${row.embryo_stage ? `<div class="cal-et">🌸 ${row.embryo_stage}</div>` : ''}
        </div>`;
      }).join('');

      const headerCells = DAYS_ORDER.map(d => `<div class="cal-day-header">${d}</div>`).join('');
      return `<div class="week-block">
        <div class="week-label">Week ${wi + 1}</div>
        <div class="cal-grid">${headerCells}${cellsHtml}</div>
      </div>`;
    }).join('');

    openPrintWindow('HRT FET Protocol — Weekly Treatment Calendar', weeksHtml, hospitalName, branchSubtitle);
  }
