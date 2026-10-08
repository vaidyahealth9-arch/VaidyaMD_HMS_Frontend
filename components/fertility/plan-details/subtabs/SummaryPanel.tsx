'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Save,
  Check,
  Clock,
  FlaskConical,
  Sparkles,
  Baby,
  Activity,
  Play,
  Calendar,
  HeartPulse,
  Dna,
  UserCheck,
} from 'lucide-react';
import { TreatmentCycleRecord } from '../types';
import { treatmentCyclesApi, authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface SummaryPanelProps {
  cycle: TreatmentCycleRecord;
  patient?: any;
  partner?: any;
  onUpdateCycle?: (updated: TreatmentCycleRecord) => void;
  onStartCycle?: (startedCycle: TreatmentCycleRecord) => void;
}

export default function SummaryPanel({
  cycle,
  patient,
  partner,
  onUpdateCycle,
  onStartCycle,
}: SummaryPanelProps) {
  const [cycleStatus, setCycleStatus] = useState<TreatmentCycleRecord['status']>(
    cycle.status || 'planned'
  );
  const [remarks, setRemarks] = useState<string>(cycle.remarks || '');
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    authApi
      .getDoctors()
      .then((docs: any) => {
        if (Array.isArray(docs)) setDoctors(docs);
      })
      .catch(() => {
        authApi.listUsers({ role: 'doctor' }).then((u: any) => {
          if (Array.isArray(u)) setDoctors(u);
        }).catch(() => {});
      });
  }, []);

  const doctorDisplayName = useMemo(() => {
    if (cycle.doctor_name && cycle.doctor_name.trim() && !cycle.doctor_name.includes('Reproductive Specialist')) {
      return cycle.doctor_name;
    }
    if (cycle.treating_doctor_name && cycle.treating_doctor_name.trim()) {
      return cycle.treating_doctor_name;
    }
    if (cycle.treating_doctor_id && doctors.length > 0) {
      const found = doctors.find((d: any) => d.id === cycle.treating_doctor_id);
      if (found && found.name) {
        return found.name.startsWith('Dr.') ? found.name : `Dr. ${found.name}`;
      }
    }
    return cycle.doctor_name || 'Treating Consultant';
  }, [cycle.doctor_name, cycle.treating_doctor_name, cycle.treating_doctor_id, doctors]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const stimDaysCount = Array.isArray(cycle.medication_calendar) ? cycle.medication_calendar.length : 0;
  const opuData = (cycle as any).opu_data;
  const embryologyData = (cycle as any).embryology_data;
  const pregnancyData = (cycle as any).pregnancy_result || (cycle as any).beta_hcg_result;

  const isDraftOrPlanned = !cycle?.id || cycleStatus === 'planned';

  const handleSaveOnly = async () => {
    const payload = {
      status: cycleStatus,
      remarks,
    };

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle({ ...cycle, ...payload });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
        toast.success('Draft Updated', 'Clinical summary notes updated in draft.');
      }
      return;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, payload);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Cycle Summary Saved', 'Cycle status and clinical summary notes updated.');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
    } catch (err: any) {
      toast.error('Failed to save', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCycle = async () => {
    const updated = {
      ...cycle,
      status: 'running' as const,
      remarks,
    };
    setCycleStatus('running');

    if (onStartCycle) {
      onStartCycle(updated);
      return;
    }

    if (!cycle?.id) {
      if (onUpdateCycle) {
        onUpdateCycle(updated);
        toast.success('Cycle Started', 'Treatment cycle marked In Progress (Running).');
      }
      return;
    }

    setIsSaving(true);
    try {
      const res = await treatmentCyclesApi.update(cycle.id, { status: 'running', remarks });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
      toast.success('Cycle Started', 'Treatment cycle marked In Progress (Running).');
      if (onUpdateCycle && res) {
        onUpdateCycle(res);
      }
    } catch (err: any) {
      toast.error('Failed to start cycle', err.message || 'An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'on_hold':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const sent = cycle.sentinel_dates || {};

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <span>Treatment Cycle Longitudinal Clinical Summary</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Comprehensive pre-treatment dossier, stimulation protocol kinetics, and longitudinal outcomes
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
            <select
              value={cycleStatus}
              onChange={(e) => setCycleStatus(e.target.value as any)}
              className={`text-xs font-bold border rounded px-2 py-1 capitalize cursor-pointer focus:outline-none ${getStatusBadge(
                cycleStatus
              )}`}
            >
              <option value="planned">Planned</option>
              <option value="running">In Progress (Running)</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSaveOnly}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Summary</span>
          </button>

          {isDraftOrPlanned && (
            <button
              type="button"
              onClick={handleStartCycle}
              disabled={isSaving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Save &amp; Start Treatment Cycle</span>
            </button>
          )}
        </div>
      </div>

      {/* Comprehensive Pre-Treatment Clinical Dossier Card */}
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-primary" />
            <span>Cycle Configuration &amp; Clinical Parameters Dossier</span>
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            Pre-Cycle Verification Checklist
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Column 1: Demographics & Indication */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 pb-1">
              Clinical Indication &amp; Modality
            </h5>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Treatment Modality:</span>
                <span className="font-bold text-primary">{cycle.treatment_type || 'ICSI'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attempt:</span>
                <span className="font-semibold text-slate-900">Attempt #{cycle.attempt_number || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Treating Consultant:</span>
                <span className="font-semibold text-slate-900">{doctorDisplayName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Female Factors:</span>
                <span className="font-medium text-slate-800">
                  {cycle.female_factors && cycle.female_factors.length > 0 ? cycle.female_factors.join(', ') : 'None specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Male Factors:</span>
                <span className="font-medium text-slate-800">
                  {cycle.male_factors && cycle.male_factors.length > 0 ? cycle.male_factors.join(', ') : 'None specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Gametes & Genetics */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 pb-1">
              Gametes &amp; Genetics
            </h5>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Oocyte Source:</span>
                <span className="font-semibold capitalize text-slate-900">
                  {cycle.gametes_source?.oocyte_source || 'Self (Autologous)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sperm Source:</span>
                <span className="font-semibold capitalize text-slate-900">
                  {cycle.gametes_source?.sperm_source || 'Partner Fresh'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PGT/PGS Testing:</span>
                <span className="font-semibold text-slate-900">
                  {cycle.pgs_pgd_data?.test_type || 'None planned'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Endometrial Scans:</span>
                <span className="font-bold text-emerald-700">
                  {cycle.endometrial_monitoring?.length || 0} TVS assessments logged
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medication Schedule:</span>
                <span className="font-bold text-primary">
                  {stimDaysCount} days scheduled
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Sentinel Timetable */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Sentinel Timetable</span>
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </h5>
            <div className="space-y-1.5 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Protocol:</span>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">
                  {sent.protocol_name || 'Antagonist Protocol'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">LMP Day 1:</span>
                <span className="font-mono text-slate-900">{sent.lmp_date || sent.lmp_day1 || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Baseline Scan:</span>
                <span className="font-mono text-slate-900">{sent.baseline_scan_date || sent.baseline_scan || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stim Start:</span>
                <span className="font-mono text-slate-900">{sent.stim_start_date || sent.stim_start || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. Trigger ⚡:</span>
                <span className="font-mono font-bold text-amber-800">{sent.trigger_datetime || sent.trigger || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. OPU 🥚:</span>
                <span className="font-mono font-bold text-rose-800">{sent.opu_datetime || sent.opu || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Est. Transfer ✨:</span>
                <span className="font-mono font-bold text-purple-800">{sent.et_datetime || sent.et || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beta hCG Test 🩸:</span>
                <span className="font-mono font-bold text-sky-800">{sent.beta_hcg_date || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal KPI Outcome Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Stimulation</span>
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {stimDaysCount > 0 ? `${stimDaysCount} Days` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex flex-col gap-0.5">
            <span>{stimDaysCount > 0 ? 'Protocol active' : 'Schedule pending'}</span>
          </div>
        </div>

        <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Oocyte Retrieval</span>
            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-950">
            {opuData?.total_oocytes ? `${opuData.total_oocytes} Oocytes` : '—'}
          </div>
          <div className="text-[11px] text-purple-700 mt-1 flex flex-col gap-0.5">
            <span>{opuData ? `MII: ${opuData.mature_mii || 0}` : 'OPU pending'}</span>
          </div>
        </div>

        <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200">
          <div className="flex items-center justify-between text-sky-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Embryology Yield</span>
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-extrabold text-sky-950">
            {embryologyData?.total_blastocysts ? `${embryologyData.total_blastocysts} Blastocysts` : '—'}
          </div>
          <div className="text-[11px] text-sky-700 mt-1 flex flex-col gap-0.5">
            <span>{embryologyData ? `Vitrified: ${embryologyData.vitrified || 0}` : 'Embryology pending'}</span>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pregnancy Result</span>
            <Baby className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-950">
            {pregnancyData ? `${pregnancyData.value || pregnancyData} mIU/mL` : '—'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <span>{pregnancyData ? 'Verified Result' : 'Beta-hCG pending'}</span>
          </div>
        </div>
      </div>

      {/* Clinical Notes & Disposition Editor */}
      <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200 space-y-2">
        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Clinical Conclusion &amp; Doctor&apos;s Cycle Disposition Notes
        </label>
        <textarea
          rows={4}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Enter doctor's clinical cycle notes, embryo disposition, transfer rationale, or subsequent cycle plan..."
          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y font-normal"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Signed electronically by {doctorDisplayName}</span>
          <span>Auto-formatted for printable discharge summaries</span>
        </div>
      </div>

      {/* Final Action Launch Bar */}
      {isDraftOrPlanned && (
        <div className="flex items-center justify-between p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
          <div>
            <span className="text-xs font-bold text-emerald-900 block">
              Ready to Launch Cycle?
            </span>
            <span className="text-[11px] text-emerald-700">
              Click &quot;Save &amp; Start Treatment Cycle&quot; to initialize cycle status to In Progress (Running) and activate clinical schedules.
            </span>
          </div>
          <button
            type="button"
            onClick={handleStartCycle}
            disabled={isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Save &amp; Start Treatment Cycle</span>
          </button>
        </div>
      )}
    </div>
  );
}
