'use client';

import React from 'react';
import {
  History,
  HeartHandshake,
  AlertTriangle,
  Clock,
  Printer,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { CounselingNote } from '@/lib/api';

interface OPDSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  sidebarTab: 'consultations' | 'counseling';
  setSidebarTab: (tab: 'consultations' | 'counseling') => void;
  consultationHistory?: any[];
  counselingNotes?: CounselingNote[];
  activeAlerts?: string[];
  onEditAlerts: () => void;
  activeConsultationRecordId: string | null;
  onSelectRecord: (rec: any) => void;
  onLoadConsultationForEdit: (rec: any) => void;
  onPrintPrevious: (rec: any) => void;
  onSelectCounselingNote: (note: CounselingNote) => void;
}

export default function OPDSidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  sidebarTab,
  setSidebarTab,
  consultationHistory,
  counselingNotes,
  activeAlerts,
  onEditAlerts,
  activeConsultationRecordId,
  onSelectRecord,
  onLoadConsultationForEdit,
  onPrintPrevious,
  onSelectCounselingNote,
}: OPDSidebarProps) {
  return (
    <div
      className={`border-r border-slate-200 bg-white flex flex-col transition-all duration-300 flex-shrink-0 ${
        isSidebarOpen ? 'w-72 sm:w-80' : 'w-12'
      }`}
    >
      {/* Sidebar Header with Collapse Toggle & Mode Switch */}
      <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
        {isSidebarOpen ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Clinical Records
              </span>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Collapse History Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
            {/* 2-Tab Switcher: Consultations vs Counselor Notes */}
            <div className="grid grid-cols-2 p-0.5 bg-slate-200/70 rounded-md text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSidebarTab('consultations')}
                className={`py-1 px-1.5 rounded text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  sidebarTab === 'consultations'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3 h-3 text-slate-500" />
                <span>Consults ({consultationHistory?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('counseling')}
                className={`py-1 px-1.5 rounded text-[11px] flex items-center justify-center gap-1 transition-all relative cursor-pointer ${
                  sidebarTab === 'counseling'
                    ? 'bg-white text-violet-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <HeartHandshake className="w-3 h-3 text-violet-600" />
                <span>Counseling ({counselingNotes?.length || 0})</span>
                {counselingNotes && counselingNotes.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="w-full flex justify-center text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            title="Expand History Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Previous Records List */}
      {isSidebarOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {/* Active Clinical Alerts in Sidebar */}
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-900">
                  Clinical Alerts
                </span>
                <span className="text-[11px] truncate block">
                  {activeAlerts && activeAlerts.length > 0
                    ? activeAlerts.join(', ')
                    : 'No active alerts'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditAlerts}
              className="text-[10px] font-bold text-amber-900 hover:underline flex-shrink-0 px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>

          {sidebarTab === 'consultations' ? (
            consultationHistory && consultationHistory.length > 0 ? (
              consultationHistory.map((rec: any) => (
                <div
                  key={rec.id}
                  className={`p-2.5 border rounded-md transition-colors group relative shadow-2xs ${
                    activeConsultationRecordId === rec.id
                      ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                    <span
                      onClick={() => onSelectRecord(rec)}
                      className="flex items-center gap-1 group-hover:text-[rgb(var(--clr-primary))] transition-colors cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDateTime(rec.created_at)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onLoadConsultationForEdit(rec)}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded flex items-center gap-0.5 shadow-2xs cursor-pointer"
                        title="Load into Workbench to edit / update this record"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onPrintPrevious(rec)}
                        className="px-1.5 py-0.5 text-[10px] font-bold bg-white hover:bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] border border-[rgb(var(--clr-primary)/0.2)] rounded flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Print Prescription (Rx)"
                      >
                        <Printer className="w-2.5 h-2.5" />
                        <span>Rx</span>
                      </button>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 font-medium ${
                          rec.data?.nurse_triage_merged || (rec.data?.vitals && rec.data?.plan)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : rec.record_type === 'nurse_triage' || rec.data?.record_type === 'nurse_triage'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {rec.data?.nurse_triage_merged || (rec.data?.vitals && rec.data?.plan)
                          ? 'OPD (Vitals+Rx)'
                          : rec.record_type === 'nurse_triage' || rec.data?.record_type === 'nurse_triage'
                          ? 'Triage'
                          : 'OPD'}
                      </Badge>
                    </div>
                  </div>
                  <p
                    onClick={() => onSelectRecord(rec)}
                    className="text-xs font-bold text-slate-800 line-clamp-1 cursor-pointer"
                  >
                    Dx: {rec.data?.provisional_diagnosis || rec.data?.chief_complaints || 'Clinical Review'}
                  </p>
                  {rec.data?.plan && (
                    <p
                      onClick={() => onSelectRecord(rec)}
                      className="text-[10px] text-slate-600 line-clamp-2 mt-1 bg-white p-1 rounded border border-slate-100 cursor-pointer"
                    >
                      {rec.data.plan}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No previous consultations recorded for this patient.
              </div>
            )
          ) : counselingNotes && counselingNotes.length > 0 ? (
            counselingNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectCounselingNote(note)}
                className="p-2.5 bg-violet-50/50 hover:bg-violet-50 border border-violet-200 rounded-md transition-all group cursor-pointer shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500 font-medium">
                    <Clock className="w-3 h-3 text-violet-500" />
                    {formatDateTime(note.created_at)}
                  </span>
                  <Badge className="bg-violet-100 text-violet-800 border-violet-300 text-[10px] px-1.5 py-0 font-bold">
                    {note.procedure || 'Pre-ART'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900">
                    Source: <span className="text-violet-700">{note.source || 'Direct'}</span>
                  </span>
                  <span className="text-[10px] font-bold text-violet-600 bg-white px-1.5 py-0.5 rounded border border-violet-200 shadow-2xs group-hover:bg-violet-600 group-hover:text-white transition-colors">
                    View 8-Pt Sheet →
                  </span>
                </div>
                {note.discussion && (
                  <p className="text-[10px] text-slate-600 line-clamp-2 bg-white/80 p-1 rounded border border-violet-100">
                    <strong>Discussion:</strong> {note.discussion}
                  </p>
                )}
                <div className="pt-0.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-violet-100/60">
                  <span>By: <strong>{note.counselor_name || 'Counselor'}</strong></span>
                  <span className="italic text-slate-400">Sig: {note.signature || 'Signed'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400 text-xs">
              <HeartHandshake className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              No pre-ART counseling sessions recorded for this patient.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
