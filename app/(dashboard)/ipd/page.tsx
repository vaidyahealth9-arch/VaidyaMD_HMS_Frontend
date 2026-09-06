'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipdApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  BedDouble,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Sparkles,
  ClipboardList,
  Clock,
  ArrowRightLeft,
  LogOut,
  HeartPulse,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function IPDBedboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedWardId, setSelectedWardId] = useState<string>('all');
  const [admitSheetOpen, setAdmitSheetOpen] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<any>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [packageName, setPackageName] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'bedboard' | 'nursing' | 'admissions'>('bedboard');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Fetch Wards
  const { data: wards = [] } = useQuery({
    queryKey: ['ipd-wards'],
    queryFn: () => ipdApi.listWards(),
  });

  // Fetch Beds
  const { data: beds = [], isLoading: bedsLoading } = useQuery({
    queryKey: ['ipd-beds', selectedWardId],
    queryFn: () => ipdApi.listBeds(selectedWardId !== 'all' ? { ward_id: selectedWardId } : undefined),
    refetchInterval: 30000,
  });

  // Fetch Admissions
  const { data: admissions = [] } = useQuery({
    queryKey: ['ipd-admissions'],
    queryFn: () => ipdApi.listAdmissions({ status: 'Active' }),
    refetchInterval: 30000,
  });

  // Fetch Nursing Tasks
  const { data: nursingTasks = [] } = useQuery({
    queryKey: ['nursing-tasks'],
    queryFn: () => ipdApi.listNursingTasks({ status: 'Pending' }),
    refetchInterval: 30000,
  });

  // Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 100 }),
  });
  const patients = patientsData?.items || [];

  // Admit Mutation
  const admitMutation = useMutation({
    mutationFn: () =>
      ipdApi.admitPatient({
        patient_id: selectedPatientId,
        bed_id: selectedBedForAdmission.id,
        admitting_doctor_id: user?.id,
        diagnosis,
        package_name: packageName,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      queryClient.invalidateQueries({ queryKey: ['nursing-tasks'] });
      setAdmitSheetOpen(false);
      setActionMessage('Patient successfully admitted to bed!');
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  // Discharge Mutation
  const dischargeMutation = useMutation({
    mutationFn: (admissionId: string) =>
      ipdApi.dischargePatient(admissionId, 'Routine clinical discharge with home care plan.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      setActionMessage('Patient discharged. Bed marked for cleaning.');
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  // Bed Status Change Mutation (e.g. Cleaned -> Vacant)
  const bedStatusMutation = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: string }) =>
      ipdApi.updateBedStatus(bedId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
    },
  });

  // Complete Nursing Task Mutation
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      ipdApi.completeNursingTask(taskId, {
        completed_by_id: user?.id,
        notes: 'Task verified and completed on shift.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nursing-tasks'] });
      setActionMessage('Nursing task marked completed!');
      setTimeout(() => setActionMessage(null), 4000);
    },
  });

  // Daily Accrual Mutation
  const accrualMutation = useMutation({
    mutationFn: () => ipdApi.accrueDailyCharges(),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      setActionMessage(data.message || 'Daily bed charges accrued!');
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const handleOpenAdmit = (bed: any) => {
    setSelectedBedForAdmission(bed);
    setSelectedPatientId('');
    setDiagnosis('');
    setPackageName('');
    setNotes('');
    setAdmitSheetOpen(true);
  };

  const vacantCount = beds.filter((b: any) => b.status === 'Vacant').length;
  const occupiedCount = beds.filter((b: any) => b.status === 'Occupied').length;
  const cleaningCount = beds.filter((b: any) => b.status === 'Cleaning' || b.status === 'Maintenance').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">IPD Bedboard & Nursing Station</h1>
            <p className="text-xs text-slate-500 font-medium">Real-time bed occupancy, admissions, and nursing shift checklists</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => accrualMutation.mutate()}
            disabled={accrualMutation.isPending}
            className="gap-1.5 text-xs font-bold bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-9 rounded-xl shadow-sm"
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>{accrualMutation.isPending ? 'Accruing...' : 'Daily Bed Charge Accrual'}</span>
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI METRIC TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Ward Capacity</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{beds.length} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Available / Vacant</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{vacantCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase">Occupied (Admitted)</p>
              <h3 className="text-2xl font-black text-red-700 mt-0.5">{occupiedCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase">Cleaning / Turnover</p>
              <h3 className="text-2xl font-black text-amber-700 mt-0.5">{cleaningCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs: Visual Bedboard, Nursing Checklist, Inpatient Register */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger value="bedboard" className="rounded-lg text-xs font-bold gap-1.5">
            <BedDouble className="w-3.5 h-3.5" />
            <span>Visual Bedboard Grid</span>
          </TabsTrigger>
          <TabsTrigger value="nursing" className="rounded-lg text-xs font-bold gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Nursing Station Shift Tasks ({nursingTasks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="admissions" className="rounded-lg text-xs font-bold gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Active Inpatient Register ({admissions.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISUAL BEDBOARD */}
        <TabsContent value="bedboard" className="space-y-4 pt-2">
          {/* Ward Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedWardId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedWardId === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Wards ({beds.length})
            </button>
            {wards.map((w: any) => (
              <button
                key={w.id}
                onClick={() => setSelectedWardId(w.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedWardId === w.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {w.name} (₹{w.base_charge_per_day}/day)
              </button>
            ))}
          </div>

          {/* Bed Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {beds.map((bed: any) => {
              const isOccupied = bed.status === 'Occupied';
              const isCleaning = bed.status === 'Cleaning';
              const isVacant = bed.status === 'Vacant';

              return (
                <Card
                  key={bed.id}
                  className={`overflow-hidden border-2 transition-all hover:shadow-md ${
                    isOccupied
                      ? 'border-red-300 bg-gradient-to-b from-red-50/50 to-white'
                      : isCleaning
                      ? 'border-amber-300 bg-gradient-to-b from-amber-50/50 to-white'
                      : 'border-emerald-300 bg-gradient-to-b from-emerald-50/50 to-white'
                  }`}
                >
                  <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{bed.bed_type} Bed</span>
                      <CardTitle className="text-sm font-black text-slate-900">{bed.bed_number}</CardTitle>
                    </div>
                    <Badge
                      variant={isOccupied ? 'destructive' : isCleaning ? 'warning' : 'success'}
                      className="text-[10px] font-bold uppercase"
                    >
                      {bed.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-3.5 space-y-3">
                    {isOccupied && bed.current_admission ? (
                      <div className="space-y-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-red-100 shadow-sm">
                          <p className="font-bold text-slate-900 text-sm truncate">{bed.current_admission.patient_name}</p>
                          <p className="text-[11px] text-indigo-600 font-semibold">{bed.current_admission.patient_mrn}</p>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">Dx: {bed.current_admission.diagnosis || 'Observation'}</p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Accrued:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(bed.current_admission.total_accrued_amount || bed.daily_rate)}</span>
                        </div>

                        <div className="flex gap-1.5 pt-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => dischargeMutation.mutate(bed.current_admission.admission_id)}
                            className="flex-1 h-8 rounded-lg text-xs font-bold gap-1"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Discharge</span>
                          </Button>
                        </div>
                      </div>
                    ) : isCleaning ? (
                      <div className="space-y-3 text-center py-2">
                        <p className="text-xs text-amber-800 font-medium">Under housekeeping / disinfection cycle</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => bedStatusMutation.mutate({ bedId: bed.id, status: 'Vacant' })}
                          className="w-full h-8 rounded-lg text-xs font-bold border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          <span>Mark Sanitized & Vacant</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-center py-2">
                        <p className="text-xs text-emerald-800 font-semibold">Rate: {formatCurrency(bed.daily_rate)} / day</p>
                        <Button
                          size="sm"
                          onClick={() => handleOpenAdmit(bed)}
                          className="w-full h-8 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Admit Patient</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 2: NURSING CHECKLIST */}
        <TabsContent value="nursing" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Pending Inpatient Nursing Orders & Checklists</CardTitle>
                <p className="text-xs text-slate-500">Scheduled vitals, IV infusions, and post-op wound dressings</p>
              </div>
            </CardHeader>
            <CardContent className="p-4 divide-y divide-slate-100">
              {nursingTasks.length > 0 ? (
                nursingTasks.map((t: any) => (
                  <div key={t.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" className="text-[10px] font-bold">Bed: {t.bed_number}</Badge>
                        <span className="font-bold text-slate-900 text-sm">{t.patient_name}</span>
                        <Badge variant="outline" className="text-[10px]">{t.task_type}</Badge>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{t.description}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Freq: {t.frequency} · Scheduled: {formatDateTime(t.scheduled_time)}</span>
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => completeTaskMutation.mutate(t.id)}
                      disabled={completeTaskMutation.isPending}
                      className="h-8 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Task</span>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  All nursing station tasks are up to date!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: INPATIENT REGISTER */}
        <TabsContent value="admissions" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm">Active Inpatient Admissions (Current Census)</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Bed / Ward</th>
                    <th className="p-3.5">Admitted On</th>
                    <th className="p-3.5">Attending Doctor</th>
                    <th className="p-3.5">Total Accrued</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {admissions.map((adm: any) => (
                    <tr key={adm.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">{adm.admission_number}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{adm.patient_name}</p>
                        <p className="text-[11px] text-slate-500">{adm.patient_mrn}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="secondary" className="font-bold">{adm.bed_number}</Badge>
                      </td>
                      <td className="p-3.5 text-slate-600">{formatDateTime(adm.admission_date)}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">{adm.admitting_doctor}</td>
                      <td className="p-3.5 font-bold text-slate-900">{formatCurrency(adm.total_accrued_amount)}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => dischargeMutation.mutate(adm.id)}
                          className="h-7 text-xs font-bold rounded-lg"
                        >
                          Discharge
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ADMISSION SHEET */}
      <Sheet open={admitSheetOpen} onOpenChange={setAdmitSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-base font-bold text-slate-900">
              Inpatient Bed Admission — {selectedBedForAdmission?.bed_number}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Assign patient and treatment package to vacant bed ({selectedBedForAdmission?.bed_type}).
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Select Patient Search</label>
              <input
                type="text"
                list="ipdPatientsList"
                placeholder="Type name or ID to search..."
                value={
                  patients.find((p: any) => p.id === selectedPatientId)
                    ? `${patients.find((p: any) => p.id === selectedPatientId)?.name} (${patients.find((p: any) => p.id === selectedPatientId)?.mrn || patients.find((p: any) => p.id === selectedPatientId)?.vid})`
                    : selectedPatientId
                }
                onChange={(e) => {
                  const match = patients.find((p: any) => `${p.name} (${p.mrn || p.vid})` === e.target.value);
                  setSelectedPatientId(match ? match.id : e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="ipdPatientsList">
                {patients.map((p: any) => (
                  <option key={p.id} value={`${p.name} (${p.mrn || p.vid})`} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Admission Diagnosis</label>
              <Input
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Post OPU Ovarian Hyperstimulation (OHSS) Monitoring"
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Treatment / Care Package</label>
              <Input
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="e.g. Laparoscopy Post-OP Care Package"
                className="h-9 text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Daily Bed Rate:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedBedForAdmission?.daily_rate || 2000)} / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Initial Billing Charge:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(selectedBedForAdmission?.daily_rate || 2000)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Special Nursing Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Strict fluid balance chart, bed rest for 24h, notify if BP < 100/60."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdmitSheetOpen(false)}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => admitMutation.mutate()}
              disabled={admitMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-xl shadow-md gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{admitMutation.isPending ? 'Admitting...' : 'Confirm Admission'}</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
