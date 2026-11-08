'use client';

import React, { useState } from 'react';
import { ShieldAlert, FileText, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { RiskFactors } from '@/features/ipd/types';

interface InpatientAllergyRiskBarProps {
  diagnosis?: string;
  allergies?: string[];
  riskFactors?: RiskFactors;
  onAddAllergy: (allergy: string) => void;
  onRemoveAllergy: (allergy: string) => void;
  onToggleRisk: (key: string) => void;
  onEditMetadata: () => void;
  showFinancialSummary: boolean;
  onToggleFinancialSummary: () => void;
}

export default function InpatientAllergyRiskBar({
  diagnosis,
  allergies = [],
  riskFactors = {},
  onAddAllergy,
  onRemoveAllergy,
  onToggleRisk,
  onEditMetadata,
  showFinancialSummary,
  onToggleFinancialSummary,
}: InpatientAllergyRiskBarProps) {
  const [isAddingAllergy, setIsAddingAllergy] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');

  const handleAddSubmit = () => {
    if (newAllergy.trim()) {
      onAddAllergy(newAllergy.trim());
      setNewAllergy('');
      setIsAddingAllergy(false);
    }
  };

  return (
    <div className="p-3 bg-amber-50/30 px-4 sm:px-5 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-amber-100">
      {/* Left: Diagnosis & Allergies */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Primary Diagnosis Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-200/90 text-slate-800 shadow-2xs">
          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="font-semibold">Dx:</span>
          <span className="font-bold text-slate-900">{diagnosis || 'Clinical Diagnosis Pending'}</span>
          <button
            onClick={onEditMetadata}
            className="text-slate-400 hover:text-indigo-600 ml-1"
            title="Edit Diagnosis"
          >
            <Edit2 className="w-2.5 h-2.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-amber-200/80 hidden sm:block" />

        {/* Allergies Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="font-bold text-amber-950 uppercase text-[10px] tracking-wider">Allergies:</span>
          {allergies.length > 0 ? (
            allergies.map((all, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"
              >
                {all}
                <button onClick={() => onRemoveAllergy(all)} className="hover:text-rose-950 font-black">
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-slate-500 italic text-[11px]">NKDA</span>
          )}

          {isAddingAllergy ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                placeholder="Allergy name"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="h-5 px-1.5 text-xs border border-amber-300 rounded bg-white"
                autoFocus
              />
              <Button size="sm" onClick={handleAddSubmit} className="h-5 px-1.5 text-[10px] font-bold">
                Add
              </Button>
              <button onClick={() => setIsAddingAllergy(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingAllergy(true)}
              className="text-[11px] text-amber-800 font-bold hover:underline"
            >
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Right: Risk Chips & Show Details Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Chips:</span>
        <button
          onClick={() => onToggleRisk('fall_risk')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
            riskFactors.fall_risk
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Fall Risk
        </button>
        <button
          onClick={() => onToggleRisk('npo')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
            riskFactors.npo
              ? 'bg-amber-600 text-white border-amber-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          NPO
        </button>
        <button
          onClick={() => onToggleRisk('dvt_risk')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
            riskFactors.dvt_risk
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          DVT
        </button>
        <button
          onClick={() => onToggleRisk('isolation')}
          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
            riskFactors.isolation
              ? 'bg-purple-600 text-white border-purple-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Isolation
        </button>

        {/* Toggle Collapsible Financial & Emergency Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFinancialSummary}
          className="h-6 px-2 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 gap-1 ml-1"
        >
          <span>{showFinancialSummary ? 'Hide Finances' : 'Finances & Contacts'}</span>
          {showFinancialSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
}
