'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Heart,
  User,
  Save,
  Check,
  Building2,
  Plus,
  X,
  Search,
  ChevronDown,
  CheckCircle2,
  Target,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi, authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { DEFAULT_TREATMENT_TYPES, TreatmentTypeItem } from '@/components/fertility/wizard/types';

interface IntendedTreatmentPanelProps {
  cycle: TreatmentCycleRecord;
  partner?: any;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onNavigateNext?: () => void;
}

const COMMON_FEMALE_FACTORS = [
  'Low Ovarian Reserve',
  'PCOD / PCOS',
  'Tubal Block',
  'Severe Endometriosis',
  'Adenomyosis',
  'Diminished Ovarian Reserve',
  'Poor Quality Oocytes',
  'Unexplained Infertility',
];

const COMMON_MALE_FACTORS = [
  'Normozoospermic',
  'Azoospermia',
  'Oligoasthenoteratozoospermia (OAT)',
  'Asthenozoospermia',
  'Teratozoospermia',
  'High DFI (> 30%)',
  'Severe Necrozoospermia',
];

export default function IntendedTreatmentPanel({
  cycle,
  partner,
  onUpdateCycle,
  onNavigateNext,
}: IntendedTreatmentPanelProps) {
  const [treatmentType, setTreatmentType] = useState(cycle.treatment_type || '');
  const [attemptNumber, setAttemptNumber] = useState(cycle.attempt_number || 1);
  const [startDate, setStartDate] = useState(cycle.start_date || '');
  const [treatingDoctorId, setTreatingDoctorId] = useState<string>(
    cycle.treating_doctor_id || ''
  );
  const [femaleFactors, setFemaleFactors] = useState<string[]>(cycle.female_factors || []);
  const [maleFactors, setMaleFactors] = useState<string[]>(cycle.male_factors || []);
  const [treatmentAtOtherCentre, setTreatmentAtOtherCentre] = useState(
    Boolean(cycle.treatment_at_other_centre)
  );
  const [previousCentreName, setPreviousCentreName] = useState(
    cycle.previous_centre_name || ''
  );

  const [customFemaleFactor, setCustomFemaleFactor] = useState('');
  const [customMaleFactor, setCustomMaleFactor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Doctors list from auth
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Cycle types from backend master library
  const [cycleTypes, setCycleTypes] = useState<TreatmentTypeItem[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Load doctors
    setLoadingDoctors(true);
    authApi
      .getDoctors()
      .then((docs: any) => {
        if (Array.isArray(docs)) setDoctors(docs);
      })
      .catch(() => {
        authApi
          .listUsers({ role: 'doctor' })
          .then((users: any) => {
            if (Array.isArray(users)) setDoctors(users);
          })
          .catch(() => {});
      })
      .finally(() => setLoadingDoctors(false));

    // 2. Load cycle types (all 43 masters)
    setLoadingTypes(true);
    treatmentCyclesApi
      .getTypes()
      .then((types: any) => {
        if (Array.isArray(types) && types.length > 0) {
          const mapped: TreatmentTypeItem[] = types.map((t: any) => ({
            id: t.id || t.code || t.name,
            name: t.name,
            code: t.code || t.id,
            category: t.category || 'General',
            description: t.description || '',
          }));
          setCycleTypes(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTypes(false));

    // Close combobox when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allAvailableTypes: TreatmentTypeItem[] = useMemo(() => {
    const list: TreatmentTypeItem[] = [...DEFAULT_TREATMENT_TYPES];
    if (cycleTypes.length > 0) {
      cycleTypes.forEach((ct) => {
        const exists = list.some(
          (x) => x.id.toLowerCase() === ct.id?.toLowerCase() || x.name.toLowerCase() === ct.name?.toLowerCase()
        );
        if (!exists) {
          list.push(ct);
        }
      });
    }
    return list;
  }, [cycleTypes]);

  const filteredTreatmentTypes = useMemo(() => {
    const q = typeSearchQuery.trim().toLowerCase();
    if (!q) return allAvailableTypes;
    return allAvailableTypes.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.code && t.code.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
    );
  }, [allAvailableTypes, typeSearchQuery]);

  const currentSelectedType = useMemo(() => {
    if (!treatmentType) return null;
    return (
      allAvailableTypes.find(
        (t) => t.id === treatmentType || t.name === treatmentType || t.code === treatmentType
      ) || { id: treatmentType, name: treatmentType, description: 'Custom Treatment Modality' }
    );
  }, [allAvailableTypes, treatmentType]);

  const toggleFemaleFactor = (factor: string) => {
    setFemaleFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const toggleMaleFactor = (factor: string) => {
    setMaleFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleAddCustomFemale = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customFemaleFactor.trim();
    if (val && !femaleFactors.includes(val)) {
      setFemaleFactors([...femaleFactors, val]);
      setCustomFemaleFactor('');
      toast.success('Indication Added', `Added "${val}" to female factors.`);
    }
  };

  const handleAddCustomMale = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customMaleFactor.trim();
    if (val && !maleFactors.includes(val)) {
      setMaleFactors([...maleFactors, val]);
      setCustomMaleFactor('');
      toast.success('Indication Added', `Added "${val}" to male factors.`);
    }
  };

  const executeSave = async (shouldNavigateNext = false): Promise<boolean> => {
    if (!treatmentType?.trim()) {
      toast.warning('Modality Required', 'Please select an Intended Treatment Modality before proceeding.');
      return false;
    }

    const chosenDoctor = doctors.find((d: any) => d.id === treatingDoctorId);
    const resolvedDocName = chosenDoctor?.name
      ? (chosenDoctor.name.startsWith('Dr.') ? chosenDoctor.name : `Dr. ${chosenDoctor.name}`)
      : undefined;

    const payload = {
      treatment_type: treatmentType,
      attempt_number: Number(attemptNumber),
      start_date: startDate || cycle.start_date || new Date().toISOString().split('T')[0],
      treating_doctor_id: treatingDoctorId || undefined,
      doctor_name: resolvedDocName,
      treating_doctor_name: resolvedDocName,
      female_factors: femaleFactors,
      male_factors: maleFactors,
      treatment_at_other_centre: treatmentAtOtherCentre,
      previous_centre_name: treatmentAtOtherCentre ? previousCentreName : '',
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'Intended treatment parameters updated.');
      }
      if (shouldNavigateNext && onNavigateNext) {
        onNavigateNext();
      }
      return true;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Cycle Details Saved', 'Intended treatment parameters updated successfully.');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
      if (shouldNavigateNext && onNavigateNext) {
        onNavigateNext();
      }
      return true;
    } catch (err: any) {
      toast.error('Failed to save', err.message || 'An error occurred');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Intended Treatment &amp; Clinical Indication</h3>
          <p className="text-[11px] text-slate-500">
            Cycle modality, treating consultant, attempt number, and diagnosed parental indications
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
            {cycle.cycle_id || 'DRAFT'}
          </span>
          <button
            type="button"
            onClick={() => executeSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer disabled:opacity-50"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Details'}</span>
          </button>
          {onNavigateNext && (
            <button
              type="button"
              onClick={() => executeSave(true)}
              disabled={isSaving}
              className="px-4 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <span>Save &amp; Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* 1. Searchable Treatment Modality Combobox */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 relative" ref={typeDropdownRef}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Treatment Modality <span className="text-red-500">*</span>
            </label>
            {treatmentType && (
              <button
                type="button"
                onClick={() => {
                  setTreatmentType('');
                  setTypeSearchQuery('');
                }}
                className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div
            onClick={() => {
              const next = !typeDropdownOpen;
              setTypeDropdownOpen(next);
              if (next) {
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }}
            className={`w-full bg-white border rounded px-2.5 py-1.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-all select-none ${
              typeDropdownOpen
                ? 'border-primary ring-1 ring-primary'
                : treatmentType
                ? 'border-emerald-300 text-slate-900'
                : 'border-slate-300 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <Target className={`w-3.5 h-3.5 shrink-0 ${treatmentType ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="truncate">{currentSelectedType ? currentSelectedType.name : '— Select Modality —'}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${typeDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
          </div>

          {/* Searchable Dropdown List Popover */}
          {typeDropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ring-1 ring-black/5 animate-in fade-in duration-100 max-w-[340px] min-w-[280px]">
              <div className="p-2 border-b border-slate-100 bg-slate-50 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search ICSI, IVF, FET, IUI..."
                  value={typeSearchQuery}
                  onChange={(e) => setTypeSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md pl-7 pr-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
                {filteredTreatmentTypes.length > 0 ? (
                  filteredTreatmentTypes.map((t) => {
                    const isSelected = treatmentType === t.name || treatmentType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTreatmentType(t.name);
                          setTypeDropdownOpen(false);
                          setTypeSearchQuery('');
                        }}
                        className={`w-full px-2.5 py-1.5 text-left transition-colors flex items-center justify-between rounded-md cursor-pointer ${
                          isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0 pr-1 truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs truncate">{t.name}</span>
                            {t.category && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-500 shrink-0">
                                {t.category}
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-[10px] text-slate-400 truncate font-normal">{t.description}</p>
                          )}
                        </div>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching modalities found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. Attempt Number */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Attempt Number</label>
          <input
            type="number"
            min={1}
            max={20}
            value={attemptNumber}
            onChange={(e) => setAttemptNumber(Number(e.target.value))}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* 3. Cycle Start Date */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Cycle Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* 4. Treating Consultant (Dynamic Doctors Dropdown) */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1 flex items-center justify-between">
            <span>Treating Consultant</span>
            {loadingDoctors && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
          </label>
          <select
            value={treatingDoctorId}
            onChange={(e) => setTreatingDoctorId(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">— Select Consultant —</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} {d.specialization ? `(${d.specialization})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Previous treatments at another centre */}
      <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="otherCentreToggle"
            checked={treatmentAtOtherCentre}
            onChange={(e) => setTreatmentAtOtherCentre(e.target.checked)}
            className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
          />
          <label htmlFor="otherCentreToggle" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Patient received previous fertility treatments at another clinical centre</span>
          </label>
        </div>

        {treatmentAtOtherCentre && (
          <div className="pl-6 animate-in fade-in pt-1">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Previous Fertility Centre / Clinic Name
            </label>
            <input
              type="text"
              placeholder="e.g. Oasis Fertility, Cloudnine, Apollo Cradle, Nova IVF..."
              value={previousCentreName}
              onChange={(e) => setPreviousCentreName(e.target.value)}
              className="w-full sm:w-1/2 text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Indication Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Female Factors */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Female Clinical Factors
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{femaleFactors.length} selected</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_FEMALE_FACTORS.map((factor) => {
              const active = femaleFactors.includes(factor);
              return (
                <button
                  key={factor}
                  type="button"
                  onClick={() => toggleFemaleFactor(factor)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {factor}
                </button>
              );
            })}
          </div>

          {/* Custom Female Factors Display */}
          {femaleFactors.filter((f) => !COMMON_FEMALE_FACTORS.includes(f)).length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Added Factors:</span>
              <div className="flex flex-wrap gap-1.5">
                {femaleFactors.filter((f) => !COMMON_FEMALE_FACTORS.includes(f)).map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs"
                  >
                    <span>{factor}</span>
                    <button
                      type="button"
                      onClick={() => toggleFemaleFactor(factor)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Remove factor"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddCustomFemale} className="flex gap-2 pt-1">
            <input
              type="text"
              value={customFemaleFactor}
              onChange={(e) => setCustomFemaleFactor(e.target.value)}
              placeholder="Add other female indication..."
              className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        {/* Male Factors */}
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-500" /> Male Clinical Factors ({partner?.first_name || 'Partner'})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">{maleFactors.length} selected</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_MALE_FACTORS.map((factor) => {
              const active = maleFactors.includes(factor);
              return (
                <button
                  key={factor}
                  type="button"
                  onClick={() => toggleMaleFactor(factor)}
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white border-primary shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {factor}
                </button>
              );
            })}
          </div>

          {/* Custom Male Factors Display */}
          {maleFactors.filter((f) => !COMMON_MALE_FACTORS.includes(f)).length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Added Factors:</span>
              <div className="flex flex-wrap gap-1.5">
                {maleFactors.filter((f) => !COMMON_MALE_FACTORS.includes(f)).map((factor) => (
                  <span
                    key={factor}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs"
                  >
                    <span>{factor}</span>
                    <button
                      type="button"
                      onClick={() => toggleMaleFactor(factor)}
                      className="text-sky-500 hover:text-sky-700 hover:bg-sky-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Remove factor"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleAddCustomMale} className="flex gap-2 pt-1">
            <input
              type="text"
              value={customMaleFactor}
              onChange={(e) => setCustomMaleFactor(e.target.value)}
              placeholder="Add other male indication..."
              className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
