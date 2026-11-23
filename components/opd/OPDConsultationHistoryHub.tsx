'use client';

import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  Plus,
  History,
  HeartHandshake,
  Clock,
  Search,
  AlertTriangle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime, safeString } from '@/lib/utils';
import type { CounselingNote } from '@/lib/api';
import OPDConsultationCard from './OPDConsultationCard';

interface OPDConsultationHistoryHubProps {
  consultationHistory: any[];
  counselingNotes?: CounselingNote[];
  activeAlerts?: string[];
  patient?: any;
  onStartNewConsultation: () => void;
  onViewRecord: (record: any) => void;
  onEditRecord: (record: any) => void;
  onPrintRecord: (record: any) => void;
  onDeleteRecord?: (record: any) => void;
  onViewCounselingNote?: (note: CounselingNote) => void;
}

export default function OPDConsultationHistoryHub({
  consultationHistory = [],
  counselingNotes = [],
  activeAlerts = [],
  patient,
  onStartNewConsultation,
  onViewRecord,
  onEditRecord,
  onPrintRecord,
  onDeleteRecord,
  onViewCounselingNote,
}: OPDConsultationHistoryHubProps) {
  const [activeTab, setActiveTab] = useState<'consultations' | 'counseling'>('consultations');
  const [searchQuery, setSearchQuery] = useState('');

  // Deduplicate and unify triage + doctor consultation into a single visit entity
  const displayHistory = useMemo(() => {
    if (!consultationHistory || consultationHistory.length === 0) return [];
    const linkedTriageIds = new Set(
      consultationHistory.map((r: any) => r.data?.linked_triage_record_id).filter(Boolean)
    );
    return consultationHistory.filter((rec: any) => {
      if (linkedTriageIds.has(rec.id)) return false;
      const isTriageOnly = rec.record_type === 'nurse_triage' || rec.data?.record_type === 'nurse_triage';
      if (!isTriageOnly) return true;
      const recDate = rec.created_at ? new Date(rec.created_at).toDateString() : '';
      const hasConsultationOnSameDate = consultationHistory.some((other: any) => {
        if (other.id === rec.id) return false;
        const otherIsConsultation = other.record_type === 'opd_consultation' || other.data?.record_type === 'opd_consultation';
        const otherDate = other.created_at ? new Date(other.created_at).toDateString() : '';
        return otherIsConsultation && otherDate === recDate;
      });
      return !hasConsultationOnSameDate;
    });
  }, [consultationHistory]);

  const filteredConsultations = useMemo(() => {
    if (!searchQuery.trim()) return displayHistory;
    const q = searchQuery.toLowerCase().trim();
    return displayHistory.filter((rec: any) => {
      const dx = safeString(rec.data?.provisional_diagnosis || rec.data?.diagnosis).toLowerCase();
      const cc = safeString(rec.data?.chief_complaints).toLowerCase();
      const doc = safeString(rec.data?.doctor || rec.doctor_name).toLowerCase();
      const plan = safeString(rec.data?.plan || rec.data?.treatment_notes).toLowerCase();
      return dx.includes(q) || cc.includes(q) || doc.includes(q) || plan.includes(q);
    });
  }, [displayHistory, searchQuery]);

  const latestVisitDate = consultationHistory[0]?.created_at
    ? formatDateTime(consultationHistory[0].created_at)
    : 'None';

  const safeAlertsText = useMemo(() => {
    if (!Array.isArray(activeAlerts) || activeAlerts.length === 0) return '';
    return activeAlerts.map((a: any) => safeString(a)).filter(Boolean).join(', ');
  }, [activeAlerts]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-5">
      {/* Top Banner: Patient Overview & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              <span>Consultation &amp; Clinical Visit History</span>
            </h2>
            <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 font-bold">
              {consultationHistory.length} Total Visits
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review longitudinal clinical consultations, vitals, prescriptions, and counseling sessions.
          </p>
        </div>

        <Button
          type="button"
          onClick={onStartNewConsultation}
          className="bg-primary hover:bg-primary-mid text-white font-bold text-xs py-2 px-4 shadow-sm flex items-center gap-2 rounded-lg cursor-pointer transition-all active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Start New Consultation / Rx</span>
        </Button>
      </div>

      {/* Clinical Alerts Strip if any */}
      {safeAlertsText && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2.5 text-xs text-amber-950 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Active Clinical Alerts: </span>
            <span>{safeAlertsText}</span>
          </div>
        </div>
      )}

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Consultations</span>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{consultationHistory.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Latest: {latestVisitDate}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Pre-ART Counseling</span>
            <p className="text-2xl font-black text-violet-700 mt-0.5">{counselingNotes.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Consent &amp; discussion records</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Patient Status</span>
            <div className="text-base font-bold text-emerald-800 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Ready for Visit</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Vitals triage linked</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('consultations')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'consultations'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Consultations ({consultationHistory.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('counseling')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'counseling'
                ? 'bg-violet-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Counseling Notes ({counselingNotes.length})</span>
          </button>
        </div>

        {activeTab === 'consultations' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search diagnosis, complaint, doctor..."
              className="pl-8 h-8 text-xs bg-slate-50"
            />
          </div>
        )}
      </div>

      {/* Main Records Container */}
      {activeTab === 'consultations' ? (
        filteredConsultations.length > 0 ? (
          <div className="space-y-3">
            {filteredConsultations.map((rec: any) => (
              <OPDConsultationCard
                key={rec.id}
                record={rec}
                onViewRecord={onViewRecord}
                onEditRecord={onEditRecord}
                onPrintRecord={onPrintRecord}
                onDeleteRecord={onDeleteRecord}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Stethoscope className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">No Previous Consultations Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No past consultations or triage records have been saved for this patient yet.
              </p>
            </div>
            <Button
              type="button"
              onClick={onStartNewConsultation}
              className="bg-primary hover:bg-primary-mid text-white font-bold text-xs py-2 px-4 shadow-sm inline-flex items-center gap-1.5 rounded-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Start First Consultation / Rx</span>
            </Button>
          </div>
        )
      ) : counselingNotes && counselingNotes.length > 0 ? (
        <div className="space-y-3">
          {counselingNotes.map((note) => {
            const proc = safeString(note.procedure, 'Pre-ART Counseling');
            const disc = safeString(note.discussion, 'Pre-ART treatment counseling session conducted.');
            const cName = safeString(note.counselor_name, 'Staff');

            return (
              <div
                key={note.id}
                className="bg-white rounded-xl border border-violet-200 p-4 hover:border-violet-300 shadow-2xs transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-violet-500" />
                    {formatDateTime(note.created_at)}
                  </span>
                  <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-[10px] font-bold">
                    {proc}
                  </Badge>
                </div>
                <p className="text-xs text-slate-700">
                  <strong>Discussion:</strong> {disc}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-violet-100 text-xs text-slate-500">
                  <span>Counselor: <strong>{cName}</strong></span>
                  {onViewCounselingNote && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCounselingNote(note)}
                      className="h-6 text-[11px] text-violet-700 border-violet-300 hover:bg-violet-50"
                    >
                      View 8-Point Sheet →
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-2">
          <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No Counseling Sessions Recorded</h3>
          <p className="text-xs text-slate-500">No pre-ART counseling sessions have been recorded yet.</p>
        </div>
      )}
    </div>
  );
}
