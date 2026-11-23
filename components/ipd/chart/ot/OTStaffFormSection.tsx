'use client';

import React, { useState } from 'react';
import { Input } from '@/shared/ui/input';

interface OTStaffFormSectionProps {
  doctors: any[];
  nurses: any[];
  primarySurgeonId: string;
  setPrimarySurgeonId: (id: string) => void;
  assistantSurgeonId: string;
  setAssistantSurgeonId: (id: string) => void;
  assistantSurgeonName: string;
  setAssistantSurgeonName: (name: string) => void;
  anesthetistId: string;
  setAnesthetistId: (id: string) => void;
  anesthetistName: string;
  setAnesthetistName: (name: string) => void;
  scrubNurseId: string;
  setScrubNurseId: (id: string) => void;
  circulatingNurseId: string;
  setCirculatingNurseId: (id: string) => void;
  anesthesiaType: string;
  setAnesthesiaType: (type: string) => void;
}

const cleanDoc = (name?: string) => {
  if (!name) return '';
  return name.replace(/^dr\.?\s+/i, '');
};

const STANDARD_ANESTHESIA = [
  'General Anesthesia (GA)',
  'Spinal Anesthesia',
  'Epidural Anesthesia',
  'Local Anesthesia (LA)',
  'MAC / Sedation',
  'Regional Nerve Block',
];

export default function OTStaffFormSection({
  doctors,
  nurses,
  primarySurgeonId,
  setPrimarySurgeonId,
  assistantSurgeonId,
  setAssistantSurgeonId,
  assistantSurgeonName,
  setAssistantSurgeonName,
  anesthetistId,
  setAnesthetistId,
  anesthetistName,
  setAnesthetistName,
  scrubNurseId,
  setScrubNurseId,
  circulatingNurseId,
  setCirculatingNurseId,
  anesthesiaType,
  setAnesthesiaType,
}: OTStaffFormSectionProps) {
  const [isCustomAsst, setIsCustomAsst] = useState(!!assistantSurgeonName && !assistantSurgeonId);
  const [isCustomAnes, setIsCustomAnes] = useState(!!anesthetistName && !anesthetistId);
  const [isCustomAnesType, setIsCustomAnesType] = useState(
    !!anesthesiaType && !STANDARD_ANESTHESIA.includes(anesthesiaType)
  );

  return (
    <div className="space-y-3">
      {/* Surgical Doctors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
            Primary Operating Surgeon <span className="text-rose-500">*</span>
          </label>
          <select
            value={primarySurgeonId}
            onChange={(e) => setPrimarySurgeonId(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
            required
          >
            <option value="">Select Primary Surgeon</option>
            {doctors.map((d: any) => (
              <option key={d.id} value={d.id}>
                Dr. {cleanDoc(d.name)} {d.specialization ? `(${d.specialization})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 uppercase text-[10px]">Assistant Surgeon</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomAsst(!isCustomAsst);
                if (!isCustomAsst) setAssistantSurgeonId('');
                else setAssistantSurgeonName('');
              }}
              className="text-[10px] text-indigo-600 hover:underline font-semibold"
            >
              {isCustomAsst ? 'Pick Staff Doctor' : 'Enter Free Text'}
            </button>
          </div>
          {isCustomAsst ? (
            <Input
              value={assistantSurgeonName}
              onChange={(e) => setAssistantSurgeonName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Kumar (External)"
              className="h-8 text-xs font-semibold"
            />
          ) : (
            <select
              value={assistantSurgeonId}
              onChange={(e) => setAssistantSurgeonId(e.target.value)}
              className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              <option value="">None / Optional</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  Dr. {cleanDoc(d.name)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 uppercase text-[10px]">Anesthesiologist</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomAnes(!isCustomAnes);
                if (!isCustomAnes) setAnesthetistId('');
                else setAnesthetistName('');
              }}
              className="text-[10px] text-indigo-600 hover:underline font-semibold"
            >
              {isCustomAnes ? 'Pick Staff Doctor' : 'Enter Free Text'}
            </button>
          </div>
          {isCustomAnes ? (
            <Input
              value={anesthetistName}
              onChange={(e) => setAnesthetistName(e.target.value)}
              placeholder="e.g. Dr. Anil Sharma (Visiting Anesthetist)"
              className="h-8 text-xs font-semibold"
            />
          ) : (
            <select
              value={anesthetistId}
              onChange={(e) => setAnesthetistId(e.target.value)}
              className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              <option value="">Select Anesthetist</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>
                  Dr. {cleanDoc(d.name)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Nurses & Anesthesia Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Scrub Nurse</label>
          <select
            value={scrubNurseId}
            onChange={(e) => setScrubNurseId(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
          >
            <option value="">Select Scrub Nurse</option>
            {nurses.map((n: any) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Circulating Nurse</label>
          <select
            value={circulatingNurseId}
            onChange={(e) => setCirculatingNurseId(e.target.value)}
            className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
          >
            <option value="">Select Circulating Nurse</option>
            {nurses.map((n: any) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-700 uppercase text-[10px]">Anesthesia Type</label>
            <button
              type="button"
              onClick={() => {
                setIsCustomAnesType(!isCustomAnesType);
                if (!isCustomAnesType) setAnesthesiaType('');
                else setAnesthesiaType('General Anesthesia (GA)');
              }}
              className="text-[10px] text-indigo-600 hover:underline font-semibold"
            >
              {isCustomAnesType ? 'Select Standard' : 'Free Text'}
            </button>
          </div>
          {isCustomAnesType ? (
            <Input
              value={anesthesiaType}
              onChange={(e) => setAnesthesiaType(e.target.value)}
              placeholder="e.g. TIVA, Saddle Block..."
              className="h-8 text-xs font-semibold"
            />
          ) : (
            <select
              value={anesthesiaType}
              onChange={(e) => setAnesthesiaType(e.target.value)}
              className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              {STANDARD_ANESTHESIA.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
