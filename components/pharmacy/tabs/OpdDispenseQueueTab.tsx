'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pill,
  ArrowRight,
  Stethoscope,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { formatDate } from '@/lib/utils';

interface OpdDispenseQueueTabProps {
  batches: any[];
  onSelectForDispense: (indent: any) => void;
  onOpenReceipt?: (invoice: any) => void;
}

export default function OpdDispenseQueueTab({
  batches,
  onSelectForDispense,
}: OpdDispenseQueueTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'fulfilled'>('pending');

  // Stock lookup map
  const stockMap = useMemo(() => {
    const map = new Map<string, { total: number; batch: any }>();
    for (const b of batches || []) {
      const code = (b.item_code || '').trim().toLowerCase();
      const name = (b.item_name || '').trim().toLowerCase();
      const qty = Number(b.quantity_available || 0);

      if (code) {
        const prev = map.get(code) || { total: 0, batch: b };
        map.set(code, { total: prev.total + qty, batch: b });
      }
      if (name) {
        const prev = map.get(name) || { total: 0, batch: b };
        map.set(name, { total: prev.total + qty, batch: b });
      }
    }
    return map;
  }, [batches]);

  // Fetch all indents with live polling
  const { data: allIndents = [], isLoading } = useQuery({
    queryKey: ['pharmacy-indents'],
    queryFn: () => pharmacyApi.listIndents(),
    refetchInterval: 10000,
  });

  // Filter for OPD Prescriptions
  const opdIndents = useMemo(() => {
    return (allIndents || []).filter((ind: any) => {
      const isOpdRx =
        ind.indent_type === 'OPD_RX' ||
        (ind.requesting_department || '').toUpperCase() === 'OPD' ||
        (ind.notes || '').toLowerCase().includes('opd rx');
      return isOpdRx;
    });
  }, [allIndents]);

  const filteredIndents = useMemo(() => {
    return opdIndents.filter((ind: any) => {
      const isPending = ind.status === 'Submitted' || ind.status === 'Pending';
      const isFulfilled = ind.status === 'Fulfilled' || ind.status === 'Dispensed';

      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'fulfilled' && !isFulfilled) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const numMatch = (ind.indent_number || '').toLowerCase().includes(q);
      const notesMatch = (ind.notes || '').toLowerCase().includes(q);
      const itemsMatch = (ind.items || []).some((it: any) =>
        (it.item_name || it.drug_name || '').toLowerCase().includes(q) ||
        (it.patient_name || '').toLowerCase().includes(q) ||
        (it.patient_vid || '').toLowerCase().includes(q)
      );
      return numMatch || notesMatch || itemsMatch;
    });
  }, [opdIndents, statusFilter, search]);

  const pendingCount = useMemo(() => {
    return opdIndents.filter((i: any) => i.status === 'Submitted' || i.status === 'Pending').length;
  }, [opdIndents]);

  return (
    <div className="space-y-4 pt-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-800">
                OPD Prescription Dispense Queue
              </CardTitle>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor prescriptions issued from OPD workbench — tap to dispense directly in the standard POS counter with Unified Billing
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Pills */}
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('fulfilled')}
                className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'fulfilled'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fulfilled
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({opdIndents.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, drug, indent..."
                className="h-8 pl-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading pending prescriptions...</div>
          ) : filteredIndents.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700 text-xs">No Prescriptions in Queue</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                {statusFilter === 'pending'
                  ? 'All OPD prescriptions have been reviewed and dispensed. New doctor prescriptions will appear here live.'
                  : 'No prescriptions match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredIndents.map((indent: any) => {
                const items = indent.items || [];
                const firstItem = items[0] || {};
                const patientName = firstItem.patient_name || 'OPD Patient';
                const patientVid = firstItem.patient_vid || '';
                const doctorName = firstItem.doctor_name || 'Consulting Physician';
                const isPending = indent.status === 'Submitted' || indent.status === 'Pending';

                // Check stock for all items
                const allInStock = items.every((it: any) => {
                  const nameKey = (it.item_name || it.drug_name || '').trim().toLowerCase();
                  const codeKey = (it.item_code || '').trim().toLowerCase();
                  const stock = stockMap.get(codeKey) || stockMap.get(nameKey);
                  return (stock?.total || 0) >= (Number(it.quantity || it.quantity_requested || 1));
                });

                return (
                  <div key={indent.id} className="p-4 hover:bg-slate-50/70 transition-colors">
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

                          {isPending && (
                            allInStock ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                All in Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 flex items-center gap-1 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Check Stock Shortage
                              </span>
                            )
                          )}
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
                          <span className="text-xs text-slate-400 font-medium italic">
                            Dispensed &amp; Invoiced
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Medications Pill Grid */}
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
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
