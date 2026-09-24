'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, Eye, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import PrintableCounselingSheetModal from '@/components/common/PrintableCounselingSheetModal';
import { useEffect } from 'react';
import { counselingApi, type CounselingNote } from '@/lib/api';

interface CounselingTabProps {
  patientId?: string;
  patient: any;
  counselingNotes?: CounselingNote[];
}

export default function CounselingTab({
  patientId,
  patient,
  counselingNotes: propNotes,
}: CounselingTabProps) {
  const [internalNotes, setInternalNotes] = useState<CounselingNote[]>([]);
  const counselingNotes = propNotes || internalNotes;
  const [viewingNote, setViewingNote] = useState<CounselingNote | null>(null);

  const targetId = patientId || patient?.id;

  useEffect(() => {
    if (!propNotes && targetId) {
      counselingApi.listNotes({ patient_id: targetId })
        .then((notes: any) => setInternalNotes(notes || []))
        .catch((err) => console.error('Failed to load counseling notes', err));
    }
  }, [propNotes, targetId]);

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2">
      {/* Header / Summary Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Pre-ART Clinical Counseling Sessions</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-mono">
                  {counselingNotes.length} Record{counselingNotes.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Standard 8-point fertility counseling record: Source, Procedure, Egg pick up, Discussion, Laparoscopy/hysteroscopy, Egg transfer, Remarks &amp; Signature.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/counseling"
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Open Counselor Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Sessions Case Sheet List */}
      {counselingNotes.length > 0 ? (
        <div className="space-y-4">
          {counselingNotes.map((note, idx) => (
            <div
              key={note.id}
              className="bg-white border border-slate-200 hover:border-violet-300 rounded-xl p-5 shadow-sm transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center font-mono">
                    #{counselingNotes.length - idx}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{note.procedure || 'Pre-ART Consultation'}</span>
                      <span className="text-xs px-2 py-0.5 rounded font-bold bg-violet-50 text-violet-700 border border-violet-200">
                        Source: {note.source || 'Direct'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Session Date: <strong className="text-slate-700">{formatDate(note.created_at)}</strong> · Counselor: <strong className="text-slate-700">{note.counselor_name || 'Counselor'}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingNote(note)}
                    className="px-3 py-1.5 text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Case Sheet</span>
                  </button>
                </div>
              </div>

              {/* 8 Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Source</span>
                  <p className="font-semibold text-slate-800">{note.source || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">2. Procedure</span>
                  <p className="font-semibold text-violet-900">{note.procedure || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">3. Egg Pick Up</span>
                  <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.egg_pick_up || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 md:col-span-2 lg:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">4. Discussion</span>
                  <p className="text-slate-800 whitespace-pre-line leading-relaxed">{note.discussion || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">5. Laparoscopy / Hysteroscopy / Etc</span>
                  <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.laparoscopy_hysteroscopy || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">6. Egg Transfer</span>
                  <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.egg_transfer || '—'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">7. Remarks</span>
                  <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.remarks || '—'}</p>
                </div>
              </div>

              {/* Signature Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">8. Counselor Attestation &amp; Signature:</span>
                  <span className="font-serif italic font-bold text-slate-900 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                    {note.signature || 'Digital Sign-off'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Recorded by {note.counselor_name || 'Counselor'} · {formatDate(note.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No Counseling Sessions Recorded</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pre-ART counseling notes recorded by the counselor desk will automatically appear here for the medical team and treating doctor.
          </p>
          <Link
            href="/counseling"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Go to Counselor Desk</span>
          </Link>
        </div>
      )}

      {/* Case Sheet Viewer Modal */}
      <PrintableCounselingSheetModal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
        patient={patient}
      />
    </div>
  );
}
