'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';

interface CosgynPatientSelectorProps {
  patients: any[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
}

export default function CosgynPatientSelector({
  patients,
  selectedPatientId,
  setSelectedPatientId,
}: CosgynPatientSelectorProps) {
  const [modalPatientSearch, setModalPatientSearch] = useState('');
  const [isModalPatientDropdownOpen, setIsModalPatientDropdownOpen] = useState(false);
  const modalPatientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalPatientDropdownRef.current && !modalPatientDropdownRef.current.contains(event.target as Node)) {
        setIsModalPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPat = patients.find((p: any) => p.id === selectedPatientId);

  if (selectedPat) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-bold text-slate-700 block">Selected Patient *</label>
        <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center font-bold text-xs">
              {selectedPat.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-pink-950">{selectedPat.name}</p>
              <p className="text-[11px] text-pink-700 font-mono">
                MRN: {selectedPat.mrn || selectedPat.vid || 'N/A'} · {selectedPat.gender || 'F'} · {selectedPat.age ? `${selectedPat.age}y` : ''} · {selectedPat.phone || ''}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedPatientId('');
              setModalPatientSearch('');
              setIsModalPatientDropdownOpen(true);
            }}
            className="h-7 text-xs border-pink-300 text-pink-800 hover:bg-pink-100 cursor-pointer"
          >
            Change
          </Button>
        </div>
      </div>
    );
  }

  const query = modalPatientSearch.toLowerCase().trim();
  const filtered = patients.filter((p: any) => {
    if (!query) return true;
    return (
      p.name?.toLowerCase().includes(query) ||
      p.mrn?.toLowerCase().includes(query) ||
      p.vid?.toLowerCase().includes(query) ||
      p.phone?.toLowerCase().includes(query)
    );
  }).slice(0, 15);

  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 block">Select Patient *</label>
      <div className="relative" ref={modalPatientDropdownRef}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search patient by name, MRN, VID, or phone number..."
            value={modalPatientSearch}
            onChange={(e) => {
              setModalPatientSearch(e.target.value);
              setIsModalPatientDropdownOpen(true);
            }}
            onFocus={() => setIsModalPatientDropdownOpen(true)}
            className="pl-9 h-9 text-xs bg-slate-50 focus:bg-white"
          />
        </div>
        {isModalPatientDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400 font-medium">No matching patients found</div>
            ) : (
              filtered.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setIsModalPatientDropdownOpen(false);
                  }}
                  className="w-full text-left p-2.5 hover:bg-pink-50/80 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-pink-200 group-hover:text-pink-900">
                      {p.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-pink-950">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        MRN: {p.mrn || p.vid || 'N/A'} · {p.gender || 'F'} · {p.age ? `${p.age}y` : ''} · {p.phone || 'No phone'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                    Select →
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
