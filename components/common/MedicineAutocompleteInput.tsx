'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { Pill, Check, Search, X } from 'lucide-react';

export interface MedicineSuggestion {
  drug: string;
  generic?: string;
  category?: string;
  strength?: string;
  totalAvailable?: number;
  itemCode?: string;
}

interface MedicineAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (med: MedicineSuggestion) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function MedicineAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Type drug or generic name...',
  className = '',
  id,
  disabled = false,
  autoFocus = false,
}: MedicineAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch hospital pharmacy formulary batches with cache
  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['pharmacy-inventory-batches-active'],
    queryFn: () => pharmacyApi.listBatches({ active_only: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Extract deduplicated medicine catalog with aggregated stock quantity
  const medicineDirectory = useMemo(() => {
    if (!Array.isArray(batches)) return [];
    const map = new Map<string, {
      itemName: string;
      itemCode: string;
      genericName: string;
      category: string;
      totalAvailable: number;
      rackLocation: string;
    }>();

    for (const b of batches as any[]) {
      const name = (b.item_name || '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const qty = Number(b.quantity_available || 0);
      const existing = map.get(key);
      if (existing) {
        existing.totalAvailable += qty;
      } else {
        map.set(key, {
          itemName: name,
          itemCode: b.item_code || '',
          genericName: b.generic_name || '',
          category: b.category || '',
          totalAvailable: qty,
          rackLocation: b.rack_location || '',
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [batches]);

  const medicineStockMap = useMemo(() => {
    const map = new Map<string, { totalAvailable: number; itemCode: string; rackLocation: string }>();
    medicineDirectory.forEach((m) => {
      map.set(m.itemName.toLowerCase(), {
        totalAvailable: m.totalAvailable,
        itemCode: m.itemCode,
        rackLocation: m.rackLocation,
      });
    });
    return map;
  }, [medicineDirectory]);

  // Current stock badge info for the entered drug
  const stockInfo = useMemo(() => {
    if (!value || !value.trim()) return null;
    return medicineStockMap.get(value.trim().toLowerCase()) || null;
  }, [medicineStockMap, value]);

  // Filter based on user typed input or return top items when empty
  const filteredSuggestions = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) {
      return medicineDirectory.slice(0, 15);
    }
    return medicineDirectory
      .filter(
        (m) =>
          m.itemName.toLowerCase().includes(q) ||
          (m.genericName && m.genericName.toLowerCase().includes(q)) ||
          (m.category && m.category.toLowerCase().includes(q))
      )
      .slice(0, 25);
  }, [medicineDirectory, value]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: {
    itemName: string;
    itemCode: string;
    genericName: string;
    category: string;
    totalAvailable: number;
  }) => {
    onChange(item.itemName);
    if (onSelect) {
      onSelect({
        drug: item.itemName,
        generic: item.genericName,
        category: item.category,
        totalAvailable: item.totalAvailable,
        itemCode: item.itemCode,
      });
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={
            className
              ? `${className} ${stockInfo ? 'pr-24' : ''}`
              : `w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${
                  stockInfo ? 'pr-24' : ''
                }`
          }
        />

        {stockInfo ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none">
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                stockInfo.totalAvailable > 10
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : stockInfo.totalAvailable > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {stockInfo.totalAvailable > 10
                ? `In Stock: ${stockInfo.totalAvailable}`
                : stockInfo.totalAvailable > 0
                ? `Low: ${stockInfo.totalAvailable}`
                : 'Out of Stock'}
            </span>
          </span>
        ) : value ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Pill className="w-3.5 h-3.5 opacity-40" />
          </span>
        ) : null}
      </div>

      {/* Floating Rich Autocomplete Menu with High Z-Index & Stock Badges */}
      {isOpen && (
        <div className="absolute z-[999] left-0 top-full mt-1 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center select-none">
            <span className="flex items-center gap-1">
              <Pill className="w-3 h-3 text-indigo-500" />
              <span>Formulary &amp; Stock</span>
            </span>
            <span className="text-[9px] text-slate-400 font-normal">
              {isLoading ? 'Loading stock...' : `${filteredSuggestions.length} items`}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredSuggestions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                No inventory match for &ldquo;{value}&rdquo;
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Press enter or leave as custom medication.
                </p>
              </div>
            ) : (
              filteredSuggestions.map((med) => {
                const inStock = med.totalAvailable > 0;
                const isLow = inStock && med.totalAvailable <= 10;
                const isSelected = med.itemName.toLowerCase() === (value || '').trim().toLowerCase();
                return (
                  <button
                    key={`${med.itemCode || ''}-${med.itemName}`}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(med);
                    }}
                    className={`w-full text-left p-2 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/70' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-800 truncate">{med.itemName}</div>
                      {med.genericName && (
                        <div className="text-[10px] text-slate-400 truncate">{med.genericName}</div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5">
                      {inStock ? (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isLow ? `Low: ${med.totalAvailable}` : `In Stock: ${med.totalAvailable}`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          Out of Stock
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
