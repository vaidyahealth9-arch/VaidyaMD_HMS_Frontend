'use client';

import React, { useState } from 'react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { useAuth } from '@/contexts/AuthContext';
import { resolveLogoUrl } from '@/components/common/PrintableReportHeader';

interface TakeawayCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: any;
  partner?: any;
  cycle: any;
  days: any[];
  defaultShowLogo?: boolean;
}

interface CalendarCell {
  isPadding?: boolean;
  day?: any;
}

export default function TakeawayCalendarModal({
  isOpen,
  onClose,
  patient,
  partner,
  cycle,
  days,
  defaultShowLogo = true,
}: TakeawayCalendarModalProps) {
  const { currentBranch, user } = useAuth() || {};

  const effectiveBoldColor =
    currentBranch?.receipt_header?.header_bold_color || '#4A2E2B';

  const effectiveLogoUrl = resolveLogoUrl(
    currentBranch?.receipt_header?.logo_url ||
    (currentBranch?.receipt_header as any)?.logo ||
    user?.hospital_logo_url
  );

  const effectiveHospitalName =
    currentBranch?.receipt_header?.hospital_name ||
    user?.hospital_name ||
    'Hospital & Healthcare Institute';

  const effectiveModality = cycle?.treatment_type || 'Controlled Ovarian Stimulation';

  // 1. Build calendar cells starting from Day 1's actual weekday (zero leading waste)
  // Deduplicate days by date or day_number to avoid phantom extra rows
  const uniqueDaysMap = new Map<string, any>();
  (days || []).forEach((d) => {
    const key = d.date || `day-${d.day_number}`;
    if (!uniqueDaysMap.has(key)) {
      uniqueDaysMap.set(key, d);
    }
  });

  const sortedDays = Array.from(uniqueDaysMap.values()).sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return (a.day_number || 0) - (b.day_number || 0);
  });

  const weekdaysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekdaysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let startDow = 0; // 0 = Sunday, 1 = Monday, etc.
  if (sortedDays.length > 0) {
    const firstDay = sortedDays[0];
    if (firstDay.date) {
      try {
        const d = new Date(firstDay.date);
        startDow = d.getDay();
      } catch {
        startDow = 1;
      }
    } else if (firstDay.day_of_week) {
      const idx = weekdaysShort.findIndex(
        (w) => w.toLowerCase() === firstDay.day_of_week.slice(0, 3).toLowerCase()
      );
      if (idx >= 0) startDow = idx;
    }
  }

  // 7 rotated column headers starting from Day 1's actual weekday
  const columnHeaders: string[] = [];
  for (let c = 0; c < 7; c++) {
    const dayIndex = (startDow + c) % 7;
    columnHeaders.push(weekdaysFull[dayIndex]);
  }

  const cells: CalendarCell[] = [];
  // Directly add active plan days starting at Column 0 with ZERO leading padding
  sortedDays.forEach((d) => {
    cells.push({ day: d });
  });
  // Add trailing padding to complete the last 7-day row
  while (cells.length % 7 !== 0) {
    cells.push({ isPadding: true });
  }

  // Chunk into 7-day calendar rows
  const calendarRows: CalendarCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    calendarRows.push(cells.slice(i, i + 7));
  }

  // Dynamic page chunking based on content density & available A4 landscape vertical height
  const estimateRowHeight = (row: CalendarCell[]): number => {
    let maxCellH = 32;
    for (const cell of row) {
      if (!cell.day) continue;
      const d = cell.day;
      let h = 20; // Date & Stim Day header

      // Blood / Lab Investigations
      let invCount = 0;
      if (d.e2_pgml) invCount++;
      if (d.lh_miu) invCount++;
      if (d.p4_ngml) invCount++;
      if (Array.isArray(d.investigations)) {
        invCount += d.investigations.filter(
          (inv: string) =>
            !inv.toLowerCase().includes('estradiol') &&
            !inv.toLowerCase().includes('luteinising') &&
            !inv.toLowerCase().includes('progesterone')
        ).length;
      }
      h += invCount * 9;

      // Scans & Folliculometry
      if (
        d.milestone?.toLowerCase().includes('scan') ||
        d.milestone?.toLowerCase().includes('tracking') ||
        d.milestone?.toLowerCase().includes('baseline')
      ) {
        h += 10;
      }
      if (d.endometrium_mm || d.right_follicles || d.left_follicles) {
        h += 16;
      }

      // Scheduled Medications
      if (Array.isArray(d.medications) && d.medications.length > 0) {
        h += d.medications.length * 11;
      }

      // Clinical Procedures
      const isOpu =
        d.milestone?.toLowerCase().includes('opu') ||
        d.milestone?.toLowerCase().includes('collection') ||
        (Array.isArray(d.procedures) &&
          d.procedures.some(
            (p: string) =>
              p.toLowerCase().includes('opu') ||
              p.toLowerCase().includes('collection') ||
              p.toLowerCase().includes('retrieval')
          ));
      if ((Array.isArray(d.procedures) && d.procedures.length > 0) || isOpu) {
        h += 14;
      }

      // 1 fontline breathing cushion
      h += 8;

      if (h > maxCellH) {
        maxCellH = h;
      }
    }
    return maxCellH;
  };

  const THEAD_HEIGHT = 20;
  const PAGE_HEIGHT_BUDGET = 470; // safe budget for table area on A4 landscape (total available is ~520px)

  const pages: CalendarCell[][][] = [];
  const rowHeights = calendarRows.map(estimateRowHeight);
  const totalPlanHeight = rowHeights.reduce((sum, h) => sum + h, 0) + THEAD_HEIGHT;

  // If all rows can fit on 1 single page without spilling over, keep them together on 1 page!
  // This allows 5 rows (e.g. 29-35 days) or even 6 lighter rows to comfortably sit on 1 page.
  if (calendarRows.length <= 6 && totalPlanHeight <= 490) {
    pages.push(calendarRows);
  } else {
    let currentPageRows: CalendarCell[][] = [];
    let currentHeight = THEAD_HEIGHT;

    for (let i = 0; i < calendarRows.length; i++) {
      const row = calendarRows[i];
      const rowH = rowHeights[i];
      const remainingRows = calendarRows.length - i;

      // If only 1 row remains and adding it fits within 490px, absorb it into current page
      // to avoid leaving an awkward 1-row second page!
      const canAbsorbLastRow =
        remainingRows === 1 &&
        currentHeight + rowH <= 490 &&
        currentPageRows.length < 6;

      if (
        currentPageRows.length > 0 &&
        !canAbsorbLastRow &&
        (currentHeight + rowH > PAGE_HEIGHT_BUDGET || currentPageRows.length >= 5)
      ) {
        pages.push(currentPageRows);
        currentPageRows = [row];
        currentHeight = THEAD_HEIGHT + rowH;
      } else {
        currentPageRows.push(row);
        currentHeight += rowH;
      }
    }

    if (currentPageRows.length > 0) {
      pages.push(currentPageRows);
    }
  }

  // Demographic labels & formatting
  const patientName = patient?.name || patient?.full_name || 'Mrs. Patient Record';
  const patientGA = `${patient?.gender || 'Female'}/${patient?.age || '32'}Y`;
  const patientId = patient?.vid || patient?.mrn || 'G-00018167';
  const patientPhone = patient?.phone || patient?.mobile || '+91 9100914882';
  const patientDob = patient?.dob || patient?.date_of_birth || '14-10-1993';

  const partnerName = partner?.name || patient?.partner_name || 'Mr. Partner Record';
  const partnerGA = `Male/${partner?.age || patient?.partner_age || '36'}Y`;
  const partnerId = partner?.vid || 'G-00018168';
  const partnerPhone = partner?.phone || partner?.mobile || '+91 7338040537';
  const partnerDob = partner?.dob || partner?.date_of_birth || '15-08-1989';

  const cycleId = cycle?.cycle_id || 'ICSI-00037';
  const attempts = String(cycle?.attempt_number || 1);

  // Stimulation start day is Baseline Scan Day
  const baselineScanDate =
    cycle?.sentinel_dates?.baseline_scan ||
    cycle?.sentinel_dates?.baseline_scan_date ||
    sortedDays.find((d) => d.milestone?.toLowerCase().includes('baseline'))?.date;

  const stimStart =
    baselineScanDate ||
    cycle?.sentinel_dates?.stim_start ||
    cycle?.start_date ||
    sortedDays[0]?.display_date ||
    sortedDays[0]?.date ||
    'Day 1';

  const doctorName = cycle?.consultant_name || cycle?.doctor_name || 'Dr. Treating Gynecologist';
  const printDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formatDateLabel = (d: any) => {
    if (!d) return '';
    if (d.display_date) {
      return d.display_date.replace(/,/g, '');
    }
    if (d.date) {
      try {
        const parts = d.date.split('-');
        if (parts.length === 3) {
          const dt = new Date(d.date);
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `${parts[2]}-${months[dt.getMonth()]}-${parts[0]}`;
        }
      } catch {
        return d.date;
      }
    }
    return `Day ${d.day_number}`;
  };

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Treatment Plan Takeaway Schedule"
      subtitle="Patient 7-Day Adherence Timetable & Daily Injections Log (Landscape)"
      maxWidth="max-w-[315mm]"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <div className="w-full flex flex-col items-center">
          {/* Global Landscape Preview & Print Stylesheet */}
          <style jsx global>{`
            /* Screen Preview: True Landscape Paper Card (297mm wide x 210mm min-height) */
            .a4-print-sheet.a4-landscape-page {
              width: 100% !important;
              max-width: 297mm !important;
              min-height: 210mm !important;
              height: auto !important;
              margin: 0 auto 2rem auto !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: visible !important;
              background: #ffffff !important;
              box-sizing: border-box !important;
            }

            @media print {
              @page {
                size: A4 landscape !important;
                margin: 0 !important; /* Zero margin enables 100% full-bleed edge-to-edge printing */
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 297mm !important;
                height: 210mm !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: #ffffff !important;
                color: #000000 !important;
                overflow: visible !important;
              }
              .a4-print-sheet.a4-landscape-page {
                width: 297mm !important;
                max-width: 297mm !important;
                min-height: 208mm !important;
                height: auto !important;
                max-height: 208.5mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                box-sizing: border-box !important;
                overflow: hidden !important; /* Suppresses subpixel rounding extra blank page */
              }
              .a4-print-sheet.a4-landscape-page:not(:last-child):not(:last-of-type) {
                page-break-after: always !important;
                break-after: page !important;
              }
              /* Suppress trailing empty page on last sheet */
              .a4-print-sheet.a4-landscape-page:last-child,
              .a4-print-sheet.a4-landscape-page:last-of-type,
              .a4-print-sheet.a4-landscape-page:only-child,
              .a4-print-sheet.a4-landscape-page:only-of-type {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              table.print-header-table,
              table.print-header-table td,
              table.print-calendar-table,
              table.print-calendar-table th,
              table.print-calendar-table td {
                border-collapse: collapse !important;
                border: 1px solid #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box !important;
              }
              table.print-calendar-table {
                border: 1.5px solid #000000 !important;
              }
              table.print-calendar-table th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #000000 !important;
              }
            }
          `}</style>

          {pages.map((weeksForPage, pageIdx) => {
            const rowsOnThisPage = weeksForPage.length;
            const isCompact = rowsOnThisPage >= 4;

            return (
              <A4Sheet
                key={`takeaway-page-${pageIdx}`}
                className="a4-landscape-page mb-8 print:mb-0 w-full max-w-[297mm] min-h-[210mm] bg-white text-slate-900 shadow-sm border border-slate-200"
                header={
                  <div className="w-full">
                    {/* ── Top Bold Accent Stripe (Full Bleed touching paper top edge) ── */}
                    <div
                      className="w-full block m-0 p-0 shrink-0"
                      style={{
                        height: '4.5mm',
                        backgroundColor: effectiveBoldColor,
                        WebkitPrintColorAdjust: 'exact',
                        printColorAdjust: 'exact',
                      }}
                    />

                    {/* Header Content with proper margin */}
                    <div className="px-6 sm:px-8 print:px-8 pt-2 pb-0.5">
                      {/* Optional Hospital Branding Header Strip */}
                      {!hideHeader && (
                        <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-300">
                          <div className="flex items-center gap-3">
                            {effectiveLogoUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={effectiveLogoUrl}
                                alt="Hospital Logo"
                                className="h-8 max-w-[130px] object-contain"
                              />
                            ) : null}
                            <div>
                              <h1 className="text-xs font-extrabold uppercase tracking-wide text-slate-900 leading-none">
                                {effectiveHospitalName}
                              </h1>
                              <p className="text-[8.5px] text-slate-600 mt-0.5">
                                Department of Reproductive Medicine &amp; Advanced ART · Infertility Care
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[8.5px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                              PATIENT TAKEAWAY SCHEDULE
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Document Title */}
                      <h2 className="text-center font-black text-xs uppercase tracking-wider text-slate-900 mb-1">
                        TREATMENT PLAN SCHEDULE
                      </h2>

                      {/* Concise 4-Column Clinical Demographic Grid */}
                      <table className="w-full border-collapse border border-black text-[9px] leading-snug print-header-table">
                        <tbody>
                          <tr>
                            <td className="border border-black px-2 py-0.5 w-1/4">
                              <strong className="text-slate-900">Name:</strong> {patientName}
                            </td>
                            <td className="border border-black px-2 py-0.5 w-1/4">
                              <strong className="text-slate-900">Treatment:</strong> {effectiveModality}
                            </td>
                            <td className="border border-black px-2 py-0.5 w-1/4">
                              <strong className="text-slate-900">Partner:</strong> {partnerName}
                            </td>
                            <td className="border border-black px-2 py-0.5 w-1/4">
                              <strong className="text-slate-900">P. DOB:</strong> {partnerDob}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">G/A:</strong> {patientGA}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">DOB:</strong> {patientDob}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">G/A:</strong> {partnerGA}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Stim Start:</strong> {stimStart}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Patient Id:</strong> {patientId}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Cycle Id:</strong> {cycleId}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Partner Id:</strong> {partnerId}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Doctor:</strong> {doctorName}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Phone:</strong> {patientPhone}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Attempts:</strong> {attempts}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Phone:</strong> {partnerPhone}
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              <strong className="text-slate-900">Printed:</strong> {printDate}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
                footer={
                  <PrintableReportFooter
                    signatoryName={doctorName}
                    signatoryTitle="Reproductive Medicine Specialist"
                    showSignatory={true}
                    pageNumber={pageIdx + 1}
                    totalPages={pages.length}
                    hideHospitalFooter={hideHeader}
                    headerBoldColor={effectiveBoldColor}
                  />
                }
              >
                {/* 7-Column Calendar Grid Table — Single Unified Table per Page */}
                <div className="w-full px-6 sm:px-8 print:px-8 my-auto flex-1 flex flex-col justify-start py-1">
                  <table
                    className="w-full border-collapse border border-black table-fixed text-[8px] print:text-[7.5px] print-calendar-table"
                    style={{ borderCollapse: 'collapse', border: '1.5px solid #000000' }}
                  >
                    <thead>
                      <tr className="bg-slate-100 text-black border-b border-black">
                        {columnHeaders.map((colName, cIdx) => (
                          <th
                            key={cIdx}
                            className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900 text-[8.5px] print:text-[8px] uppercase tracking-wide"
                          >
                            {colName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weeksForPage.map((week, wIdx) => (
                        <tr key={`week-${wIdx}`}>
                          {week.map((cell, cIdx) => {
                            const isLeftEdge = cIdx === 0;
                            if (cell.isPadding || !cell.day) {
                              return (
                                <td
                                  key={`pad-${cIdx}`}
                                  className="border border-black bg-slate-50/40 p-1 align-top box-border h-auto"
                                >
                                  {/* Blank padding cell */}
                                </td>
                              );
                            }

                            const day = cell.day;
                            const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                            const isOpu =
                              day.milestone?.toLowerCase().includes('opu') ||
                              day.milestone?.toLowerCase().includes('collection') ||
                              (Array.isArray(day.procedures) &&
                                day.procedures.some(
                                  (p: string) =>
                                    p.toLowerCase().includes('opu') ||
                                    p.toLowerCase().includes('collection') ||
                                    p.toLowerCase().includes('retrieval')
                                ));

                            return (
                              <td
                                key={`day-${day.day_number}-${cIdx}`}
                                className={`border border-black align-top text-black box-border h-auto ${
                                  isCompact
                                    ? 'px-1 pt-1 pb-2 print:px-1 print:pt-0.5 print:pb-2'
                                    : isLeftEdge
                                    ? 'pl-1.5 pr-1 pt-1 pb-3 print:pb-3'
                                    : 'px-1 pt-1 pb-3 print:pb-3'
                                } ${
                                  isTrigger
                                    ? 'bg-amber-50/40'
                                    : isOpu
                                    ? 'bg-rose-50/40'
                                    : 'bg-white'
                                }`}
                              >
                                <div className="flex flex-col justify-between h-full min-h-[38px] pb-0.5">
                                  <div>
                                    {/* Cell Header: Date (Day X · Stim Y) */}
                                    <div className="font-extrabold text-[8.5px] border-b border-black pb-0.5 mb-1 text-slate-900 flex items-center justify-between whitespace-nowrap overflow-visible">
                                      <span className="font-bold tracking-tight">{formatDateLabel(day)}</span>
                                      <span className="font-bold text-slate-700 ml-1">
                                        Day {day.day_number}{day.stim_day_number ? ` · S${day.stim_day_number}` : ''}
                                      </span>
                                    </div>

                                    {/* 1. Blood / Lab Investigations (E2, LH, P4) */}
                                    <div className="space-y-0.5 mb-0.5 font-mono text-[7px] text-rose-700 leading-tight">
                                      {day.e2_pgml && <div>Estradiol (E2)-{day.e2_pgml}</div>}
                                      {day.lh_miu && <div>Luteinising Hormone (LH)-{day.lh_miu}</div>}
                                      {day.p4_ngml && <div>Progesterone (P4)-{day.p4_ngml}</div>}
                                      {Array.isArray(day.investigations) &&
                                        day.investigations
                                          .filter(
                                            (inv: string) =>
                                              !inv.toLowerCase().includes('estradiol') &&
                                              !inv.toLowerCase().includes('luteinising') &&
                                              !inv.toLowerCase().includes('progesterone')
                                          )
                                          .map((inv: string, iIdx: number) => (
                                            <div key={`inv-${iIdx}`}>{inv}</div>
                                          ))}
                                    </div>

                                    {/* 2. Scans & Folliculometry Findings */}
                                    {(day.milestone?.toLowerCase().includes('scan') ||
                                      day.endometrium_mm ||
                                      day.right_follicles ||
                                      day.left_follicles ||
                                      (Array.isArray(day.scans) && day.scans.length > 0)) && (
                                      <div className="mb-0.5 leading-tight">
                                        {day.milestone &&
                                          (day.milestone.toLowerCase().includes('scan') ||
                                            day.milestone.toLowerCase().includes('tracking') ||
                                            day.milestone.toLowerCase().includes('baseline')) && (
                                            <div className="font-bold text-sky-900 text-[7.5px] mb-0.5">
                                              {day.milestone}
                                            </div>
                                          )}
                                        {(day.endometrium_mm || day.right_follicles || day.left_follicles) && (
                                          <div className="font-mono text-[7px] text-slate-800">
                                            {day.endometrium_mm && <div>ET-{day.endometrium_mm} mm;</div>}
                                            {day.right_follicles && <div>R-{day.right_follicles};</div>}
                                            {day.left_follicles && <div>L-{day.left_follicles}</div>}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* 3. Scheduled Medications */}
                                    <div className="space-y-0.5 mt-0.5">
                                      {Array.isArray(day.medications) &&
                                        day.medications.map((m: any, mIdx: number) => (
                                          <div
                                            key={mIdx}
                                            className="font-semibold text-slate-900 leading-tight"
                                          >
                                            {(m.drug_name || m.name || '').split('(')[0].trim()} - {m.dose || m.dosage}
                                            {m.quantity && m.quantity > 1 ? ` X ${m.quantity} times` : ''}
                                          </div>
                                        ))}
                                    </div>
                                  </div>

                                  {/* 4. Clinical Procedures at Bottom */}
                                  {((Array.isArray(day.procedures) && day.procedures.length > 0) || isOpu) && (
                                    <div className="font-extrabold text-[7.5px] text-purple-900 text-center uppercase tracking-wider mt-0.5 pt-0.5 border-t border-purple-300">
                                      {Array.isArray(day.procedures) && day.procedures.length > 0
                                        ? day.procedures.join(' · ')
                                        : 'Egg Collection'}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </A4Sheet>
            );
          })}
        </div>
      )}
    </PrintableModal>
  );
}
