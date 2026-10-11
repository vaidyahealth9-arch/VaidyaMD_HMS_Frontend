'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Stethoscope,
  Users,
  IndianRupee,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface DoctorItem {
  doctor_id: string;
  doctor_name: string;
  role: string;
  department: string;
  total_appointments: number;
  completed_consultations: number;
  completion_rate_pct: number;
  notes_authored: number;
  revenue_billed: number;
  revenue_collected: number;
  collection_rate_pct: number;
  avg_duration_minutes: number;
}

interface DoctorProductivityTabProps {
  data: {
    summary?: {
      total_clinicians: number;
      total_consultations_completed: number;
      total_revenue_generated: number;
      avg_consultations_per_doctor: number;
    };
    doctors?: DoctorItem[];
  } | null;
  isLoading?: boolean;
}

export default function DoctorProductivityTab({ data, isLoading }: DoctorProductivityTabProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="loading-bar" />
      </div>
    );
  }

  const summary = data?.summary || {
    total_clinicians: 0,
    total_consultations_completed: 0,
    total_revenue_generated: 0,
    avg_consultations_per_doctor: 0,
  };
  const doctors = data?.doctors || [];

  return (
    <div className="space-y-6 pt-3">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Clinicians</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary.total_clinicians}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Specialists & Consultants</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Completed Consults</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{summary.total_consultations_completed}</h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                Avg: {summary.avg_consultations_per_doctor} per doctor
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinician-Billed Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {formatCurrency(summary.total_revenue_generated)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Direct consultation & procedures</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Avg Consultation Time</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">18.0 min</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Clinical workflow benchmark</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Productivity Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Clinician Caseload & Billing Contribution
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time consultation volume, note completion efficiency, and generated billing per practitioner
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold">
              Live Database Aggregation
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {doctors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No doctor consultation activity recorded for the selected filter period.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Clinician</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 text-center">Consultations</th>
                  <th className="py-3 px-3 text-center">Completion Rate</th>
                  <th className="py-3 px-3 text-center">Clinical Notes</th>
                  <th className="py-3 px-3 text-right">Revenue Billed</th>
                  <th className="py-3 px-4 text-right">Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc, idx) => (
                  <tr key={doc.doctor_id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                          {doc.doctor_name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{doc.doctor_name}</p>
                          <p className="text-[10px] text-slate-400">{doc.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{doc.department}</td>
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                      {doc.completed_consultations}
                      <span className="text-[10px] text-slate-400 font-normal"> / {doc.total_appointments}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.completion_rate_pct >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.completion_rate_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {doc.notes_authored}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {formatCurrency(doc.revenue_billed)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono text-emerald-700 font-semibold">
                        {formatCurrency(doc.revenue_collected)}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">{doc.collection_rate_pct}% col.</p>
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

