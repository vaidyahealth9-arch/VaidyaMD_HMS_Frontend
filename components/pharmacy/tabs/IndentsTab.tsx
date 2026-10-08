'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from '@/lib/api';
import { FileText, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { formatDate } from '@/lib/utils';

interface IndentsTabProps {
  indents: any[];
  onOpenNewIndentModal: () => void;
  onSuccess?: (message: string) => void;
}

export default function IndentsTab({
  indents,
  onOpenNewIndentModal,
  onSuccess,
}: IndentsTabProps) {
  const queryClient = useQueryClient();

  const handleFulfillIndent = async (id: string) => {
    try {
      await pharmacyApi.updateIndentStatus(id, 'Fulfilled');
      queryClient.invalidateQueries({ queryKey: ['pharmacy-indents'] });
      onSuccess?.('Department indent marked as Fulfilled');
    } catch (err: any) {
      alert(err.message || 'Failed to update indent status');
    }
  };

  return (
    <div className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Department Pharmacy Indents</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Medicine transfer requests raised by IVF OT, Daycare, and Inpatient Wards</p>
              </div>
              <Button
                size="sm"
                onClick={() => onOpenNewIndentModal()}
                className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs h-8 px-3 rounded-md shadow-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Raise Department Indent</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3.5">Indent #</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Urgency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Created Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {indents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700 text-xs">No Department Indents Requested</p>
                        <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
                          Wards and procedure rooms can submit clinical medication indents for stock dispatch.
                        </p>
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={() => onOpenNewIndentModal()}
                            className="bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs h-8 px-3 rounded-md gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Raise First Indent</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    indents.map((ind: any) => {
                      const isPending = (ind.status || '').toLowerCase() === 'pending';
                      return (
                        <tr key={ind.id} className="hover:bg-slate-50">
                          <td className="p-3.5 font-mono font-bold text-[rgb(var(--clr-primary))]">{ind.indent_number}</td>
                          <td className="p-3.5 font-bold text-slate-900">{ind.requesting_department}</td>
                          <td className="p-3.5">
                            <Badge
                              variant={ind.urgency === 'Emergency' ? 'destructive' : ind.urgency === 'Urgent' ? 'outline' : 'secondary'}
                              className={`text-[10px] font-bold ${ind.urgency === 'Urgent' ? 'border-amber-400 bg-amber-50 text-amber-800' : ''}`}
                            >
                              {ind.urgency}
                            </Badge>
                          </td>
                          <td className="p-3.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                ind.status === 'Fulfilled' || ind.status === 'Approved'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                  : 'border-amber-300 bg-amber-50 text-amber-800'
                              }`}
                            >
                              {ind.status}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-slate-500">{formatDate(ind.created_at)}</td>
                          <td className="p-3.5 text-right">
                            {isPending ? (
                              <Button
                                size="sm"
                                onClick={() => handleFulfillIndent(ind.id)}
                                className="h-7 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded px-2.5"
                              >
                                Fulfill Indent
                              </Button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

    </div>
  );
}
