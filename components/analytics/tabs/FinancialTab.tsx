'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

interface FinancialTabProps {
  monthlyData: any[];
  deptPieData: any[];
  doctorBreakdown: any[];
}

export default function FinancialTab({
  monthlyData,
  deptPieData,
  doctorBreakdown,
}: FinancialTabProps) {
  return (
    <div className="space-y-6 pt-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Monthly Revenue Trajectory (Past 6 Months)
                </CardTitle>
                <CardDescription className="text-xs">
                  Chronological billing trajectory aggregated directly from cashier invoices
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Real Invoices
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-72">
            {monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly records available for selected timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    labelFormatter={(lbl, p) => `${lbl} ${p?.[0]?.payload?.year || ''}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Total Billed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown Donut */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Revenue by Care Stream
            </CardTitle>
            <CardDescription className="text-xs">
              Partitioned across OPD, IVF, Pharmacy, IPD &amp; Lab
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-48">
              {deptPieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department collections found.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {deptPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Billed']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="space-y-1.5 mt-2 border-t border-slate-100 pt-2 text-xs">
              {deptPieData.map((d, idx) => (
                <div key={d.name} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(d.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clinician Billing & Productivity Performance */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Clinician Billing &amp; Productivity Performance
              </CardTitle>
              <CardDescription className="text-xs">
                Revenue generated per treating doctor across consultations, treatments, and procedures
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {doctorBreakdown.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No clinician performance data recorded for this period.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Treating Consultant</th>
                  <th className="p-3.5">Invoices Generated</th>
                  <th className="p-3.5">Gross Billed</th>
                  <th className="p-3.5">Cash Collected</th>
                  <th className="p-3.5 text-right">Avg Revenue / Patient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {doctorBreakdown.map((doc: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">Dr. {doc.doctor_name}</td>
                    <td className="p-3.5 text-slate-600 font-mono">{doc.invoices_count}</td>
                    <td className="p-3.5 text-slate-900 font-bold">{formatCurrency(doc.total_billed)}</td>
                    <td className="p-3.5 text-emerald-700 font-bold">
                      {formatCurrency(doc.total_collected)}
                    </td>
                    <td className="p-3.5 text-right text-slate-600 font-mono">
                      {formatCurrency(doc.avg_per_patient)}
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
