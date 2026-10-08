'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle2, Send } from 'lucide-react';

interface NoShowsTabProps {
  noShows: any[];
  onSendReminder: (item: any) => void;
  sendingReminderId: string | null;
}

export default function NoShowsTab({
  noShows,
  onSendReminder,
  sendingReminderId,
}: NoShowsTabProps) {
  return (
    <div className="space-y-4 pt-3">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Unconverted &amp; Missed Appointment Queue
            </CardTitle>
            <CardDescription className="text-xs">
              Appointments scheduled in the past that were never checked in, billed, or completed.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-semibold text-amber-700 border-amber-200 bg-amber-50">
            {noShows.length} Pending Recalls
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {noShows.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No Missed Appointments</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All past scheduled appointments were either checked in, completed, or cancelled with notice.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Contact Phone</th>
                  <th className="p-3.5">Consultant Doctor</th>
                  <th className="p-3.5">Care Stream</th>
                  <th className="p-3.5">Scheduled Slot (Past)</th>
                  <th className="p-3.5">Recall Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {noShows.map((ns: any) => (
                  <tr key={ns.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <Link
                        href={`/patients/${ns.patient_id}`}
                        className="font-bold text-slate-900 hover:text-primary"
                      >
                        {ns.patient_name}
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono">{ns.patient_vid}</p>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">{ns.patient_phone}</td>
                    <td className="p-3.5 text-slate-800 font-semibold">{ns.doctor_name}</td>
                    <td className="p-3.5 text-slate-600">{ns.department}</td>
                    <td className="p-3.5 text-slate-500">{formatDateTime(ns.scheduled_time)}</td>
                    <td className="p-3.5">
                      {ns.reminders_count > 0 ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 font-semibold">
                          {ns.reminders_count} Reminder(s) Dispatched
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                          No Recall Sent
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSendReminder(ns)}
                        disabled={sendingReminderId === ns.id}
                        className="h-7 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5 rounded gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>{sendingReminderId === ns.id ? 'Sending...' : 'WhatsApp Reminder'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
