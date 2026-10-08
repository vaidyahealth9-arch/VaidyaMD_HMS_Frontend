import React from 'react';
import { ChevronDown, Search, CheckCircle2, Target, X } from 'lucide-react';
import { CycleFormState, TreatmentTypeItem } from './types';

interface WizardStepIntendedTreatmentProps {
  form: CycleFormState;
  setForm: React.Dispatch<React.SetStateAction<CycleFormState>>;
  doctors: any[];
  loadingDoctors: boolean;
  typeDropdownOpen: boolean;
  setTypeDropdownOpen: (open: boolean) => void;
  typeSearchQuery: string;
  setTypeSearchQuery: (query: string) => void;
  typeDropdownRef: React.RefObject<HTMLDivElement | null>;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  filteredTreatmentTypes: TreatmentTypeItem[];
  currentSelectedType?: TreatmentTypeItem | null;
}

export default function WizardStepIntendedTreatment({
  form,
  setForm,
  doctors,
  loadingDoctors,
  typeDropdownOpen,
  setTypeDropdownOpen,
  typeSearchQuery,
  setTypeSearchQuery,
  typeDropdownRef,
  searchInputRef,
  filteredTreatmentTypes,
  currentSelectedType,
}: WizardStepIntendedTreatmentProps) {
  return (
          <div className="space-y-4 min-h-[440px] pb-44">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2">Intended Treatment & Clinical Factors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative" ref={typeDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Treatment Type <span className="text-red-500">*</span>
                  </label>
                  {form.treatment_type && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, treatment_type: '' }));
                        setTypeSearchQuery('');
                        setTypeDropdownOpen(true);
                        setTimeout(() => {
                          searchInputRef.current?.focus();
                          typeDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 50);
                      }}
                      className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Combobox Trigger */}
                <div
                  onClick={() => {
                    const nextState = !typeDropdownOpen;
                    setTypeDropdownOpen(nextState);
                    if (nextState) {
                      setTimeout(() => {
                        searchInputRef.current?.focus();
                        typeDropdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }, 50);
                    }
                  }}
                  className={`w-full bg-slate-50 border rounded-lg p-2.5 text-xs cursor-pointer flex items-center justify-between transition-all select-none ${
                    typeDropdownOpen
                      ? 'border-[rgb(var(--clr-primary))] ring-2 ring-[rgb(var(--clr-primary)/0.2)] bg-white shadow-xs'
                      : form.treatment_type
                      ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Target className={`w-4 h-4 shrink-0 ${form.treatment_type ? 'text-emerald-600' : 'text-slate-400'}`} />
                    {currentSelectedType ? (
                      <div className="min-w-0 truncate">
                        <span className="font-bold text-slate-900 block truncate">{currentSelectedType.name}</span>
                        {currentSelectedType.description && (
                          <span className="text-[10px] text-slate-500 block truncate">{currentSelectedType.description}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 font-normal">Select Treatment Type (Click to search ICSI, IVF, FET, IUI...)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {form.treatment_type && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm((prev) => ({ ...prev, treatment_type: '' }));
                          setTypeSearchQuery('');
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                        title="Clear treatment type"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${typeDropdownOpen ? 'rotate-180 text-[rgb(var(--clr-primary))]' : ''}`} />
                  </div>
                </div>

                {/* Searchable Dropdown Popover */}
                {typeDropdownOpen && (
                  <div className="absolute z-[99] top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100 ring-1 ring-black/5">
                    {/* Search Input Filter */}
                    <div className="p-2 border-b border-slate-100 bg-slate-50/70 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={typeSearchQuery}
                        onChange={(e) => setTypeSearchQuery(e.target.value)}
                        placeholder="Search type (e.g. ICSI, IVF, FET, IUI, Freeze)..."
                        className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-7 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                        autoFocus
                      />
                      {typeSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTypeSearchQuery('')}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-56 sm:max-h-60 overflow-y-auto p-1 divide-y divide-slate-100/60 custom-scrollbar">
                      {filteredTreatmentTypes.length > 0 ? (
                        filteredTreatmentTypes.map((t) => {
                          const isSelected = form.treatment_type === t.name || form.treatment_type === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                const raw = t.name.toUpperCase();
                                const cat = (t.category || '').toUpperCase();
                                const isFet = raw.includes('FET') || raw.includes('FROZEN EMBRYO') || raw.includes('HRT') || cat.includes('FET');
                                const isIui = raw.includes('IUI') || raw.includes('INSEMINATION') || raw.includes('OVULATION INDUCTION') || raw.includes('OI');
                                const isDonorEgg = raw.includes('DONOR EGG') || raw.includes('DONOR OOCYTE') || raw.includes('EGG DONATION') || raw.includes('* EGG') || raw.includes('EGG SHARING');
                                const isDonorSperm = raw.includes('IUI - D') || raw.includes('IUI_D') || raw.includes('DONOR SPERM') || raw.includes('* SPERM');
                                const isSurgicalSperm = raw.includes('TESA') || raw.includes('PESA') || raw.includes('TESE') || cat.includes('SURGICAL');
                                const isPgt = raw.includes('PGT') || raw.includes('PGS') || raw.includes('PGD') || cat.includes('DIAGNOSTICS');

                                setForm((prev) => ({
                                  ...prev,
                                  treatment_type: t.name,
                                  sentinel_dates: {
                                    ...prev.sentinel_dates,
                                    is_hrt_fet: isFet,
                                  },
                                  gametes_source: {
                                    ...prev.gametes_source,
                                    oocyte: isDonorEgg ? 'donor' : prev.gametes_source.oocyte,
                                    sperm: isDonorSperm ? 'donor' : isSurgicalSperm ? 'surgical' : prev.gametes_source.sperm,
                                  },
                                  pgs_pgd_data: {
                                    ...prev.pgs_pgd_data,
                                    indicated: isPgt ? true : prev.pgs_pgd_data.indicated,
                                    type: isPgt ? (raw.includes('PGT-M') ? 'PGT-M (Monogenic)' : 'PGT-A (Aneuploidy)') : prev.pgs_pgd_data.type,
                                  },
                                }));
                                setTypeSearchQuery('');
                                setTypeDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between rounded-lg cursor-pointer ${
                                isSelected
                                  ? 'bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] font-bold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">{t.name}</span>
                                  {t.category && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                      {t.category}
                                    </span>
                                  )}
                                </div>
                                {t.description && (
                                  <p className="text-[10.5px] text-slate-500 font-normal leading-tight mt-0.5 truncate">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[rgb(var(--clr-primary))] shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-4 px-3 text-center">
                          <p className="text-xs text-slate-500 mb-2">No matching standard treatment types found for "{typeSearchQuery}"</p>
                          <button
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, treatment_type: typeSearchQuery.trim() }));
                              setTypeSearchQuery('');
                              setTypeDropdownOpen(false);
                            }}
                            className="px-3 py-1 bg-[rgb(var(--clr-primary))] text-white text-xs font-bold rounded-md hover:bg-primary-mid transition-colors shadow-2xs cursor-pointer"
                          >
                            Use Custom: "{typeSearchQuery.trim()}"
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attempt Number</label>
                <input
                  type="number"
                  value={form.attempt_number}
                  onChange={(e) => setForm({ ...form, attempt_number: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Treating Consultant <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.treating_doctor_id}
                  onChange={(e) => setForm({ ...form, treating_doctor_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                >
                  <option value="">{loadingDoctors ? 'Loading consultants...' : 'Select Treating Consultant...'}</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} ({d.specialization || d.role || 'Consultant'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="treatment_at_other_centre"
                    checked={form.treatment_at_other_centre}
                    onChange={(e) => setForm({ ...form, treatment_at_other_centre: e.target.checked })}
                    className="w-4 h-4 text-primary rounded cursor-pointer"
                  />
                  <label htmlFor="treatment_at_other_centre" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Treatment initiated at another centre / Referral cycle
                  </label>
                </div>
                {form.treatment_at_other_centre && (
                  <div className="mt-2.5 pl-6 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Previous Fertility Centre / Clinic Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Oasis Fertility, Cloudnine, Apollo Cradle..."
                      value={form.previous_centre_name || ''}
                      onChange={(e) => setForm({ ...form, previous_centre_name: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
  );
}
