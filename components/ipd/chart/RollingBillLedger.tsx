'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import Spinner from '@/components/common/Spinner';
import { ipdApi, billingApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import { useBillingModal } from '@/contexts/BillingContext';
import type { RollingBillSummary, BillItem } from '@/features/ipd/types';
import {
  RollingBillKPIs,
  RollingBillFilterBar,
  RollingBillTable,
  RollingBillDepositsTable,
} from './rolling-bill';
import AddBedsideItemModal from '@/components/ipd/modals/AddBedsideItemModal';
import CollectDepositModal from '@/components/ipd/modals/CollectDepositModal';
import PrintRollingBillModal from '@/components/ipd/modals/PrintRollingBillModal';
import PrintableInvoice from '@/components/common/PrintableInvoice';

interface RollingBillLedgerProps {
  admissionId: string;
  patientName: string;
  bedNumber: string;
  wardName: string;
  admittingDoctor: string;
  onDischarge: (admissionId: string) => void;
}

export default function RollingBillLedger({
  admissionId,
  patientName,
  bedNumber,
  wardName,
  admittingDoctor,
  onDischarge,
}: RollingBillLedgerProps) {
  const queryClient = useQueryClient();
  const { openBilling } = useBillingModal();

  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'unbilled' | 'billed' | 'all'>('unbilled');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState<any | null>(null);

  const { data: billSummary, isLoading, refetch } = useQuery<RollingBillSummary>({
    queryKey: ['ipd-rolling-bill', admissionId],
    queryFn: () => ipdApi.getRollingBill(admissionId),
    enabled: !!admissionId,
    refetchInterval: 10000,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => ipdApi.deleteBillItem(itemId),
    onSuccess: () => {
      toast.success('Item Removed', 'The line item has been removed from rolling bill.');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
    },
    onError: (err: any) => {
      toast.error('Failed to remove item', err?.message || 'Could not delete bill item');
    },
  });

  const allItems = billSummary?.items || [];

  // Filter items by status and category
  const unbilledItems = useMemo(() => allItems.filter((i) => !i.is_billed), [allItems]);
  const billedItems = useMemo(() => allItems.filter((i) => i.is_billed), [allItems]);

  const filteredItems = useMemo(() => {
    let list = allItems;
    if (statusFilter === 'unbilled') {
      list = unbilledItems;
    } else if (statusFilter === 'billed') {
      list = billedItems;
    }

    if (activeCategory !== 'all') {
      list = list.filter((it) => it.category === activeCategory || it.item_type === activeCategory);
    }
    return list;
  }, [allItems, unbilledItems, billedItems, statusFilter, activeCategory]);

  // Selection handlers for dynamic billing
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleSelectAllUnbilled = (checked: boolean) => {
    if (checked) {
      const allUnbilledIds = unbilledItems.map((i) => i.id);
      setSelectedItemIds(new Set(allUnbilledIds));
    } else {
      setSelectedItemIds(new Set());
    }
  };

  // Selected totals
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

  // Dynamic Bill Generation Handler
  const handleGenerateBill = () => {
    // If items are selected, bill only selected; otherwise bill all unbilled items
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
          // Immediately mark billed items in IPD and record payment voucher in ledger
          await ipdApi.settleInvoice(admissionId, {
            invoice_id: invoice.id,
            item_ids: billItemIds,
            amount_paid: invoice.paid_amount || 0,
            payment_method: invoice.payment_method || 'cash',
            transaction_reference: invoice.invoice_number,
            notes: `Bill payment for Invoice #${invoice.invoice_number}`,
            is_discharge: false,
          });

          // Invalidate queries so unbilled items list clears, billed list piles up, and payment appears in deposits
          refetch();
          queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
          queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });

          setSelectedItemIds(new Set());
          setStatusFilter('billed'); // Switch to Billed & Paid tab to show the newly generated invoice

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

  // View Printable Invoice
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const inv = await billingApi.getInvoice(invoiceId);
      if (inv) {
        setViewInvoiceData(inv);
      } else {
        toast.error('Invoice Not Found', 'Could not retrieve invoice details.');
      }
    } catch (err: any) {
      toast.error('Failed to load invoice', err?.message);
    }
  };

  if (isLoading || !billSummary) {
    return (
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
          <Spinner size="md" />
          <span>Loading rolling bill ledger & tariff calculations...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Credit Limit Exposure Alert Banner */}
      {billSummary.is_credit_exceeded && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 shadow-2xs animate-in fade-in duration-200">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-950 text-sm">Credit Limit Exceeded Alert</span>
              <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                Action Required
              </Badge>
            </div>
            <p className="text-xs text-rose-800 mt-0.5">
              Current unsettled balance of <strong className="font-bold">{formatCurrency(billSummary.net_due)}</strong> has
              exceeded the allocated credit threshold of <strong className="font-bold">{formatCurrency(billSummary.credit_limit)}</strong>.
              Please collect an interim advance deposit from the patient attendant.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDepositOpen(true)}
            className="h-8 px-3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shrink-0 shadow-xs"
          >
            Collect Top-Up
          </Button>
        </div>
      )}

      {/* 2. Top Financial KPI Summary Cards */}
      <RollingBillKPIs summary={billSummary} />

      {/* 3. Main Rolling Bill Ledger Card with Dynamic Billing & Status Sub-Tabs */}
      <Card className="border-slate-200 shadow-2xs bg-white overflow-hidden">
        <RollingBillFilterBar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          statusFilter={statusFilter}
          onSelectStatusFilter={setStatusFilter}
          unbilledCount={unbilledItems.length}
          unbilledTotal={unbilledTotal}
          billedCount={billedItems.length}
          selectedCount={selectedItemIds.size}
          selectedTotal={selectedTotal}
          onOpenAddItem={() => setIsAddItemOpen(true)}
          onOpenDeposit={() => setIsDepositOpen(true)}
          onOpenPrint={() => setIsPrintOpen(true)}
          onDischarge={() => onDischarge(admissionId)}
          onGenerateBill={handleGenerateBill}
        />

        <RollingBillTable
          items={filteredItems}
          activeCategory={activeCategory}
          statusFilter={statusFilter}
          selectedItemIds={selectedItemIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAllUnbilled}
          onDeleteItem={(itemId) => deleteItemMutation.mutate(itemId)}
          onViewInvoice={handleViewInvoice}
          isDeleting={deleteItemMutation.isPending}
        />
      </Card>

      {/* 4. Advance Deposits & Payment Receipts Sub-Ledger */}
      <RollingBillDepositsTable
        payments={billSummary.payments || []}
        totalAdvance={billSummary.total_advance}
      />

      {/* 5. Modals */}
      <AddBedsideItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        admissionId={admissionId}
        patientName={patientName}
        bedNumber={bedNumber}
        onSuccess={() => refetch()}
      />

      <CollectDepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        admissionId={admissionId}
        patientName={patientName}
        bedNumber={bedNumber}
        currentAdvance={billSummary.total_advance}
        netDue={billSummary.net_due}
        onSuccess={() => refetch()}
      />

      <PrintRollingBillModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        summary={billSummary}
      />

      {/* Printable Invoice Modal for Billed Invoices */}
      {viewInvoiceData && (
        <PrintableInvoice
          invoice={viewInvoiceData}
          onClose={() => setViewInvoiceData(null)}
          defaultLayout="a4"
        />
      )}
    </div>
  );
}
