import React, { useState } from 'react';
import { Calendar as CalendarIcon, Table as TableIcon } from 'lucide-react';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { parseFollicleTokens } from './StimulationCalendarGrid';

export interface PrintableStimulationSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  effectiveModality: string;
  effectivePatient: any;
  effectiveDoctor: any;
  effectiveCycleCode: string;
  startDate?: string;
  sentinelDates?: any;
  follicleSummary: {
    hasData: boolean;
    dayNumber?: number;
    totalCount: number;
    matureCount: number;
    intermediateCount: number;
    smallCount: number;
    leadFollicle: number;
    triggerReady: boolean;
  };
  maxE2: number;
  isHighOhssRisk: boolean;
  isModerateOhssRisk: boolean;
  weekPages: any[][];
  dayPages: any[][];
  printDrugColumns: string[];
}

export default function PrintableStimulationSheetModal({
  isOpen,
  onClose,
  effectiveModality,
  effectivePatient,
  effectiveDoctor,
  effectiveCycleCode,
  startDate,
  sentinelDates,
  follicleSummary,
  maxE2,
  isHighOhssRisk,
  isModerateOhssRisk,
  weekPages,
  dayPages,
  printDrugColumns,
}: PrintableStimulationSheetModalProps) {
  const [printLayoutMode, setPrintLayoutMode] = useState<'calendar' | 'matrix'>('calendar');

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ovarian Stimulation Protocol Sheet"
      subtitle="Official Controlled Ovarian Stimulation & Folliculometry Clinical Record"
      maxWidth="max-w-5xl"
    >
            {({ hideHeader }: { hideHeader: boolean }) => (
              <div className="w-full flex flex-col items-center">
                {/* Print View Mode Switcher Toolbar (Screen only) */}
                <div className="flex flex-wrap items-center justify-between w-full max-w-[210mm] mx-auto mb-4 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 print:hidden">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300">Select Print Layout:</span>
                    <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                      <button
                        type="button"
                        onClick={() => setPrintLayoutMode('calendar')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          printLayoutMode === 'calendar'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>7-Day Calendar Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintLayoutMode('matrix')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                          printLayoutMode === 'matrix'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <TableIcon className="w-3.5 h-3.5" />
                        <span>Spreadsheet Matrix Table</span>
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 hidden sm:block">
                    {printLayoutMode === 'calendar'
                      ? 'Weekly 7-day grid view with medication boxes & scan tags'
                      : 'High-density multi-parameter tabular matrix'}
                  </div>
                </div>

                {/* VIEW 1: 7-DAY CALENDAR GRID PRINT PAGES */}
                {printLayoutMode === 'calendar' ? (
                  weekPages.map((weeksForPage, pageIdx) => (
                    <A4Sheet
                      key={`cal-page-${pageIdx}`}
                      className="mb-8 print:mb-0"
                      header={
                        <PrintableReportHeader
                          title="CONTROLLED OVARIAN STIMULATION PROTOCOL"
                          subtitle={`${effectiveModality} · Weekly Medication & Scan Calendar`}
                          badge="OVARIAN STIMULATION SHEET"
                          department="Reproductive Medicine & Infertility"
                          hideHospitalHeader={hideHeader}
                          patient={{
                            name: effectivePatient?.name || effectivePatient?.full_name || 'Patient Record',
                            vid: effectivePatient?.vid || effectivePatient?.mrn || 'N/A',
                            age: effectivePatient?.age ? Number(effectivePatient?.age) : undefined,
                            gender: effectivePatient?.gender || 'Female',
                            phone: effectivePatient?.phone || effectivePatient?.mobile,
                            partner_name: effectivePatient?.partner_name,
                            partner_age: effectivePatient?.partner_age,
                          }}
                          doctor={{
                            name: effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist',
                            qualification: effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
                            reg_number: effectiveDoctor?.reg_number || effectiveDoctor?.registration_number,
                            department: 'Reproductive Medicine & Infertility',
                          }}
                          metaFields={[
                            { label: 'Cycle ID', value: effectiveCycleCode },
                            { label: 'Treatment Modality', value: effectiveModality },
                            { label: 'Stim Start Date', value: startDate || sentinelDates?.stim_start || 'Day 1' },
                            { label: 'Est. Trigger Date', value: sentinelDates?.trigger || 'Pending Evaluation' },
                            { label: 'Est. OPU Retrieval', value: sentinelDates?.opu || sentinelDates?.insemination || 'Pending Trigger' },
                          ]}
                        />
                      }
                      footer={
                        <PrintableReportFooter
                          signatoryName={effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist'}
                          signatoryQualification={effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine'}
                          signatoryTitle="Consultant Gynecologist & ART Specialist"
                          showSignatory={true}
                          pageNumber={pageIdx + 1}
                          totalPages={weekPages.length}
                          hideHospitalFooter={hideHeader}
                        />
                      }
                    >
                      {/* Clinical Summary Bar on Page 1 */}
                      {pageIdx === 0 && (
                        <div className="mb-3 p-2 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-3 gap-2 text-[9px]">
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Follicular Cohort (Latest)
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              Total: {follicleSummary.totalCount} | Mature (≥18mm):{' '}
                              <span className="text-emerald-700">{follicleSummary.matureCount}</span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              14–17mm: {follicleSummary.intermediateCount} · &lt;14mm: {follicleSummary.smallCount}
                            </div>
                          </div>
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Trigger Readiness
                            </div>
                            <div className="font-bold mt-0.5">
                              <span
                                className={
                                  follicleSummary.triggerReady
                                    ? 'text-emerald-700 font-extrabold'
                                    : 'text-amber-700'
                                }
                              >
                                {follicleSummary.triggerReady ? '✓ Trigger Criteria Met' : 'Stimulation Ongoing'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Est. Trigger: {sentinelDates?.trigger || 'Pending Evaluation'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              OHSS Safety Assessment
                            </div>
                            <div className="font-bold mt-0.5">
                              Peak E2: {maxE2 ? `${maxE2} pg/mL` : '—'} ·{' '}
                              <span
                                className={
                                  isHighOhssRisk
                                    ? 'text-rose-700'
                                    : isModerateOhssRisk
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }
                              >
                                {isHighOhssRisk ? 'High Risk' : isModerateOhssRisk ? 'Moderate Risk' : 'Low Risk'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              {isHighOhssRisk
                                ? 'Decapeptyl Trigger / Freeze-all recommended'
                                : 'Standard gonadotropin stimulation protocol'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 7-Day Weeks */}
                      <div className="space-y-3">
                        {weeksForPage.map((week, wIdx) => {
                          const weekNumber = pageIdx * 2 + wIdx + 1;
                          return (
                            <div key={wIdx} className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                              {/* Week Header */}
                              <div className="bg-slate-100 border-b border-slate-300 px-3 py-1 flex items-center justify-between text-[10px] font-bold text-slate-800">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                  <span>Week {weekNumber}</span>
                                  <span className="text-slate-500 font-normal">
                                    (Days {week[0]?.day_number} – {week[week.length - 1]?.day_number})
                                  </span>
                                </span>
                                <span className="text-[8.5px] text-slate-500 font-medium">
                                  {week[0]?.display_date} to {week[week.length - 1]?.display_date}
                                </span>
                              </div>

                              {/* 7 Columns */}
                              <div className="grid grid-cols-7 divide-x divide-slate-300">
                                {week.map((day: any) => {
                                  const rFollicles = parseFollicleTokens(day.right_follicles);
                                  const lFollicles = parseFollicleTokens(day.left_follicles);
                                  const hasScan = Boolean(
                                    day.right_follicles || day.left_follicles || day.endometrium_mm || day.e2_pgml
                                  );
                                  const isMilestone = Boolean(day.milestone);
                                  const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                                  const isOpu = day.milestone?.toLowerCase().includes('opu');

                                  return (
                                    <div
                                      key={day.day_number}
                                      className={`p-1.5 flex flex-col justify-between min-h-[140px] text-[8.5px] ${
                                        isTrigger
                                          ? 'bg-amber-50/60'
                                          : isOpu
                                          ? 'bg-rose-50/60'
                                          : isMilestone
                                          ? 'bg-primary/5'
                                          : 'bg-white'
                                      }`}
                                    >
                                      <div>
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1">
                                          <span className="font-extrabold text-slate-900 text-[9px]">
                                            Day {day.day_number}
                                          </span>
                                          <span className="text-[7.5px] font-semibold text-slate-500 uppercase">
                                            {day.day_of_week?.slice(0, 3)}
                                          </span>
                                        </div>
                                        <div className="text-[7.5px] text-slate-400 mb-1">
                                          {day.display_date?.split(' ').slice(0, 2).join(' ')}
                                        </div>

                                        {day.milestone && (
                                          <div className="mb-1">
                                            <span className="inline-block text-[7px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 leading-tight w-full truncate text-center">
                                              {day.milestone}
                                            </span>
                                          </div>
                                        )}

                                        <div className="space-y-0.5">
                                          {day.medications && day.medications.length > 0 ? (
                                            day.medications.map((m: any, mIdx: number) => (
                                              <div
                                                key={mIdx}
                                                className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[7.5px] leading-tight"
                                              >
                                                <div className="font-bold text-slate-900 truncate" title={m.drug_name}>
                                                  {m.drug_name.split('(')[0].trim()}
                                                </div>
                                                <div className="text-primary font-extrabold text-[7.5px]">
                                                  {m.dose}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-slate-300 italic text-[7.5px] py-1 text-center">
                                              —
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="mt-1 pt-1 border-t border-slate-200 text-[7px] space-y-0.5">
                                        {hasScan ? (
                                          <>
                                            {day.endometrium_mm && (
                                              <div className="font-bold text-emerald-800 flex justify-between">
                                                <span>Endo:</span>
                                                <span>{day.endometrium_mm}mm</span>
                                              </div>
                                            )}
                                            {(rFollicles.tokens.length > 0 || lFollicles.tokens.length > 0) && (
                                              <div className="leading-tight text-slate-700">
                                                {rFollicles.tokens.length > 0 && (
                                                  <div className="truncate">
                                                    <span className="font-bold text-rose-700">R:</span>{' '}
                                                    {rFollicles.tokens.map((t: any) => `${t.mm}`).join(', ')}
                                                  </div>
                                                )}
                                                {lFollicles.tokens.length > 0 && (
                                                  <div className="truncate">
                                                    <span className="font-bold text-rose-700">L:</span>{' '}
                                                    {lFollicles.tokens.map((t: any) => `${t.mm}`).join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {day.e2_pgml && (
                                              <div className="text-amber-800 font-bold truncate">
                                                E2: {day.e2_pgml} pg
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="text-slate-300 text-[7px] text-center">—</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </A4Sheet>
                  ))
                ) : (
                  /* VIEW 2: SPREADSHEET MATRIX TABLE PRINT PAGES */
                  dayPages.map((daysForPage, pageIdx) => (
                    <A4Sheet
                      key={`matrix-page-${pageIdx}`}
                      className="mb-8 print:mb-0"
                      header={
                        <PrintableReportHeader
                          title="CONTROLLED OVARIAN STIMULATION PROTOCOL"
                          subtitle={`${effectiveModality} · Clinical Medication & Folliculometry Matrix`}
                          badge="OVARIAN STIMULATION SHEET"
                          department="Reproductive Medicine & Infertility"
                          hideHospitalHeader={hideHeader}
                          patient={{
                            name: effectivePatient?.name || effectivePatient?.full_name || 'Patient Record',
                            vid: effectivePatient?.vid || effectivePatient?.mrn || 'N/A',
                            age: effectivePatient?.age ? Number(effectivePatient?.age) : undefined,
                            gender: effectivePatient?.gender || 'Female',
                            phone: effectivePatient?.phone || effectivePatient?.mobile,
                            partner_name: effectivePatient?.partner_name,
                            partner_age: effectivePatient?.partner_age,
                          }}
                          doctor={{
                            name: effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist',
                            qualification: effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine',
                            reg_number: effectiveDoctor?.reg_number || effectiveDoctor?.registration_number,
                            department: 'Reproductive Medicine & Infertility',
                          }}
                          metaFields={[
                            { label: 'Cycle ID', value: effectiveCycleCode },
                            { label: 'Treatment Modality', value: effectiveModality },
                            { label: 'Stim Start Date', value: startDate || sentinelDates?.stim_start || 'Day 1' },
                            { label: 'Est. Trigger Date', value: sentinelDates?.trigger || 'Pending Evaluation' },
                            { label: 'Est. OPU Retrieval', value: sentinelDates?.opu || sentinelDates?.insemination || 'Pending Trigger' },
                          ]}
                        />
                      }
                      footer={
                        <PrintableReportFooter
                          signatoryName={effectiveDoctor?.name || 'Dr. Reproductive Medicine Specialist'}
                          signatoryQualification={effectiveDoctor?.qualification || 'MBBS, MS (OBG), Fellowship in Reproductive Medicine'}
                          signatoryTitle="Consultant Gynecologist & ART Specialist"
                          showSignatory={true}
                          pageNumber={pageIdx + 1}
                          totalPages={dayPages.length}
                          hideHospitalFooter={hideHeader}
                        />
                      }
                    >
                      {/* Clinical Summary Bar on Page 1 */}
                      {pageIdx === 0 && (
                        <div className="mb-3 p-2 bg-slate-50 border border-slate-300 rounded-lg grid grid-cols-3 gap-2 text-[9px]">
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Follicular Cohort (Latest)
                            </div>
                            <div className="font-bold text-slate-900 mt-0.5">
                              Total: {follicleSummary.totalCount} | Mature (≥18mm):{' '}
                              <span className="text-emerald-700">{follicleSummary.matureCount}</span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              14–17mm: {follicleSummary.intermediateCount} · &lt;14mm: {follicleSummary.smallCount}
                            </div>
                          </div>
                          <div className="border-r border-slate-200 pr-2">
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              Trigger Readiness
                            </div>
                            <div className="font-bold mt-0.5">
                              <span
                                className={
                                  follicleSummary.triggerReady
                                    ? 'text-emerald-700 font-extrabold'
                                    : 'text-amber-700'
                                }
                              >
                                {follicleSummary.triggerReady ? '✓ Trigger Criteria Met' : 'Stimulation Ongoing'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Est. Trigger: {sentinelDates?.trigger || 'Pending Evaluation'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              OHSS Safety Assessment
                            </div>
                            <div className="font-bold mt-0.5">
                              Peak E2: {maxE2 ? `${maxE2} pg/mL` : '—'} ·{' '}
                              <span
                                className={
                                  isHighOhssRisk
                                    ? 'text-rose-700'
                                    : isModerateOhssRisk
                                    ? 'text-amber-700'
                                    : 'text-emerald-700'
                                }
                              >
                                {isHighOhssRisk ? 'High Risk' : isModerateOhssRisk ? 'Moderate Risk' : 'Low Risk'}
                              </span>
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              {isHighOhssRisk
                                ? 'Decapeptyl Trigger / Freeze-all recommended'
                                : 'Standard gonadotropin stimulation protocol'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Matrix Table */}
                      <div className="my-1 border border-slate-300 rounded-lg overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-[8px]">
                          <thead>
                            <tr className="bg-slate-200/90 text-slate-800 font-extrabold uppercase text-[7.5px] border-b border-slate-300">
                              <th colSpan={2} className="p-1.5 border-r border-slate-300">
                                Timeline &amp; Milestones
                              </th>
                              <th
                                colSpan={printDrugColumns.length}
                                className="p-1.5 border-r border-slate-300 bg-primary/10 text-primary text-center"
                              >
                                Prescribed Medications &amp; Dosages
                              </th>
                              <th
                                colSpan={3}
                                className="p-1.5 border-r border-slate-300 bg-rose-50 text-rose-900 text-center"
                              >
                                Folliculometry &amp; Endometrium
                              </th>
                              <th colSpan={2} className="p-1.5 bg-amber-50 text-amber-900 text-center">
                                Serum Hormones
                              </th>
                            </tr>
                            <tr className="bg-slate-100 text-slate-800 font-bold text-[7.5px] border-b border-slate-300">
                              <th className="p-1 border-r border-slate-300 min-w-[65px]">Day / Date</th>
                              <th className="p-1 border-r border-slate-300 min-w-[85px]">Milestone</th>
                              {printDrugColumns.map((drug) => (
                                <th
                                  key={drug}
                                  className="p-1 border-r border-slate-300 text-center min-w-[65px] truncate max-w-[95px]"
                                  title={drug}
                                >
                                  {drug.split('(')[0].trim()}
                                </th>
                              ))}
                              <th className="p-1 border-r border-slate-300 text-center min-w-[60px]">R. Ovary (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[60px]">L. Ovary (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[50px]">Endo (mm)</th>
                              <th className="p-1 border-r border-slate-300 text-center min-w-[50px]">E2 (pg/mL)</th>
                              <th className="p-1 text-center min-w-[50px]">P4 (ng/mL)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {daysForPage.map((day, rowIdx) => {
                              const isTrigger = day.milestone?.toLowerCase().includes('trigger');
                              const isOpu = day.milestone?.toLowerCase().includes('opu');

                              return (
                                <tr
                                  key={day.day_number}
                                  className={`${
                                    isTrigger
                                      ? 'bg-amber-50/70 font-bold'
                                      : isOpu
                                      ? 'bg-rose-50/70 font-bold'
                                      : rowIdx % 2 === 0
                                      ? 'bg-white'
                                      : 'bg-slate-50/80'
                                  }`}
                                >
                                  <td className="p-1 border-r border-slate-300 font-bold text-slate-900 whitespace-nowrap">
                                    Day {day.day_number}{' '}
                                    <span className="text-[7px] font-normal text-slate-500">
                                      ({day.display_date?.split(' ').slice(0, 2).join(' ')}, {day.day_of_week?.slice(0, 3)})
                                    </span>
                                  </td>
                                  <td className="p-1 border-r border-slate-300">
                                    {day.milestone ? (
                                      <span className="inline-block text-[7px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 truncate max-w-[95px]">
                                        {day.milestone}
                                      </span>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  {printDrugColumns.map((drug) => {
                                    const med = day.medications?.find((m: any) => m.drug_name === drug);
                                    const dose = med?.dose;
                                    return (
                                      <td
                                        key={drug}
                                        className="p-1 border-r border-slate-300 text-center font-bold text-slate-900"
                                      >
                                        {dose ? (
                                          <span className="text-primary font-extrabold">{dose}</span>
                                        ) : (
                                          <span className="text-slate-300 font-normal">—</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  <td className="p-1 border-r border-slate-300 text-center font-medium">
                                    {day.right_follicles || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-medium">
                                    {day.left_follicles || <span className="text-slate-300">—</span>}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-bold text-emerald-800">
                                    {day.endometrium_mm ? (
                                      `${day.endometrium_mm} mm`
                                    ) : (
                                      <span className="text-slate-300 font-normal">—</span>
                                    )}
                                  </td>
                                  <td className="p-1 border-r border-slate-300 text-center font-bold text-amber-800">
                                    {day.e2_pgml || <span className="text-slate-300 font-normal">—</span>}
                                  </td>
                                  <td className="p-1 text-center font-bold text-amber-800">
                                    {day.p4_ngml || <span className="text-slate-300 font-normal">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </A4Sheet>
                  ))
                )}
              </div>
            )}
    </PrintableModal>
  );
}
