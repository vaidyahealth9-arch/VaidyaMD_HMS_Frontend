'use client';

import { formatDateTime } from '@/lib/utils';
import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Activity,
  Search,
  ClipboardList,
  Pill,
  HeartPulse,
  CalendarClock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import EmptyState from '@/components/common/EmptyState';

interface NursingTabProps {
  nursingTasks: any[];
  onCompleteTask: (taskId: string) => void;
  onOpenVitalsTask?: (task: any) => void;
  onRescheduleTask?: (task: any) => void;
  isCompleting?: boolean;
}

export default function NursingTab({
  nursingTasks,
  onCompleteTask,
  onOpenVitalsTask,
  onRescheduleTask,
  isCompleting = false,
}: NursingTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'vitals' | 'meds' | 'care'>('all');

  const filteredTasks = useMemo(() => {
    return nursingTasks.filter((t: any) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.patient_name?.toLowerCase().includes(q) ||
        t.bed_number?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.task_type?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const typeLower = (t.task_type || '').toLowerCase();
      if (filterType === 'vitals') return typeLower.includes('vital');
      if (filterType === 'meds') return typeLower.includes('med') || typeLower.includes('infusion');
      if (filterType === 'care') return !typeLower.includes('vital') && !typeLower.includes('med');
      return true;
    });
  }, [nursingTasks, searchQuery, filterType]);

  const vitalsCount = useMemo(
    () => nursingTasks.filter((t: any) => (t.task_type || '').toLowerCase().includes('vital')).length,
    [nursingTasks]
  );
  const medsCount = useMemo(
    () =>
      nursingTasks.filter(
        (t: any) =>
          (t.task_type || '').toLowerCase().includes('med') ||
          (t.task_type || '').toLowerCase().includes('infusion')
      ).length,
    [nursingTasks]
  );

  return (
    <div className="space-y-4 pt-2">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by bed, patient, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tasks ({nursingTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('vitals')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'vitals'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Vitals ({vitalsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('meds')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              filterType === 'meds'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medications ({medsCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('care')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              filterType === 'care'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            General Care
          </button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>Pending Inpatient Nursing Orders & Checklists</span>
            </CardTitle>
            <p className="text-xs text-slate-500">
              Scheduled vitals flowsheets, IV infusions, wound dressings, and eMAR checklists
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {filteredTasks.length} Pending
          </Badge>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-slate-100">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((t: any) => {
              const isVitals = (t.task_type || '').toLowerCase().includes('vital');
              return (
                <div
                  key={t.id}
                  className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 -mx-4 px-4 rounded transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="purple" className="text-[10px] font-bold">
                        Bed: {t.bed_number || '—'}
                      </Badge>
                      <span className="font-bold text-slate-900 text-sm">{t.patient_name}</span>
                      <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
                        {t.task_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">{t.description}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        Freq: {t.frequency || 'Once'} · Scheduled: {formatDateTime(t.scheduled_time)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Reschedule Button */}
                    {isVitals && onRescheduleTask && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRescheduleTask(t)}
                        className="h-8 px-2.5 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-100 shadow-2xs gap-1"
                        title="Change vital frequency or check time"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                        <span>Reschedule</span>
                      </Button>
                    )}

                    {/* Log Vitals Button */}
                    {isVitals && onOpenVitalsTask && (
                      <Button
                        size="sm"
                        onClick={() => onOpenVitalsTask(t)}
                        className="h-8 px-3 rounded-md text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Log Vitals</span>
                      </Button>
                    )}

                    {/* Complete Task Button */}
                    <Button
                      size="sm"
                      onClick={() => onCompleteTask(t.id)}
                      disabled={isCompleting}
                      variant={isVitals && onOpenVitalsTask ? 'outline' : 'default'}
                      className="h-8 px-3 rounded-md text-xs font-bold shadow-xs gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isVitals && onOpenVitalsTask ? 'Quick Complete' : 'Complete Task'}</span>
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={searchQuery ? 'No Matching Nursing Tasks' : 'All Nursing Station Tasks Up to Date!'}
              subtitle={
                searchQuery
                  ? 'No pending nursing tasks match your search query.'
                  : 'All scheduled inpatient orders, vitals checks, and medication checklists have been administered.'
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
