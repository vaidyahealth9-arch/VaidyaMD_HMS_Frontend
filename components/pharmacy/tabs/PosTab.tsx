'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { pharmacyApi } from '@/lib/api';
import {
  Search,
  ShoppingCart,
  User,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PosTabProps {
  batches: any[];
  patients: any[];
  posCart: Array<{
    item_code: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    batch_number?: string;
  }>;
  setPosCart: React.Dispatch<React.SetStateAction<any[]>>;
  onDispenseSuccess: (invoice: any) => void;
}

export default function PosTab({
  batches,
  patients,
  posCart,
  setPosCart,
  onDispenseSuccess,
}: PosTabProps) {
  const { user, can } = useAuth();
  const queryClient = useQueryClient();

  const [posSearch, setPosSearch] = useState('');
  const [posPatientId, setPosPatientId] = useState<string>('');
  const [posPatientSearch, setPosPatientSearch] = useState<string>('');
  const [isPosPatientDropdownOpen, setIsPosPatientDropdownOpen] = useState<boolean>(false);
  const posPatientDropdownRef = useRef<HTMLDivElement>(null);

  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posAmountPaid, setPosAmountPaid] = useState<number | ''>('');
  const [posPaymentMode, setPosPaymentMode] = useState<string>('Cash');
  const [posPaymentRef, setPosPaymentRef] = useState<string>('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (posPatientDropdownRef.current && !posPatientDropdownRef.current.contains(event.target as Node)) {
        setIsPosPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cartTotal = posCart.reduce((acc, curr) => acc + curr.quantity * curr.unit_price, 0);

  const dispenseMutation = useMutation({
    mutationFn: () => {
      const match = patients.find((p: any) => p.id === posPatientId || `${p.name} (${p.mrn || p.vid})` === posPatientId);
      const effectivePatientId = match ? match.id : posPatientId;
      if (!effectivePatientId) {
        throw new Error('Please select a registered patient before dispensing.');
      }
      return pharmacyApi.dispenseFEFO({
        patient_id: effectivePatientId,
        items: posCart.map((i) => ({ item_code: i.item_code, quantity: i.quantity })),
        doctor_id: user?.id,
        notes: 'Dispensed via Point of Sale counter',
        discount: posDiscount,
        amount_paid: posAmountPaid === '' ? Math.max(0, cartTotal - posDiscount) : Number(posAmountPaid),
        payment_method: posPaymentMode,
        payment_ref: posPaymentRef ? posPaymentRef.trim() : undefined,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-invoices'] });
      setPosCart([]);
      setPosDiscount(0);
      setPosAmountPaid('');
      setPosPaymentMode('Cash');
      setPosPaymentRef('');
      onDispenseSuccess(data);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('Dispensing failed', err.message));
    },
  });

  const handleAddToCart = (batch: any) => {
    if (batch.is_active === false) return;
    if (batch.quantity_available <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((i) => i.item_code === batch.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === batch.item_code ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          item_code: batch.item_code,
          item_name: batch.item_name,
          quantity: 1,
          unit_price: batch.selling_price || batch.mrp,
          batch_number: batch.batch_number,
        },
      ];
    });
  };

  return (
    <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Patient Select & Quick Add Drug */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100">
                  <CardTitle className="text-sm">Select Patient for Pharmacy Dispensing</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {(() => {
                    const selectedPat = patients.find((p: any) => p.id === posPatientId);

                    if (selectedPat) {
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-sm">
                              {selectedPat.name?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-emerald-950">{selectedPat.name}</p>
                                <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 bg-white font-bold">
                                  Ready for Dispensing
                                </Badge>
                              </div>
                              <p className="text-[11px] text-emerald-700 font-mono">
                                MRN: {selectedPat.mrn || selectedPat.vid || 'N/A'} · {selectedPat.gender || 'F'} · {selectedPat.age ? `${selectedPat.age}y` : ''} · {selectedPat.phone ? `Ph: ${selectedPat.phone}` : ''}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPosPatientId('');
                              setPosPatientSearch('');
                              setIsPosPatientDropdownOpen(true);
                            }}
                            className="h-8 text-xs font-semibold border-emerald-300 text-emerald-800 hover:bg-emerald-100/50"
                          >
                            Change Patient
                          </Button>
                        </div>
                      );
                    }

                    // No patient selected yet: render searchable combobox
                    const query = posPatientSearch.toLowerCase().trim();
                    const filtered = patients.filter((p: any) => {
                      if (!query) return true;
                      return (
                        p.name?.toLowerCase().includes(query) ||
                        p.mrn?.toLowerCase().includes(query) ||
                        p.vid?.toLowerCase().includes(query) ||
                        p.phone?.toLowerCase().includes(query)
                      );
                    }).slice(0, 15);

                    return (
                      <div className="relative" ref={posPatientDropdownRef}>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Search Patient (Type Name, MRN, VID, or Phone) *
                        </label>
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="Type to search patient (e.g. Priya, PAT-001, 98765...)"
                            value={posPatientSearch}
                            onChange={(e) => {
                              setPosPatientSearch(e.target.value);
                              setIsPosPatientDropdownOpen(true);
                            }}
                            onFocus={() => setIsPosPatientDropdownOpen(true)}
                            className="pl-9 pr-9 h-10 text-xs bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                          />
                          {posPatientSearch && (
                            <button
                              type="button"
                              onClick={() => {
                                setPosPatientSearch('');
                                setIsPosPatientDropdownOpen(true);
                              }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Combobox dropdown */}
                        {isPosPatientDropdownOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                            {filtered.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-500 font-medium">
                                No registered patients found matching "{posPatientSearch}"
                              </div>
                            ) : (
                              filtered.map((p: any) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setPosPatientId(p.id);
                                    setPosPatientSearch('');
                                    setIsPosPatientDropdownOpen(false);
                                  }}
                                  className="w-full text-left p-3 hover:bg-emerald-50/60 transition-colors flex items-center justify-between group"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-emerald-100 group-hover:text-emerald-800">
                                      {p.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                                        {p.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500 font-mono">
                                        MRN: {p.mrn || p.vid || 'N/A'} · {p.gender || 'F'} · {p.age ? `${p.age}y` : ''} · {p.phone || 'No phone'}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                                    Select Patient →
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}

                        <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          Please search and select a patient to proceed with medication dispensing.
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Fast Stock Selector Grid with Inline Search */}
              <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">Available Medications (1-Click Add)</CardTitle>
                    <p className="text-[11px] text-slate-500">Search inventory by drug name, generic or batch number</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search medications..."
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                      className="pl-8 h-8 text-xs bg-slate-50"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto">
                  {batches
                    .filter((b: any) =>
                      !posSearch ||
                      b.item_name?.toLowerCase().includes(posSearch.toLowerCase()) ||
                      b.batch_number?.toLowerCase().includes(posSearch.toLowerCase()) ||
                      b.item_code?.toLowerCase().includes(posSearch.toLowerCase())
                    )
                    .slice(0, 20)
                    .map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => handleAddToCart(b)}
                        className="p-3 rounded-md border border-slate-200 hover:border-[rgb(var(--clr-primary)/0.4)] bg-white hover:bg-[rgb(var(--clr-primary)/0.04)] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-xs text-slate-900 truncate">{b.item_name}</p>
                          <p className="text-[10px] text-slate-500">
                            Batch: {b.batch_number} · Exp: {formatDate(b.expiry_date)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-[rgb(var(--clr-primary))]">{formatCurrency(b.selling_price || b.mrp)}</p>
                          <span className="text-[10px] font-semibold text-emerald-600">{b.quantity_available} in stock</span>
                        </div>
                      </div>
                    ))}
                  {batches.filter((b: any) =>
                    !posSearch ||
                    b.item_name?.toLowerCase().includes(posSearch.toLowerCase()) ||
                    b.batch_number?.toLowerCase().includes(posSearch.toLowerCase()) ||
                    b.item_code?.toLowerCase().includes(posSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                      No matching medications found in inventory.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Cart & Dispensing Summary */}
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">Dispensing Cart</CardTitle>
                    <Badge variant="purple" className="text-xs font-bold">{posCart.length} Items</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {posCart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Cart is empty. Select items to dispense.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                      {posCart.map((item, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate">{item.item_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">FEFO Batch: {item.batch_number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">x{item.quantity}</span>
                            <span className="font-bold text-slate-900">{formatCurrency(item.quantity * item.unit_price)}</span>
                            <button
                              onClick={() => setPosCart(posCart.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Subtotal:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Discount (₹):</span>
                      <Input
                        type="number"
                        min="0"
                        value={posDiscount || ''}
                        onChange={(e) => setPosDiscount(Number(e.target.value))}
                        className="h-7 text-xs w-24 text-right"
                      />
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-slate-100 pt-2">
                      <span className="text-slate-900">Total Billed:</span>
                      <span className="text-[rgb(var(--clr-primary))]">{formatCurrency(Math.max(0, cartTotal - posDiscount))}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs bg-emerald-50 p-2 rounded-md border border-emerald-100">
                      <span className="text-emerald-800 font-bold">Amount Paid (₹):</span>
                      <Input
                        type="number"
                        min="0"
                        value={posAmountPaid}
                        onChange={(e) => setPosAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={(Math.max(0, cartTotal - posDiscount)).toString()}
                        className="h-7 text-xs w-24 text-right bg-white border-emerald-200"
                      />
                    </div>

                    {/* Payment Mode Selector for Records */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-bold">Mode of Payment:</span>
                        <select
                          value={posPaymentMode}
                          onChange={(e) => setPosPaymentMode(e.target.value)}
                          className="h-7 text-xs font-semibold bg-white border border-slate-300 rounded px-2 text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Insurance">Insurance / TPA</option>
                          <option value="Wallet">Advance Wallet</option>
                        </select>
                      </div>

                      {posPaymentMode !== 'Cash' && (
                        <div className="flex items-center justify-between text-xs gap-2 pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500 text-[11px] flex-shrink-0">Txn / Ref No:</span>
                          <Input
                            type="text"
                            value={posPaymentRef}
                            onChange={(e) => setPosPaymentRef(e.target.value)}
                            placeholder={posPaymentMode === 'UPI' ? 'UPI Ref / UTR' : posPaymentMode === 'Card' ? 'Card Last 4 digits' : 'Reference / Cheque No'}
                            className="h-6 text-xs bg-white text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {can('action:dispense_pharmacy') ? (
                    <Button
                      onClick={() => dispenseMutation.mutate()}
                      disabled={dispenseMutation.isPending || !posPatientId || posCart.length === 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-md shadow-md text-xs mt-2"
                    >
                      {dispenseMutation.isPending ? 'Dispensing & Deducting Stock...' : '1-Click Dispense & Bill'}
                    </Button>
                  ) : (
                    <div className="w-full p-2.5 mt-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 text-xs font-bold text-center">
                      Not Authorized to Dispense Medication
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

    </div>
  );
}
