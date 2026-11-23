'use client';

import React from 'react';
import { Receipt } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';

interface CosgynBillingSectionProps {
  bookingPackagePrice: number;
  setBookingPackagePrice: (p: number) => void;
  bookingBillingChoice: 'bill_later' | 'bill_now';
  setBookingBillingChoice: (c: 'bill_later' | 'bill_now') => void;
  bookingDiscount: number;
  setBookingDiscount: (d: number) => void;
  bookingPaidAmount: number | null;
  setBookingPaidAmount: (a: number | null) => void;
  bookingPaymentMethod: string;
  setBookingPaymentMethod: (m: string) => void;
  bookingUpiRef: string;
  setBookingUpiRef: (ref: string) => void;
  bookingNotes: string;
  setBookingNotes: (n: string) => void;
  selectedTreatmentPrice?: number;
}

export default function CosgynBillingSection({
  bookingPackagePrice,
  setBookingPackagePrice,
  bookingBillingChoice,
  setBookingBillingChoice,
  bookingDiscount,
  setBookingDiscount,
  bookingPaidAmount,
  setBookingPaidAmount,
  bookingPaymentMethod,
  setBookingPaymentMethod,
  bookingUpiRef,
  setBookingUpiRef,
  bookingNotes,
  setBookingNotes,
  selectedTreatmentPrice,
}: CosgynBillingSectionProps) {
  const effectivePrice = bookingPackagePrice || selectedTreatmentPrice || 0;
  const netDue = Math.max(0, effectivePrice - bookingDiscount);
  const currentPaid = bookingPaidAmount !== null ? bookingPaidAmount : netDue;
  const remainingDue = Math.max(0, netDue - currentPaid);

  return (
    <div className="p-4 bg-gradient-to-r from-slate-50 via-pink-50/25 to-slate-50 border border-slate-200 rounded-xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-pink-600" />
          <div>
            <h3 className="text-xs font-bold text-slate-900">Record Payment &amp; Billing Option</h3>
            <p className="text-[10px] text-slate-500">Configure package pricing, discounts, and payment collection before confirming</p>
          </div>
        </div>

        {/* Toggle Choice Pills */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBookingBillingChoice('bill_now')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              bookingBillingChoice === 'bill_now'
                ? 'bg-pink-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Record Payment Now
          </button>
          <button
            type="button"
            onClick={() => setBookingBillingChoice('bill_later')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              bookingBillingChoice === 'bill_later'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Bill / Settle Later
          </button>
        </div>
      </div>

      {bookingBillingChoice === 'bill_now' ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Package Fee (₹) *
              </label>
              <Input
                type="number"
                min="0"
                value={bookingPackagePrice || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBookingPackagePrice(val);
                  setBookingPaidAmount(Math.max(0, val - bookingDiscount));
                }}
                placeholder={selectedTreatmentPrice?.toString() || '0'}
                className="h-8 text-xs font-bold bg-white"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Discount (₹)
              </label>
              <Input
                type="number"
                min="0"
                value={bookingDiscount || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBookingDiscount(val);
                  setBookingPaidAmount(Math.max(0, (bookingPackagePrice || selectedTreatmentPrice || 0) - val));
                }}
                placeholder="0"
                className="h-8 text-xs font-bold bg-white font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Amount Paid Now (₹) *
              </label>
              <Input
                type="number"
                min="0"
                value={currentPaid}
                onChange={(e) => setBookingPaidAmount(Number(e.target.value))}
                className="h-8 text-xs font-bold bg-white text-emerald-800 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Payment Mode *
              </label>
              <select
                value={bookingPaymentMethod}
                onChange={(e) => setBookingPaymentMethod(e.target.value)}
                className="w-full h-8 text-xs font-semibold rounded-md border border-slate-300 bg-white px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI (GPay / PhonePe / QR)</option>
                <option value="card">Card (POS Terminal)</option>
                <option value="net_banking">Net Banking / NEFT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {bookingPaymentMethod === 'upi' ? (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  UPI Reference / Transaction ID (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. 423985723498 / GPay Ref"
                  value={bookingUpiRef}
                  onChange={(e) => setBookingUpiRef(e.target.value)}
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Payment / Receipt Notes (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Paid in full at front desk"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            )}

            <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Payment Breakdown:</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-700">
                  Net: <strong className="font-mono">₹{netDue.toLocaleString()}</strong>
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-bold">
                  Paid: <span className="font-mono">₹{Number(currentPaid).toLocaleString()}</span>
                </span>
                {remainingDue > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-700 font-bold font-mono">
                      Due: ₹{remainingDue.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-white rounded-lg border border-dashed border-amber-300 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-900 block">Package Will Be Scheduled Without Immediate Billing</span>
            <span className="text-[11px] text-amber-700">
              Total package fee of ₹{effectivePrice.toLocaleString()} will be marked as "Pending Bill" and can be settled anytime from Booked Packages tab.
            </span>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
            Pending Bill
          </Badge>
        </div>
      )}
    </div>
  );
}
