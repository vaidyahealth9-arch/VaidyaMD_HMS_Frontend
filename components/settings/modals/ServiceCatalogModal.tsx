'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ServiceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingServiceItem: any;
  serviceItemForm: any;
  setServiceItemForm: React.Dispatch<React.SetStateAction<any>>;
  hospitalBranches: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function ServiceCatalogModal({
  isOpen,
  onClose,
  editingServiceItem,
  serviceItemForm,
  setServiceItemForm,
  hospitalBranches,
  onSubmit,
}: ServiceCatalogModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingServiceItem ? 'Edit Service Catalog Item' : 'New Service Catalog Item'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Code *</label>
                <input
                  type="text"
                  required
                  value={serviceItemForm.code}
                  onChange={(e) => setServiceItemForm({ ...serviceItemForm, code: e.target.value })}
                  placeholder="e.g. OPD-001, USG-002"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceItemForm.name}
                  onChange={(e) => setServiceItemForm({ ...serviceItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={serviceItemForm.category}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Scan">Scan</option>
                    <option value="Lab">Lab</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Daycare">Daycare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={serviceItemForm.base_price}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, base_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={serviceItemForm.hsn_sac}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, hsn_sac: e.target.value })}
                    placeholder="999312"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={serviceItemForm.gst_rate}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
