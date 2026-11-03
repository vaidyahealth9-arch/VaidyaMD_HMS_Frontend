'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TimelineTabProps {
  timelineEvents: any[];
}

export default function TimelineTab({ timelineEvents }: TimelineTabProps) {
  return (
    <div className="space-y-4 w-full py-1 animate-in fade-in">
      {/* Header Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Patient Journey Timeline</h2>
            <p className="text-xs text-slate-500">
              Chronological history of all clinical encounters, registrations, appointments, and billing
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-mono self-start sm:self-center">
          {timelineEvents.length} Event{timelineEvents.length === 1 ? '' : 's'}
        </span>
      </div>

      {timelineEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400 font-medium">
          No events recorded in timeline yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {timelineEvents.map((ev, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 hover:border-primary/40 rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {formatDate(ev.created_at)}
                  </p>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      ev.type === 'registration'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : ev.type === 'appointment'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : ev.type === 'clinical_record'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ev.type === 'treatment_cycle'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : ev.type === 'invoice'
                        ? 'bg-accent-light text-accent border border-accent/30'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {ev.type.replace('_', ' ')}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 capitalize">{ev.title}</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">{ev.description}</p>
              </div>

              {ev.type === 'appointment' && ev.metadata?.triage && (
                <div className="pt-2 border-t border-slate-100 text-[10px] bg-slate-50/70 p-2 rounded text-slate-700 font-mono grid grid-cols-2 gap-1.5">
                  <span>
                    <strong className="text-slate-400">BP:</strong> {ev.metadata.triage.vitals?.bp || '—'}
                  </span>
                  <span>
                    <strong className="text-slate-400">HR:</strong> {ev.metadata.triage.vitals?.hr || '—'}
                  </span>
                  <span>
                    <strong className="text-slate-400">Temp:</strong> {ev.metadata.triage.vitals?.temp || '—'}
                  </span>
                  <span>
                    <strong className="text-slate-400">Wt:</strong> {ev.metadata.triage.vitals?.weight || '—'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
