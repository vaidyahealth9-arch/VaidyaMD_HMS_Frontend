'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatCurrency } from '@/lib/utils';
import {
  Pill,
  FlaskConical,
  AlertTriangle,
  Clock,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';

interface PharmacyLabTabProps {
  data: any;
  isLoading?: boolean;
}

export default function PharmacyLabTab({ data, isLoading }: PharmacyLabTabProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="loading-bar" />
      </div>
    );
  }

  const pharma = data?.pharmacy || {
    total_items_dispensed: 0,
    low_stock_batch_alerts: 0,
    pending_procurement_indents: 0,
    total_purchase_value: 0,
    total_retail_value: 0,
    total_sales_revenue: 0,
    inventory_batches_count: 0,
    top_dispensed: [],
  };

  const lab = data?.laboratory || {
    total_diagnostic_tests_run: 0,
    average_turnaround_time_hours: 0,
    sample_rejection_rate_pct: 0,
    tests_breakdown: [],
  };

  return (
    <div className="space-y-6 pt-3">
      {/* Pharmacy Procurement & Financial Valuation KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent to Purchase Stock */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventory Purchase Cost</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {formatCurrency(pharma.total_purchase_value)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Across {pharma.inventory_batches_count} active batches
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Current Retail Inventory Valuation */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Retail Stock Valuation</p>
              <h3 className="text-2xl font-bold font-mono text-indigo-700 mt-0.5">
                {formatCurrency(pharma.total_retail_value)}
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                Potential gross dispensary value
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <PackageCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Real Cashier Pharmacy Sales */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pharmacy Sales Revenue</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                {formatCurrency(pharma.total_sales_revenue)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Collected from billed Rx invoices
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Pill className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Stockout Risk & Indents */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stockout Risk Batches</p>
              <h3 className="text-2xl font-bold font-mono text-amber-600 mt-0.5">
                {pharma.low_stock_batch_alerts}
              </h3>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                {pharma.pending_procurement_indents} indents pending
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostic & Laboratory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnostics Processed</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {lab.total_diagnostic_tests_run}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                Rejection rate: {lab.sample_rejection_rate_pct}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Diagnostic Turnaround (TAT)</p>
              <h3 className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                {lab.average_turnaround_time_hours} Hours
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">LIS analyzer auto-sync</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables: Top Dispensed & Diagnostic Tests Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pharmaceuticals */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-600" />
                  High-Velocity Medications
                </CardTitle>
                <CardDescription className="text-xs">
                  Top prescribed hormone protocols & therapeutics
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {pharma.top_dispensed.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No pharmacy dispensing records found.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Medication / Molecule</th>
                    <th className="py-2.5 px-3 text-center">Dispensed</th>
                    <th className="py-2.5 px-3 text-center">Remaining</th>
                    <th className="py-2.5 px-4 text-right">Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharma.top_dispensed.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4">
                        <p className="font-semibold text-slate-800">{item.medication}</p>
                        <p className="text-[10px] text-slate-400">{item.category}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                        {item.units_dispensed}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                        {item.in_stock}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(item.total_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Diagnostic Laboratory Metrics */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-indigo-600" />
                  Diagnostic Test Turnaround & Volumes
                </CardTitle>
                <CardDescription className="text-xs">
                  Average TAT and abnormal pathology rates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {lab.tests_breakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No diagnostic test records found.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-2.5 px-4">Test Profile</th>
                    <th className="py-2.5 px-3 text-center">Volume</th>
                    <th className="py-2.5 px-3 text-center">Avg TAT</th>
                    <th className="py-2.5 px-4 text-right">Abnormal %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lab.tests_breakdown.map((t: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{t.test_name}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-indigo-600">{t.tests_run}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600">{t.avg_tat_hours} hrs</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-700">{t.abnormal_flag_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

