'use client';

import React from 'react';
import { Clock, CheckCircle2, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

interface NursingTabProps {
  nursingTasks: any[];
  onCompleteTask: (taskId: string) => void;
  onOpenVitalsTask?: (task: any) => void;
  isCompleting?: boolean;
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

export default function NursingTab({
  nursingTasks,
  onCompleteTask,
  onOpenVitalsTask,
  isCompleting = false,
}: NursingTabProps) {
  return (
    <div className="space-y-4 pt-2">
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Pending Inpatient Nursing Orders & Checklists</CardTitle>
            <p className="text-xs text-slate-500">Scheduled vitals, IV infusions, wound dressings, and eMAR checklists</p>
          </div>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-slate-100">
          {nursingTasks.length > 0 ? (
            nursingTasks.map((t: any) => {
              const isVitals = t.task_type?.toLowerCase().includes('vital');
              return (
                <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="purple" className="text-[10px] font-bold">
                        Bed: {t.bed_number}
                      </Badge>
                      <span className="font-bold text-slate-900 text-sm">{t.patient_name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {t.task_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{t.description}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Freq: {t.frequency} · Scheduled: {formatDateTime(t.scheduled_time)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isVitals && onOpenVitalsTask && (
                      <Button
                        size="sm"
                        onClick={() => onOpenVitalsTask(t)}
                        className="h-8 px-3 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Log Vitals</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => onCompleteTask(t.id)}
                      disabled={isCompleting}
                      variant={isVitals && onOpenVitalsTask ? 'outline' : 'default'}
                      className="h-8 px-3 rounded-md text-xs font-bold shadow-sm gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isVitals && onOpenVitalsTask ? 'Quick Complete' : 'Complete Task'}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              All nursing station tasks are up to date!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
