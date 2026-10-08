'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipdApi, patientsApi, authApi } from '@/lib/api';
import {
  BedDouble,
  Users,
  ClipboardList,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import {
  BedboardTab,
  NursingTab,
  AdmissionsTab,
  AdmissionSheet,
} from '@/components/ipd';

export default function IPDPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'bedboard' | 'nursing' | 'admissions'>('bedboard');
  const [selectedWardId, setSelectedWardId] = useState<string>('all');

  // Admission Sheet state
  const [admitSheetOpen, setAdmitSheetOpen] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<any | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [packageName, setPackageName] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const { data: wards = [] } = useQuery({
    queryKey: ['ipd-wards'],
    queryFn: () => ipdApi.listWards(),
  });

  const { data: beds = [] } = useQuery({
    queryKey: ['ipd-beds', selectedWardId],
    queryFn: () => ipdApi.listBeds({ ward_id: selectedWardId === 'all' ? undefined : selectedWardId }),
    refetchInterval: 15000,
  });

  const { data: admissions = [] } = useQuery({
    queryKey: ['ipd-admissions'],
    queryFn: () => ipdApi.listAdmissions({ status: 'Admitted' }),
    refetchInterval: 15000,
  });

  const { data: nursingTasks = [] } = useQuery({
    queryKey: ['ipd-nursing-tasks'],
    queryFn: () => ipdApi.listNursingTasks({ status: 'Pending' }),
    refetchInterval: 15000,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-ipd-select'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = (patientsData as any)?.patients || patientsData || [];

  const { data: doctors = [] } = useQuery({
    queryKey: ['ipd-doctors'],
    queryFn: () => authApi.getDoctors(),
  });

  // Mutations
  const admitMutation = useMutation({
    mutationFn: () =>
      ipdApi.admitPatient({
        patient_id: selectedPatientId,
        bed_id: selectedBedForAdmission?.id,
        admitting_doctor_id: selectedDoctorId || undefined,
        diagnosis,
        package_name: packageName,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
      setAdmitSheetOpen(false);
      resetAdmitForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to admit patient to bed');
    },
  });

  const dischargeMutation = useMutation({
    mutationFn: (admissionId: string) => ipdApi.dischargePatient(admissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to discharge patient');
    },
  });

  const bedStatusMutation = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: string }) =>
      ipdApi.updateBedStatus(bedId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => ipdApi.completeNursingTask(taskId, { notes: 'Completed from nursing station' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
    },
  });

  const resetAdmitForm = () => {
    setSelectedPatientId('');
    setSelectedDoctorId('');
    setDiagnosis('');
    setPackageName('');
    setNotes('');
    setSelectedBedForAdmission(null);
  };

  const handleOpenAdmit = (bed: any) => {
    setSelectedBedForAdmission(bed);
    setAdmitSheetOpen(true);
  };

  // KPIs
  const totalBeds = beds.length;
  const occupiedCount = beds.filter((b: any) => b.status === 'Occupied').length;
  const vacantCount = beds.filter((b: any) => b.status === 'Vacant' || b.status?.toLowerCase() === 'available').length;
  const cleaningCount = beds.filter((b: any) => b.status === 'Cleaning').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Inpatient Department (IPD) & Bedboard"
        subtitle="Live census visual grid, ward management & inpatient clinical workflows"
        icon={BedDouble}
        actions={
          <Button
            onClick={() => {
              const firstVacant = beds.find((b: any) => b.status === 'Vacant' || b.status?.toLowerCase() === 'available');
              if (firstVacant) {
                handleOpenAdmit(firstVacant);
              } else {
                alert('No vacant beds available currently.');
              }
            }}
            className="gap-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Admit to Vacant Bed</span>
          </Button>
        }
      />

      {/* Live Bed KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Occupancy Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{occupancyRate}%</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] flex items-center justify-center font-bold">
              {occupiedCount}/{totalBeds}
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Vacant Available</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">{vacantCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase">Occupied (Census)</p>
              <h3 className="text-2xl font-bold text-red-700 mt-0.5">{occupiedCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase">Cleaning / Turnover</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{cleaningCount} Beds</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <div className="space-y-4">
        <TabBar
          activeTab={activeTab}
          onChange={(v) => setActiveTab(v as any)}
          tabs={[
            { id: 'bedboard', label: 'Visual Bedboard Grid', icon: BedDouble },
            { id: 'nursing', label: 'Nursing Station Tasks', icon: ClipboardList, badge: nursingTasks.length || undefined },
            { id: 'admissions', label: 'Inpatient Register', icon: Users, badge: admissions.length || undefined },
          ]}
        />

        {activeTab === 'bedboard' && (
          <BedboardTab
            wards={wards}
            beds={beds}
            selectedWardId={selectedWardId}
            setSelectedWardId={setSelectedWardId}
            onAdmit={handleOpenAdmit}
            onDischarge={(admissionId) => dischargeMutation.mutate(admissionId)}
            onCleanBed={(bedId) => bedStatusMutation.mutate({ bedId, status: 'Vacant' })}
          />
        )}

        {activeTab === 'nursing' && (
          <NursingTab
            nursingTasks={nursingTasks}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            isCompleting={completeTaskMutation.isPending}
          />
        )}

        {activeTab === 'admissions' && (
          <AdmissionsTab
            admissions={admissions}
            onDischarge={(admissionId) => dischargeMutation.mutate(admissionId)}
          />
        )}
      </div>

      {/* Admission Sheet */}
      <AdmissionSheet
        isOpen={admitSheetOpen}
        onClose={() => setAdmitSheetOpen(false)}
        selectedBed={selectedBedForAdmission}
        patients={patients}
        selectedPatientId={selectedPatientId}
        setSelectedPatientId={setSelectedPatientId}
        doctors={doctors}
        selectedDoctorId={selectedDoctorId}
        setSelectedDoctorId={setSelectedDoctorId}
        diagnosis={diagnosis}
        setDiagnosis={setDiagnosis}
        packageName={packageName}
        setPackageName={setPackageName}
        notes={notes}
        setNotes={setNotes}
        isAdmitting={admitMutation.isPending}
        onConfirmAdmit={() => admitMutation.mutate()}
      />
    </PageLayout>
  );
}
