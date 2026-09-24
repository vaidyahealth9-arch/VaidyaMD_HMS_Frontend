'use client';

import { X, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/contexts/ToastContext';
import type { LineItem, ServiceCatalogItem, PatientPackage } from '@/features/billing/types';

interface InvoiceLineItemsEditorProps {
  items: LineItem[];
  itemSearches: string[];
  itemDropdowns: boolean[];
  serviceCatalog: ServiceCatalogItem[];
  /** Active packages for the selected patient — shows quota buttons */
  activePackages?: PatientPackage[];
  onChange: (
    items: LineItem[],
    searches: string[],
    dropdowns: boolean[],
  ) => void;
  className?: string;
}

function getPrice(s: ServiceCatalogItem): number {
  return Number(s.cost ?? s.price ?? s.base_price ?? 0);
}

/**
 * Invoice line-items editor — extracted from billing/page.tsx and cosgyn/page.tsx
 * where the same tariff catalog + package quota UI was duplicated.
 *
 * Features:
 *  - Service name autocomplete (type-ahead from catalog)
 *  - Quick-pick grouped <select> from catalog
 *  - Quantity / unit-price / total row
 *  - "Covered under Package" badge for quota items
 *  - Active package quota buttons (zero-price items)
 */
export default function InvoiceLineItemsEditor({
  items,
  itemSearches,
  itemDropdowns,
  serviceCatalog,
  activePackages = [],
  onChange,
  className,
}: InvoiceLineItemsEditorProps) {

  const update = (
    newItems: LineItem[],
    newSearches: string[],
    newDropdowns: boolean[],
  ) => onChange(newItems, newSearches, newDropdowns);

  const addRow = () =>
    update(
      [...items, { description: '', quantity: 1, unit_price: 0, total: 0 }],
      [...itemSearches, ''],
      [...itemDropdowns, false],
    );

  const removeRow = (idx: number) =>
    update(
      items.filter((_, i) => i !== idx),
      itemSearches.filter((_, i) => i !== idx),
      itemDropdowns.filter((_, i) => i !== idx),
    );

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    const updated = items.map((it, i) => {
      if (i !== idx) return it;
      const merged = { ...it, ...patch };
      merged.total = Number(merged.quantity) * Number(merged.unit_price);
      return merged;
    });
    update(updated, itemSearches, itemDropdowns);
  };

  const setSearch = (idx: number, val: string) => {
    const s = [...itemSearches];
    s[idx] = val;
    const d = [...itemDropdowns];
    d[idx] = val.length >= 1;
    // Also update description in the item
    const updated = items.map((it, i) => (i === idx ? { ...it, description: val } : it));
    update(updated, s, d);
  };

  const selectFromCatalog = (idx: number, code: string) => {
    const svc = serviceCatalog.find((s) => (s.code || s.name) === code);
    if (!svc) return;
    const price = getPrice(svc);
    const updated = items.map((it, i) =>
      i === idx
        ? { ...it, description: svc.name, service_code: svc.code || '', unit_price: price, total: price * it.quantity }
        : it,
    );
    const s = [...itemSearches];
    s[idx] = svc.name;
    const d = [...itemDropdowns];
    d[idx] = false;
    update(updated, s, d);
  };

  const applyPackageItem = (pp: PatientPackage, item: PatientPackage['items'][number]) => {
    const newItem: LineItem = {
      description: `${item.name} [Package: ${pp.package_name}]`,
      quantity: 1,
      unit_price: 0,
      total: 0,
      patient_package_id: pp.id,
      package_item_id: item.id,
      service_code: item.service_code,
      is_package_covered: true,
    };
    const filtered = items.filter((x) => x.description?.trim());
    update(
      [...filtered, newItem],
      [...itemSearches.slice(0, filtered.length), `${item.name} [Package: ${pp.package_name}]`],
      [...itemDropdowns.slice(0, filtered.length), false],
    );
    toast.success('Quota Applied', `Added ${item.name} covered under package (${item.remaining_qty} remaining).`);
  };

  const categories = Array.from(new Set(serviceCatalog.map((s) => s.type || s.category || 'General')));

  return (
    <div className={cn('space-y-3', className)}>

      {/* Active Package Quota Buttons */}
      {activePackages.length > 0 && (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900">
              Patient has Active Package Quotas ({activePackages.length})
            </span>
            <span className="ml-auto text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Click to apply at ₹0 (Covered)
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {activePackages.flatMap((pp) =>
              (pp.items || [])
                .filter((it) => it.remaining_qty > 0)
                .map((it, itIdx) => (
                  <button
                    key={`${pp.id}-${itIdx}`}
                    type="button"
                    onClick={() => applyPackageItem(pp, it)}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-100/60 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-900 flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <span className="font-semibold">{it.name}</span>
                    <span className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 rounded-full font-bold">
                      {it.remaining_qty} left
                    </span>
                  </button>
                )),
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">Billable Services &amp; Procedures</p>
          <p className="text-[11px] text-slate-500">Pick from clinic tariff catalog or type custom service names</p>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Tariffs auto-fill rates</span>
      </div>

      {/* Line Items */}
      {items.map((item, idx) => {
        const search = itemSearches[idx] !== undefined ? itemSearches[idx] : item.description;
        const catalogFiltered =
          search && search.length >= 1
            ? serviceCatalog
                .filter(
                  (s) =>
                    s.name.toLowerCase().includes(search.toLowerCase()) ||
                    (s.code && s.code.toLowerCase().includes(search.toLowerCase())),
                )
                .slice(0, 10)
            : [];
        const dropdownOpen = itemDropdowns[idx] && catalogFiltered.length > 0;
        const isCovered = Boolean((item as any).is_package_covered || item.patient_package_id);

        return (
          <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            {/* Row header */}
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Item #{idx + 1}
                </span>
                {isCovered && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Package Covered
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Quick pick from full catalog */}
                <select
                  onChange={(e) => { if (e.target.value) selectFromCatalog(idx, e.target.value); }}
                  defaultValue=""
                  className="text-[11px] bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                >
                  <option value="">⚡ Quick Pick from Tariffs…</option>
                  {categories.map((cat) => (
                    <optgroup key={cat} label={cat}>
                      {serviceCatalog
                        .filter((s) => (s.type || s.category || 'General') === cat)
                        .map((s) => (
                          <option key={s.code || s.name} value={s.code || s.name}>
                            {s.name} — ₹{getPrice(s)}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-12 gap-2.5 items-center">
              {/* Service name + autocomplete */}
              <div className="col-span-12 sm:col-span-6 relative">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Service Description</label>
                <input
                  type="text"
                  placeholder="Type or search catalog…"
                  value={item.description}
                  onChange={(e) => setSearch(idx, e.target.value)}
                  className="vmd-input text-xs w-full"
                  disabled={isCovered}
                />
                {dropdownOpen && (
                  <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {catalogFiltered.map((svc) => (
                      <button
                        key={svc.code || svc.name}
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectFromCatalog(idx, svc.code || svc.name); }}
                        className="w-full px-3 py-2 text-left hover:bg-primary/5 text-xs flex justify-between items-center"
                      >
                        <span className="font-medium text-slate-800">{svc.name}</span>
                        <span className="font-mono font-bold text-primary text-[11px]">₹{getPrice(svc)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Qty */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })}
                  className="vmd-input text-xs w-full"
                  disabled={isCovered}
                />
              </div>

              {/* Unit Price */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unit Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.unit_price}
                  onChange={(e) => updateItem(idx, { unit_price: Number(e.target.value) })}
                  className="vmd-input text-xs w-full"
                  disabled={isCovered}
                />
              </div>

              {/* Total */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Total (₹)</label>
                <div className="vmd-input text-xs font-bold text-slate-900 bg-slate-100">
                  ₹{(item.total || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add row button */}
      <button
        type="button"
        onClick={addRow}
        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-primary/40 hover:text-primary transition-colors"
      >
        + Add Another Service Item
      </button>
    </div>
  );
}
