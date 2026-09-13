'use client';

import React, { useState, useEffect } from 'react';
import {
  Dna,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Sparkles,
} from 'lucide-react';

export interface DFIHaloData {
  total_sperm_evaluated: number;
  big_halo_count: number;
  medium_halo_count: number;
  small_halo_count: number;
  without_halo_count: number;
  degraded_count: number;
}

export interface DFIHaloChartProps {
  initialData?: Partial<DFIHaloData>;
  onChange?: (dfiTotalPct: number, data: DFIHaloData) => void;
  readonly?: boolean;
}

export default function DFIHaloChart({
  initialData,
  onChange,
  readonly = false,
}: DFIHaloChartProps) {
  const [counts, setCounts] = useState<DFIHaloData>({
    total_sperm_evaluated: initialData?.total_sperm_evaluated ?? 500,
    big_halo_count: initialData?.big_halo_count ?? 260,
    medium_halo_count: initialData?.medium_halo_count ?? 145,
    small_halo_count: initialData?.small_halo_count ?? 45,
    without_halo_count: initialData?.without_halo_count ?? 32,
    degraded_count: initialData?.degraded_count ?? 18,
  });

  const totalEvaluated =
    counts.big_halo_count +
    counts.medium_halo_count +
    counts.small_halo_count +
    counts.without_halo_count +
    counts.degraded_count;

  const bigHaloPct = totalEvaluated > 0 ? (counts.big_halo_count / totalEvaluated) * 100 : 0;
  const mediumHaloPct = totalEvaluated > 0 ? (counts.medium_halo_count / totalEvaluated) * 100 : 0;
  const smallHaloPct = totalEvaluated > 0 ? (counts.small_halo_count / totalEvaluated) * 100 : 0;
  const withoutHaloPct = totalEvaluated > 0 ? (counts.without_halo_count / totalEvaluated) * 100 : 0;
  const degradedPct = totalEvaluated > 0 ? (counts.degraded_count / totalEvaluated) * 100 : 0;

  // Intact DNA vs Fragmented DNA
  const intactPct = bigHaloPct + mediumHaloPct;
  const dfiTotalPct = smallHaloPct + withoutHaloPct + degradedPct;

  useEffect(() => {
    onChange?.(parseFloat(dfiTotalPct.toFixed(1)), counts);
  }, [counts, dfiTotalPct]);

  // Clinical Thresholds & Recommendations
  let threshold = {
    category: 'Excellent / Normal DNA Integrity',
    dfiLabel: 'Low DFI (<15%)',
    color: 'emerald',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    barClass: 'bg-emerald-500',
    icon: CheckCircle2,
    interpretation:
      'Normal sperm chromatin integrity. Excellent blastulation rate expected with standard IVF or ICSI.',
    interventions: ['Standard IVF or ICSI appropriate', 'Routine lifestyle and dietary maintenance'],
  };

  if (dfiTotalPct > 25) {
    threshold = {
      category: 'Severe DNA Fragmentation',
      dfiLabel: 'High DFI (>25%)',
      color: 'rose',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      barClass: 'bg-rose-500',
      icon: ShieldAlert,
      interpretation:
        'Elevated DNA fragmentation significantly increases risk of blastocyst arrest, implantation failure, and first-trimester clinical miscarriage.',
      interventions: [
        'Zymōt / Microfluidic sperm sorting to filter non-fragmented sperm',
        'High magnification ICSI (IMSI) or Hyaluronan binding (PICSI)',
        '3-Month Antioxidant Rx (CoQ10, L-Carnitine, Zinc, Lycopene)',
        'Consider Testicular Sperm Aspiration (TESA) if repeat DFI remains >30%',
      ],
    };
  } else if (dfiTotalPct > 15) {
    threshold = {
      category: 'Borderline / Fair Prognosis',
      dfiLabel: 'Moderate DFI (15–25%)',
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barClass: 'bg-amber-500',
      icon: AlertTriangle,
      interpretation:
        'Moderate DNA damage. Potential compromise in blastocyst yield. Antioxidant protocol and advanced sperm selection advised.',
      interventions: [
        'Density Gradient Centrifugation with shortened incubation',
        'Antioxidant oral supplementation for 60–90 days',
        'Reduced abstinence interval (1–2 days) prior to OPU to minimize epididymal oxidative stress',
      ],
    };
  }

  const handleCountChange = (field: keyof DFIHaloData, val: number) => {
    if (readonly) return;
    setCounts((prev) => ({
      ...prev,
      [field]: Math.max(0, val),
    }));
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-100">
            SCD Halo Assay (WHO 6th Ed)
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Sperm DNA Fragmentation Index (DFI) Halo Test
          </h3>
          <p className="text-xs text-slate-500">
            Microscopic Sperm Chromatin Dispersion halo morphometry &amp; ART selection protocol
          </p>
        </div>

        {/* Big DFI Number Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">
              Total DFI
            </span>
            <span
              className={`text-2xl font-bold font-mono ${
                dfiTotalPct > 25
                  ? 'text-rose-600'
                  : dfiTotalPct > 15
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {dfiTotalPct.toFixed(1)}%
            </span>
          </div>
          <div className={`p-2.5 rounded-lg border ${threshold.badgeClass}`}>
            <threshold.icon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment Halo Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-emerald-700">Intact DNA: {intactPct.toFixed(1)}%</span>
          <span
            className={
              dfiTotalPct > 25
                ? 'text-rose-700'
                : dfiTotalPct > 15
                ? 'text-amber-700'
                : 'text-emerald-700'
            }
          >
            Fragmented DNA (DFI): {dfiTotalPct.toFixed(1)}%
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-md overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${bigHaloPct}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title={`Big Halo: ${bigHaloPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${mediumHaloPct}%` }}
            className="bg-emerald-400 transition-all duration-300"
            title={`Medium Halo: ${mediumHaloPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${smallHaloPct}%` }}
            className="bg-amber-400 transition-all duration-300"
            title={`Small Halo: ${smallHaloPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${withoutHaloPct}%` }}
            className="bg-rose-500 transition-all duration-300"
            title={`Without Halo: ${withoutHaloPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${degradedPct}%` }}
            className="bg-rose-700 transition-all duration-300"
            title={`Degraded: ${degradedPct.toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Big Halo ({bigHaloPct.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Medium Halo ({mediumHaloPct.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Small Halo ({smallHaloPct.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Without Halo ({withoutHaloPct.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-700" />
            <span>Degraded ({degradedPct.toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Morphometry Cell Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        {/* Big Halo */}
        <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1">
            <span>Big Halo</span>
            <span className="text-emerald-700 font-mono">{bigHaloPct.toFixed(1)}%</span>
          </div>
          <input
            type="number"
            value={counts.big_halo_count}
            disabled={readonly}
            onChange={(e) => handleCountChange('big_halo_count', parseInt(e.target.value) || 0)}
            className="vmd-input text-xs py-1 px-2 text-center w-full font-bold bg-white"
          />
          <span className="text-[10px] text-emerald-600 block text-center mt-1">Intact loop</span>
        </div>

        {/* Medium Halo */}
        <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950 mb-1">
            <span>Medium Halo</span>
            <span className="text-emerald-700 font-mono">{mediumHaloPct.toFixed(1)}%</span>
          </div>
          <input
            type="number"
            value={counts.medium_halo_count}
            disabled={readonly}
            onChange={(e) => handleCountChange('medium_halo_count', parseInt(e.target.value) || 0)}
            className="vmd-input text-xs py-1 px-2 text-center w-full font-bold bg-white"
          />
          <span className="text-[10px] text-emerald-600 block text-center mt-1">Normal dispersion</span>
        </div>

        {/* Small Halo */}
        <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 mb-1">
            <span>Small Halo</span>
            <span className="text-amber-700 font-mono">{smallHaloPct.toFixed(1)}%</span>
          </div>
          <input
            type="number"
            value={counts.small_halo_count}
            disabled={readonly}
            onChange={(e) => handleCountChange('small_halo_count', parseInt(e.target.value) || 0)}
            className="vmd-input text-xs py-1 px-2 text-center w-full font-bold bg-white text-amber-900"
          />
          <span className="text-[10px] text-amber-700 block text-center mt-1">Fragmented DNA</span>
        </div>

        {/* Without Halo */}
        <div className="p-3 bg-rose-50/40 border border-rose-100 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-950 mb-1">
            <span>Without Halo</span>
            <span className="text-rose-700 font-mono">{withoutHaloPct.toFixed(1)}%</span>
          </div>
          <input
            type="number"
            value={counts.without_halo_count}
            disabled={readonly}
            onChange={(e) => handleCountChange('without_halo_count', parseInt(e.target.value) || 0)}
            className="vmd-input text-xs py-1 px-2 text-center w-full font-bold bg-white text-rose-900"
          />
          <span className="text-[10px] text-rose-600 block text-center mt-1">No loop / Denatured</span>
        </div>

        {/* Degraded */}
        <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-950 mb-1">
            <span>Degraded</span>
            <span className="text-rose-700 font-mono">{degradedPct.toFixed(1)}%</span>
          </div>
          <input
            type="number"
            value={counts.degraded_count}
            disabled={readonly}
            onChange={(e) => handleCountChange('degraded_count', parseInt(e.target.value) || 0)}
            className="vmd-input text-xs py-1 px-2 text-center w-full font-bold bg-white text-rose-950"
          />
          <span className="text-[10px] text-rose-700 block text-center mt-1">Severe damage</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 text-right">
        Total Sperm Evaluated: <strong>{totalEvaluated}</strong> cells
      </div>

      {/* Collapsible Specimen & Laboratory Execution Details */}
      <div className="pt-2 border-t border-slate-200">
        <details className="group">
          <summary className="text-xs font-bold text-slate-600 cursor-pointer flex items-center justify-between hover:text-slate-900 py-1">
            <span>Detailed Specimen Parameters &amp; Assay Execution (Optional)</span>
            <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-3 space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Date of Test</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Time of Collection</label>
                <input type="time" defaultValue="09:00" className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Time of Evaluation</label>
                <input type="time" defaultValue="11:30" className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                <input type="number" defaultValue={3} className="vmd-input text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume (mL)</label>
                <input type="number" step="0.1" defaultValue={2.5} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm Conc (M/mL)</label>
                <input type="number" step="0.1" defaultValue={38} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility (%)</label>
                <input type="number" defaultValue={50} className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Liquefaction</label>
                <input type="text" defaultValue="Complete" className="vmd-input text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">SDF Level / Assay Protocol Notes</label>
                <textarea
                  rows={2}
                  defaultValue="Sperm Chromatin Dispersion (SCD) Halo assay. Acid denaturation followed by lysis buffer to remove nuclear proteins."
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Laboratory Comments</label>
                <textarea
                  rows={2}
                  placeholder="Additional technician observations or clinical notes..."
                  className="vmd-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Prepared By (Analyst)</label>
                <input type="text" defaultValue="Lab Technician / Andrologist" className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Checked By (Senior Embryologist)</label>
                <input type="text" defaultValue="Senior Embryologist" className="vmd-input text-xs" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Microscopy Photo Attachment</label>
                <input type="file" accept="image/*" className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
            </div>
          </div>
        </details>
      </div>

      {/* Clinical Interpretation & Intervention Plan */}
      <div className={`p-4 rounded-lg border flex items-start gap-3.5 ${threshold.badgeClass}`}>
        <threshold.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">
              Clinical Assessment: {threshold.category} ({threshold.dfiLabel})
            </h4>
          </div>
          <p className="text-xs leading-relaxed opacity-95">{threshold.interpretation}</p>

          <div className="pt-2 border-t border-current/20">
            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
              Recommended Clinical Interventions:
            </span>
            <ul className="list-disc list-inside text-xs space-y-0.5">
              {threshold.interventions.map((item, idx) => (
                <li key={idx} className="font-medium">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
