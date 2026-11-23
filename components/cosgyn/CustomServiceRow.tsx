'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { CustomCosgynServiceItem } from './types';

interface CustomServiceRowProps {
  service: CustomCosgynServiceItem;
  index: number;
  totalServices: number;
  presets: Array<{ name: string; defaultDuration: number; defaultPrice: number; defaultFreq: string }>;
  onUpdateService: (id: string, field: keyof CustomCosgynServiceItem, value: any) => void;
  onRemoveService: (id: string) => void;
}

export default function CustomServiceRow({
  service,
  index,
  totalServices,
  presets,
  onUpdateService,
  onRemoveService,
}: CustomServiceRowProps) {
  const itemSubtotal = (Number(service.sessions) || 0) * (Number(service.unitPrice) || 0);

  return (
    <div className="bg-white border border-pink-200 rounded-xl p-3.5 shadow-2xs space-y-3 transition-all hover:border-pink-300">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-800 flex items-center justify-center font-bold text-[11px]">
            {index + 1}
          </span>
          <div className="flex-1 max-w-xs">
            <select
              value={presets.some((p) => p.name === service.name) ? service.name : '__custom__'}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  onUpdateService(service.id, 'name', 'Custom Modality');
                } else {
                  onUpdateService(service.id, 'name', e.target.value);
                }
              }}
              className="w-full h-8 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-2"
            >
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
              <option value="__custom__">+ Custom One-Off Service...</option>
            </select>
          </div>
          {!presets.some((p) => p.name === service.name) && (
            <Input
              type="text"
              placeholder="Enter custom service name"
              value={service.name}
              onChange={(e) => onUpdateService(service.id, 'name', e.target.value)}
              className="h-8 text-xs flex-1 min-w-[140px] font-semibold"
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Subtotal</span>
            <span className="text-xs font-bold text-pink-700 font-mono">
              {formatCurrency(itemSubtotal)}
            </span>
          </div>
          {totalServices > 1 && (
            <button
              type="button"
              onClick={() => onRemoveService(service.id)}
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
              title="Remove service"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quantities, Tariff, Duration, Schedule Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Sessions (Qty) *
          </label>
          <Input
            type="number"
            min="1"
            max="50"
            value={service.sessions}
            onChange={(e) => onUpdateService(service.id, 'sessions', parseInt(e.target.value) || 1)}
            className="h-8 text-xs font-bold bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Rate / Session (₹)
          </label>
          <Input
            type="number"
            min="0"
            step="100"
            value={service.unitPrice}
            onChange={(e) => onUpdateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
            className="h-8 text-xs font-semibold bg-slate-50 font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Duration (mins)
          </label>
          <Input
            type="number"
            min="10"
            max="180"
            step="5"
            value={service.duration_mins}
            onChange={(e) => onUpdateService(service.id, 'duration_mins', parseInt(e.target.value) || 30)}
            className="h-8 text-xs bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={service.startDate}
            onChange={(e) => onUpdateService(service.id, 'startDate', e.target.value)}
            className="h-8 text-xs bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Slot Time
          </label>
          <Input
            type="time"
            value={service.time}
            onChange={(e) => onUpdateService(service.id, 'time', e.target.value)}
            className="h-8 text-xs font-mono bg-slate-50"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Cadence
          </label>
          <select
            value={service.frequency}
            onChange={(e) => onUpdateService(service.id, 'frequency', e.target.value)}
            className="w-full h-8 text-xs bg-slate-50 border border-slate-200 rounded-md px-2"
          >
            <option value="once">Once (Single Session)</option>
            <option value="daily">Daily</option>
            <option value="alternate">Every Alternate Day</option>
            <option value="twice_weekly">Twice a Week</option>
            <option value="weekly">Weekly</option>
            <option value="fortnightly">Every 14 Days</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  );
}
