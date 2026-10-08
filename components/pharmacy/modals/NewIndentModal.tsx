'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { FileText, Plus, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface NewIndentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function NewIndentModal({
  isOpen,
  onClose,
  onSuccess,
}: NewIndentModalProps) {
  const queryClient = useQueryClient();
  const [newIndentDept, setNewIndentDept] = useState('IVF OT');
  const [newIndentUrgency, setNewIndentUrgency] = useState('Routine');
  const [newIndentItems, setNewIndentItems] = useState<Array<{ item_name: string; quantity: number; notes: string }>>([
    { item_name: '', quantity: 1, notes: '' },
  ]);
  const [isSubmittingIndent, setIsSubmittingIndent] = useState(false);

  const handleClose = () => {
    setNewIndentItems([{ item_name: '', quantity: 1, notes: '' }]);
    onClose();
  };

  const handleCreateIndent = async () => {
    const validItems = newIndentItems.filter((i) => i.item_name.trim());
    if (validItems.length === 0) {
      alert('Please specify at least one medication item for the indent.');
      return;
    }
    setIsSubmittingIndent(true);
    try {
      await pharmacyApi.createIndent({
        requesting_department: newIndentDept,
        urgency: newIndentUrgency,
        items: validItems,
      });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
      handleClose();
      onSuccess?.(`Indent created successfully for ${newIndentDept}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create indent');
    } finally {
      setIsSubmittingIndent(false);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Raise Department Pharmacy Indent</h3>
                  <p className="text-[11px] text-slate-500">Request medications and consumables from hospital pharmacy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose()}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Requesting Department *
                  </label>
                  <select
                    value={newIndentDept}
                    onChange={(e) => setNewIndentDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="IVF OT">IVF OT</option>
                    <option value="Inpatient Ward (IPD)">Inpatient Ward (IPD)</option>
                    <option value="Daycare Procedure Room">Daycare Procedure Room</option>
                    <option value="OPD Consultation Suite">OPD Consultation Suite</option>
                    <option value="Cosmetic Gynecology">Cosmetic Gynecology</option>
                    <option value="Andrology Laboratory">Andrology Laboratory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Urgency Priority *
                  </label>
                  <select
                    value={newIndentUrgency}
                    onChange={(e) => setNewIndentUrgency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Routine">Routine (Within shift)</option>
                    <option value="Urgent">Urgent (Within 1 hour)</option>
                    <option value="Emergency">Emergency (Immediate)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Requested Medications / Items *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewIndentItems([...newIndentItems, { item_name: '', quantity: 1, notes: '' }])}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newIndentItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Drug / Consumable Name (e.g. Inj Progesterone 100mg)"
                        value={item.item_name}
                        onChange={(e) => {
                          const updated = [...newIndentItems];
                          updated[idx].item_name = e.target.value;
                          setNewIndentItems(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...newIndentItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setNewIndentItems(updated);
                        }}
                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-center"
                      />
                      {newIndentItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewIndentItems(newIndentItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose()}
                className="text-xs font-semibold h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSubmittingIndent}
                onClick={handleCreateIndent}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-9 px-5 gap-1.5"
              >
                {isSubmittingIndent ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Indent...</span>
                  </>
                ) : (
                  <span>Submit Indent</span>
                )}
              </Button>
            </div>
          </div>
        </div>
  );
}
