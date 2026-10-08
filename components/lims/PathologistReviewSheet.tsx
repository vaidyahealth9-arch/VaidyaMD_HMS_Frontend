'use client';

import React from 'react';
import { FlaskConical, FileCheck } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';

interface PathologistReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reviewRecord: any;
  pathologistComments: string;
  setPathologistComments: (c: string) => void;
  isAuthorizing?: boolean;
  onAuthorize: () => void;
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

export default function PathologistReviewSheet({
  isOpen,
  onClose,
  reviewRecord,
  pathologistComments,
  setPathologistComments,
  isAuthorizing = false,
  onAuthorize,
}: PathologistReviewSheetProps) {
  return (
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
              <SheetTitle className="text-base font-bold text-slate-900">
                Pathologist Review: {reviewRecord?.test_name}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-slate-500">
              Sample {reviewRecord?.sample_id} · Patient: {reviewRecord?.patient_name} ({reviewRecord?.patient_mrn})
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-3">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Analyzer Model</span>
                <span className="font-bold text-slate-800">{reviewRecord?.analyzer_id}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Ingestion Time</span>
                <span className="font-semibold text-slate-800">{reviewRecord ? formatDateTime(reviewRecord.created_at) : '—'}</span>
              </div>
            </div>

            {/* Extracted Parameters Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">HL7 Parsed Observations</h4>
              <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Result</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Reference Range</th>
                      <th className="p-2.5">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reviewRecord?.observations &&
                      Object.values(reviewRecord.observations).map((obs: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{obs.name || obs.code}</td>
                          <td className="p-2.5 font-bold text-[rgb(var(--clr-primary))]">{obs.value}</td>
                          <td className="p-2.5 text-slate-500">{obs.unit}</td>
                          <td className="p-2.5 text-slate-600">{obs.reference_range || '—'}</td>
                          <td className="p-2.5">
                            <Badge variant={obs.flag === 'N' ? 'success' : 'destructive'} className="text-[9px]">
                              {obs.flag === 'N' ? 'Normal' : obs.flag}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pathologist Comments */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pathologist Clinical Interpretation & Sign-Off Notes</label>
              <textarea
                value={pathologistComments}
                onChange={(e) => setPathologistComments(e.target.value)}
                rows={3}
                placeholder="e.g. Findings correlate with normozoospermic profile under WHO 6th edition guidelines."
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClose()}
              className="rounded-md h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => onAuthorize()}
              disabled={isAuthorizing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-md shadow-md gap-1.5 text-xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>{isAuthorizing ? 'Publishing...' : 'Authorize & Publish to EMR'}</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

  );
}
