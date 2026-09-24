'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  patientsApi,
  treatmentCyclesApi,
  billingApi,
  appointmentsApi,
  documentsApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import PageLayout from '@/components/common/PageLayout';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import PatientHeader from '@/components/patients/PatientHeader';
import PartnerLinkModal from '@/components/patients/PartnerLinkModal';

// Tab components
import OverviewTab from '@/components/patients/tabs/OverviewTab';
import TimelineTab from '@/components/patients/tabs/TimelineTab';
import WorkbenchTab from '@/components/patients/tabs/WorkbenchTab';
import CounselingTab from '@/components/patients/tabs/CounselingTab';
import InvestigationsTab from '@/components/patients/tabs/InvestigationsTab';
import TreatmentCyclesTab from '@/components/patients/tabs/TreatmentCyclesTab';
import AndrologyTab from '@/components/patients/tabs/AndrologyTab';
import PatientBillingTab from '@/components/patients/tabs/PatientBillingTab';
import DocumentsTab from '@/components/patients/tabs/DocumentsTab';

// Modals
import StatutoryConsentModal from '@/components/fertility/StatutoryConsentModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import SpermPreparationModal from '@/components/fertility/SpermPreparationModal';
import SpermFreezingModal from '@/components/fertility/SpermFreezingModal';
import AddToOPDModal from '@/components/opd/AddToOPDModal';
import EditAlertsModal from '@/components/patients/EditAlertsModal';
import EditPatientDetailsModal from '@/components/patients/EditPatientDetailsModal';
import PatientBarcodeModal from '@/components/common/PatientBarcodeModal';

import {
  Users,
  Clock,
  ScanLine,
  Activity,
  FlaskConical,
  CreditCard,
  FileCheck,
  Stethoscope,
  HeartHandshake,
} from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Couple 360', icon: Users },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'workbench', label: 'OPD & Rx', icon: Stethoscope },
  { id: 'counseling', label: 'Counselor Notes', icon: HeartHandshake },
  { id: 'investigations', label: 'Investigations & USG', icon: ScanLine },
  { id: 'treatment', label: 'Treatment Cycles', icon: Activity },
  { id: 'andrology', label: 'Andrology Lab', icon: FlaskConical },
  { id: 'billing', label: 'Billing & Wallet', icon: CreditCard },
  { id: 'documents', label: 'Consents & Docs', icon: FileCheck },
];

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const patientId = params.id as string;

  const tabFromUrl = searchParams.get('tab');
  const appointmentIdFromUrl = searchParams.get('appointment_id');
  const [patient, setPatient] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(
    tabFromUrl === 'visits' ? 'workbench' : (tabFromUrl || 'overview')
  );
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: Couple 360 vs Individual Patient
  const [viewMode, setViewMode] = useState<'couple' | 'individual'>('couple');

  // Treatment Cycles state
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [cycleCalendar, setCycleCalendar] = useState<any>(null);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);

  // Timeline & Invoices
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Modals state
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showLinkPartnerModal, setShowLinkPartnerModal] = useState(false);
  const [showAddToOPDModal, setShowAddToOPDModal] = useState(false);
  const [showEditAlertsModal, setShowEditAlertsModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showOpuModal, setShowOpuModal] = useState(false);
  const [showEmbryologyModal, setShowEmbryologyModal] = useState(false);
  const [showEtDischargeModal, setShowEtDischargeModal] = useState(false);
  const [showSpermPrepModal, setShowSpermPrepModal] = useState(false);
  const [showSpermFreezingModal, setShowSpermFreezingModal] = useState(false);

  const { toast } = useToast();
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  useEffect(() => {
    if (tabFromUrl) {
      const resolved = tabFromUrl === 'visits' ? 'workbench' : tabFromUrl;
      if (resolved !== activeTab) {
        setActiveTab(resolved);
      }
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (appointmentIdFromUrl) {
      appointmentsApi.get(appointmentIdFromUrl)
        .then((res: any) => {
          setActiveAppointment(res);
        })
        .catch((err: any) => console.error('Failed to load appointment:', err));
    }
  }, [appointmentIdFromUrl]);

  const loadData = () => {
    setIsLoading(true);
    patientsApi.getCouple(patientId)
      .then((res: any) => {
        setPatient(res.primary_patient);
        setPartner(res.partner);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load patient data: ' + (err.message || 'Unknown error'));
      })
      .finally(() => setIsLoading(false));

    // Fetch timeline
    patientsApi.getTimeline(patientId)
      .then((res: any) => setTimelineEvents(res.timeline || []))
      .catch((err) => console.error('Failed to load timeline', err));

    // Fetch cycles
    treatmentCyclesApi.list({ patient_id: patientId })
      .then((c: any) => {
        if (Array.isArray(c)) {
          setCycles(c);
          if (c.length > 0) {
            setActiveCycle(c[0]);
            treatmentCyclesApi.getCalendar(c[0].id)
              .then((cal: any) => setCycleCalendar(cal))
              .catch((err) => console.error('Failed to load calendar', err));
          }
        }
      })
      .catch((err) => console.error('Failed to load cycles', err));

    // Fetch invoices
    billingApi.listInvoices({ patient_id: patientId })
      .then((inv: any) => setInvoices(inv || []))
      .catch((err) => console.error('Failed to load invoices', err));

    // Fetch appointments for active triage / OPD workbench
    appointmentsApi.list({ patient_id: patientId })
      .then((res: any) => {
        const appts = res?.appointments || (Array.isArray(res) ? res : []);
        if (appts.length > 0) {
          const activeAppt =
            (appointmentIdFromUrl ? appts.find((a: any) => a.id === appointmentIdFromUrl) : null) ||
            appts.find((a: any) => a.metadata?.triage || a.metadata_?.triage) ||
            appts.find((a: any) => a.status === 'scheduled' || a.status === 'in_consultation' || a.status === 'arrived') ||
            appts[0];
          if (activeAppt) {
            setActiveAppointment(activeAppt);
          }
        }
      })
      .catch((err) => console.error('Failed to load patient appointments', err));
  };

  useEffect(() => {
    loadData();
  }, [patientId, user?.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const uploadRes = await documentsApi.uploadFile(file, {
        category: 'profile',
        document_type: 'patient_photo',
        patient_id: patientId,
      });
      await patientsApi.update(patientId, { photo_url: uploadRes.url });
      toast.success('Patient photo updated successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const confirmUnlinkPartner = async () => {
    if (!partner) return;
    setIsUnlinking(true);
    try {
      await patientsApi.unlinkPartner(patientId);
      toast.success(`Partner ${partner.name} unlinked successfully.`);
      setViewMode('individual');
      setShowUnlinkConfirm(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlink partner');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    router.replace(`/patients/${patientId}?tab=${tabId}`);
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Patient not found</p>
        <Link href="/patients" className="text-primary font-bold text-sm">← Back to Patient Directory</Link>
      </div>
    );
  }

  const femalePartner = patient.gender === 'female' ? patient : partner;
  const malePartner = patient.gender === 'male' ? patient : partner;

  return (
    <PageLayout className="space-y-6">
      {/* Sticky Patient Summary Bar & Tab Rail */}
      <PatientHeader
        patient={patient}
        partner={partner}
        activeCycle={activeCycle}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isHeaderExpanded={isHeaderExpanded}
        setIsHeaderExpanded={setIsHeaderExpanded}
        isUploadingPhoto={isUploadingPhoto}
        onPhotoUpload={handlePhotoUpload}
        onEditPatient={() => setShowEditPatientModal(true)}
        onEditAlerts={() => setShowEditAlertsModal(true)}
        onLinkPartner={() => setShowLinkPartnerModal(true)}
        onUnlinkPartner={() => setShowUnlinkConfirm(true)}
        onSendToOPD={() => setShowAddToOPDModal(true)}
        onOpenBarcodeModal={() => setShowBarcodeModal(true)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        tabs={tabs}
        formatDate={formatDate}
      />

      {/* Tab Content Display Area */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab
            patientId={patientId}
            patient={patient}
            cycles={cycles}
            invoices={invoices}
            onAddNewCycle={() => {
              setActiveTab('treatment');
              setIsCreatingCycle(true);
              router.replace(`/patients/${patientId}?tab=treatment`);
            }}
            onSelectCycle={(cycle) => {
              setActiveCycle(cycle);
              setActiveTab('treatment');
              router.replace(`/patients/${patientId}?tab=treatment`);
            }}
            onOpenBillingTab={() => handleSelectTab('billing')}
            onWalletUpdated={loadData}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab timelineEvents={timelineEvents} />
        )}

        {activeTab === 'workbench' && (
          <WorkbenchTab
            patientId={patientId}
            appointment={activeAppointment}
            onBack={() => {
              handleSelectTab('overview');
              loadData();
            }}
          />
        )}

        {activeTab === 'counseling' && (
          <CounselingTab patientId={patientId} patient={patient} />
        )}

        {activeTab === 'investigations' && (
          <InvestigationsTab
            patient={patient}
            partner={partner}
            user={user}
          />
        )}

        {activeTab === 'treatment' && (
          <TreatmentCyclesTab
            patientId={patientId}
            partner={partner}
            userId={user?.id || ''}
            cycles={cycles}
            activeCycle={activeCycle}
            cycleCalendar={cycleCalendar}
            setActiveCycle={setActiveCycle}
            setCycleCalendar={setCycleCalendar}
            onRefreshData={loadData}
            onOpenConsentModal={() => setShowConsentModal(true)}
            onOpenOpuModal={() => setShowOpuModal(true)}
            onOpenEmbryologyModal={() => setShowEmbryologyModal(true)}
            onOpenEtDischargeModal={() => setShowEtDischargeModal(true)}
            isCreatingCycle={isCreatingCycle}
            setIsCreatingCycle={setIsCreatingCycle}
          />
        )}

        {activeTab === 'andrology' && (
          <AndrologyTab
            patient={patient}
            partner={partner}
            onOpenSpermPrepModal={() => setShowSpermPrepModal(true)}
            onOpenSpermFreezingModal={() => setShowSpermFreezingModal(true)}
          />
        )}

        {activeTab === 'billing' && (
          <PatientBillingTab
            patientId={patientId}
            patient={patient}
            invoices={invoices}
            onDataChanged={loadData}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsTab
            patientId={patientId}
            patient={patient}
            partner={partner}
            onOpenConsentModal={() => setShowConsentModal(true)}
          />
        )}
      </div>

      {/* Global Clinical & Administrative Modals */}
      {showConsentModal && (
        <StatutoryConsentModal
          patient={patient}
          partner={partner}
          cycle={cycles?.[0]}
          onClose={() => setShowConsentModal(false)}
          onConsentSaved={() => {
            loadData();
          }}
        />
      )}

      {showOpuModal && (
        <OPUAspirationReportModal
          cycle={activeCycle || cycles?.[0]}
          patient={patient}
          partner={partner}
          onClose={() => setShowOpuModal(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {showEmbryologyModal && (
        <MasterEmbryologyRecordModal
          cycle={activeCycle || cycles?.[0]}
          patient={patient}
          partner={partner}
          onClose={() => setShowEmbryologyModal(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {showEtDischargeModal && (
        <EmbryoTransferDischargeModal
          cycle={activeCycle || cycles?.[0]}
          patient={patient}
          partner={partner}
          onClose={() => setShowEtDischargeModal(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {showSpermPrepModal && (
        <SpermPreparationModal
          patient={partner || patient}
          partner={partner ? patient : undefined}
          onClose={() => setShowSpermPrepModal(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {showSpermFreezingModal && (
        <SpermFreezingModal
          cycle={activeCycle || cycles?.[0]}
          patient={partner || patient}
          partner={partner ? patient : undefined}
          onClose={() => setShowSpermFreezingModal(false)}
          onSaved={() => {
            loadData();
          }}
        />
      )}

      {showLinkPartnerModal && (
        <PartnerLinkModal
          open={showLinkPartnerModal}
          onClose={() => setShowLinkPartnerModal(false)}
          patient={patient}
          onLinked={() => {
            setViewMode('couple');
            loadData();
          }}
        />
      )}

      <AddToOPDModal
        open={showAddToOPDModal}
        onClose={() => setShowAddToOPDModal(false)}
        patient={patient}
      />

      <EditAlertsModal
        open={showEditAlertsModal}
        onClose={() => setShowEditAlertsModal(false)}
        patientId={patientId}
        patientName={patient?.name || 'Patient'}
        initialAlerts={patient?.alert_notes || []}
        onSuccess={(updatedAlerts) => {
          setPatient((prev: any) => ({ ...prev, alert_notes: updatedAlerts }));
        }}
      />

      {showEditPatientModal && (
        <EditPatientDetailsModal
          open={showEditPatientModal}
          onClose={() => setShowEditPatientModal(false)}
          patient={patient}
          onSuccess={(updated) => {
            setPatient(updated);
            loadData();
          }}
        />
      )}

      {showBarcodeModal && (
        <PatientBarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          patient={viewMode === 'couple' ? (femalePartner || patient) : patient}
          partner={viewMode === 'couple' ? (malePartner || partner) : null}
          hospitalName="VAIDYAMD HMS"
          branchName="Reproductive Medicine Centre"
        />
      )}

      <ConfirmDialog
        isOpen={showUnlinkConfirm}
        title="Unlink Partner"
        message={`Are you sure you want to unlink ${partner?.name || 'Partner'} from ${patient?.name || 'Patient'}? This will separate their medical charts into independent individual patients.`}
        confirmLabel="Unlink Partner"
        variant="danger"
        isLoading={isUnlinking}
        onConfirm={confirmUnlinkPartner}
        onCancel={() => setShowUnlinkConfirm(false)}
      />
    </PageLayout>
  );
}
