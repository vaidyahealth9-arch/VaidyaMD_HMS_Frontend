'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { Input } from '@/shared/ui/input';

interface OTTimelineSectionProps {
  otStatus: string;
  setOtStatus: (val: string) => void;
  wheelInTime: string;
  wheelOutTime: string;
  totalHours: string;
  setTotalHours: (val: string) => void;
  onWheelTimeChange: (wheelIn: string, wheelOut: string) => void;
}

export default function OTTimelineSection({
  otStatus,
  setOtStatus,
  wheelInTime,
  wheelOutTime,
  totalHours,
  setTotalHours,
  onWheelTimeChange,
}: OTTimelineSectionProps) {
  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <span className="font-bold text-slate-700 uppercase text-[10px] block flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-indigo-600" />
        <span>OT Table Timeline &amp; Status</span>
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Status</label>
          <select
            value={otStatus}
            onChange={(e) => setOtStatus(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Wheeled In">Wheeled In</option>
            <option value="In Progress">In Progress</option>
            <option value="Recovery">Recovery Room</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Wheel In Time</label>
          <Input
            type="datetime-local"
            value={wheelInTime}
            onChange={(e) => onWheelTimeChange(e.target.value, wheelOutTime)}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Wheel Out Time</label>
          <Input
            type="datetime-local"
            value={wheelOutTime}
            onChange={(e) => onWheelTimeChange(wheelInTime, e.target.value)}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-500 block mb-0.5">Total Hours</label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={totalHours}
            onChange={(e) => setTotalHours(e.target.value)}
            className="h-8 text-xs font-mono font-bold"
          />
        </div>
      </div>
    </div>
  );
}
