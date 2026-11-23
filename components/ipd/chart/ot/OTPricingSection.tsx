'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';

interface OTPricingSectionProps {
  hourlyRate: string;
  setHourlyRate: (val: string) => void;
  procedureFee: string;
  setProcedureFee: (val: string) => void;
  surgeonFee: string;
  setSurgeonFee: (val: string) => void;
  anesthesiaFee: string;
  setAnesthesiaFee: (val: string) => void;
  guestSurgeonsFee?: number;
  totalHours?: string;
}

export default function OTPricingSection({
  hourlyRate,
  setHourlyRate,
  procedureFee,
  setProcedureFee,
  surgeonFee,
  setSurgeonFee,
  anesthesiaFee,
  setAnesthesiaFee,
  guestSurgeonsFee = 0,
  totalHours = '0',
}: OTPricingSectionProps) {
  const hrs = parseFloat(totalHours) || 0;
  const rate = parseFloat(hourlyRate) || 0;
  const roomEst = hrs * rate;
  const totalEst =
    roomEst +
    (parseFloat(procedureFee) || 0) +
    (parseFloat(surgeonFee) || 0) +
    (parseFloat(anesthesiaFee) || 0) +
    guestSurgeonsFee;

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 uppercase text-[10px] block">
          Fee Tariffs &amp; Billing Presets
        </span>
        <span className="text-[11px] font-bold text-indigo-700 font-mono">
          Est. Total: ₹{totalEst.toLocaleString('en-IN')}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">OT Hourly Rate (₹)</label>
          <Input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="h-7 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">Procedure Base Fee (₹)</label>
          <Input
            type="number"
            value={procedureFee}
            onChange={(e) => setProcedureFee(e.target.value)}
            className="h-7 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">Surgeon Fee (₹)</label>
          <Input
            type="number"
            value={surgeonFee}
            onChange={(e) => setSurgeonFee(e.target.value)}
            className="h-7 text-xs font-mono"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-0.5">Anesthesia Fee (₹)</label>
          <Input
            type="number"
            value={anesthesiaFee}
            onChange={(e) => setAnesthesiaFee(e.target.value)}
            className="h-7 text-xs font-mono"
          />
        </div>
      </div>

      {guestSurgeonsFee > 0 && (
        <div className="flex items-center justify-between text-[11px] p-1.5 px-2 bg-indigo-50 border border-indigo-100 rounded">
          <span className="text-indigo-900 font-semibold">Visiting Guest Surgeon(s) Fee Total:</span>
          <span className="font-mono font-bold text-indigo-800">₹{guestSurgeonsFee.toLocaleString('en-IN')}</span>
        </div>
      )}
    </div>
  );
}
