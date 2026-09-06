'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api';
import OPDWorkbench from '@/components/opd/OPDWorkbench';
import { User, Activity, Clock, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function OPDPage() {
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getWaitTimeDetails = (scheduledAt: string) => {
    const diff = Math.floor((now.getTime() - new Date(scheduledAt).getTime()) / 60000);
    if (diff < 0) return { text: `In ${-diff}m`, color: 'text-slate-500 bg-slate-50 border-slate-200' };
    if (diff < 15) return { text: `${diff}m wait`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (diff < 30) return { text: `${diff}m wait`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: `${diff}m wait`, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const [triageModalOpen, setTriageModalOpen] = useState<any>(null);
  const [triageForm, setTriageForm] = useState({
    bp: '', hr: '', temp: '', weight: '', spo2: '', chief_complaint: ''
  });

  const { data: appointmentsData, isLoading, refetch } = useQuery({
    queryKey: ['opd-queue', new Date().toISOString().split('T')[0]],
    queryFn: () => appointmentsApi.list({ 
      date_filter: new Date().toISOString().split('T')[0],
      status: 'waiting'
    }),
  });

  const appointments: any[] = Array.isArray(appointmentsData)
    ? appointmentsData
    : (appointmentsData as any)?.appointments || [];

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageModalOpen) return;
    try {
      await appointmentsApi.triage(triageModalOpen.id, {
        vitals: {
          bp: triageForm.bp,
          hr: triageForm.hr,
          temp: triageForm.temp,
          weight: triageForm.weight,
          spo2: triageForm.spo2,
        },
        chief_complaint: triageForm.chief_complaint,
      });
      alert('Triage saved successfully!');
      setTriageModalOpen(null);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to save triage');
    }
  };

  if (selectedAppointment) {
    return <OPDWorkbench 
      patientId={selectedAppointment.patient_id} 
      triageData={selectedAppointment.metadata_?.triage} 
      onBack={() => setSelectedAppointment(null)} 
    />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">OPD Queue</h1>
        <p className="text-slate-500 text-sm">Select a patient from the queue to begin clinical charting.</p>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-bold">Patient Name</th>
                <th className="p-4 font-bold">VID</th>
                <th className="p-4 font-bold">Status & Wait</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt: any) => {
                const waitInfo = getWaitTimeDetails(apt.scheduled_at);
                const hasTriage = !!apt.metadata_?.triage;
                return (
                  <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{apt.patient_name}</p>
                          <p className="text-xs text-slate-500">Scheduled: {formatDate(apt.scheduled_at)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600 font-mono">{apt.patient_vid || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" /> Waiting
                        </Badge>
                        <Badge variant="outline" className={waitInfo.color}>
                          {waitInfo.text}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setTriageModalOpen(apt);
                            const t = apt.metadata_?.triage?.vitals || {};
                            setTriageForm({
                              bp: t.bp || '', hr: t.hr || '', temp: t.temp || '', 
                              weight: t.weight || '', spo2: t.spo2 || '',
                              chief_complaint: apt.metadata_?.triage?.chief_complaint || ''
                            });
                          }}
                          className={`px-3 py-1.5 border font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                            hasTriage 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> 
                          {hasTriage ? 'Triaged ✓' : 'Triage'}
                        </button>
                        <button 
                          onClick={() => setSelectedAppointment(apt)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                        >
                          <Activity className="w-3.5 h-3.5" /> Start
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {appointments.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm font-medium">No patients found waiting in queue today.</div>
          )}
        </div>
      )}

      {/* Triage Modal */}
      {triageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                Nurse Triage - {triageModalOpen.patient_name}
              </h2>
              <button onClick={() => setTriageModalOpen(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            
            <form onSubmit={handleSaveTriage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Blood Pressure (mmHg)</label>
                  <input type="text" placeholder="120/80" value={triageForm.bp} onChange={e => setTriageForm({...triageForm, bp: e.target.value})} className="vmd-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Heart Rate (bpm)</label>
                  <input type="text" placeholder="75" value={triageForm.hr} onChange={e => setTriageForm({...triageForm, hr: e.target.value})} className="vmd-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Temperature (°F)</label>
                  <input type="text" placeholder="98.6" value={triageForm.temp} onChange={e => setTriageForm({...triageForm, temp: e.target.value})} className="vmd-input text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Weight (kg)</label>
                  <input type="text" placeholder="65" value={triageForm.weight} onChange={e => setTriageForm({...triageForm, weight: e.target.value})} className="vmd-input text-sm" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Chief Complaint</label>
                <textarea rows={3} placeholder="Patient presents with..." value={triageForm.chief_complaint} onChange={e => setTriageForm({...triageForm, chief_complaint: e.target.value})} className="vmd-input text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setTriageModalOpen(null)} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-sm">Save Triage</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
