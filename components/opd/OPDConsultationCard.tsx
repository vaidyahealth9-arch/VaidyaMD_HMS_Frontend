'use client';

import React from 'react';
import { Clock, FileText, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime, safeString } from '@/lib/utils';

interface OPDConsultationCardProps {
  record: any;
  onViewRecord: (record: any) => void;
  onEditRecord: (record: any) => void;
  onPrintRecord: (record: any) => void;
  onDeleteRecord?: (record: any) => void;
}

export default function OPDConsultationCard({
  record,
  onViewRecord,
  onEditRecord,
  onPrintRecord,
  onDeleteRecord,
}: OPDConsultationCardProps) {
  const rawDx = record.data?.provisional_diagnosis || record.data?.diagnosis || 'General Consultation';
  const dx = safeString(rawDx, 'General Consultation');

  const rawCc = record.data?.chief_complaints || '';
  const cc = safeString(rawCc);

  const rawDoc = record.data?.doctor || record.doctor_name || 'Attending Physician';
  const doc = safeString(rawDoc, 'Attending Physician');

  const recordType = safeString(record.record_type, 'OPD Visit');
  const planNotes = safeString(record.data?.plan || record.data?.treatment_notes);

  const medsCount = Array.isArray(record.data?.prescriptions)
    ? record.data.prescriptions.length
    : Array.isArray(record.data?.medications)
    ? record.data.medications.length
    : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 shadow-2xs transition-all space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-800">{formatDateTime(record.created_at)}</span>
          <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 font-semibold">
            {recordType}
          </Badge>
          <span className="text-xs text-slate-500">· Dr. {doc}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onViewRecord(record)}
            className="h-7 text-xs font-bold gap-1 cursor-pointer"
          >
            View Summary
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEditRecord(record)}
            className="h-7 text-xs font-bold gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            <span>Edit / Resume</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPrintRecord(record)}
            className="h-7 text-xs font-bold gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span>Print Rx</span>
          </Button>
          {onDeleteRecord && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this consultation record? This cannot be undone.')) {
                  onDeleteRecord(record);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              title="Delete Consultation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Provisional Diagnosis</span>
          <p className="font-bold text-slate-900 mt-0.5">{dx}</p>
          {cc && (
            <p className="text-slate-600 text-[11px] mt-1">
              <strong>Chief Complaints:</strong> {cc}
            </p>
          )}
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Medications &amp; Advice</span>
          <div className="text-slate-700 mt-0.5">
            {medsCount > 0 ? (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                💊 {medsCount} Medications Prescribed
              </Badge>
            ) : (
              <span className="text-slate-400 italic">No medications prescribed</span>
            )}
          </div>
          {planNotes && (
            <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
              <strong>Plan:</strong> {planNotes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
