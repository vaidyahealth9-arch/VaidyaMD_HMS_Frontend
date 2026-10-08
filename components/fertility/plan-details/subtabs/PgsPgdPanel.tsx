'use client';

import React, { useState } from 'react';
import { Dna, Save, Check, Plus, Trash2, ShieldCheck, Microscope } from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface EmbryoBiopsyItem {
  id: string;
  embryo_id: string;
  biopsy_day: string;
  grade: string;
  result: 'Euploid' | 'Aneuploid' | 'Mosaic' | 'Inconclusive' | 'Pending';
  karyotype: string;
  disposition: 'Suitable for ET' | 'Not for Transfer' | 'Pending Genetic Review';
}

interface PgsPgdPanelProps {
  cycle: TreatmentCycleRecord;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onNavigateNext?: () => void;
}

export default function PgsPgdPanel({ cycle, onUpdateCycle, onNavigateNext }: PgsPgdPanelProps) {
  const currentPgs = cycle.pgs_pgd_data || {};

  const [testType, setTestType] = useState<string>(
    currentPgs.test_type || (cycle.treatment_type?.toUpperCase().includes('PGT') ? 'PGT-A' : 'PGT-A')
  );
  const [indication, setIndication] = useState<string>(
    currentPgs.indication || ''
  );
  const [biopsyStage, setBiopsyStage] = useState<string>(
    currentPgs.biopsy_stage || 'Day 5 / Day 6 Trophectoderm (TE)'
  );
  const [referenceLab, setReferenceLab] = useState<string>(
    currentPgs.reference_lab || ''
  );
  const [sampleDate, setSampleDate] = useState<string>(currentPgs.sample_sent_date || '');
  const [reportStatus, setReportStatus] = useState<string>(
    currentPgs.status || 'Pending'
  );

  const [embryos, setEmbryos] = useState<EmbryoBiopsyItem[]>(
    Array.isArray(currentPgs.embryos) ? currentPgs.embryos : []
  );

  // Quick add embryo state
  const [newEmbryoId, setNewEmbryoId] = useState('');
  const [newBiopsyDay, setNewBiopsyDay] = useState('Day 5');
  const [newGrade, setNewGrade] = useState('4AA');
  const [newResult, setNewResult] = useState<EmbryoBiopsyItem['result']>('Pending');
  const [newKaryotype, setNewKaryotype] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddEmbryo = (e: React.FormEvent) => {
    e.preventDefault();
    const idVal = newEmbryoId.trim() || `E${embryos.length + 1}`;
    const newEntry: EmbryoBiopsyItem = {
      id: `emb-${Date.now()}`,
      embryo_id: idVal,
      biopsy_day: newBiopsyDay,
      grade: newGrade,
      result: newResult,
      karyotype: newKaryotype.trim() || (newResult === 'Euploid' ? '46,XX/XY Normal' : 'Pending NGS'),
      disposition:
        newResult === 'Euploid'
          ? 'Suitable for ET'
          : newResult === 'Aneuploid'
          ? 'Not for Transfer'
          : 'Pending Genetic Review',
    };
    setEmbryos([...embryos, newEntry]);
    setNewEmbryoId('');
    setNewKaryotype('');
  };

  const handleRemoveEmbryo = (id: string) => {
    setEmbryos(embryos.filter((e) => e.id !== id));
  };

  const handleUpdateEmbryo = (id: string, field: keyof EmbryoBiopsyItem, value: any) => {
    setEmbryos(
      embryos.map((e) => {
        if (e.id !== id) return e;
        const updated = { ...e, [field]: value };
        if (field === 'result') {
          if (value === 'Euploid') updated.disposition = 'Suitable for ET';
          else if (value === 'Aneuploid') updated.disposition = 'Not for Transfer';
          else updated.disposition = 'Pending Genetic Review';
        }
        return updated;
      })
    );
  };

  const handleSave = async (andNext = false) => {
    const payload = {
      pgs_pgd_data: {
        test_type: testType,
        indication,
        biopsy_stage: biopsyStage,
        reference_lab: referenceLab,
        sample_sent_date: sampleDate,
        status: reportStatus,
        embryos,
      },
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'PGT parameters updated in draft.');
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
      toast.success('PGT Parameters Saved', 'Pre-implantation genetic screening records updated.');
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

  const euploidCount = embryos.filter((e) => e.result === 'Euploid').length;
  const aneuploidCount = embryos.filter((e) => e.result === 'Aneuploid').length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Dna className="w-4 h-4 text-primary" />
            <span>Pre-implantation Genetic Screening (PGS / PGD / PGT)</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Trophectoderm biopsy logs, NGS aneuploidy testing, and embryo genetic clearance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Euploid Yield: {euploidCount}/{embryos.length}</span>
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

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Testing Modality</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          >
            <option value="PGT-A">PGT-A (Aneuploidy Screening - 24 Chromosomes)</option>
            <option value="PGT-M">PGT-M (Monogenic / Single-Gene Disorder)</option>
            <option value="PGT-SR">PGT-SR (Structural Rearrangements / Translocation)</option>
            <option value="PGT-A + PGT-M">PGT-A + PGT-M Combined Analysis</option>
          </select>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Biopsy Indication</label>
          <input
            type="text"
            value={indication}
            onChange={(e) => setIndication(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Biopsy Stage</label>
          <select
            value={biopsyStage}
            onChange={(e) => setBiopsyStage(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          >
            <option value="Day 5 / Day 6 Trophectoderm (TE)">Day 5 / Day 6 Trophectoderm (TE)</option>
            <option value="Day 3 Cleavage (Blastomere)">Day 3 Cleavage (Blastomere)</option>
            <option value="Polar Body Biopsy">Polar Body Biopsy</option>
          </select>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Reference Genetics Lab</label>
          <input
            type="text"
            value={referenceLab}
            onChange={(e) => setReferenceLab(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Sample Sent Date</label>
          <input
            type="date"
            value={sampleDate}
            onChange={(e) => setSampleDate(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Report Status</label>
          <select
            value={reportStatus}
            onChange={(e) => setReportStatus(e.target.value)}
            className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
          >
            <option value="Report Received">Report Received &amp; Verified</option>
            <option value="Biopsy Pending">Biopsy Pending</option>
            <option value="Sample in Transit">Sample in Transit</option>
            <option value="Sequencing in Progress">Sequencing in Progress</option>
            <option value="Not Indicated">Not Indicated</option>
          </select>
        </div>
      </div>

      {/* Add Embryo Biopsy Record Card */}
      <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-slate-800">Add Embryo Biopsy Record</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Record trophectoderm biopsy results &amp; genetic clearance</span>
        </div>

        <form onSubmit={handleAddEmbryo} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Embryo ID</label>
            <input
              type="text"
              placeholder={`e.g. E${embryos.length + 1}`}
              value={newEmbryoId}
              onChange={(e) => setNewEmbryoId(e.target.value)}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Biopsy Day</label>
            <select
              value={newBiopsyDay}
              onChange={(e) => setNewBiopsyDay(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            >
              <option value="Day 3">Day 3</option>
              <option value="Day 5">Day 5</option>
              <option value="Day 6">Day 6</option>
              <option value="Day 7">Day 7</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Grade</label>
            <input
              type="text"
              placeholder="e.g. 4AA"
              value={newGrade}
              onChange={(e) => setNewGrade(e.target.value)}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">NGS Result</label>
            <select
              value={newResult}
              onChange={(e) => {
                const res = e.target.value as EmbryoBiopsyItem['result'];
                setNewResult(res);
                if (res === 'Euploid') {
                  setNewKaryotype('46,XX/XY Normal');
                } else if (res === 'Aneuploid') {
                  setNewKaryotype('Aneuploid (Abnormal)');
                } else if (res === 'Pending') {
                  setNewKaryotype('');
                }
              }}
              className="w-full text-xs font-bold bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            >
              <option value="Pending">Pending NGS</option>
              <option value="Euploid">Euploid (Normal)</option>
              <option value="Aneuploid">Aneuploid (Abnormal)</option>
              <option value="Mosaic">Mosaic (Low/High Level)</option>
              <option value="Inconclusive">Inconclusive (Re-biopsy)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Karyotype Finding</label>
            <input
              type="text"
              placeholder="e.g. 46,XX Normal"
              value={newKaryotype}
              onChange={(e) => setNewKaryotype(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-600 block mb-1">Disposition</label>
            <div className="text-xs font-bold py-1.5 px-2 bg-slate-100 rounded border border-slate-200 text-slate-700 truncate">
              {newResult === 'Euploid'
                ? 'Suitable for ET'
                : newResult === 'Aneuploid'
                ? 'Not for Transfer'
                : 'Pending Genetic Review'}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-98 whitespace-nowrap h-[32px] flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Roster</span>
            </button>
          </div>
        </form>
      </div>

      {/* Biopsy Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Microscope className="w-4 h-4 text-primary" />
            <span>Embryo Biopsy &amp; Genetic Clearance Roster</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {embryos.length} Biopsied ({euploidCount} Euploid, {aneuploidCount} Aneuploid)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-24">Embryo ID</th>
                <th className="py-2.5 px-3 w-24">Biopsy Day</th>
                <th className="py-2.5 px-3 w-20">Grade</th>
                <th className="py-2.5 px-3 w-36">NGS Result</th>
                <th className="py-2.5 px-3 min-w-[150px]">Karyotype Finding</th>
                <th className="py-2.5 px-3 w-44">Transfer Disposition</th>
                <th className="py-2.5 px-3 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {embryos.length > 0 ? (
                embryos.map((emb) => (
                  <tr key={emb.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0B4F6C]">
                      {emb.embryo_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">
                      {emb.biopsy_day}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      {emb.grade}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          emb.result === 'Euploid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : emb.result === 'Aneuploid'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : emb.result === 'Mosaic'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {emb.result}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {emb.karyotype || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`text-xs font-bold ${
                          emb.disposition === 'Suitable for ET'
                            ? 'text-emerald-700'
                            : emb.disposition === 'Not for Transfer'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {emb.disposition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveEmbryo(emb.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Remove embryo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    No embryo biopsy records added yet. Use the form above to add biopsied embryos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-500 font-medium">
          Step 3 of 7 · Pre-implantation Genetic Testing (PGT)
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
            <span>Save &amp; Next: Treatment Protocol →</span>
          </button>
        </div>
      </div>
    </div>
  );
}

