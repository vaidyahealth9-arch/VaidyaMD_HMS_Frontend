'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Activity, Calendar, PlusCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cosgynApi } from '@/lib/api';
import Link from 'next/link';

export default function CosGynDashboard() {
  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ['cosgyn', 'treatments'],
    queryFn: cosgynApi.getTreatments,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[rgb(var(--clr-primary))]" />
            Cosmetic Gynecology
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Manage Jet Plasma and Tesla Chair equipment schedules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Stats / Available Treatments */}
        <Card className="border-slate-100 shadow-sm  rounded-lg overflow-hidden">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-800">Available Treatment Packages</CardTitle>
            <CardDescription>Pre-configured packages based on protocols</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-6 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full" /></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {treatments.map((t: any) => (
                    <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">{t.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Jet Plasma: {t.jet_plasma_sessions}x ({t.jet_plasma_duration_mins}m) &bull; Tesla Chair: {t.tesla_chair_sessions}x ({t.tesla_chair_duration_mins}m)
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[rgb(var(--clr-primary))]">₹{t.price.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Global Schedule Preview (Placeholder for Calendar) */}
        <Card className="border-slate-100 shadow-sm  rounded-lg">
          <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Today's Schedule</CardTitle>
              <CardDescription>Upcoming equipment sessions</CardDescription>
            </div>
            <Calendar className="w-5 h-5 text-slate-400" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center text-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Calendar className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No sessions scheduled for today</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                To schedule a new session, go to a patient's profile and create a Cosmetic Gynae Plan.
              </p>
              <Link href="/patients" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] text-sm font-semibold rounded-md hover:bg-[rgb(var(--clr-primary)/0.12)] transition-colors">
                <Users className="w-4 h-4" />
                Go to Patients
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Keep standard Users icon for the empty state link
import { Users } from 'lucide-react';
