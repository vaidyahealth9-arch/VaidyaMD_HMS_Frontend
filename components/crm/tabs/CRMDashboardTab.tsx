'use client';

import React from 'react';
import { Users, PhoneOutgoing, UserCheck, Clock, AlertTriangle, PieChart } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { CRMAnalytics } from '../types';

interface CRMDashboardTabProps {
  analytics: CRMAnalytics | null;
  isLoading: boolean;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-slate-400',
  interested: 'bg-emerald-500',
  follow_up: 'bg-amber-500',
  converted: 'bg-teal-600',
  lost: 'bg-rose-500',
  do_not_call: 'bg-rose-800',
};

export const CRMDashboardTab: React.FC<CRMDashboardTabProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="inline-block animate-spin mr-2">⏳</div>
        Loading analytics dashboard...
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Leads Ingested',
      value: analytics.total_leads,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Calls Placed Today',
      value: analytics.calls_made_today,
      icon: PhoneOutgoing,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Patient Conversions',
      value: analytics.conversions_total,
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Follow-ups Due Today',
      value: analytics.pending_follow_ups_today,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Overdue Follow-ups',
      value: analytics.overdue_follow_ups,
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overdue Alert Banner */}
      {analytics.overdue_follow_ups > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Action Required:</strong> You have{' '}
              <strong className="font-mono text-rose-700 underline">
                {analytics.overdue_follow_ups} overdue patient callbacks
              </strong>
              . Open the Dialer Queue or All Leads tab to contact them.
            </span>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-4 border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
                {kpi.value}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Breakdown Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Pipeline Funnel */}
        <Card className="p-5 border-slate-200 bg-white shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Pipeline Status Distribution
          </h3>
          <div className="space-y-3 text-xs">
            {Object.entries(analytics.status_breakdown).map(([status, count]) => {
              const pct = analytics.total_leads > 0 ? ((count / analytics.total_leads) * 100).toFixed(0) : '0';
              const barColor = STATUS_BAR_COLORS[status] || 'bg-primary';

              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                    <span className="font-semibold font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${barColor} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Source Distribution */}
        <Card className="p-5 border-slate-200 bg-white shadow-2xs">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Lead Acquisition Channels
          </h3>
          <div className="space-y-3 text-xs">
            {Object.entries(analytics.source_breakdown).map(([source, count]) => {
              const pct = analytics.total_leads > 0 ? ((count / analytics.total_leads) * 100).toFixed(0) : '0';
              return (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="capitalize font-medium">{source.replace('_', ' ')}</span>
                    <span className="font-semibold font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
