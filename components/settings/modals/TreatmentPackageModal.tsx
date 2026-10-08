'use client';

import React from 'react';
import { X, Plus, Trash2, Code } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TreatmentPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPackage: any;
  packageForm: any;
  setPackageForm: React.Dispatch<React.SetStateAction<any>>;
  packageEditorMode: 'form' | 'json';
  setPackageEditorMode: React.Dispatch<React.SetStateAction<'form' | 'json'>>;
  packageFormItems: Array<{ name: string; quantity: number; price: number }>;
  setPackageFormItems: React.Dispatch<React.SetStateAction<Array<{ name: string; quantity: number; price: number }>>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TreatmentPackageModal({
  isOpen,
  onClose,
  editingPackage,
  packageForm,
  setPackageForm,
  packageEditorMode,
  setPackageEditorMode,
  packageFormItems,
  setPackageFormItems,
  onSubmit,
}: TreatmentPackageModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPackage ? 'Edit Bundled Package' : 'New Bundled Package'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. IVF-ICSI Comprehensive Package"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Includes OPU, ICSI, Embryo Transfer & 4 Scans"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bundle Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={packageForm.base_price}
                  onChange={(e) => setPackageForm({ ...packageForm, base_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-700 font-semibold">Included Services & Components</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(packageForm.items_json);
                          if (Array.isArray(parsed)) setPackageFormItems(parsed);
                        } catch {}
                        setPackageEditorMode('form');
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        packageEditorMode === 'form' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Form View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(packageFormItems, null, 2) }));
                        setPackageEditorMode('json');
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        packageEditorMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      JSON Editor
                    </button>
                  </div>
                </div>

                {packageEditorMode === 'form' ? (
                  <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto">
                    {packageFormItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <input
                          type="text"
                          placeholder="Service name"
                          value={item.name || ''}
                          onChange={(e) => {
                            const next = [...packageFormItems];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setPackageFormItems(next);
                            setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                          }}
                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                        <div className="w-16 flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => {
                              const next = [...packageFormItems];
                              next[idx] = { ...next[idx], quantity: Math.max(1, Number(e.target.value)) };
                              setPackageFormItems(next);
                              setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                            }}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs text-center font-mono"
                          />
                        </div>
                        <div className="w-24 flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.price || 0}
                            onChange={(e) => {
                              const next = [...packageFormItems];
                              next[idx] = { ...next[idx], price: Number(e.target.value) };
                              setPackageFormItems(next);
                              setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                            }}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = packageFormItems.filter((_, i) => i !== idx);
                            setPackageFormItems(next);
                            setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...packageFormItems, { name: '', quantity: 1, price: 0 }];
                          setPackageFormItems(next);
                          setPackageForm((prev: any[]) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-md flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Service Item
                      </button>

                      {packageFormItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const sum = packageFormItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                            setPackageForm((prev: any[]) => ({ ...prev, base_price: sum }));
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Calculate Total: ₹{packageFormItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0).toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={5}
                      value={packageForm.items_json}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageForm({ ...packageForm, items_json: val });
                        try {
                          const parsed = JSON.parse(val);
                          if (Array.isArray(parsed)) setPackageFormItems(parsed);
                        } catch {}
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-[11px]"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Live JSON Array Schema: [&#123; name, quantity, price &#125;]</span>
                      {(() => {
                        try {
                          const p = JSON.parse(packageForm.items_json);
                          return Array.isArray(p) ? (
                            <span className="text-emerald-600 font-semibold">✓ Valid JSON ({p.length} items)</span>
                          ) : (
                            <span className="text-amber-600">Must be array</span>
                          );
                        } catch {
                          return <span className="text-rose-500 font-semibold">⚠ Syntax Error</span>;
                        }
                      })()}
                    </div>
                  </div>
                )}
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
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
