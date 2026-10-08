'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PharmacyVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingVendor: any;
  vendorForm: any;
  setVendorForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function PharmacyVendorModal({
  isOpen,
  onClose,
  editingVendor,
  vendorForm,
  setVendorForm,
  onSubmit,
}: PharmacyVendorModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingVendor ? 'Edit Pharmacy Vendor' : 'Add Approved Pharmacy Vendor'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor Trade Name *</label>
                <input
                  type="text"
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Merck India Pharma Ltd."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  value={vendorForm.gst_number}
                  onChange={(e) => setVendorForm({ ...vendorForm, gst_number: e.target.value })}
                  placeholder="36AAAAA1234A1Z5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={vendorForm.contact_phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorForm.contact_email}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Warehouse Address</label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
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
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
