'use client';

import React from 'react';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';
import { Badge } from '@/shared/ui/badge';

export interface PrintableCounselingSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: any;
  patient?: any;
}

export default function PrintableCounselingSheetModal({
  isOpen,
  onClose,
  note,
  patient,
}: PrintableCounselingSheetModalProps) {
  if (!note) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const patientName = patient?.name || note.patient_name || 'Patient';
  const patientVid = patient?.vid || note.patient_vid || '—';
  const patientAge = patient?.age || note.patient_age;
  const counselorName = note.counselor_name || note.signature || 'ART Counselor Specialist';

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Counseling Sheet Preview"
      subtitle={`Pre-ART clinical counseling record for ${patientName}`}
      maxWidth="max-w-3xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="PRE-ART CLINICAL COUNSELING RECORD"
              department="Department of Reproductive Medicine & ART Counseling"
              subtitle="VaidyaMD Reproductive Medicine • Patient Counseling & Informed Dialogue"
              hideHospitalHeader={hideHeader}
              patient={{
                name: patientName,
                vid: patientVid,
                age: patientAge,
                gender: patient?.gender || 'Female',
                partner_name: patient?.partner_name || note.partner_name,
              }}
              metaFields={[
                { label: 'Planned Procedure', value: note.procedure || 'ART Counseling' },
                { label: 'Session Date', value: formatDate(note.created_at) },
                { label: 'Source', value: note.source || 'OPD Consultation' },
                { label: 'Counselor', value: counselorName },
              ]}
              extraHeaderRight={
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bold uppercase tracking-widest text-[#0B4F6C] border-[#0B4F6C]"
                  >
                    Pre-ART Counseling
                  </Badge>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">Date: {formatDate(note.created_at)}</p>
                </div>
              }
            />
          }
          footer={
            <PrintableReportFooter
              signatoryTitle={counselorName}
              signatorySubtitle="Authorized ART Counselor Signature"
              showSignatory={true}
              showComputerGeneratedNotice={true}
              hideHospitalFooter={hideHeader}
              pageNumber={1}
              totalPages={1}
            />
          }
        >
          {/* Counseling Content (Safe Inner Margins) */}
          <div className="px-6 sm:px-8 print:px-[12mm] py-3 space-y-4 flex-1">
            {/* Patient Context Banner */}
            <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</p>
                <p className="font-bold text-sm text-slate-900">{patientName}</p>
                <p className="font-mono text-xs text-slate-600">
                  VID: {patientVid} {patientAge ? `· Age: ${patientAge}y` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Planned Procedure</p>
                <p className="font-bold text-xs text-primary">{note.procedure || 'ART Counseling'}</p>
                <p className="text-[10px] text-slate-500">Source: {note.source || 'OPD'}</p>
              </div>
            </div>

            {/* 8 Formatted Clinical Counseling Rows Table */}
            <table className="w-full text-left text-xs border border-slate-200 border-collapse rounded-lg overflow-hidden">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 w-1/3 align-top">
                    1. Source &amp; Comments
                  </td>
                  <td className="p-2.5 text-slate-900">
                    <span className="font-semibold">{note.source || 'OP Consultation'}</span>
                    {note.comments && (
                      <p className="text-slate-600 text-[11px] mt-0.5 italic">{note.comments}</p>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    2. Procedure
                  </td>
                  <td className="p-2.5 font-bold text-primary">{note.procedure || '—'}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    3. Egg pick up (OPU)
                  </td>
                  <td className="p-2.5 text-slate-800 leading-relaxed whitespace-pre-line">
                    {note.egg_pick_up || '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    4. Discussion
                  </td>
                  <td className="p-2.5 text-slate-900 leading-relaxed font-medium whitespace-pre-line">
                    {note.discussion || '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    5. Laparoscopy / Hysteroscopy / etc
                  </td>
                  <td className="p-2.5 text-slate-800 leading-relaxed whitespace-pre-line">
                    {note.laparoscopy_hysteroscopy || '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    6. Egg transfer
                  </td>
                  <td className="p-2.5 text-slate-800 leading-relaxed whitespace-pre-line">
                    {note.egg_transfer || '—'}
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    7. Remarks
                  </td>
                  <td className="p-2.5 text-slate-800 leading-relaxed whitespace-pre-line">
                    {note.remarks || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-slate-600 bg-slate-50 align-top">
                    8. Counselor Sign-off
                  </td>
                  <td className="p-2.5 font-bold text-slate-900 font-mono">
                    {note.signature || note.counselor_name || 'Counselor Signed'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
