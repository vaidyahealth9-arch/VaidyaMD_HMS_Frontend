'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Droplets, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import EmptyState from '@/components/common/EmptyState';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import type { FluidBalance, AdmissionDetails } from '@/features/ipd/types';
import PrintFluidBalanceModal from '../modals/PrintFluidBalanceModal';

interface FluidBalanceTabProps {
  admissionId: string;
  fluidBalances: FluidBalance[];
  admission?: AdmissionDetails;
  onFluidAdded: () => void;
}

export default function FluidBalanceTab({
  admissionId,
  fluidBalances,
  admission,
  onFluidAdded,
}: FluidBalanceTabProps) {
  const [isAddingFluid, setIsAddingFluid] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

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
    <>
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Fluid Intake &amp; Output (I/O) Balance</CardTitle>
            <p className="text-xs text-slate-500">Hydration vs excretion tracking by nursing shift</p>
          </div>
          <div className="flex items-center gap-2">
            {fluidBalances && fluidBalances.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPrintModalOpen(true)}
                className="h-8 text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Fluid Sheet</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsAddingFluid(!isAddingFluid)}
              className="h-8 text-xs font-bold gap-1 bg-cyan-600 text-white hover:bg-cyan-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingFluid ? 'Cancel' : 'Log Shift I/O'}</span>
            </Button>
          </div>
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
                    className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
                  >
                    <option value="Morning">Morning Shift (07:00 - 15:00)</option>
                    <option value="Evening">Evening Shift (15:00 - 23:00)</option>
                    <option value="Night">Night Shift (23:00 - 07:00)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Oral Intake (ml)</label>
                  <Input placeholder="e.g. 500" value={oralIn} onChange={(e) => setOralIn(e.target.value)} className="h-8 text-xs" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">IV Infusion (ml)</label>
                  <Input placeholder="e.g. 1000" value={ivIn} onChange={(e) => setIvIn(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Urine Output (ml)</label>
                  <Input placeholder="e.g. 800" value={urineOut} onChange={(e) => setUrineOut(e.target.value)} className="h-8 text-xs" />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Drain / Vomitus (ml)</label>
                  <Input placeholder="e.g. 50" value={drainOut} onChange={(e) => setDrainOut(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setIsAddingFluid(false)}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={() =>
                    fluidMutation.mutate({
                      shift: fluidShift,
                      intake_oral: parseFloat(oralIn) || 0,
                      intake_iv: parseFloat(ivIn) || 0,
                      output_urine: parseFloat(urineOut) || 0,
                      output_drain: parseFloat(drainOut) || 0,
                    })
                  }
                  disabled={fluidMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
                >
                  {fluidMutation.isPending ? 'Logging...' : 'Save Fluid Balance'}
                </Button>
              </div>
            </div>
          )}

          {/* Fluid Balances Grid */}
          {fluidBalances && fluidBalances.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Date / Shift</th>
                    <th className="p-3 text-cyan-800">Total Intake</th>
                    <th className="p-3 text-slate-700">Total Output</th>
                    <th className="p-3">Net Balance</th>
                    <th className="p-3">Logged By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fluidBalances.map((fb) => {
                    const isPositive = fb.net_balance >= 0;
                    return (
                      <tr key={fb.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-900">
                          {formatDate(fb.record_date)} · {fb.shift} Shift
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-700">
                          {fb.total_intake} ml{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Oral: {fb.intake_oral || 0}, IV: {fb.intake_iv || 0})
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700">
                          {fb.total_output} ml{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Urine: {fb.output_urine || 0}, Drain: {fb.output_drain || 0})
                          </span>
                        </td>
                        <td className={`p-3 font-mono font-bold ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPositive ? `+${fb.net_balance}` : fb.net_balance} ml
                        </td>
                        <td className="p-3 text-slate-500">{fb.recorded_by_name || 'Staff Nurse'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Droplets}
              title="No Fluid Balances Logged"
              subtitle="Record shift oral intake, IV infusions, and excretion balances."
              className="py-10"
            />
          )}
        </CardContent>
      </Card>

      {/* Print Fluid Balance Modal */}
      {isPrintModalOpen && (
        <PrintFluidBalanceModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          admission={admission}
          fluidBalances={fluidBalances}
        />
      )}
    </>
  );
}
