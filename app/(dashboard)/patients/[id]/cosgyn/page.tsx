'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cosgynApi, patientsApi } from '@/lib/api';
import CosgynScheduler from '@/components/cosgyn/CosgynScheduler';
import PageLayout from '@/components/common/PageLayout';
import PrintableCosGynScheduleModal from '@/components/common/PrintableCosGynScheduleModal';
import { Activity, Printer } from 'lucide-react';

export default function PatientCosGynTab({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const [printableScheduleData, setPrintableScheduleData] = useState<any>(null);

  const { data: patient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientsApi.get(patientId),
  });

  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['cosgyn', 'patient_plans', patientId],
    queryFn: () => cosgynApi.getPatientPlans(patientId),
  });

  return (
    <PageLayout className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
            Cosmetic Gynecology Plans
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage treatment plans and scheduled sessions</p>
        </div>
      </div>

      <CosgynScheduler patientId={patientId} onPlanCreated={refetch} />

      {/* Existing Plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Treatment History</h2>
        {isLoading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full" /></div>
        ) : plans?.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No treatment plans found for this patient.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {plans?.map((plan: any) => (
              <div key={plan.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800">{plan.treatment_name}</h3>
                    <p className="text-sm text-slate-500">Started on: {new Date(plan.start_date).toLocaleDateString()} &bull; Frequency: {plan.frequency.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="font-bold text-slate-900">₹{plan.total_amount.toLocaleString()}</div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.billed === 'true' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {plan.billed === 'true' ? 'Billed' : 'Unbilled'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintableScheduleData({
                          patient: { name: patient?.name || 'Patient', vid: patient?.vid || '—' },
                          packageName: plan.treatment_name,
                          packagePrice: plan.total_amount,
                          sessions: plan.sessions || [],
                        })}
                        className="flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition"
                        title="Print Treatment Schedule"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Schedule</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="pb-2 font-semibold">Date & Time</th>
                        <th className="pb-2 font-semibold">Equipment</th>
                        <th className="pb-2 font-semibold">Duration</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plan.sessions.map((session: any) => (
                        <tr key={session.id} className="text-slate-700">
                          <td className="py-2">{new Date(session.scheduled_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                          <td className="py-2 font-medium">{session.equipment}</td>
                          <td className="py-2">{session.duration_mins} min</td>
                          <td className="py-2 capitalize">{session.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {printableScheduleData && (
        <PrintableCosGynScheduleModal
          patient={printableScheduleData.patient}
          packageName={printableScheduleData.packageName}
          packagePrice={printableScheduleData.packagePrice}
          sessions={printableScheduleData.sessions}
          onClose={() => setPrintableScheduleData(null)}
        />
      )}
    </PageLayout>
  );
}
