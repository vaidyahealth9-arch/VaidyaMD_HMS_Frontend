'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { FileText, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import DispenseQueueItemCard from './DispenseQueueItemCard';

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
  const [departmentFilter, setDepartmentFilter] = useState<'all' | 'opd' | 'ipd'>('all');

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

  // Filter for Clinical (OPD & IPD) Prescriptions & Consumables
  const clinicalIndents = useMemo(() => {
    return (allIndents || []).filter((ind: any) => {
      const isClinical =
        ind.indent_type === 'OPD_RX' ||
        ind.indent_type === 'IPD_RX' ||
        ind.indent_type === 'IPD_ORDER' ||
        ['OPD', 'IPD', 'INPATIENT'].includes((ind.requesting_department || '').toUpperCase()) ||
        (ind.notes || '').toLowerCase().includes('opd rx') ||
        (ind.notes || '').toLowerCase().includes('ipd');
      return isClinical;
    });
  }, [allIndents]);

  const filteredIndents = useMemo(() => {
    return clinicalIndents.filter((ind: any) => {
      const isPending = ind.status === 'Submitted' || ind.status === 'Pending';
      const isFulfilled = ind.status === 'Fulfilled' || ind.status === 'Dispensed';

      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'fulfilled' && !isFulfilled) return false;

      const isIpd =
        ind.indent_type === 'IPD_RX' ||
        ind.indent_type === 'IPD_ORDER' ||
        (ind.requesting_department || '').toUpperCase() === 'IPD' ||
        (ind.notes || '').toLowerCase().includes('ipd');

      if (departmentFilter === 'opd' && isIpd) return false;
      if (departmentFilter === 'ipd' && !isIpd) return false;

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
  }, [clinicalIndents, statusFilter, departmentFilter, search]);

  const pendingCount = useMemo(() => {
    return clinicalIndents.filter((i: any) => i.status === 'Submitted' || i.status === 'Pending').length;
  }, [clinicalIndents]);

  return (
    <div className="space-y-4 pt-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-800">
                Clinical Prescription &amp; Inpatient Dispense Queue
              </CardTitle>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Doctor prescriptions &amp; bedside material orders issued from OPD and IPD — tap to dispense directly at the POS counter
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Filter Pills */}
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setDepartmentFilter('all')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  departmentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sources
              </button>
              <button
                type="button"
                onClick={() => setDepartmentFilter('opd')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  departmentFilter === 'opd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                OPD Only
              </button>
              <button
                type="button"
                onClick={() => setDepartmentFilter('ipd')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  departmentFilter === 'ipd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                IPD Bedside
              </button>
            </div>

            {/* Status Filter Pills */}
            <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('fulfilled')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'fulfilled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fulfilled
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({clinicalIndents.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-52">
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
                  ? 'All clinical prescriptions have been reviewed and dispensed. New doctor orders will appear here live.'
                  : 'No prescriptions match the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredIndents.map((indent: any) => (
                <DispenseQueueItemCard
                  key={indent.id}
                  indent={indent}
                  stockMap={stockMap}
                  onSelectForDispense={onSelectForDispense}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
