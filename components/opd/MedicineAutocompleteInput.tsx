'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { Pill, Search, Check } from 'lucide-react';

export interface MedicineSuggestion {
  drug: string;
  generic?: string;
  category?: string;
  strength?: string;
}

interface MedicineAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (med: MedicineSuggestion) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export default function MedicineAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Type medicine name...',
  className = '',
  id,
  disabled = false,
}: MedicineAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch hospital pharmacy formulary batches with cache
  const { data: batches = [] } = useQuery({
    queryKey: ['pharmacy-inventory-batches-active'],
    queryFn: () => pharmacyApi.listBatches({ active_only: true }),
    staleTime: 5 * 60 * 1000,
  });

  // Extract deduplicated medicine catalog
  const medicines = useMemo<MedicineSuggestion[]>(() => {
    if (!Array.isArray(batches)) return [];
    const seen = new Set<string>();
    const list: MedicineSuggestion[] = [];

    for (const b of batches) {
      const drugName = (b.item_name || '').trim();
      if (!drugName) continue;
      const key = drugName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          drug: drugName,
          generic: b.generic_name?.trim() || '',
          category: b.category?.trim() || '',
          strength: b.strength?.trim() || '',
        });
      }
    }
    return list;
  }, [batches]);

  // Filter based on user typed input
  const filteredSuggestions = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return [];
    return medicines
      .filter(
        (m) =>
          m.drug.toLowerCase().includes(q) ||
          (m.generic && m.generic.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [medicines, value]);

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

  const handleSelect = (item: MedicineSuggestion) => {
    onChange(item.drug);
    if (onSelect) {
      onSelect(item);
    }
    setIsOpen(false);
  };

  const datalistId = id ? `datalist-${id}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (value && value.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          list={datalistId}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={
            className ||
            'w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary'
          }
        />
        {value && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Pill className="w-3.5 h-3.5 opacity-60" />
          </span>
        )}
      </div>

      {/* Browser native datalist fallback */}
      {datalistId && (
        <datalist id={datalistId}>
          {medicines.map((m) => (
            <option key={m.drug} value={m.drug}>
              {m.generic ? `${m.drug} (${m.generic})` : m.drug}
            </option>
          ))}
        </datalist>
      )}

      {/* Floating Rich Autocomplete Menu */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[280px] sm:min-w-[340px] max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg z-50 divide-y divide-slate-100 animate-in fade-in">
          <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Search className="w-3 h-3 text-primary" /> Formulary Matches ({filteredSuggestions.length})
            </span>
            <span className="text-slate-400">Click to fill</span>
          </div>

          {filteredSuggestions.map((item) => {
            const isSelected = item.drug.toLowerCase() === (value || '').trim().toLowerCase();
            return (
              <button
                key={item.drug}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left p-2 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                  isSelected ? 'bg-primary/5 text-primary' : 'text-slate-800'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {item.drug}
                    </span>
                    {item.category && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.generic && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.generic}
                    </p>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

