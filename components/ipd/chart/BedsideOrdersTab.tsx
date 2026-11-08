'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pill } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import EmptyState from '@/components/common/EmptyState';
import { ipdApi } from '@/features/ipd/api';
import { pharmacyApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import PharmacyItemSearchDropdown from '@/components/common/PharmacyItemSearchDropdown';
import BedsideOrderItemCard from './BedsideOrderItemCard';
import type { IPDOrder } from '@/features/ipd/types';

interface BedsideOrdersTabProps {
  admissionId: string;
  orders: IPDOrder[];
  patient?: { id?: string; name?: string; vid?: string };
  bed?: { bed_number?: string; ward_name?: string };
  onOrderAdded: () => void;
}

export default function BedsideOrdersTab({
  admissionId,
  orders,
  patient,
  bed,
  onOrderAdded,
}: BedsideOrdersTabProps) {
  const queryClient = useQueryClient();

  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [orderType, setOrderType] = useState('Medication');
  const [orderItem, setOrderItem] = useState('');
  const [selectedItemCode, setSelectedItemCode] = useState('');
  const [orderDosage, setOrderDosage] = useState('');
  const [orderRoute, setOrderRoute] = useState('IV');
  const [orderFreq, setOrderFreq] = useState('BD');
  const [orderDuration, setOrderDuration] = useState('3 days');
  const [orderInstructions, setOrderInstructions] = useState('');

  const orderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await ipdApi.createOrder(admissionId, data);

      // Auto-raise pharmacy indent if medication or surgical
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
      setIsAddingOrder(false);
      setOrderItem('');
      setSelectedItemCode('');
      setOrderDosage('');
      setOrderInstructions('');
      onOrderAdded();
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  const administerMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string }) =>
      ipdApi.administerOrder(data.orderId, { status: data.status }),
    onSuccess: () => {
      toast.success('Dose Administered', 'Recorded in bedside eMAR log.');
      onOrderAdded();
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  const isPharmacyOrder = orderType === 'Medication' || orderType === 'Surgical Consumables';

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">Bedside Medications &amp; Orders</CardTitle>
          <p className="text-xs text-slate-500">
            Realtime pharmacy medication requisitions, eMAR administration, and surgical materials
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddingOrder(!isAddingOrder)}
          className="h-8 text-xs font-bold gap-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingOrder ? 'Cancel' : 'New Inpatient Order'}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isAddingOrder && (
          <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-lg space-y-3">
            <span className="font-bold text-emerald-950 block text-xs">Create Bedside Order</span>
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
                  className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
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
                  {orderType === 'Medication'
                    ? 'Drug / Formulation Name *'
                    : orderType === 'Surgical Consumables'
                    ? 'Surgical Material / Item *'
                    : 'Order Item Name *'}
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
                    placeholder={
                      orderType === 'Surgical Consumables'
                        ? 'Type surgical material, suture, IV cannula...'
                        : 'Type drug, brand, or generic name...'
                    }
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dosage</label>
                  <Input placeholder="40mg" value={orderDosage} onChange={(e) => setOrderDosage(e.target.value)} className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Route</label>
                  <select
                    value={orderRoute}
                    onChange={(e) => setOrderRoute(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
                  >
                    <option value="IV">IV</option>
                    <option value="Oral">Oral</option>
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
                    onChange={(e) => setOrderFreq(e.target.value)}
                    className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-hidden"
                  >
                    <option value="OD">OD (Once daily)</option>
                    <option value="BD">BD (Twice daily)</option>
                    <option value="TDS">TDS (Thrice daily)</option>
                    <option value="QID">QID (4 times daily)</option>
                    <option value="Stat">Stat (Immediate)</option>
                    <option value="SOS">SOS (As needed)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration</label>
                  <Input
                    placeholder="3 days"
                    value={orderDuration}
                    onChange={(e) => setOrderDuration(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Instructions / Notes</label>
              <Input
                placeholder="e.g. Infuse over 30 minutes in 100ml normal saline..."
                value={orderInstructions}
                onChange={(e) => setOrderInstructions(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => setIsAddingOrder(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() =>
                  orderMutation.mutate({
                    order_type: orderType,
                    item_name: orderItem,
                    dosage: orderDosage,
                    route: orderRoute,
                    frequency: orderFreq,
                    duration: orderDuration,
                    instructions: orderInstructions,
                  })
                }
                disabled={!orderItem || orderMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                {orderMutation.isPending ? 'Placing Order...' : 'Confirm Order'}
              </Button>
            </div>
          </div>
        )}

        {/* Order List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((ord) => (
              <BedsideOrderItemCard
                key={ord.id}
                order={ord}
                onAdminister={(orderId) => administerMutation.mutate({ orderId, status: 'Given' })}
                isAdministering={administerMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Pill}
            title="No Bedside Orders Placed"
            subtitle="Prescribe medication regimens, IV infusions, or surgical consumables for nursing administration."
            action={
              <Button size="sm" onClick={() => setIsAddingOrder(true)} className="h-8 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700">
                Prescribe Bedside Order
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
