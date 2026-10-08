'use client';

import React, { useState } from 'react';
import { Search, Printer, Receipt, Loader2, ShoppingCart } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BillsTabProps {
  invoices: any[];
  isLoading: boolean;
  onPrintInvoice: (invoice: any) => void;
  onSwitchToPos?: () => void;
}

export default function BillsTab({
  invoices: allInvoices,
  isLoading: invoicesLoading,
  onPrintInvoice,
  onSwitchToPos,
}: BillsTabProps) {
  const [billSearchQuery, setBillSearchQuery] = useState('');

  const pharmacyInvoices = (allInvoices as any[]).filter((inv: any) => {
    const isPharmaSource = (inv.appointment_source || '').toLowerCase() === 'pharmacy';
    const isPharmaInvNum = (inv.invoice_number || '').toUpperCase().startsWith('INV-PHARM');
    const hasPharmaReason = (inv.reason_for_attendance || '').toLowerCase().includes('pharmacy') || (inv.reason_for_attendance || '').toLowerCase().includes('dispens');
    return isPharmaSource || isPharmaInvNum || hasPharmaReason;
  });

  const filteredPharmacyInvoices = pharmacyInvoices.filter((inv: any) => {
    if (!billSearchQuery.trim()) return true;
    const q = billSearchQuery.toLowerCase().trim();
    const num = (inv.invoice_number || '').toLowerCase();
    const patName = (inv.patient_name || '').toLowerCase();
    const patVid = (inv.patient_vid || inv.patient_mrn || '').toLowerCase();
    const payMode = (inv.payment_method || '').toLowerCase();
    return num.includes(q) || patName.includes(q) || patVid.includes(q) || payMode.includes(q);
  });

  return (
    <div className="space-y-4 pt-2">
          {/* Top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pharmacy Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(pharmacyInvoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.paid_amount || inv.total_amount) || 0), 0))}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{pharmacyInvoices.length} total dispensed bills</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Paid / Settled Invoices</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {pharmacyInvoices.filter((i: any) => (i.status || '').toLowerCase() === 'paid').length}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Fully collected at pharmacy counter</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider">Today's Dispenses</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  return pharmacyInvoices.filter((i: any) => (i.created_at || '').startsWith(todayStr)).length;
                })()}
              </p>
              <p className="text-[11px] text-primary/80 mt-0.5">Dispensed today via FEFO</p>
            </div>
          </div>

          {/* Search bar & quick action */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={billSearchQuery}
                onChange={(e) => setBillSearchQuery(e.target.value)}
                placeholder="Search by invoice #, patient name, VID..."
                className="pl-9 h-9 text-xs rounded-md"
              />
            </div>
            <Button
              size="sm"
              onClick={() => onSwitchToPos?.()}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-md shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              + New POS Dispense
            </Button>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Dispensed Medication(s)</th>
                  <th className="p-3.5 text-center">Date &amp; Time</th>
                  <th className="p-3.5 text-right">Billed Amount</th>
                  <th className="p-3.5 text-center">Payment Mode</th>
                  <th className="p-3.5 text-center">Payment Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span>Loading pharmacy invoices...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPharmacyInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-slate-600">No Pharmacy Bills Found</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Dispense medications via the Dispensing POS tab to automatically generate hospital tax invoices and printable patient receipts.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPharmacyInvoices.map((inv: any) => {
                    const itemsCount = Array.isArray(inv.items) ? inv.items.length : 0;
                    const firstItem = Array.isArray(inv.items) && inv.items[0]
                      ? (inv.items[0].item_name || inv.items[0].description)
                      : null;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.patient_name || 'Walk-in Patient'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">VID: {inv.patient_vid || inv.patient_mrn || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          {firstItem ? (
                            <div>
                              <p className="text-slate-800 font-medium">{firstItem}</p>
                              {itemsCount > 1 && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  +{itemsCount - 1} more medication{itemsCount > 2 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">FEFO Dispense</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center text-slate-600">
                          {formatDate(inv.created_at)}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(inv.total_amount)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-sky-50 text-sky-800 border border-sky-200">
                            {inv.payment_method || 'Cash'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {inv.status || 'PAID'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPrintInvoice(inv)}
                            className="gap-1.5 text-xs font-bold h-8 border-slate-300 hover:border-[rgb(var(--clr-primary))] hover:text-[rgb(var(--clr-primary))]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Bill / Receipt
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

    </div>
  );
}
