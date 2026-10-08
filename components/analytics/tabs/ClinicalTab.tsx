'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { MapPin } from 'lucide-react';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

interface ClinicalTabProps {
  cycleSummary: {
    total_cycles: number;
    running: number;
    completed: number;
    completion_rate_pct: number;
    cancelled: number;
  };
  cyclesByType: Record<string, number>;
  cityData: any[];
}

export default function ClinicalTab({
  cycleSummary,
  cyclesByType,
  cityData,
}: ClinicalTabProps) {
  return (
    <div className="space-y-6 pt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Treatment Cycles</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{cycleSummary.total_cycles}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">IVF, ICSI, FET &amp; IUI protocols</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Active Running Cycles</p>
            <h3 className="text-2xl font-bold text-blue-800 mt-0.5">{cycleSummary.running}</h3>
            <p className="text-[11px] text-blue-600 mt-0.5">Under stimulation or lab culture</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase">Completed Cycles</p>
            <h3 className="text-2xl font-bold text-emerald-800 mt-0.5">{cycleSummary.completed}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5">{cycleSummary.completion_rate_pct}% completion rate</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase">Cancelled Cycles</p>
            <h3 className="text-2xl font-bold text-amber-800 mt-0.5">{cycleSummary.cancelled}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5">Poor response / medical halt</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Protocol Distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Cycle Breakdown by Treatment Protocol
            </CardTitle>
            <CardDescription className="text-xs">
              Relative proportion of active &amp; historical fertility treatment pathways
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {Object.keys(cyclesByType).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No clinical treatment cycles recorded yet.
              </div>
            ) : (
              Object.entries(cyclesByType).map(([proto, count]: any, idx: number) => {
                const pct = Math.round((count / (cycleSummary.total_cycles || 1)) * 100);
                return (
                  <div key={proto} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800 uppercase">{proto}</span>
                      <span className="text-slate-500 font-mono">
                        {count} cycles ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Patient Demographics by City / Area
                </CardTitle>
                <CardDescription className="text-xs">
                  Geographical catchment zone and lead source density
                </CardDescription>
              </div>
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {cityData.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No geographical catchment data recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {cityData.slice(0, 6).map((city: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 text-xs"
                  >
                    <span className="font-semibold text-slate-800">{city.area || 'City Area'}</span>
                    <Badge variant="outline" className="font-mono text-slate-600">
                      {city.patient_count} patients
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
