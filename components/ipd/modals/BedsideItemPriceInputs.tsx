'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';
import { formatCurrency } from '@/lib/utils';

interface BedsideItemPriceInputsProps {
  quantity: string;
  setQuantity: (q: string) => void;
  unitPrice: string;
  setUnitPrice: (p: string) => void;
}

export default function BedsideItemPriceInputs({
  quantity,
  setQuantity,
  unitPrice,
  setUnitPrice,
}: BedsideItemPriceInputsProps) {
  const total = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
          Quantity
        </label>
        <Input
          type="number"
          step="any"
          min="0.1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          className="h-9 text-xs font-mono font-bold"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
          Unit Price (₹)
        </label>
        <Input
          type="number"
          step="any"
          min="0"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="0.00"
          required
          className="h-9 text-xs font-mono font-bold"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
          Line Item Total (₹)
        </label>
        <div className="h-9 px-3 flex items-center bg-white border border-slate-300 rounded-lg text-sm font-bold font-mono text-indigo-700">
          {formatCurrency(total)}
        </div>
      </div>
    </div>
  );
}
