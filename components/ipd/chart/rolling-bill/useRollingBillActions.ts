'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ipdApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { useBillingModal } from '@/contexts/BillingContext';
import type { RollingBillSummary, BillItem } from '@/features/ipd/types';

interface UseRollingBillActionsParams {
  admissionId: string;
  billSummary?: RollingBillSummary;
  unbilledItems: BillItem[];
  wardName: string;
  bedNumber: string;
  refetch: () => void;
  setStatusFilter: (filter: 'unbilled' | 'billed' | 'all') => void;
}

export function useRollingBillActions({
  admissionId,
  billSummary,
  unbilledItems,
  wardName,
  bedNumber,
  refetch,
  setStatusFilter,
}: UseRollingBillActionsParams) {
  const queryClient = useQueryClient();
  const { openBilling } = useBillingModal();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSelectAllUnbilled = (checked: boolean) => {
    setSelectedItemIds(checked ? new Set(unbilledItems.map((i) => i.id)) : new Set());
  };

  const selectedItemsList = useMemo(
    () => unbilledItems.filter((i) => selectedItemIds.has(i.id)),
    [unbilledItems, selectedItemIds]
  );

  const selectedTotal = useMemo(
    () => selectedItemsList.reduce((sum, it) => sum + (it.total_price || 0), 0),
    [selectedItemsList]
  );

  const unbilledTotal = useMemo(
    () => unbilledItems.reduce((sum, it) => sum + (it.total_price || 0), 0),
    [unbilledItems]
  );

  const handleGenerateBill = () => {
    const itemsToBill = selectedItemsList.length > 0 ? selectedItemsList : unbilledItems;
    if (itemsToBill.length === 0) {
      toast.error('No Unbilled Items', 'There are no unbilled charges to generate an invoice for.');
      return;
    }

    const defaultItems = itemsToBill.map((it) => ({
      description: it.item_name,
      quantity: it.quantity || 1,
      unit_price: it.unit_price || 0,
      total: it.total_price || (it.quantity || 1) * (it.unit_price || 0),
      service_code: it.service_code || 'IPD-CHARGE',
      category: it.category || 'IPD',
    }));

    const billItemIds = itemsToBill.map((it) => it.id);

    openBilling({
      patientId: billSummary?.patient_id,
      lockedPatient: true,
      sourceModule: 'ipd',
      sourceReferenceId: admissionId,
      defaultReason: `IPD Inpatient Bill: ${wardName} (Bed ${bedNumber}) — ${itemsToBill.length} item${
        itemsToBill.length > 1 ? 's' : ''
      }`,
      defaultItems,
      onSuccess: async (invoice) => {
        try {
          await ipdApi.settleInvoice(admissionId, {
            invoice_id: invoice.id,
            item_ids: billItemIds,
            amount_paid: invoice.paid_amount || 0,
            payment_method: invoice.payment_method || 'cash',
            transaction_reference: invoice.invoice_number,
            notes: `Bill payment for Invoice #${invoice.invoice_number}`,
            is_discharge: false,
          });

          refetch();
          queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
          queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });

          setSelectedItemIds(new Set());
          setStatusFilter('billed');
          toast.success(
            'Bill Generated & Payment Saved',
            `Invoice #${invoice.invoice_number} created. Payment of ${formatCurrency(
              invoice.paid_amount || 0
            )} recorded in inpatient ledger.`
          );
        } catch (err: any) {
          console.error('Failed to settle invoice in IPD ledger', err);
          toast.error('Ledger Sync Error', err?.message || 'Invoice generated, but failed to update IPD ledger.');
        }
      },
    });
  };

  return {
    selectedItemIds,
    selectedItemsList,
    selectedTotal,
    unbilledTotal,
    handleToggleSelect,
    handleSelectAllUnbilled,
    handleGenerateBill,
  };
}
