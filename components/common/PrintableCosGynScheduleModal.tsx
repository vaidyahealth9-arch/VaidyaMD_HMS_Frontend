'use client';

import React from 'react';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, Clock, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export interface CosGynScheduleSessionItem {
  id?: string;
  session_number: number;
  equipment: string;
  scheduled_datetime: string;
  duration_mins: number;
  status?: string;
  notes?: string;
}

export interface PrintableCosGynScheduleModalProps {
  patient: {
    name: string;
    vid?: string;
    mrn?: string;
    age?: number | string;
    gender?: string;
    phone?: string;
  };
  doctorName?: string;
  packageName: string;
  packagePrice?: number;
  sessions: CosGynScheduleSessionItem[];
  onClose: () => void;
}

export default function PrintableCosGynScheduleModal({
  patient,
  doctorName = 'Dr. Consultant Gynecologist & Aesthetic Specialist',
  packageName,
  packagePrice,
  sessions = [],
  onClose,
}: PrintableCosGynScheduleModalProps) {
  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) => {
    const da = new Date(a.scheduled_datetime).getTime();
    const db = new Date(b.scheduled_datetime).getTime();
    return da - db;
  });

  const jetPlasmaCount = sessions.filter((s) => s.equipment?.toLowerCase().includes('jet')).length;
  const teslaChairCount = sessions.filter((s) => s.equipment?.toLowerCase().includes('tesla')).length;
  const prpCount = sessions.filter((s) => s.equipment?.toLowerCase().includes('prp')).length;

  const formatSessionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '09:00 AM';
    }
  };

  const formatSessionDay = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title="Cosmetic Gynecology Schedule Preview"
      subtitle="Official patient appointment schedule card & procedure preparation guidelines"
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="COSMETIC GYNECOLOGY & PELVIC THERAPY SCHEDULE"
              badge="TREATMENT APPOINTMENT CARD"
              hideHospitalHeader={hideHeader}
              department="Aesthetic & Regenerative Gynecology Suite"
              patient={{
                name: patient.name,
                vid: patient.vid || patient.mrn,
                age: patient.age ? Number(patient.age) : undefined,
                gender: patient.gender || 'Female',
                phone: patient.phone,
              }}
            />
          }
          footer={
            <PrintableReportFooter
              hideHospitalFooter={hideHeader}
              pageNumber={1}
              totalPages={1}
            />
          }
        >
          {/* Schedule Content (Safe Inner Margins) */}
          <div className="px-6 sm:px-8 print:px-[12mm] py-3 space-y-4 flex-1">
            {/* Package Overview Card */}
          <div className="p-4 rounded-lg border border-pink-200 bg-pink-50/60 print:bg-pink-50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-pink-950">{packageName}</h3>
              </div>
              <p className="text-xs text-pink-800 mt-1 flex flex-wrap items-center gap-3">
                {jetPlasmaCount > 0 && <span className="font-semibold">⚡ Jet Plasma: {jetPlasmaCount} sessions</span>}
                {teslaChairCount > 0 && <span className="font-semibold">🪑 Tesla Chair: {teslaChairCount} sessions</span>}
                {prpCount > 0 && <span className="font-semibold">✨ PRP Therapy: {prpCount} sessions</span>}
                <span className="text-slate-500">· Total Sessions: {sessions.length}</span>
              </p>
            </div>
            {packagePrice !== undefined && packagePrice > 0 && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-pink-600 block">Total Package Fee</span>
                <span className="text-base font-extrabold text-pink-900 font-mono">{formatCurrency(packagePrice)}</span>
              </div>
            )}
          </div>

          {/* Sessions Schedule Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                <span>Allotted Procedure Appointments ({sessions.length} Sessions)</span>
              </h4>
              <span className="text-[10px] text-slate-400">Please arrive 10 minutes prior to scheduled session time</span>
            </div>

            <table className="w-full text-xs text-left border-collapse border border-slate-200 print-table">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-2.5 w-8">#</th>
                  <th className="py-2.5 px-3">Equipment / Procedure</th>
                  <th className="py-2.5 px-3">Scheduled Date</th>
                  <th className="py-2.5 px-3">Time &amp; Duration</th>
                  <th className="py-2.5 px-3">Preparation Guidelines</th>
                  <th className="py-2.5 px-2 text-center w-20">Clinic Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedSessions.map((s, idx) => {
                  const isTesla = s.equipment?.toLowerCase().includes('tesla');
                  const isJet = s.equipment?.toLowerCase().includes('jet');
                  const isPrp = s.equipment?.toLowerCase().includes('prp');

                  const prepAdvice = isTesla
                    ? 'Wear comfortable cotton clothing (no metal zippers/buttons). Empty bladder 15 mins prior.'
                    : isJet
                    ? 'Shower before visit. Follow post-procedure soothing cream advice. Avoid tight synthetics.'
                    : isPrp
                    ? 'Hydrate generously. Follow doctor medication advice before and after procedure.'
                    : 'Report on time to Cosmetic Gynecology Suite Room 2.';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 print:hover:bg-white">
                      <td className="py-2.5 px-2.5 font-mono text-slate-400 text-[11px] font-bold">
                        {s.session_number || idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{isTesla ? '🪑' : isJet ? '⚡' : isPrp ? '💉' : '✨'}</span>
                          <span className="font-bold text-slate-900">{s.equipment}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {formatSessionDay(s.scheduled_datetime)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                          <Clock className="w-3 h-3 text-pink-600" />
                          <span>{formatSessionTime(s.scheduled_datetime)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{s.duration_mins || 30} mins slot</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 leading-relaxed">
                        {prepAdvice}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="w-6 h-6 border-2 border-slate-300 rounded mx-auto flex items-center justify-center print:border-slate-400">
                          {s.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Important Patient Guidelines Banner */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1.5 print:bg-slate-50">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
              <span>Important Patient Care &amp; Rescheduling Policies:</span>
            </h5>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5 pl-1 leading-relaxed">
              <li>For any schedule modification, please inform the clinic at least 24 hours in advance.</li>
              <li>Consistency in therapy intervals optimizes pelvic floor muscle recruitment and tissue remodeling.</li>
              <li>Maintain regular hydration (2.5L daily) across your entire rejuvenation and rehabilitation protocol.</li>
            </ul>
          </div>

            {/* Signoff Strip */}
            <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200 text-xs">
              <div>
                <p className="font-bold text-slate-700">Patient Acknowledgement</p>
                <div className="h-12 border-b border-dashed border-slate-300 mt-2"></div>
                <p className="text-[10px] text-slate-400 mt-1">Signature of Patient / Guardian</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-700">{doctorName}</p>
                <div className="h-12 border-b border-dashed border-slate-300 mt-2"></div>
                <p className="text-[10px] text-slate-400 mt-1">Treating Aesthetic Gynecologist / Authorized Seal</p>
              </div>
            </div>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
