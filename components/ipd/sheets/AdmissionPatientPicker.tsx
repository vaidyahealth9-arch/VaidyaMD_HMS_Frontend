'use client';

import React, { useState, useMemo } from 'react';
import { Search, UserCheck } from 'lucide-react';

interface AdmissionPatientPickerProps {
  patients: any[];
  selectedPatient: any;
  onSelectPatient: (patient: any) => void;
  onClearPatient: () => void;
}

export default function AdmissionPatientPicker({
  patients = [],
  selectedPatient,
  onSelectPatient,
  onClearPatient,
}: AdmissionPatientPickerProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 10);
    const q = patientSearch.toLowerCase();
    return patients
      .filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.vid?.toLowerCase().includes(q) ||
          p.mrn?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
      )
      .slice(0, 15);
  }, [patients, patientSearch]);

  const handleSelect = (p: any) => {
    onSelectPatient(p);
    setShowDropdown(false);
    setPatientSearch('');
  };

  const handleClear = () => {
    onClearPatient();
    setPatientSearch('');
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
        <span>
          Patient Details <span className="text-red-500">*</span>
        </span>
        {selectedPatient && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-blue-600 hover:underline font-semibold"
          >
            Change Patient
          </button>
        )}
      </label>

      {selectedPatient ? (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {selectedPatient.name?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{selectedPatient.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono">
                VID: {selectedPatient.vid || selectedPatient.mrn || '—'} · {selectedPatient.gender || ''}{' '}
                {selectedPatient.age ? `(${selectedPatient.age}y)` : ''}
              </p>
              {selectedPatient.phone && (
                <p className="text-[10px] text-slate-400">Phone: {selectedPatient.phone}</p>
              )}
            </div>
          </div>
          <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mr-1" />
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Patient Name, VID, or Phone..."
              value={patientSearch}
              onFocus={() => setShowDropdown(true)}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setShowDropdown(true);
              }}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-slate-400"
            />
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 divide-y divide-slate-100">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full p-2.5 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        VID: {p.vid || p.mrn || '—'} · {p.gender || ''} · {p.phone || ''}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-slate-400 text-xs">No matching patients found.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
