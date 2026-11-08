'use client';

import React from 'react';
import { Pill, ArrowRight, CheckCircle2, AlertTriangle, Stethoscope, Clock, BedDouble } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatDate } from '@/lib/utils';

interface DispenseQueueItemCardProps {
  indent: any;
  stockMap: Map<string, { total: number; batch: any }>;
  onSelectForDispense: (indent: any) => void;
}

export default function DispenseQueueItemCard({
  indent,
  stockMap,
  onSelectForDispense,
}: DispenseQueueItemCardProps) {
  const items = indent.items || [];
  const firstItem = items[0] || {};
  const patientName = firstItem.patient_name || indent.patient_name || 'Patient';
  const patientVid = firstItem.patient_vid || indent.patient_vid || '';
  const doctorName = firstItem.doctor_name || indent.requested_by_name || 'Doctor';
  const isIpd =
    indent.indent_type === 'IPD_RX' ||
    indent.indent_type === 'IPD_ORDER' ||
    (indent.requesting_department || '').toUpperCase() === 'IPD' ||
    (indent.notes || '').toLowerCase().includes('ipd');
  const bedNumber = firstItem.bed_number || '';
  const isPending = indent.status === 'Submitted' || indent.status === 'Pending';

  const allInStock = items.every((it: any) => {
    const nameKey = (it.item_name || it.drug_name || '').trim().toLowerCase();
    const codeKey = (it.item_code || '').trim().toLowerCase();
    const stock = stockMap.get(codeKey) || stockMap.get(nameKey);
    return (stock?.total || 0) >= Number(it.quantity || it.quantity_requested || 1);
  });

  return (
    <div className="p-4 hover:bg-slate-50/70 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Patient and indent details */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-slate-900">{patientName}</span>
            {patientVid && (
              <Badge variant="outline" className="text-[10px] font-mono border-slate-300 text-slate-600 bg-white">
                {patientVid}
              </Badge>
            )}

            {/* Department Badge */}
            {isIpd ? (
              <Badge variant="purple" className="text-[10px] font-bold gap-1">
                <BedDouble className="w-2.5 h-2.5" />
                <span>IPD Inpatient {bedNumber ? `· Bed ${bedNumber}` : ''}</span>
              </Badge>
            ) : (
              <Badge variant="info" className="text-[10px] font-bold">
                OPD Rx
              </Badge>
            )}

            <span className="text-[11px] font-mono text-slate-400">#{indent.indent_number}</span>

            {isPending ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                Pending Dispense
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Fulfilled
              </span>
            )}

            {isPending &&
              (allInStock ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  All in Stock
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 flex items-center gap-1 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  Stock Shortage
                </span>
              ))}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3 text-[rgb(var(--clr-primary))]" />
              <span>Dr. {doctorName}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatDate(indent.created_at)}</span>
            </span>
          </div>
        </div>

        {/* Right: Action button */}
        <div className="shrink-0">
          {isPending ? (
            <Button
              size="sm"
              onClick={() => onSelectForDispense(indent)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3.5 rounded-md shadow-xs gap-1.5 cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5" />
              <span>Dispense in POS</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          ) : (
            <span className="text-xs text-slate-400 font-medium italic">Dispensed &amp; Invoiced</span>
          )}
        </div>
      </div>

      {/* Prescribed Medications & Consumables Pill Grid */}
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((it: any, idx: number) => {
          const drugName = it.item_name || it.drug_name || 'Drug';
          const nameKey = drugName.trim().toLowerCase();
          const codeKey = (it.item_code || '').trim().toLowerCase();
          const match = stockMap.get(codeKey) || stockMap.get(nameKey);
          const available = match?.total || 0;
          const reqQty = Number(it.quantity || it.quantity_requested || 1);
          const hasEnough = available >= reqQty;

          return (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs shadow-2xs"
            >
              <span className="font-semibold text-slate-800">{drugName}</span>
              {it.dose && <span className="text-[10px] text-slate-500 font-mono">{it.dose}</span>}
              {it.frequency && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200 text-slate-600">
                  {it.frequency}
                </Badge>
              )}
              <span className="text-[11px] font-bold text-slate-700">x{reqQty}</span>

              {hasEnough ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Stock: {available}
                </span>
              ) : (
                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                  Stock: {available}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
