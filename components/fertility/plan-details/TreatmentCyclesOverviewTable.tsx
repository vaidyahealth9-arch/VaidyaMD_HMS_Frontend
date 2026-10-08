'use client';

import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { TreatmentCycleRecord } from './types';
import { authApi } from '@/lib/api';

interface TreatmentCyclesOverviewTableProps {
  cycles: TreatmentCycleRecord[];
  activeCycleId?: string;
  onSelectCycle: (cycle: TreatmentCycleRecord) => void;
  onExportCsv?: () => void;
  userMap?: Record<string, string>;
}

export default function TreatmentCyclesOverviewTable({
  cycles,
  activeCycleId,
  onSelectCycle,
  onExportCsv,
  userMap,
}: TreatmentCyclesOverviewTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalUserMap, setInternalUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    authApi
      .getDoctors()
      .then((docs: any) => {
        if (Array.isArray(docs)) {
          const map: Record<string, string> = {};
          docs.forEach((d: any) => {
            if (d.id && d.name) map[d.id] = d.name;
          });
          setInternalUserMap((prev) => ({ ...map, ...prev }));
        }
      })
      .catch(() => {});

    authApi
      .listUsers()
      .then((users: any) => {
        if (Array.isArray(users)) {
          const map: Record<string, string> = {};
          users.forEach((u: any) => {
            if (u.id && u.name) map[u.id] = u.name;
          });
          setInternalUserMap((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => {});
  }, []);

  const formatCreatedBy = (c: TreatmentCycleRecord): string => {
    if (c.created_by_name && c.created_by_name.trim()) {
      return c.created_by_name;
    }
    const mergedUserMap = { ...internalUserMap, ...(userMap || {}) };
    if (c.created_by && mergedUserMap[c.created_by]) {
      return mergedUserMap[c.created_by];
    }
    if (c.doctor_name && c.treating_doctor_id && c.treating_doctor_id === c.created_by) {
      return c.doctor_name;
    }
    if (c.treating_doctor_name && c.treating_doctor_id && c.treating_doctor_id === c.created_by) {
      return c.treating_doctor_name;
    }
    const val = c.created_by;
    if (!val) return 'Clinical Staff';
    // If it looks like a raw UUID or ID hash, show friendly role fallback rather than cryptic ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const isIdLike = isUuid || /^(usr-|user-)?[0-9a-f]{16,}$/i.test(val);
    if (isIdLike) {
      return 'Clinical Staff';
    }
    return val;
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('running') || s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Running
        </span>
      );
    }
    if (s.includes('completed')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
          Completed
        </span>
      );
    }
    if (s.includes('cancel')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Cancelled
        </span>
      );
    }
    if (s.includes('plan')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          Planned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        {status || 'Draft'}
      </span>
    );
  };

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }

    // Default CSV generator
    if (!cycles || cycles.length === 0) return;
    const headers = ['Cycle Id', 'Status', 'Treatment', 'Start Date', 'Attempt', 'Created At', 'Created By', 'Reason'];
    const rows = cycles.map((c) => [
      c.cycle_id,
      c.status,
      c.treatment_type,
      c.start_date,
      c.attempt_number,
      c.created_at,
      formatCreatedBy(c),
      c.reason || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell || ''}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `treatment_cycles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
      {/* Title Header Bar */}
      <div className="bg-[#0B4F6C] text-white px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-white/90" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Treatment Cycles</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white/80 hover:text-white p-0.5 rounded cursor-pointer"
            title={isCollapsed ? 'Expand Treatment Cycles' : 'Collapse Treatment Cycles'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Table Content */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold text-[11px] select-none border-b border-slate-200">
                <th className="py-2.5 px-4 min-w-[160px]">Cycle Id</th>
                <th className="py-2.5 px-3 min-w-[120px]">Status</th>
                <th className="py-2.5 px-3 min-w-[140px]">Treatment</th>
                <th className="py-2.5 px-3 min-w-[110px]">Start Date</th>
                <th className="py-2.5 px-2 w-16 text-center">Attempt</th>
                <th className="py-2.5 px-3 min-w-[140px]">Created At</th>
                <th className="py-2.5 px-3 min-w-[120px]">Created By</th>
                <th className="py-2.5 px-4 min-w-[120px]">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cycles && cycles.length > 0 ? (
                cycles.map((c) => {
                  const isSelected = c.id === activeCycleId;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCycle(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-50 font-medium border-l-4 border-l-[#0B4F6C]'
                          : 'hover:bg-slate-50/60 bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-[#0B4F6C]">
                        {c.cycle_id}
                      </td>
                      <td className="py-2.5 px-3">
                        {getStatusBadge(c.status)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {c.treatment_type}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {c.start_date || '—'}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {c.attempt_number}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">
                        {formatCreatedBy(c)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 italic">
                        {c.reason || '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                    No treatment cycles recorded for this patient.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
