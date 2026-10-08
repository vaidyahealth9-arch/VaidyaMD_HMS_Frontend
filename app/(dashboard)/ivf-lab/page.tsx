'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  patientsApi,
  cryoApi,
  treatmentCyclesApi,
  authApi,
  qcApi,
} from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import {
  AndrologyTab,
  EmbryologyTab,
  CryopreservationTab,
  QcTab,
  DualWitnessModal,
  CryoVitrifyModal,
  CryoThawModal,
} from '@/components/ivf';
import SurgicalSpermRetrievalModal from '@/components/fertility/SurgicalSpermRetrievalModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import SpermPreparationModal from '@/components/fertility/SpermPreparationModal';
import SpermFreezingModal from '@/components/fertility/SpermFreezingModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';
import DonorEmbryoTransferModal from '@/components/fertility/DonorEmbryoTransferModal';
import IUIDonorModal from '@/components/fertility/IUIDonorModal';
import {
  FlaskConical,
  Microscope,
  Snowflake,
  AlertCircle,
} from 'lucide-react';

export default function IvfLabPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'andrology' | 'embryology' | 'cryopreservation' | 'qc'>('embryology');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['andrology', 'embryology', 'cryopreservation', 'qc'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  const [patients, setPatients] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // === ANDROLOGY STATE ===
  const [selectedMalePatient, setSelectedMalePatient] = useState<any>(null);
  const [showSurgicalModal, setShowSurgicalModal] = useState(false);
  const [showSpermPrepModal, setShowSpermPrepModal] = useState(false);
  const [showSpermFreezingModal, setShowSpermFreezingModal] = useState(false);
  const [showIuiDonorModal, setShowIuiDonorModal] = useState(false);

  // === EMBRYOLOGY STATE ===
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [showWitnessModal, setShowWitnessModal] = useState(false);
  const [showOpuModal, setShowOpuModal] = useState(false);
  const [showMasterEmbryologyModal, setShowMasterEmbryologyModal] = useState(false);
  const [showEtDischargeModal, setShowEtDischargeModal] = useState(false);
  const [showDonorEtModal, setShowDonorEtModal] = useState(false);

  // === CRYOBANK STATE ===
  const [cryoSamples, setCryoSamples] = useState<any[]>([]);
  const [expiringSamples, setExpiringSamples] = useState<any[]>([]);
  const [showVitrifyModal, setShowVitrifyModal] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);
  const [selectedThawSample, setSelectedThawSample] = useState<any>(null);

  // === QC STATE ===
  const [qcLogs, setQcLogs] = useState<any[]>([]);

  const loadInitialData = (silent = false) => {
    if (!silent) setIsLoading(true);
    Promise.all([
      patientsApi.list({ per_page: 100 }),
      treatmentCyclesApi.list(),
      cryoApi.listSamples(),
      cryoApi.getExpiringSoon(30),
      authApi.listUsers(),
      qcApi.listLogs().catch(() => []),
    ])
      .then(([patRes, cycRes, cryoRes, expRes, userRes, qcRes]: any) => {
        const pts = patRes.patients || [];
        setPatients(pts);

        const cycs = cycRes || [];
        setCycles(cycs);

        setCryoSamples(Array.isArray(cryoRes) ? cryoRes : []);
        setExpiringSamples(Array.isArray(expRes) ? expRes : []);

        const uList = Array.isArray(userRes) ? userRes : [];
        setStaffUsers(uList);

        if (Array.isArray(qcRes) && qcRes.length > 0) {
          setQcLogs(qcRes);
        }

        if (cycs.length > 0 && !activeCycle) {
          setActiveCycle(cycs[0]);
        }

        const males = pts.filter((p: any) => p.gender === 'male');
        if (males.length > 0 && !selectedMalePatient) {
          setSelectedMalePatient(males[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load IVF lab data:', err);
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const malePatients = patients.filter((p) => p.gender === 'male');

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageLayout className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="IVF Lab"
        subtitle="Embryology suite, CASA semen analysis, cryobank coordinates & QC monitors"
        icon={Microscope}
      />

      {/* Tab Selection */}
      <TabBar
        tabs={[
          { id: 'embryology', label: 'Embryology Suite', icon: FlaskConical, badge: cycles.length || undefined },
          { id: 'andrology', label: 'Andrology & CASA', icon: Microscope, badge: malePatients.length || undefined },
          { id: 'cryopreservation', label: 'Cryobank LN2 Storage', icon: Snowflake, badge: cryoSamples.length || undefined },
          { id: 'qc', label: 'Lab QC & Calibration', icon: AlertCircle, badge: qcLogs.length || undefined },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Tab 1: Andrology */}
      {activeTab === 'andrology' && (
        <AndrologyTab
          malePatients={malePatients}
          cycles={cycles}
          selectedMalePatient={selectedMalePatient}
          onSelectMalePatient={(p) => setSelectedMalePatient(p)}
          onOpenSpermPrep={() => setShowSpermPrepModal(true)}
          onOpenIuiDonor={() => setShowIuiDonorModal(true)}
          onOpenSpermFreezing={() => setShowSpermFreezingModal(true)}
          onOpenSurgical={() => setShowSurgicalModal(true)}
        />
      )}

      {/* Tab 2: Embryology */}
      {activeTab === 'embryology' && (
        <EmbryologyTab
          cycles={cycles}
          activeCycle={activeCycle}
          patients={patients}
          onSelectCycle={(c) => setActiveCycle(c)}
          onNotesUpdated={() => loadInitialData(true)}
          onOpenOpu={() => setShowOpuModal(true)}
          onOpenMasterEmbryology={() => setShowMasterEmbryologyModal(true)}
          onOpenEtDischarge={() => setShowEtDischargeModal(true)}
          onOpenDonorEt={() => setShowDonorEtModal(true)}
        />
      )}

      {/* Tab 3: Cryopreservation */}
      {activeTab === 'cryopreservation' && (
        <CryopreservationTab
          cryoSamples={cryoSamples}
          expiringSamples={expiringSamples}
          onOpenVitrify={() => setShowVitrifyModal(true)}
          onSelectThawSample={(sample) => {
            setSelectedThawSample(sample);
            setShowThawModal(true);
          }}
        />
      )}

      {/* Tab 4: QC */}
      {activeTab === 'qc' && (
        <QcTab
          qcLogs={qcLogs}
          onQcLogged={(entry) => setQcLogs((prev) => [entry, ...prev])}
        />
      )}

      {/* Dual-Witnessing Signoff Modal */}
      <DualWitnessModal
        isOpen={showWitnessModal}
        onClose={() => setShowWitnessModal(false)}
        activeCycle={activeCycle}
        staffUsers={staffUsers}
        onSuccess={() => loadInitialData(true)}
      />

      {/* Vitrify Straw Modal */}
      {showVitrifyModal && (
        <CryoVitrifyModal
          patients={patients}
          activeCycle={activeCycle}
          onClose={() => setShowVitrifyModal(false)}
          onSaved={() => cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []))}
        />
      )}

      {/* Thaw Modal */}
      {showThawModal && selectedThawSample && (
        <CryoThawModal
          selectedThawSample={selectedThawSample}
          staffUsers={staffUsers}
          onClose={() => setShowThawModal(false)}
          onSaved={() => cryoApi.listSamples().then((res: any) => setCryoSamples(Array.isArray(res) ? res : []))}
        />
      )}

      {/* Modal: Surgical Sperm Retrieval (TESA/PESA) */}
      {showSurgicalModal && (
        <SurgicalSpermRetrievalModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSurgicalModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: Embryo Transfer Discharge Protocol */}
      {showEtDischargeModal && activeCycle && (
        <EmbryoTransferDischargeModal
          cycle={activeCycle}
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
              age: activeCycle.patient_age,
            }
          }
          partner={
            patients.find((p) => p.id === activeCycle.partner_id) || {
              id: activeCycle.partner_id,
              name: activeCycle.partner_name,
            }
          }
          onClose={() => setShowEtDischargeModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: Sperm Preparation & Semen Wash */}
      {showSpermPrepModal && (
        <SpermPreparationModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSpermPrepModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: Semen Freezing & Cryo Storage Record */}
      {showSpermFreezingModal && (
        <SpermFreezingModal
          patient={selectedMalePatient || patients.find((p) => p.gender === 'male') || { id: user?.id, name: 'Male Partner' }}
          activeCycle={activeCycle}
          onClose={() => setShowSpermFreezingModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: OPU Aspiration Report */}
      {showOpuModal && activeCycle && (
        <OPUAspirationReportModal
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          activeCycle={activeCycle}
          onClose={() => setShowOpuModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: Master Embryology Record */}
      {showMasterEmbryologyModal && activeCycle && (
        <MasterEmbryologyRecordModal
          cycle={activeCycle}
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          partner={
            patients.find((p) => p.id === activeCycle.partner_id) || {
              id: activeCycle.partner_id,
              name: activeCycle.partner_name,
            }
          }
          onClose={() => setShowMasterEmbryologyModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: Donor Embryo Transfer */}
      {showDonorEtModal && activeCycle && (
        <DonorEmbryoTransferModal
          patient={
            patients.find((p) => p.id === activeCycle.patient_id) || {
              id: activeCycle.patient_id,
              name: activeCycle.patient_name || 'Female Patient',
              vid: activeCycle.patient_vid,
            }
          }
          activeCycle={activeCycle}
          onClose={() => setShowDonorEtModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}

      {/* Modal: IUI with Donor Semen (IUI-D) */}
      {showIuiDonorModal && (
        <IUIDonorModal
          patient={
            selectedMalePatient
              ? cycles.find((c: any) => c.partner_id === selectedMalePatient.id)?.patient_id
                ? patients.find(
                    (p) =>
                      p.id === cycles.find((c: any) => c.partner_id === selectedMalePatient.id).patient_id
                  ) || selectedMalePatient
                : selectedMalePatient
              : { id: 'generic-recipient', name: 'Female Recipient', vid: 'VH-PAT-001' }
          }
          partner={selectedMalePatient}
          cycle={
            selectedMalePatient
              ? cycles.find(
                  (c: any) => c.partner_id === selectedMalePatient.id || c.patient_id === selectedMalePatient.id
                )
              : null
          }
          onClose={() => setShowIuiDonorModal(false)}
          onSaved={() => loadInitialData(true)}
        />
      )}
    </PageLayout>
  );
}
