'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  User,
  Heart,
  Calendar,
  CheckCircle2,
  Play,
  RotateCcw,
  Activity,
  AlertTriangle,
  Stethoscope,
  XCircle,
  Info,
  Check,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '@/components/billing';
import { statusColors } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentCardGridProps {
  appointments: any[];
  patients?: any[];
  isLoading: boolean;
  currentTime: Date;
  onStatusChange: (id: string, status: string) => void;
  onStartConsultation: (apt: any) => void;
  onReschedule: (apt: any) => void;
  onTriage: (apt: any) => void;
}

const parseUtc = (dStr: string) => {
  if (!dStr) return new Date();
  const s = (dStr.includes('T') && !dStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dStr)) ? `${dStr}Z` : dStr;
  return new Date(s);
};

export default function AppointmentCardGrid({
  appointments: filteredAppointments,
  patients = [],
  isLoading,
  currentTime,
  onStatusChange: updateStatus,
  onStartConsultation: handleStartConsultation,
  onReschedule,
  onTriage,
}: AppointmentCardGridProps) {
  const { can } = useAuth();
  const getWaitTime = (apt: any) => {
    if (apt.status !== 'waiting') return null;
    const dateStr = apt.updated_at || apt.created_at || apt.scheduled_at;
    const refDate = parseUtc(dateStr);
    const waitMs = currentTime.getTime() - refDate.getTime();
    return Math.max(0, Math.floor(waitMs / 60000));
  };

  const getWaitBadgeColor = (waitMins: number | null) => {
    if (waitMins === null) return '';
    if (waitMins < 15) return 'bg-emerald-100 text-emerald-800';
    if (waitMins < 30) return 'bg-amber-100 text-amber-800 font-bold shadow-xs ring-1 ring-amber-300';
    return 'bg-rose-100 text-rose-800 font-bold animate-pulse shadow-xs ring-1 ring-rose-300';
  };

  const statusLabels: Record<string, string> = {
    waiting: 'Waiting in OPD',
    in_progress: 'In Cabin Consultation',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map((apt: any, idx: number) => {
            const aptGender = (apt.patient_gender || patients.find((p) => p.id === apt.patient_id)?.gender || '').toLowerCase();
            const matchedPatient = patients.find((p) => p.id === apt.patient_id);
            const tokenNumber = `#${String(idx + 1).padStart(2, '0')}`;
            const isCosGyn = (apt.department || '').toLowerCase().includes('cosmetic') || 
                             (apt.department || '').toLowerCase().includes('cosgyn') ||
                             (apt.visit_type || '').toLowerCase().includes('cosgyn');

            return (
              <div
                key={apt.id}
                className={`bg-white border rounded-xl shadow-xs p-5 space-y-4 transition-all hover:shadow-md relative ${
                  apt.status === 'in_progress' ? 'border-emerald-300 ring-2 ring-emerald-100' :
                  apt.status === 'waiting' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                {/* Patient Row with Token & Gender */}
                <div className="flex items-center gap-3">
                  {/* Token & Avatar */}
                  <div className="relative">
                    <div className="w-11 h-11 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[rgb(var(--clr-primary)/0.15)]">
                      {apt.patient_name?.charAt(0) || '?'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-bold px-1 rounded-sm shadow-xs">
                      {tokenNumber}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm truncate">{apt.patient_name}</p>
                      {/* Gender Badge */}
                      {aptGender === 'female' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                          ♀ Female
                        </span>
                      ) : aptGender === 'male' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-0.5">
                          ♂ Male
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono font-semibold">{apt.patient_vid}</span>
                      {matchedPatient?.partner_name && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={`Partner: ${matchedPatient.partner_name}`}>
                          · Partner: {matchedPatient.partner_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Wait Timer */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                    {apt.status === 'waiting' && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${getWaitBadgeColor(getWaitTime(apt))}`}>
                        Wait: {getWaitTime(apt)}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Time</p>
                    <p className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {parseUtc(apt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Doctor</p>
                    <p className="text-slate-800 font-bold truncate mt-0.5">
                      {apt.doctor_name || 'Consultant'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Department</p>
                    <p className="text-slate-800 font-semibold capitalize mt-0.5 truncate">
                      {apt.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Visit Type</p>
                    <p className="text-slate-800 font-semibold capitalize mt-0.5 truncate">
                      {apt.visit_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Clinical Notes if available */}
                {apt.notes && (
                  <div className="text-[11px] text-slate-600 bg-slate-50/70 border border-dashed border-slate-200 px-2.5 py-1.5 rounded-md flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{apt.notes}</span>
                  </div>
                )}

                {/* Triage Vitals Banner (Not required for Cosmetic Gynecology) */}
                {!isCosGyn && apt.metadata_?.triage?.vitals && (
                  <div className="text-[11px] bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-md text-emerald-800 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      BP: {apt.metadata_.triage.vitals.bp || '—'} · HR: {apt.metadata_.triage.vitals.hr || '—'}
                    </span>
                    <span>{apt.metadata_.triage.vitals.weight ? `${apt.metadata_.triage.vitals.weight}kg` : ''}</span>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-100 flex-wrap">
                  {/* Triage button for waiting or scheduled (NOT required for Cosmetic Gynecology) */}
                  {!isCosGyn && (apt.status === 'waiting' || apt.status === 'scheduled') && can('action:record_vitals') && (
                    <button
                      onClick={() => onTriage(apt)}
                      className={`text-xs font-bold px-2.5 py-2 border rounded-md transition-colors flex items-center gap-1 ${
                        apt.metadata_?.triage
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Enter Nurse Triage Vitals"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{apt.metadata_?.triage ? 'Triaged' : 'Triage'}</span>
                    </button>
                  )}

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(apt.id, 'waiting')}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      Check In (Waiting)
                    </button>
                  )}

                  {/* Consultation / Procedure actions */}
                  {apt.status === 'waiting' && isCosGyn && (
                    <button
                      onClick={() => updateStatus(apt.id, 'completed')}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-md hover:from-pink-700 hover:to-rose-600 transition-colors shadow-xs flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Procedure</span>
                    </button>
                  )}

                  {apt.status === 'waiting' && !isCosGyn && can('action:start_consultation') && (
                    <button
                      onClick={() => handleStartConsultation(apt)}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-primary text-white rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs flex items-center justify-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Start Consultation →</span>
                    </button>
                  )}

                  {apt.status === 'in_progress' && (
                    <>
                      {!isCosGyn && can('action:start_consultation') && (
                        <button
                          onClick={() => handleStartConsultation(apt)}
                          className="flex-1 text-xs font-bold px-3 py-2 bg-primary text-white rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs flex items-center justify-center gap-1"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Open Workbench →</span>
                        </button>
                      )}
                      <button
                        onClick={() => updateStatus(apt.id, 'completed')}
                        className="text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                      >
                        Complete
                      </button>
                    </>
                  )}

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                      className="text-xs font-bold px-2.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => onReschedule(apt)}
                      className="text-xs font-bold px-2.5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md hover:bg-primary/15 transition-colors"
                    >
                      Reschedule
                    </button>
                  )}

                  {/* EMR Button - Not for Cosmetic Gynecology */}
                  {!isCosGyn && (
                    <Link
                      href={`/patients/${apt.patient_id}`}
                      className="text-xs font-bold px-2.5 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                    >
                      EMR
                    </Link>
                  )}

                  {isCosGyn && (
                    <Link
                      href="/cosgyn"
                      className="text-xs font-bold px-2.5 py-2 bg-pink-50 text-pink-700 border border-pink-200 rounded-md hover:bg-pink-100 transition-colors flex items-center gap-1"
                      title="Open Cosmetic Gynecology Dashboard"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                      <span>CosGyn</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredAppointments.length === 0 && (
        <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-base text-slate-700">No appointments found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No patients match the current date and filter selection. Click "+ Book Appointment" above to schedule a new visit.
          </p>
        </div>
      )}
    </>
  );
}
