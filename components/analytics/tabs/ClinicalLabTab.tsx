'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  Microscope,
  Activity,
  CheckCircle2,
  Snowflake,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ClinicalLabTabProps {
  data: any;
  isLoading?: boolean;
}

export default function ClinicalLabTab({ data, isLoading }: ClinicalLabTabProps) {
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="loading-bar" />
      </div>
    );
  }

  const kpis = data?.lab_quality_indicators || {
    oocyte_retrieval_procedures: 0,
    fertilization_rate_pct: 0,
    blastocyst_formation_rate_pct: 0,
    cleavage_rate_pct: 0,
    clinical_pregnancy_rate_pct: 0,
    multiple_pregnancy_rate_pct: 0,
  };

  const census = data?.cycle_census || {
    total_cycles_initiated: 0,
    running_protocols: 0,
    completed_cycles: 0,
    cancelled_cycles: 0,
    completion_rate_pct: 0,
  };

  const cyclesByProtocol = data?.cycles_by_protocol || [];
  const cryo = data?.cryo_storage_inventory || {
    embryos_in_storage: 0,
    oocytes_in_storage: 0,
    semen_vials_in_storage: 0,
    active_storage_canisters: 0,
    tank_nitrogen_level_status: 'Active',
  };

  return (
    <div className="space-y-6 pt-3">
      {/* Vienna Consensus ART Quality Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Fertilization Rate (FR)</p>
              <h3 className="text-2xl font-bold font-mono text-indigo-900 mt-0.5">
                {kpis.fertilization_rate_pct}%
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Vienna Benchmark: &gt;75%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Microscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Blastocyst Rate (BR)</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-900 mt-0.5">
                {kpis.blastocyst_formation_rate_pct}%
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Day 5/6 embryo development</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-100 bg-gradient-to-br from-sky-50/30 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Clinical Pregnancy Rate</p>
              <h3 className="text-2xl font-bold font-mono text-sky-900 mt-0.5">
                {kpis.clinical_pregnancy_rate_pct}%
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Ultrasonic sac confirmation</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <HeartPulse className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 bg-gradient-to-br from-purple-50/30 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Embryo Cryo-Inventory</p>
              <h3 className="text-2xl font-bold font-mono text-purple-900 mt-0.5">
                {cryo.embryos_in_storage}
              </h3>
              <p className="text-[11px] text-purple-700 font-semibold mt-0.5">Vitrified & liquid nitrogen secured</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Snowflake className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Protocol Distribution & Cryo Tanks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Treatment Protocols Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  Active and completed fertility treatment procedures categorized by protocol
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold">
                Total: {census.total_cycles_initiated} Cycles
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-64">
            {cyclesByProtocol.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No treatment cycle protocols recorded for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cyclesByProtocol} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="protocol" type="category" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cryo Bank Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-sky-600" />
              Cryo Bank Tank Status
            </CardTitle>
            <CardDescription className="text-xs">
              Gamete & embryo tank telemetry
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Cryopreserved Embryos</span>
              <span className="text-sm font-bold font-mono text-slate-900">{cryo.embryos_in_storage}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Vitrified Oocytes</span>
              <span className="text-sm font-bold font-mono text-slate-900">{cryo.oocytes_in_storage}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-600">Cryo-Bank Semen Vials</span>
              <span className="text-sm font-bold font-mono text-slate-900">{cryo.semen_vials_in_storage}</span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Liquid Nitrogen
              </span>
              <span className="text-xs font-bold text-emerald-700">{cryo.tank_nitrogen_level_status}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

