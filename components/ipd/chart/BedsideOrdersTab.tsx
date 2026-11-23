'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pill, Printer } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import NursesRecordTable from './NursesRecordTable';
import AddBedsideOrderForm from './AddBedsideOrderForm';
import EditBedsideOrderModal from '../modals/EditBedsideOrderModal';
import StopBedsideOrderModal from '../modals/StopBedsideOrderModal';
import PrintNursesRecordModal from '../modals/PrintNursesRecordModal';
import type { IPDOrder, AdmissionDetails } from '@/features/ipd/types';

interface BedsideOrdersTabProps {
  admissionId: string;
  orders: IPDOrder[];
  admission?: AdmissionDetails;
  patient?: { id?: string; name?: string; vid?: string };
  bed?: { bed_number?: string; ward_name?: string };
  onOrderAdded: () => void;
}

export default function BedsideOrdersTab({
  admissionId,
  orders,
  admission,
  patient,
  bed,
  onOrderAdded,
}: BedsideOrdersTabProps) {
  const queryClient = useQueryClient();

  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<IPDOrder | null>(null);
  const [stoppingOrder, setStoppingOrder] = useState<IPDOrder | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'discontinued'>('all');

  const administerMutation = useMutation({
    mutationFn: (data: { orderId: string; status: string; timing_slot?: string }) =>
      ipdApi.administerOrder(data.orderId, { status: data.status, timing_slot: data.timing_slot }),
    onSuccess: () => {
      toast.success('Dose Administered', 'Dose checked off in bedside eMAR Nurse Record.');
      onOrderAdded();
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  const handleAdministerSlot = (orderId: string, slot: string) => {
    administerMutation.mutate({ orderId, status: 'Given', timing_slot: slot });
  };

  const handleRevertSlot = (orderId: string, slot: string) => {
    administerMutation.mutate({ orderId, status: 'Reverted', timing_slot: slot });
  };

  const filteredOrders = (orders || []).filter((o) => {
    if (statusFilter === 'active') return o.status === 'Active';
    if (statusFilter === 'discontinued') return o.status === 'Discontinued';
    return true;
  });

  return (
    <>
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">Bedside Medications &amp; Orders (Nurse&apos;s Record)</CardTitle>
            <p className="text-xs text-slate-500">
              Prescription schedule, administration timing checkboxes, eMAR verification, and surgical consumables
            </p>
          </div>
          <div className="flex items-center gap-2">
            {admission && orders && orders.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPrintModalOpen(true)}
                className="h-8 text-xs font-semibold gap-1 text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Nurse&apos;s Record</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setIsAddingOrder(!isAddingOrder)}
              className="h-8 text-xs font-bold gap-1 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingOrder ? 'Cancel' : 'New Inpatient Order'}</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Create Order Form */}
          {isAddingOrder && (
            <AddBedsideOrderForm
              admissionId={admissionId}
              patient={patient}
              bed={bed}
              onSuccess={() => {
                setIsAddingOrder(false);
                onOrderAdded();
              }}
              onCancel={() => setIsAddingOrder(false)}
            />
          )}

          {/* Quick Filter Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Orders ({orders?.length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'active'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Only ({orders?.filter((o) => o.status === 'Active').length || 0})
              </button>
              <button
                onClick={() => setStatusFilter('discontinued')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'discontinued'
                    ? 'bg-white text-rose-800 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Discontinued ({orders?.filter((o) => o.status === 'Discontinued').length || 0})
              </button>
            </div>
          </div>

          {/* eMAR Nurses Record Table */}
          {filteredOrders.length > 0 ? (
            <NursesRecordTable
              orders={filteredOrders}
              onAdministerSlot={handleAdministerSlot}
              onRevertSlot={handleRevertSlot}
              onEditOrder={(order: IPDOrder) => setEditingOrder(order)}
              onStopOrder={(order: IPDOrder) => setStoppingOrder(order)}
            />
          ) : (
            <EmptyState
              icon={Pill}
              title="No Bedside Orders Found"
              subtitle={
                statusFilter === 'all'
                  ? 'No medications, tests, or consumables ordered for this patient yet.'
                  : `No orders matching filter "${statusFilter}".`
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditBedsideOrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          order={editingOrder}
          admissionId={admissionId}
          onSuccess={() => {
            setEditingOrder(null);
            onOrderAdded();
          }}
        />
      )}

      {/* Stop Order Modal */}
      {stoppingOrder && (
        <StopBedsideOrderModal
          isOpen={!!stoppingOrder}
          onClose={() => setStoppingOrder(null)}
          order={stoppingOrder}
          admissionId={admissionId}
          onSuccess={() => {
            setStoppingOrder(null);
            onOrderAdded();
          }}
        />
      )}

      {/* Print Nurses Record Modal */}
      {isPrintModalOpen && admission && (
        <PrintNursesRecordModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          admission={admission}
          orders={orders}
        />
      )}
    </>
  );
}
