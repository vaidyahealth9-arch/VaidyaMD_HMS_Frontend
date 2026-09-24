'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';

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
  onClose: () => void;
}

function MedTable({ medications, label }: { medications: MedRow[]; label: string }) {
  if (!medications || medications.length === 0) return null;
  return (
    <div className="space-y-1.5 page-break-avoid">
      <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#0B4F6C' }}>℞</span>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">{label}</h3>
      </div>
      <table className="w-full text-left text-xs border-collapse print-table">
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th className="py-1.5 px-2 w-6">#</th>
            <th className="py-1.5 px-2">Medication / Generic Name</th>
            <th className="py-1.5 px-2">Dosage</th>
            <th className="py-1.5 px-2">Frequency</th>
            <th className="py-1.5 px-2">Duration</th>
            <th className="py-1.5 px-2">Instructions</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((med, idx) => (
            <tr key={idx} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
              <td className="py-1.5 px-2 text-slate-400">{idx + 1}</td>
              <td className="py-1.5 px-2 font-semibold text-slate-900">{med.drug}</td>
              <td className="py-1.5 px-2 text-slate-700">{med.dose || '1 tab'}</td>
              <td className="py-1.5 px-2 font-semibold text-[#0B4F6C]">{med.freq || 'OD'}</td>
              <td className="py-1.5 px-2 text-slate-600">{med.duration || '—'}</td>
              <td className="py-1.5 px-2 italic text-slate-500 text-[10px]">{med.instructions || 'After food'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Complete Clinical History & Findings Block */
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
    <div className="space-y-2">
      {/* Chief Complaints */}
      {chiefComplaint && (
        <div className="p-2 rounded-md bg-slate-50 border border-slate-200">
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
            Chief Complaints
          </span>
          <p className="text-xs text-slate-900 font-medium whitespace-pre-line">{chiefComplaint}</p>
        </div>
      )}

      {/* History of Present Illness (HOPI) & Past History */}
      {(hopi || pastHistory) && (
        <div className={`grid ${hopi && pastHistory ? 'grid-cols-2 gap-3' : 'grid-cols-1'} gap-2`}>
          {hopi && (
            <div className="p-2 rounded-md bg-slate-50/80 border border-slate-200">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                History of Present Illness (HOPI)
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">{hopi}</p>
            </div>
          )}
          {pastHistory && (
            <div className="p-2 rounded-md bg-slate-50/80 border border-slate-200">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Past Medical / Surgical / Obstetric History
              </span>
              <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">{pastHistory}</p>
            </div>
          )}
        </div>
      )}

      {/* Clinical Examination Findings */}
      {examination && (
        <div className="p-2 rounded-md bg-slate-50/80 border border-slate-200">
          <span className="block text-[9px] font-bold uppercase tracking-wider text-[#0B4F6C] mb-0.5">
            Clinical &amp; Systemic Examination
          </span>
          <p className="text-xs text-slate-900 whitespace-pre-line leading-relaxed">{examination}</p>
        </div>
      )}

      {/* Diagnosis Banner */}
      {(diagnosis || differentialDiagnosis) && (
        <div className="p-2.5 rounded-md bg-[#F0F9FF] border border-[#BAE6FD]">
          <div className="flex items-baseline gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#0B4F6C]">
              Diagnosis:
            </span>
            <span className="font-bold text-xs text-slate-900">{diagnosis || 'Fertility Review'}</span>
          </div>
          {differentialDiagnosis && (
            <p className="text-[10px] text-slate-600 mt-0.5">
              <strong>Differential Diagnosis:</strong> {differentialDiagnosis}
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
  onClose,
}: PrescriptionProps) {
  const hasHistory = Boolean(hopi || pastHistory);
  const hasExam = Boolean(examination);
  const hasOrders = Boolean(investigations);
  const hasAdvice = Boolean(advice);
  const hasPartner = partnerMedications && partnerMedications.length > 0;
  const numMeds = medications.length;

  // Decide multi-page layout based on complete clinical dataset
  const isMultiPage =
    hasPartner ||
    numMeds > 4 ||
    (hasHistory && hasExam) ||
    ((hasHistory || hasExam) && (numMeds > 2 || hasOrders || hasAdvice)) ||
    (numMeds > 2 && hasOrders && hasAdvice);

  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title="Prescription Print Preview"
      subtitle="Toggle header if printing on pre-printed clinic letterhead"
      maxWidth="max-w-3xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) =>
        isMultiPage ? (
          <>
            {/* ── Page 1: Clinical Assessment & Primary Prescription ── */}
            <A4Sheet
              header={
                <PrintableReportHeader
                  title="OUTPATIENT CONSULTATION & CLINICAL ASSESSMENT"
                  subtitle={doctor.department || 'Reproductive Medicine & ART'}
                  hospitalName={hospitalName}
                  hospitalSubtext={hospitalSubtext}
                  hideHospitalHeader={hideHeader}
                  extraHeaderRight={
                    <div className="text-right flex-shrink-0">
                      <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '2rem', color: '#0B4F6C', lineHeight: 1 }}>℞</span>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 text-gray-400">Page 1 / 2</p>
                    </div>
                  }
                />
              }
              footer={
                <PrintableReportFooter
                  signatoryTitle={doctor.name ? (doctor.name.startsWith('Dr') ? doctor.name : `Dr. ${doctor.name}`) : 'Treating Consultant'}
                  signatorySubtitle="Authorized Medical Practitioner"
                  showSignatory={false}
                  showComputerGeneratedNotice={true}
                  hideHospitalFooter={hideHeader}
                  pageNumber={1}
                  totalPages={2}
                />
              }
            >
              <div className="px-6 sm:px-8 print:px-[12mm] py-2 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Doctor Demographics */}
                  {!hideHeader && doctor.name && (
                    <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{doctor.name}</p>
                        {doctor.qualification && <p className="text-[10px] text-[#1A6E8E]">{doctor.qualification}</p>}
                      </div>
                      <div className="text-right">
                        {doctor.reg_number && <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Reg. No: {doctor.reg_number}</p>}
                        {doctor.department && <p className="text-[10px] text-slate-700">{doctor.department}</p>}
                      </div>
                    </div>
                  )}

                  {/* Patient Details Strip */}
                  <div className="grid grid-cols-4 gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200">
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Patient Name</span>
                      <span className="font-semibold text-xs text-slate-900">{patient.name}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Patient ID</span>
                      <span className="font-semibold text-xs font-mono text-[#0B4F6C]">{patient.vid || patient.mrn || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Age / Gender</span>
                      <span className="font-semibold text-xs text-slate-900">{patient.age ? patient.age + 'y' : '—'} / {patient.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Date</span>
                      <span className="font-semibold text-xs text-slate-900">{formatDate(visitDate)}</span>
                    </div>
                    {(patient.blood_group || patient.phone) && (
                      <>
                        <div>
                          <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Blood Group</span>
                          <span className="font-semibold text-xs text-slate-900">{patient.blood_group || '—'}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Phone</span>
                          <span className="font-mono text-xs text-slate-800">{patient.phone || '—'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vitals Summary Bar */}
                  {vitals && Object.values(vitals).some(Boolean) && (
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-1.5 rounded-md bg-sky-50 border border-sky-200 text-[10px]">
                      <span className="font-bold text-[9px] uppercase tracking-wider text-sky-800">Vitals:</span>
                      {vitals.bp && <span>BP: <strong className="text-sky-950">{vitals.bp} mmHg</strong></span>}
                      {vitals.pulse && <span>Pulse: <strong className="text-sky-950">{vitals.pulse} bpm</strong></span>}
                      {vitals.weight && <span>Weight: <strong className="text-sky-950">{vitals.weight} kg</strong></span>}
                      {vitals.height && <span>Height: <strong className="text-sky-950">{vitals.height} cm</strong></span>}
                      {vitals.bmi && <span>BMI: <strong className="text-sky-950">{vitals.bmi}</strong></span>}
                      {vitals.temp && <span>Temp: <strong className="text-sky-950">{vitals.temp} °F</strong></span>}
                      {vitals.spo2 && <span>SpO2: <strong className="text-sky-950">{vitals.spo2}%</strong></span>}
                      {vitals.rr && <span>RR: <strong className="text-sky-950">{vitals.rr}</strong></span>}
                    </div>
                  )}

                  {/* Complete Clinical Assessment: Complaints, History, Exam & Diagnosis */}
                  <ClinicalHistoryBlock
                    chiefComplaint={chiefComplaint}
                    hopi={hopi}
                    pastHistory={pastHistory}
                    examination={examination}
                    diagnosis={diagnosis}
                    differentialDiagnosis={differentialDiagnosis}
                  />

                  {/* Primary Patient Medications */}
                  {medications.length > 0 && (
                    <div className="pt-1">
                      <MedTable medications={medications} label={`Prescription Medications — ${patient.name}`} />
                    </div>
                  )}
                </div>
              </div>
            </A4Sheet>

            {/* ── Page 2: Orders, Advice & Doctor Signatory Block ── */}
            <A4Sheet
              header={
                <PrintableReportHeader
                  title="OUTPATIENT PRESCRIPTION — ORDERS & ADVICE"
                  subtitle={doctor.department || 'Reproductive Medicine & ART'}
                  hospitalName={hospitalName}
                  hospitalSubtext={hospitalSubtext}
                  hideHospitalHeader={hideHeader}
                  extraHeaderRight={
                    <div className="text-right flex-shrink-0">
                      <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '2rem', color: '#0B4F6C', lineHeight: 1 }}>℞</span>
                      <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 text-gray-400">Page 2 / 2</p>
                    </div>
                  }
                />
              }
              footer={
                <PrintableReportFooter
                  signatoryTitle={doctor.name ? (doctor.name.startsWith('Dr') ? doctor.name : `Dr. ${doctor.name}`) : 'Treating Consultant'}
                  signatorySubtitle="Authorized Medical Practitioner"
                  showSignatory={true}
                  showComputerGeneratedNotice={true}
                  hideHospitalFooter={hideHeader}
                  pageNumber={2}
                  totalPages={2}
                />
              }
            >
              <div className="px-6 sm:px-8 print:px-[12mm] py-3 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Patient Identifier Mini-Strip for Continuation Page */}
                  <div className="flex items-center justify-between text-[10px] px-3 py-1.5 bg-slate-50 rounded border border-slate-200">
                    <span>
                      Patient: <strong className="text-slate-900">{patient.name}</strong> ({patient.vid || patient.mrn || '—'})
                    </span>
                    <span>
                      Date: <strong className="text-slate-900">{formatDate(visitDate)}</strong>
                    </span>
                    <span>
                      Doctor: <strong className="text-slate-900">{doctor.name}</strong>
                    </span>
                  </div>

                  {/* Partner Prescription if present */}
                  {partnerMedications.length > 0 && (
                    <MedTable
                      medications={partnerMedications}
                      label={`Partner Prescription — ${partnerName || 'Spouse / Partner'}`}
                    />
                  )}

                  {/* Advised Investigations */}
                  {investigations && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 pb-0.5">
                        <h4 className="text-[9px] font-semibold uppercase tracking-widest text-[#0B4F6C]">
                          Advised Investigations &amp; Diagnostic Orders
                        </h4>
                      </div>
                      <p className="text-[10px] leading-relaxed whitespace-pre-line p-2.5 rounded-md font-mono bg-slate-50 border border-slate-200 text-slate-800">
                        {investigations}
                      </p>
                    </div>
                  )}

                  {/* Clinical Advice */}
                  {advice && (
                    <div className="space-y-1">
                      <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                        Clinical Advice, Diet &amp; Instructions
                      </h4>
                      <p className="text-[10px] leading-relaxed whitespace-pre-line p-2.5 rounded-md bg-slate-50/80 border border-slate-200 text-slate-700">
                        {advice}
                      </p>
                    </div>
                  )}

                  {/* Next Review / Follow-Up */}
                  {nextFollowUp && (
                    <div className="inline-block px-3 py-1.5 rounded-md bg-[#D1ECF7] border border-[#1A6E8E]">
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-[#0B4F6C]">
                        Next Review / Follow-Up
                      </span>
                      <strong className="text-xs text-[#083348]">{nextFollowUp}</strong>
                    </div>
                  )}
                </div>

                {/* Doctor Signatory Box */}
                <div className="pt-4 flex justify-end">
                  <div className="text-center min-w-[200px]">
                    <div className="h-10" />
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-bold text-xs text-slate-900">{doctor.name}</p>
                      {doctor.qualification && <p className="text-[10px] text-[#1A6E8E]">{doctor.qualification}</p>}
                      {doctor.reg_number && <p className="text-[9px] text-slate-500">Reg. No: {doctor.reg_number}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </A4Sheet>
          </>
        ) : (
          /* ── Single Page Outpatient Prescription ── */
          <A4Sheet
            header={
              <PrintableReportHeader
                title="OUTPATIENT PRESCRIPTION"
                subtitle={doctor.department || 'Reproductive Medicine & ART'}
                hospitalName={hospitalName}
                hospitalSubtext={hospitalSubtext}
                hideHospitalHeader={hideHeader}
                extraHeaderRight={
                  <div className="text-right flex-shrink-0">
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '2rem', color: '#0B4F6C', lineHeight: 1 }}>℞</span>
                    <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 text-gray-400">Outpatient Rx</p>
                  </div>
                }
              />
            }
            footer={
              <PrintableReportFooter
                signatoryTitle={doctor.name ? (doctor.name.startsWith('Dr') ? doctor.name : `Dr. ${doctor.name}`) : 'Treating Consultant'}
                signatorySubtitle="Authorized Medical Practitioner"
                showSignatory={true}
                showComputerGeneratedNotice={true}
                hideHospitalFooter={hideHeader}
                pageNumber={1}
                totalPages={1}
              />
            }
          >
            <div className="px-6 sm:px-8 print:px-[12mm] py-2 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Doctor Demographics (When header is not hidden) */}
                {!hideHeader && doctor.name && (
                  <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{doctor.name}</p>
                      {doctor.qualification && <p className="text-[10px] text-[#1A6E8E]">{doctor.qualification}</p>}
                    </div>
                    <div className="text-right">
                      {doctor.reg_number && <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Reg. No: {doctor.reg_number}</p>}
                      {doctor.department && <p className="text-[10px] text-slate-700">{doctor.department}</p>}
                    </div>
                  </div>
                )}

                {/* Patient Strip */}
                <div className="grid grid-cols-4 gap-2.5 p-2.5 rounded-md bg-slate-50 border border-slate-200">
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Patient Name</span>
                    <span className="font-semibold text-xs text-slate-900">{patient.name}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Patient ID</span>
                    <span className="font-semibold text-xs font-mono text-[#0B4F6C]">{patient.vid || patient.mrn || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Age / Gender</span>
                    <span className="font-semibold text-xs text-slate-900">{patient.age ? patient.age + 'y' : '—'} / {patient.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Date</span>
                    <span className="font-semibold text-xs text-slate-900">{formatDate(visitDate)}</span>
                  </div>
                  {(patient.blood_group || patient.phone) && (
                    <>
                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Blood Group</span>
                        <span className="font-semibold text-xs text-slate-900">{patient.blood_group || '—'}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400">Phone</span>
                        <span className="font-mono text-xs text-slate-800">{patient.phone || '—'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Vitals Bar */}
                {vitals && Object.values(vitals).some(Boolean) && (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-1.5 rounded-md bg-sky-50 border border-sky-200 text-[10px]">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-sky-800">Vitals:</span>
                    {vitals.bp && <span>BP: <strong className="text-sky-950">{vitals.bp} mmHg</strong></span>}
                    {vitals.pulse && <span>Pulse: <strong className="text-sky-950">{vitals.pulse} bpm</strong></span>}
                    {vitals.weight && <span>Weight: <strong className="text-sky-950">{vitals.weight} kg</strong></span>}
                    {vitals.height && <span>Height: <strong className="text-sky-950">{vitals.height} cm</strong></span>}
                    {vitals.bmi && <span>BMI: <strong className="text-sky-950">{vitals.bmi}</strong></span>}
                    {vitals.temp && <span>Temp: <strong className="text-sky-950">{vitals.temp} °F</strong></span>}
                    {vitals.spo2 && <span>SpO2: <strong className="text-sky-950">{vitals.spo2}%</strong></span>}
                    {vitals.rr && <span>RR: <strong className="text-sky-950">{vitals.rr}</strong></span>}
                  </div>
                )}

                {/* Complete Clinical Assessment: Complaints, History, Exam & Diagnosis */}
                <ClinicalHistoryBlock
                  chiefComplaint={chiefComplaint}
                  hopi={hopi}
                  pastHistory={pastHistory}
                  examination={examination}
                  diagnosis={diagnosis}
                  differentialDiagnosis={differentialDiagnosis}
                />

                {/* Rx Medications */}
                {medications.length > 0 && (
                  <MedTable medications={medications} label={`Prescription — ${patient.name}`} />
                )}

                {/* Partner Medications */}
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
                  <div className="space-y-1 pt-1">
                    <h4 className="text-[9px] font-semibold uppercase tracking-widest text-[#0B4F6C]">Investigations</h4>
                    <p className="text-[10px] leading-relaxed whitespace-pre-line p-2 rounded-md font-mono bg-slate-50 border border-slate-200 text-slate-800">
                      {investigations}
                    </p>
                  </div>
                )}

                {/* Advice */}
                {advice && (
                  <div className="space-y-1 pt-1">
                    <h4 className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">Clinical Advice &amp; Instructions</h4>
                    <p className="text-[10px] leading-relaxed whitespace-pre-line p-2 rounded-md bg-slate-50/80 border border-slate-200 text-slate-700">
                      {advice}
                    </p>
                  </div>
                )}

                {/* Next Follow-Up Banner */}
                {nextFollowUp && (
                  <div className="inline-block px-3 py-1.5 rounded-md bg-[#D1ECF7] border border-[#1A6E8E]">
                    <span className="block text-[9px] font-semibold uppercase tracking-wide text-[#0B4F6C]">Next Review / Follow-Up</span>
                    <strong className="text-xs text-[#083348]">{nextFollowUp}</strong>
                  </div>
                )}
              </div>

              {/* Doctor Signatory Box for Single Page */}
              <div className="pt-2 flex justify-end">
                <div className="text-center min-w-[180px]">
                  <div className="h-8" />
                  <div className="border-t border-slate-400 pt-1">
                    <p className="font-bold text-xs text-slate-900">{doctor.name}</p>
                    {doctor.qualification && <p className="text-[10px] text-[#1A6E8E]">{doctor.qualification}</p>}
                    {doctor.reg_number && <p className="text-[9px] text-slate-500">Reg. No: {doctor.reg_number}</p>}
                  </div>
                </div>
              </div>
            </div>
          </A4Sheet>
        )
      }
    </PrintableModal>
  );
}
