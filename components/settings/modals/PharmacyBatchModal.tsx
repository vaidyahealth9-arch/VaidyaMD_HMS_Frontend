'use client';

import React from 'react';
import { X, Pill, AlertTriangle } from 'lucide-react';

interface PharmacyBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBatch: any;
  batchForm: any;
  setBatchForm: React.Dispatch<React.SetStateAction<any>>;
  hospitalBranches: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function PharmacyBatchModal({
  isOpen,
  onClose,
  editingBatch,
  batchForm,
  setBatchForm,
  hospitalBranches,
  onSubmit,
}: PharmacyBatchModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingBatch ? 'Edit Pharmacy Inventory Batch' : 'Add New Drug Formulary Batch'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingBatch ? `Updating batch ${editingBatch.batch_number}` : 'Create a new stock batch with FEFO expiry and pricing'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Medication / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.item_name}
                    onChange={(e) => setBatchForm({ ...batchForm, item_name: e.target.value })}
                    placeholder="e.g. DUPHASTON TAB 10MG"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Generic Name / Salt Formulation</label>
                  <input
                    type="text"
                    value={batchForm.generic_name}
                    onChange={(e) => setBatchForm({ ...batchForm, generic_name: e.target.value })}
                    placeholder="e.g. Dydrogesterone 10mg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Item Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.item_code}
                    onChange={(e) => setBatchForm({ ...batchForm, item_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SODU02"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Therapeutic Category *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.category}
                    onChange={(e) => setBatchForm({ ...batchForm, category: e.target.value })}
                    placeholder="e.g. Luteal Support / Hormones"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batch_number}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. MAW26022"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiry_date}
                    onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Available Quantity (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={batchForm.quantity_available}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity_available: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-primary focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Quantity Received</label>
                  <input
                    type="number"
                    min="0"
                    value={batchForm.quantity_received}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity_received: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase / Cost Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchForm.purchase_rate}
                    onChange={(e) => setBatchForm({ ...batchForm, purchase_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={batchForm.mrp}
                    onChange={(e) => setBatchForm({ ...batchForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchForm.selling_price || batchForm.mrp}
                    onChange={(e) => setBatchForm({ ...batchForm, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rack / Storage Location</label>
                  <input
                    type="text"
                    value={batchForm.rack_location}
                    onChange={(e) => setBatchForm({ ...batchForm, rack_location: e.target.value })}
                    placeholder="e.g. D210 / Fridge 1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                {hospitalBranches.length > 1 && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Branch Context</label>
                    <select
                      value={batchForm.branch_id}
                      onChange={(e) => setBatchForm({ ...batchForm, branch_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Default Main Branch</option>
                      {hospitalBranches.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name} ({br.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchForm.is_active}
                      onChange={(e) => setBatchForm({ ...batchForm, is_active: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-slate-700 font-semibold">Active Formulary Stock (Eligible for FEFO OPD Dispensing)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingBatch ? 'Update Batch' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
