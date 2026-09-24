'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, X, Plus, CreditCard, Loader2 } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { cosgynApi } from '@/features/cosgyn/api';
import { toast } from '@/contexts/ToastContext';

interface BillingItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  service_code?: string;
}

interface CosGynBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  billingPlan: any;
  onSuccess: (res: any) => void;
}

export default function CosGynBillingModal({
  isOpen,
  onClose,
  billingPlan,
  onSuccess,
}: CosGynBillingModalProps) {
  const queryClient = useQueryClient();

  const [billingMode, setBillingMode] = useState<'package' | 'individual_services'>('package');
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [billingDiscount, setBillingDiscount] = useState<number>(0);
  const [billingTax, setBillingTax] = useState<number>(0);
  const [billingPaymentStatus, setBillingPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [billingPaymentMethod, setBillingPaymentMethod] = useState('cash');
  const [billingUpiMode, setBillingUpiMode] = useState('');
  const [billingNotes, setBillingNotes] = useState('');

  // Initialize billing data whenever billingPlan changes or modal opens
  useEffect(() => {
    if (!billingPlan || !isOpen) return;

    setBillingDiscount(0);
    setBillingTax(0);
    setBillingPaymentStatus('paid');
    setBillingPaymentMethod('cash');
    setBillingUpiMode('');
    setBillingNotes(`CosGyn Treatment Billing for ${billingPlan.patient_name}`);
    setBillingMode('package');

    const pkgPrice = Number(billingPlan.total_amount) || 0;
    setBillingItems([
      {
        description: `CosGyn Treatment Package: ${billingPlan.treatment_name}`,
        quantity: 1,
        unit_price: pkgPrice,
        total: pkgPrice,
        service_code: 'COSGYN-PKG',
      },
    ]);
  }, [billingPlan, isOpen]);

  const generateInvoiceMutation = useMutation({
    mutationFn: (data: { planId: string; payload: any }) =>
      cosgynApi.billPlan(data.planId, data.payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['billing', 'invoices'] });
      onSuccess(res);
    },
    onError: (err: any) => {
      toast.error('Invoice Generation Failed', err.message || 'Error creating invoice');
    },
  });

  const switchBillingMode = (mode: 'package' | 'individual_services') => {
    setBillingMode(mode);
    if (!billingPlan) return;

    if (mode === 'package') {
      const pkgPrice = Number(billingPlan.total_amount) || 0;
      setBillingItems([
        {
          description: `CosGyn Treatment Package: ${billingPlan.treatment_name}`,
          quantity: 1,
          unit_price: pkgPrice,
          total: pkgPrice,
          service_code: 'COSGYN-PKG',
        },
      ]);
    } else {
      const planSessions = billingPlan.sessions || [];
      if (planSessions.length > 0) {
        const items = planSessions.map((s: any) => {
          const equipLower = (s.equipment || '').toLowerCase();
          let price = 4000;
          if (equipLower.includes('jet')) price = 10000;
          else if (equipLower.includes('prp')) price = 14000;
          else if (equipLower.includes('tesla')) price = 4000;
          else if (billingPlan.total_amount) {
            price = Math.round(Number(billingPlan.total_amount) / planSessions.length);
          }

          return {
            description: `CosGyn ${s.equipment || 'Therapy'} - Session #${s.session_number}`,
            quantity: 1,
            unit_price: price,
            total: price,
            service_code: `COSGYN-${(s.equipment || 'PROC').slice(0, 4).toUpperCase()}`,
          };
        });
        setBillingItems(items);
      } else {
        setBillingItems([
          {
            description: 'CosGyn Procedure Session',
            quantity: 1,
            unit_price: Number(billingPlan.total_amount) || 5000,
            total: Number(billingPlan.total_amount) || 5000,
            service_code: 'COSGYN-SESS',
          },
        ]);
      }
    }
  };

  const updateBillingItemField = (index: number, field: keyof BillingItem, value: any) => {
    setBillingItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total = (Number(item.quantity) || 1) * (Number(item.unit_price) || 0);
      }
      copy[index] = item;
      return copy;
    });
  };

  const addBillingItem = () => {
    setBillingItems((prev) => [
      ...prev,
      {
        description: 'CosGyn Additional Procedure / Consumable',
        quantity: 1,
        unit_price: 2500,
        total: 2500,
        service_code: 'COSGYN-EXTRA',
      },
    ]);
  };

  const removeBillingItem = (index: number) => {
    setBillingItems((prev) => prev.filter((_, i) => i !== index));
  };

  const billingSubtotal = useMemo(() => {
    return billingItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  }, [billingItems]);

  const billingNetTotal = useMemo(() => {
    return Math.max(0, billingSubtotal - (Number(billingDiscount) || 0) + (Number(billingTax) || 0));
  }, [billingSubtotal, billingDiscount, billingTax]);

  const handleConfirmBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPlan) return;

    const payload = {
      billing_type: billingMode,
      items: billingItems.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
        service_code: it.service_code,
      })),
      custom_amount: billingNetTotal,
      discount: Number(billingDiscount) || 0,
      tax: Number(billingTax) || 0,
      paid_amount: billingPaymentStatus === 'paid' ? billingNetTotal : 0,
      payment_method: billingPaymentMethod,
      upi_pay_mode: billingUpiMode || undefined,
      notes: billingNotes,
    };

    generateInvoiceMutation.mutate({ planId: billingPlan.id, payload });
  };

  if (!isOpen || !billingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-amber-50/60 via-slate-50 to-pink-50/40 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Cosmetic Gynecology Billing &amp; Invoice
                <Badge variant="outline" className="text-[10px] font-mono bg-amber-100/60 text-amber-900 border-amber-300">
                  HMS Finance
                </Badge>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Patient: <strong className="text-slate-800">{billingPlan.patient_name}</strong>{' '}
                {billingPlan.patient_mrn ? `(${billingPlan.patient_mrn})` : ''} • {billingPlan.treatment_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirmBilling} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Billing Mode Toggle (Package vs Individual Services) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Pricing &amp; Bill Breakdown Mode</span>
              <span className="text-[11px] text-slate-500">Choose lump-sum package billing or itemized session fees</span>
            </div>

            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => switchBillingMode('package')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  billingMode === 'package'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Lump-Sum Package
              </button>
              <button
                type="button"
                onClick={() => switchBillingMode('individual_services')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  billingMode === 'individual_services'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Individual Services / Sessions
              </button>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Invoice Line Items ({billingItems.length})
              </span>
              <button
                type="button"
                onClick={addBillingItem}
                className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service / Item
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Service / Procedure Description</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Unit Price (₹)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billingItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2 px-3">
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateBillingItemField(idx, 'description', e.target.value)}
                          className="h-8 text-xs font-semibold bg-white"
                          placeholder="Service or consumable name"
                          required
                        />
                        {item.service_code && (
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                            Code: {item.service_code}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateBillingItemField(idx, 'quantity', Number(e.target.value))}
                          className="h-8 text-xs text-center font-bold bg-white"
                          required
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <Input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) => updateBillingItemField(idx, 'unit_price', Number(e.target.value))}
                          className="h-8 text-xs text-right font-bold bg-white font-mono"
                          required
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-slate-900 font-mono text-xs">
                        ₹{(Number(item.total) || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {billingItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBillingItem(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove line item"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement & Totals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Payment Configuration */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">Payment Collection Details</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Payment Status
                  </label>
                  <select
                    value={billingPaymentStatus}
                    onChange={(e) => setBillingPaymentStatus(e.target.value as any)}
                    className="w-full h-8 text-xs font-bold rounded-md border border-slate-300 bg-white px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="paid">Paid in Full</option>
                    <option value="pending">Pending / On Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={billingPaymentMethod}
                    onChange={(e) => setBillingPaymentMethod(e.target.value)}
                    className="w-full h-8 text-xs font-semibold rounded-md border border-slate-300 bg-white px-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI (GPay / PhonePe / QR)</option>
                    <option value="card">Card (POS Terminal)</option>
                    <option value="net_banking">Net Banking / NEFT</option>
                  </select>
                </div>
              </div>

              {billingPaymentMethod === 'upi' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    UPI Reference / Transaction ID (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 423985723498"
                    value={billingUpiMode}
                    onChange={(e) => setBillingUpiMode(e.target.value)}
                    className="h-8 text-xs bg-white font-mono"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Billing Remarks / Internal Notes
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Package discount approved by Dr."
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            {/* Calculation Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800 font-mono">₹{billingSubtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Discount (₹):</span>
                <Input
                  type="number"
                  min={0}
                  value={billingDiscount || ''}
                  onChange={(e) => setBillingDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="h-7 text-xs w-28 text-right bg-white font-mono"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Taxes / GST (₹):</span>
                <Input
                  type="number"
                  min={0}
                  value={billingTax || ''}
                  onChange={(e) => setBillingTax(Number(e.target.value))}
                  placeholder="0"
                  className="h-7 text-xs w-28 text-right bg-white font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Total Invoice Amount:</span>
                <span className="font-extrabold text-pink-700 text-base font-mono">
                  ₹{billingNetTotal.toLocaleString()}
                </span>
              </div>

              <div className="pt-1 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Immediate Amount Collected:</span>
                <span className="font-bold text-emerald-700 font-mono">
                  {billingPaymentStatus === 'paid' ? `₹${billingNetTotal.toLocaleString()}` : '₹0 (Pending)'}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={generateInvoiceMutation.isPending || billingNetTotal < 0}
                className="bg-gradient-to-r from-amber-600 via-pink-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white font-bold h-9 text-xs px-5 shadow-sm gap-1.5"
              >
                {generateInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Generating Official Invoice...
                  </>
                ) : (
                  <>
                    <Receipt className="w-3.5 h-3.5 mr-1" />
                    <span>Generate &amp; Post Invoice (₹{billingNetTotal.toLocaleString()})</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
