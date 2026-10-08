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
  const [includeLogo, setIncludeLogo] = useState(defaultShowLogo);
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

  // 1. Build weekday-aligned calendar cells (Monday = index 0, Sunday = index 6)
  const sortedDays = [...(days || [])].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));

  let startDowIndex = 0; // default Monday
  if (sortedDays.length > 0) {
    const firstDay = sortedDays[0];
    if (firstDay.date) {
      try {
        const d = new Date(firstDay.date);
        startDowIndex = (d.getDay() + 6) % 7;
      } catch {
        startDowIndex = 0;
      }
    } else if (firstDay.day_of_week) {
      const dowMap: Record<string, number> = {
        mon: 0,
        tue: 1,
        wed: 2,
        thu: 3,
        fri: 4,
        sat: 5,
        sun: 6,
      };
      const key = firstDay.day_of_week.slice(0, 3).toLowerCase();
      if (dowMap[key] !== undefined) startDowIndex = dowMap[key];
    }
  }

  const cells: CalendarCell[] = [];
  // Add leading padding for days before Day 1 in starting week
  for (let p = 0; p < startDowIndex; p++) {
    cells.push({ isPadding: true });
  }
  // Add active plan days
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

  // Group rows into pages:
  // If 3 weeks or fewer (standard 14–18 day cycle): fit on 1 single page (Page 1 of 1)!
  // If > 3 weeks (e.g. 28–35 day long downregulation cycle): chunk 2 or 3 weeks per page.
  const pages: CalendarCell[][][] = [];
  if (calendarRows.length <= 3) {
    pages.push(calendarRows);
  } else {
    for (let i = 0; i < calendarRows.length; i += 2) {
      pages.push(calendarRows.slice(i, i + 2));
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
  const stimStart = cycle?.start_date || sortedDays[0]?.display_date || sortedDays[0]?.date || 'Day 1';
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
            /* Screen Preview: True Landscape Paper Card (297mm wide x 210mm high) */
            .a4-print-sheet.a4-landscape-page {
              width: 297mm !important;
              max-width: 297mm !important;
              min-height: 210mm !important;
              height: 210mm !important;
              max-height: 210mm !important;
              aspect-ratio: 297 / 210 !important;
              margin: 0 auto 2rem auto !important;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2) !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
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
                min-height: 209mm !important;
                height: 209mm !important;
                max-height: 209mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                box-sizing: border-box !important;
                overflow: hidden !important; /* Suppresses subpixel rounding extra blank page */
              }
              /* Suppress trailing empty page on last sheet */
              .a4-print-sheet.a4-landscape-page:last-child,
              .a4-print-sheet.a4-landscape-page:last-of-type {
                page-break-after: auto !important;
                break-after: auto !important;
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

          {/* Screen Only: Logo / Plain Print Switcher Toolbar */}
          <div className="flex items-center justify-between w-full max-w-[297mm] mx-auto mb-4 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 print:hidden">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Letterhead Mode:</span>
              <button
                type="button"
                onClick={() => setIncludeLogo(true)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  includeLogo ? 'bg-primary text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Official Logo Print
              </button>
              <button
                type="button"
                onClick={() => setIncludeLogo(false)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  !includeLogo ? 'bg-primary text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                Plain Schedule (No Logo)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Landscape Patient Schedule · Monday–Sunday Calendar View (A4 Landscape)
            </span>
          </div>

          {pages.map((weeksForPage, pageIdx) => {
            const rowsOnThisPage = weeksForPage.length;
            const cellHeightClass =
              rowsOnThisPage >= 3
                ? 'min-h-[72px] h-[72px]'
                : rowsOnThisPage === 2
                ? 'min-h-[96px] h-[96px]'
                : 'min-h-[110px] h-[110px]';

            const cellInnerMinHeight =
              rowsOnThisPage >= 3 ? 'min-h-[66px]' : rowsOnThisPage === 2 ? 'min-h-[88px]' : 'min-h-[100px]';

            return (
              <A4Sheet
                key={`takeaway-page-${pageIdx}`}
                className="a4-landscape-page mb-8 print:mb-0 w-full max-w-[297mm] min-h-[210mm] bg-white text-slate-900 shadow-sm border border-slate-200 overflow-hidden"
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
                      {includeLogo && !hideHeader && (
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
                {/* Monday to Sunday 7-Column Calendar Grid Tables — Top-aligned directly beneath header */}
                <div className="w-full px-6 sm:px-8 print:px-8 space-y-2 mt-1.5 mb-auto">
                  {weeksForPage.map((week, wIdx) => (
                    <table
                      key={`week-${wIdx}`}
                      className="w-full border-collapse border border-black table-fixed text-[8px] print:text-[7.5px] print-calendar-table"
                      style={{ borderCollapse: 'collapse', border: '1.5px solid #000000' }}
                    >
                      <thead>
                        <tr className="bg-slate-100 text-black border-b border-black">
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Monday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Tuesday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Wednesday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Thursday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Friday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Saturday
                          </th>
                          <th className="border border-black py-0.5 px-1 text-center font-bold w-[14.28%] text-slate-900">
                            Sunday
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {week.map((cell, cIdx) => {
                            if (cell.isPadding || !cell.day) {
                              return (
                                <td
                                  key={`pad-${cIdx}`}
                                  className={`border border-black bg-slate-50/40 p-1 align-top box-border ${cellHeightClass}`}
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
                                className={`border border-black p-1 align-top text-black box-border ${cellHeightClass} ${
                                  isTrigger
                                    ? 'bg-amber-50/40'
                                    : isOpu
                                    ? 'bg-rose-50/40'
                                    : 'bg-white'
                                }`}
                              >
                                <div className={`flex flex-col justify-between h-full pb-0.5 ${cellInnerMinHeight}`}>
                                  <div>
                                    {/* Cell Header: Date (Day - X) */}
                                    <div className="font-extrabold text-[8px] border-b border-black pb-0.5 mb-1 text-slate-900 flex items-center justify-between">
                                      <span>{formatDateLabel(day)}</span>
                                      <span>(Day - {day.stim_day_number || day.day_number})</span>
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
                      </tbody>
                    </table>
                  ))}
                </div>
              </A4Sheet>
            );
          })}
        </div>
      )}
    </PrintableModal>
  );
}
