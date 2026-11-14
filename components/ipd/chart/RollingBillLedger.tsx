'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/ui/card';
import Spinner from '@/components/common/Spinner';
import { ipdApi, billingApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import type { RollingBillSummary, IPDPayment } from '@/features/ipd/types';
import {
  RollingBillKPIs,
  RollingBillFilterBar,
  RollingBillTable,
  RollingBillDepositsTable,
  CreditLimitAlert,
  useRollingBillActions,
} from './rolling-bill';
import AddBedsideItemModal from '@/components/ipd/modals/AddBedsideItemModal';
import CollectDepositModal from '@/components/ipd/modals/CollectDepositModal';
import PrintRollingBillModal from '@/components/ipd/modals/PrintRollingBillModal';
import PrintableInvoice from '@/components/common/PrintableInvoice';
import PrintablePaymentVoucherModal from '@/components/common/PrintablePaymentVoucherModal';

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

  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'unbilled' | 'billed' | 'all'>('unbilled');

  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState<any | null>(null);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<IPDPayment | null>(null);

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
  const unbilledItems = useMemo(() => allItems.filter((i) => !i.is_billed), [allItems]);
  const billedItems = useMemo(() => allItems.filter((i) => i.is_billed), [allItems]);

  const {
    selectedItemIds,
    selectedTotal,
    unbilledTotal,
    handleToggleSelect,
    handleSelectAllUnbilled,
    handleGenerateBill,
  } = useRollingBillActions({
    admissionId,
    billSummary,
    unbilledItems,
    wardName,
    bedNumber,
    refetch,
    setStatusFilter,
  });

  const filteredItems = useMemo(() => {
    let list = allItems;
    if (statusFilter === 'unbilled') list = unbilledItems;
    else if (statusFilter === 'billed') list = billedItems;

    if (activeCategory !== 'all') {
      list = list.filter((it) => it.category === activeCategory || it.item_type === activeCategory);
    }
    return list;
  }, [allItems, unbilledItems, billedItems, statusFilter, activeCategory]);

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const inv = await billingApi.getInvoice(invoiceId);
      if (inv) setViewInvoiceData(inv);
      else toast.error('Invoice Not Found', 'Could not retrieve invoice details.');
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
        <CreditLimitAlert
          netDue={billSummary.net_due}
          creditLimit={billSummary.credit_limit}
          onCollectDeposit={() => setIsDepositOpen(true)}
        />
      )}

      {/* 2. Top Financial KPI Summary Cards */}
      <RollingBillKPIs summary={billSummary} />

      {/* 3. Main Rolling Bill Ledger Card */}
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
        onPrintVoucher={(p) => setSelectedVoucherForPrint(p)}
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
        patientMrn={billSummary.patient_mrn}
        admissionNumber={billSummary.admission_number}
        wardName={wardName || billSummary.ward_name}
        admittingDoctor={admittingDoctor || billSummary.admitting_doctor}
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

      {/* Printable Payment Voucher Modal for Deposits */}
      {selectedVoucherForPrint && (
        <PrintablePaymentVoucherModal
          isOpen={!!selectedVoucherForPrint}
          onClose={() => setSelectedVoucherForPrint(null)}
          voucher={selectedVoucherForPrint}
          patient={{
            name: patientName,
            vid: billSummary.patient_mrn,
            mrn: billSummary.patient_mrn,
          }}
          admission={{
            admission_number: billSummary.admission_number,
            ward_name: wardName || billSummary.ward_name,
            bed_number: bedNumber || billSummary.bed_number,
            admitting_doctor: admittingDoctor || billSummary.admitting_doctor,
            admission_date: billSummary.admission_date,
          }}
          financialContext={{
            current_advance: billSummary.total_advance,
            net_due: billSummary.net_due,
            total_accrued: billSummary.total_gross,
          }}
        />
      )}
    </div>
  );
}
