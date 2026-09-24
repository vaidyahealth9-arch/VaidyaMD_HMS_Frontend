'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BillingPatient } from '@/features/billing/types';

interface PatientSearchDropdownProps {
  patients: BillingPatient[];
  value: string;           // selected patient ID
  onChange: (patientId: string, patient: BillingPatient | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Patient search combobox — replaces the inline patient picker repeated in
 * billing/page.tsx and cosgyn/page.tsx (and embedded in the new-invoice form).
 *
 * Filters locally from the preloaded patients array.
 * Shows name + VID + phone in dropdown rows.
 *
 * Usage:
 *   <PatientSearchDropdown
 *     patients={patients}
 *     value={selectedPatientId}
 *     onChange={(id, patient) => { setSelectedPatientId(id); loadWallet(id); }}
 *   />
 */
export default function PatientSearchDropdown({
  patients,
  value,
  onChange,
  placeholder = 'Search patient by name, VID, or phone…',
  disabled = false,
  className,
}: PatientSearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedPatient = patients.find((p) => p.id === value) ?? null;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim().length >= 1
    ? patients
        .filter((p) => {
          const q = query.toLowerCase();
          return (
            p.name?.toLowerCase().includes(q) ||
            p.vid?.toLowerCase().includes(q) ||
            p.phone?.includes(q) ||
            p.mrn?.toLowerCase().includes(q)
          );
        })
        .slice(0, 12)
    : [];

  const handleSelect = (p: BillingPatient) => {
    onChange(p.id, p);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('', null);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {/* Selected patient display */}
      {selectedPatient && !isOpen ? (
        <div className="flex items-center justify-between gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{selectedPatient.name}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {selectedPatient.vid} · {selectedPatient.phone || 'No phone'}
              </p>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded flex-shrink-0"
              aria-label="Clear patient selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs',
              'text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30',
              disabled && 'opacity-60 cursor-not-allowed',
            )}
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full px-3 py-2.5 text-left hover:bg-primary/5 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-400">
                  {p.phone || 'No phone'} · {p.gender || ''}
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex-shrink-0">
                {p.vid || p.mrn || 'VID'}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.trim().length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-3 text-xs text-slate-400 text-center">
          No patients found matching "{query}"
        </div>
      )}
    </div>
  );
}
