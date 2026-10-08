'use client';

import React, { useState } from 'react';
import { FlaskConical, Save, Check, ShieldCheck, Database } from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface GametesPanelProps {
  cycle: TreatmentCycleRecord;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onNavigateNext?: () => void;
}

export default function GametesPanel({ cycle, onUpdateCycle, onNavigateNext }: GametesPanelProps) {
  const currentGametes = cycle.gametes_source || {};

  const [oocyteSource, setOocyteSource] = useState<string>(
    currentGametes.oocyte_source || (cycle.treatment_type?.toLowerCase().includes('egg donation') ? 'donor' : 'self')
  );
  const [donorEggBank, setDonorEggBank] = useState<string>(currentGametes.donor_egg_bank || '');
  const [donorEggBatch, setDonorEggBatch] = useState<string>(currentGametes.donor_egg_batch || '');
  const [oocyteStorage, setOocyteStorage] = useState<string>(currentGametes.oocyte_storage || '');

  const [spermSource, setSpermSource] = useState<string>(
    currentGametes.sperm_source || (cycle.treatment_type?.toLowerCase().includes('donor sperm') ? 'donor' : 'partner_fresh')
  );
  const [spermSampleId, setSpermSampleId] = useState<string>(currentGametes.sperm_sample_id || '');
  const [donorSpermBank, setDonorSpermBank] = useState<string>(currentGametes.donor_sperm_bank || '');
  const [spermStorage, setSpermStorage] = useState<string>(currentGametes.sperm_storage || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (andNext = false) => {
    const payload = {
      gametes_source: {
        oocyte_source: oocyteSource,
        donor_egg_bank: donorEggBank,
        donor_egg_batch: donorEggBatch,
        oocyte_storage: oocyteStorage,
        sperm_source: spermSource,
        sperm_sample_id: spermSampleId,
        donor_sperm_bank: donorSpermBank,
        sperm_storage: spermStorage,
      },
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'Gamete source updated in draft.');
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
      return;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Gamete Sources Saved', 'Oocyte and sperm parameters updated successfully.');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
      if (andNext && onNavigateNext) {
        onNavigateNext();
      }
    } catch (err: any) {
      toast.error('Failed to save', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Gamete Source &amp; Cryo Straw Allocation</h3>
          <p className="text-[11px] text-slate-500">
            Self vs. ART Bank Donor Gametes, vitrification straw coordinates, and regulatory compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ART Act 2021 Compliant</span>
          </span>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save Details'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            <span>Save &amp; Next →</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Oocyte Source Card */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-rose-500" />
              <span>Oocyte (Female Gamete) Origin</span>
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              oocyteSource === 'donor'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}>
              {oocyteSource === 'donor' ? 'ART Registered Donor' : oocyteSource === 'vitrified_self' ? 'Vitrified Self' : 'Self Fresh Oocytes'}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Oocyte Source Type</label>
              <select
                value={oocyteSource}
                onChange={(e) => setOocyteSource(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="self">Self Patient (Fresh Ovarian Retrieval)</option>
                <option value="vitrified_self">Vitrified Self Oocytes (Social/Medical Preservation)</option>
                <option value="donor">Registered ART Bank Donor Oocyte</option>
              </select>
            </div>

            {oocyteSource === 'donor' && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">ART Donor Code / Bank</label>
                  <input
                    type="text"
                    placeholder="e.g. D-SP-044 (Govt Reg)"
                    value={donorEggBank}
                    onChange={(e) => setDonorEggBank(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Batch / Straw ID</label>
                  <input
                    type="text"
                    placeholder="e.g. STR-OOC-2026-089"
                    value={donorEggBatch}
                    onChange={(e) => setDonorEggBatch(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Physical Bio-Coordinates (Cryo Tank / Cane)</label>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Tank 02 / Canister 03 / Cane 01"
                  value={oocyteStorage}
                  onChange={(e) => setOocyteStorage(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sperm Source Card */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-primary" />
              <span>Sperm (Male Gamete) Origin</span>
            </h4>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              spermSource === 'donor'
                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}>
              {spermSource === 'donor' ? 'ART Bank Donor' : spermSource === 'surgical' ? 'Surgical Retrieval' : spermSource === 'partner_frozen' ? 'Partner Vitrified' : 'Partner Fresh Ejaculate'}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Sperm Source Type</label>
              <select
                value={spermSource}
                onChange={(e) => setSpermSource(e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="partner_fresh">Husband / Partner Fresh Ejaculate</option>
                <option value="partner_frozen">Husband Frozen Sperm (Cryo Bank Sample)</option>
                <option value="surgical">Surgical Sperm Retrieval (TESA / PESA / Micro-TESE)</option>
                <option value="donor">Registered ART Bank Donor Sample</option>
              </select>
            </div>

            {spermSource !== 'partner_fresh' && (
              <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Sample / Straw ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SPERM-CRYO-2026-012"
                    value={spermSampleId}
                    onChange={(e) => setSpermSampleId(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Donor Bank / Lab Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Cryo Bank D-89"
                    value={donorSpermBank}
                    onChange={(e) => setDonorSpermBank(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Physical Bio-Coordinates (Cryo Tank / Cane)</label>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Tank 01 / Canister 02 / Vial #04"
                  value={spermStorage}
                  onChange={(e) => setSpermStorage(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:ring-1 focus:ring-primary font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium">
          Step 2 of 7 · Gametes Source &amp; Cryo Allocation
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            {isSaved ? 'Saved' : 'Save Details'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <span>Save &amp; Next: PGS / PGD →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
