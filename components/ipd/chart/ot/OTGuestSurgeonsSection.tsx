'use client';

import React from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export interface GuestSurgeonItem {
  name: string;
  role?: string;
  hospital?: string;
  fee: number;
}

interface OTGuestSurgeonsSectionProps {
  guestSurgeons: GuestSurgeonItem[];
  setGuestSurgeons: React.Dispatch<React.SetStateAction<GuestSurgeonItem[]>>;
}

export default function OTGuestSurgeonsSection({
  guestSurgeons,
  setGuestSurgeons,
}: OTGuestSurgeonsSectionProps) {
  const handleAdd = () => {
    setGuestSurgeons((prev) => [
      ...prev,
      { name: '', role: 'Visiting Specialist', hospital: '', fee: 0 },
    ]);
  };

  const handleRemove = (index: number) => {
    setGuestSurgeons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof GuestSurgeonItem, value: any) => {
    setGuestSurgeons((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  };

  return (
    <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-700 uppercase text-[10px] flex items-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Visiting / External Guest Surgeons ({guestSurgeons.length})</span>
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          className="h-6 px-2 text-[10px] font-bold gap-1 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
        >
          <Plus className="w-3 h-3" />
          <span>Add Guest Surgeon</span>
        </Button>
      </div>

      {guestSurgeons.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">
          No external/guest surgeons called for this procedure. Click &apos;Add Guest Surgeon&apos; if specialist was invited.
        </p>
      ) : (
        <div className="space-y-2">
          {guestSurgeons.map((g, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-md">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">
                  Doctor Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={g.name}
                  onChange={(e) => handleChange(idx, 'name', e.target.value)}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="h-7 text-xs font-semibold"
                  required
                />
              </div>

              <div className="w-40">
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Role / Affiliation</label>
                <Input
                  value={g.role}
                  onChange={(e) => handleChange(idx, 'role', e.target.value)}
                  placeholder="e.g. Visiting Laparoscopist"
                  className="h-7 text-xs"
                />
              </div>

              <div className="w-28">
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Fee Tariff (₹)</label>
                <Input
                  type="number"
                  min="0"
                  value={g.fee || ''}
                  onChange={(e) => handleChange(idx, 'fee', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-7 text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-3.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(idx)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
