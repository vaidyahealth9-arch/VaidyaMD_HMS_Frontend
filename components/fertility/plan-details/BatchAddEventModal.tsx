'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pill, Activity, Droplet, Syringe, Plus, X, ChevronDown } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export interface BatchAddEventPayload {
  category: 'medication' | 'scan' | 'lab' | 'procedure';
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
  notes?: string;
  targetDays: number[];
}

interface BatchAddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: number[];
  allDays: any[];
  drugList?: string[];
  onApplyAdd: (payload: BatchAddEventPayload) => void;
}

const COMMON_FERTILITY_MEDS = [
  'rFSH (Gonal-F / Rekovelle)',
  'HMG (Menopur)',
  'GnRH Antagonist (Cetrotide / Orgalutran)',
  'GnRH Agonist (Leuprolide / Lupride)',
  'r-hCG / Ovitrelle 250mcg',
  'Progesterone (Susten / Gestone / Dubagest)',
  'Estradiol Valerate (Progynova)',
  'Aspirin 75mg',
  'Low Molecular Weight Heparin (Clexane)',
  'Headon (Somatropin / Growth Hormone)',
];

export default function BatchAddEventModal({
  isOpen,
  onClose,
  selectedDays,
  allDays,
  drugList = COMMON_FERTILITY_MEDS,
  onApplyAdd,
}: BatchAddEventModalProps) {
  const [category, setCategory] = useState<'medication' | 'scan' | 'lab' | 'procedure'>('medication');
  const [medName, setMedName] = useState('');
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);
  const [medDose, setMedDose] = useState('');
  const [medRoute, setMedRoute] = useState('SC');
  const [medFrequency, setMedFrequency] = useState('OD');
  const [scanType, setScanType] = useState('Follicle Tracking');
  const [labName, setLabName] = useState('Estradiol (E2)');
  const [procName, setProcName] = useState('Oocyte Pick-Up (OPU)');
  const [notes, setNotes] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen || selectedDays.length === 0) return null;

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const displayDaysText =
    sortedDays.length <= 4
      ? sortedDays.map((d) => `Day ${d}`).join(', ')
      : `Day ${sortedDays[0]} to Day ${sortedDays[sortedDays.length - 1]} (${sortedDays.length} days)`;

  const availableMeds = Array.from(new Set([...drugList, ...COMMON_FERTILITY_MEDS]));
  const filteredMeds = medName.trim()
    ? availableMeds.filter((m) => m.toLowerCase().includes(medName.toLowerCase()))
    : availableMeds;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let name = '';
    let dose = '';
    let route = '';
    let frequency = '';

    if (category === 'medication') {
      name = medName.trim();
      dose = medDose.trim();
      route = medRoute;
      frequency = medFrequency;
    } else if (category === 'scan') {
      name = scanType.trim();
    } else if (category === 'lab') {
      name = labName.trim();
    } else if (category === 'procedure') {
      name = procName.trim();
    }

    if (!name) return;

    onApplyAdd({
      category,
      name,
      dose,
      route,
      frequency,
      notes: notes.trim(),
      targetDays: sortedDays,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-visible animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200 rounded-t-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Batch Add Event to Days</h3>
            <p className="text-[11px] text-slate-500 font-medium">Applying to: {displayDaysText}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 p-1 gap-1">
          <button
            type="button"
            onClick={() => setCategory('medication')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              category === 'medication' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medication</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('scan')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              category === 'scan' ? 'bg-white text-primary shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('lab')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              category === 'lab' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Lab</span>
          </button>
          <button
            type="button"
            onClick={() => setCategory('procedure')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              category === 'procedure' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Syringe className="w-3.5 h-3.5" />
            <span>Procedure</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {category === 'medication' && (
            <div className="space-y-3">
              <div ref={dropdownRef} className="relative">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Medication Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={medName}
                    onChange={(e) => {
                      setMedName(e.target.value);
                      setIsMedDropdownOpen(true);
                    }}
                    onFocus={() => setIsMedDropdownOpen(true)}
                    placeholder="Type or select medication..."
                    className="w-full text-xs px-3 py-2 pr-8 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsMedDropdownOpen((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Styled Clean White Dropdown Popup */}
                {isMedDropdownOpen && (
                  <div className="absolute z-60 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-50 animate-in fade-in zoom-in-95">
                    {filteredMeds.length > 0 ? (
                      filteredMeds.map((drug) => (
                        <div
                          key={drug}
                          onClick={() => {
                            setMedName(drug);
                            setIsMedDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-xs text-slate-800 hover:bg-slate-100 hover:text-primary cursor-pointer font-medium transition-colors"
                        >
                          {drug}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-400 italic">No exact match — use &quot;{medName}&quot;</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Dose *</label>
                  <input
                    type="text"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                    placeholder="e.g. 150 IU"
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Route</label>
                  <select
                    value={medRoute}
                    onChange={(e) => setMedRoute(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                  >
                    <option value="SC">SC (Subcut)</option>
                    <option value="IM">IM (Intramusc)</option>
                    <option value="Oral">Oral</option>
                    <option value="Vaginal">Vaginal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Frequency</label>
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
                  >
                    <option value="OD">OD (Once daily)</option>
                    <option value="BD">BD (Twice daily)</option>
                    <option value="TDS">TDS (Thrice daily)</option>
                    <option value="HS">HS (At bedtime)</option>
                    <option value="PRN">PRN (As needed)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {category === 'scan' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Scan Type</label>
              <select
                value={scanType}
                onChange={(e) => setScanType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
              >
                <option value="Follicle Tracking">Follicle Tracking (TVS)</option>
                <option value="Baseline TVS Scan">Baseline TVS Scan</option>
                <option value="Trigger Scan">Trigger Scan</option>
                <option value="Endometrial Receptivity">Endometrial Receptivity Scan</option>
              </select>
            </div>
          )}

          {category === 'lab' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Lab Investigation</label>
              <select
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
              >
                <option value="Estradiol (E2)">Serum Estradiol (E2)</option>
                <option value="Progesterone (P4)">Serum Progesterone (P4)</option>
                <option value="Luteinising Hormone (LH)">Serum LH</option>
                <option value="Serum Beta hCG">Serum Beta hCG</option>
              </select>
            </div>
          )}

          {category === 'procedure' && (
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Clinical Procedure</label>
              <select
                value={procName}
                onChange={(e) => setProcName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-800"
              >
                <option value="Oocyte Pick-Up (OPU)">Oocyte Pick-Up (OPU)</option>
                <option value="Embryo Transfer (ET)">Embryo Transfer (ET)</option>
                <option value="Intrauterine Insemination (IUI)">Intrauterine Insemination (IUI)</option>
                <option value="Sperm Retrieval (PESA/TESA)">Sperm Retrieval (PESA/TESA)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Optional Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. In evening; fasting required; 36h post-trigger"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary-mid text-white text-xs font-bold h-8 px-4 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
