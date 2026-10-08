'use client';

import React from 'react';
import { X } from 'lucide-react';

interface LimsTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingLimsTest: any;
  limsForm: any;
  setLimsForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LimsTestModal({
  isOpen,
  onClose,
  editingLimsTest,
  limsForm,
  setLimsForm,
  onSubmit,
}: LimsTestModalProps) {
  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingLimsTest ? 'Edit LIMS Test Template' : 'Add LIMS Test Template'}
              </h3>
              <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serum Anti-Müllerian Hormone (AMH)"
                  value={limsForm.test_name}
                  onChange={(e) => setLimsForm({ ...limsForm, test_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-AMH-02"
                    value={limsForm.test_code}
                    onChange={(e) => setLimsForm({ ...limsForm, test_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={limsForm.category}
                    onChange={(e) => setLimsForm({ ...limsForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Andrology">Andrology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Serology">Serology</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sample / Specimen</label>
                  <select
                    value={limsForm.sample_type}
                    onChange={(e) => setLimsForm({ ...limsForm, sample_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Serum">Serum</option>
                    <option value="Whole Blood">Whole Blood (EDTA)</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Semen Ejaculate">Semen Ejaculate</option>
                    <option value="Urine Random">Urine Random</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">TAT (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={limsForm.tat_hours}
                    onChange={(e) => setLimsForm({ ...limsForm, tat_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Normal Reference Interval</label>
                <input
                  type="text"
                  placeholder="e.g. 1.50 - 4.00 ng/mL"
                  value={limsForm.ref_range}
                  onChange={(e) => setLimsForm({ ...limsForm, ref_range: e.target.value })}
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
                  {editingLimsTest ? 'Update Test' : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
