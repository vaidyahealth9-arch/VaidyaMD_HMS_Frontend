'use client';

import React, { useState } from 'react';
import { Trash2, Receipt, CheckCircle2, Clock, FileText } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import type { BillItem } from '@/features/ipd/types';

interface RollingBillTableProps {
  items: BillItem[];
  activeCategory: string;
  statusFilter: 'unbilled' | 'billed' | 'all';
  selectedItemIds: Set<string>;
  onToggleSelect: (itemId: string) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onViewInvoice?: (invoiceId: string) => void;
  isDeleting?: boolean;
}

export default function RollingBillTable({
  items,
  activeCategory,
  statusFilter,
  selectedItemIds,
  onToggleSelect,
  onSelectAll,
  onDeleteItem,
  onViewInvoice,
  isDeleting = false,
}: RollingBillTableProps) {
  const [itemToDelete, setItemToDelete] = useState<BillItem | null>(null);

  const unbilledItems = items.filter((i) => !i.is_billed);
  const isAllUnbilledSelected =
    unbilledItems.length > 0 && unbilledItems.every((i) => selectedItemIds.has(i.id));

  if (items.length === 0) {
    return (
      <EmptyState
        icon={statusFilter === 'billed' ? CheckCircle2 : Receipt}
        title={
          statusFilter === 'unbilled'
            ? 'No unbilled charges pending'
            : statusFilter === 'billed'
            ? 'No billed invoices yet'
            : activeCategory === 'all'
            ? 'No charges accrued yet'
            : `No items in ${activeCategory}`
        }
        subtitle={
          statusFilter === 'unbilled'
            ? 'All bedside and daily room tariffs have been billed into settled invoices.'
            : statusFilter === 'billed'
            ? 'Billed items and paid invoices will pile up here once invoices are generated.'
            : 'Services and daily room tariffs will appear here in real time.'
        }
        className="py-12"
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              {/* Checkbox column for selective billing */}
              <th className="p-3 w-10 text-center">
                {unbilledItems.length > 0 ? (
                  <input
                    type="checkbox"
                    aria-label="Select all unbilled items"
                    checked={isAllUnbilledSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </th>
              <th className="p-3">Status</th>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3 text-right">Unit Rate</th>
              <th className="p-3 text-right">Total (₹)</th>
              <th className="p-3">Source & Staff</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {items.map((item) => {
              const isBilled = Boolean(item.is_billed);
              const isSelected = selectedItemIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/60'
                      : isBilled
                      ? 'bg-slate-50/40 hover:bg-slate-50/80'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="p-3 text-center">
                    {!isBilled ? (
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.item_name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    )}
                  </td>

                  {/* Billing Status Badge */}
                  <td className="p-3 whitespace-nowrap">
                    {isBilled ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Billed & Paid</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Unbilled</span>
                      </span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {item.billing_date ? new Date(item.billing_date).toLocaleString('en-IN') : '—'}
                  </td>

                  {/* Category */}
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        item.category === 'Room & Bed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.category === 'Nursing Care'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.category === 'Doctor Consultation'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : item.category === 'Surgical Consumables'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.category === 'Medication'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : item.category === 'Diet & Nutrition'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : item.category === 'Oxygen & Gas' || item.category === 'Equipment'
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{item.item_name}</span>
                    {item.notes && <span className="text-[11px] text-slate-400 font-normal">{item.notes}</span>}
                  </td>

                  {/* Quantity */}
                  <td className="p-3 text-right font-mono text-slate-700">{item.quantity}</td>

                  {/* Unit Rate */}
                  <td className="p-3 text-right font-mono text-slate-700">{formatCurrency(item.unit_price)}</td>

                  {/* Total */}
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.total_price)}
                  </td>

                  {/* Source & Staff */}
                  <td className="p-3 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      {item.is_automated ? (
                        <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600">
                          Auto Accrued
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] border-indigo-200 text-indigo-700 bg-indigo-50/50">
                          Bedside
                        </Badge>
                      )}
                      <span className="text-[11px] truncate">{item.created_by_name}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-3 text-center">
                    {isBilled && item.invoice_id && onViewInvoice ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewInvoice(item.invoice_id!)}
                        className="h-6 px-2 text-[10px] font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                        title="View Billing Invoice"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Invoice</span>
                      </Button>
                    ) : !isBilled && !item.is_automated ? (
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Remove unbilled item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Accessible Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => {
          if (itemToDelete) {
            onDeleteItem(itemToDelete.id);
            setItemToDelete(null);
          }
        }}
        title="Remove Bill Item"
        description={`Are you sure you want to remove "${itemToDelete?.item_name}" from this patient's rolling bill? Accrued totals will be adjusted automatically.`}
        confirmLabel="Yes, Remove Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
