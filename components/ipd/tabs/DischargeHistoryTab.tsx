'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import PrintableInvoice from '@/components/common/PrintableInvoice';
import PrintableDischargeSummaryModal from '../modals/PrintableDischargeSummaryModal';
import DischargedInpatientsTable from './DischargedInpatientsTable';
import { ipdApi, billingApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';

interface DischargeHistoryTabProps {
  onRefreshParent?: () => void;
}

export default function DischargeHistoryTab({ onRefreshParent }: DischargeHistoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('all');

  // Modal states for printing/viewing
  const [summaryModalAdmission, setSummaryModalAdmission] = useState<any | null>(null);
  const [invoiceModalData, setInvoiceModalData] = useState<any | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  // Fetch all discharged admissions
  const {
    data: dischargedList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ipd-discharged-history'],
    queryFn: () => ipdApi.listAdmissions({ status: 'Discharged' }),
    refetchInterval: 30000,
  });

  // Unique wards for filter
  const wards = useMemo(() => {
    const set = new Set<string>();
    dischargedList.forEach((adm: any) => {
      if (adm.ward_name) set.add(adm.ward_name);
    });
    return Array.from(set);
  }, [dischargedList]);

  // Filtered admissions
  const filteredAdmissions = useMemo(() => {
    return dischargedList.filter((adm: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        adm.patient_name?.toLowerCase().includes(q) ||
        adm.admission_number?.toLowerCase().includes(q) ||
        adm.patient_mrn?.toLowerCase().includes(q) ||
        adm.admitting_doctor?.toLowerCase().includes(q) ||
        adm.diagnosis?.toLowerCase().includes(q) ||
        adm.invoice_number?.toLowerCase().includes(q);

      const matchesWard = selectedWard === 'all' || adm.ward_name === selectedWard;

      return matchesSearch && matchesWard;
    });
  }, [dischargedList, searchQuery, selectedWard]);

  // Load Invoice for printing
  const handleOpenInvoice = async (adm: any) => {
    if (!adm.invoice_id) {
      toast.error('No Invoice Linked', 'This admission does not have a linked billing invoice.');
      return;
    }
    setIsLoadingInvoice(true);
    try {
      const inv = await billingApi.getInvoice(adm.invoice_id);
      if (inv) {
        setInvoiceModalData(inv);
      } else {
        toast.error('Invoice Not Found', 'Could not fetch invoice details from billing.');
      }
    } catch (err: any) {
      toast.error('Invoice Fetch Failed', err?.message || 'Error loading billing invoice.');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by patient, MRN, admission #, doctor, or invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-500 hover:text-slate-800 h-9 px-2"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[rgb(var(--clr-primary))]"
          >
            <option value="all">All Wards ({dischargedList.length})</option>
            {wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              onRefreshParent?.();
            }}
            className="h-9 text-xs text-slate-600 gap-1.5"
            title="Refresh history"
          >
            <History className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Discharged Inpatients Register Table */}
      <DischargedInpatientsTable
        admissions={filteredAdmissions}
        isLoading={isLoading}
        searchQuery={searchQuery}
        isLoadingInvoice={isLoadingInvoice}
        onOpenSummary={(adm) => setSummaryModalAdmission(adm)}
        onOpenInvoice={handleOpenInvoice}
      />

      {/* MODAL 1: Clinical Discharge Summary Printable View */}
      <PrintableDischargeSummaryModal
        isOpen={Boolean(summaryModalAdmission)}
        onClose={() => setSummaryModalAdmission(null)}
        admission={summaryModalAdmission}
      />

      {/* MODAL 2: Final Settlement Printable Invoice */}
      {invoiceModalData && (
        <PrintableInvoice
          invoice={invoiceModalData}
          onClose={() => setInvoiceModalData(null)}
          defaultLayout="a4"
        />
      )}
    </div>
  );
}
