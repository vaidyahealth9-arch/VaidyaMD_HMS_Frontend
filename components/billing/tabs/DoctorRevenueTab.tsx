'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/features/billing/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import {
  Stethoscope,
  Pill,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Users,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DoctorRevenueTab() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['doctor-revenue-report', startDate, endDate],
    queryFn: () => billingApi.getDoctorRevenueReport({
      start_date: startDate ? `${startDate}T00:00:00` : undefined,
      end_date: endDate ? `${endDate}T23:59:59` : undefined,
    }),
  });

  const doctorsList: any[] = reportData?.doctors || [];

  const filteredDoctors = doctorsList.filter((doc) =>
    (doc.doctor_name || '').toLowerCase().includes(doctorSearch.toLowerCase())
  );

  const totalConsultationRev = filteredDoctors.reduce((acc, d) => acc + (d.consultation_revenue || 0), 0);
  const totalProcedureRev = filteredDoctors.reduce((acc, d) => acc + (d.procedure_revenue || 0), 0);
  const totalPharmacyRev = filteredDoctors.reduce((acc, d) => acc + (d.pharmacy_sales || 0), 0);
  const grandTotalRev = filteredDoctors.reduce((acc, d) => acc + (d.total_revenue || 0), 0);

  const handleExportCsv = () => {
    if (filteredDoctors.length === 0) return;
    const headers = ['Doctor Name', 'Consultation Revenue (INR)', 'Procedure Revenue (INR)', 'Pharmacy Sales (INR)', 'Total Revenue (INR)', 'Invoices Count', 'Pharmacy Orders Count'];
    const rows = filteredDoctors.map(d => [
      `"${d.doctor_name}"`,
      d.consultation_revenue,
      d.procedure_revenue,
      d.pharmacy_sales,
      d.total_revenue,
      d.invoices_count,
      d.pharmacy_invoices_count
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Doctor_Revenue_Settlement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">Date Range:</span>
          </div>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 text-xs w-36 bg-slate-50"
            placeholder="From Date"
          />
          <span className="text-slate-400 text-xs">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 text-xs w-36 bg-slate-50"
            placeholder="To Date"
          />
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="h-8 text-xs text-rose-600 hover:bg-rose-50"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            className="h-8 text-xs px-2.5 rounded-md border border-slate-300 bg-slate-50 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Staff &amp; Consulting Doctors ({doctorsList.length})</option>
            {doctorsList.map((d: any) => (
              <option key={d.doctor_key || d.doctor_id || d.doctor_name} value={d.doctor_name}>
                {d.doctor_name} {d.specialization ? `(${d.specialization})` : ''}
              </option>
            ))}
          </select>
          <Input
            type="text"
            placeholder="Search doctor..."
            value={doctorSearch}
            onChange={(e) => setDoctorSearch(e.target.value)}
            className="h-8 text-xs w-40 bg-slate-50"
          />
          <Button
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredDoctors.length === 0}
            className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel/CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-sky-100 bg-sky-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Consultation Revenue</span>
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-sky-950 mt-2">₹{totalConsultationRev.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-sky-600 mt-0.5">OPD consult fees collected</p>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-purple-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Procedure / IPD Revenue</span>
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-purple-950 mt-2">₹{totalProcedureRev.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-purple-600 mt-0.5">Surgeries, ART &amp; IPD admissions</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Linked Pharmacy Sales</span>
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-emerald-950 mt-2">₹{totalPharmacyRev.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Prescription dispensing value</p>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Grand Total Revenue</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-xl font-bold font-mono text-indigo-950 mt-2">₹{grandTotalRev.toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-indigo-600 mt-0.5">Across {filteredDoctors.length} doctors</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Breakdown Table */}
      <Card className="overflow-hidden shadow-2xs">
        <CardHeader className="py-3 px-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <CardTitle className="text-sm font-bold text-slate-800">
              Doctor Performance &amp; Revenue Share Breakdown
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {filteredDoctors.length} Doctors Tracked
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading doctor revenue analytics...
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No doctor revenue records found for the selected timeframe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4 text-right">Consultations Fee</th>
                    <th className="py-3 px-4 text-right">Procedure Revenue</th>
                    <th className="py-3 px-4 text-right">Linked Pharmacy Sales</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-center">Invoices</th>
                    <th className="py-3 px-4 text-center">Pharmacy Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map((doc, idx) => (
                    <tr key={doc.doctor_key || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-[11px]">
                          {doc.doctor_name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.doctor_name}</p>
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            {doc.specialization || 'Consulting Specialist'}
                            {doc.qualification ? ` · ${doc.qualification}` : ''}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                        ₹{doc.consultation_revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                        ₹{doc.procedure_revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{doc.pharmacy_sales.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sky-900 text-sm">
                        ₹{doc.total_revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {doc.invoices_count}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                        {doc.pharmacy_invoices_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
