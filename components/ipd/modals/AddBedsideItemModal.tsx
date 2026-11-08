'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { pharmacyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import PharmacyItemSearchDropdown, { type PharmacyItemSelection } from '@/components/common/PharmacyItemSearchDropdown';
import BedsidePresetSelector from './BedsidePresetSelector';
import BedsideItemPriceInputs from './BedsideItemPriceInputs';
import type { PresetItem } from './bedsidePresets';

interface AddBedsideItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  admissionId: string;
  patientName: string;
  bedNumber: string;
  onSuccess?: () => void;
}

export default function AddBedsideItemModal({
  isOpen,
  onClose,
  admissionId,
  patientName,
  bedNumber,
  onSuccess,
}: AddBedsideItemModalProps) {
  const queryClient = useQueryClient();

  const [itemType, setItemType] = useState('pharmacy_surgical');
  const [category, setCategory] = useState('Surgical Consumables');
  const [itemName, setItemName] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [notes, setNotes] = useState('');

  const postItemMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await ipdApi.postBillItem(admissionId, payload);

      // Auto-raise pharmacy indent if medication or surgical material
      if (['pharmacy_medication', 'pharmacy_surgical'].includes(payload.item_type)) {
        try {
          await pharmacyApi.createIndent({
            requesting_department: 'IPD',
            indent_type: 'IPD_ORDER',
            urgency: 'Routine',
            notes: `IPD Bedside Issue: ${patientName} (${bedNumber}) - ${payload.item_name}`,
            items: [
              {
                item_name: payload.item_name,
                item_code: payload.service_code || payload.item_name,
                quantity: payload.quantity,
                quantity_requested: payload.quantity,
                unit_price: payload.unit_price,
                patient_name: patientName,
                admission_id: admissionId,
                bed_number: bedNumber,
              },
            ],
          });
          queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
        } catch (err) {
          console.warn('Could not auto-create pharmacy indent for bedside consumption:', err);
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success('Service/Item Billed', `Item posted to rolling bill & queued in Pharmacy.`);
      queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err: any) => {
      toast.error('Failed to post item', err?.message || 'Could not post bill item');
    },
  });

  const handleSelectPreset = (preset: PresetItem) => {
    setItemType(preset.item_type);
    setCategory(preset.category);
    setItemName(preset.name);
    setServiceCode(preset.service_code);
    setUnitPrice(String(preset.unit_price));
  };

  const handleSelectPharmacyItem = (selection: PharmacyItemSelection) => {
    setItemName(selection.itemName);
    setServiceCode(selection.itemCode);
    if (selection.unitPrice > 0) setUnitPrice(String(selection.unitPrice));
    if (selection.category) setCategory(selection.category);
  };

  const handleClose = () => {
    setItemName('');
    setServiceCode('');
    setQuantity('1');
    setUnitPrice('');
    setNotes('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error('Validation Error', 'Item description is required');
      return;
    }
    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice) || 0;
    if (price < 0) {
      toast.error('Validation Error', 'Unit price cannot be negative');
      return;
    }

    postItemMutation.mutate({
      item_type: itemType,
      category,
      service_code: serviceCode || undefined,
      item_name: itemName.trim(),
      quantity: qty,
      unit_price: price,
      notes: notes.trim() || undefined,
    });
  };

  const isPharmacyType = itemType === 'pharmacy_medication' || itemType === 'pharmacy_surgical';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="p-1 rounded bg-indigo-50 text-indigo-700">
              <PlusCircle className="w-4 h-4" />
            </span>
            <span>Post Bedside Service / Item</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Attaching to rolling bill for <span className="font-semibold text-slate-800">{patientName}</span> ({bedNumber})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Preset Selector */}
          <BedsidePresetSelector onSelectPreset={handleSelectPreset} />

          {/* Item Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Charge Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={itemType}
                onChange={(e) => {
                  const val = e.target.value;
                  setItemType(val);
                  if (val === 'pharmacy_surgical') setCategory('Surgical Consumables');
                  else if (val === 'pharmacy_medication') setCategory('Medication');
                  else if (val === 'diet') setCategory('Diet & Nutrition');
                  else if (val === 'equipment') setCategory('Oxygen & Gas');
                  else if (val === 'procedure_ot') setCategory('Procedures');
                  else if (val === 'lab_investigation') setCategory('Pathology / Lab');
                  else setCategory('General');
                }}
                className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="pharmacy_surgical">Pharmacy: Surgical Materials &amp; Consumables</option>
                <option value="pharmacy_medication">Pharmacy: Medications / Injections</option>
                <option value="diet">Diet &amp; Special Meals</option>
                <option value="equipment">Equipment &amp; Oxygen Support</option>
                <option value="procedure_ot">Bedside Procedure / Nursing Service</option>
                <option value="lab_investigation">Diagnostic / Rapid Lab</option>
                <option value="radiology">Radiology / Imaging</option>
                <option value="miscellaneous">Miscellaneous Sundry</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Ledger Category
              </label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category name"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Item Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Item Description / Name <span className="text-rose-500">*</span>
              </label>
              {isPharmacyType ? (
                <PharmacyItemSearchDropdown
                  value={itemName}
                  onChange={setItemName}
                  onSelect={handleSelectPharmacyItem}
                  categoryFilter={itemType === 'pharmacy_surgical' ? 'surgical' : 'medication'}
                  placeholder={
                    itemType === 'pharmacy_surgical'
                      ? 'Search surgicals, IV sets, gloves, catheters...'
                      : 'Search pharmacy medication or injection...'
                  }
                />
              ) : (
                <Input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Oxygen Cylinder Flow, Dressing Charge"
                  required
                  className="h-9 text-xs font-medium"
                />
              )}
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Service / Item Code
              </label>
              <Input
                type="text"
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder="e.g. SURG-01"
                className="h-9 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Quantity & Unit Price */}
          <BedsideItemPriceInputs
            quantity={quantity}
            setQuantity={setQuantity}
            unitPrice={unitPrice}
            setUnitPrice={setUnitPrice}
          />

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Clinical / Administration Notes
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bedside cannula replacement by Staff Nurse"
              className="h-9 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={postItemMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{postItemMutation.isPending ? 'Posting...' : 'Post to Rolling Bill'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
