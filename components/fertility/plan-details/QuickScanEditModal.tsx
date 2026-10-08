'use client';

import React, { useState } from 'react';
import {
  Activity,
  Pill,
  Droplet,
  Syringe,
  Plus,
  Trash2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { parseFollicleTokens, isProcedureName } from './utils';

export type DayEventCategory = 'scan' | 'medication' | 'lab' | 'procedure';

interface QuickScanEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: any;
  onSaveScan: (updatedDay: any) => void;
  initialCategory?: DayEventCategory;
}

export default function QuickScanEditModal({
  isOpen,
  onClose,
  day,
  onSaveScan,
  initialCategory,
}: QuickScanEditModalProps) {
  // Determine starting active tab
  const defaultTab: DayEventCategory =
    initialCategory || day?._initialCategory || (day?.right_follicles || day?.left_follicles || day?.endometrium_mm ? 'scan' : 'medication');

  const [activeTab, setActiveTab] = useState<DayEventCategory>(defaultTab);

  // Editable day state
  const [currentDay, setCurrentDay] = useState<any>(() => ({
    ...day,
    medications: Array.isArray(day?.medications) ? [...day.medications] : [],
    scans: Array.isArray(day?.scans) ? [...day.scans] : [],
    investigations: Array.isArray(day?.investigations) ? [...day.investigations] : [],
    procedures: Array.isArray(day?.procedures) ? [...day.procedures] : [],
    right_follicles: day?.right_follicles || '',
    left_follicles: day?.left_follicles || '',
    endometrium_mm: day?.endometrium_mm || '',
    endometrial_pattern: day?.endometrial_pattern || 'Trilaminar',
    e2_pgml: day?.e2_pgml || '',
    p4_ngml: day?.p4_ngml || '',
    lh_miu: day?.lh_miu || '',
    milestone: day?.milestone || '',
    notes: day?.notes || '',
  }));

  // Quick addition local form states
  // 1. Medication
  const [medForm, setMedForm] = useState({
    name: '',
    dose: '150 IU',
    route: 'SC',
    frequency: 'OD',
    notes: '',
  });

  // 2. Scan
  const [scanType, setScanType] = useState(
    currentDay.milestone && !isProcedureName(currentDay.milestone)
      ? currentDay.milestone
      : currentDay.day_number <= 2
      ? 'Baseline TVS Scan'
      : 'Follicle Tracking'
  );

  // 3. Lab
  const [labForm, setLabForm] = useState({
    testName: 'Estradiol (E2)',
    val: '',
  });

  // 4. Procedure
  const [procForm, setProcForm] = useState({
    name: '',
    notes: '',
  });

  if (!isOpen || !day) return null;

  const rParsed = parseFollicleTokens(currentDay.right_follicles);
  const lParsed = parseFollicleTokens(currentDay.left_follicles);

  // Handlers for adding items
  const handleAddMedication = () => {
    if (!medForm.name.trim()) return;
    const newMeds = [
      ...currentDay.medications,
      {
        id: `med-${currentDay.day_number}-${Date.now()}`,
        drug_name: medForm.name.trim(),
        dose: medForm.dose.trim(),
        route: medForm.route,
        frequency: medForm.frequency,
        status: 'planned',
        instructions: medForm.notes.trim() || undefined,
      },
    ];
    setCurrentDay((prev: any) => ({ ...prev, medications: newMeds }));
    setMedForm({ name: '', dose: '150 IU', route: 'SC', frequency: 'OD', notes: '' });
  };

  const handleRemoveMedication = (idx: number) => {
    setCurrentDay((prev: any) => ({
      ...prev,
      medications: prev.medications.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleAddLab = () => {
    if (!labForm.testName.trim()) return;
    const name = labForm.testName.trim();
    const val = labForm.val.trim();

    const updated = { ...currentDay };
    const lower = name.toLowerCase();

    if (lower.includes('estradiol') || lower.includes('e2')) {
      updated.e2_pgml = val;
    } else if (lower.includes('luteinising') || lower.includes('lh')) {
      updated.lh_miu = val;
    } else if (lower.includes('progesterone') || lower.includes('p4')) {
      updated.p4_ngml = val;
    }

    if (!updated.investigations.includes(name)) {
      updated.investigations = [...updated.investigations, name];
    }
    setCurrentDay(updated);
    setLabForm({ testName: 'Estradiol (E2)', val: '' });
  };

  const handleRemoveLab = (testName: string) => {
    const updated = { ...currentDay };
    const lower = testName.toLowerCase();
    if (lower.includes('estradiol') || lower.includes('e2')) updated.e2_pgml = '';
    if (lower.includes('luteinising') || lower.includes('lh')) updated.lh_miu = '';
    if (lower.includes('progesterone') || lower.includes('p4')) updated.p4_ngml = '';
    updated.investigations = updated.investigations.filter((x: string) => x !== testName);
    setCurrentDay(updated);
  };

  const handleAddProcedure = () => {
    if (!procForm.name.trim()) return;
    const pName = procForm.name.trim();
    const newProcs = [...currentDay.procedures.filter((p: string) => p !== pName), pName];
    // Remove from scans if present
    const cleanScans = currentDay.scans.filter((s: string) => s !== pName);

    setCurrentDay((prev: any) => ({
      ...prev,
      procedures: newProcs,
      scans: cleanScans,
      milestone: prev.milestone || pName,
      notes: procForm.notes.trim() ? `${prev.notes ? `${prev.notes}; ` : ''}${procForm.notes.trim()}` : prev.notes,
    }));
    setProcForm({ name: '', notes: '' });
  };

  const handleRemoveProcedure = (pName: string) => {
    setCurrentDay((prev: any) => ({
      ...prev,
      procedures: prev.procedures.filter((p: string) => p !== pName),
      milestone: prev.milestone === pName ? '' : prev.milestone,
    }));
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // If scan was edited, ensure scan title is reflected
    const updated = { ...currentDay };
    if (scanType && !isProcedureName(scanType)) {
      if (!updated.scans.includes(scanType)) {
        updated.scans = [...updated.scans, scanType];
      }
      if (!updated.milestone || isProcedureName(updated.milestone)) {
        // preserve procedure if any, otherwise set scan
        if (updated.procedures.length === 0) {
          updated.milestone = scanType;
        }
      }
    }

    onSaveScan(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded bg-primary text-white">
                Day {day.day_number}
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Clinical Event &amp; Day Monitoring
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {day.display_date} ({day.day_of_week}) · Scheduled Modality Entry
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs Header (Identical to Normal View) */}
        <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scan'
                ? 'bg-white text-primary shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>🩺 Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('medication')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'medication'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>💊 Medication</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lab')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lab'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>🩸 Lab Test</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('procedure')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'procedure'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>🧫 Procedure</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Items Summary Strip for this Day */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1.5">
              Scheduled on Day {day.day_number}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {/* Medications chips */}
              {currentDay.medications.map((m: any, idx: number) => (
                <span
                  key={`m-${idx}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md"
                >
                  <Pill className="w-3 h-3 text-amber-700" />
                  <span>{(m.drug_name || m.name).split('(')[0].trim()} - {m.dose}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMedication(idx)}
                    className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                    title="Remove medication"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Procedures chips */}
              {currentDay.procedures.map((proc: string, idx: number) => (
                <span
                  key={`p-${idx}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-md"
                >
                  <Syringe className="w-3 h-3 text-purple-700" />
                  <span>{proc}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProcedure(proc)}
                    className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                    title="Remove procedure"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Lab chips */}
              {currentDay.e2_pgml && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-md">
                  <Droplet className="w-3 h-3 text-rose-700" />
                  <span>E2: {currentDay.e2_pgml}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLab('Estradiol (E2)')}
                    className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentDay.lh_miu && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-md">
                  <Droplet className="w-3 h-3 text-rose-700" />
                  <span>LH: {currentDay.lh_miu}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLab('Luteinising Hormone (LH)')}
                    className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentDay.p4_ngml && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-md">
                  <Droplet className="w-3 h-3 text-rose-700" />
                  <span>P4: {currentDay.p4_ngml}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLab('Progesterone (P4)')}
                    className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {currentDay.investigations
                ?.filter(
                  (i: string) =>
                    !i.toLowerCase().includes('estradiol') &&
                    !i.toLowerCase().includes('luteinising') &&
                    !i.toLowerCase().includes('progesterone')
                )
                .map((inv: string, idx: number) => (
                  <span
                    key={`inv-${idx}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md"
                  >
                    <Droplet className="w-3 h-3 text-rose-600" />
                    <span>{inv}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLab(inv)}
                      className="hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}

              {/* Scan summary chip */}
              {(currentDay.endometrium_mm || currentDay.right_follicles || currentDay.left_follicles) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-100 text-sky-900 border border-sky-300 px-2 py-0.5 rounded-md">
                  <Activity className="w-3 h-3 text-sky-700" />
                  <span>
                    ET {currentDay.endometrium_mm || '-'}mm
                    {currentDay.right_follicles ? ` · R:${currentDay.right_follicles}` : ''}
                    {currentDay.left_follicles ? ` · L:${currentDay.left_follicles}` : ''}
                  </span>
                </span>
              )}

              {currentDay.medications.length === 0 &&
                currentDay.procedures.length === 0 &&
                !currentDay.e2_pgml &&
                !currentDay.lh_miu &&
                !currentDay.endometrium_mm &&
                !currentDay.right_follicles && (
                  <span className="text-[11px] text-slate-400 italic">
                    No items scheduled yet for this day. Use the tabs below to add items.
                  </span>
                )}
            </div>
          </div>

          {/* TAB 1: ULTRASOUND SCAN */}
          {activeTab === 'scan' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Scan Checkpoint / Title
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Baseline TVS Scan', 'Follicle Tracking', 'Trigger Scan', 'Endometrial Receptivity'].map(
                    (title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setScanType(title)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                          scanType === title
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {title}
                      </button>
                    )
                  )}
                </div>
                <input
                  type="text"
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  placeholder="e.g. Follicle Tracking Day 8"
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-rose-900 block mb-1">
                    Right Ovary Follicles (mm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18, 16, 14, 11"
                    value={currentDay.right_follicles}
                    onChange={(e) =>
                      setCurrentDay({ ...currentDay, right_follicles: e.target.value })
                    }
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg font-mono text-slate-900 font-semibold"
                  />
                  {rParsed.tokens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {rParsed.tokens.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.category === 'mature'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : t.category === 'intermediate'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.mm}mm
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-rose-900 block mb-1">
                    Left Ovary Follicles (mm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 17, 15, 12, 10"
                    value={currentDay.left_follicles}
                    onChange={(e) =>
                      setCurrentDay({ ...currentDay, left_follicles: e.target.value })
                    }
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg font-mono text-slate-900 font-semibold"
                  />
                  {lParsed.tokens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {lParsed.tokens.map((t, idx) => (
                        <span
                          key={idx}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.category === 'mature'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : t.category === 'intermediate'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.mm}mm
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Endometrial Thickness (mm)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5"
                    value={currentDay.endometrium_mm}
                    onChange={(e) =>
                      setCurrentDay({ ...currentDay, endometrium_mm: e.target.value })
                    }
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Endometrial Pattern
                  </label>
                  <select
                    value={currentDay.endometrial_pattern}
                    onChange={(e) =>
                      setCurrentDay({ ...currentDay, endometrial_pattern: e.target.value })
                    }
                    className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-800 font-semibold bg-white"
                  >
                    <option value="Trilaminar">Trilaminar (Triple Line)</option>
                    <option value="Homogeneous">Homogeneous</option>
                    <option value="Heterogeneous">Heterogeneous</option>
                    <option value="Echogenic">Echogenic</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEDICATION */}
          {activeTab === 'medication' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select or Enter Medication
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Follisurge',
                    'Menopur',
                    'Cetrotide',
                    'Decapeptyl',
                    'Duphaston',
                    'Inj Proluton Depot',
                    'Coriosurge (hCG)',
                    'PINKLETRO',
                    'Meprate',
                    'DEXONA',
                    'HEADON',
                  ].map((drug) => (
                    <button
                      key={drug}
                      type="button"
                      onClick={() => setMedForm({ ...medForm, name: drug })}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      + {drug}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Follisurge (rFSH)"
                  value={medForm.name}
                  onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dose</label>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {['150 IU', '225 IU', '300 IU', '0.25 mg', '2.5 mg', '1 tab'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setMedForm({ ...medForm, dose: d })}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={medForm.dose}
                    onChange={(e) => setMedForm({ ...medForm, dose: e.target.value })}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg font-bold text-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Route</label>
                  <select
                    value={medForm.route}
                    onChange={(e) => setMedForm({ ...medForm, route: e.target.value })}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold"
                  >
                    <option value="SC">SC (Subcutaneous)</option>
                    <option value="IM">IM (Intramuscular)</option>
                    <option value="Oral">Oral</option>
                    <option value="Vaginal">Vaginal</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Frequency</label>
                  <select
                    value={medForm.frequency}
                    onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                    className="w-full text-xs py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold"
                  >
                    <option value="OD">OD (Once Daily)</option>
                    <option value="BD">BD (Twice Daily)</option>
                    <option value="TID">TID (Thrice Daily)</option>
                    <option value="Stat">Stat (Single Dose)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Instructions / Time (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9:00 PM after food"
                  value={medForm.notes}
                  onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMedication}
                disabled={!medForm.name.trim()}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-99"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Medication to Day {day.day_number}</span>
              </button>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC LAB */}
          {activeTab === 'lab' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Diagnostic Test
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Estradiol (E2)',
                    'Luteinising Hormone (LH)',
                    'Progesterone (P4)',
                    'Beta hCG',
                    'Complete Blood Picture (CBP)',
                    'Liver Function Test (LFT)',
                    'Thyroid Stimulating Hormone (TSH)',
                    'AMH',
                  ].map((test) => (
                    <button
                      key={test}
                      type="button"
                      onClick={() => setLabForm({ ...labForm, testName: test })}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md border border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100 cursor-pointer transition-colors"
                    >
                      + {test}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={labForm.testName}
                  onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Test Result / Value (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 209 pg/ml, 14.2 mIU/ml, 1.1 ng/ml"
                  value={labForm.val}
                  onChange={(e) => setLabForm({ ...labForm, val: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg font-bold text-rose-900"
                />
              </div>

              <button
                type="button"
                onClick={handleAddLab}
                disabled={!labForm.testName.trim()}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-99"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Lab Test to Day {day.day_number}</span>
              </button>
            </div>
          )}

          {/* TAB 4: CLINICAL PROCEDURE */}
          {activeTab === 'procedure' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Clinical Procedure
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'IUI-H (Day 1)',
                    'IUI-H (Day 2)',
                    'Oocyte Pick-Up (OPU / Egg Retrieval)',
                    'Embryo Transfer (ET)',
                    'Cyst Aspiration',
                    'PESA / TESA / TESE',
                    'Diagnostic Hysteroscopy',
                  ].map((proc) => (
                    <button
                      key={proc}
                      type="button"
                      onClick={() => setProcForm({ ...procForm, name: proc })}
                      className="text-[11px] font-semibold px-2 py-1 rounded-md border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 cursor-pointer transition-colors"
                    >
                      + {proc}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Oocyte Pick-Up (OPU / Egg Retrieval)"
                  value={procForm.name}
                  onChange={(e) => setProcForm({ ...procForm, name: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-purple-900 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Procedure Instructions / Anesthesia Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. GA planned, NBM from 6 AM, semen collection at 8 AM"
                  value={procForm.notes}
                  onChange={(e) => setProcForm({ ...procForm, notes: e.target.value })}
                  className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={handleAddProcedure}
                disabled={!procForm.name.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-99"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Procedure to Day {day.day_number}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save &amp; Apply to Day {day.day_number}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
