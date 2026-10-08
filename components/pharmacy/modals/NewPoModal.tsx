'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { Truck, Plus, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { formatCurrency } from '@/lib/utils';

interface NewPoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function NewPoModal({
  isOpen,
  onClose,
  onSuccess,
}: NewPoModalProps) {
  const queryClient = useQueryClient();
  const [newPoVendor, setNewPoVendor] = useState('');
  const [newPoDeliveryDate, setNewPoDeliveryDate] = useState('');
  const [newPoItems, setNewPoItems] = useState<Array<{ item_name: string; quantity: number; unit_price: number }>>([
    { item_name: '', quantity: 1, unit_price: 0 },
  ]);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);

  const handleClose = () => {
    setNewPoVendor('');
    setNewPoDeliveryDate('');
    setNewPoItems([{ item_name: '', quantity: 1, unit_price: 0 }]);
    onClose();
  };

  const handleCreatePO = async () => {
    const validItems = newPoItems.filter((i) => i.item_name.trim());
    if (!newPoVendor.trim()) {
      alert('Please enter vendor / distributor name.');
      return;
    }
    if (validItems.length === 0) {
      alert('Please specify at least one medication item.');
      return;
    }
    setIsSubmittingPo(true);
    try {
      const totalAmount = validItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0);
      await pharmacyApi.createPurchaseOrder({
        vendor_name: newPoVendor.trim(),
        expected_delivery_date: newPoDeliveryDate || undefined,
        items: validItems,
        total_amount: totalAmount,
      });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-pos'] });
      handleClose();
      onSuccess?.('Purchase order created successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmittingPo(false);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create Vendor Purchase Order</h3>
                  <p className="text-[11px] text-slate-500">Official order for pharmaceutical distributor replenishment</p>
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
                    Vendor / Distributor Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Pharma Distributors"
                    value={newPoVendor}
                    onChange={(e) => setNewPoVendor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={newPoDeliveryDate}
                    onChange={(e) => setNewPoDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Order Line Items *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPoItems([...newPoItems, { item_name: '', quantity: 1, unit_price: 0 }])}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Line Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newPoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Item / Drug Name"
                        value={item.item_name}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].item_name = e.target.value;
                          setNewPoItems(updated);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setNewPoItems(updated);
                        }}
                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.unit_price || ''}
                        onChange={(e) => {
                          const updated = [...newPoItems];
                          updated[idx].unit_price = parseFloat(e.target.value) || 0;
                          setNewPoItems(updated);
                        }}
                        className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 text-right"
                      />
                      {newPoItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPoItems(newPoItems.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-2 text-right text-xs font-bold text-slate-700">
                  Total Order Value: {formatCurrency(newPoItems.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0))}
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
                disabled={isSubmittingPo}
                onClick={handleCreatePO}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-9 px-5 gap-1.5"
              >
                {isSubmittingPo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating PO...</span>
                  </>
                ) : (
                  <span>Create Purchase Order</span>
                )}
              </Button>
            </div>
          </div>
        </div>

  );
}
