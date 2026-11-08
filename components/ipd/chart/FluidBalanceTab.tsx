'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Droplets } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import EmptyState from '@/components/common/EmptyState';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import type { FluidBalance } from '@/features/ipd/types';

interface FluidBalanceTabProps {
  admissionId: string;
  fluidBalances: FluidBalance[];
  onFluidAdded: () => void;
}

export default function FluidBalanceTab({
  admissionId,
  fluidBalances,
  onFluidAdded,
}: FluidBalanceTabProps) {
  const [isAddingFluid, setIsAddingFluid] = useState(false);
  const [fluidShift, setFluidShift] = useState('Morning');
  const [oralIn, setOralIn] = useState('');
  const [ivIn, setIvIn] = useState('');
  const [urineOut, setUrineOut] = useState('');
  const [drainOut, setDrainOut] = useState('');

  const fluidMutation = useMutation({
    mutationFn: (data: any) => ipdApi.createFluidBalance(admissionId, data),
    onSuccess: () => {
      toast.success('Fluid Balance Logged', 'Shift intake and output documented.');
      setIsAddingFluid(false);
      setOralIn('');
      setIvIn('');
      setUrineOut('');
      setDrainOut('');
      onFluidAdded();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">Fluid Intake & Output (I/O) Balance</CardTitle>
          <p className="text-xs text-slate-500">Hydration vs excretion tracking by nursing shift</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddingFluid(!isAddingFluid)}
          className="h-8 text-xs font-bold gap-1 bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingFluid ? 'Cancel' : 'Log Shift I/O'}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isAddingFluid && (
          <div className="p-4 bg-cyan-50/40 border border-cyan-200 rounded-lg space-y-3">
            <span className="font-bold text-cyan-950 block text-xs">Record Shift Fluid Balance</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Shift</label>
                <select
                  value={fluidShift}
                  onChange={(e) => setFluidShift(e.target.value)}
                  className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                >
                  <option value="Morning">Morning Shift (08:00 - 14:00)</option>
                  <option value="Evening">Evening Shift (14:00 - 20:00)</option>
                  <option value="Night">Night Shift (20:00 - 08:00)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Oral Intake (ml)</label>
                <Input
                  type="number"
                  placeholder="500"
                  value={oralIn}
                  onChange={(e) => setOralIn(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IV Fluids (ml)</label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={ivIn}
                  onChange={(e) => setIvIn(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Urine Output (ml)</label>
                <Input
                  type="number"
                  placeholder="800"
                  value={urineOut}
                  onChange={(e) => setUrineOut(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Surgical Drains / Other (ml)</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={drainOut}
                  onChange={(e) => setDrainOut(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setIsAddingFluid(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  fluidMutation.mutate({
                    shift: fluidShift,
                    intake_oral: Number(oralIn) || 0,
                    intake_iv: Number(ivIn) || 0,
                    output_urine: Number(urineOut) || 0,
                    output_drain: Number(drainOut) || 0,
                  })
                }
                disabled={fluidMutation.isPending}
                className="bg-cyan-600 text-white font-bold"
              >
                {fluidMutation.isPending ? 'Saving...' : 'Save Fluid Balance'}
              </Button>
            </div>
          </div>
        )}

        {/* History Table */}
        {fluidBalances && fluidBalances.length > 0 ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <tr>
                  <th className="p-3">Shift & Date</th>
                  <th className="p-3 text-cyan-800">Total Intake</th>
                  <th className="p-3 text-amber-800">Total Output</th>
                  <th className="p-3">Net 24h Balance</th>
                  <th className="p-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {fluidBalances.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{fb.shift}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(fb.record_date)}
                      </span>
                    </td>
                    <td className="p-3 text-cyan-700 font-bold font-mono">+{fb.total_intake} ml</td>
                    <td className="p-3 text-amber-700 font-bold font-mono">-{fb.total_output} ml</td>
                    <td className="p-3">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          fb.net_balance >= 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {fb.net_balance >= 0 ? `+${fb.net_balance}` : fb.net_balance} ml
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{fb.recorded_by_name || 'Staff Nurse'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Droplets}
            title="No fluid balance entries recorded yet"
            subtitle="Click 'Log Shift I/O' above to record the patient's shift intake and output balance."
            className="py-12"
          />
        )}
      </CardContent>
    </Card>
  );
}
