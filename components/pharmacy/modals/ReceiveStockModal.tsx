'use client';

import React, { useState, useEffect } from 'react';
import { X, Pill, Calculator, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { formatCurrency } from '@/lib/utils';
import { pharmacyApi } from '@/lib/api';

interface ReceiveStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  existingDrug?: any | null; // If adding a new batch for an existing drug
  allBatches?: any[];
}

export default function ReceiveStockModal({
  isOpen,
  onClose,
  onSuccess,
  existingDrug = null,
  allBatches = [],
}: ReceiveStockModalProps) {
  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    generic_name: '',
    category: 'General Pharmacy',
    batch_number: '',
    expiry_date: '',
    pack_size: 10,
    sheets_received: 10,
    purchase_rate: 0,
    mrp: 0,
    selling_price: 0,
    rack_location: 'A001',
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill if existingDrug passed or reset
  useEffect(() => {
    if (existingDrug) {
      setFormData({
        item_code: existingDrug.item_code || '',
        item_name: existingDrug.item_name || '',
        generic_name: existingDrug.generic_name || '',
        category: existingDrug.category || 'General Pharmacy',
        batch_number: '',
        expiry_date: '',
        pack_size: existingDrug.pack_size || 10,
        sheets_received: 10,
        purchase_rate: existingDrug.purchase_rate || 0,
        mrp: existingDrug.mrp || 0,
        selling_price: existingDrug.selling_price || existingDrug.mrp || 0,
        rack_location: existingDrug.rack_location || 'A001',
        is_active: true,
      });
    } else {
      setFormData({
        item_code: '',
        item_name: '',
        generic_name: '',
        category: 'General Pharmacy',
        batch_number: '',
        expiry_date: '',
        pack_size: 10,
        sheets_received: 10,
        purchase_rate: 0,
        mrp: 0,
        selling_price: 0,
        rack_location: 'A001',
        is_active: true,
      });
    }
    setError(null);
  }, [existingDrug, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations
  const packSize = Math.max(1, Number(formData.pack_size) || 1);
  const sheetsRec = Math.max(0, Number(formData.sheets_received) || 0);
  const totalLooseUnits = sheetsRec * packSize;
  const sheetSellingPrice = Number(formData.selling_price) || Number(formData.mrp) || 0;
  const unitSellingPrice = sheetSellingPrice > 0 ? (sheetSellingPrice / packSize) : 0;
  const sheetCost = Number(formData.purchase_rate) || 0;
  const unitCost = sheetCost > 0 ? (sheetCost / packSize) : 0;

  // Unique existing drugs list for quick selection
  const uniqueDrugs = Array.from(
    new Map((allBatches || []).map((b) => [b.item_code, b])).values()
  );

  const handleSelectExistingDrug = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCode = e.target.value;
    if (!selectedCode) return;
    const match = uniqueDrugs.find((d: any) => d.item_code === selectedCode);
    if (match) {
      setFormData((prev) => ({
        ...prev,
        item_code: match.item_code,
        item_name: match.item_name,
        generic_name: match.generic_name || '',
        category: match.category || 'General Pharmacy',
        pack_size: match.pack_size || 10,
        mrp: match.mrp || 0,
        selling_price: match.selling_price || match.mrp || 0,
        purchase_rate: match.purchase_rate || 0,
        rack_location: match.rack_location || 'A001',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.item_name.trim()) {
      setError('Please provide a medication name.');
      return;
    }
    if (!formData.item_code.trim()) {
      setError('Please provide an item code/SKU.');
      return;
    }
    if (!formData.batch_number.trim()) {
      setError('Please provide a batch number.');
      return;
    }
    if (!formData.expiry_date) {
      setError('Please provide an expiry date.');
      return;
    }

    try {
      setIsSubmitting(true);
      await pharmacyApi.createBatch({
        ...formData,
        pack_size: packSize,
        sheets_received: sheetsRec,
        sheets_available: sheetsRec,
        quantity_received: totalLooseUnits,
        quantity_available: totalLooseUnits,
      });

      onSuccess(`New batch ${formData.batch_number} for ${formData.item_name} added successfully! (${totalLooseUnits} units stocked)`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to receive stock batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center font-bold">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {existingDrug ? `Add New Batch: ${existingDrug.item_name}` : 'Receive Stock / Add New Batch'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {existingDrug
                  ? `Piles an additional batch under code ${existingDrug.item_code} with FEFO expiry queue`
                  : 'Inward a new stock shipment in sheets with real-time unit calculation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
          {/* Quick select existing drug if not pre-locked */}
          {!existingDrug && uniqueDrugs.length > 0 && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Select Existing Drug Formulary (Optional)
              </label>
              <select
                onChange={handleSelectExistingDrug}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium focus:ring-1 focus:ring-[rgb(var(--clr-primary))]"
                defaultValue=""
              >
                <option value="">-- Choose from existing medicines to auto-fill details --</option>
                {uniqueDrugs.map((d: any) => (
                  <option key={d.item_code} value={d.item_code}>
                    {d.item_name} ({d.item_code}) · {d.category}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Medication / Brand Name *</label>
              <Input
                required
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g. DOLO 650 TAB"
                className="h-8 text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Generic Name / Formulation</label>
              <Input
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                placeholder="e.g. Paracetamol 650mg"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Item Code / SKU *</label>
              <Input
                required
                value={formData.item_code}
                onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase() })}
                placeholder="e.g. MIDO02"
                className="h-8 text-xs font-mono uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Therapeutic Category *</label>
              <Input
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Analgesics / Antipyretics"
                className="h-8 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Batch Number *</label>
              <Input
                required
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value.toUpperCase() })}
                placeholder="e.g. DOBS5555"
                className="h-8 text-xs font-mono font-bold uppercase text-[rgb(var(--clr-primary))]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Expiry Date (FEFO) *</label>
              <Input
                type="date"
                required
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="h-8 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tablets per Sheet / Pack Size *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.pack_size}
                onChange={(e) => setFormData({ ...formData, pack_size: Math.max(1, Number(e.target.value)) })}
                placeholder="10 or 15 (1 for bottle/inj)"
                className="h-8 text-xs font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Use 1 for single-unit items (syrups/vials)</p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Sheets / Packs Received *
              </label>
              <Input
                type="number"
                min="1"
                required
                value={formData.sheets_received}
                onChange={(e) => setFormData({ ...formData, sheets_received: Math.max(1, Number(e.target.value)) })}
                placeholder="e.g. 10"
                className="h-8 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sheet MRP (₹) *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.mrp || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({
                    ...formData,
                    mrp: val,
                    selling_price: formData.selling_price ? formData.selling_price : val,
                  });
                }}
                placeholder="e.g. 32.28"
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sheet Selling Price (₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.selling_price || ''}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                placeholder={formData.mrp ? String(formData.mrp) : '32.00'}
                className="h-8 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Sheet Purchase / Cost Rate (₹)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.purchase_rate || ''}
                onChange={(e) => setFormData({ ...formData, purchase_rate: Number(e.target.value) })}
                placeholder="e.g. 24.59"
                className="h-8 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Rack / Shelf Location</label>
              <Input
                value={formData.rack_location}
                onChange={(e) => setFormData({ ...formData, rack_location: e.target.value.toUpperCase() })}
                placeholder="e.g. A059 / Fridge 1"
                className="h-8 text-xs uppercase"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Automatic Real-Time Unit Calculation</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Total Loose Stock</span>
                <span className="font-bold text-emerald-800 text-sm">
                  {totalLooseUnits} <span className="text-[11px] font-normal">{packSize > 1 ? 'tabs' : 'units'}</span>
                </span>
                {packSize > 1 && (
                  <span className="text-[10px] text-slate-400 block">({sheetsRec} sheets)</span>
                )}
              </div>
              <div className="p-2 bg-white rounded border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">POS Unit Rate</span>
                <span className="font-bold text-[rgb(var(--clr-primary))] text-sm">
                  {formatCurrency(unitSellingPrice)}
                </span>
                <span className="text-[10px] text-slate-400 block">per {packSize > 1 ? 'tablet' : 'unit'}</span>
              </div>
              <div className="p-2 bg-white rounded border border-emerald-100">
                <span className="text-[10px] text-slate-500 block">Unit Cost</span>
                <span className="font-bold text-slate-700 text-sm">
                  {formatCurrency(unitCost)}
                </span>
                <span className="text-[10px] text-slate-400 block">per {packSize > 1 ? 'tablet' : 'unit'}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white text-xs font-bold px-4"
            >
              {isSubmitting ? 'Stocking Batch...' : 'Save Stock Batch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

