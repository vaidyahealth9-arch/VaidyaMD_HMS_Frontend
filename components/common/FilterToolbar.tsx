'use client';

import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterFieldType = 'search' | 'select' | 'date';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FilterField {
  type: FilterFieldType;
  key: string;
  label?: string;
  placeholder?: string;
  options?: SelectOption[];
  /** Tailwind width class, e.g. 'w-40' or 'w-52'. Defaults to 'w-40' for selects. */
  width?: string;
}

interface FilterToolbarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  className?: string;
}

/**
 * Unified filter toolbar — replaces the repeated search + filter selects row
 * found in 6 pages: billing, patients, lims, counseling, appointments, cosgyn.
 *
 * Usage:
 *   <FilterToolbar
 *     fields={[
 *       { type: 'search', key: 'q', placeholder: 'Search patient or invoice...' },
 *       { type: 'select', key: 'status', label: 'Status', width: 'w-36',
 *         options: [{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }] },
 *       { type: 'date', key: 'from', label: 'From', width: 'w-36' },
 *     ]}
 *     values={filters}
 *     onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
 *   />
 */
export default function FilterToolbar({
  fields,
  values,
  onChange,
  className,
}: FilterToolbarProps) {
  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm',
        'flex flex-col md:flex-row items-stretch md:items-end gap-3',
        className,
      )}
    >
      {fields.map((field) => {
        const val = values[field.key] ?? '';

        if (field.type === 'search') {
          return (
            <div key={field.key} className="flex-1 min-w-0">
              {field.label && (
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {field.label}
                </label>
              )}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder ?? 'Search…'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {val && (
                  <button
                    type="button"
                    onClick={() => onChange(field.key, '')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    aria-label="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        }

        if (field.type === 'select') {
          return (
            <div key={field.key} className={cn('flex-shrink-0', field.width ?? 'w-40')}>
              {field.label && (
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {field.label}
                </label>
              )}
              <select
                value={val}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{field.placeholder ?? `All ${field.label ?? ''}`}</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === 'date') {
          return (
            <div key={field.key} className={cn('flex-shrink-0', field.width ?? 'w-40')}>
              {field.label && (
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {field.label}
                </label>
              )}
              <input
                type="date"
                value={val}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
