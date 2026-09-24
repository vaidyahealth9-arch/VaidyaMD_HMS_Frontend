'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, PackageCheck, Plus, Check, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { patientPackagesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import FertilityWalletCard from '@/components/fertility/FertilityWalletCard';
import {
  StatusBadge,
  RecordPaymentModal,
  ReceiptModal,
  NewInvoiceSheet,
} from '@/components/billing';
import type { Invoice } from '@/features/billing/types';
import { toast } from '@/contexts/ToastContext';
import { useEffect } from 'react';

interface PatientBillingTabProps {
  patientId: string;
  patient: any;
  invoices: any[];
  patientPackages?: any[];
  onDataRefresh?: () => void;
  onDataChanged?: () => void;
  onPackagesRefresh?: (pkgs: any[]) => void;
}

export default function PatientBillingTab({
  patientId,
  patient,
  invoices,
  patientPackages: propPackages,
  onDataRefresh,
  onDataChanged,
  onPackagesRefresh,
}: PatientBillingTabProps) {
  const { user } = useAuth();
  const handleRefresh = onDataRefresh || onDataChanged || (() => {});

  const [internalPackages, setInternalPackages] = useState<any[]>([]);
  const patientPackages = propPackages || internalPackages;

  const loadPackages = () => {
    patientPackagesApi.listByPatient(patientId)
      .then((pkgs: any) => {
        const list = Array.isArray(pkgs) ? pkgs : [];
        if (onPackagesRefresh) onPackagesRefresh(list);
        setInternalPackages(list);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!propPackages && patientId) {
      loadPackages();
    }
  }, [propPackages, patientId]);

  // Shared billing modals state
  const [paymentModalInv, setPaymentModalInv] = useState<Invoice | null>(null);
  const [receiptModalInv, setReceiptModalInv] = useState<Invoice | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);

  // Package service redemption state
  const [selectedRedeemPackage, setSelectedRedeemPackage] = useState<any>(null);
  const [selectedRedeemItem, setSelectedRedeemItem] = useState<any>(null);
  const [redeemQty, setRedeemQty] = useState(1);
  const [redeemNotes, setRedeemNotes] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeemService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRedeemPackage || !selectedRedeemItem) return;
    setIsRedeeming(true);
    try {
      await patientPackagesApi.consume(selectedRedeemPackage.id, {
        item_id: selectedRedeemItem.id,
        quantity: redeemQty,
        doctor_id: user?.id,
        notes: redeemNotes || `Redeemed ${redeemQty}x ${selectedRedeemItem.name}`,
      });
      toast.success('Service Redeemed', `Successfully redeemed ${redeemQty}x ${selectedRedeemItem.name}!`);
      setSelectedRedeemPackage(null);
      setSelectedRedeemItem(null);
      setRedeemQty(1);
      setRedeemNotes('');
      // Reload patient packages
      loadPackages();
    } catch (err: any) {
      toast.error('Redemption Failed', err.message || 'Failed to redeem service');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Advance Wallet & Balance Card */}
      <FertilityWalletCard
        patientId={patientId}
        patientName={patient?.name}
        patientVid={patient?.vid}
        invoices={invoices}
        onWalletUpdated={handleRefresh}
        compact={false}
      />

      {/* Treatment Packages & Service Quotas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-primary" />
              Treatment Packages &amp; Service Quotas
            </h3>
            <p className="text-xs text-slate-500">
              Track bundled clinical procedures, remaining scan/lab quotas, and log service redemptions
            </p>
          </div>
          <Link
            href="/billing?tab=packages"
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Bill New Package
          </Link>
        </div>

        {patientPackages.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No Treatment Packages Subscribed Yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When a bundled package (e.g. IVF-ICSI, IUI, Surrogacy) is billed, its service quotas will appear here for 1-click redemption.
            </p>
            <Link
              href="/billing?tab=packages"
              className="inline-block mt-3 text-xs text-primary font-bold hover:underline"
            >
              View Available Treatment Bundles →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {patientPackages.map((pkg) => {
              const totalAllocated = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.total_qty || 0), 0);
              const totalRemaining = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.remaining_qty || 0), 0);
              const totalConsumed = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.consumed_qty || 0), 0);
              const progressPct = totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0;

              return (
                <div key={pkg.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                  {/* Package Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{pkg.package_name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          pkg.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {pkg.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Subscribed on {formatDate(pkg.created_at)} · Base Package Value: <span className="font-mono font-semibold text-slate-700">{formatCurrency(pkg.total_price || 0)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Quota</span>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {totalConsumed} / {totalAllocated} Used ({totalRemaining} Left)
                        </span>
                      </div>
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quotas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(pkg.items || []).map((it: any) => {
                      const isAvailable = (it.remaining_qty || 0) > 0;
                      return (
                        <div
                          key={it.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isAvailable
                              ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                              : 'bg-slate-100/70 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div>
                              <h5 className="font-bold text-xs text-slate-900">{it.name}</h5>
                              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                                {it.service_code || 'CLINICAL'}
                              </span>
                            </div>
                            <div className="text-right">
                              <span
                                className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                                  isAvailable
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-500'
                                }`}
                              >
                                {it.remaining_qty} / {it.total_qty} left
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-400">
                              Value: {formatCurrency(it.unit_price || 0)}
                            </span>
                            {isAvailable ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRedeemPackage(pkg);
                                  setSelectedRedeemItem(it);
                                  setRedeemQty(1);
                                  setRedeemNotes('');
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-md transition-colors shadow-2xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Redeem
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 italic">Fully Utilized</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent History for this package */}
                  {(() => {
                    const allHistories = (pkg.items || []).flatMap((it: any) =>
                      (it.history || []).map((h: any) => ({ ...h, itemName: it.name }))
                    ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                    if (allHistories.length === 0) return null;

                    return (
                      <div className="pt-2 border-t border-slate-200">
                        <details className="text-xs group">
                          <summary className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-800 select-none flex items-center gap-1.5">
                            <span>View Consumption Audit Trail ({allHistories.length} redemptions)</span>
                          </summary>
                          <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                            {allHistories.slice(0, 10).map((hist: any, hIdx: number) => (
                              <div key={hIdx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded border border-slate-100">
                                <div>
                                  <span className="font-semibold text-slate-800">{hist.itemName}</span>
                                  <span className="text-slate-400 ml-1.5">({hist.consumed_qty}x)</span>
                                  <span className="text-slate-500 ml-2 italic">— {hist.notes || 'Routine utilization'}</span>
                                </div>
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {formatDate(hist.timestamp)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Patient Billing &amp; Invoices</h3>
            <p className="text-xs text-slate-500">Track invoices, record settlements, and generate receipts</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewInvoice(true)}
              className="px-3 py-1.5 bg-primary text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              New Invoice
            </button>
            <Link href="/billing" className="text-xs text-primary font-bold hover:underline px-2">
              Open Billing Hub →
            </Link>
          </div>
        </div>

        {invoices.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No invoices on file for this patient.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Pending Due</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-primary">{inv.invoice_number}</td>
                    <td className="p-3">{inv.appointment_source}</td>
                    <td className="p-3 font-bold">₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-emerald-700 font-bold">₹{parseFloat(inv.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-rose-700 font-bold">
                      {parseFloat(inv.pending_due) > 0 ? `₹${parseFloat(inv.pending_due).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {parseFloat(inv.pending_due) > 0 && (
                          <button
                            type="button"
                            onClick={() => setPaymentModalInv(inv)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setReceiptModalInv(inv)}
                          className="px-2 py-0.5 bg-primary/10 hover:bg-primary/15 text-primary rounded font-bold text-[10px] transition-colors"
                        >
                          Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Quota Redemption Modal */}
      {selectedRedeemPackage && selectedRedeemItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Redeem Package Service
                </h3>
                <p className="text-[11px] text-slate-500">{selectedRedeemPackage.package_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRedeemPackage(null);
                  setSelectedRedeemItem(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemService} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950">{selectedRedeemItem.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {selectedRedeemItem.remaining_qty} remaining
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Pre-paid under treatment bundle. Redeeming this will decrement quota with ₹0 invoice fee.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Redemption Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedRedeemItem.remaining_qty}
                  value={redeemQty}
                  onChange={(e) => setRedeemQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Clinical Notes / Procedure Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Performed during OPD visit #3"
                  value={redeemNotes}
                  onChange={(e) => setRedeemNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRedeemPackage(null);
                    setSelectedRedeemItem(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Billing Modals */}
      {paymentModalInv && (
        <RecordPaymentModal
          invoice={paymentModalInv}
          isOpen={!!paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          onSuccess={() => {
            setPaymentModalInv(null);
            handleRefresh();
          }}
          context="patient-profile"
        />
      )}

      {receiptModalInv && (
        <ReceiptModal
          invoice={receiptModalInv}
          isOpen={!!receiptModalInv}
          onClose={() => setReceiptModalInv(null)}
        />
      )}

      <NewInvoiceSheet
        isOpen={showNewInvoice}
        onClose={() => setShowNewInvoice(false)}
        onSuccess={() => {
          setShowNewInvoice(false);
          handleRefresh();
        }}
        defaultPatientId={patientId}
        lockedPatient={true}
      />
    </div>
  );
}
