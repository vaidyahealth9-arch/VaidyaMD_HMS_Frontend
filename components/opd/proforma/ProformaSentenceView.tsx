'use client';

import React from 'react';
import { FileText, Check, Copy, Edit3 } from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

interface ProformaSentenceViewProps {
  copiedNarrative: boolean;
  handleCopyNarrative: () => void;
  setViewMode: (mode: 'form' | 'sentence' | 'preview') => void;
  narrativeText: string;
}

export default function ProformaSentenceView({
  copiedNarrative,
  handleCopyNarrative,
  setViewMode,
  narrativeText,
}: ProformaSentenceViewProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 text-emerald-900">
        <div className="space-y-0.5">
          <h4 className="font-bold text-sm flex items-center gap-1.5 text-emerald-950">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Clinical Narrative (Readable Sentence Form)</span>
          </h4>
          <p className="text-xs text-emerald-800">
            All filled proforma options compiled as continuous, natural medical sentences.
            Directly saved to Consultation Present History.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyNarrative}
            className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedNarrative ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Sentence Form
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('form');
              toast.success('Form Mode', 'You can continue modifying any template fields.');
            }}
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Options</span>
          </button>
        </div>
      </div>

      {/* The Clean Printable / Readable Text Area */}
      <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-8 shadow-xs font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-[#2878a8]/20 selection:text-slate-900 border-l-4 border-l-[#2878a8]">
        {narrativeText}
      </div>
    </div>
  );
}
