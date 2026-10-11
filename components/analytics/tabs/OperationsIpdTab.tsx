'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  Bed,
  CheckCircle,
  Clock,
  Layers,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface OperationsIpdTabProps {
  data: any;
  isLoading?: boolean;
}

export default function OperationsIpdTab({ data, isLoading }: OperationsIpdTabProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="loading-bar" />
      </div>
    );
  }

  const summary = data?.summary || {
    total_beds: 0,
    occupied_beds: 0,
    vacant_beds: 0,
    maintenance_beds: 0,
    bed_occupancy_rate_pct: 0,
    average_length_of_stay_days: 0,
    turnover_interval_hours: 0,
  };

  const wards = data?.ward_breakdown || [];

  return (
    <div className="space-y-6 pt-3">
      {/* IPD KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bed Occupancy Rate (BOR)</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {summary.bed_occupancy_rate_pct}%
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.occupied_beds} occupied of {summary.total_beds} beds
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Bed className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vacant Beds Available</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                {summary.vacant_beds}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Ready for immediate intake</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Length of Stay (ALOS)</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {summary.average_length_of_stay_days} Days
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Surgical & post-procedure recovery</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Turnover Interval</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {summary.turnover_interval_hours} Hours
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Housekeeping & sanitization cycle</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Breakdown Table & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Ward-Wise Bed Utilization
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed distribution across ICU, Recovery, and Inpatient units
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Live Census
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {wards.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No ward or bed occupancy records found.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Ward / Inpatient Section</th>
                    <th className="py-3 px-3 text-center">Total Beds</th>
                    <th className="py-3 px-3 text-center">Occupied</th>
                    <th className="py-3 px-3 text-center">Available</th>
                    <th className="py-3 px-4 text-right">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {wards.map((w: any, idx: number) => (
                    <tr key={w.ward_name || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{w.ward_name}</td>
                      <td className="py-3 px-3 text-center font-mono">{w.total_beds}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-indigo-600">{w.occupied_beds}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-emerald-600">{w.vacant_beds}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-slate-800">{w.occupancy_rate_pct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Visual Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Occupancy Comparison
            </CardTitle>
            <CardDescription className="text-xs">
              Capacity comparison by department
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 h-64">
            {wards.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No ward data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wards} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="ward_name" tick={false} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="occupied_beds" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Occupied" />
                  <Bar dataKey="vacant_beds" fill="#10b981" radius={[4, 4, 0, 0]} name="Vacant" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

