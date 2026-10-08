'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  Plus,
  Pill,
  Building,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import PharmacyVendorModal from '../modals/PharmacyVendorModal';
import PharmacyBatchModal from '../modals/PharmacyBatchModal';

interface PharmacySettingsTabProps {
  pharmacyVendors: any[];
  setPharmacyVendors: React.Dispatch<React.SetStateAction<any[]>>;
  pharmacyBatches: any[];
  setPharmacyBatches: React.Dispatch<React.SetStateAction<any[]>>;
  hospitalBranches: any[];
}

export default function PharmacySettingsTab({
  pharmacyVendors,
  setPharmacyVendors,
  pharmacyBatches,
  setPharmacyBatches,
  hospitalBranches,
}: PharmacySettingsTabProps) {
  const queryClient = useQueryClient();
  const [pharmaSubTab, setPharmaSubTab] = useState<'vendors' | 'inventory'>('vendors');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    gst_number: '',
    contact_phone: '',
    contact_email: '',
    address: '',
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [batchForm, setBatchForm] = useState({
    item_code: '',
    item_name: '',
    generic_name: '',
    category: 'Fertility / Hormones',
    batch_number: '',
    expiry_date: '',
    quantity_available: 50,
    quantity_received: 50,
    purchase_rate: 0,
    mrp: 0,
    selling_price: 0,
    rack_location: 'A003',
    branch_id: '',
    is_active: true,
  });
  const [batchSearch, setBatchSearch] = useState('');
  const [batchCategoryFilter, setBatchCategoryFilter] = useState('ALL');
  const [batchStatusFilter, setBatchStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await pharmacyApi.updateVendor(editingVendor.id, vendorForm);
        alert('Approved vendor updated successfully!');
      } else {
        await pharmacyApi.createVendor(vendorForm);
        alert('Approved vendor created successfully!');
      }
      setShowVendorModal(false);
      setEditingVendor(null);
      setVendorForm({ name: '', gst_number: '', contact_phone: '', contact_email: '', address: '' });
      pharmacyApi.listVendors().then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this vendor?')) return;
    try {
      await pharmacyApi.deleteVendor(vendorId);
      alert('Vendor deactivated successfully!');
      pharmacyApi.listVendors().then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : []));
    } catch (e: any) {
      alert(e.message || 'Failed to delete vendor');
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await pharmacyApi.updateBatch(editingBatch.id, batchForm);
        alert('Pharmacy formulary batch updated successfully!');
      } else {
        await pharmacyApi.createBatch(batchForm);
        alert('New pharmacy formulary batch created successfully!');
      }
      setShowBatchModal(false);
      setEditingBatch(null);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save pharmacy batch');
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    const target = pharmacyBatches.find((b) => b.id === batchId);
    const medName = target?.item_name || 'this medicine';
    if (!confirm(`Are you sure you want to deactivate "${medName}" (${target?.batch_number || ''})?\n\nDeactivating will prevent it from appearing in pharmacy stock and prevent dispensing.`)) return;
    try {
      await pharmacyApi.deleteBatch(batchId, { deactivate_all: true });
      alert(`Medication "${medName}" deactivated successfully. It is now excluded from pharmacy stock and FEFO dispensing.`);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate pharmacy batch');
    }
  };

  const handleReactivateBatch = async (batch: any) => {
    if (!confirm(`Reactivate "${batch.item_name}" (${batch.batch_number}) for pharmacy stock and dispensing?`)) return;
    try {
      await pharmacyApi.updateBatch(batch.id, { is_active: true });
      alert(`Medication "${batch.item_name}" reactivated successfully! It is now active in pharmacy stock.`);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to reactivate pharmacy batch');
    }
  };


  return (
    <>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setPharmaSubTab('vendors')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  pharmaSubTab === 'vendors' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Approved Vendors ({pharmacyVendors.length})
              </button>
              <button
                onClick={() => setPharmaSubTab('inventory')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  pharmaSubTab === 'inventory' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Formulary Stock & Reorder Levels ({pharmacyBatches.length})
              </button>
            </div>
            {pharmaSubTab === 'vendors' ? (
              <button
                onClick={() => {
                  setEditingVendor(null);
                  setVendorForm({ name: '', gst_number: '', contact_phone: '', contact_email: '', address: '' });
                  setShowVendorModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vendor
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchForm({
                    item_code: '',
                    item_name: '',
                    generic_name: '',
                    category: 'Fertility / Hormones',
                    batch_number: '',
                    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    quantity_available: 50,
                    quantity_received: 50,
                    purchase_rate: 0,
                    mrp: 0,
                    selling_price: 0,
                    rack_location: 'A003',
                    branch_id: '',
                    is_active: true,
                  });
                  setShowBatchModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Drug Batch
              </button>
            )}
          </div>

          {pharmaSubTab === 'vendors' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Vendor Legal Name</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3">Contact Phone</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacyVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{v.gst_number || '---'}</td>
                      <td className="py-3 px-3 text-slate-600">{v.contact_phone || '---'}</td>
                      <td className="py-3 px-3 text-slate-600">{v.contact_email || '---'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          Active Supplier
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingVendor(v);
                              setVendorForm({
                                name: v.name,
                                gst_number: v.gst_number || '',
                                contact_phone: v.contact_phone || '',
                                contact_email: v.contact_email || '',
                                address: v.address || '',
                              });
                              setShowVendorModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-100"
                            title="Edit Vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search brand, salt, batch #, rack..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {batchSearch && (
                    <button
                      onClick={() => setBatchSearch('')}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                    <select
                      value={batchStatusFilter}
                      onChange={(e) => setBatchStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="ALL">All Batches ({pharmacyBatches.length})</option>
                      <option value="ACTIVE">Active Formulary ({pharmacyBatches.filter((b) => b.is_active !== false).length})</option>
                      <option value="INACTIVE">Deactivated ({pharmacyBatches.filter((b) => b.is_active === false).length})</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                    <select
                      value={batchCategoryFilter}
                      onChange={(e) => setBatchCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="ALL">All Categories</option>
                      {Array.from(new Set(pharmacyBatches.map((b) => b.category).filter(Boolean))).sort().map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Batches Table with Edit Actions */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Brand &amp; Formulation</th>
                      <th className="py-3 px-3">Item Code</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Batch &amp; Rack</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-3 text-center">Available Stock</th>
                      <th className="py-3 px-3 text-right">Purchase Rate</th>
                      <th className="py-3 px-3 text-right">MRP</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pharmacyBatches
                      .filter((b) => {
                        const q = batchSearch.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          (b.item_name || '').toLowerCase().includes(q) ||
                          (b.generic_name || '').toLowerCase().includes(q) ||
                          (b.batch_number || '').toLowerCase().includes(q) ||
                          (b.item_code || '').toLowerCase().includes(q) ||
                          (b.rack_location || '').toLowerCase().includes(q);
                        const matchesCat =
                          batchCategoryFilter === 'ALL' || (b.category || '') === batchCategoryFilter;
                        const matchesStatus =
                          batchStatusFilter === 'ALL' ||
                          (batchStatusFilter === 'ACTIVE' && b.is_active !== false) ||
                          (batchStatusFilter === 'INACTIVE' && b.is_active === false);
                        return matchesSearch && matchesCat && matchesStatus;
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.item_name}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{b.generic_name || '---'}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700">{b.item_code || '---'}</td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {b.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-800 font-semibold">{b.batch_number}</div>
                            <div className="text-[10px] text-slate-500">Rack: {b.rack_location || '---'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {b.expiry_date ? String(b.expiry_date).split('T')[0] : '---'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                (b.quantity_available || 0) <= 5
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : (b.quantity_available || 0) <= 20
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {b.quantity_available ?? 0} units
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(b.purchase_rate || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(b.mrp || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                b.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {b.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingBatch(b);
                                  setBatchForm({
                                    item_code: b.item_code || '',
                                    item_name: b.item_name || '',
                                    generic_name: b.generic_name || '',
                                    category: b.category || 'General Pharmacy',
                                    batch_number: b.batch_number || '',
                                    expiry_date: b.expiry_date ? String(b.expiry_date).split('T')[0] : '',
                                    quantity_available: b.quantity_available ?? 0,
                                    quantity_received: b.quantity_received ?? b.quantity_available ?? 0,
                                    purchase_rate: b.purchase_rate ?? 0,
                                    mrp: b.mrp ?? 0,
                                    selling_price: b.selling_price ?? b.mrp ?? 0,
                                    rack_location: b.rack_location || '',
                                    branch_id: b.branch_id || '',
                                    is_active: b.is_active !== false,
                                  });
                                  setShowBatchModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                                title="Edit Batch Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {b.is_active !== false ? (
                                <button
                                  onClick={() => handleDeleteBatch(b.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Deactivate Batch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateBatch(b)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                                  title="Reactivate Batch"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </div>

      <PharmacyVendorModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        editingVendor={editingVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        onSubmit={handleSaveVendor}
      />
      <PharmacyBatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        editingBatch={editingBatch}
        batchForm={batchForm}
        setBatchForm={setBatchForm}
        hospitalBranches={hospitalBranches}
        onSubmit={handleSaveBatch}
      />
    </>
  );
}
