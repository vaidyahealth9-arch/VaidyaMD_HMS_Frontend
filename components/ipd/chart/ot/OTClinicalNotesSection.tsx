'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/shared/ui/input';
import { Sparkles, Columns, Rows, FileText, ClipboardList } from 'lucide-react';
import { OT_TEMPLATES } from './otTemplates';

interface OTClinicalNotesSectionProps {
  preOpDiagnosis: string;
  setPreOpDiagnosis: (val: string) => void;
  postOpDiagnosis: string;
  setPostOpDiagnosis: (val: string) => void;
  operativeNotes: string;
  setOperativeNotes: (val: string) => void;
  postOpOrders: string;
  setPostOpOrders: (val: string) => void;
}

export default function OTClinicalNotesSection({
  preOpDiagnosis,
  setPreOpDiagnosis,
  postOpDiagnosis,
  setPostOpDiagnosis,
  operativeNotes,
  setOperativeNotes,
  postOpOrders,
  setPostOpOrders,
}: OTClinicalNotesSectionProps) {
  const [isSideBySide, setIsSideBySide] = useState(true);
  const notesRef = useRef<HTMLTextAreaElement | null>(null);
  const ordersRef = useRef<HTMLTextAreaElement | null>(null);

  // Dynamic auto-expansion of textarea height based on content
  const autoResize = (el: HTMLTextAreaElement | null, minHeight = 220, maxHeight = 700) => {
    if (!el) return;
    el.style.height = 'auto';
    const computedH = Math.max(minHeight, Math.min(el.scrollHeight + 6, maxHeight));
    el.style.height = `${computedH}px`;
  };

  useEffect(() => {
    autoResize(notesRef.current, 220, 700);
  }, [operativeNotes, isSideBySide]);

  useEffect(() => {
    autoResize(ordersRef.current, 220, 700);
  }, [postOpOrders, isSideBySide]);

  const handleApplyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tmplId = e.target.value;
    if (!tmplId) return;
    const tmpl = OT_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl) return;

    if (!preOpDiagnosis) setPreOpDiagnosis(tmpl.preOp);
    if (!postOpDiagnosis) setPostOpDiagnosis(tmpl.postOp);
    setOperativeNotes(tmpl.notes);
    setPostOpOrders(tmpl.orders);
    e.target.value = '';
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Template & Layout Control Bar */}
      <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Insert Free-Text Operative Template:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Toggle: Side-by-Side vs Stacked */}
          <button
            type="button"
            onClick={() => setIsSideBySide((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 bg-white border border-indigo-200 rounded text-indigo-900 hover:bg-indigo-50 shadow-2xs cursor-pointer transition-colors"
            title={isSideBySide ? 'Switch to Stacked View' : 'Switch to Side-by-Side View'}
          >
            {isSideBySide ? (
              <>
                <Rows className="w-3 h-3 text-indigo-600" />
                <span className="hidden sm:inline">Stacked</span>
              </>
            ) : (
              <>
                <Columns className="w-3 h-3 text-indigo-600" />
                <span className="hidden sm:inline">Side-by-Side</span>
              </>
            )}
          </button>

          <select
            defaultValue=""
            onChange={handleApplyTemplate}
            className="h-7 text-xs font-semibold bg-white border border-indigo-300 rounded px-2 text-indigo-950 focus:outline-none cursor-pointer"
          >
            <option value="" disabled>Select template to load...</option>
            {OT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Diagnoses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Pre-Op Diagnosis</label>
          <Input
            value={preOpDiagnosis}
            onChange={(e) => setPreOpDiagnosis(e.target.value)}
            placeholder="e.g. Bilateral Dermoid Cyst"
            className="h-8 text-xs bg-white"
          />
        </div>
        <div>
          <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Post-Op Diagnosis</label>
          <Input
            value={postOpDiagnosis}
            onChange={(e) => setPostOpDiagnosis(e.target.value)}
            placeholder="e.g. Left Dermoid, Right Endometrioma"
            className="h-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* 3. Side-by-Side Responsive Grid with Dynamic Heights */}
      <div className={isSideBySide ? 'grid grid-cols-1 lg:grid-cols-2 gap-3.5' : 'space-y-3.5'}>
        {/* Box A: Operative Technique, Findings & Steps */}
        <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Operative Technique, Findings &amp; Steps (Editable)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {operativeNotes ? `${operativeNotes.split('\n').length} lines` : '0 lines'}
            </span>
          </div>
          <textarea
            ref={notesRef}
            value={operativeNotes}
            onChange={(e) => {
              setOperativeNotes(e.target.value);
              autoResize(notesRef.current, 220, 700);
            }}
            placeholder="e.g. Patient placed in lithotomy position, pneumoperitoneum created, cyst excised intact, hemostasis achieved..."
            className="w-full min-h-[220px] p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono leading-relaxed bg-white shadow-2xs resize-y"
          />
        </div>

        {/* Box B: Post-Operative Orders / Instructions */}
        <div className="bg-slate-50/60 p-3 rounded-lg border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <label className="font-bold text-slate-800 uppercase text-[10px] flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
              <span>Post-Operative Orders &amp; Instructions (Editable)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              {postOpOrders ? `${postOpOrders.split('\n').length} lines` : '0 lines'}
            </span>
          </div>
          <textarea
            ref={ordersRef}
            value={postOpOrders}
            onChange={(e) => {
              setPostOpOrders(e.target.value);
              autoResize(ordersRef.current, 220, 700);
            }}
            placeholder="e.g. NPO for 6 hours, monitor vitals Q1H for 4 hours, continuous catheter drainage, IV analgesia..."
            className="w-full min-h-[220px] p-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono leading-relaxed bg-white shadow-2xs resize-y"
          />
        </div>
      </div>
    </div>
  );
}
