'use client';

import React, { useState } from 'react';
import { Check, CheckCircle2, Clock, Edit3, Ban, Calendar, Pill, AlertTriangle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { formatDateTime } from '@/lib/utils';
import type { IPDOrder } from '@/features/ipd/types';

interface NursesRecordTableProps {
  orders: IPDOrder[];
  onAdministerSlot: (orderId: string, slot: string) => void;
  onRevertSlot: (orderId: string, slot: string) => void;
  onEditOrder: (order: IPDOrder) => void;
  onStopOrder: (order: IPDOrder) => void;
  isAdministering?: boolean;
}

export default function NursesRecordTable({
  orders,
  onAdministerSlot,
  onRevertSlot,
  onEditOrder,
  onStopOrder,
  isAdministering = false,
}: NursesRecordTableProps) {
  const [revertConfirm, setRevertConfirm] = useState<{
    orderId: string;
    itemName: string;
    slot: string;
    nurseName?: string;
  } | null>(null);

  return (
    <>
      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white shadow-2xs">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <th className="p-3 w-10 text-center">#</th>
              <th className="p-3 min-w-[200px]">Medication / Order</th>
              <th className="p-3 w-20">Dosage</th>
              <th className="p-3 w-20">Route</th>
              <th className="p-3 w-20">Freq.</th>
              <th className="p-3 w-28">Start Date</th>
              <th className="p-3 min-w-[240px]">Scheduled Administration Times</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((ord, idx) => {
              const isDiscontinued = ord.status === 'Discontinued';
              const slots = ord.timing_slots && ord.timing_slots.length > 0
                ? ord.timing_slots
                : ['08:00', '20:00'];
              const logs = ord.administered_logs || [];

              return (
                <tr
                  key={ord.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    isDiscontinued ? 'bg-slate-50/40 opacity-75' : ''
                  }`}
                >
                  <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>

                  {/* Medication / Item */}
                  <td className="p-3">
                    <div className="flex items-start gap-2">
                      <div
                        className={`p-1.5 rounded-md mt-0.5 ${
                          ord.order_type === 'Medication'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className={`font-bold block ${isDiscontinued ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {ord.item_name}
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500">{ord.order_type}</span>
                          {ord.duration && (
                            <span className="text-[10px] text-slate-400">• For {ord.duration}</span>
                          )}
                          {ord.instructions && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                              {ord.instructions}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Dosage */}
                  <td className="p-3 font-semibold text-slate-800">{ord.dosage || '—'}</td>

                  {/* Route */}
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {ord.route || 'Oral'}
                    </span>
                  </td>

                  {/* Frequency */}
                  <td className="p-3 font-bold text-indigo-700">{ord.frequency || 'OD'}</td>

                  {/* Start Date */}
                  <td className="p-3 text-[11px] font-mono text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        {ord.start_date
                          ? new Date(ord.start_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })
                          : '—'}
                      </span>
                    </div>
                  </td>

                  {/* Scheduled Times & Checkbox Administration (eMAR) */}
                  <td className="p-3">
                    {isDiscontinued ? (
                      <div className="text-[11px] text-rose-600 italic">
                        Discontinued {ord.stopped_at ? `on ${new Date(ord.stopped_at).toLocaleDateString('en-IN')}` : ''}
                        {ord.stop_reason ? ` (${ord.stop_reason})` : ''}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {slots.map((slot, sIdx) => {
                          const matchingLog = logs.find(
                            (l) => l.timing_slot === slot || (logs.length > sIdx && !l.timing_slot)
                          );
                          const isGiven = !!matchingLog;

                          return (
                            <button
                              key={sIdx}
                              type="button"
                              disabled={isAdministering}
                              onClick={() => {
                                if (isGiven) {
                                  setRevertConfirm({
                                    orderId: ord.id,
                                    itemName: ord.item_name,
                                    slot,
                                    nurseName: matchingLog?.nurse_name,
                                  });
                                } else {
                                  onAdministerSlot(ord.id, slot);
                                }
                              }}
                              title={
                                isGiven
                                  ? `Given by ${matchingLog?.nurse_name || 'Nurse'} • Click to unmark`
                                  : `Click to check dose for ${slot}`
                              }
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                                isGiven
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800'
                                  : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 shadow-2xs'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                                  isGiven
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-400 bg-white'
                                }`}
                              >
                                {isGiven && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span className="font-mono">{slot}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <Badge
                      className={
                        ord.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : ord.status === 'Discontinued'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }
                    >
                      {ord.status}
                    </Badge>
                  </td>

                  {/* Actions: Modify & Discontinue */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!isDiscontinued && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEditOrder(ord)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Modify dosage / schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onStopOrder(ord)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            title="Stop / Discontinue medication"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warning Confirmation Dialog to Uncheck / Revert Dose */}
      {revertConfirm && (
        <Dialog open={!!revertConfirm} onOpenChange={(open) => !open && setRevertConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Unmark Medication Dose</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 pt-1">
                Are you sure you want to uncheck the <strong className="text-slate-900">{revertConfirm.slot}</strong> dose for <strong className="text-slate-900">{revertConfirm.itemName}</strong>?
                {revertConfirm.nurseName && (
                  <span className="block mt-1 text-[11px] text-slate-500">
                    Previously marked as administered by {revertConfirm.nurseName}.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button size="sm" variant="outline" onClick={() => setRevertConfirm(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={() => {
                  onRevertSlot(revertConfirm.orderId, revertConfirm.slot);
                  setRevertConfirm(null);
                }}
              >
                Yes, Unmark Dose
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
