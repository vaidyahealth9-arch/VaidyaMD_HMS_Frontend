'use client';

import React, { useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

interface MedRow { drug: string; dose?: string; route?: string; freq?: string; duration?: string; instructions?: string; }

interface PrescriptionProps {
  hospitalName?: string;
  hospitalSubtext?: string;
  patient: { name: string; vid?: string; mrn?: string; age?: number | string; gender?: string; phone?: string; blood_group?: string; address?: string; };
  doctor: { name: string; qualification?: string; reg_number?: string; department?: string; };
  visitDate?: string;
  chiefComplaint?: string;
  hopi?: string;
  pastHistory?: string;
  vitals?: { bp?: string; pulse?: string; temp?: string; weight?: string; spo2?: string; };
  diagnosis?: string;
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
        <span style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontStyle: 'italic', fontSize: '1.1rem', color: '#0B4F6C' }}>℞</span>
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
  hospitalName = 'VaidyaMD Fertility & ART Hospital',
  hospitalSubtext = 'Centre for Reproductive Medicine & Advanced IVF · Reg No: TS/MED/2024/09812',
  patient,
  doctor,
  visitDate = new Date().toISOString().split('T')[0],
  chiefComplaint,
  hopi,
  pastHistory,
  vitals,
  diagnosis,
  medications = [],
  partnerMedications = [],
  partnerName,
  advice,
  nextFollowUp,
  onClose,
}: PrescriptionProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-start pt-20 sm:pt-24 pb-8 px-4 overflow-y-auto print:p-0 print:static print:bg-white"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div className="bg-white max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-auto sm:my-0 rounded-lg print:shadow-none print:rounded-none print:m-0 print:max-w-full border border-slate-200">

        {/* Preview toolbar — hidden in print */}
        <div className="flex items-center justify-between px-5 py-3 print:hidden"
          style={{ background: 'rgb(var(--clr-rail-bg))', color: 'white' }}>
          <div>
            <p className="text-sm font-semibold">Prescription Preview</p>
            <p className="text-xs opacity-50 mt-0.5">Review before printing or sending</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: 'rgb(var(--clr-primary))', color: 'white' }}
            >
              <Printer className="w-3.5 h-3.5" />
              Print (A4)
            </button>
            <button onClick={onClose} className="p-1 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Printable Document Sheet ── */}
        <div className="p-8 space-y-5 printable-document print:p-6" style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', color: '#111827' }}>

          {/* Hospital Header */}
          <div className="flex items-start justify-between pb-3" style={{ borderBottom: '1.5px solid #0B4F6C' }}>
            <div className="flex items-center gap-3">
              {/* Logo box — square, tight */}
              <div className="w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0"
                style={{ background: '#0B4F6C' }}>
                <img src="/logo.svg" alt="VM" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight" style={{ color: '#0B4F6C', fontFamily: 'Inter, Arial, sans-serif' }}>
                  {hospitalName}
                </h1>
                <p className="text-[10px] mt-0.5" style={{ color: '#4b5563' }}>{hospitalSubtext}</p>
                <p className="text-[9px] mt-0.5" style={{ color: '#9ca3af' }}>
                  Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033 · +91 40 4888 9999 · care@vaidyamd.com
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span style={{ fontFamily: 'var(--font-instrument-serif, Georgia, serif)', fontStyle: 'italic', fontSize: '2rem', color: '#0B4F6C', lineHeight: 1 }}>℞</span>
              <p className="text-[9px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#9ca3af' }}>Outpatient Rx</p>
            </div>
          </div>

          {/* Doctor Demographics */}
          <div className="flex justify-between items-center py-2" style={{ borderBottom: '0.5px solid #e5e7eb' }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: '#111827' }}>{doctor.name || 'Treating Consultant'}</p>
              <p className="text-[10px]" style={{ color: '#1A6E8E' }}>{doctor.qualification || 'MBBS, MS (OBG), DRM (Germany) · Senior Fertility Specialist'}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#9ca3af' }}>Reg. No: {doctor.reg_number || 'TSMC/2016/54210'}</p>
              <p className="text-[10px]" style={{ color: '#374151' }}>{doctor.department || 'Reproductive Medicine & ART'}</p>
            </div>
          </div>

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
          </div>

          {/* Clinical Findings */}
          {(vitals || chiefComplaint || diagnosis) && (
            <div className="p-3 rounded-md space-y-1.5" style={{ background: '#F7F8FA', border: '0.5px solid #E3E8EE' }}>
              {vitals && (vitals.bp || vitals.weight || vitals.pulse) && (
                <div className="flex gap-4 text-[10px]" style={{ color: '#374151' }}>
                  {vitals.bp     && <span><strong>BP:</strong> {vitals.bp} mmHg</span>}
                  {vitals.pulse  && <span><strong>Pulse:</strong> {vitals.pulse} bpm</span>}
                  {vitals.weight && <span><strong>Weight:</strong> {vitals.weight} kg</span>}
                  {vitals.spo2   && <span><strong>SpO₂:</strong> {vitals.spo2}%</span>}
                </div>
              )}
              {chiefComplaint && (
                <p className="text-[10px]"><strong style={{ color: '#111827' }}>Chief Complaints: </strong><span style={{ color: '#374151' }}>{chiefComplaint}</span></p>
              )}
              {diagnosis && (
                <p className="text-[10px]"><strong style={{ color: '#111827' }}>Provisional Diagnosis: </strong><span className="font-semibold" style={{ color: '#0B4F6C' }}>{diagnosis}</span></p>
              )}
            </div>
          )}

          {/* Primary Medications */}
          <MedTable
            medications={medications}
            label={partnerName ? `Medications for ${patient.name}` : 'Prescribed Medications'}
          />

          {/* Partner Medications */}
          {partnerMedications.length > 0 && (
            <div className="pt-3" style={{ borderTop: '0.5px solid #e5e7eb' }}>
              <MedTable medications={partnerMedications} label={`Medications for Partner (${partnerName || 'Spouse'})`} />
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

          {/* Footer — follow-up + signature */}
          <div className="pt-5 flex items-end justify-between page-break-avoid" style={{ borderTop: '1px solid #d1d5db' }}>
            <div>
              {nextFollowUp && (
                <div className="inline-block px-3 py-1.5 rounded-md mb-2" style={{ background: '#D1ECF7', border: '0.5px solid #1A6E8E' }}>
                  <span className="block text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#0B4F6C' }}>Next Review / Follow-Up</span>
                  <strong className="text-xs" style={{ color: '#083348' }}>{nextFollowUp}</strong>
                </div>
              )}
              <p className="text-[9px]" style={{ color: '#9ca3af' }}>
                * Bring this prescription on your next visit. For emergencies, contact the hospital emergency desk immediately.
              </p>
            </div>
            <div className="text-right">
              <div className="h-10" />
              <div className="pt-1" style={{ borderTop: '0.5px solid #6b7280' }}>
                <p className="font-semibold text-xs" style={{ color: '#111827' }}>{doctor.name || 'Doctor Signature'}</p>
                <p className="text-[9px]" style={{ color: '#6b7280' }}>Authorized Signatory</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
