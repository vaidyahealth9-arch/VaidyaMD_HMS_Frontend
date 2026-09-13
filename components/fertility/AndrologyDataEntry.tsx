'use client';

import React, { useState, useEffect } from 'react';
import { andrologyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Save, ClipboardList, Printer } from 'lucide-react';

export interface AndrologyFormData {
  collection_date: string;
  abstinence_days: number | string;
  volume_ml: number | string;
  liquefaction_time_min: number | string;
  ph: number | string;
  pre_conc_million_ml: number | string;
  total_motility_pct: number | string;
  progressive_motility_pct: number | string;
  normal_forms_pct: number | string;
  dfi_total_pct: number | string;
  impression: string;
}

interface AndrologyDataEntryProps {
  patientId: string;
  patientName?: string;
  onUpdate?: () => void;
}

export default function AndrologyDataEntry({ patientId, patientName, onUpdate }: AndrologyDataEntryProps) {
  const { user } = useAuth();
  
  const [andrologyForm, setAndrologyForm] = useState<AndrologyFormData>({
    collection_date: new Date().toISOString().split('T')[0],
    abstinence_days: 3,
    volume_ml: '',
    liquefaction_time_min: '',
    ph: '',
    pre_conc_million_ml: '',
    total_motility_pct: '',
    progressive_motility_pct: '',
    normal_forms_pct: '',
    dfi_total_pct: '',
    impression: '',
  });
  
  const [isSavingAndrology, setIsSavingAndrology] = useState(false);
  const [andrologyHistory, setAndrologyHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!patientId) return;
    
    andrologyApi.list({ patient_id: patientId }).then((andRes: any) => {
      if (andRes && andRes.length > 0) {
        setAndrologyHistory(andRes);
        if (andRes[0].data) {
          setAndrologyForm((prev) => ({ ...prev, ...andRes[0].data }));
        }
      }
    }).catch((err) => console.error("Failed to load andrology data", err));
  }, [patientId]);

  const handleSaveAndrologyDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !user) {
      alert('No valid patient or user to record andrology data.');
      return;
    }
    setIsSavingAndrology(true);
    try {
      await andrologyApi.create({
        patient_id: patientId,
        record_type: 'casa_semen_analysis',
        data: andrologyForm,
        created_by: user.id,
      });
      alert('CASA Semen Analysis diagnostic report saved successfully!');
      
      // Refresh history
      const freshHistory = await andrologyApi.list({ patient_id: patientId });
      if (freshHistory) {
        setAndrologyHistory(freshHistory);
      }
      
      if (onUpdate) onUpdate();
    } catch (err: any) {
      alert(err.message || 'Failed to save andrology report');
    } finally {
      setIsSavingAndrology(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              Partner Andrology Diagnostics
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              CASA Semen Analysis & DFI: {patientName || 'Patient'}
            </h2>
            <p className="text-xs text-slate-500">WHO 6th Edition reference standards</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 inline mr-1" /> Print Report
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveAndrologyDirect} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
              <input
                type="number"
                value={andrologyForm.abstinence_days}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, abstinence_days: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume (mL)</label>
              <input
                type="number"
                step="0.1"
                value={andrologyForm.volume_ml}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, volume_ml: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Concentration (M/mL)</label>
              <input
                type="number"
                step="0.1"
                value={andrologyForm.pre_conc_million_ml}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, pre_conc_million_ml: e.target.value })}
                className="vmd-input text-xs font-bold text-indigo-900 w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive (PR) %</label>
              <input
                type="number"
                value={andrologyForm.progressive_motility_pct}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, progressive_motility_pct: e.target.value })}
                className="vmd-input text-xs font-bold text-emerald-800 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Normal Forms % (Kruger)</label>
              <input
                type="number"
                value={andrologyForm.normal_forms_pct}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, normal_forms_pct: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm DFI % (Halosperm)</label>
              <input
                type="number"
                value={andrologyForm.dfi_total_pct}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, dfi_total_pct: e.target.value })}
                className="vmd-input text-xs font-bold text-violet-800 w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Impression</label>
              <input
                type="text"
                value={andrologyForm.impression}
                onChange={(e) => setAndrologyForm({ ...andrologyForm, impression: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingAndrology}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-md transition-colors"
          >
            {isSavingAndrology ? 'Saving...' : <><Save className="w-3.5 h-3.5 inline mr-1" /> Save Andrology Metrics</>}
          </button>
        </form>
      </div>

      {/* Andrology History Records */}
      {andrologyHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-slate-600" /> Previous Semen Analysis Reports</h3>
          <div className="space-y-3">
            {andrologyHistory.map((rec: any, idx: number) => (
              <div key={rec.id || idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-700">
                    {rec.data?.collection_date || new Date(rec.created_at).toLocaleDateString('en-IN')}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rec.data?.impression?.toLowerCase().includes('normal') ? 'bg-emerald-100 text-emerald-800' :
                    rec.data?.impression?.toLowerCase().includes('asthen') ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>{rec.data?.impression || 'Report on File'}</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] text-slate-700">
                  <div><span className="text-slate-400 block font-bold">Volume</span><strong>{rec.data?.volume_ml ?? '—'} mL</strong></div>
                  <div><span className="text-slate-400 block font-bold">Conc (M/mL)</span><strong>{rec.data?.pre_conc_million_ml ?? '—'}</strong></div>
                  <div><span className="text-slate-400 block font-bold">PR Motility</span><strong>{rec.data?.progressive_motility_pct ?? '—'}%</strong></div>
                  <div><span className="text-slate-400 block font-bold">Normal Forms</span><strong>{rec.data?.normal_forms_pct ?? '—'}%</strong></div>
                  <div><span className="text-slate-400 block font-bold">DFI %</span><strong>{rec.data?.dfi_total_pct ?? '—'}%</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
