'use client';

import React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Search,
  X,
  Calendar,
  Clock,
  Zap,
  Printer,
  SlidersHorizontal,
  Receipt,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface ScheduleTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  equipmentFilter: 'all' | 'Jet Plasma' | 'Tesla Chair';
  setEquipmentFilter: (f: 'all' | 'Jet Plasma' | 'Tesla Chair') => void;
  statusFilter: 'all' | 'scheduled' | 'completed' | 'cancelled';
  setStatusFilter: (s: 'all' | 'scheduled' | 'completed' | 'cancelled') => void;
  filteredSessions: any[];
  sessions: any[];
  patients: any[];
  sessionsLoading: boolean;
  onOpenBookingModal: () => void;
  onPrintSchedule: (data: any) => void;
  onOpenEditScheduleForSession: (session: any) => void;
  onOpenBillingModalForSession: (session: any) => void;
  onUpdateSessionStatus: (sessionId: string, status: string) => void;
  isUpdatingSession?: boolean;
}

export default function ScheduleTab({
  searchQuery,
  setSearchQuery,
  equipmentFilter,
  setEquipmentFilter,
  statusFilter,
  setStatusFilter,
  filteredSessions,
  sessions,
  patients,
  sessionsLoading,
  onOpenBookingModal,
  onPrintSchedule,
  onOpenEditScheduleForSession,
  onOpenBillingModalForSession,
  onUpdateSessionStatus,
  isUpdatingSession = false,
}: ScheduleTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, ID, or treatment..."
              className="pl-8 pr-7 h-8 text-xs bg-slate-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Equipment Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setEquipmentFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                equipmentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Equipment
            </button>
            <button
              onClick={() => setEquipmentFilter('Jet Plasma')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                equipmentFilter === 'Jet Plasma' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Jet Plasma
            </button>
            <button
              onClick={() => setEquipmentFilter('Tesla Chair')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                equipmentFilter === 'Tesla Chair' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tesla Chair
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('scheduled')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'scheduled' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Scheduled
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed
            </button>
          </div>
        </div>

        <span className="text-slate-500 font-medium">
          Showing {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto w-full">
        {sessionsLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No equipment sessions found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the "Book Package &amp; Schedule Sessions" button above to enroll a patient in a Cosmetic Gynecology protocol.
            </p>
            <Button
              onClick={onOpenBookingModal}
              className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-8 mt-2"
            >
              + Book First Session
            </Button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Protocol / Package</th>
                <th className="py-2.5 px-3">Scheduled Date &amp; Time</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right min-w-[300px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSessions.map((session: any) => {
                const isJet = session.equipment === 'Jet Plasma';
                const isDone = session.status?.toLowerCase() === 'completed';

                return (
                  <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 text-xs">{session.patient_name}</span>
                        {(() => {
                          const pat = patients.find((p: any) => p.id === session.patient_id);
                          const regId = pat?.vid || pat?.mrn || session.patient_mrn || session.patient_vid;
                          return regId ? (
                            <span className="inline-block text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.2 rounded w-fit">
                              {regId}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold gap-1.5 ${
                          isJet
                            ? 'bg-primary/10 border-primary/20 text-primary'
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        {session.equipment}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-xs truncate">
                      {session.treatment_name}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {new Date(session.scheduled_datetime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {session.duration_mins} mins
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : session.status?.toLowerCase() === 'cancelled'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-sky-100 text-sky-800 border-sky-300'
                        }`}
                      >
                        {session.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap min-w-[300px]">
                      <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                        {/* Print Schedule Card for this Patient */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const relatedSessions = sessions.filter(
                              (s: any) => s.patient_id === session.patient_id && s.plan_id === session.plan_id
                            );
                            const pat = patients.find((p: any) => p.id === session.patient_id);
                            onPrintSchedule({
                              patient: {
                                name: session.patient_name,
                                vid: session.patient_id?.slice(0, 8),
                                mrn: pat?.mrn || pat?.vid,
                                age: pat?.age,
                                gender: pat?.gender,
                                phone: pat?.phone,
                              },
                              packageName: session.treatment_name,
                              sessions: relatedSessions.length > 0 ? relatedSessions : [session],
                            });
                          }}
                          className="h-7 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 flex-shrink-0"
                          title="Print Patient Schedule Card"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
                          Print Card
                        </Button>

                        {/* Edit Schedule for this Package */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenEditScheduleForSession(session)}
                          className="h-7 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 flex-shrink-0"
                          title="Edit schedule of all sessions in this package"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                          Edit Schedule
                        </Button>

                        {/* Bill / Invoice for this session's plan */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenBillingModalForSession(session)}
                          className="h-7 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex-shrink-0"
                          title="Generate Invoice / Billing for this procedure or package"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Bill
                        </Button>

                        {!isDone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateSessionStatus(session.id, 'completed')}
                            disabled={isUpdatingSession}
                            className="h-7 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex-shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
