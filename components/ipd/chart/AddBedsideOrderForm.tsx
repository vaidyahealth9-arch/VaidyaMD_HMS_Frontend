'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { pharmacyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import PharmacyItemSearchDropdown from '@/components/common/PharmacyItemSearchDropdown';

interface AddBedsideOrderFormProps {
  admissionId: string;
  patient?: { id?: string; name?: string; vid?: string };
  bed?: { bed_number?: string; ward_name?: string };
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddBedsideOrderForm({
  admissionId,
  patient,
  bed,
  onSuccess,
  onCancel,
}: AddBedsideOrderFormProps) {
  const queryClient = useQueryClient();

  const [orderType, setOrderType] = useState('Medication');
  const [orderItem, setOrderItem] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [orderDosage, setOrderDosage] = useState('');
  const [orderRoute, setOrderRoute] = useState('Oral');
  const [orderFreq, setOrderFreq] = useState('BD');
  const [orderDuration, setOrderDuration] = useState('3 days');
  const [orderStartDate, setOrderStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderTimingSlots, setOrderTimingSlots] = useState('08:00, 20:00');
  const [orderInstructions, setOrderInstructions] = useState('');

  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await ipdApi.createOrder(admissionId, data);
      if (['Medication', 'Surgical Consumables'].includes(data.order_type)) {
        try {
          const rawDur = String(data.duration || '');
          const durMatch = rawDur.match(/\d+/);
          const calcQty = durMatch ? parseInt(durMatch[0], 10) : 1;
          await pharmacyApi.createIndent({
            requesting_department: 'IPD',
            indent_type: 'IPD_RX',
            urgency: 'Routine',
            notes: `IPD Bedside: ${patient?.name || 'Inpatient'} (${bed?.bed_number ? `Bed ${bed.bed_number}` : 'IPD'}) - ${data.item_name}`,
            items: [
              {
                item_name: data.item_name,
                item_code: selectedItemCode || data.item_name,
                dose: data.dosage,
                frequency: data.frequency,
                duration: data.duration,
                instructions: data.instructions,
                quantity: calcQty,
                quantity_requested: calcQty,
                patient_id: patient?.id,
                patient_name: patient?.name || 'Inpatient',
                patient_vid: patient?.vid || '—',
                admission_id: admissionId,
                bed_number: bed?.bed_number || '—',
              },
            ],
          });
          queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
        } catch (err) {
          console.warn('Could not auto-create pharmacy indent for IPD order:', err);
        }
      }
      return res;
    },
    onSuccess: () => {
      toast.success('Order Placed', 'Bedside order added to nursing station & queued in Pharmacy Dispense.');
      onSuccess();
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  const isPharmacyOrder = orderType === 'Medication' || orderType === 'Surgical Consumables';

  const handleSubmit = () => {
    const slots = orderTimingSlots
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    orderMutation.mutate({
      order_type: orderType,
      item_name: orderItem,
      dosage: orderDosage,
      route: orderRoute,
      frequency: orderFreq,
      duration: orderDuration,
      start_date: orderStartDate,
      timing_slots: slots,
      instructions: orderInstructions,
    });
  };

  return (
    <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3">
      <span className="font-bold text-emerald-950 block text-xs">Create Bedside Prescription Order</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Order Type</label>
          <select
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value);
              setOrderItem('');
              setSelectedItemCode('');
            }}
            className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden font-medium"
          >
            <option value="Medication">Medication (Rx)</option>
            <option value="Surgical Consumables">Surgical Consumables &amp; Materials</option>
            <option value="Investigation">Lab Investigation</option>
            <option value="Diet">Dietary Order</option>
            <option value="Nursing Care">Nursing Care Instruction</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            {orderType === 'Medication' ? 'Drug / Formulation Name *' : 'Item Description *'}
          </label>
          {isPharmacyOrder ? (
            <PharmacyItemSearchDropdown
              value={orderItem}
              onChange={setOrderItem}
              onSelect={(selection) => {
                setOrderItem(selection.itemName);
                setSelectedItemCode(selection.itemCode);
              }}
              categoryFilter={orderType === 'Surgical Consumables' ? 'surgical' : 'medication'}
              placeholder="Type drug, brand, or generic name..."
            />
          ) : (
            <Input
              placeholder="e.g. Chest X-Ray, Renal Function Test"
              value={orderItem}
              onChange={(e) => setOrderItem(e.target.value)}
              className="h-8 text-xs font-semibold"
              required
            />
          )}
        </div>
      </div>

      {orderType === 'Medication' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dosage</label>
              <Input placeholder="e.g. 625mg, 1g" value={orderDosage} onChange={(e) => setOrderDosage(e.target.value)} className="h-8 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Route</label>
              <select
                value={orderRoute}
                onChange={(e) => setOrderRoute(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white font-medium"
              >
                <option value="Oral">Oral (PO)</option>
                <option value="IV">IV</option>
                <option value="IM">IM</option>
                <option value="SC">SC</option>
                <option value="Nebulization">Nebulization</option>
                <option value="Topical">Topical</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequency</label>
              <select
                value={orderFreq}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderFreq(val);
                  if (val === 'OD') setOrderTimingSlots('09:00');
                  else if (val === 'BD') setOrderTimingSlots('08:00, 20:00');
                  else if (val === 'TID') setOrderTimingSlots('08:00, 14:00, 20:00');
                  else if (val === 'QID') setOrderTimingSlots('06:00, 12:00, 18:00, 22:00');
                }}
                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white font-medium"
              >
                <option value="OD">OD (Once daily)</option>
                <option value="BD">BD (Twice daily)</option>
                <option value="TID">TID (Thrice daily)</option>
                <option value="QID">QID (4 times daily)</option>
                <option value="STAT">STAT (Immediate)</option>
                <option value="SOS">SOS (As needed)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration</label>
              <Input placeholder="3 days" value={orderDuration} onChange={(e) => setOrderDuration(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Start Date</span>
              </label>
              <Input type="date" value={orderStartDate} onChange={(e) => setOrderStartDate(e.target.value)} className="h-8 text-xs font-mono" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Scheduled Times</span>
              </label>
              <Input value={orderTimingSlots} onChange={(e) => setOrderTimingSlots(e.target.value)} placeholder="08:00, 20:00" className="h-8 text-xs font-mono" />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Instructions / Remarks</label>
        <Input
          placeholder="e.g. Give after food, monitor BP..."
          value={orderInstructions}
          onChange={(e) => setOrderInstructions(e.target.value)}
          className="h-8 text-xs"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!orderItem || orderMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {orderMutation.isPending ? 'Placing Order...' : 'Confirm Order'}
        </Button>
      </div>
    </div>
  );
}
