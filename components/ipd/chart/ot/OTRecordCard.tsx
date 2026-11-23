'use client';

import React from 'react';
import { Scissors, Clock, User, CheckCircle2, Receipt, Printer, Edit3 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { OTRecord } from './types';

interface OTRecordCardProps {
  record: OTRecord;
  onEdit: (record: OTRecord) => void;
  onBill: (record: OTRecord) => void;
  onPrint: (record: OTRecord) => void;
}

export default function OTRecordCard({
  record,
  onEdit,
  onBill,
  onPrint,
}: OTRecordCardProps) {
  const isBilled = record.is_billed;
  const isCompleted = record.status === 'Completed';

  const statusVariant = (st: string) => {
    switch (st) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'purple';
      case 'Wheeled In':
        return 'secondary';
      case 'Cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3 transition-all hover:shadow-xs">
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
            <Scissors className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{record.procedure_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="purple" className="text-[10px]">
                {record.surgery_category} Surgery
              </Badge>
              <Badge variant={statusVariant(record.status) as any} className="text-[10px]">
                {record.status}
              </Badge>
              {isBilled ? (
                <Badge variant="success" className="text-[10px] gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Billed to Ledger</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300 bg-amber-50">
                  Unbilled
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPrint(record)}
            className="h-7 text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print OT Notes</span>
          </Button>

          {!isBilled && (
            <Button
              size="sm"
              onClick={() => onBill(record)}
              className="h-7 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Review &amp; Bill</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(record)}
            className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
            title="Edit OT Record"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Timeline & Duration Chip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Wheel In</span>
          <span className="font-mono font-medium text-slate-800">
            {record.wheel_in_time ? formatDateTime(record.wheel_in_time) : 'Not recorded'}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">Wheel Out</span>
          <span className="font-mono font-medium text-slate-800">
            {record.wheel_out_time ? formatDateTime(record.wheel_out_time) : 'Not recorded'}
          </span>
        </div>
        <div>
          <span className="text-[9px] uppercase font-bold text-slate-400 block">OT Duration</span>
          <span className="font-bold text-indigo-900 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-600" />
            {record.total_ot_hours || 0} Hours
          </span>
        </div>
      </div>

      {/* 3. Surgical Team & Clinical Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Team */}
        <div className="space-y-1.5 p-2.5 bg-white border border-slate-100 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Surgical Team</span>
          <div className="space-y-1 text-[11px]">
            <p>
              <span className="text-slate-400 font-medium">Surgeon:</span>{' '}
              <strong className="text-slate-900">Dr. {(record.primary_surgeon?.name || '').replace(/^dr\.?\s+/i, '') || 'Operating Surgeon'}</strong>
              {(record.assistant_surgeon?.name || (record as any).assistant_surgeon_name) && (
                <span className="text-slate-500"> (Asst: Dr. {((record.assistant_surgeon?.name || (record as any).assistant_surgeon_name) as string).replace(/^dr\.?\s+/i, '')})</span>
              )}
            </p>
            <p>
              <span className="text-slate-400 font-medium">Anesthesia:</span>{' '}
              <span className="text-slate-800 font-semibold">{record.anesthesia_type || 'General'}</span>{' '}
              {(record.anesthetist?.name || (record as any).anesthetist_name) && (
                <span className="text-slate-500">(Dr. {((record.anesthetist?.name || (record as any).anesthetist_name) as string).replace(/^dr\.?\s+/i, '')})</span>
              )}
            </p>
            {((record as any).guest_surgeons || []).length > 0 && (
              <p className="text-indigo-800 text-[10px] font-medium">
                <span className="text-slate-400">Visiting Specialists:</span>{' '}
                {((record as any).guest_surgeons as any[]).map((g) => `Dr. ${(g.name || '').replace(/^dr\.?\s+/i, '')} (${g.role || 'Guest'})`).join(', ')}
              </p>
            )}
            {(record.scrub_nurse || record.circulating_nurse) && (
              <p className="text-slate-600">
                <span className="text-slate-400 font-medium">Nurses:</span>{' '}
                {record.scrub_nurse?.name ? `Scrub: ${record.scrub_nurse.name}` : ''}{' '}
                {record.circulating_nurse?.name ? `· Circ: ${record.circulating_nurse.name}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Clinical Excerpt */}
        <div className="space-y-1.5 p-2.5 bg-white border border-slate-100 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Clinical Operative Notes</span>
          {record.pre_op_diagnosis && (
            <p className="text-[11px] text-slate-700">
              <span className="text-slate-400">Diagnosis:</span> {record.pre_op_diagnosis}
            </p>
          )}
          {record.operative_notes ? (
            <p className="text-[11px] text-slate-600 italic line-clamp-2">
              &ldquo;{record.operative_notes}&rdquo;
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 italic">No surgical operative notes documented.</p>
          )}
        </div>
      </div>

      {/* 4. Financial Cost Strip */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
          <span>
            Room: <strong>{formatCurrency(record.ot_room_charge || 0)}</strong>
          </span>
          <span>
            Procedure: <strong>{formatCurrency(record.procedure_fee || 0)}</strong>
          </span>
          <span>
            Surgeon: <strong>{formatCurrency(record.surgeon_fee || 0)}</strong>
          </span>
          <span>
            Anesthesia: <strong>{formatCurrency(record.anesthesia_fee || 0)}</strong>
          </span>
        </div>
        <div className="font-bold text-slate-900 text-xs">
          Total OT Charge:{' '}
          <span className="text-indigo-700 font-mono">{formatCurrency(record.total_ot_charge || 0)}</span>
        </div>
      </div>
    </div>
  );
}
