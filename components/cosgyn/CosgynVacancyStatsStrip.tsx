'use client';

import React from 'react';
import { Calendar, Clock } from 'lucide-react';

interface CosgynVacancyStatsStripProps {
  slotVacancyStats: {
    totalSlots: number;
    totalBooked: number;
    totalVacant: number;
    teslaVacant: number;
    jetVacant: number;
    occupancyRate: number;
  };
}

export default function CosgynVacancyStatsStrip({ slotVacancyStats }: CosgynVacancyStatsStripProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Vacant Slots Today</span>
          <p className="text-2xl font-black text-emerald-900 mt-0.5">{slotVacancyStats.totalVacant} Vacant</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Tesla: <strong>{slotVacancyStats.teslaVacant}</strong> · Jet Plasma: <strong>{slotVacancyStats.jetVacant}</strong>
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
          ✓
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Booked Sessions</span>
          <p className="text-2xl font-black text-blue-900 mt-0.5">{slotVacancyStats.totalBooked} Booked</p>
          <p className="text-[11px] text-blue-700 mt-0.5">Occupancy Rate: {slotVacancyStats.occupancyRate}%</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
          <Calendar className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Total Slots Configured</span>
          <p className="text-2xl font-black text-purple-900 mt-0.5">{slotVacancyStats.totalSlots} Slots</p>
          <p className="text-[11px] text-purple-700 mt-0.5">09:00 AM – 07:00 PM (30 min slots)</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
