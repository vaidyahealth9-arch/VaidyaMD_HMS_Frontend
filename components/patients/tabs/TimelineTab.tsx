'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TimelineTabProps {
  timelineEvents: any[];
}

export default function TimelineTab({ timelineEvents }: TimelineTabProps) {
  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto py-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Patient Journey Timeline</h2>
          <p className="text-xs text-slate-500">Chronological history of all touchpoints</p>
        </div>
      </div>

      <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 pb-8">
        {timelineEvents.map((ev, idx) => (
          <div key={idx} className="relative pl-6">
            <span
              className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                ev.type === 'registration'
                  ? 'bg-teal-500'
                  : ev.type === 'appointment'
                  ? 'bg-primary'
                  : ev.type === 'clinical_record'
                  ? 'bg-emerald-500'
                  : ev.type === 'treatment_cycle'
                  ? 'bg-purple-600'
                  : ev.type === 'invoice'
                  ? 'bg-accent'
                  : 'bg-amber-500'
              }`}
            />
            <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
              {ev.type === 'appointment' && ev.metadata?.triage && (
                <div className="mt-3 text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600 font-mono grid grid-cols-2 gap-2">
                  <span>
                    <strong className="text-slate-400">BP:</strong> {ev.metadata.triage.vitals?.bp}
                  </span>
                  <span>
                    <strong className="text-slate-400">HR:</strong> {ev.metadata.triage.vitals?.hr}
                  </span>
                  <span>
                    <strong className="text-slate-400">Temp:</strong> {ev.metadata.triage.vitals?.temp}
                  </span>
                  <span>
                    <strong className="text-slate-400">Wt:</strong> {ev.metadata.triage.vitals?.weight}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {timelineEvents.length === 0 && (
          <div className="pl-6 pt-4 text-sm text-slate-400 font-medium">No events recorded in timeline yet.</div>
        )}
      </div>
    </div>
  );
}
