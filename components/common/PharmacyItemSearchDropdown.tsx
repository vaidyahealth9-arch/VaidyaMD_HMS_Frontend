'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Pill, PackageCheck, AlertCircle } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { pharmacyApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export interface PharmacyItemSelection {
  itemName: string;
  itemCode: string;
  genericName?: string;
  category?: string;
  unitPrice: number;
  totalAvailable: number;
  rackLocation?: string;
}

interface PharmacyItemSearchDropdownProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: PharmacyItemSelection) => void;
  placeholder?: string;
  categoryFilter?: 'all' | 'medication' | 'surgical' | string;
  className?: string;
  autoFocus?: boolean;
}

export default function PharmacyItemSearchDropdown({
  value,
  onChange,
  onSelect,
  placeholder = 'Search medication or surgical formulary...',
  categoryFilter = 'all',
  className = '',
  autoFocus = false,
}: PharmacyItemSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch active inventory batches from live pharmacy database
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-batches-active'],
    queryFn: () => pharmacyApi.listBatches({ active_only: true }),
    staleTime: 60 * 1000,
  });

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Aggregate batches into unique formulary items with cumulative available stock
  const directory = useMemo(() => {
    if (!Array.isArray(batches)) return [];
    const map = new Map<string, PharmacyItemSelection>();

    for (const b of batches as any[]) {
      const name = (b.item_name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const qty = Number(b.quantity_available || 0);
      const price = Number(b.sale_price || b.mrp || 0);

      const existing = map.get(key);
      if (existing) {
        existing.totalAvailable += qty;
        if (!existing.unitPrice && price > 0) existing.unitPrice = price;
      } else {
        map.set(key, {
          itemName: name,
          itemCode: b.item_code || '',
          genericName: b.generic_name || '',
          category: b.category || 'Medication',
          unitPrice: price,
          totalAvailable: qty,
          rackLocation: b.rack_location || '',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [batches]);

  // Filter based on user search query and optional category filter
  const filtered = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    return directory.filter((item) => {
      // Category filter check
      if (categoryFilter !== 'all') {
        const cat = (item.category || '').toLowerCase();
        if (categoryFilter === 'medication' && cat.includes('surg')) return false;
        if (categoryFilter === 'surgical' && !cat.includes('surg') && !cat.includes('consum')) return false;
      }

      if (!q) return true;
      return (
        item.itemName.toLowerCase().includes(q) ||
        (item.genericName && item.genericName.toLowerCase().includes(q)) ||
        (item.itemCode && item.itemCode.toLowerCase().includes(q))
      );
    }).slice(0, 15);
  }, [directory, value, categoryFilter]);

  const handleSelectItem = (item: PharmacyItemSelection) => {
    onChange(item.itemName);
    onSelect(item);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        <Input
          type="text"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className="h-8 pl-8 pr-7 text-xs bg-white font-medium"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Suggestion Dropdown with Realtime Stock Badges */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto divide-y divide-slate-100">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center select-none">
            <span className="flex items-center gap-1">
              <Pill className="w-3 h-3 text-indigo-500" />
              Live Pharmacy Formulary & Stock
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {isLoading ? 'Loading stock...' : `${filtered.length} matched`}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              No inventory match for &ldquo;{value}&rdquo;
              <p className="text-[10px] text-slate-400 mt-0.5">
                Will be ordered as external / custom non-formulary item.
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const inStock = item.totalAvailable > 0;
              const isLow = inStock && item.totalAvailable <= 10;
              return (
                <button
                  key={`${item.itemCode}-${item.itemName}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectItem(item);
                  }}
                  className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-slate-900 truncate">
                      {item.itemName}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate mt-0.5">
                      {item.genericName && <span>{item.genericName}</span>}
                      {item.category && <span className="text-slate-500 font-medium">· {item.category}</span>}
                      {item.unitPrice > 0 && (
                        <span className="text-indigo-600 font-bold">
                          · {formatCurrency(item.unitPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {inStock ? (
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        <PackageCheck className="w-2.5 h-2.5" />
                        {isLow ? `Low: ${item.totalAvailable}` : `In Stock: ${item.totalAvailable}`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
