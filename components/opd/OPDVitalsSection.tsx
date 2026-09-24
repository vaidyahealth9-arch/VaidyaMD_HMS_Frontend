'use client';

import React from 'react';
import {
  HeartPulse,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';

interface OPDVitalsSectionProps {
  workbenchMode: 'doctor' | 'nurse';
  register: any;
  watch: any;
  setValue: any;
  effectiveTriage: any;
  isDoctorVitalsExpanded: boolean;
  setIsDoctorVitalsExpanded: (expanded: boolean) => void;
  isPending?: boolean;
}

export default function OPDVitalsSection({
  workbenchMode,
  register,
  watch,
  setValue,
  effectiveTriage,
  isDoctorVitalsExpanded,
  setIsDoctorVitalsExpanded,
  isPending = false,
}: OPDVitalsSectionProps) {
  if (workbenchMode === 'nurse') {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Nurse Triage Assessment &amp; Vital Signs
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={() => {
              setValue('blood_pressure_systolic', '120');
              setValue('blood_pressure_diastolic', '80');
              setValue('heart_rate', '72');
              setValue('respiratory_rate', '16');
              setValue('temperature', '98.6');
              setValue('spo2', '98');
              setValue('cvs_findings', 'S1 S2 heard, no murmurs');
              setValue('cns_findings', 'Conscious, oriented, afebrile');
              setValue('rs_findings', 'Bilateral vesicular breath sounds, clear');
            }}
            className="text-[11px] font-bold text-primary hover:text-primary-mid bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
          >
            + Autofill Normal Vitals
          </button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Vitals Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">BP Systolic</label>
              <Input
                type="number"
                {...register('blood_pressure_systolic')}
                placeholder="120"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">BP Diastolic</label>
              <Input
                type="number"
                {...register('blood_pressure_diastolic')}
                placeholder="80"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Pulse (bpm)</label>
              <Input
                type="number"
                {...register('heart_rate')}
                placeholder="72"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Resp Rate</label>
              <Input
                type="number"
                {...register('respiratory_rate')}
                placeholder="16"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Temp (°F)</label>
              <Input
                type="number"
                step="0.1"
                {...register('temperature')}
                placeholder="98.6"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 (%)</label>
              <Input
                type="number"
                {...register('spo2')}
                placeholder="98"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                {...register('weight')}
                placeholder="65"
                className="h-9 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
              <Input
                type="number"
                {...register('height')}
                placeholder="165"
                className="h-9 text-xs font-semibold"
              />
            </div>
          </div>

          {/* Calculated BMI */}
          {watch('bmi') && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <span className="font-semibold text-slate-600">Calculated Body Mass Index (BMI):</span>
              <strong className="text-slate-900">{watch('bmi')} kg/m²</strong>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {Number(watch('bmi')) < 18.5
                  ? 'Underweight'
                  : Number(watch('bmi')) < 25
                  ? 'Normal'
                  : Number(watch('bmi')) < 30
                  ? 'Overweight'
                  : 'Obese'}
              </span>
            </div>
          )}

          {/* Triage Chief Complaint & Nurse Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Chief Complaint (Patient Statement) <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('chief_complaints', { required: true })}
                rows={3}
                placeholder="e.g. Lower abdominal pain since yesterday, feeling feverish..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Nurse Observation Notes</label>
              <textarea
                {...register('nurse_notes')}
                rows={3}
                placeholder="e.g. Patient ambulatory, alert. Accompanied by spouse..."
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>
          </div>

          {/* Quick Systemic Findings */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Preliminary Systemic Findings (Optional)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">CVS</label>
                <Input {...register('cvs_findings')} placeholder="e.g. Normal S1 S2" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">CNS</label>
                <Input {...register('cns_findings')} placeholder="e.g. Conscious, oriented" className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">RS</label>
                <Input {...register('rs_findings')} placeholder="e.g. Clear breath sounds" className="h-8 text-xs" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Doctor Consultation View: Collapsible Banner
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <HeartPulse className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="uppercase tracking-wider text-[11px] text-slate-500">Triage Vitals:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
              BP:{' '}
              <strong className="text-slate-900">
                {watch('blood_pressure_systolic') && watch('blood_pressure_diastolic')
                  ? `${watch('blood_pressure_systolic')}/${watch('blood_pressure_diastolic')}`
                  : '—'}
              </strong>{' '}
              mmHg
            </span>
            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
              HR: <strong className="text-slate-900">{watch('heart_rate') || '—'}</strong> bpm
            </span>
            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
              Temp: <strong className="text-slate-900">{watch('temperature') || '—'}</strong> °F
            </span>
            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
              SpO2: <strong className="text-slate-900">{watch('spo2') || '—'}</strong>%
            </span>
            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
              Wt: <strong className="text-slate-900">{watch('weight') || '—'}</strong> kg
            </span>
            {watch('bmi') && (
              <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded font-bold text-primary">
                BMI: {watch('bmi')}
              </span>
            )}
          </div>
          {effectiveTriage && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
              ✓ Triage Vitals Linked
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsDoctorVitalsExpanded(!isDoctorVitalsExpanded)}
          className="text-xs font-bold text-primary hover:text-primary-mid flex items-center gap-1 px-2.5 py-1 rounded hover:bg-primary/10 transition-colors self-end sm:self-center cursor-pointer"
        >
          {isDoctorVitalsExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Collapse Vitals</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Edit / View Vitals &amp; Exam</span>
            </>
          )}
        </button>
      </div>

      {/* Nurse Observation Notes Banner (if provided) */}
      {watch('nurse_notes') && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-2 text-xs bg-slate-50/80 p-2 rounded-md">
          <FileText className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
              Nurse Triage Notes:{' '}
            </span>
            <span className="text-slate-700 text-xs">{watch('nurse_notes')}</span>
          </div>
        </div>
      )}

      {/* Expanded Vitals & Systemic Exam Editor */}
      {isDoctorVitalsExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">BP Systolic</label>
              <Input
                type="number"
                {...register('blood_pressure_systolic')}
                placeholder="120"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">BP Diastolic</label>
              <Input
                type="number"
                {...register('blood_pressure_diastolic')}
                placeholder="80"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</label>
              <Input
                type="number"
                {...register('heart_rate')}
                placeholder="72"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Resp Rate</label>
              <Input
                type="number"
                {...register('respiratory_rate')}
                placeholder="16"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Temp (°F)</label>
              <Input
                type="number"
                step="0.1"
                {...register('temperature')}
                placeholder="98.6"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">SpO2 (%)</label>
              <Input
                type="number"
                {...register('spo2')}
                placeholder="98"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Weight (kg)</label>
              <Input
                type="number"
                step="0.1"
                {...register('weight')}
                placeholder="65"
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Height (cm)</label>
              <Input
                type="number"
                {...register('height')}
                placeholder="165"
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] font-bold text-slate-600 block mb-1">Examination Findings</label>
            <textarea
              {...register('examination')}
              placeholder="e.g. Vitals stable, P/A soft, CVS normal..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
