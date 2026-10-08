'use client';

import React from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DispenseSuccessModalProps {
  invoice: any | null;
  onClose: () => void;
  onPrint: (invoice: any) => void;
}

export default function DispenseSuccessModal({
  invoice: dispensedInvoice,
  onClose,
  onPrint,
}: DispenseSuccessModalProps) {
  if (!dispensedInvoice) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Dispensing &amp; Invoice Complete!</h3>
                  <p className="text-xs text-emerald-100 font-medium">Inventory stocks deducted via FEFO &amp; invoice recorded in billing</p>
                </div>
              </div>
              <button
                onClick={() => onClose()}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto" id="pharmacy-receipt-area">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 tracking-tight">VaidyaMD Pharmacy</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700 bg-emerald-50 font-bold">
                      TAX INVOICE / CASH MEMO
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Dispensed at Counter POS</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-900 font-mono">#{dispensedInvoice.invoice_number}</p>
                  <p className="text-[11px] text-slate-500">{new Date(dispensedInvoice.created_at || Date.now()).toLocaleString('en-IN')}</p>
                  <Badge variant="purple" className="text-[9px] uppercase font-bold mt-1">Status: PAID</Badge>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{dispensedInvoice.patient_name || 'Patient'}</span>
                </div>
                {dispensedInvoice.patient_mrn && (
                  <div className="text-right">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Patient ID / MRN</span>
                    <span className="font-mono font-bold text-slate-800">{dispensedInvoice.patient_mrn}</span>
                  </div>
                )}
              </div>

              {/* Dispensed Items Table */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2.5">Medication</th>
                      <th className="p-2.5">Batch #</th>
                      <th className="p-2.5 text-center">Expiry</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(dispensedInvoice.dispensed_batches || []).map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{item.item_name}</td>
                        <td className="p-2.5 font-mono text-[11px] text-[rgb(var(--clr-primary))]">{item.batch_number}</td>
                        <td className="p-2.5 text-center text-slate-600 text-[11px]">{formatDate(item.expiry_date)}</td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{item.quantity_dispensed}</td>
                        <td className="p-2.5 text-right text-slate-700">{formatCurrency(item.unit_price)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="p-2.5 text-right font-bold text-slate-700">Total Billed &amp; Received:</td>
                      <td className="p-2.5 text-right font-black text-sm text-emerald-700">{formatCurrency(dispensedInvoice.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50/70 p-3 rounded-md border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Inventory stock automatically updated. Batches were selected following strict First-Expiry-First-Out (FEFO) medical protocols.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  onPrint(dispensedInvoice);
                }}
                className="gap-1.5 text-xs font-bold border-slate-300 hover:border-[rgb(var(--clr-primary))] hover:text-[rgb(var(--clr-primary))]"
              >
                <Printer className="w-4 h-4" />
                Print Pharmacy Receipt / Bill
              </Button>
              <Button
                onClick={() => onClose()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6"
              >
                Done / Next Patient
              </Button>
            </div>
          </div>
        </div>
  );
}
