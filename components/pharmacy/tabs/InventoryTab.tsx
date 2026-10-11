'use client';

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Search,
  UploadCloud,
  Loader2,
  Layers,
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  Pill,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import ReceiveStockModal from '../modals/ReceiveStockModal';

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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  // Stock Inwarding Modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedDrugForNewBatch, setSelectedDrugForNewBatch] = useState<any | null>(null);

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleOpenReceiveStock = (existingDrug: any = null) => {
    setSelectedDrugForNewBatch(existingDrug);
    setShowReceiveModal(true);
  };

  const handleStockSuccess = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
    }
  };

  // Filter raw batches first
  const filteredBatches = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return batches || [];
    return (batches || []).filter((b: any) =>
      (b.item_name || '').toLowerCase().includes(q) ||
      (b.generic_name || '').toLowerCase().includes(q) ||
      (b.batch_number || '').toLowerCase().includes(q) ||
      (b.item_code || '').toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  // Group by item_code for grouped formulary view
  const groupedDrugs = useMemo(() => {
    const map = new Map<string, any>();

    for (const b of filteredBatches) {
      const code = b.item_code;
      if (!map.has(code)) {
        map.set(code, {
          item_code: b.item_code,
          item_name: b.item_name,
          generic_name: b.generic_name,
          category: b.category,
          pack_size: b.pack_size || 1,
          rack_location: b.rack_location,
          mrp: b.mrp,
          selling_price: b.selling_price || b.mrp,
          total_available: 0,
          batches: [],
        });
      }

      const drug = map.get(code);
      drug.total_available += Number(b.quantity_available || 0);
      drug.batches.push(b);
      // Keep pack_size updated if batch has it
      if (b.pack_size && b.pack_size > 1) {
        drug.pack_size = b.pack_size;
      }
    }

    // Sort batches inside each drug by expiry date asc (FEFO)
    for (const drug of map.values()) {
      drug.batches.sort(
        (a: any, b: any) =>
          new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      );
    }

    return Array.from(map.values()).sort((a, b) => a.item_name.localeCompare(b.item_name));
  }, [filteredBatches]);

  return (
    <div className="space-y-4 pt-2">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search drug, generic, batch, code..."
              className="pl-9 h-9 text-xs rounded-md"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'grouped'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grouped Formulary
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                viewMode === 'flat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Batches List
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Action: Add Stock / Receive Batch */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenReceiveStock(null)}
            className="gap-1.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-9 rounded-md shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Receive Stock / Add Batch</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenCsvModal()}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-md shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Batch Stock CSV</span>
          </Button>

          <Badge variant="purple" className="hidden lg:inline-flex text-[11px] font-bold py-1.5 px-3">
            FEFO Active
          </Badge>
        </div>
      </div>

      {/* Main Table: Grouped Formulary Mode */}
      {viewMode === 'grouped' ? (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 w-10"></th>
                <th className="p-3.5">Medicine Formulary</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Pack Conversion</th>
                <th className="p-3.5">Total Available Stock</th>
                <th className="p-3.5">Unit Rate (Tablet)</th>
                <th className="p-3.5">Active Batches (FEFO)</th>
                <th className="p-3.5 text-right">Actions</th>
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
              ) : groupedDrugs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">No Stock Medications Found</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {searchQuery
                        ? `No medications matching "${searchQuery}". Try another keyword or clear search.`
                        : 'Record incoming stock batches or import in bulk via CSV.'}
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReceiveStock(null)}
                        className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-8 px-3 rounded-md gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Receive New Stock</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onOpenCsvModal()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-md gap-1.5 shadow-sm"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Batch Import CSV</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedDrugs.map((drug) => {
                  const isExpanded = expandedCodes.has(drug.item_code);
                  const packSize = drug.pack_size || 1;
                  const totalUnits = drug.total_available;
                  const isLowStock = totalUnits < 20;

                  // Sheet calculation breakdown
                  const fullSheets = Math.floor(totalUnits / packSize);
                  const looseRemaining = totalUnits % packSize;

                  // Nearest expiring batch (first element of sorted batches)
                  const earliestBatch = drug.batches[0];
                  const sheetPrice = earliestBatch ? (earliestBatch.selling_price || earliestBatch.mrp) : (drug.selling_price || drug.mrp);
                  const unitPrice = sheetPrice / packSize;
                  const isEarliestExpiringSoon = earliestBatch && (new Date(earliestBatch.expiry_date).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90);

                  return (
                    <React.Fragment key={drug.item_code}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-slate-50/60' : ''}`}>
                        {/* Expand toggle */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(drug.item_code)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                            title={isExpanded ? 'Collapse Batches' : 'Expand Batches'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Drug Name & Code */}
                        <td className="p-3.5 cursor-pointer" onClick={() => toggleExpand(drug.item_code)}>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-slate-900 hover:text-[rgb(var(--clr-primary))]">{drug.item_name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">
                                {drug.item_code} {drug.generic_name ? `· ${drug.generic_name}` : ''}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] font-semibold">{drug.category}</Badge>
                        </td>

                        {/* Pack Conversion */}
                        <td className="p-3.5">
                          {packSize > 1 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              <Pill className="w-3 h-3 text-slate-500" />
                              <span>1 sheet = {packSize} tabs</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Single Unit (1:1)</span>
                          )}
                        </td>

                        {/* Available Stock */}
                        <td className="p-3.5">
                          <div>
                            <span className={`font-bold text-sm ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                              {totalUnits} {packSize > 1 ? 'tablets' : 'units'}
                            </span>
                            {packSize > 1 && (
                              <p className="text-[11px] text-slate-500">
                                {fullSheets} sheet{fullSheets !== 1 ? 's' : ''}
                                {looseRemaining > 0 ? ` + ${looseRemaining} loose` : ''}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Unit Rate */}
                        <td className="p-3.5">
                          <div>
                            <span className="font-bold text-[rgb(var(--clr-primary))]">
                              {formatCurrency(unitPrice)} <span className="text-[10px] font-normal text-slate-500">/{packSize > 1 ? 'tab' : 'unit'}</span>
                            </span>
                            {packSize > 1 && (
                              <p className="text-[10px] text-slate-400">Sheet: {formatCurrency(sheetPrice)}</p>
                            )}
                          </div>
                        </td>

                        {/* Batch Count & FEFO Tag */}
                        <td className="p-3.5">
                          <button
                            type="button"
                            onClick={() => toggleExpand(drug.item_code)}
                            className="flex items-center gap-1.5 text-left group"
                          >
                            <Badge
                              variant="outline"
                              className="bg-blue-50/80 border-blue-200 text-blue-700 font-bold text-[10px] group-hover:bg-blue-100"
                            >
                              {drug.batches.length} Batch{drug.batches.length !== 1 ? 'es' : ''}
                            </Badge>
                            {isEarliestExpiringSoon && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold uppercase">
                                Near Expiry
                              </Badge>
                            )}
                          </button>
                          {earliestBatch && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Next: {earliestBatch.batch_number} (Exp {formatDate(earliestBatch.expiry_date)})
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReceiveStock(drug)}
                              className="h-7 text-xs font-semibold gap-1 text-slate-700 hover:text-[rgb(var(--clr-primary))] hover:border-[rgb(var(--clr-primary)/0.4)]"
                              title="Add new batch to this medicine"
                            >
                              <Plus className="w-3 h-3 text-[rgb(var(--clr-primary))]" />
                              <span>Add Batch</span>
                            </Button>

                            {earliestBatch && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  onAddToCart(earliestBatch);
                                  onSwitchToPos?.();
                                }}
                                className="h-7 text-xs font-bold border-[rgb(var(--clr-primary)/0.2)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.08)]"
                              >
                                Quick POS
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Accordion Drawer for Piled Batches */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={8} className="p-0">
                            <div className="p-4 pl-12 space-y-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Active Batches for {drug.item_name} (FEFO Priority Order)</span>
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenReceiveStock(drug)}
                                  className="h-6 text-[11px] font-bold gap-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 shadow-xs"
                                >
                                  <Plus className="w-3 h-3 text-[rgb(var(--clr-primary))]" />
                                  <span>+ Inward New Batch</span>
                                </Button>
                              </div>

                              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                                    <tr>
                                      <th className="p-2.5">Batch #</th>
                                      <th className="p-2.5">Expiry Date</th>
                                      <th className="p-2.5">Available Stock</th>
                                      <th className="p-2.5">Sheet MRP</th>
                                      <th className="p-2.5">Unit Rate</th>
                                      <th className="p-2.5">Rack Location</th>
                                      <th className="p-2.5 text-right">Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {drug.batches.map((b: any, bIdx: number) => {
                                      const bPackSize = b.pack_size || packSize || 1;
                                      const bUnits = b.quantity_available || 0;
                                      const bSheets = Math.floor(bUnits / bPackSize);
                                      const bLoose = bUnits % bPackSize;
                                      const bSheetPrice = b.selling_price || b.mrp;
                                      const bUnitPrice = bSheetPrice / bPackSize;
                                      const isExpiringSoon = new Date(b.expiry_date).getTime() - new Date().getTime() < 1000 * 60 * 60 * 24 * 90;

                                      return (
                                        <tr key={b.id} className="hover:bg-slate-50/80">
                                          <td className="p-2.5 font-mono font-bold text-[rgb(var(--clr-primary))]">
                                            {b.batch_number}
                                            {bIdx === 0 && (
                                              <span className="ml-1.5 text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.5 rounded">
                                                FEFO #1
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2.5">
                                            <span className={`font-semibold ${isExpiringSoon ? 'text-red-600' : 'text-slate-700'}`}>
                                              {formatDate(b.expiry_date)}
                                            </span>
                                            {isExpiringSoon && (
                                              <span className="ml-1 text-[9px] text-red-600 font-bold uppercase">
                                                · Expiring Soon
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2.5">
                                            <span className="font-bold text-slate-800">
                                              {bUnits} {bPackSize > 1 ? 'tabs' : 'units'}
                                            </span>
                                            {bPackSize > 1 && (
                                              <span className="text-[10px] text-slate-400 block">
                                                ({bSheets} sheets{bLoose > 0 ? ` + ${bLoose} tabs` : ''})
                                              </span>
                                            )}
                                          </td>
                                          <td className="p-2.5 font-mono text-slate-600">
                                            {formatCurrency(bSheetPrice)}
                                          </td>
                                          <td className="p-2.5 font-mono font-bold text-[rgb(var(--clr-primary))]">
                                            {formatCurrency(bUnitPrice)}
                                          </td>
                                          <td className="p-2.5 text-slate-500">
                                            {b.rack_location || 'Main Store'}
                                          </td>
                                          <td className="p-2.5 text-right">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                onAddToCart(b);
                                                onSwitchToPos?.();
                                              }}
                                              className="h-6 text-[11px] font-bold border-emerald-300 text-emerald-800 hover:bg-emerald-50 px-2"
                                            >
                                              Dispense
                                            </Button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Flat Batch List Mode */
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Item / Drug Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Batch #</th>
                <th className="p-3.5">Expiry Date (FEFO)</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Unit Rate</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5 text-right">Quick POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No batches found matching filter.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b: any) => {
                  const pSz = b.pack_size || 1;
                  const unitPrice = (b.selling_price || b.mrp) / pSz;
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
                        <span className="font-bold text-slate-900">
                          {b.quantity_available} {pSz > 1 ? 'tabs' : 'units'}
                        </span>
                        {pSz > 1 && (
                          <span className="text-[10px] text-slate-400 block">
                            ({Math.floor(b.quantity_available / pSz)} sheets)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-[rgb(var(--clr-primary))]">
                        {formatCurrency(unitPrice)} <span className="text-[10px] font-normal text-slate-400">/{pSz > 1 ? 'tab' : 'unit'}</span>
                      </td>
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
      )}

      {/* Receive Stock / New Batch Modal */}
      <ReceiveStockModal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          setSelectedDrugForNewBatch(null);
        }}
        onSuccess={handleStockSuccess}
        existingDrug={selectedDrugForNewBatch}
        allBatches={batches}
      />
    </div>
  );
}
