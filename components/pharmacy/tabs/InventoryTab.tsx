'use client';

import React, { useState } from 'react';
import { Search, UploadCloud, Loader2, Layers } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InventoryTabProps {
  batches: any[];
  isLoading: boolean;
  onOpenCsvModal: () => void;
  onAddToCart: (batch: any) => void;
  onSwitchToPos?: () => void;
  onSwitchToOcr?: () => void;
}

export default function InventoryTab({
  batches,
  isLoading: batchesLoading,
  onOpenCsvModal,
  onAddToCart,
  onSwitchToPos,
  onSwitchToOcr,
}: InventoryTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBatches = (batches || []).filter((b: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.item_name || '').toLowerCase().includes(q) ||
      (b.generic_name || '').toLowerCase().includes(q) ||
      (b.batch_number || '').toLowerCase().includes(q) ||
      (b.item_code || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drug, generic, batch, code..."
                className="pl-9 h-9 text-xs rounded-md"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => onOpenCsvModal()}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-md shadow-xs"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>CSV Batch Stock Import</span>
              </Button>
              <Badge variant="purple" className="text-xs font-bold py-1.5 px-3">
                FEFO Sorting Active (Nearest Expiry First)
              </Badge>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Item / Drug Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Batch #</th>
                  <th className="p-3.5">Expiry Date (FEFO)</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Unit MRP / Price</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5 text-right">Quick POS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {batchesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span>Loading pharmacy stock batches...</span>
                      </div>
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="font-bold text-slate-700 text-sm">No Stock Batches Found</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {searchQuery
                          ? `No batches matching "${searchQuery}". Try another keyword or clear search.`
                          : 'Import inventory batches in bulk via CSV or ingest vendor invoices to stock medicines.'}
                      </p>
                      <div className="flex justify-center gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => onOpenCsvModal()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-md gap-1.5 shadow-sm"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Batch Import CSV</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSwitchToOcr?.()}
                          className="text-xs font-bold h-8 px-3"
                        >
                          <span>Vendor Invoice (OCR WIP / Manual)</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  batches.map((b: any) => {
                    const isLowStock = b.quantity_available < 15;
                    const isExpiringSoon = new Date(b.expiry_date).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{b.item_name}</p>
                          <p className="text-[11px] text-slate-500">{b.generic_name || b.item_code}</p>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px]">{b.category}</Badge>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{b.batch_number}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`font-bold ${isExpiringSoon ? 'text-red-600' : 'text-slate-700'}`}>
                              {formatDate(b.expiry_date)}
                            </span>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold uppercase">
                                Near Expiry
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                            {b.quantity_available} units
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{formatCurrency(b.selling_price || b.mrp)}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{b.rack_location || 'Main Store'}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onAddToCart(b);
                              onSwitchToPos?.();
                            }}
                            className="h-7 text-xs font-bold border-[rgb(var(--clr-primary)/0.2)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.08)]"
                          >
                            + Dispense
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

    </div>
  );
}
