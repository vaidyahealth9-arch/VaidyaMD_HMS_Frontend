'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cosgynApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Calendar, Stethoscope, Clock, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export default function CosgynScheduler({ patientId, onPlanCreated }: { patientId: string, onPlanCreated: () => void }) {
  const { toast } = useToast();
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState<string>('weekly');

  const { data: treatments = [], isLoading: loadingTreatments } = useQuery({
    queryKey: ['cosgyn', 'treatments'],
    queryFn: cosgynApi.getTreatments,
  });

  const createPlanMutation = useMutation({
    mutationFn: (data: any) => cosgynApi.createPlan(data),
    onSuccess: () => {
      toast.success('Treatment plan and schedule generated successfully.');
      onPlanCreated();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message || 'Failed to create plan'}`);
    }
  });

  const handleGenerate = () => {
    if (!selectedTreatmentId || !startDate) {
      toast.error('Validation Error: Please select a treatment and start date.');
      return;
    }
    
    createPlanMutation.mutate({
      patient_id: patientId,
      treatment_id: selectedTreatmentId,
      start_date: startDate,
      frequency: frequency
    });
  };

  const selectedTreatment = treatments.find((t: any) => t.id === selectedTreatmentId);

  return (
    <Card className="border-slate-200 shadow-sm rounded-lg overflow-hidden">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
          Create New Treatment Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-slate-700 font-bold">Select Condition / Treatment</Label>
            <Select value={selectedTreatmentId} onValueChange={setSelectedTreatmentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select treatment protocol" />
              </SelectTrigger>
              <SelectContent>
                {treatments.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-bold">Start Date</Label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700 font-bold">Session Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="twice_weekly">Twice a Week</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="fortnightly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedTreatment && (
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200 flex gap-6">
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Equipment Summary</div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Zap className="w-4 h-4" /> Jet Plasma: {selectedTreatment.jet_plasma_sessions} sessions
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Clock className="w-4 h-4" /> Jet Plasma Duration: {selectedTreatment.jet_plasma_duration_mins} mins
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">&nbsp;</div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Zap className="w-4 h-4" /> Tesla Chair: {selectedTreatment.tesla_chair_sessions} sessions
              </div>
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                <Clock className="w-4 h-4" /> Tesla Chair Duration: {selectedTreatment.tesla_chair_duration_mins} mins
              </div>
            </div>
            <div className="flex-none flex items-center justify-center border-l border-slate-200 pl-6">
              <div className="text-center">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Package Price</div>
                <div className="text-2xl font-bold text-[rgb(var(--clr-primary))]">₹{selectedTreatment.price.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

      </CardContent>
      <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-4 flex justify-end">
        <Button 
          onClick={handleGenerate} 
          disabled={!selectedTreatmentId || createPlanMutation.isPending}
          className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold px-6 rounded-md shadow-sm"
        >
          {createPlanMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
          Generate Schedule
        </Button>
      </CardFooter>
    </Card>
  );
}
