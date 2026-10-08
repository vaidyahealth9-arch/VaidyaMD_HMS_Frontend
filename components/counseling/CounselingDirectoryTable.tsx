'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  HeartHandshake,
  FileText,
  Printer,
  Edit3,
  ShieldCheck,
} from 'lucide-react';

interface CounselingDirectoryTableProps {
  notesLoading: boolean;
  notes: any[];
  onView: (note: any) => void;
  onPrint: (note: any) => void;
  onEdit: (note: any) => void;
}

export default function CounselingDirectoryTable({
  notesLoading,
  notes,
  onView,
  onPrint,
  onEdit,
}: CounselingDirectoryTableProps) {
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
          <tr>
            <th className="p-3.5">Session Date</th>
            <th className="p-3.5">Patient Details</th>
            <th className="p-3.5">Source</th>
            <th className="p-3.5">Planned Procedure</th>
            <th className="p-3.5">Clinical Discussion Preview</th>
            <th className="p-3.5">Counselor Signature</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {notesLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading counseling records...</span>
                </div>
              </td>
            </tr>
          ) : notes.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-12 text-slate-400">
                <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No Counseling Sessions Found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click &quot;New Counseling Session&quot; above to record pre-ART counseling, discussion points, OPU/FET plans, and signatures.
                </p>
              </td>
            </tr>
          ) : (
            notes.map((note: any) => (
              <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3.5 text-slate-600 whitespace-nowrap">
                  <p className="font-bold text-slate-900">{formatDate(note.created_at)}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="p-3.5">
                  <p className="font-bold text-slate-900">{note.patient_name || 'Patient'}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <span className="font-mono font-bold text-primary">{note.patient_vid || '—'}</span>
                    {note.patient_age && <span>· {note.patient_age}y</span>}
                    {note.partner_name && <span className="truncate max-w-[120px]">· Partner: {note.partner_name}</span>}
                  </div>
                </td>
                <td className="p-3.5">
                  <Badge variant="outline" className="text-[10px] bg-slate-50 font-semibold border-slate-300">
                    {note.source || 'OP Consultation'}
                  </Badge>
                  {note.comments && (
                    <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5" title={note.comments}>
                      {note.comments}
                    </p>
                  )}
                </td>
                <td className="p-3.5">
                  <span className="font-bold text-slate-900 text-xs">{note.procedure || 'General Counseling'}</span>
                </td>
                <td className="p-3.5 max-w-xs">
                  <p className="text-slate-700 line-clamp-2 text-[11px] leading-relaxed">
                    {note.discussion || note.remarks || 'Clinical counseling conducted.'}
                  </p>
                  {note.egg_pick_up && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold text-pink-700 bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200">
                      OPU Notes Recorded
                    </span>
                  )}
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[140px]" title={note.signature}>
                      {note.signature || 'Signed'}
                    </span>
                  </div>
                </td>
                <td className="p-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(note)}
                      className="h-7 text-xs font-bold px-2.5 border-slate-300 hover:border-primary hover:text-primary"
                      title="View Complete 8-Column Counseling Sheet"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPrint(note)}
                      className="h-7 text-xs font-bold px-2 border-slate-300 hover:border-slate-800"
                      title="Print A4 Clinical Sheet"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(note)}
                      className="h-7 text-xs font-bold px-2 border-slate-300 hover:border-primary hover:text-primary"
                      title="Edit Counseling Note"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
