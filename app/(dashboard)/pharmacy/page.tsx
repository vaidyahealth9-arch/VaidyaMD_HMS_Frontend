'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi, billingApi, patientsApi } from '@/lib/api';
import {
  Pill,
  Layers,
  ShoppingCart,
  Receipt,
  UploadCloud,
  FileText,
  Truck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import PrintableInvoice from '@/components/common/PrintableInvoice';
import { formatDate } from '@/lib/utils';
import {
  StockCsvImportModal,
  DispenseSuccessModal,
  NewIndentModal,
  NewPoModal,
  InventoryTab,
  PosTab,
  BillsTab,
  OcrGrnTab,
  IndentsTab,
  PurchaseOrdersTab,
} from '@/components/pharmacy';

export default function PharmacyPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'inventory' | 'ocr_grn' | 'pos' | 'indents' | 'pos_orders' | 'bills'>(
    tabParam === 'pos' || tabParam === 'bills' || tabParam === 'indents' || tabParam === 'pos_orders' || tabParam === 'ocr_grn'
      ? tabParam
      : 'inventory'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['inventory', 'ocr_grn', 'pos', 'indents', 'pos_orders', 'bills'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  // Modal visibility states
  const [showStockCsvModal, setShowStockCsvModal] = useState(false);
  const [showNewIndentModal, setShowNewIndentModal] = useState(false);
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [dispensedInvoice, setDispensedInvoice] = useState<any | null>(null);
  const [receiptModalInv, setReceiptModalInv] = useState<any | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Shared POS Cart
  const [posCart, setPosCart] = useState<Array<{
    item_code: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    batch_number?: string;
  }>>([]);

  const handleSuccessToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 6000);
  };

  // Queries
  const { data: rawBatches = [], isLoading: batchesLoading } = useQuery({
    queryKey: ['pharmacy-batches'],
    queryFn: () => pharmacyApi.listBatches({ active_only: true }),
  });

  const batches = useMemo(() => {
    return (rawBatches || []).filter((b: any) => b.is_active !== false);
  }, [rawBatches]);

  const { data: indents = [] } = useQuery({
    queryKey: ['pharmacy-indents'],
    queryFn: () => pharmacyApi.listIndents(),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ['pharmacy-pos'],
    queryFn: () => pharmacyApi.listPurchaseOrders(),
  });

  const { data: grns = [] } = useQuery({
    queryKey: ['pharmacy-grns'],
    queryFn: () => pharmacyApi.listGRNs(),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-pos-search'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });

  const patients = useMemo(() => {
    if (!patientsData) return [];
    if (Array.isArray(patientsData)) return patientsData;
    if (Array.isArray((patientsData as any).patients)) return (patientsData as any).patients;
    return [];
  }, [patientsData]);

  const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => billingApi.listInvoices(),
  });

  const pharmacyInvoices = useMemo(() => {
    return (allInvoices as any[]).filter((inv: any) => {
      const isPharmaSource = (inv.appointment_source || '').toLowerCase() === 'pharmacy';
      const isPharmaInvNum = (inv.invoice_number || '').toUpperCase().startsWith('INV-PHARM');
      const hasPharmaReason =
        (inv.reason_for_attendance || '').toLowerCase().includes('pharmacy') ||
        (inv.reason_for_attendance || '').toLowerCase().includes('dispens');
      return isPharmaSource || isPharmaInvNum || hasPharmaReason;
    });
  }, [allInvoices]);

  const handleAddToCart = (batch: any) => {
    if (batch.is_active === false) return;
    if (batch.quantity_available <= 0) return;
    setPosCart((prev) => {
      const existing = prev.find((i) => i.item_code === batch.item_code);
      if (existing) {
        return prev.map((i) =>
          i.item_code === batch.item_code ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          item_code: batch.item_code,
          item_name: batch.item_name,
          quantity: 1,
          unit_price: batch.selling_price || batch.mrp,
          batch_number: batch.batch_number,
        },
      ];
    });
  };

  const openPrintFromPOS = (invData: any) => {
    setReceiptModalInv({
      invoice_number: invData.invoice_number,
      patient_name: invData.patient_name || 'Walk-in / Counter Patient',
      patient_vid: invData.patient_mrn || invData.patient_vid || '—',
      created_at: invData.created_at || new Date().toISOString(),
      appointment_source: 'Pharmacy',
      reason_for_attendance: 'Point of Sale Pharmacy Dispense',
      items: (invData.dispensed_batches || []).map((b: any) => ({
        description: `${b.item_name} (Batch: ${b.batch_number || 'N/A'}${b.expiry_date ? `, Exp: ${formatDate(b.expiry_date)}` : ''})`,
        quantity: b.quantity_dispensed || b.quantity || 1,
        unit_price: b.unit_price || 0,
        total: b.total_price || (b.quantity_dispensed || b.quantity || 1) * (b.unit_price || 0),
      })),
      subtotal: invData.total_amount || 0,
      total_amount: invData.total_amount || 0,
      paid_amount: invData.paid_amount || invData.total_amount || 0,
      payment_method: invData.payment_method || 'Cash',
      pending_due: 0,
    });
  };

  const openPrintFromInvoice = (inv: any) => {
    setReceiptModalInv({
      invoice_number: inv.invoice_number,
      patient_name: inv.patient_name || 'Patient',
      patient_vid: inv.patient_vid || inv.patient_mrn || '—',
      created_at: inv.created_at || new Date().toISOString(),
      appointment_source: inv.appointment_source || 'Pharmacy',
      reason_for_attendance: inv.reason_for_attendance || 'Point of Sale Pharmacy Dispense',
      items: (Array.isArray(inv.items) ? inv.items : []).map((it: any) => ({
        description: it.item_name
          ? `${it.item_name}${it.batch_number ? ` (Batch: ${it.batch_number})` : ''}`
          : it.description || 'Medication Dispensed',
        quantity: it.quantity_dispensed || it.quantity || 1,
        unit_price: it.unit_price || 0,
        total: it.total_price || it.total || (it.quantity_dispensed || it.quantity || 1) * (it.unit_price || 0),
      })),
      subtotal: inv.subtotal || inv.total_amount,
      total_amount: inv.total_amount,
      paid_amount: inv.paid_amount || inv.total_amount,
      pending_due: inv.pending_due || 0,
      discount: inv.discount || 0,
      wallet_amount_used: inv.wallet_amount_used || 0,
      payment_method: inv.payment_method || 'Cash',
    });
  };

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Pharmacy & Supply Chain"
        subtitle="Smart AI OCR invoice ingestion, FEFO inventory, and point-of-sale dispensing"
        icon={Pill}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowStockCsvModal(true)}
              variant="outline"
              className="gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold h-9 rounded-md shadow-xs text-xs"
            >
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span>CSV Batch Stock Import</span>
            </Button>

            <Button
              onClick={() => setActiveTab('ocr_grn')}
              className="gap-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Smart OCR Invoice (WIP)</span>
            </Button>
          </div>
        }
      />

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="space-y-4">
        <TabBar
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          tabs={[
            { id: 'inventory', label: 'Stock Inventory & FEFO', icon: Layers, badge: batches.length || undefined },
            { id: 'pos', label: 'Dispensing POS', icon: ShoppingCart },
            { id: 'bills', label: 'Bills & Receipts', icon: Receipt, badge: pharmacyInvoices.length || undefined },
            { id: 'ocr_grn', label: 'AI OCR Invoice (WIP)', icon: UploadCloud },
            { id: 'indents', label: 'Department Indents', icon: FileText, badge: indents.length || undefined },
            { id: 'pos_orders', label: 'Purchase Orders', icon: Truck, badge: purchaseOrders.length || undefined },
          ]}
        />

        {activeTab === 'inventory' && (
          <InventoryTab
            batches={batches}
            isLoading={batchesLoading}
            onOpenCsvModal={() => setShowStockCsvModal(true)}
            onAddToCart={handleAddToCart}
            onSwitchToPos={() => setActiveTab('pos')}
            onSwitchToOcr={() => setActiveTab('ocr_grn')}
          />
        )}

        {activeTab === 'pos' && (
          <PosTab
            batches={batches}
            patients={patients}
            posCart={posCart}
            setPosCart={setPosCart}
            onDispenseSuccess={(invoice) => setDispensedInvoice(invoice)}
          />
        )}

        {activeTab === 'bills' && (
          <BillsTab
            invoices={allInvoices}
            isLoading={invoicesLoading}
            onPrintInvoice={openPrintFromInvoice}
            onSwitchToPos={() => setActiveTab('pos')}
          />
        )}

        {activeTab === 'ocr_grn' && (
          <OcrGrnTab
            grns={grns}
            onOpenCsvModal={() => setShowStockCsvModal(true)}
            onSuccess={handleSuccessToast}
          />
        )}

        {activeTab === 'indents' && (
          <IndentsTab
            indents={indents}
            onOpenNewIndentModal={() => setShowNewIndentModal(true)}
            onSuccess={handleSuccessToast}
          />
        )}

        {activeTab === 'pos_orders' && (
          <PurchaseOrdersTab
            purchaseOrders={purchaseOrders}
            onOpenNewPoModal={() => setShowNewPoModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <StockCsvImportModal
        isOpen={showStockCsvModal}
        onClose={() => setShowStockCsvModal(false)}
        onSuccess={handleSuccessToast}
      />

      <DispenseSuccessModal
        invoice={dispensedInvoice}
        onClose={() => setDispensedInvoice(null)}
        onPrint={openPrintFromPOS}
      />

      <NewIndentModal
        isOpen={showNewIndentModal}
        onClose={() => setShowNewIndentModal(false)}
        onSuccess={handleSuccessToast}
      />

      <NewPoModal
        isOpen={showNewPoModal}
        onClose={() => setShowNewPoModal(false)}
        onSuccess={handleSuccessToast}
      />

      {receiptModalInv && (
        <PrintableInvoice
          invoice={receiptModalInv}
          onClose={() => setReceiptModalInv(null)}
        />
      )}
    </PageLayout>
  );
}
