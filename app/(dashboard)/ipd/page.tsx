'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  History,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import StatCard from '@/components/common/StatCard';
import {
  BedboardTab,
  NursingTab,
  AdmissionsTab,
  DischargeHistoryTab,
  AdmissionSheet,
  BedTransferModal,
  WardBedManagementModal,
  VitalsEntryModal,
  RescheduleVitalModal,
  ClinicalDischargeModal,
  InpatientBedsideChart,
} from '@/components/ipd';
import { useBillingModal } from '@/contexts/BillingContext';

export default function IPDPage() {
  const queryClient = useQueryClient();
  const { openBilling } = useBillingModal();
  const router = useRouter();
  const searchParams = useSearchParams();

  type IPDTab = 'bedboard' | 'admissions' | 'nursing' | 'history';
  const tabParam = searchParams.get('tab');
  const currentTab: IPDTab = (
    tabParam === 'nursing' || tabParam === 'admissions' || tabParam === 'history'
      ? tabParam
      : 'bedboard'
  );

  // Full-Width Inpatient Chart state (360-degree View in Main Canvas)
  const [activeChartAdmissionId, setActiveChartAdmissionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<IPDTab>(currentTab);
  const [selectedWardId, setSelectedWardId] = useState<string>('all');

  // Synchronize active tab with URL query parameter (e.g. from ContextSidebar or direct navigation)
  useEffect(() => {
    setActiveTab(currentTab);
    if (activeChartAdmissionId) {
      setActiveChartAdmissionId(null);
    }
  }, [currentTab]);

  const handleTabChange = (newTab: string) => {
    const validTab = newTab as IPDTab;
    setActiveTab(validTab);
    setActiveChartAdmissionId(null);
    if (validTab === 'bedboard') {
      router.push('/ipd');
    } else {
      router.push('/ipd?tab=' + validTab);
    }
  };

  // Admission Sheet state
  const [admitSheetOpen, setAdmitSheetOpen] = useState(false);
  const [selectedBedForAdmission, setSelectedBedForAdmission] = useState<any | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [packageName, setPackageName] = useState('');
  const [notes, setNotes] = useState('');
  const [vitalsFrequency, setVitalsFrequency] = useState('Q4H');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedRescheduleTask, setSelectedRescheduleTask] = useState<any | null>(null);

  const handleOpenRescheduleModal = (task: any) => {
    setSelectedRescheduleTask(task);
    setRescheduleModalOpen(true);
  };

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
        vitals_frequency: vitalsFrequency,
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
    setVitalsFrequency('Q4H');
    setSelectedBedForAdmission(null);
  };

  const handleOpenAdmit = (bed: any) => {
    setSelectedBedForAdmission(bed);
    setAdmitSheetOpen(true);
  };

  // Open Full Inpatient 360 Chart in Main Canvas
  const handleOpenChart = (admissionId: string) => {
    setActiveChartAdmissionId(admissionId);
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
          const billedItemIds = (summary.suggested_items || [])
            .map((it: any) => it.id || it.bill_item_id)
            .filter(Boolean);

          await ipdApi.settleInvoice(summary.admission_id, {
            invoice_id: invoice.id,
            item_ids: billedItemIds.length > 0 ? billedItemIds : undefined,
            amount_paid: invoice.paid_amount || 0,
            payment_method: invoice.payment_method || 'cash',
            transaction_reference: invoice.invoice_number,
            notes: `Discharged via Unified Billing with Final Invoice #${invoice.invoice_number}`,
            is_discharge: true,
            discharge_summary: dischargeSummaryData,
          });

          queryClient.invalidateQueries({ queryKey: ['ipd-beds'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-discharged-history'] });
          queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
          if (activeChartAdmissionId === summary.admission_id) {
            setActiveChartAdmissionId(null);
          }
          toast.success(
            'Discharged & Billed Successfully',
            `Patient ${summary.patient_name || ''} discharged. Final invoice #${invoice.invoice_number} generated and payment recorded.`
          );
        } catch (err: any) {
          console.error('Failed to mark admission discharged after billing', err);
          toast.error('Discharge Status Error', err.message || 'Invoice generated, but discharge settlement update failed.');
        }
      },
    });
  };

  // Unified Billing Integration: Interim mid-stay billing without discharge
  const handleInterimBilling = async (admissionId: string) => {
    try {
      const summary = await ipdApi.getDischargeSummary(admissionId);
      if (!summary) return;

      const suggested = summary.suggested_items || [];
      if (suggested.length === 0) {
        toast.info('No Unbilled Charges', 'All currently accrued inpatient charges have already been billed.');
        return;
      }

      const defaultItems = suggested.map((it: any) => ({
        description: `Interim: ${it.description || `IPD Room Charges (${summary.bed_number || 'Bed'})`}`,
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        total: it.total || (it.quantity || 1) * (it.unit_price || 0),
        service_code: it.service_code || 'IPD-ROOM',
        category: it.category || 'IPD',
      }));

      const billedItemIds = suggested.map((it: any) => it.id || it.bill_item_id).filter(Boolean);

      openBilling({
        patientId: summary.patient_id,
        lockedPatient: true,
        sourceModule: 'ipd',
        sourceReferenceId: admissionId,
        defaultReason: `IPD Interim Inpatient Bill: ${summary.ward_name || 'Ward'} (Bed ${summary.bed_number || ''})`,
        defaultItems,
        onSuccess: async (invoice) => {
          try {
            await ipdApi.settleInvoice(admissionId, {
              invoice_id: invoice.id,
              item_ids: billedItemIds.length > 0 ? billedItemIds : undefined,
              amount_paid: invoice.paid_amount || 0,
              payment_method: invoice.payment_method || 'cash',
              transaction_reference: invoice.invoice_number,
              notes: `Interim invoice #${invoice.invoice_number} settlement`,
              is_discharge: false,
            });
            queryClient.invalidateQueries({ queryKey: ['ipd-rolling-bill', admissionId] });
            queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
            queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
            toast.success(
              'Interim Bill Paid & Recorded',
              `Invoice #${invoice.invoice_number} created and payment saved in inpatient ledger.`
            );
          } catch (err: any) {
            console.error('Failed to settle interim invoice', err);
            toast.error('Settlement Error', err?.message || 'Invoice created, but ledger update failed.');
          }
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

  // 4 Standard Tabs synchronized with ContextSidebar
  const tabsList = [
    { id: 'bedboard', label: 'Visual Bedboard Grid', icon: BedDouble },
    { id: 'admissions', label: 'Active Inpatients', icon: Users, badge: admissions.length || undefined },
    { id: 'nursing', label: 'Nursing Station Tasks', icon: ClipboardList, badge: nursingTasks.length || undefined },
    { id: 'history', label: 'Discharge History', icon: History },
  ];

  return (
    <PageLayout className="space-y-6">
      {/* If viewing a patient chart, render the full-width chart directly without tab bar */}
      {activeChartAdmissionId ? (
        <InpatientBedsideChart
          admissionId={activeChartAdmissionId}
          onBack={() => setActiveChartAdmissionId(null)}
          onTransfer={(adm) => {
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
      ) : (
        <>
          {/* Header Bar */}
          <PageHeader
            title="Inpatient Department (IPD) & Bedboard"
            subtitle="Live census visual grid, inpatient clinical charts, medication orders & bedside care"
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

          {/* Live Bed KPI Cards using StatCard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Occupancy Rate"
              value={`${occupancyRate}%`}
              subtext={`${occupiedCount} of ${totalBeds} beds occupied`}
              color="default"
              icon={BedDouble}
            />

            <StatCard
              label="Vacant Available"
              value={`${vacantCount} Beds`}
              subtext="Ready for admission"
              color="success"
              icon={CheckCircle2}
            />

            <StatCard
              label="Occupied (Census)"
              value={`${occupiedCount} Beds`}
              subtext="Active inpatients"
              color="danger"
              icon={Users}
            />

            <StatCard
              label="Cleaning / Turnover"
              value={`${cleaningCount} Beds`}
              subtext="Undergoing sanitization"
              color="warning"
              icon={RefreshCw}
            />
          </div>

          {/* Standard 3-Tab Main Navigation Bar */}
          <div className="space-y-4">
            <TabBar
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={tabsList}
            />

            {/* TAB 1: VISUAL BEDBOARD GRID */}
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

            {/* TAB 2: ACTIVE INPATIENTS */}
            {activeTab === 'admissions' && (
              <AdmissionsTab
                admissions={admissions}
                onOpenChart={handleOpenChart}
                onTransfer={handleOpenTransfer}
                onDischarge={handleInitiateDischarge}
                onInterimBill={handleInterimBilling}
              />
            )}

            {/* TAB 3: NURSING STATION TASKS */}
            {activeTab === 'nursing' && (
              <NursingTab
                nursingTasks={nursingTasks}
                onCompleteTask={(taskId) => completeTaskMutation.mutate(taskId)}
                onOpenVitalsTask={(task) =>
                  handleOpenVitalsModal(task.admission_id, task.bed_id, task.patient_name, task.bed_number, task.id)
                }
                onRescheduleTask={handleOpenRescheduleModal}
                isCompleting={completeTaskMutation.isPending}
              />
            )}

            {/* TAB 4: DISCHARGE HISTORY */}
            {activeTab === 'history' && (
              <DischargeHistoryTab onRefreshParent={handleRefreshAll} />
            )}
          </div>
        </>
      )}

      {/* MODAL 1: Admission Sheet Drawer */}
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
        vitalsFrequency={vitalsFrequency}
        setVitalsFrequency={setVitalsFrequency}
        isAdmitting={admitMutation.isPending}
        onConfirmAdmit={() => admitMutation.mutate()}
      />

      {/* MODAL 2: Bed Transfer Modal */}
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

      {/* MODAL 3: Ward & Bed Management Modal */}
      <WardBedManagementModal
        isOpen={wardBedModalOpen}
        onClose={() => setWardBedModalOpen(false)}
        wards={wards}
        beds={beds}
        onRefresh={handleRefreshAll}
      />

      {/* MODAL 4: Vitals Entry Modal */}
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

      {/* MODAL 5: Clinical Discharge Modal */}
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

      {/* MODAL 6: Reschedule Vitals Modal */}
      <RescheduleVitalModal
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedRescheduleTask(null);
        }}
        taskId={selectedRescheduleTask?.id}
        admissionId={selectedRescheduleTask?.admission_id}
        patientName={selectedRescheduleTask?.patient_name}
        bedNumber={selectedRescheduleTask?.bed_number}
        currentFrequency={selectedRescheduleTask?.frequency}
        currentScheduledTime={selectedRescheduleTask?.scheduled_time}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ipd-nursing-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['ipd-admissions'] });
        }}
      />
    </PageLayout>
  );
}
