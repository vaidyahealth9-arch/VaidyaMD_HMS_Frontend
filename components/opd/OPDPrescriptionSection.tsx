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
  Stethoscope,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
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
  const { data: batches = [] } = useQuery({
    queryKey: ['pharmacy-inventory-batches-active'],
    queryFn: () => pharmacyApi.listBatches({ active_only: true }),
    staleTime: 5 * 60 * 1000,
  });

  const [openSearchIndex, setOpenSearchIndex] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<Record<number, string>>({});
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setOpenSearchIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const medicineDirectory = React.useMemo(() => {
    if (!Array.isArray(batches)) return [];
    const map = new Map<string, {
      itemName: string;
      itemCode: string;
      genericName: string;
      category: string;
      totalAvailable: number;
      rackLocation: string;
    }>();

    for (const b of batches as any[]) {
      const name = (b.item_name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const qty = Number(b.quantity_available || 0);
      const existing = map.get(key);
      if (existing) {
        existing.totalAvailable += qty;
      } else {
        map.set(key, {
          itemName: name,
          itemCode: b.item_code || '',
          genericName: b.generic_name || '',
          category: b.category || '',
          totalAvailable: qty,
          rackLocation: b.rack_location || '',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [batches]);

  const medicineStockMap = React.useMemo(() => {
    const map = new Map<string, { totalAvailable: number; itemCode: string; rackLocation: string }>();
    medicineDirectory.forEach((m) => {
      map.set(m.itemName.toLowerCase(), {
        totalAvailable: m.totalAvailable,
        itemCode: m.itemCode,
        rackLocation: m.rackLocation,
      });
    });
    return map;
  }, [medicineDirectory]);

  const availableMedicines = React.useMemo(() => {
    return medicineDirectory.map((m) => m.itemName);
  }, [medicineDirectory]);

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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlanSectionExpanded(!isPlanSectionExpanded);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 active:scale-95 rounded-md transition-all cursor-pointer focus:outline-none"
            aria-label={isPlanSectionExpanded ? 'Collapse prescription section' : 'Expand prescription section'}
            title={isPlanSectionExpanded ? 'Collapse section' : 'Expand section'}
          >
            {isPlanSectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </CardHeader>

      {isPlanSectionExpanded && (
        <CardContent className="p-4 space-y-4">
          {/* Assessment & Clinical Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 border-b border-slate-100">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <Stethoscope className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                <span>Provisional / Primary Diagnosis <span className="text-red-500">*</span></span>
              </label>
              <Input
                {...register('provisional_diagnosis')}
                placeholder="e.g. Primary Infertility - Female Factor (PCOS) / Ovulatory Dysfunction"
                className="h-8 text-xs bg-slate-50 border-slate-300 focus:bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <span>Differential Diagnosis (Optional)</span>
              </label>
              <Input
                {...register('differential_diagnosis')}
                placeholder="e.g. Hypothyroidism, Hyperprolactinemia"
                className="h-8 text-xs bg-slate-50 border-slate-300 focus:bg-white"
              />
            </div>
          </div>

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
            <div ref={searchContainerRef} className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
              {medFields.map((field, index) => {
                const drugNameVal = watch(`medications.${index}.drug_name`) || '';
                const stockInfo = medicineStockMap.get(drugNameVal.trim().toLowerCase());
                const rowQuery = (searchQuery[index] ?? drugNameVal).toLowerCase().trim();

                const filteredMeds = rowQuery
                  ? medicineDirectory
                      .filter(
                        (m) =>
                          m.itemName.toLowerCase().includes(rowQuery) ||
                          m.genericName.toLowerCase().includes(rowQuery) ||
                          m.category.toLowerCase().includes(rowQuery)
                      )
                      .slice(0, 10)
                  : medicineDirectory.slice(0, 8);

                return (
                  <div key={field.id} className="flex gap-2 items-start relative flex-wrap sm:flex-nowrap pb-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex-1 min-w-[150px] relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Drug Name (Searchable)</label>
                        {stockInfo && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              stockInfo.totalAvailable > 10
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : stockInfo.totalAvailable > 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-600 border-rose-200'
                            }`}
                          >
                            {stockInfo.totalAvailable > 10
                              ? `In Stock: ${stockInfo.totalAvailable}`
                              : stockInfo.totalAvailable > 0
                              ? `Low: ${stockInfo.totalAvailable}`
                              : 'Out of Stock'}
                          </span>
                        )}
                      </div>
                      <Input
                        value={drugNameVal}
                        onChange={(e) => {
                          setValue(`medications.${index}.drug_name`, e.target.value);
                          setSearchQuery((prev) => ({ ...prev, [index]: e.target.value }));
                          setOpenSearchIndex(index);
                        }}
                        onFocus={() => {
                          setOpenSearchIndex(index);
                          setSearchQuery((prev) => ({ ...prev, [index]: drugNameVal }));
                        }}
                        placeholder="Type drug or generic name..."
                        className="h-8 text-xs mt-1 bg-white font-medium"
                      />

                      {/* Dropdown Suggestions with Stock Badges */}
                      {openSearchIndex === index && (
                        <div className="absolute z-50 left-0 top-full mt-1 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                            <span>Formulary &amp; Stock</span>
                            <span className="text-[9px] text-slate-400 font-normal">Click to apply</span>
                          </div>
                          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                            {filteredMeds.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-400">
                                No inventory match found.
                                <p className="text-[10px] text-slate-400 mt-0.5">Will be prescribed as external/custom drug.</p>
                              </div>
                            ) : (
                              filteredMeds.map((med) => {
                                const inStock = med.totalAvailable > 0;
                                const isLow = inStock && med.totalAvailable <= 10;
                                return (
                                  <button
                                    key={med.itemName}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      setValue(`medications.${index}.drug_name`, med.itemName);
                                      setValue(`medications.${index}.item_code`, med.itemCode);
                                      setOpenSearchIndex(null);
                                    }}
                                    className="w-full text-left p-2 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-xs text-slate-800 truncate">{med.itemName}</div>
                                      {med.genericName && (
                                        <div className="text-[10px] text-slate-400 truncate">{med.genericName}</div>
                                      )}
                                    </div>
                                    <div className="shrink-0">
                                      {inStock ? (
                                        <span
                                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                            isLow
                                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          }`}
                                        >
                                          {isLow ? `Low: ${med.totalAvailable}` : `In Stock: ${med.totalAvailable}`}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Real-time Availability Subtext */}
                      {drugNameVal.trim() && (
                        <div className="mt-1">
                          {stockInfo ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium">
                              {stockInfo.totalAvailable > 10 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  In Stock: <strong>{stockInfo.totalAvailable}</strong> available
                                  {stockInfo.rackLocation ? ` (${stockInfo.rackLocation})` : ''}
                                </span>
                              ) : stockInfo.totalAvailable > 0 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Low Stock: <strong>{stockInfo.totalAvailable}</strong> left
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  Out of Stock in Pharmacy
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">
                              Custom / Non-inventory drug
                            </div>
                          )}
                        </div>
                      )}
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
                );
              })}

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
