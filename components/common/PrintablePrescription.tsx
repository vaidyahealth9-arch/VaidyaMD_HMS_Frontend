'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';

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
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    weight?: string;
    spo2?: string;
  };
  diagnosis?: string;
  investigations?: string;
  medications: MedRow[];
  partnerMedications?: MedRow[];
  partnerName?: string;
  advice?: string;
  nextFollowUp?: string;
  onClose: () => void;
}

function MedTable({ medications, label }: { medications: MedRow[]; label: string }) {
  if (!medications.length) return null;
  return (
    <div className="space-y-1.5 page-break-avoid">
      <div className="flex items-center gap-2 pb-1" style={{ borderBottom: '1px solid #d1d5db' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#0B4F6C' }}>℞</span>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#374151' }}>{label}</h3>
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
              <td className="py-1.5 px-2" style={{ color: '#9ca3af' }}>{idx + 1}</td>
              <td className="py-1.5 px-2 font-semibold" style={{ color: '#111827' }}>{med.drug}</td>
              <td className="py-1.5 px-2" style={{ color: '#374151' }}>{med.dose || '1 tab'}</td>
              <td className="py-1.5 px-2 font-semibold" style={{ color: '#0B4F6C' }}>{med.freq || 'OD'}</td>
              <td className="py-1.5 px-2" style={{ color: '#4b5563' }}>{med.duration || '—'}</td>
              <td className="py-1.5 px-2 italic" style={{ color: '#6b7280', fontSize: '10px' }}>{med.instructions || 'After food'}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
  vitals,
  diagnosis,
  investigations,
  medications = [],
  partnerMedications = [],
  partnerName,
  advice,
  nextFollowUp,
  onClose,
}: PrescriptionProps) {
  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title="Prescription Print Preview"
      subtitle="Toggle header if printing on pre-printed clinic letterhead"
      maxWidth="max-w-3xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <div className="space-y-5">
          {/* Dynamic Branch Header */}
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

          {/* Doctor Demographics (When header is not hidden) */}
          {!hideHeader && doctor.name && (
            <div className="flex justify-between items-center py-2" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#111827' }}>{doctor.name}</p>
                {doctor.qualification && <p className="text-[10px]" style={{ color: '#1A6E8E' }}>{doctor.qualification}</p>}
              </div>
              <div className="text-right">
                {doctor.reg_number && <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Reg. No: {doctor.reg_number}</p>}
                {doctor.department && <p className="text-[10px]" style={{ color: '#374151' }}>{doctor.department}</p>}
              </div>
            </div>
          )}

          {/* Patient Strip */}
          <div className="grid grid-cols-4 gap-3 p-3 rounded-md" style={{ background: '#F7F8FA', border: '0.5px solid #E3E8EE' }}>
            {[
              { label: 'Patient Name',   value: patient.name },
              { label: 'Patient ID',     value: patient.vid || patient.mrn || '—', mono: true },
              { label: 'Age / Gender',   value: `${patient.age ? patient.age + 'y' : '—'} / ${patient.gender || '—'}` },
              { label: 'Date',           value: formatDate(visitDate) },
            ].map(({ label, value, mono }) => (
              <div key={label}>
                <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>{label}</span>
                <span className={`font-semibold text-xs ${mono ? 'font-mono' : ''}`} style={{ color: mono ? '#0B4F6C' : '#111827' }}>{value}</span>
              </div>
            ))}
            {(patient.blood_group || patient.phone) && (
              <>
                {patient.blood_group && (
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Blood Group</span>
                    <span className="font-semibold text-xs" style={{ color: '#111827' }}>{patient.blood_group}</span>
                  </div>
                )}
                {patient.phone && (
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#9ca3af' }}>Phone</span>
                    <span className="font-mono text-xs" style={{ color: '#111827' }}>{patient.phone}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Vitals Bar */}
          {vitals && Object.values(vitals).some(Boolean) && (
            <div className="flex items-center gap-6 px-3 py-2 rounded-md" style={{ background: '#F0F9FF', border: '0.5px solid #BAE6FD', fontSize: '10px' }}>
              <span className="font-bold text-[9px] uppercase tracking-wider" style={{ color: '#0369A1' }}>Vitals:</span>
              {vitals.bp     && <span>BP: <strong style={{ color: '#0C4A6E' }}>{vitals.bp} mmHg</strong></span>}
              {vitals.pulse  && <span>Pulse: <strong style={{ color: '#0C4A6E' }}>{vitals.pulse} bpm</strong></span>}
              {vitals.weight && <span>Weight: <strong style={{ color: '#0C4A6E' }}>{vitals.weight} kg</strong></span>}
              {vitals.temp   && <span>Temp: <strong style={{ color: '#0C4A6E' }}>{vitals.temp} °F</strong></span>}
              {vitals.spo2   && <span>SpO2: <strong style={{ color: '#0C4A6E' }}>{vitals.spo2}%</strong></span>}
            </div>
          )}

          {/* Clinical Presentation: Complaints & History */}
          {(chiefComplaint || hopi || pastHistory) && (
            <div className="space-y-1.5 pt-1">
              {chiefComplaint && (
                <div>
                  <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: '#6b7280' }}>Chief Complaint: </span>
                  <span className="text-xs" style={{ color: '#111827' }}>{chiefComplaint}</span>
                </div>
              )}
              {hopi && (
                <div>
                  <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: '#6b7280' }}>HOPI / Clinical History: </span>
                  <div className="text-xs whitespace-pre-line mt-0.5" style={{ color: '#374151' }}>{hopi}</div>
                </div>
              )}
              {pastHistory && (
                <div>
                  <span className="font-semibold text-[10px] uppercase tracking-wider" style={{ color: '#6b7280' }}>Past Medical / Surgical History: </span>
                  <div className="text-xs whitespace-pre-line mt-0.5" style={{ color: '#374151' }}>{pastHistory}</div>
                </div>
              )}
            </div>
          )}

          {/* Provisional / Final Diagnosis */}
          {diagnosis && (
            <div className="p-2.5 rounded-md" style={{ background: '#F8FAFC', border: '0.5px solid #E2E8F0' }}>
              <span className="block text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#0B4F6C' }}>Diagnosis</span>
              <p className="font-semibold text-xs" style={{ color: '#0F172A' }}>{diagnosis}</p>
            </div>
          )}

          {/* Rx Medications — Female / Primary Patient */}
          <MedTable medications={medications} label={`Prescription — ${patient.name}`} />

          {/* Rx Medications — Male / Partner (Couples Protocol) */}
          {partnerMedications.length > 0 && (
            <div className="pt-2">
              <MedTable medications={partnerMedications} label={`Partner Prescription — ${partnerName || 'Spouse / Partner'}`} />
            </div>
          )}

          {/* Advised Investigations */}
          {investigations && (
            <div className="space-y-1.5 pt-3 page-break-avoid" style={{ borderTop: '0.5px solid #e5e7eb' }}>
              <div className="flex items-center gap-2 pb-0.5">
                <h4 className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#0B4F6C' }}>Investigations</h4>
              </div>
              <p className="text-[10px] leading-relaxed whitespace-pre-line p-2.5 rounded-md font-mono" style={{ background: '#F8FAFC', border: '0.5px solid #E2E8F0', color: '#1E293B' }}>
                {investigations}
              </p>
            </div>
          )}

          {/* Advice */}
          {advice && (
            <div className="space-y-1 pt-3 page-break-avoid" style={{ borderTop: '0.5px solid #e5e7eb' }}>
              <h4 className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>Clinical Advice & Instructions</h4>
              <p className="text-[10px] leading-relaxed whitespace-pre-line p-2.5 rounded-md" style={{ background: '#F7F8FA', border: '0.5px solid #E3E8EE', color: '#374151' }}>
                {advice}
              </p>
            </div>
          )}

          {/* Next Follow-Up Banner if present */}
          {nextFollowUp && (
            <div className="inline-block px-3 py-1.5 rounded-md" style={{ background: '#D1ECF7', border: '0.5px solid #1A6E8E' }}>
              <span className="block text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#0B4F6C' }}>Next Review / Follow-Up</span>
              <strong className="text-xs" style={{ color: '#083348' }}>{nextFollowUp}</strong>
            </div>
          )}

          {/* Dynamic Branch Footer with Doctor Signatory */}
          <PrintableReportFooter
            signatoryTitle={doctor.name ? (doctor.name.startsWith('Dr') ? doctor.name : `Dr. ${doctor.name}`) : 'Treating Consultant'}
            signatorySubtitle="Authorized Medical Practitioner"
            showSignatory={true}
            showComputerGeneratedNotice={true}
          />
        </div>
      )}
    </PrintableModal>
  );
}
