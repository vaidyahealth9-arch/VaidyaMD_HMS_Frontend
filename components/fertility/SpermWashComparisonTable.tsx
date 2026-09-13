'use client';

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export interface SpermWashData {
  method: string;
  media_used: string;
  incubation_min: number;
  pre: {
    volume_ml: number;
    concentration_m_ml: number;
    total_motility_pct: number;
    progressive_motility_pct: number;
    normal_forms_pct: number;
  };
  post: {
    volume_ml: number;
    concentration_m_ml: number;
    total_motility_pct: number;
    progressive_motility_pct: number;
    normal_forms_pct: number;
  };
}

export interface SpermWashComparisonTableProps {
  initialData?: Partial<SpermWashData>;
  onChange?: (data: SpermWashData) => void;
  readonly?: boolean;
}

export default function SpermWashComparisonTable({
  initialData,
  onChange,
  readonly = false,
}: SpermWashComparisonTableProps) {
  const [data, setData] = useState<SpermWashData>({
    method: initialData?.method || 'Density Gradient (DGC) + Swim-up',
    media_used: initialData?.media_used || 'SpermGrad 45%/90% + FertiCult',
    incubation_min: initialData?.incubation_min || 45,
    pre: {
      volume_ml: initialData?.pre?.volume_ml ?? 2.5,
      concentration_m_ml: initialData?.pre?.concentration_m_ml ?? 35,
      total_motility_pct: initialData?.pre?.total_motility_pct ?? 45,
      progressive_motility_pct: initialData?.pre?.progressive_motility_pct ?? 32,
      normal_forms_pct: initialData?.pre?.normal_forms_pct ?? 4,
    },
    post: {
      volume_ml: initialData?.post?.volume_ml ?? 0.5,
      concentration_m_ml: initialData?.post?.concentration_m_ml ?? 28,
      total_motility_pct: initialData?.post?.total_motility_pct ?? 90,
      progressive_motility_pct: initialData?.post?.progressive_motility_pct ?? 82,
      normal_forms_pct: initialData?.post?.normal_forms_pct ?? 8,
    },
  });

  useEffect(() => {
    onChange?.(data);
  }, [data]);

  // Calculations
  const preTmsi =
    data.pre.volume_ml * data.pre.concentration_m_ml * (data.pre.progressive_motility_pct / 100);

  const postTmsi =
    data.post.volume_ml * data.post.concentration_m_ml * (data.post.progressive_motility_pct / 100);

  const recoveryRate = preTmsi > 0 ? (postTmsi / preTmsi) * 100 : 0;

  // Clinical Recommendation
  let recommendation = {
    level: 'optimal',
    title: 'Optimal for Intrauterine Insemination (IUI)',
    desc: 'Post-wash TMSI is above 10 Million with excellent progressive motility. Favorable prognostic indicator for IUI success.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
  };

  if (postTmsi < 5) {
    recommendation = {
      level: 'suboptimal',
      title: 'Suboptimal for IUI — Recommend IVF / ICSI',
      desc: 'Post-wash TMSI is below 5 Million. IUI cycle fecundity is markedly reduced (<5%). Clinically advised to convert cycle to IVF or ICSI.',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: ShieldAlert,
    };
  } else if (postTmsi < 10) {
    recommendation = {
      level: 'acceptable',
      title: 'Borderline / Acceptable for IUI',
      desc: 'Post-wash TMSI is between 5 and 10 Million. Adequate for IUI trial, but multiple follicular recruitment or IVF counseling suggested.',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
    };
  }

  const handlePreChange = (field: keyof typeof data.pre, val: number) => {
    if (readonly) return;
    setData((prev) => ({
      ...prev,
      pre: { ...prev.pre, [field]: val },
    }));
  };

  const handlePostChange = (field: keyof typeof data.post, val: number) => {
    if (readonly) return;
    setData((prev) => ({
      ...prev,
      post: { ...prev.post, [field]: val },
    }));
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-lg p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] px-2 py-0.5 rounded-md border border-[rgb(var(--clr-primary)/0.2)]">
            Sperm Preparation &amp; Wash Evaluation
          </span>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            Pre-Wash vs. Post-Wash Insemination Comparison (TMSI)
          </h3>
          <p className="text-xs text-slate-500">
            Density Gradient (DGC) / Swim-Up recovery rate &amp; ART modality decision matrix
          </p>
        </div>

        {/* Preparation Method Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={data.method}
            disabled={readonly}
            onChange={(e) => setData({ ...data, method: e.target.value })}
            className="vmd-input text-xs py-1.5 font-bold text-slate-700 bg-slate-50"
          >
            <option value="Density Gradient (DGC) + Swim-up">DGC + Swim-Up</option>
            <option value="Double Density Gradient (45/90)">Double Density Gradient (45/90)</option>
            <option value="Direct Swim-Up">Direct Swim-Up</option>
            <option value="Zymōt Microfluidic Chip">Zymōt Microfluidic Sorting</option>
            <option value="Simple Wash & Resuspend">Simple Wash &amp; Resuspend</option>
          </select>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] border-b border-slate-200">
              <th className="py-3 px-4">Parameter</th>
              <th className="py-3 px-4 text-center bg-slate-100/60 min-w-[140px]">
                Pre-Wash (Ejaculate)
              </th>
              <th className="py-3 px-4 text-center bg-[rgb(var(--clr-primary)/0.06)] min-w-[140px] text-slate-900">
                Post-Wash (Inseminate)
              </th>
              <th className="py-3 px-4 text-center">Change / Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {/* Volume */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-bold text-slate-800">Semen Volume (mL)</td>
              <td className="py-2.5 px-4 text-center bg-slate-50/30">
                <input
                  type="number"
                  step="0.1"
                  value={data.pre.volume_ml}
                  disabled={readonly}
                  onChange={(e) => handlePreChange('volume_ml', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold"
                />
              </td>
              <td className="py-2.5 px-4 text-center bg-[rgb(var(--clr-primary)/0.03)]">
                <input
                  type="number"
                  step="0.1"
                  value={data.post.volume_ml}
                  disabled={readonly}
                  onChange={(e) => handlePostChange('volume_ml', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold text-slate-900"
                />
              </td>
              <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                Concentrated into {data.post.volume_ml} mL
              </td>
            </tr>

            {/* Concentration */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-bold text-slate-800">Concentration (M/mL)</td>
              <td className="py-2.5 px-4 text-center bg-slate-50/30">
                <input
                  type="number"
                  step="0.1"
                  value={data.pre.concentration_m_ml}
                  disabled={readonly}
                  onChange={(e) => handlePreChange('concentration_m_ml', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold"
                />
              </td>
              <td className="py-2.5 px-4 text-center bg-[rgb(var(--clr-primary)/0.03)]">
                <input
                  type="number"
                  step="0.1"
                  value={data.post.concentration_m_ml}
                  disabled={readonly}
                  onChange={(e) => handlePostChange('concentration_m_ml', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold text-slate-900"
                />
              </td>
              <td className="py-2.5 px-4 text-center font-bold text-xs">
                {data.post.concentration_m_ml >= data.pre.concentration_m_ml ? (
                  <span className="text-emerald-600">
                    +{(data.post.concentration_m_ml - data.pre.concentration_m_ml).toFixed(1)} M/mL
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {(data.post.concentration_m_ml - data.pre.concentration_m_ml).toFixed(1)} M/mL
                  </span>
                )}
              </td>
            </tr>

            {/* Progressive Motility PR % */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-bold text-slate-800">Progressive Motility (PR %)</td>
              <td className="py-2.5 px-4 text-center bg-slate-50/30">
                <input
                  type="number"
                  value={data.pre.progressive_motility_pct}
                  disabled={readonly}
                  onChange={(e) => handlePreChange('progressive_motility_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold"
                />
              </td>
              <td className="py-2.5 px-4 text-center bg-[rgb(var(--clr-primary)/0.03)]">
                <input
                  type="number"
                  value={data.post.progressive_motility_pct}
                  disabled={readonly}
                  onChange={(e) => handlePostChange('progressive_motility_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold text-emerald-700"
                />
              </td>
              <td className="py-2.5 px-4 text-center font-bold text-xs text-emerald-600">
                +{Math.max(0, data.post.progressive_motility_pct - data.pre.progressive_motility_pct)}% PR
              </td>
            </tr>

            {/* Total Motility % */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-bold text-slate-800">Total Motility (%)</td>
              <td className="py-2.5 px-4 text-center bg-slate-50/30">
                <input
                  type="number"
                  value={data.pre.total_motility_pct}
                  disabled={readonly}
                  onChange={(e) => handlePreChange('total_motility_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold"
                />
              </td>
              <td className="py-2.5 px-4 text-center bg-[rgb(var(--clr-primary)/0.03)]">
                <input
                  type="number"
                  value={data.post.total_motility_pct}
                  disabled={readonly}
                  onChange={(e) => handlePostChange('total_motility_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold text-slate-900"
                />
              </td>
              <td className="py-2.5 px-4 text-center text-slate-500 text-xs">
                +{Math.max(0, data.post.total_motility_pct - data.pre.total_motility_pct)}%
              </td>
            </tr>

            {/* Normal Forms % */}
            <tr className="hover:bg-slate-50/40">
              <td className="py-2.5 px-4 font-bold text-slate-800">Normal Forms % (Kruger)</td>
              <td className="py-2.5 px-4 text-center bg-slate-50/30">
                <input
                  type="number"
                  value={data.pre.normal_forms_pct}
                  disabled={readonly}
                  onChange={(e) => handlePreChange('normal_forms_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold"
                />
              </td>
              <td className="py-2.5 px-4 text-center bg-[rgb(var(--clr-primary)/0.03)]">
                <input
                  type="number"
                  value={data.post.normal_forms_pct}
                  disabled={readonly}
                  onChange={(e) => handlePostChange('normal_forms_pct', parseFloat(e.target.value) || 0)}
                  className="vmd-input text-xs py-1 px-2 text-center w-24 font-bold text-slate-900"
                />
              </td>
              <td className="py-2.5 px-4 text-center text-emerald-700 font-bold text-xs">
                Selected for Normal Morphology
              </td>
            </tr>

            {/* KEY METRIC: TOTAL MOTILE SPERM INSEMINATION (TMSI) */}
            <tr className="bg-slate-100/70 border-t-2 border-slate-300">
              <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                Total Motile Insemination (TMSI)
                <span className="block text-[10px] text-slate-500 font-normal">
                  = Volume × Concentration × PR%
                </span>
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-slate-700 bg-slate-200/50">
                {preTmsi.toFixed(2)} M
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-base text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)]">
                {postTmsi.toFixed(2)} M
              </td>
              <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-emerald-800">
                {recoveryRate.toFixed(1)}% Recovery
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Clinical Recommendation Card */}
      <div className={`p-4 rounded-lg border flex items-start gap-3.5 ${recommendation.badgeClass}`}>
        <recommendation.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm">{recommendation.title}</h4>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/80 border border-current">
              Post-Wash TMSI: {postTmsi.toFixed(2)} Million
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{recommendation.desc}</p>
        </div>
      </div>
    </div>
  );
}
