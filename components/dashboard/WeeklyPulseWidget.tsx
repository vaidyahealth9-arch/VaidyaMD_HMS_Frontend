'use client';

import React from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  IndianRupee,
  CalendarCheck,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DailyPulseItem {
  date: string;
  short_day: string;
  label: string;
  appointments: number;
  completed: number;
  in_progress: number;
  new_patients: number;
  revenue_billed: number;
  revenue_collected: number;
}

interface HospitalPulseData {
  period_days: number;
  daily_pulse: DailyPulseItem[];
  summary: {
    period_appointments: number;
    period_completed: number;
    period_new_patients: number;
    period_billed: number;
    period_collected: number;
    collection_efficiency_pct: number;
    active_cycles_count: number;
    deltas: {
      appointments: string;
      patients: string;
      revenue: string;
    };
  };
}

interface WeeklyPulseWidgetProps {
  data: HospitalPulseData | null;
  isLoading?: boolean;
}

export default function WeeklyPulseWidget({ data, isLoading }: WeeklyPulseWidgetProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg p-6 bg-white border border-slate-200 shadow-sm animate-pulse space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-64">
          <div className="bg-slate-100 rounded-lg" />
          <div className="bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data || !data.daily_pulse || data.daily_pulse.length === 0) {
    return null;
  }

  const { daily_pulse, summary } = data;
  const isRevPositive = !summary.deltas.revenue.startsWith('-');
  const isApptPositive = !summary.deltas.appointments.startsWith('-');

  return (
    <div
      className="rounded-lg bg-white border border-slate-200 shadow-sm overflow-hidden"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              Weekly Hospital Pulse
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Past 7 Days
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Holistic activity combining patient consultation footfall with cash flow velocity
          </p>
        </div>

        <Link
          href="/dashboard/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors w-fit group"
        >
          <span>Deep Dive Analytics & AI Audit</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/50 border-b border-slate-100">
        <div className="p-3.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weekly Consultations</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold font-mono text-slate-900">{summary.period_appointments}</span>
            <span
              className={`text-[10px] font-bold flex items-center ${
                isApptPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isApptPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {summary.deltas.appointments}
            </span>
          </div>
        </div>

        <div className="p-3.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Registrations</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold font-mono text-slate-900">{summary.period_new_patients}</span>
            <span className="text-[10px] font-bold text-indigo-600">
              {summary.deltas.patients}
            </span>
          </div>
        </div>

        <div className="p-3.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">7-Day Billed Volume</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold font-mono text-slate-900">
              ₹{summary.period_billed.toLocaleString()}
            </span>
            <span
              className={`text-[10px] font-bold flex items-center ${
                isRevPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isRevPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {summary.deltas.revenue}
            </span>
          </div>
        </div>

        <div className="p-3.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collection Efficiency</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold font-mono text-emerald-700">
              {summary.collection_efficiency_pct}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              (₹{summary.period_collected.toLocaleString()} rec.)
            </span>
          </div>
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Appointments & Footfall */}
        <div className="rounded-lg p-3 bg-white border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
              Patient Footfall & Completed Consultations
            </span>
            <span className="text-[11px] font-mono text-slate-400">Total: {summary.period_appointments}</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_pulse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="short_day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as DailyPulseItem;
                      return (
                        <div className="rounded-lg bg-slate-900 text-white p-2.5 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{item.label}</p>
                          <p className="text-indigo-300">Appointments: <span className="font-mono font-bold text-white">{item.appointments}</span></p>
                          <p className="text-emerald-300">Completed: <span className="font-mono font-bold text-white">{item.completed}</span></p>
                          <p className="text-sky-300">New Patients: <span className="font-mono font-bold text-white">{item.new_patients}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="appointments" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Appointments" maxBarSize={32} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue vs Collections */}
        <div className="rounded-lg p-3 bg-white border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Cash Flow: Billed vs. Collected
            </span>
            <span className="text-[11px] font-mono text-emerald-600 font-semibold">
              Eff: {summary.collection_efficiency_pct}%
            </span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_pulse} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="short_day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as DailyPulseItem;
                      return (
                        <div className="rounded-lg bg-slate-900 text-white p-2.5 shadow-lg text-xs space-y-1">
                          <p className="font-semibold text-slate-200">{item.label}</p>
                          <p className="text-indigo-300">Billed: <span className="font-mono font-bold text-white">{formatCurrency(item.revenue_billed)}</span></p>
                          <p className="text-emerald-300">Collected: <span className="font-mono font-bold text-white">{formatCurrency(item.revenue_collected)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="revenue_billed" stroke="#4f46e5" strokeWidth={2} fill="url(#billedGrad)" name="Billed" />
                <Area type="monotone" dataKey="revenue_collected" stroke="#10b981" strokeWidth={2} fill="url(#colGrad)" name="Collected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

