'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ipdApi, patientsApi, authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
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
  BedTransferModal,
  WardBedManagementModal,
  VitalsEntryModal,
  ClinicalDischargeModal,
  InpatientBedsideDrawer,
} from '@/components/ipd';
import { useBillingModal } from '@/contexts/BillingContext';

export default function IPDPage() {
  const queryClient = useQueryClient();
  const { openBilling } = useBillingModal();
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

  // Bedside Chart Drawer state
  const [bedsideDrawerOpen, setBedsideDrawerOpen] = useState(false);
  const [selectedBedsideAdmissionId, setSelectedBedsideAdmissionId] = useState<string | null>(null);

  // Bed Transfer Modal state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedTransferData, setSelectedTransferData] = useState<{
    admission_id?: string;
    patient_name?: string;
    bed_number?: string;
    ward_name?: string;
  } | null>(null);

  // Ward & Bed Management Modal state
  const [wardBedModalOpen, setWardBedModalOpen] = useState(false);

  // Vitals Entry Modal state
  const [vitalsModalOpen, setVitalsModalOpen] = useState(false);
  const [selectedVitalsData, setSelectedVitalsData] = useState<{
    admissionId?: string;
    bedId?: string;
    patientName?: string;
    bedNumber?: string;
    taskId?: string;
  } | null>(null);

  // Clinical Discharge Modal state
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [selectedDischargeAdmission, setSelectedDischargeAdmission] = useState<any | null>(null);

  // Queries
  const { data: wards = [], refetch: refetchWards } = useQuery({
    queryKey: ['ipd-wards'],
    queryFn: () => ipdApi.listWards(),
  });

  const { data: beds = [], refetch: refetchBeds } = useQuery({
    queryKey: ['ipd-beds', selectedWardId],
    queryFn: () => ipdApi.listBeds({ ward_id: selectedWardId === 'all' ? undefined : selectedWardId }),
    refetchInterval: 15000,
  });

  const { data: admissions = [], refetch: refetchAdmissions } = useQuery({
    queryKey: ['ipd-admissions'],
    queryFn: () => ipdApi.listAdmissions({ status: 'Admitted' }),
    refetchInterval: 15000,
  });

  const { data: nursingTasks = [], refetch: refetchNursingTasks } = useQuery({
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
      toast.success('Patient Admitted', 'Patient successfully admitted and assigned to bed.');
    },
    onError: (err: any) => {
      toast.error('Admission Error', err?.message || 'Failed to admit patient to bed');
    },
  });

  const bedStatusMutation = useMutation({
    mutationFn: ({ bedId, status }: { bedId: string; status: string }) =>
      ipdApi.updateBedStatus(bedId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      toast.success('Bed Status Updated', 'Bed marked as sanitized & vacant.');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => ipdApi.completeNursingTask(taskId, { notes: 'Completed from nursing station' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
      toast.success('Task Completed', 'Nursing task marked as complete.');
    },
  });

  const accrueTariffMutation = useMutation({
    mutationFn: () => ipdApi.accrueDailyCharges(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
      queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
      toast.success('Tariff Accrued', data.message || 'Daily room charges calculated.');
    },
    onError: (err: any) => {
      toast.error('Accrual Failed', err?.message);
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

  const handleOpenChart = (admissionId: string) => {
    setSelectedBedsideAdmissionId(admissionId);
    setBedsideDrawerOpen(true);
  };

  const handleOpenTransfer = (data: any) => {
    setSelectedTransferData(data);
    setTransferModalOpen(true);
  };

  const handleOpenVitalsModal = (
    admissionId: string,
    bedId: string,
    patientName: string,
    bedNumber: string,
    taskId?: string
  ) => {
    setSelectedVitalsData({ admissionId, bedId, patientName, bedNumber, taskId });
    setVitalsModalOpen(true);
  };

  // KPIs
  const totalBeds = beds.length;
  const occupiedCount = beds.filter((b: any) => b.status === 'Occupied').length;
  const vacantCount = beds.filter((b: any) => b.status === 'Vacant' || b.status?.toLowerCase() === 'available').length;
  const cleaningCount = beds.filter((b: any) => b.status === 'Cleaning').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedCount / totalBeds) * 100) : 0;

  // Unified Billing Integration: Final Discharge Settlement
  const handleInitiateDischarge = async (admissionId: string) => {
    try {
      const summary = await ipdApi.getDischargeSummary(admissionId);
      if (!summary) {
        toast.error('Discharge Error', 'Could not retrieve IPD discharge summary.');
        return;
      }
      setSelectedDischargeAdmission(summary);
      setDischargeModalOpen(true);
    } catch (err: any) {
      toast.error('Discharge Tariff Error', err?.message || 'Could not load IPD discharge tariff.');
    }
  };

  const handleProceedFromDischargeToBilling = (dischargeSummaryData: any) => {
    const summary = selectedDischargeAdmission;
    if (!summary) return;

    setDischargeModalOpen(false);

    const defaultItems = (summary.suggested_items || []).map((it: any) => ({
      description: it.description || `IPD Room Charges (${summary.bed_number || 'Bed'})`,
      quantity: it.quantity || 1,
      unit_price: it.unit_price || 0,
      total: it.total || (it.quantity || 1) * (it.unit_price || 0),
      service_code: it.service_code || 'IPD-ROOM',
      category: it.category || 'IPD',
    }));

    openBilling({
      patientId: summary.patient_id,
      lockedPatient: true,
      sourceModule: 'ipd',
      sourceReferenceId: summary.admission_id,
      defaultReason: `IPD Inpatient Discharge Settlement: ${summary.ward_name || 'Ward'} (Bed ${summary.bed_number || ''}, ${summary.duration_days || 1} day${(summary.duration_days || 1) > 1 ? 's' : ''})`,
      defaultItems: defaultItems.length > 0 ? defaultItems : [
        {
          description: `IPD Room Charges (Bed ${summary.bed_number || 'Standard'})`,
          quantity: summary.duration_days || 1,
          unit_price: summary.daily_rate || 2000,
          total: (summary.duration_days || 1) * (summary.daily_rate || 2000),
          service_code: 'IPD-ROOM',
          category: 'IPD',
        },
      ],
      onSuccess: async (invoice) => {
        try {
          await ipdApi.dischargePatient(summary.admission_id, {
            invoice_id: invoice.id,
            notes: `Discharged via Unified Billing with Final Invoice #${invoice.invoice_number}`,
            discharge_summary: dischargeSummaryData,
          });
          queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
          setBedsideDrawerOpen(false);
          toast.success(
            'Discharged & Billed Successfully',
            `Patient ${summary.patient_name || ''} discharged. Final invoice #${invoice.invoice_number} generated.`
          );
        } catch (err: any) {
          console.error('Failed to mark admission discharged after billing', err);
          toast.error('Discharge Status Error', err.message || 'Invoice generated, but discharge status update failed.');
        }
      },
    });
  };

  // Unified Billing Integration: Interim mid-stay billing without discharge
  const handleInterimBilling = async (admissionId: string) => {
    try {
      const summary = await ipdApi.getDischargeSummary(admissionId);
      if (!summary) return;

      const defaultItems = (summary.suggested_items || []).map((it: any) => ({
        description: `Interim: ${it.description || `IPD Room Charges (${summary.bed_number || 'Bed'})`}`,
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        total: it.total || (it.quantity || 1) * (it.unit_price || 0),
        service_code: it.service_code || 'IPD-ROOM',
        category: it.category || 'IPD',
      }));

      openBilling({
        patientId: summary.patient_id,
        lockedPatient: true,
        sourceModule: 'ipd',
        sourceReferenceId: admissionId,
        defaultReason: `IPD Interim Inpatient Bill: ${summary.ward_name || 'Ward'} (Bed ${summary.bed_number || ''})`,
        defaultItems,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
          queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
          toast.success('Interim Bill Generated', 'Interim invoice created successfully.');
        },
      });
    } catch (err: any) {
      toast.error('Billing Tariff Error', err?.message || 'Could not load IPD billing tariff.');
    }
  };

  const handleRefreshAll = () => {
    refetchWards();
    refetchBeds();
    refetchAdmissions();
    refetchNursingTasks();
  };

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Inpatient Department (IPD) & Bedboard"
        subtitle="Live census visual grid, inpatient clinical charts, CPOE orders & bedside care"
        icon={BedDouble}
        actions={
          <Button
            onClick={() => {
              const firstVacant = beds.find((b: any) => b.status === 'Vacant' || b.status?.toLowerCase() === 'available');
              if (firstVacant) {
                handleOpenAdmit(firstVacant);
              } else {
                toast.error('No Bed Available', 'All inpatient beds are currently occupied or undergoing cleaning.');
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
            onOpenChart={handleOpenChart}
            onTransfer={handleOpenTransfer}
            onDischarge={handleInitiateDischarge}
            onInterimBill={handleInterimBilling}
            onCleanBed={(bedId) => bedStatusMutation.mutate({ bedId, status: 'Vacant' })}
            onManageWards={() => setWardBedModalOpen(true)}
            onAccrueCharges={() => accrueTariffMutation.mutate()}
          />
        )}

        {activeTab === 'nursing' && (
          <NursingTab
            nursingTasks={nursingTasks}
            onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
            onOpenVitalsTask={(task) =>
              handleOpenVitalsModal(task.admission_id, task.bed_id, task.patient_name, task.bed_number, task.id)
            }
            isCompleting={completeTaskMutation.isPending}
          />
        )}

        {activeTab === 'admissions' && (
          <AdmissionsTab
            admissions={admissions}
            onOpenChart={handleOpenChart}
            onTransfer={handleOpenTransfer}
            onDischarge={handleInitiateDischarge}
            onInterimBill={handleInterimBilling}
          />
        )}
      </div>

      {/* 1. Admission Sheet */}
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

      {/* 2. Inpatient Bedside Chart Drawer */}
      <InpatientBedsideDrawer
        isOpen={bedsideDrawerOpen}
        onClose={() => {
          setBedsideDrawerOpen(false);
          setSelectedBedsideAdmissionId(null);
        }}
        admissionId={selectedBedsideAdmissionId}
        onTransfer={(adm) => {
          setBedsideDrawerOpen(false);
          handleOpenTransfer({
            admission_id: adm.id,
            patient_name: adm.patient?.name,
            bed_number: adm.bed?.bed_number,
            ward_name: adm.bed?.ward_name,
          });
        }}
        onInterimBill={(admId) => handleInterimBilling(admId)}
        onDischarge={(admId) => handleInitiateDischarge(admId)}
        onOpenVitalsModal={(admId, bId, pName, bNum) => handleOpenVitalsModal(admId, bId, pName, bNum)}
        onRefreshParent={handleRefreshAll}
      />

      {/* 3. Bed Transfer Modal */}
      <BedTransferModal
        isOpen={transferModalOpen}
        onClose={() => {
          setTransferModalOpen(false);
          setSelectedTransferData(null);
        }}
        admissionId={selectedTransferData?.admission_id}
        patientName={selectedTransferData?.patient_name}
        currentBedNumber={selectedTransferData?.bed_number}
        currentWardName={selectedTransferData?.ward_name}
        wards={wards}
        beds={beds}
        onSuccess={handleRefreshAll}
      />

      {/* 4. Ward & Bed Management Modal */}
      <WardBedManagementModal
        isOpen={wardBedModalOpen}
        onClose={() => setWardBedModalOpen(false)}
        wards={wards}
        beds={beds}
        onRefresh={handleRefreshAll}
      />

      {/* 5. Vitals Entry Modal */}
      <VitalsEntryModal
        isOpen={vitalsModalOpen}
        onClose={() => {
          setVitalsModalOpen(false);
          setSelectedVitalsData(null);
        }}
        admissionId={selectedVitalsData?.admissionId}
        bedId={selectedVitalsData?.bedId}
        patientName={selectedVitalsData?.patientName}
        bedNumber={selectedVitalsData?.bedNumber}
        taskId={selectedVitalsData?.taskId}
        onSuccess={handleRefreshAll}
      />

      {/* 6. Clinical Discharge Modal */}
      <ClinicalDischargeModal
        isOpen={dischargeModalOpen}
        onClose={() => {
          setDischargeModalOpen(false);
          setSelectedDischargeAdmission(null);
        }}
        admission={selectedDischargeAdmission}
        onProceedToBilling={handleProceedFromDischargeToBilling}
        onSuccess={handleRefreshAll}
      />
    </PageLayout>
  );
}
