'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

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
  medications: Array<{
    drug: string;
    dose?: string;
    route?: string;
    freq?: string;
    duration?: string;
    instructions?: string;
  }>;
  partnerMedications?: Array<{
    drug: string;
    dose?: string;
    route?: string;
    freq?: string;
    duration?: string;
    instructions?: string;
  }>;
  partnerName?: string;
  advice?: string;
  nextFollowUp?: string;
  onClose: () => void;
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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:shadow-none print:border-none print:m-0 print:max-w-full">
        {/* Action Header (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">🩺</span>
            <div>
              <h2 className="text-sm font-black">Official Medical Prescription (Rx)</h2>
              <p className="text-[11px] text-slate-400">Preview before sending to patient or printing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Prescription (A4)</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 space-y-6 text-slate-800 text-xs printable-sheet print:p-6 print:m-0">
          {/* Hospital Header */}
          <div className="flex items-start justify-between border-b-2 border-indigo-900 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white font-black text-xl flex items-center justify-center shadow-md">
                VM
              </div>
              <div>
                <h1 className="text-xl font-black text-indigo-950 tracking-tight">{hospitalName}</h1>
                <p className="text-[11px] text-slate-600 font-medium">{hospitalSubtext}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033 · Phone: +91 40 4888 9999 · Email: care@vaidyamd.com
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-2xl font-black text-indigo-900 italic font-serif">℞</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outpatient Rx</p>
            </div>
          </div>

          {/* Doctor Demographics */}
          <div className="flex justify-between items-center text-xs bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
            <div>
              <p className="font-black text-slate-900 text-sm">{doctor.name || 'Treating Consultant'}</p>
              <p className="text-[11px] text-indigo-800 font-medium">{doctor.qualification || 'MBBS, MS (OBG), DRM (Germany) · Senior Fertility Specialist'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Reg. No: {doctor.reg_number || 'TSMC/2016/54210'}</p>
              <p className="text-[11px] text-slate-700 font-semibold">{doctor.department || 'Reproductive Medicine & ART'}</p>
            </div>
          </div>

          {/* Patient Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient Name</span>
              <strong className="text-slate-900">{patient.name}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Patient ID / VID</span>
              <strong className="font-mono text-indigo-800">{patient.vid || patient.mrn || '—'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Age / Gender</span>
              <span className="font-semibold">{patient.age ? `${patient.age}y` : '—'} / {patient.gender || '—'}</span>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
              <strong className="text-slate-900">{formatDate(visitDate)}</strong>
            </div>
          </div>

          {/* Clinical Findings / Vitals Strip */}
          {(vitals || chiefComplaint || diagnosis) && (
            <div className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 space-y-1.5">
              {vitals && (vitals.bp || vitals.weight || vitals.pulse) && (
                <div className="flex gap-4 text-[11px] text-slate-700 font-medium">
                  {vitals.bp && <span><strong>BP:</strong> {vitals.bp} mmHg</span>}
                  {vitals.pulse && <span><strong>Pulse:</strong> {vitals.pulse} bpm</span>}
                  {vitals.weight && <span><strong>Weight:</strong> {vitals.weight} kg</span>}
                  {vitals.spo2 && <span><strong>SpO2:</strong> {vitals.spo2}%</span>}
                </div>
              )}
              {chiefComplaint && (
                <p className="text-xs">
                  <strong className="text-slate-900">Chief Complaints:</strong> <span className="text-slate-700">{chiefComplaint}</span>
                </p>
              )}
              {diagnosis && (
                <p className="text-xs">
                  <strong className="text-slate-900">Provisional Diagnosis:</strong> <span className="text-indigo-950 font-bold">{diagnosis}</span>
                </p>
              )}
            </div>
          )}

          {/* Primary Medications Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 border-b border-indigo-200 pb-1">
              <span className="font-serif italic font-black text-indigo-900 text-lg">℞</span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {partnerName ? `Medications for ${patient.name}` : 'Prescribed Medications'}
              </h3>
            </div>

            {medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No medications prescribed for this visit.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Medication / Generic</th>
                    <th className="py-2 px-2">Dosage</th>
                    <th className="py-2 px-2">Frequency</th>
                    <th className="py-2 px-2">Duration</th>
                    <th className="py-2 px-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medications.map((med, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 font-black text-slate-900">{med.drug}</td>
                      <td className="py-2 px-2 font-medium text-slate-700">{med.dose || '1 tab'}</td>
                      <td className="py-2 px-2 font-bold text-indigo-700">{med.freq || 'OD'}</td>
                      <td className="py-2 px-2 font-medium text-slate-600">{med.duration || '—'}</td>
                      <td className="py-2 px-2 text-slate-600 italic text-[11px]">{med.instructions || 'After food'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Partner Medications Table (If Couple Visit) */}
          {partnerMedications.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2 border-b border-blue-200 pb-1">
                <span className="font-serif italic font-black text-blue-900 text-lg">℞</span>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Medications for Partner ({partnerName || 'Spouse'})
                </h3>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-2 w-8">#</th>
                    <th className="py-2 px-2">Medication</th>
                    <th className="py-2 px-2">Dosage</th>
                    <th className="py-2 px-2">Frequency</th>
                    <th className="py-2 px-2">Duration</th>
                    <th className="py-2 px-2">Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partnerMedications.map((med, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-2 font-black text-slate-900">{med.drug}</td>
                      <td className="py-2 px-2 font-medium text-slate-700">{med.dose || '1 tab'}</td>
                      <td className="py-2 px-2 font-bold text-blue-700">{med.freq || 'OD'}</td>
                      <td className="py-2 px-2 font-medium text-slate-600">{med.duration || '—'}</td>
                      <td className="py-2 px-2 text-slate-600 italic text-[11px]">{med.instructions || 'After food'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Advice & Instructions */}
          {advice && (
            <div className="space-y-1 pt-3 border-t border-slate-200">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Clinical Advice & Instructions</h4>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {advice}
              </p>
            </div>
          )}

          {/* Next Review Date & Signatory Footer */}
          <div className="pt-6 border-t-2 border-slate-200 flex items-end justify-between">
            <div>
              {nextFollowUp && (
                <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs inline-block">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase block">Next Review / Follow-Up</span>
                  <strong className="text-indigo-950 font-bold">{nextFollowUp}</strong>
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-3">
                * Please bring this prescription on your next visit. In case of emergency or severe pain, contact the hospital emergency desk immediately.
              </p>
            </div>

            <div className="text-right">
              <div className="h-12 flex items-end justify-end">
                <span className="font-serif italic text-sm text-slate-400 font-semibold">[Digital Signature Verified]</span>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-black text-slate-900 text-xs">{doctor.name || 'Doctor Signature'}</p>
                <p className="text-[10px] text-slate-500 font-medium">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
