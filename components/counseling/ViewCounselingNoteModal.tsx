'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { HeartHandshake, X, Printer, ShieldCheck } from 'lucide-react';

interface ViewCounselingNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: any | null;
  onPrint: (note: any) => void;
}

export default function ViewCounselingNoteModal({
  isOpen,
  onClose,
  note: viewingNote,
  onPrint,
}: ViewCounselingNoteModalProps) {
  if (!isOpen || !viewingNote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="bg-white max-w-3xl w-full rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-6">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-pink-300 border border-white/10">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Pre-ART Clinical Counseling Sheet</h3>
              <p className="text-xs text-slate-400">
                Recorded on {formatDate(viewingNote.created_at)} at{' '}
                {new Date(viewingNote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Header Banner */}
        <div className="p-4 bg-pink-50/80 border-b border-pink-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-pink-800 block">Patient Information</span>
            <p className="font-bold text-slate-900 text-sm">{viewingNote.patient_name || 'Patient'}</p>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">
              VID: {viewingNote.patient_vid || '—'}{' '}
              {viewingNote.patient_gender ? `· ${viewingNote.patient_gender}` : ''}{' '}
              {viewingNote.patient_age ? `(${viewingNote.patient_age}y)` : ''}
            </p>
          </div>
          {viewingNote.partner_name && (
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Linked Partner</span>
              <p className="font-bold text-slate-800 text-xs">{viewingNote.partner_name}</p>
              <p className="text-[10px] text-slate-500 font-mono">{viewingNote.partner_vid || '—'}</p>
            </div>
          )}
        </div>

        {/* 8-Column Review Grid */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Source of Referral / Patient Origin</span>
              <p className="font-semibold text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {viewingNote.source || 'OP Consultation'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Planned Procedure</span>
              <p className="font-bold text-primary bg-primary/5 p-2.5 rounded-lg border border-primary/20">
                {viewingNote.procedure || 'General Clinical Counseling'}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Comments / Chief Complaint</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {viewingNote.comments || <span className="text-slate-400 italic">No comments recorded.</span>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Discussion / Protocol Details</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
              {viewingNote.discussion || <span className="text-slate-400 italic">No discussion points documented.</span>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Egg pick up (OPU Protocol)</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {viewingNote.egg_pick_up || <span className="text-slate-400 italic">No OPU details recorded.</span>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Laparoscopy / Hysteroscopy / Endoscopy</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {viewingNote.laparoscopy_hysteroscopy || <span className="text-slate-400 italic">No endoscopic findings documented.</span>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Egg transfer (Embryo Transfer)</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {viewingNote.egg_transfer || <span className="text-slate-400 italic">No transfer notes documented.</span>}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">7. Remarks</span>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
              {viewingNote.remarks || <span className="text-slate-400 italic">No additional remarks.</span>}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">8. Signature</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-slate-900 font-mono">{viewingNote.signature || 'Counselor Signed'}</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <span>Counselor ID: {viewingNote.counselor_name || 'Staff'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onPrint(viewingNote);
              onClose();
            }}
            className="gap-1.5 text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            Print Clinical Sheet
          </Button>
          <Button
            onClick={onClose}
            className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
