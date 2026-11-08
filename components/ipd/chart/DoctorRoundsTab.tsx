'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Stethoscope } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatDateTime } from '@/lib/utils';
import type { RoundNote } from '@/features/ipd/types';

interface DoctorRoundsTabProps {
  admissionId: string;
  roundNotes: RoundNote[];
  onNoteAdded: () => void;
}

export default function DoctorRoundsTab({
  admissionId,
  roundNotes,
  onNoteAdded,
}: DoctorRoundsTabProps) {
  const [isAddingRoundNote, setIsAddingRoundNote] = useState(false);
  const [soapSubjective, setSoapSubjective] = useState('');
  const [soapObjective, setSoapObjective] = useState('');
  const [soapAssessment, setSoapAssessment] = useState('');
  const [soapPlan, setSoapPlan] = useState('');

  const roundNoteMutation = useMutation({
    mutationFn: (data: any) => ipdApi.createRoundNote(admissionId, data),
    onSuccess: () => {
      toast.success('Round Note Documented', 'Doctor progress note recorded.');
      setIsAddingRoundNote(false);
      setSoapSubjective('');
      setSoapObjective('');
      setSoapAssessment('');
      setSoapPlan('');
      onNoteAdded();
    },
    onError: (err: any) => toast.error('Error', err?.message),
  });

  return (
    <Card className="border-slate-200 shadow-2xs">
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-slate-900">Physician Daily Progress Notes</CardTitle>
          <p className="text-xs text-slate-500">Document morning and evening clinical rounds in SOAP format</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddingRoundNote(!isAddingRoundNote)}
          className="h-8 text-xs font-bold gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingRoundNote ? 'Cancel' : 'Add Round Note'}</span>
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {isAddingRoundNote && (
          <div className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-lg space-y-3">
            <span className="font-bold text-indigo-950 block text-xs">New Inpatient Progress Note</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Subjective (Symptoms / Complaints / Patient Feedback)
                </label>
                <textarea
                  rows={3}
                  value={soapSubjective}
                  onChange={(e) => setSoapSubjective(e.target.value)}
                  placeholder="e.g. Patient reports pain reduced to 2/10, slept well, tolerating oral fluids without nausea..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Objective (Bedside Examination / Vitals / Surgical Site)
                </label>
                <textarea
                  rows={3}
                  value={soapObjective}
                  onChange={(e) => setSoapObjective(e.target.value)}
                  placeholder="e.g. Afebrile, BP 120/80, Chest clear bilaterally, Abdomen soft, non-tender, dressing clean & dry..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Assessment (Clinical Impression / Diagnosis)
                </label>
                <textarea
                  rows={2}
                  value={soapAssessment}
                  onChange={(e) => setSoapAssessment(e.target.value)}
                  placeholder="e.g. Post-operative Day 2, clinical course resolving favorably"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Plan (Treatment / Orders / Planned Discharge)
                </label>
                <textarea
                  rows={2}
                  value={soapPlan}
                  onChange={(e) => setSoapPlan(e.target.value)}
                  placeholder="e.g. Step down IV antibiotics to oral, encourage full ambulation, discharge tomorrow morning"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsAddingRoundNote(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  roundNoteMutation.mutate({
                    subjective: soapSubjective,
                    objective: soapObjective,
                    assessment: soapAssessment,
                    plan: soapPlan,
                  })
                }
                disabled={roundNoteMutation.isPending}
                className="bg-indigo-600 text-white font-bold"
              >
                {roundNoteMutation.isPending ? 'Saving...' : 'Sign & Document Note'}
              </Button>
            </div>
          </div>
        )}

        {/* Past Round Notes List */}
        {roundNotes && roundNotes.length > 0 ? (
          <div className="space-y-3">
            {roundNotes.map((rn) => (
              <div key={rn.id} className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">Dr. {rn.doctor_name || 'Attending Physician'}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDateTime(rn.round_time)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {rn.subjective && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="font-bold text-indigo-900 block uppercase text-[10px]">Subjective</span>
                      <p className="text-slate-700 mt-0.5">{rn.subjective}</p>
                    </div>
                  )}
                  {rn.objective && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="font-bold text-indigo-900 block uppercase text-[10px]">Objective</span>
                      <p className="text-slate-700 mt-0.5">{rn.objective}</p>
                    </div>
                  )}
                  {rn.assessment && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="font-bold text-indigo-900 block uppercase text-[10px]">Assessment</span>
                      <p className="text-slate-700 mt-0.5">{rn.assessment}</p>
                    </div>
                  )}
                  {rn.plan && (
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="font-bold text-indigo-900 block uppercase text-[10px]">Plan</span>
                      <p className="text-slate-700 mt-0.5">{rn.plan}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Stethoscope}
            title="No progress notes recorded yet"
            subtitle="Document the patient's daily clinical rounds in SOAP format."
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
