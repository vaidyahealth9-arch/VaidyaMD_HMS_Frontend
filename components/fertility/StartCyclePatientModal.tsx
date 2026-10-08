'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Search,
  User,
  Users,
  ArrowRight,
  Activity,
  Phone,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { patientsApi } from '@/lib/api';

interface StartCyclePatientModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StartCyclePatientModal({
  open,
  onClose,
}: StartCyclePatientModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent patients on open
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    patientsApi
      .list({ per_page: 25 })
      .then((res: any) => {
        const list = res?.patients || res?.items || (Array.isArray(res) ? res : []);
        setPatients(list);
      })
      .catch((err) => {
        console.error('Failed to load patients', err);
        setPatients([]);
      })
      .finally(() => setIsLoading(false));
  }, [open]);

  // Handle search queries
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsLoading(true);
      patientsApi
        .list({ per_page: 25 })
        .then((res: any) => {
          const list = res?.patients || res?.items || (Array.isArray(res) ? res : []);
          setPatients(list);
        })
        .finally(() => setIsLoading(false));
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await patientsApi.list({ search: query.trim(), per_page: 25 });
      const list = res?.patients || res?.items || (Array.isArray(res) ? res : []);
      setPatients(list);
    } catch {
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPatient = (patient: any) => {
    onClose();
    router.push(`/patients/${patient.id}?tab=treatment&action=new`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Start New Treatment Cycle</h2>
              <p className="text-xs text-slate-500">
                Select patient to initialize their IVF / ICSI / FET clinical cycle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar + Register Link */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patient by Name, Phone, or VID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-400 font-medium text-[11px]">
              {patients.length} {patients.length === 1 ? 'patient' : 'patients'} found
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/patients/register');
              }}
              className="text-primary hover:text-primary-mid font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Register New Patient</span>
            </button>
          </div>
        </div>

        {/* Patient Selection List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-semibold">Loading patients...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <User className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No matching patients found</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Check the search criteria or register a new couple to start their treatment cycle.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/patients/register');
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-xs hover:bg-primary-mid transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Patient</span>
              </button>
            </div>
          ) : (
            patients.map((p) => {
              const partnerName = p.partner_name || p.partner?.name;
              const partnerVid = p.partner_vid || p.partner?.vid;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className="p-3.5 rounded-xl border border-slate-200/90 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 text-slate-600 group-hover:text-primary flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                      {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                          {p.name}
                        </h4>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {p.vid || p.id?.slice(0, 8)}
                        </span>
                        {p.gender && (
                          <span className="text-[10px] font-semibold text-slate-500 capitalize">
                            {p.gender}
                            {p.age ? ` · ${p.age}y` : ''}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                        {p.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {p.phone}
                          </span>
                        )}
                        {partnerName && (
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Users className="w-3 h-3 text-slate-400" />
                            Partner: <strong>{partnerName}</strong>
                            {partnerVid ? ` (${partnerVid})` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                    >
                      <span>Start Cycle</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
