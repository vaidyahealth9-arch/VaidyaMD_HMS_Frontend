'use client';

import React from 'react';
import { Users, PhoneOutgoing, UserCheck, Clock, AlertTriangle, PieChart } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { CRMAnalytics } from '../types';

interface CRMDashboardTabProps {
  analytics: CRMAnalytics | null;
  isLoading: boolean;
}

export const CRMDashboardTab: React.FC<CRMDashboardTabProps> = ({ analytics, isLoading }) => {
  if (isLoading || !analytics) {
    return (
      <div className="p-12 text-center text-slate-400">
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
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="p-4 border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
        <Card className="p-5 border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Pipeline Status Distribution
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.status_breakdown).map(([status, count]) => {
              const pct = analytics.total_leads > 0 ? ((count / analytics.total_leads) * 100).toFixed(0) : '0';
              return (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Source Distribution */}
        <Card className="p-5 border-slate-200 bg-white">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Lead Acquisition Channels
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(analytics.source_breakdown).map(([source, count]) => {
              const pct = analytics.total_leads > 0 ? ((count / analytics.total_leads) * 100).toFixed(0) : '0';
              return (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between text-slate-700">
                    <span className="capitalize">{source.replace('_', ' ')}</span>
                    <span className="font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
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
