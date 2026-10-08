'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { billingApi, patientsApi } from '@/lib/api';
import {
  Receipt,
  FileText,
  Package,
  Plus,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import StatCard from '@/components/common/StatCard';
import {
  InvoicesTab,
  PackagesTab,
  RecordPaymentModal,
  ReceiptModal,
  NewInvoiceSheet,
} from '@/components/billing';
import type { LineItem, Invoice } from '@/features/billing/types';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const statusParam = searchParams.get('status');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'packages'>(
    tabParam === 'packages' ? 'packages' : 'invoices'
  );

  const [statusFilter, setStatusFilter] = useState(statusParam || '');

  // Modals state
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoiceDefaults, setNewInvoiceDefaults] = useState<{
    source?: string;
    items?: LineItem[];
    discount?: number;
    discountType?: 'amount' | 'percentage';
  }>({});
  const [paymentModalInv, setPaymentModalInv] = useState<Invoice | null>(null);
  const [receiptModalInv, setReceiptModalInv] = useState<Invoice | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'packages' || tab === 'invoices') {
      setActiveTab(tab);
    }
    const status = searchParams.get('status');
    setStatusFilter(status || '');
  }, [searchParams]);

  const loadData = () => {
    setIsLoading(true);
    Promise.allSettled([
      billingApi.listInvoices({
        status: statusFilter || undefined,
      }),
      billingApi.listPackages(),
      patientsApi.list({ per_page: 500 }),
    ]).then(([invResult, pkgResult, patResult]) => {
      if (invResult.status === 'fulfilled') setInvoices((invResult.value as any) || []);
      if (pkgResult.status === 'fulfilled') setPackages((pkgResult.value as any) || []);
      if (patResult.status === 'fulfilled') {
        const v = patResult.value as any;
        setPatients(v.patients || v.items || []);
      }
    }).catch(() => {}).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSelectPackage = (pkg: any) => {
    const pkgItems = Array.isArray(pkg.items) ? pkg.items : [];
    const packagePrice = parseFloat(pkg.base_price ?? pkg.price ?? 0) || 0;
    const mappedItems: LineItem[] = pkgItems.length > 0
      ? pkgItems.map((it: any) => {
          const uPrice = Number(it.price ?? it.cost ?? 0);
          const uQty = Number(it.quantity || 1);
          return {
            description: it.name || it.description || 'Service',
            quantity: uQty,
            unit_price: uPrice,
            total: uPrice * uQty,
            service_code: it.code || it.service_code || '',
          };
        })
      : [{ description: pkg.name, quantity: 1, unit_price: packagePrice, total: packagePrice }];

    const sumTariff = mappedItems.reduce((acc: number, it) => acc + (it.total || 0), 0);
    const bundleDiscount = Math.max(0, sumTariff - packagePrice);

    setNewInvoiceDefaults({
      source: 'Package',
      items: mappedItems,
      discount: bundleDiscount,
      discountType: 'amount',
    });
    setShowNewInvoice(true);
  };

  const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + parseFloat(i.paid_amount || 0), 0);
  const totalPending = invoices.reduce((s, i) => s + parseFloat(i.pending_due || 0), 0);

  return (
    <PageLayout>
      {/* Header Bar */}
      <PageHeader
        title="Fertility Billing & Financial Hub"
        subtitle="Multi-source invoicing, advance wallets & treatment packages"
        icon={Receipt}
        actions={
          <Button
            onClick={() => {
              setNewInvoiceDefaults({});
              setShowNewInvoice(true);
            }}
            className="gap-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white text-sm font-semibold rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </Button>
        }
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Billed"
          value={`₹${totalBilled.toLocaleString('en-IN')}`}
          subtext={`${invoices.length} invoices generated`}
          color="default"
          icon={Receipt}
        />
        <StatCard
          label="Total Collected"
          value={`₹${totalCollected.toLocaleString('en-IN')}`}
          subtext="Bank, UPI & Advance Wallet deductions"
          color="success"
        />
        <StatCard
          label="Outstanding Balance"
          value={`₹${totalPending.toLocaleString('en-IN')}`}
          subtext="Pending collections across departments"
          color="danger"
        />
      </div>

      {/* Unified Tab Bar */}
      <TabBar
        tabs={[
          { id: 'invoices', label: 'Invoices & Receipts', icon: FileText, badge: invoices.length },
          { id: 'packages', label: 'Treatment Packages', icon: Package, badge: packages.length },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as 'invoices' | 'packages')}
      />

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <InvoicesTab
          invoices={invoices}
          patients={patients}
          isLoading={isLoading}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onRecordPayment={(inv) => setPaymentModalInv(inv)}
          onViewReceipt={(inv) => setReceiptModalInv(inv)}
        />
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <PackagesTab
          packages={packages}
          onSelectPackage={handleSelectPackage}
        />
      )}

      {/* Modals & Slide-overs */}
      {paymentModalInv && (
        <RecordPaymentModal
          invoice={paymentModalInv}
          isOpen={!!paymentModalInv}
          onClose={() => setPaymentModalInv(null)}
          onSuccess={() => {
            setPaymentModalInv(null);
            loadData();
          }}
          context="billing"
        />
      )}

      {receiptModalInv && (
        <ReceiptModal
          invoice={receiptModalInv}
          isOpen={!!receiptModalInv}
          onClose={() => setReceiptModalInv(null)}
        />
      )}

      <NewInvoiceSheet
        isOpen={showNewInvoice}
        onClose={() => setShowNewInvoice(false)}
        onSuccess={() => {
          setShowNewInvoice(false);
          loadData();
        }}
        defaultSource={newInvoiceDefaults.source}
        defaultItems={newInvoiceDefaults.items}
        defaultDiscount={newInvoiceDefaults.discount}
        defaultDiscountType={newInvoiceDefaults.discountType}
      />
    </PageLayout>
  );
}
