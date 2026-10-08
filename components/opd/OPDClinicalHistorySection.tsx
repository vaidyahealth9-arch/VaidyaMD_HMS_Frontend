import React from 'react';
import { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { ChevronUp, ChevronDown, Heart, Activity, Baby, FileText } from 'lucide-react';
import ClinicalHistoryProformaModal from './ClinicalHistoryProformaModal';

interface OPDClinicalHistorySectionProps {
  isHistorySectionExpanded: boolean;
  setIsHistorySectionExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  clinicalHistoryTemplate: string;
  activeNoteTemplateId: string | null;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  patient: any;
  onCloseStructured: () => void;
}

export default function OPDClinicalHistorySection({
  isHistorySectionExpanded,
  setIsHistorySectionExpanded,
  clinicalHistoryTemplate,
  activeNoteTemplateId,
  register,
  setValue,
  patient,
  onCloseStructured,
}: OPDClinicalHistorySectionProps) {
  return (
    <Card id="clinical-history-section" className="border-slate-200 shadow-sm scroll-mt-20">
      <CardHeader
        className="py-3 px-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap gap-2 items-center justify-between cursor-pointer select-none"
        onClick={() => setIsHistorySectionExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Clinical History &amp; Subjective Assessment
          </CardTitle>
          {clinicalHistoryTemplate !== 'standard' ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2878a8]/10 text-[#2878a8] border border-[#2878a8]/20 capitalize flex items-center gap-1">
              {clinicalHistoryTemplate === 'fertility' && <Heart className="w-3 h-3 text-rose-500" />}
              {clinicalHistoryTemplate === 'gynaecology' && <Activity className="w-3 h-3 text-violet-500" />}
              {clinicalHistoryTemplate === 'obstetric' && <Baby className="w-3 h-3 text-emerald-500" />}
              <span>{clinicalHistoryTemplate} Proforma Active</span>
            </span>
          ) : activeNoteTemplateId ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Template Active
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Mode Indicator - single source is in the top toolbar */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 bg-white shadow-2xs cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {clinicalHistoryTemplate === 'standard' && (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-700 font-semibold">Standard Free-Text Active</span>
              </>
            )}
            {clinicalHistoryTemplate === 'fertility' && (
              <>
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[#2878a8] font-bold">Couple Fertility Proforma</span>
              </>
            )}
            {clinicalHistoryTemplate === 'gynaecology' && (
              <>
                <Activity className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-violet-700 font-bold">Gynaecology Case Proforma</span>
              </>
            )}
            {clinicalHistoryTemplate === 'obstetric' && (
              <>
                <Baby className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-700 font-bold">Obstetric Antenatal Proforma</span>
              </>
            )}
            <span className="text-[10px] text-slate-400 pl-1 border-l border-slate-200">
              Top Toolbar
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsHistorySectionExpanded((prev) => !prev);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 active:scale-95 rounded-md transition-all cursor-pointer focus:outline-none"
            aria-label={isHistorySectionExpanded ? 'Collapse clinical history section' : 'Expand clinical history section'}
            title={isHistorySectionExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isHistorySectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      {isHistorySectionExpanded && (
        <CardContent className="p-4 space-y-4">
          {clinicalHistoryTemplate === 'standard' ? (
            /* Mode A: Standard Free-text Textareas */
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chief Complaints <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('chief_complaints', { required: true })}
                  rows={2}
                  placeholder="e.g. Primary subfertility for 3 years, irregular menses..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Present History</label>
                  <textarea
                    {...register('present_history')}
                    rows={10}
                    placeholder="Detailed chronological history of present illness..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Previous / Past History</label>
                  <textarea
                    {...register('previous_history')}
                    rows={4}
                    placeholder="Previous hospitalizations, medical illnesses, surgeries, drug allergies, family history..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Examination Findings</label>
                  <textarea
                    {...register('examination')}
                    rows={4}
                    placeholder="General examination (O/E, BP, Pallor, Pedal edema), P/A, P/S, P/V, USG findings..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Previous Investigations</label>
                <textarea
                  {...register('previous_investigations')}
                  rows={2}
                  placeholder="Past reports and imaging..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                />
              </div>
            </>
          ) : (
            /* Mode B: Structured Clinical Template replacing the Free-Text inputs directly inline */
            <div className="-mx-4 -my-4 border-t border-slate-200">
              <ClinicalHistoryProformaModal
                patient={patient}
                partner={patient?.partner}
                inline={true}
                initialType={clinicalHistoryTemplate as 'fertility' | 'gynaecology' | 'obstetric'}
                onClose={onCloseStructured}
                onDataChange={(proformaData, summary) => {
                  if (summary.complaints) setValue('chief_complaints', summary.complaints);
                  if (summary.history) setValue('present_history', summary.history);
                  if (summary.pastHistory) setValue('previous_history', summary.pastHistory);
                  if (summary.exam) setValue('examination', summary.exam);
                  if (proformaData.finalDiagnosis) setValue('provisional_diagnosis', proformaData.finalDiagnosis);
                  setValue('clinical_proforma', proformaData);
                }}
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
