'use client';

import React from 'react';
import { Calendar, RotateCcw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import type { EditableSessionItem } from './types';

interface CosgynSessionScheduleTableProps {
  editableSessions: EditableSessionItem[];
  onEditSessionRow: (index: number, field: keyof EditableSessionItem, value: any) => void;
  onResetSessions: () => void;
  isSlotBooked: (equip: string, date: string, time: string, currentSessionId?: string) => boolean;
}

export default function CosgynSessionScheduleTable({
  editableSessions,
  onEditSessionRow,
  onResetSessions,
  isSlotBooked,
}: CosgynSessionScheduleTableProps) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-pink-600" />
          <label className="text-xs font-bold text-slate-800">
            Auto-Populated Session Schedule ({editableSessions.length} Sessions)
          </label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onResetSessions}
          className="h-6 text-[10px] font-bold text-slate-600 hover:bg-slate-100 gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset / Recalculate</span>
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-2 w-8">#</th>
              <th className="p-2">Equipment / Modality</th>
              <th className="p-2">Date (Editable)</th>
              <th className="p-2">Time Slot (Editable)</th>
              <th className="p-2">Duration</th>
              <th className="p-2 text-right">Slot Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {editableSessions.map((session, idx) => {
              const isTesla = session.equipment.toLowerCase().includes('tesla');
              const isConflict = isSlotBooked(session.equipment, session.date, session.time, session.id);
              const dayName = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <tr key={session.id} className="hover:bg-slate-50/70">
                  <td className="p-2 font-mono text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                  <td className="p-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold gap-1 ${
                        isTesla
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {isTesla ? '🪑' : '⚡'} {session.equipment}
                    </Badge>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="date"
                        value={session.date}
                        onChange={(e) => onEditSessionRow(idx, 'date', e.target.value)}
                        className="h-7 text-xs w-32 bg-slate-50"
                      />
                      <span className="text-[10px] text-slate-400 font-semibold">{dayName}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="time"
                      value={session.time}
                      onChange={(e) => onEditSessionRow(idx, 'time', e.target.value)}
                      className="h-7 text-xs w-24 font-mono bg-slate-50"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={session.duration_mins}
                      onChange={(e) => onEditSessionRow(idx, 'duration_mins', Number(e.target.value))}
                      className="h-7 text-xs w-16 bg-slate-50"
                      min={10}
                      max={180}
                    />
                  </td>
                  <td className="p-2 text-right">
                    {isConflict ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Conflict
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Available
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
