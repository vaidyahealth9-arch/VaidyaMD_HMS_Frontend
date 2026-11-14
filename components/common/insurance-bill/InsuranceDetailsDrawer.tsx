'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Check, Settings2, X } from 'lucide-react';
import type { InsuranceDetails } from './types';

interface InsuranceDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  details: InsuranceDetails;
  onChange: (details: InsuranceDetails) => void;
}

export default function InsuranceDetailsDrawer({
  isOpen,
  onClose,
  details,
  onChange,
}: InsuranceDetailsDrawerProps) {
  if (!isOpen) return null;

  const update = (field: keyof InsuranceDetails, value: string) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-white space-y-3 no-print mb-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Edit Insurance & TPA Claim Header Details
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Claim No. <span className="text-emerald-400">*</span>
          </label>
          <Input
            value={details.claim_no || ''}
            onChange={(e) => update('claim_no', e.target.value)}
            placeholder="e.g. 110202629793"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Emp ID / Policy No
          </label>
          <Input
            value={details.policy_no || ''}
            onChange={(e) => update('policy_no', e.target.value)}
            placeholder="e.g. 0512315"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Medical Card No.
          </label>
          <Input
            value={details.medical_card_no || ''}
            onChange={(e) => update('medical_card_no', e.target.value)}
            placeholder="e.g. 4016/X/343244338"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            TPA Name
          </label>
          <Input
            value={details.tpa_name || ''}
            onChange={(e) => update('tpa_name', e.target.value)}
            placeholder="e.g. ICICI LOMBARD"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white uppercase"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            TPA GST No
          </label>
          <Input
            value={details.tpa_gst_no || ''}
            onChange={(e) => update('tpa_gst_no', e.target.value)}
            placeholder="e.g. 36AAACI7904G1ZO"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Organization Name
          </label>
          <Input
            value={details.organization || ''}
            onChange={(e) => update('organization', e.target.value)}
            placeholder="e.g. ICICI LOMBARD GENERAL"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white uppercase"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Admission No
          </label>
          <Input
            value={details.admission_no || ''}
            onChange={(e) => update('admission_no', e.target.value)}
            placeholder="e.g. IPBG2627010059"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white font-mono"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
            Admitted Bed / Room
          </label>
          <Input
            value={details.admitted_bed || ''}
            onChange={(e) => update('admitted_bed', e.target.value)}
            placeholder="e.g. TWIN/TWIN"
            className="h-8 text-xs bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          onClick={onClose}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply to Bill</span>
        </Button>
      </div>
    </div>
  );
}
