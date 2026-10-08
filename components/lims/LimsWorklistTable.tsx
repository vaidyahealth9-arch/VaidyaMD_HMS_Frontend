'use client';

import React from 'react';
import { Search, Barcode, Eye } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';

interface LimsWorklistTableProps {
  worklist: any[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  selectedGender: string;
  setSelectedGender: (g: string) => void;
  onOpenBarcodeModal: (item: any) => void;
  onOpenReview: (item: any) => void;
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export default function LimsWorklistTable({
  worklist: filteredWorklist,
  isLoading,
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedGender,
  setSelectedGender,
  onOpenBarcodeModal,
  onOpenReview,
}: LimsWorklistTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'Pending Authorization', 'Authorized'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedStatus === st
                  ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All Worklist' : st}
            </button>
          ))}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {['all', 'female', 'male'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                  selectedGender === g
                    ? 'bg-white text-[rgb(var(--clr-primary))] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'All Genders' : g === 'female' ? 'Female ♀' : 'Male ♂'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, sample barcode, test..."
            className="pl-9 h-9 text-xs rounded-md"
          />
        </div>
      </div>

      {/* LIMS WORKLIST TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Sample Barcode</th>
              <th className="p-3.5">Patient Details</th>
              <th className="p-3.5">Diagnostic Test Name</th>
              <th className="p-3.5">Analyzer Stream</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Ingested At</th>
              <th className="p-3.5 text-right">Pathologist Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredWorklist.length > 0 ? (
              filteredWorklist.map((item: any) => {
                const isPending = item.status === 'Pending Authorization';
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] px-2 py-0.5 rounded">
                          {item.sample_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenBarcodeModal(item)}
                          className="p-1 text-slate-400 hover:text-[rgb(var(--clr-primary))] hover:bg-slate-100 rounded transition-colors"
                          title="Print Desmat 48 / Roll Sticker"
                        >
                          <Barcode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{item.patient_name}</p>
                      <p className="text-[11px] text-slate-500">{item.patient_mrn} · {item.gender}, {item.age}y</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{item.test_name}</p>
                      <p className="text-[10px] text-slate-400">{item.observations_count} parameters extracted</p>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{item.analyzer_id}</Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={isPending ? 'warning' : 'success'} className="text-[10px] uppercase font-bold">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDateTime(item.created_at)}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant={isPending ? 'default' : 'outline'}
                        onClick={() => onOpenReview(item)}
                        className={`h-7 text-xs font-bold rounded-lg gap-1 ${
                          isPending ? 'bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isPending ? 'Review & Sign' : 'View Report'}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400 text-xs">
                  {isLoading ? 'Loading equipment stream...' : 'No lab records found matching criteria. Click simulate buttons above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
