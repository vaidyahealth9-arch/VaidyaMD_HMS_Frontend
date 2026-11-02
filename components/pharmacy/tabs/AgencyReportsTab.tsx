'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '@/features/pharmacy/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import {
  Building2,
  TrendingDown,
  PackageCheck,
  Receipt,
  Download,
  RotateCcw,
  BookOpen,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AgencyReportsTabProps {
  batches: any[];
}

export default function AgencyReportsTab({ batches = [] }: AgencyReportsTabProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedAgencyForReturn, setSelectedAgencyForReturn] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('Near Expiry');
  const [returnNotes, setReturnNotes] = useState('');

  // Vendor Ledger Modal
  const [selectedVendorForLedger, setSelectedVendorForLedger] = useState<any | null>(null);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['pharmacy-agency-summary'],
    queryFn: () => pharmacyApi.getAgencySummaryReport(),
  });

  const { data: vendorsList = [] } = useQuery({
    queryKey: ['pharmacy-vendors'],
    queryFn: () => pharmacyApi.listVendors(),
  });

  const agencies: any[] = reportData?.agencies || [];

  const filteredAgencies = agencies.filter((a) =>
    (a.agency_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPurchases = filteredAgencies.reduce((acc, a) => acc + (a.total_purchases || 0), 0);
  const totalStockValue = filteredAgencies.reduce((acc, a) => acc + (a.current_stock_value || 0), 0);
  const totalReturns = filteredAgencies.reduce((acc, a) => acc + (a.total_returns || 0), 0);

  // Purchase Return Mutation
  const returnMutation = useMutation({
    mutationFn: async () => {
      const b = batches.find((x) => x.id === selectedBatchId);
      if (!b) throw new Error('Please select an active stock batch.');
      if (returnQuantity <= 0 || returnQuantity > (b.quantity_available || 0)) {
        throw new Error(`Quantity must be between 1 and ${b.quantity_available}.`);
      }

      return pharmacyApi.createPurchaseReturn({
        vendor_name: selectedAgencyForReturn || b.vendor_name || 'Distributor Agency',
        reason: returnReason,
        notes: returnNotes,
        items: [
          {
            batch_id: b.id,
            item_code: b.item_code,
            item_name: b.item_name,
            batch_number: b.batch_number,
            quantity: returnQuantity,
            purchase_rate: b.purchase_rate,
            return_amount: returnQuantity * (b.purchase_rate || 0),
            reason: returnReason,
          },
        ],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-agency-summary'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      setIsReturnModalOpen(false);
      setSelectedBatchId('');
      setReturnQuantity(1);
      setReturnNotes('');
    },
  });

  const handleExportCsv = () => {
    if (filteredAgencies.length === 0) return;
    const headers = ['Agency Name', 'Total Purchases (INR)', 'Warehouse Stock Value (INR)', 'Returns / Debit Notes (INR)', 'GRN Bills Count'];
    const rows = filteredAgencies.map(a => [
      `"${a.agency_name}"`,
      a.total_purchases,
      a.current_stock_value,
      a.total_returns,
      a.grn_count
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Pharmacy_Agency_Purchases_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedBatch = batches.find((x) => x.id === selectedBatchId);

  return (
    <div className="space-y-6 pt-2">
      {/* Top Action Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Distributor Agency Analytics &amp; Purchase Returns
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor vendor procurement, warehouse holdings, debit note returns, and ledger statements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            placeholder="Search distributor / agency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs w-48 bg-slate-50"
          />
          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredAgencies.length === 0}
            variant="outline"
            className="h-8 text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsReturnModalOpen(true)}
            className="h-8 text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Return Stock to Agency
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-sky-100 bg-sky-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Total Agency Purchases</span>
              <Receipt className="w-4 h-4 text-sky-700" />
            </div>
            <p className="text-xl font-bold font-mono text-sky-950 mt-2">₹{totalPurchases.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-sky-600 mt-0.5">Total stock invoiced via GRNs</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Current Stock Holding Value</span>
              <PackageCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-950 mt-2">₹{totalStockValue.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Active warehouse stock cost</p>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-rose-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Returns / Debit Notes</span>
              <TrendingDown className="w-4 h-4 text-rose-700" />
            </div>
            <p className="text-xl font-bold font-mono text-rose-950 mt-2">₹{totalReturns.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-rose-600 mt-0.5">Stock returned back to vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Agency Breakdown Table */}
      <Card className="overflow-hidden shadow-2xs">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">
            Agency Procurement &amp; Inventory Holdings
          </CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            {filteredAgencies.length} Distributors Tracked
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading distributor analytics...
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No agency procurement records found. Inward stock using Goods Received Notes (GRN) to populate this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Distributor Agency</th>
                    <th className="py-3 px-4 text-right">Total Purchases (GRN)</th>
                    <th className="py-3 px-4 text-right">Current Stock Value</th>
                    <th className="py-3 px-4 text-right">Returns / Debit Notes</th>
                    <th className="py-3 px-4 text-center">GRN Bills</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgencies.map((agency, idx) => (
                    <tr key={agency.agency_name || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{agency.agency_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                        ₹{agency.total_purchases.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{agency.current_stock_value.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                        ₹{agency.total_returns.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {agency.grn_count}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAgencyForReturn(agency.agency_name);
                            setIsReturnModalOpen(true);
                          }}
                          className="h-7 text-[11px] text-rose-700 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Return Items
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Create Purchase Return (VMD-006) */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              Return Stock to Distributor Agency (Debit Note)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Agency Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Distributor Agency / Vendor *</label>
              <select
                value={selectedAgencyForReturn}
                onChange={(e) => setSelectedAgencyForReturn(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-2.5 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Agency --</option>
                {agencies.map((a) => (
                  <option key={a.agency_name} value={a.agency_name}>{a.agency_name}</option>
                ))}
                {vendorsList.map((v: any) => (
                  <option key={v.id} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Batch Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Batch to Return from Inventory *</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-2.5 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Active Batch in Stock --</option>
                {batches.filter(b => b.quantity_available > 0).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.item_name} (Batch: {b.batch_number}) — Avail: {b.quantity_available} | Rate: ₹{b.purchase_rate}
                  </option>
                ))}
              </select>
            </div>

            {selectedBatch && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-bold text-slate-800">{selectedBatch.item_name} ({selectedBatch.item_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Available in Stock:</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedBatch.quantity_available} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purchase Rate:</span>
                  <span className="font-mono font-bold text-slate-800">₹{selectedBatch.purchase_rate}</span>
                </div>
              </div>
            )}

            {/* Return Quantity & Reason */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Return Quantity *</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedBatch?.quantity_available || 100}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 px-2.5 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Near Expiry">Near Expiry</option>
                  <option value="Damaged / Broken">Damaged / Broken</option>
                  <option value="Excess Overstock">Excess Overstock</option>
                  <option value="Manufacturer Recall">Manufacturer Recall</option>
                  <option value="Wrong Delivery">Wrong Delivery</option>
                </select>
              </div>
            </div>

            {/* Debit Note Total */}
            {selectedBatch && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Total Debit Note Credit:</span>
                <span className="text-base font-extrabold font-mono text-rose-900">
                  ₹{(returnQuantity * (selectedBatch.purchase_rate || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes / Debit Note Ref</label>
              <Input
                type="text"
                placeholder="Optional notes or supplier courier reference..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReturnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => returnMutation.mutate()}
              disabled={returnMutation.isPending || !selectedBatchId || !selectedAgencyForReturn}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {returnMutation.isPending ? 'Processing Stock Deduction...' : 'Confirm Return & Deduct Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
