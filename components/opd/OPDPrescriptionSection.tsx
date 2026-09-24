'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Pill,
  SlidersHorizontal,
  Printer,
  Trash2,
  Plus,
  FileText,
} from 'lucide-react';
import type { RxTemplateItem } from './TemplateManagementDialog';

interface OPDPrescriptionSectionProps {
  register: any;
  watch: any;
  setValue: any;
  medFields: any[];
  appendMed: (med: any) => void;
  removeMed: (index: number) => void;
  dynamicInvestigations: string[];
  allRxTemplates: RxTemplateItem[];
  onApplyRxTemplate: (templateId: string) => void;
  onManageTemplates: () => void;
  onPreviewRx: () => void;
  isPlanSectionExpanded: boolean;
  setIsPlanSectionExpanded: (expanded: boolean) => void;
  onOpenSmartOrder: () => void;
}

export default function OPDPrescriptionSection({
  register,
  watch,
  setValue,
  medFields,
  appendMed,
  removeMed,
  dynamicInvestigations,
  allRxTemplates,
  onApplyRxTemplate,
  onManageTemplates,
  onPreviewRx,
  isPlanSectionExpanded,
  setIsPlanSectionExpanded,
  onOpenSmartOrder,
}: OPDPrescriptionSectionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader
        className="py-3 px-4 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => setIsPlanSectionExpanded(!isPlanSectionExpanded)}
      >
        <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
          Assessment, Orders &amp; Management Plan
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onOpenSmartOrder();
            }}
            className="gap-1.5 text-[11px] text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.12)] rounded h-7 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Insert Order Set</span>
          </Button>
          <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
            {isPlanSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      {isPlanSectionExpanded && (
        <CardContent className="p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                <span>Investigations</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Click options below to quickly add/remove
              </span>
            </div>

            {/* Quick Selectable Investigation Options */}
            <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-50/80 rounded-md border border-slate-200">
              {dynamicInvestigations.map((opt) => {
                const currentVal = watch('investigations_to_be_advised') || '';
                const isSelected = currentVal.toLowerCase().includes(opt.toLowerCase());
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      const lines = currentVal.split('\n').map((l: string) => l.trim()).filter(Boolean);
                      const matchIdx = lines.findIndex(
                        (l: string) => l.toLowerCase() === opt.toLowerCase() || l.toLowerCase().includes(opt.toLowerCase())
                      );
                      if (matchIdx >= 0) {
                        lines.splice(matchIdx, 1);
                        setValue('investigations_to_be_advised', lines.join('\n'));
                      } else {
                        lines.push(opt);
                        setValue('investigations_to_be_advised', lines.join('\n'));
                      }
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[rgb(var(--clr-primary))]/10 border-[rgb(var(--clr-primary))] text-[rgb(var(--clr-primary))] font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {isSelected ? `✓ ${opt}` : `+ ${opt}`}
                  </button>
                );
              })}
            </div>

            <textarea
              {...register('investigations_to_be_advised')}
              rows={3}
              placeholder="Selected investigations will appear here, or type additional investigations..."
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))] font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                <span>Treatment (Medications)</span>
              </label>

              {/* Rx Template Selector & Management */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onApplyRxTemplate(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="h-7 px-2 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/15 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer shadow-2xs max-w-[220px] truncate"
                >
                  <option value="" disabled>⚡ Apply Rx Template...</option>
                  {allRxTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.isCustom ? `★ ${t.category}: ${t.name}` : `${t.category}: ${t.name}`}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onManageTemplates}
                  className="h-7 px-2 text-[11px] font-bold text-slate-700 border-slate-300 hover:bg-slate-100 gap-1 shadow-2xs cursor-pointer"
                  title="Manage & Edit Prescription Templates"
                >
                  <SlidersHorizontal className="w-3 h-3 text-primary" />
                  <span>Manage</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onPreviewRx}
                  className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 gap-1 shadow-2xs cursor-pointer"
                  title="Preview Printable Prescription with Current Medications"
                >
                  <Printer className="w-3 h-3 text-emerald-600" />
                  <span>Preview Rx</span>
                </Button>
              </div>
            </div>

            {/* Structured Medication Array */}
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              {medFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start relative flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[130px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name (Searchable)</label>
                    <Input
                      {...register(`medications.${index}.drug_name`)}
                      list="drugList"
                      placeholder="e.g. Tab Paracetamol"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dose</label>
                    <Input
                      {...register(`medications.${index}.dose`)}
                      placeholder="500mg"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency</label>
                    <select
                      {...register(`medications.${index}.frequency`)}
                      className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                    >
                      <option value="">Select...</option>
                      <option value="OD">OD (Once daily)</option>
                      <option value="BD">BD (Twice daily)</option>
                      <option value="TDS">TDS (Thrice daily)</option>
                      <option value="QID">QID (Four times daily)</option>
                      <option value="SOS">SOS (As needed)</option>
                      <option value="Stat">Stat (Immediately)</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                    <Input
                      {...register(`medications.${index}.duration`)}
                      placeholder="e.g. 5 days"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-[130px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions</label>
                    <Input
                      {...register(`medications.${index}.instructions`)}
                      placeholder="After food"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMed(index)}
                    className="mt-6 p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-md hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <datalist id="drugList">
                <option value="Tab Paracetamol 500mg" />
                <option value="Tab Metformin 500mg" />
                <option value="Tab Folic Acid 5mg" />
                <option value="Cap Doxycycline 100mg" />
                <option value="Inj Progesterone 100mg" />
              </datalist>

              <button
                type="button"
                onClick={() =>
                  appendMed({ drug_name: '', dose: '', frequency: '', duration: '', instructions: '' })
                }
                className="text-xs font-bold text-[rgb(var(--clr-primary))] flex items-center gap-1 hover:underline pt-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="mt-3">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Treatment Notes (Non-Pharmacological / Dietary)
              </label>
              <textarea
                {...register('treatment_notes')}
                rows={3}
                placeholder="Dietary and lifestyle instructions, additional advice..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>

            {/* Notes for Future Consultation Reference */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Notes for Future Consultation Reference</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Internal clinical reference for upcoming visits</span>
              </div>
              <textarea
                {...register('future_consultation_notes')}
                rows={3}
                placeholder="e.g. Next visit: Assess Day 10 endometrial pattern and consider adding vaginal sildenafil if < 7mm. Check partner seminal culture..."
                className="w-full bg-amber-50/40 border border-amber-200 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="w-48">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Follow-Up Schedule</label>
            <input
              list="followup-options"
              {...register('follow_up')}
              placeholder="Select or type custom (e.g. 10 days)"
              className="w-full h-8 px-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white"
            />
            <datalist id="followup-options">
              <option value="SOS (As Needed)" />
              <option value="2 days" />
              <option value="3 days" />
              <option value="5 days" />
              <option value="1 week" />
              <option value="10 days" />
              <option value="2 weeks" />
              <option value="1 month" />
              <option value="PCOS Metabolic Review (3 mo)" />
              <option value="No Follow-up required" />
            </datalist>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
