'use client';

import React from 'react';
import {
  Receipt,
  PlusCircle,
  CreditCard,
  Printer,
  LogOut,
  Filter,
  CheckSquare,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface RollingBillFilterBarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  statusFilter: 'unbilled' | 'billed' | 'all';
  onSelectStatusFilter: (status: 'unbilled' | 'billed' | 'all') => void;
  unbilledCount: number;
  unbilledTotal: number;
  billedCount: number;
  selectedCount: number;
  selectedTotal: number;
  onOpenAddItem: () => void;
  onOpenDeposit: () => void;
  onOpenPrint: () => void;
  onDischarge: () => void;
  onGenerateBill: () => void;
}

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Categories' },
  { id: 'Room & Bed', label: 'Room & Bed' },
  { id: 'Nursing Care', label: 'Nursing Care' },
  { id: 'Doctor Consultation', label: 'Doctor Rounds' },
  { id: 'Medication', label: 'Pharmacy: Meds' },
  { id: 'Surgical Consumables', label: 'Pharmacy: Surgical' },
  { id: 'Diet & Nutrition', label: 'Diet & Meals' },
  { id: 'Oxygen & Gas', label: 'Oxygen & Gas' },
  { id: 'Equipment', label: 'Equipment' },
  { id: 'Procedures', label: 'Procedures' },
];

export default function RollingBillFilterBar({
  activeCategory,
  onSelectCategory,
  statusFilter,
  onSelectStatusFilter,
  unbilledCount,
  unbilledTotal,
  billedCount,
  selectedCount,
  selectedTotal,
  onOpenAddItem,
  onOpenDeposit,
  onOpenPrint,
  onDischarge,
  onGenerateBill,
}: RollingBillFilterBarProps) {
  return (
    <div className="border-b border-slate-100">
      {/* Top Header & Actions */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Inpatient Rolling Bill Ledger</span>
          </h3>
          <p className="text-xs text-slate-500">
            Selective dynamic billing, payment receipts, and automated daily tariff postings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Billing Action */}
          <Button
            size="sm"
            onClick={onGenerateBill}
            disabled={unbilledCount === 0}
            className={`h-8 text-xs font-bold gap-1.5 shadow-xs transition-colors ${
              selectedCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {selectedCount > 0
                ? `Bill Selected (${selectedCount} — ${formatCurrency(selectedTotal)})`
                : `Generate Bill (${unbilledCount} unbilled)`}
            </span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAddItem}
            className="h-8 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Bedside Item</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenDeposit}
            className="h-8 text-xs font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Collect Deposit</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenPrint}
            className="h-8 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Ledger</span>
          </Button>

          <Button
            size="sm"
            onClick={onDischarge}
            className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Discharge & Settle</span>
          </Button>
        </div>
      </div>

      {/* Status Sub-Tabs: Unbilled vs Billed & Paid vs All */}
      <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectStatusFilter('unbilled')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'unbilled'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Unbilled Charges</span>
            <Badge
              variant={statusFilter === 'unbilled' ? 'outline' : 'secondary'}
              className={`text-[10px] px-1 py-0 ${
                statusFilter === 'unbilled' ? 'bg-amber-600 text-white border-transparent' : ''
              }`}
            >
              {unbilledCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatusFilter('billed')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'billed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Billed & Paid Invoices</span>
            <Badge
              variant={statusFilter === 'billed' ? 'outline' : 'secondary'}
              className={`text-[10px] px-1 py-0 ${
                statusFilter === 'billed' ? 'bg-emerald-700 text-white border-transparent' : ''
              }`}
            >
              {billedCount}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>All Ledger Records</span>
          </button>
        </div>

        {statusFilter === 'unbilled' && unbilledCount > 0 && (
          <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Unbilled Total: {formatCurrency(unbilledTotal)}
          </span>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="px-4 py-2 bg-slate-50/40 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {CATEGORY_TABS.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
