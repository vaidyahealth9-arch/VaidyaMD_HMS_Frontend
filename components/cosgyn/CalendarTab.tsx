'use client';

import React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
} from 'lucide-react';
import { addDaysToDate } from './utils';
import CosgynVacancyStatsStrip from './CosgynVacancyStatsStrip';

interface CalendarTabProps {
  calendarDate: string;
  setCalendarDate: (d: string) => void;
  calendarEquipmentFilter: 'all' | 'Tesla Chair' | 'Jet Plasma';
  setCalendarEquipmentFilter: (f: 'all' | 'Tesla Chair' | 'Jet Plasma') => void;
  todayStr: string;
  operationalTimeSlots: string[];
  daySessions: any[];
  slotVacancyStats: {
    totalSlots: number;
    totalBooked: number;
    totalVacant: number;
    teslaVacant: number;
    jetVacant: number;
    occupancyRate: number;
  };
  onOpenBookingModal: (treatmentId?: string, date?: string, time?: string, equipment?: string) => void;
  onNavigateToPackage?: (planId?: string) => void;
}

export default function CalendarTab({
  calendarDate,
  setCalendarDate,
  calendarEquipmentFilter,
  setCalendarEquipmentFilter,
  todayStr,
  operationalTimeSlots,
  daySessions,
  slotVacancyStats,
  onOpenBookingModal,
  onNavigateToPackage,
}: CalendarTabProps) {
  return (
    <div className="space-y-4">
      {/* Calendar Header & Day Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setCalendarDate(addDaysToDate(calendarDate, -1))}
              className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCalendarDate(todayStr)}
              className={`px-3 py-1.5 text-xs font-bold border-x border-slate-200 transition-colors cursor-pointer ${
                calendarDate === todayStr ? 'bg-pink-50 text-pink-700' : 'hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCalendarDate(addDaysToDate(calendarDate, 1))}
              className="p-2 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Input
            type="date"
            value={calendarDate}
            onChange={(e) => setCalendarDate(e.target.value)}
            className="h-9 text-xs w-40 font-bold text-slate-800"
          />

          <span className="text-sm font-extrabold text-slate-800">
            {new Date(calendarDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        {/* Filter by equipment */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Suite Filter:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
            <button
              onClick={() => setCalendarEquipmentFilter('all')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                calendarEquipmentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              All Suites
            </button>
            <button
              onClick={() => setCalendarEquipmentFilter('Tesla Chair')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                calendarEquipmentFilter === 'Tesla Chair' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              🪑 Tesla Chair
            </button>
            <button
              onClick={() => setCalendarEquipmentFilter('Jet Plasma')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                calendarEquipmentFilter === 'Jet Plasma' ? 'bg-white text-primary shadow-xs' : 'text-slate-500'
              }`}
            >
              ⚡ Jet Plasma
            </button>
          </div>
        </div>
      </div>

      {/* Vacancy Summary Status Strip */}
      <CosgynVacancyStatsStrip slotVacancyStats={slotVacancyStats} />

      {/* Time & Slot Grid Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-pink-600" />
            <span>Date &amp; Time Slot Matrix — {new Date(calendarDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
          </h3>
          <span className="text-[11px] text-slate-500">Click any vacant slot to book directly</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-28 text-center border-r border-slate-200">Time Slot</th>
                {(calendarEquipmentFilter === 'all' || calendarEquipmentFilter === 'Tesla Chair') && (
                  <th className="p-3 border-r border-slate-200 bg-purple-50/50 text-purple-950">
                    <div className="flex items-center gap-1.5">
                      <span>🪑</span>
                      <span>Tesla Chair Suite (Pelvic Floor)</span>
                    </div>
                  </th>
                )}
                {(calendarEquipmentFilter === 'all' || calendarEquipmentFilter === 'Jet Plasma') && (
                  <th className="p-3 bg-pink-50/50 text-pink-950">
                    <div className="flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Jet Plasma Suite (Mucosal Therapy)</span>
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operationalTimeSlots.map((timeSlot) => {
                // Check Tesla Chair session for this slot
                const teslaSession = daySessions.find((s: any) => {
                  if (!(s.equipment || '').toLowerCase().includes('tesla')) return false;
                  const sTime = s.scheduled_datetime ? new Date(s.scheduled_datetime).toTimeString().slice(0, 5) : '';
                  return sTime === timeSlot;
                });

                // Check Jet Plasma session for this slot
                const jetSession = daySessions.find((s: any) => {
                  if (!(s.equipment || '').toLowerCase().includes('jet')) return false;
                  const sTime = s.scheduled_datetime ? new Date(s.scheduled_datetime).toTimeString().slice(0, 5) : '';
                  return sTime === timeSlot;
                });

                return (
                  <tr key={timeSlot} className="hover:bg-slate-50/50 transition-colors">
                    {/* Time Column */}
                    <td className="p-3 text-center border-r border-slate-200 font-bold font-mono text-slate-700 bg-slate-50/60">
                      {timeSlot}
                    </td>
                    {/* Tesla Chair Column */}
                    {(calendarEquipmentFilter === 'all' || calendarEquipmentFilter === 'Tesla Chair') && (
                      <td className="p-2.5 border-r border-slate-200">
                        {teslaSession ? (
                          <div
                            onClick={() => onNavigateToPackage?.(teslaSession.plan_id)}
                            className="p-2.5 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 hover:border-purple-300 rounded-lg flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
                            title="Click to view & modify package in Booked Packages tab"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-purple-950 group-hover:text-purple-700 transition-colors">
                                  {teslaSession.patient_name}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-800 border-purple-300">
                                  {teslaSession.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-purple-800 mt-0.5 truncate max-w-xs">
                                {teslaSession.treatment_name} · {teslaSession.duration_mins}m
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-purple-700 bg-white group-hover:bg-purple-700 group-hover:text-white px-2 py-0.5 rounded border border-purple-200 transition-colors">
                              Booked ↗
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenBookingModal(undefined, calendarDate, timeSlot, 'Tesla Chair')}
                            className="w-full py-2 px-3 border border-dashed border-emerald-300 rounded-lg bg-emerald-50/40 hover:bg-emerald-100/60 transition-colors flex items-center justify-between text-emerald-800 group cursor-pointer"
                          >
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Vacant Slot</span>
                            </span>
                            <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity">
                              + Book Tesla Chair
                            </span>
                          </button>
                        )}
                      </td>
                    )}
                    {/* Jet Plasma Column */}
                    {(calendarEquipmentFilter === 'all' || calendarEquipmentFilter === 'Jet Plasma') && (
                      <td className="p-2.5">
                        {jetSession ? (
                          <div
                            onClick={() => onNavigateToPackage?.(jetSession.plan_id)}
                            className="p-2.5 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 hover:border-pink-300 rounded-lg flex items-center justify-between shadow-2xs transition-all cursor-pointer group"
                            title="Click to view & modify package in Booked Packages tab"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-pink-950 group-hover:text-pink-700 transition-colors">
                                  {jetSession.patient_name}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-pink-100 text-pink-800 border-pink-300">
                                  {jetSession.status}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-pink-800 mt-0.5 truncate max-w-xs">
                                {jetSession.treatment_name} · {jetSession.duration_mins}m
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-pink-700 bg-white group-hover:bg-pink-700 group-hover:text-white px-2 py-0.5 rounded border border-pink-200 transition-colors">
                              Booked ↗
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenBookingModal(undefined, calendarDate, timeSlot, 'Jet Plasma')}
                            className="w-full py-2 px-3 border border-dashed border-emerald-300 rounded-lg bg-emerald-50/40 hover:bg-emerald-100/60 transition-colors flex items-center justify-between text-emerald-800 group cursor-pointer"
                          >
                            <span className="font-semibold text-xs flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Vacant Slot</span>
                            </span>
                            <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity">
                              + Book Jet Plasma
                            </span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
