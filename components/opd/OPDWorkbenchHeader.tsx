import React from 'react';
import { Button } from '@/shared/ui/button';
import { Stethoscope, HeartPulse, Layers, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ClinicalTemplateItem } from './TemplateManagementDialog';

interface OPDWorkbenchHeaderProps {
  workbenchMode: 'doctor' | 'nurse';
  setWorkbenchMode: (mode: 'doctor' | 'nurse') => void;
  onBack?: () => void;
  clinicalHistoryTemplate: string;
  activeNoteTemplateId: string | null;
  allClinicalTemplates: ClinicalTemplateItem[];
  onSelectUnifiedTemplate: (val: string) => void;
  onOpenTemplatesStudio: () => void;
  onOpenSmartOrder: () => void;
}

export default function OPDWorkbenchHeader({
  workbenchMode,
  setWorkbenchMode,
  onBack,
  clinicalHistoryTemplate,
  activeNoteTemplateId,
  allClinicalTemplates,
  onSelectUnifiedTemplate,
  onOpenTemplatesStudio,
  onOpenSmartOrder,
}: OPDWorkbenchHeaderProps) {
  return (
    <div className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 gap-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
          <Stethoscope className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">OPD Clinical Workbench</h1>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Outpatient consultation, dynamic EMR charting &amp; ambient scribing</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Switcher: Doctor Consultation vs Nurse Triage */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
          <button
            type="button"
            onClick={() => setWorkbenchMode('doctor')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              workbenchMode === 'doctor'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-primary" />
            <span>Doctor View</span>
          </button>
          <button
            type="button"
            onClick={() => setWorkbenchMode('nurse')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              workbenchMode === 'nurse'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
            <span>Nurse Triage</span>
          </button>
        </div>

        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1 text-xs font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-50 rounded-md h-8 cursor-pointer"
          >
            <span>&larr; Back to EMR</span>
          </Button>
        )}

        {workbenchMode === 'doctor' && (
          <>
            {/* Unified Single-Source Clinical Template & Proforma Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/90 px-2.5 py-1 rounded-md border border-slate-300 shadow-2xs transition-colors">
              <Layers className="w-3.5 h-3.5 text-[#2878a8]" />
              <label htmlFor="unified-clinical-template-select" className="sr-only">
                Clinical Template &amp; Proforma
              </label>
              <select
                id="unified-clinical-template-select"
                value={
                  clinicalHistoryTemplate !== 'standard'
                    ? `mode:${clinicalHistoryTemplate}`
                    : activeNoteTemplateId
                    ? `tmpl:${activeNoteTemplateId}`
                    : 'mode:standard'
                }
                onChange={(e) => onSelectUnifiedTemplate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[210px] truncate"
                title="Single-source template selector: Select Proforma Mode or Note Template"
              >
                <optgroup label="📋 Clinical Proformas & Assessment Modes">
                  <option value="mode:standard">Standard Free-Text Notes</option>
                  <option value="mode:fertility">Fertility Couple Proforma</option>
                  <option value="mode:gynaecology">Gynaecology Case Proforma</option>
                  <option value="mode:obstetric">Obstetric Antenatal Proforma</option>
                </optgroup>
                <optgroup label="📝 Clinical Note Templates">
                  {allClinicalTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={`tmpl:${tmpl.id}`}>
                      {tmpl.isCustom ? `★ ${tmpl.name}` : tmpl.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <button
                type="button"
                onClick={onOpenTemplatesStudio}
                className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-200 transition-colors cursor-pointer"
                title="Manage & Edit Clinical Templates in Studio"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Templates Studio Dialog Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenTemplatesStudio}
              className="gap-1.5 text-xs font-bold bg-white text-slate-700 border-slate-300 hover:bg-slate-50 rounded-md h-8 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Templates Studio</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSmartOrder}
              className="gap-1.5 text-xs font-bold bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.12)] rounded-md h-8 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Order Sets (Cmd+K)</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
