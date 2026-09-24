'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Zap, Activity, Sparkles, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PackageCatalogTabProps {
  treatments: any[];
  onOpenBookingModal: (treatmentId: string) => void;
}

export default function PackageCatalogTab({
  treatments,
  onOpenBookingModal,
}: PackageCatalogTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {treatments.map((treatment: any) => (
        <Card
          key={treatment.id}
          className="border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col justify-between"
        >
          <CardHeader className="p-5 pb-3">
            <div className="flex justify-between items-start gap-2">
              <Badge variant="purple" className="text-[10px] font-bold uppercase tracking-wider">
                {treatment.package_combo || 'Specialty Protocol'}
              </Badge>
              <span className="text-base font-extrabold text-pink-700 font-mono">
                {formatCurrency(treatment.price)}
              </span>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2">{treatment.name}</CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Comprehensive multi-session regenerative protocol with automated scheduling
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            <div className="p-3 bg-pink-50/60 rounded-lg border border-pink-100 space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Jet Plasma
                </span>
                <span className="font-bold text-slate-900">
                  {treatment.jet_plasma_sessions} sessions ({treatment.jet_plasma_duration_mins}m ea)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  Tesla Chair
                </span>
                <span className="font-bold text-slate-900">
                  {treatment.tesla_chair_sessions} sessions ({treatment.tesla_chair_duration_mins}m ea)
                </span>
              </div>
              {treatment.prp_sessions > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    PRP Therapy
                  </span>
                  <span className="font-bold text-slate-900">{treatment.prp_sessions} sessions</span>
                </div>
              )}
            </div>
          </CardContent>
          <div className="p-5 pt-0">
            <Button
              onClick={() => onOpenBookingModal(treatment.id)}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold h-9 text-xs rounded-md shadow-xs gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book &amp; Schedule Package</span>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
