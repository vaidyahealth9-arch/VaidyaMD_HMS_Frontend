'use client';



import React from 'react';

import { formatDate } from '@/lib/utils';

import PrintableModal from './PrintableModal';

import PrintableReportHeader, { resolveLogoUrl } from './PrintableReportHeader';

import PrintableReportFooter from './PrintableReportFooter';

import { useAuth } from '@/contexts/AuthContext';



interface MedRow {

  drug: string;

  dose?: string;

  route?: string;

  freq?: string;

  duration?: string;

  instructions?: string;

}



interface PrescriptionProps {

  hospitalName?: string;

  hospitalSubtext?: string;

  patient: {

    name: string;

    vid?: string;

    mrn?: string;

    age?: number | string;

    gender?: string;

    phone?: string;

    blood_group?: string;

    address?: string;

  };

  doctor: {

    name: string;

    qualification?: string;

    specialization?: string;

    reg_number?: string;

    department?: string;

  };

  visitDate?: string;

  chiefComplaint?: string;

  hopi?: string;

  pastHistory?: string;

  examination?: string;

  vitals?: {

    bp?: string;

    pulse?: string;

    temp?: string;

    weight?: string;

    height?: string;

    bmi?: string;

    spo2?: string;

    rr?: string;

  };

  diagnosis?: string;

  differentialDiagnosis?: string;

  investigations?: string;

  medications: MedRow[];

  partnerMedications?: MedRow[];

  partnerName?: string;

  advice?: string;

  nextFollowUp?: string;

  printedByOperator?: string;

  onClose: () => void;

}



function MedTable({ medications, label }: { medications: MedRow[]; label: string }) {

  if (!medications || medications.length === 0) return null;

  return (

    <div className="space-y-1.5 break-inside-avoid">

      <div className="flex items-center justify-between pb-1" style={{ borderBottom: '1.5px solid #C29B7F' }}>

        <div className="flex items-center gap-2">

          <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem', color: '#4A2E2B', lineHeight: 1 }}>

            ℞

          </span>

          <h3 className="text-[10.5px] font-bold uppercase tracking-wider text-slate-800">{label}</h3>

        </div>

        <span className="text-[9px] font-semibold text-slate-500 uppercase">

          {medications.length} Item{medications.length > 1 ? 's' : ''}

        </span>

      </div>

      <table className="w-full text-left text-xs border-collapse print-table">

        <thead>

          <tr className="bg-slate-100/80 text-slate-600 font-bold text-[9px] uppercase tracking-wider" style={{ borderBottom: '1px solid #cbd5e1' }}>

            <th className="py-1 px-2 w-6 text-center">#</th>

            <th className="py-1 px-2">Medication / Generic Name</th>

            <th className="py-1 px-2 w-20">Dosage</th>

            <th className="py-1 px-2 w-24">Frequency</th>

            <th className="py-1 px-2 w-20">Duration</th>

            <th className="py-1 px-2">Instructions</th>

          </tr>

        </thead>

        <tbody>

          {medications.map((med, idx) => (

            <tr key={idx} className="border-b border-slate-200/80 hover:bg-slate-50/50 break-inside-avoid">

              <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>

              <td className="py-1.5 print:py-1 px-2 font-bold text-slate-900">{med.drug}</td>

              <td className="py-1.5 px-2 text-slate-700 font-medium">{med.dose || '1 tab'}</td>

              <td className="py-1.5 px-2 font-bold text-[#4A2E2B]">{med.freq || 'OD'}</td>

              <td className="py-1.5 px-2 text-slate-600">{med.duration || '—'}</td>

              <td className="py-1.5 px-2 text-slate-600 text-[10.5px] italic">{med.instructions || 'After food'}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}



/** Complete Clinical History & Findings Block — Pure Single Column Continuous Layout */

function ClinicalHistoryBlock({

  chiefComplaint,

  hopi,

  pastHistory,

  examination,

  diagnosis,

  differentialDiagnosis,

}: {

  chiefComplaint?: string;

  hopi?: string;

  pastHistory?: string;

  examination?: string;

  diagnosis?: string;

  differentialDiagnosis?: string;

}) {

  const hasAny = chiefComplaint || hopi || pastHistory || examination || diagnosis || differentialDiagnosis;

  if (!hasAny) return null;



  return (

    <div className="space-y-2.5 w-full">

      {/* Chief Complaints — Single Column Full Width */}

      {chiefComplaint && (

        <div className="p-2 print:p-1.5 rounded-lg print:rounded bg-slate-50/80 border border-slate-200 break-inside-avoid">

          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">

            Chief Complaints

          </span>

          <p className="text-xs print:text-[11px] text-slate-900 font-medium whitespace-pre-line leading-relaxed print:leading-snug">{chiefComplaint}</p>

        </div>

      )}



      {/* History of Present Illness (HOPI) — Continuous Flow Across Pages */}

      {hopi && (

        <div

          className="p-2 print:p-1.5 rounded-lg print:rounded bg-slate-50/80 border border-slate-200"

          style={{ pageBreakInside: 'auto', breakInside: 'auto' }}

        >

          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">

            History of Present Illness (HOPI)

          </span>

          <div

            className="text-xs print:text-[11px] text-slate-800 whitespace-pre-line leading-relaxed print:leading-snug"

            style={{ pageBreakInside: 'auto', breakInside: 'auto' }}

          >

            {hopi}

          </div>

        </div>

      )}



      {/* Past Medical / Surgical / Obstetric History */}

      {pastHistory && (

        <div

          className="p-2 print:p-1.5 rounded-lg print:rounded bg-slate-50/80 border border-slate-200"

          style={{ pageBreakInside: 'auto', breakInside: 'auto' }}

        >

          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">

            Past Medical / Surgical / Obstetric History

          </span>

          <p className="text-xs print:text-[11px] text-slate-800 whitespace-pre-line leading-relaxed print:leading-snug">{pastHistory}</p>

        </div>

      )}



      {/* Clinical Examination Findings */}

      {examination && (

        <div

          className="p-2 print:p-1.5 rounded-lg print:rounded bg-slate-50/80 border border-slate-200"

          style={{ pageBreakInside: 'auto', breakInside: 'auto' }}

        >

          <span className="block text-[9px] font-bold uppercase tracking-wider text-[#4A2E2B] mb-0.5">

            Clinical &amp; Systemic Examination

          </span>

          <p className="text-xs print:text-[11px] text-slate-900 whitespace-pre-line leading-relaxed print:leading-snug">{examination}</p>

        </div>

      )}



      {/* Diagnosis Banner */}

      {(diagnosis || differentialDiagnosis) && (

        <div className="p-2 print:p-1.5 rounded-lg print:rounded bg-[#FAF5F2] border border-[#E8D7CC] break-inside-avoid">

          <div className="flex items-baseline gap-2">

            <span className="text-[9px] font-bold uppercase tracking-widest text-[#4A2E2B]">

              Diagnosis:

            </span>

            <span className="font-bold text-xs text-slate-900">{diagnosis || 'Fertility Review'}</span>

          </div>

          {differentialDiagnosis && (

            <p className="text-[10px] text-slate-600 mt-1">

              <strong className="text-slate-700">Differential Diagnosis:</strong> {differentialDiagnosis}

            </p>

          )}

        </div>

      )}

    </div>

  );

}



export default function PrintablePrescription({

  hospitalName,

  hospitalSubtext,

  patient,

  doctor,

  visitDate = new Date().toISOString().split('T')[0],

  chiefComplaint,

  hopi,

  pastHistory,

  examination,

  vitals,

  diagnosis,

  differentialDiagnosis,

  investigations,

  medications = [],

  partnerMedications = [],

  partnerName,

  advice,

  nextFollowUp,

  printedByOperator,

  onClose,

}: PrescriptionProps) {

  const [activeDoctor, setActiveDoctor] = React.useState(doctor);

  const { currentBranch, user: currentUser } = useAuth() || {};

  const isClinicianUser = Boolean(currentUser?.is_doctor || currentUser?.role === 'doctor' || currentUser?.role === 'consultant');
  const effectivePrintedBy = printedByOperator || (!isClinicianUser && currentUser?.name ? currentUser.name : undefined);

  const [realtimeDoctors, setRealtimeDoctors] = React.useState<any[]>([]);

  React.useEffect(() => {
    import('@/features/auth/api').then(({ authApi }) => {
      authApi.getDoctors().then((docs) => {
        if (Array.isArray(docs) && docs.length > 0) {
          setRealtimeDoctors(docs);
        }
      }).catch(() => {});
    });
  }, []);



  const effectiveWatermark = resolveLogoUrl(currentBranch?.receipt_header?.watermark_url);

  const effectiveOpacity = Number(currentBranch?.receipt_header?.watermark_opacity ?? 0.08);



  const hasClinicalData = Boolean(

    chiefComplaint || hopi || pastHistory || examination || diagnosis || differentialDiagnosis

  );

  const hasPrescriptionData = Boolean(

    medications.length > 0 || partnerMedications.length > 0 || investigations || advice || nextFollowUp

  );



  const documentTitle = hasClinicalData

    ? 'OUTPATIENT CONSULTATION & CLINICAL ASSESSMENT'

    : 'OUTPATIENT PRESCRIPTION';



  return (

    <PrintableModal

      isOpen={true}

      onClose={onClose}

      title="Prescription &amp; Consultation Preview"

      subtitle="Toggle header if printing on pre-printed clinic letterhead"

      maxWidth="max-w-4xl"

    >

      {({ hideHeader }: { hideHeader: boolean }) => {

        const customPadFooterMm = currentBranch?.receipt_header?.pad_footer_height_mm;

        const effectiveFooterHeight = customPadFooterMm

          ? `${customPadFooterMm}mm`

          : (hideHeader ? '42mm' : '32mm');



        return (

        <div className="space-y-3">

          {/* Dynamic Print Spacing Injection to enforce hospital footer height */}

          <style dangerouslySetInnerHTML={{ __html: `

            @media print {

              .print-footer-spacer {

                height: ${effectiveFooterHeight} !important;

                min-height: ${effectiveFooterHeight} !important;

              }

              .prescription-avoid-split {

                break-inside: avoid !important;

                page-break-inside: avoid !important;

              }

            }

          ` }} />

          {/* Doctor Switcher Toolbar (Screen Only, Hidden in Print) */}

          <div className="print:hidden p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-2xs">

            <div className="flex items-center gap-2">

              <span className="text-xs font-bold text-slate-700">Treating Doctor:</span>

              <select

                className="text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"

                value={activeDoctor.name}

                onChange={(e) => {

                  const val = e.target.value;

                  const matched = realtimeDoctors.find((d: any) => {

                    const docName = d.name.startsWith('Dr') ? d.name : `Dr. ${d.name}`;

                    return docName === val || d.id === val || d.name === val;

                  });

                  if (matched) {

                    setActiveDoctor({

                      name: matched.name.startsWith('Dr') ? matched.name : `Dr. ${matched.name}`,

                      qualification: matched.qualification || 'MBBS, MS, DNB',

                      specialization: matched.specialization || (matched.departments?.[0]) || 'Consultant Specialist',

                      reg_number: matched.reg_number || undefined,

                      department: matched.departments?.[0] || 'Outpatient Department',

                    });

                  } else {

                    setActiveDoctor(prev => ({ ...prev, name: val }));

                  }

                }}

              >

                <option value={activeDoctor.name}>{activeDoctor.name} (Current Treating Clinician)</option>

                {realtimeDoctors.map((doc: any) => {

                  const docDisplayName = doc.name.startsWith('Dr') ? doc.name : `Dr. ${doc.name}`;

                  if (docDisplayName === activeDoctor.name) return null;

                  return (

                    <option key={doc.id} value={docDisplayName}>

                      {docDisplayName} {doc.specialization ? `(${doc.specialization})` : ''}

                    </option>

                  );

                })}

              </select>

            </div>

            {effectivePrintedBy && (

              <span className="text-xs text-slate-700 font-semibold bg-white px-2.5 py-1 rounded border border-slate-300 shadow-2xs flex items-center gap-1.5">

                <span>🖨️ Desk Operator / Printed by:</span> <strong className="text-slate-900">{effectivePrintedBy}</strong>

              </span>

            )}

          </div>



          <div

            className="printable-document relative bg-white text-slate-900 text-xs w-full max-w-[210mm] min-h-[297mm] mx-auto my-6 shadow-2xl rounded-sm border border-slate-300 print:border-none print:my-0 print:shadow-none print:max-w-none print:w-full print:min-h-0 print:m-0 print:p-0 flex flex-col justify-between overflow-hidden print:overflow-visible"

          style={{ fontFamily: 'Inter, Arial, sans-serif', ['--print-footer-height' as any]: effectiveFooterHeight }}

        >

          {/* Centered Watermark Background (Repeats on every printed page via position: fixed) */}

          {!hideHeader && effectiveWatermark && (

            <div

              className="print-watermark-fixed pointer-events-none select-none"

              aria-hidden="true"

            >

              <img

                src={effectiveWatermark}

                alt=""

                className="w-[280px] sm:w-[350px] max-h-[350px] object-contain"

                style={{ opacity: effectiveOpacity }}

              />

            </div>

          )}



          {/* ── Continuous Print Layout Table Architecture ── */}

          <table className="print-layout-table w-full">

            {/* ── Table Header: Repeats automatically on top of EVERY printed page ── */}

            <thead>

              <tr>

                <th className="p-0 m-0 border-none font-normal text-left">

                  <PrintableReportHeader

                    title={documentTitle}

                    subtitle={activeDoctor.department || 'Reproductive Medicine & Infertility'}

                    hospitalName={hospitalName}

                    hospitalSubtext={hospitalSubtext}

                    hideHospitalHeader={hideHeader}

                    extraHeaderRight={

                      <div className="text-right flex-shrink-0">

                        <span

                          style={{

                            fontFamily: 'Georgia, serif',

                            fontStyle: 'italic',

                            fontSize: '1.8rem',

                            color: '#4A2E2B',

                            lineHeight: 1,

                          }}

                        >

                          ℞

                        </span>

                        <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 text-slate-400">

                          {hasClinicalData ? 'Clinical Record' : 'Outpatient Rx'}

                        </p>

                      </div>

                    }

                  />

                </th>

              </tr>

            </thead>



            {/* ── Table Footer: Reserves space at bottom of EVERY page so content never collides with fixed footer ── */}

            <tfoot>

              <tr>

                <td className="p-0 m-0 border-none">

                  <div

                    className="print-footer-spacer"

                    style={{ height: effectiveFooterHeight, minHeight: effectiveFooterHeight }}

                  />

                </td>

              </tr>

            </tfoot>



            {/* ── Table Body: Content flows continuously across pages without clipping or skipping ── */}

            <tbody>

              <tr>

                <td className="p-0 m-0 border-none">

                  <div className="px-6 sm:px-8 print:px-[12mm] py-2 space-y-2.5">

                    {/* Patient & Consultation Details Strip */}

                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 break-inside-avoid">

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

                        <div>

                          <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                            Patient Name

                          </span>

                          <span className="font-bold text-xs text-slate-900">{patient.name}</span>

                        </div>

                        <div>

                          <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                            Patient ID / MRN

                          </span>

                          <span className="font-bold text-xs font-mono text-[#4A2E2B]">

                            {patient.vid || patient.mrn || '—'}

                          </span>

                        </div>

                        <div>

                          <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                            Age / Gender

                          </span>

                          <span className="font-bold text-xs text-slate-900">

                            {patient.age ? patient.age + 'y' : '—'} / {patient.gender || '—'}

                          </span>

                        </div>

                        <div>

                          <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                            Visit Date

                          </span>

                          <span className="font-bold text-xs text-slate-900">{formatDate(visitDate)}</span>

                        </div>

                        {(patient.blood_group || patient.phone) && (

                          <>

                            <div>

                              <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                                Blood Group

                              </span>

                              <span className="font-bold text-xs text-slate-900">

                                {patient.blood_group || '—'}

                              </span>

                            </div>

                            <div>

                              <span className="block text-[9px] font-bold uppercase tracking-wider mb-0.5 text-slate-400">

                                Phone

                              </span>

                              <span className="font-mono text-xs text-slate-800">

                                {patient.phone || '—'}

                              </span>

                            </div>

                          </>

                        )}

                      </div>



                      {/* Treating Doctor Details Strip (Directly under patient info) */}

                      {activeDoctor.name && (

                        <div className="mt-2 pt-2 border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">

                          <div className="flex items-center gap-1.5 flex-wrap">

                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">

                              Treating Doctor:

                            </span>

                            <span className="font-bold text-slate-900">

                              {activeDoctor.name.startsWith('Dr') ? activeDoctor.name : `Dr. ${activeDoctor.name}`}

                            </span>

                            {activeDoctor.qualification && (

                              <span className="text-[10px] text-slate-600 font-medium">

                                ({activeDoctor.qualification})

                              </span>

                            )}

                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">

                            {(activeDoctor.specialization || activeDoctor.department) && (

                              <span>{activeDoctor.specialization || activeDoctor.department}</span>

                            )}

                            {activeDoctor.reg_number && (

                              <span className="font-mono text-slate-400">· Reg. No: {activeDoctor.reg_number}</span>

                            )}

                          </div>

                        </div>

                      )}

                    </div>



                    {/* Vitals Summary Bar */}

                    {vitals && Object.values(vitals).some(Boolean) && (

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 rounded-lg bg-sky-50/80 border border-sky-200 text-[10px] break-inside-avoid">

                        <span className="font-bold text-[9px] uppercase tracking-wider text-sky-900">

                          Vitals:

                        </span>

                        {vitals.bp && (

                          <span>

                            BP: <strong className="text-slate-900">{vitals.bp} mmHg</strong>

                          </span>

                        )}

                        {vitals.pulse && (

                          <span>

                            Pulse: <strong className="text-slate-900">{vitals.pulse} bpm</strong>

                          </span>

                        )}

                        {vitals.weight && (

                          <span>

                            Weight: <strong className="text-slate-900">{vitals.weight} kg</strong>

                          </span>

                        )}

                        {vitals.height && (

                          <span>

                            Height: <strong className="text-slate-900">{vitals.height} cm</strong>

                          </span>

                        )}

                        {vitals.bmi && (

                          <span>

                            BMI: <strong className="text-slate-900">{vitals.bmi}</strong>

                          </span>

                        )}

                        {vitals.temp && (

                          <span>

                            Temp: <strong className="text-slate-900">{vitals.temp} °F</strong>

                          </span>

                        )}

                        {vitals.spo2 && (

                          <span>

                            SpO2: <strong className="text-slate-900">{vitals.spo2}%</strong>

                          </span>

                        )}

                        {vitals.rr && (

                          <span>

                            RR: <strong className="text-slate-900">{vitals.rr}</strong>

                          </span>

                        )}

                      </div>

                    )}



                    {/* Complete Clinical Assessment (Single Column Continuous Flow) */}

                    <ClinicalHistoryBlock

                      chiefComplaint={chiefComplaint}

                      hopi={hopi}

                      pastHistory={pastHistory}

                      examination={examination}

                      diagnosis={diagnosis}

                      differentialDiagnosis={differentialDiagnosis}

                    />



                    {/* Prescription Section Header (When medications or advice exist) */}

                    {hasPrescriptionData && (

                      <div className="pt-3 pb-1 border-b-2 border-[#C29B7F] flex items-center justify-between break-inside-avoid">

                        <div className="flex items-center gap-2">

                          <span

                            style={{

                              fontFamily: 'Georgia, serif',

                              fontStyle: 'italic',

                              fontSize: '1.35rem',

                              color: '#4A2E2B',

                              lineHeight: 1,

                            }}

                          >

                            ℞

                          </span>

                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">

                            Outpatient Prescription &amp; Treatment Orders

                          </h3>

                        </div>

                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">

                          Rx Orders

                        </span>

                      </div>

                    )}



                    {/* Primary Patient Medications */}

                    {medications.length > 0 && (

                      <MedTable

                        medications={medications}

                        label={`Prescription Medications — ${patient.name}`}

                      />

                    )}



                    {/* Partner Medications if present */}

                    {partnerMedications.length > 0 && (

                      <div className="pt-1">

                        <MedTable

                          medications={partnerMedications}

                          label={`Partner Prescription — ${partnerName || 'Spouse / Partner'}`}

                        />

                      </div>

                    )}



                    {/* Advised Investigations */}

                    {investigations && (

                      <div className="space-y-1 rounded-lg p-2.5 bg-slate-50/80 border border-slate-200 break-inside-avoid">

                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-[#4A2E2B]">

                          Advised Investigations &amp; Diagnostic Orders

                        </h4>

                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-800 font-mono">

                          {investigations}

                        </p>

                      </div>

                    )}



                    {/* Clinical Advice */}

                    {advice && (

                      <div className="space-y-1 rounded-lg p-2.5 bg-slate-50/80 border border-slate-200 break-inside-avoid">

                        <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-600">

                          Clinical Advice, Diet &amp; Instructions

                        </h4>

                        <p className="text-xs leading-relaxed whitespace-pre-line text-slate-700">

                          {advice}

                        </p>

                      </div>

                    )}



                    {/* Bottom Summary & Clinician Signature Block — Strictly kept together to avoid orphan pages */}

                    <div className="pt-3 print:pt-2 mt-auto flex items-end justify-between gap-4 prescription-avoid-split" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>

                      {/* Left: Next Review & Front desk audit notice */}

                      <div className="space-y-1">

                        {nextFollowUp && (

                          <div className="inline-block px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200">

                            <span className="block text-[8.5px] font-bold uppercase tracking-wide text-sky-900">

                              Next Review / Follow-Up

                            </span>

                            <strong className="text-xs print:text-[11px] text-sky-950">{nextFollowUp}</strong>

                          </div>

                        )}

                        {effectivePrintedBy && (

                          <p className="text-[9.5px] text-slate-600 font-medium pt-1">

                            <span className="inline-block px-2 py-0.5 rounded bg-slate-50 border border-slate-200">

                              Printed at Front Desk by: <strong className="text-slate-800">{effectivePrintedBy}</strong>

                            </span>

                          </p>

                        )}

                      </div>



                      {/* Right: Treating Doctor Signature Box */}

                      <div className="text-center min-w-[200px] shrink-0">

                        <div className="h-6 print:h-4" />

                        <div className="border-t border-slate-400 pt-1 space-y-0.5">

                          <p className="font-bold text-xs print:text-[11px] text-slate-900 leading-tight">

                            {activeDoctor.name ? (activeDoctor.name.startsWith('Dr') ? activeDoctor.name : `Dr. ${activeDoctor.name}`) : 'Treating Doctor Signature'}

                          </p>

                          {activeDoctor.qualification && (

                            <p className="text-[10px] print:text-[9.5px] text-slate-700 font-semibold leading-tight">{activeDoctor.qualification}</p>

                          )}

                          {(activeDoctor.specialization || activeDoctor.department) && (

                            <p className="text-[9.5px] print:text-[9px] text-slate-600 leading-tight">

                              {activeDoctor.specialization || activeDoctor.department}

                            </p>

                          )}

                          {activeDoctor.reg_number && (

                            <p className="text-[9px] print:text-[8.5px] text-slate-400 font-mono">Reg. No: {activeDoctor.reg_number}</p>

                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </td>

              </tr>

            </tbody>

          </table>



          {/* ── Fixed Footer for Print (Repeats on EVERY printed page at bottom 0) ── */}

          <div className="print-footer-fixed">

            <PrintableReportFooter

              signatoryTitle={

                activeDoctor.name

                  ? activeDoctor.name.startsWith('Dr')

                    ? activeDoctor.name

                    : `Dr. ${activeDoctor.name}`

                  : 'Treating Consultant'

              }

              signatoryQualification={activeDoctor.qualification}

              signatorySubtitle={

                [activeDoctor.specialization || activeDoctor.department, activeDoctor.reg_number ? `Reg. No: ${activeDoctor.reg_number}` : ''].filter(Boolean).join(' · ') ||

                'Authorized Medical Practitioner'

              }

              showSignatory={false}

              showComputerGeneratedNotice={true}

              disclaimer={effectivePrintedBy ? `Certified computer-generated prescription. Printed at Front Desk by: ${effectivePrintedBy}` : undefined}

              hideHospitalFooter={hideHeader}

            />

          </div>

        </div>

        </div>

        );

      }}

    </PrintableModal>

  );

}

