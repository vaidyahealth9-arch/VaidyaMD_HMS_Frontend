'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  patientsApi,
  fertilityApi,
  treatmentCyclesApi,
  walletApi,
  billingApi,
  patientPackagesApi,
  andrologyApi,
  embryologyApi,
  opdApi,
  appointmentsApi,
  documentsApi,
  counselingApi,
  CounselingNote,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatCurrency } from '@/lib/utils';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import TreatmentCycleWizard from '@/components/fertility/TreatmentCycleWizard';

import FertilityWalletCard from '@/components/fertility/FertilityWalletCard';
import StatutoryConsentModal from '@/components/fertility/StatutoryConsentModal';
import OPUAspirationReportModal from '@/components/fertility/OPUAspirationReportModal';
import MasterEmbryologyRecordModal from '@/components/fertility/MasterEmbryologyRecordModal';
import EmbryoTransferDischargeModal from '@/components/fertility/EmbryoTransferDischargeModal';
import SpermPreparationModal from '@/components/fertility/SpermPreparationModal';
import SpermFreezingModal from '@/components/fertility/SpermFreezingModal';
import OPDWorkbench from '@/components/opd/OPDWorkbench';
import AndrologyDataEntry from '@/components/fertility/AndrologyDataEntry';
import MultiDocumentUploader from '@/components/common/MultiDocumentUploader';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import ClinicalHistoryProformaModal from '@/components/opd/ClinicalHistoryProformaModal';
import AddToOPDModal from '@/components/opd/AddToOPDModal';
import EditAlertsModal from '@/components/patients/EditAlertsModal';
import EditPatientDetailsModal from '@/components/patients/EditPatientDetailsModal';
import {
  Users,
  User,
  UserCheck,
  Clock,
  ClipboardList,
  ScanLine,
  Activity,
  FlaskConical,
  CreditCard,
  FileCheck,
  FolderOpen,
  Printer,
  Package,
  PackageCheck,
  Save,
  Upload,
  ExternalLink,
  Plus,
  X,
  AlertTriangle,
  Stethoscope,
  Pill,
  Check,
  Building2,
  Calendar,
  Camera,
  FileText,
  Trash2,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Mail,
  MapPin,
  Phone,
  HeartHandshake,
  Eye,
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

  // Link Partner Modal State
  const [showLinkPartnerModal, setShowLinkPartnerModal] = useState(false);
  const [showAddToOPDModal, setShowAddToOPDModal] = useState(false);
  const [showEditAlertsModal, setShowEditAlertsModal] = useState(false);
  const [showEditPatientModal, setShowEditPatientModal] = useState(false);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerSearchResults, setPartnerSearchResults] = useState<any[]>([]);
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [isLinkingPartner, setIsLinkingPartner] = useState(false);

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

  // Dues & Wallet
  const [duesInfo, setDuesInfo] = useState<any>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [patientPackages, setPatientPackages] = useState<any[]>([]);
  const [selectedRedeemPackage, setSelectedRedeemPackage] = useState<any>(null);
  const [selectedRedeemItem, setSelectedRedeemItem] = useState<any>(null);
  const [redeemQty, setRedeemQty] = useState(1);
  const [redeemNotes, setRedeemNotes] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showOpuModal, setShowOpuModal] = useState(false);
  const [showEmbryologyModal, setShowEmbryologyModal] = useState(false);
  const [showEtDischargeModal, setShowEtDischargeModal] = useState(false);
  const [showSpermPrepModal, setShowSpermPrepModal] = useState(false);
  const [showSpermFreezingModal, setShowSpermFreezingModal] = useState(false);
  const [showHistoryProforma, setShowHistoryProforma] = useState(false);
  const [counselingNotes, setCounselingNotes] = useState<CounselingNote[]>([]);
  const [viewingCounselingNote, setViewingCounselingNote] = useState<CounselingNote | null>(null);

  // Collapsible States & Photo Upload
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isCyclesCardExpanded, setIsCyclesCardExpanded] = useState(true);
  const [isDocUploadExpanded, setIsDocUploadExpanded] = useState(true);

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
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Treatment Cycles
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [isCreatingCycle, setIsCreatingCycle] = useState(false);
  const [cycleCalendar, setCycleCalendar] = useState<any>(null);
  const [addingMedDay, setAddingMedDay] = useState<number | null>(null);
  const [newMedForm, setNewMedForm] = useState({
    drug_name: '',
    dose: '',
    frequency: '',
    instructions: '',
  });
  const [isSavingMed, setIsSavingMed] = useState(false);
  // Partner Link & Unlink Handlers
  const handleUnlinkPartner = async () => {
    if (!partner) return;
    if (!confirm(`Are you sure you want to unlink ${partner.name} from ${patient?.name}? This will separate their medical charts into independent individual patients.`)) {
      return;
    }
    try {
      await patientsApi.unlinkPartner(patientId);
      alert(`Partner ${partner.name} unlinked successfully. Both patients are now independent individual records.`);
      setViewMode('individual');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to unlink partner');
    }
  };

  const handleSearchPartner = async (query: string) => {
    setPartnerSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setPartnerSearchResults([]);
      return;
    }
    setIsSearchingPartner(true);
    try {
      const res: any = await patientsApi.list({ search: query.trim(), per_page: 8 });
      const pts = (res?.patients || []).filter((p: any) => p.id !== patientId);
      setPartnerSearchResults(pts);
    } catch {
      setPartnerSearchResults([]);
    } finally {
      setIsSearchingPartner(false);
    }
  };

  const handleLinkPartner = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Link ${candidateName} as partner to ${patient?.name}?`)) return;
    setIsLinkingPartner(true);
    try {
      await patientsApi.linkPartner(patientId, candidateId);
      alert(`${candidateName} successfully linked as partner!`);
      setShowLinkPartnerModal(false);
      setPartnerSearchQuery('');
      setPartnerSearchResults([]);
      setViewMode('couple');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to link partner');
    } finally {
      setIsLinkingPartner(false);
    }
  };

  // Timeline
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Visits & Prescriptions State
  const [visitLogs, setVisitLogs] = useState<any[]>([]);

  // Investigations Tab Sub-states
  const [investigationGender, setInvestigationGender] = useState<'female' | 'male'>('female');
  const [activeSchemaType, setActiveSchemaType] = useState('follicular_scan');
  const [activeSchema, setActiveSchema] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<any>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);


  // Invoices Sub-states
  const [invoices, setInvoices] = useState<any[]>([]);

  // Consents & Documents State (Multi-document Upload Builder)
  const [selectedConsentDoc, setSelectedConsentDoc] = useState<any>(null);
  const [patientDocs, setPatientDocs] = useState<any[]>([]);


  const loadData = () => {
    setIsLoading(true);
    patientsApi.getCouple(patientId)
      .then((res: any) => {
        setPatient(res.primary_patient);
        setPartner(res.partner);

      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load patient data: ' + (err.message || 'Unknown error'));
      })
      .finally(() => setIsLoading(false));

    // Fetch dues
    fertilityApi.getDues(patientId)
      .then((d: any) => setDuesInfo(d))
      .catch((err) => console.error("Failed to load dues", err));

    // Fetch wallet
    walletApi.getWallet(patientId)
      .then((w: any) => setWalletInfo(w))
      .catch(() => { });

    // Fetch timeline
    patientsApi.getTimeline(patientId)
      .then((res: any) => setTimelineEvents(res.timeline || []))
      .catch((err) => console.error("Failed to load timeline", err));

    // Fetch cycles
    treatmentCyclesApi.list({ patient_id: patientId })
      .then((c: any) => {
        if (Array.isArray(c)) {
          setCycles(c);
          if (c.length > 0) {
            setActiveCycle(c[0]);
            treatmentCyclesApi.getCalendar(c[0].id)
              .then((cal: any) => setCycleCalendar(cal))
              .catch((err) => console.error("Failed to load calendar", err));
          }
        }
      })
      .catch((err) => console.error("Failed to load cycles", err));

    // Fetch both manual visits and OPD workbench consultations
    Promise.all([
      fertilityApi.getRecords(patientId, 'visit_consultation'),
      opdApi.getPatientConsultations(patientId).catch(() => [])
    ]).then(([fertilityVisits, opdVisits]) => {
      const allVisits = [...(fertilityVisits || []), ...(opdVisits || [])];
      // Sort by created_at desc
      allVisits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setVisitLogs(allVisits);
    }).catch((err) => console.error("Failed to load visits", err));

    // Fetch invoices
    billingApi.listInvoices({ patient_id: patientId })
      .then((inv: any) => setInvoices(inv || []))
      .catch((err) => console.error("Failed to load invoices", err));

    // Fetch patient treatment packages & quota allocations
    patientPackagesApi.listByPatient(patientId)
      .then((pkgs: any) => setPatientPackages(Array.isArray(pkgs) ? pkgs : []))
      .catch((err) => console.error("Failed to load patient packages", err));

    // Fetch patient documents
    documentsApi.list(patientId)
      .then((docs: any) => setPatientDocs(docs || []))
      .catch((err) => console.error("Failed to load documents", err));

    // Fetch counseling notes
    counselingApi.listNotes({ patient_id: patientId })
      .then((notes: any) => setCounselingNotes(notes || []))
      .catch((err) => console.error("Failed to load counseling notes", err));

    // Fetch patient appointments for active appointment & triage resolution
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
      .catch((err) => console.error("Failed to load patient appointments", err));
  };

  useEffect(() => {
    loadData();
  }, [patientId, user?.id]);

  // Load schema for investigation tab
  useEffect(() => {
    if (activeSchemaType) {
      const isMaleInvestigation = [
        'casa_semen_analysis', 'sperm_dfi', 'sperm_preparation', 'semen_freezing', 'surgical_sperm_retrieval'
      ].includes(activeSchemaType);
      const targetId = isMaleInvestigation ? (patient?.gender === 'male' ? patient.id : (partner?.id || patientId)) : patientId;

      fertilityApi.getSchema(activeSchemaType)
        .then((s: any) => setActiveSchema(s))
        .catch((err) => console.error("Failed to load schema", err));

      fertilityApi.getRecords(targetId, activeSchemaType)
        .then((res: any) => {
          if (res && res.length > 0) {
            setHistoryRecord(res[0]);
          } else {
            // Check andrology records for CASA semen analysis
            if (activeSchemaType === 'casa_semen_analysis') {
              andrologyApi.list({ patient_id: targetId }).then((andRes: any) => {
                if (andRes && andRes.length > 0) {
                  setHistoryRecord(andRes[0]);
                } else {
                  setHistoryRecord(null);
                }
              }).catch(() => setHistoryRecord(null));
            } else {
              setHistoryRecord(null);
            }
          }
        })
        .catch(() => { });
    }
  }, [activeSchemaType, patientId, partner?.id, patient?.gender]);

  const handleSaveInvestigation = async (formData: Record<string, unknown>) => {
    if (!user) return;
    setIsSavingRecord(true);
    try {
      const isMaleInvestigation = [
        'casa_semen_analysis', 'sperm_dfi', 'sperm_preparation', 'semen_freezing', 'surgical_sperm_retrieval'
      ].includes(activeSchemaType);
      const targetId = isMaleInvestigation ? (patient?.gender === 'male' ? patient.id : (partner?.id || patientId)) : patientId;

      await fertilityApi.saveRecord({
        patient_id: targetId,
        record_type: activeSchemaType,
        data: formData,
        created_by: user.id,
      });
      alert('Investigation record saved successfully!');
      fertilityApi.getRecords(targetId, activeSchemaType).then((res: any) => {
        if (res && res.length > 0) setHistoryRecord(res[0]);
      });
    } catch (e: any) {
      alert(e.message || 'Failed to save record');
    } finally {
      setIsSavingRecord(false);
    }
  };

  const handleRedeemService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRedeemPackage || !selectedRedeemItem) return;
    setIsRedeeming(true);
    try {
      await patientPackagesApi.consume(selectedRedeemPackage.id, {
        item_id: selectedRedeemItem.id,
        quantity: redeemQty,
        doctor_id: user?.id,
        notes: redeemNotes || `Redeemed ${redeemQty}x ${selectedRedeemItem.name}`,
      });
      alert(`Successfully redeemed ${redeemQty}x ${selectedRedeemItem.name}!`);
      setSelectedRedeemPackage(null);
      setSelectedRedeemItem(null);
      setRedeemQty(1);
      setRedeemNotes('');
      // Reload patient packages
      patientPackagesApi.listByPatient(patientId)
        .then((pkgs: any) => setPatientPackages(Array.isArray(pkgs) ? pkgs : []))
        .catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to redeem service');
    } finally {
      setIsRedeeming(false);
    }
  };




  const handleAddMedicationToCycle = async (dayNumber: number) => {
    if (!newMedForm.drug_name.trim() || !activeCycle) return;
    setIsSavingMed(true);
    try {
      const res = await treatmentCyclesApi.addMedication(activeCycle.id, {
        day_number: dayNumber,
        drug_name: newMedForm.drug_name,
        dose: newMedForm.dose,
        frequency: newMedForm.frequency,
        instructions: newMedForm.instructions,
      });
      if (res.days) {
        setCycleCalendar((prev: any) => ({ ...prev, days: res.days }));
      }
      setAddingMedDay(null);
      setNewMedForm({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to add medication');
    } finally {
      setIsSavingMed(false);
    }
  };





  const handleSendToOPD = () => {
    setShowAddToOPDModal(true);
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

  const hasPartner = !!partner;
  const femalePartner = patient.gender === 'female' ? patient : partner;
  const malePartner = patient.gender === 'male' ? patient : partner;

  const currentTabs = tabs.filter((t) => {
    if (t.id === 'andrology') {
      return patient.gender?.toLowerCase() === 'male' || hasPartner;
    }
    return true;
  }).map((t) => {
    if (t.id === 'overview') {
      return hasPartner
        ? { ...t, label: 'Couple 360', icon: Users }
        : { ...t, label: 'Patient 360', icon: Users };
    }
    return t;
  });

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* === FIXED / STICKY TOP PATIENT SUMMARY & TAB RAIL === */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm -mx-3 sm:-mx-6 -mt-6 px-4 sm:px-6 py-2.5 space-y-2">
        {/* Row 1: Compact Summary Bar (Default Collapsed View) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          {/* Left: Patient Name, Color-coded Gender, VID & Quick Stats */}
          <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
            {patient.photo_url ? (
              <img
                src={patient.photo_url}
                alt={patient.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-2xs flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-md bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] font-bold flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900 leading-none truncate">
                  {viewMode === 'couple' ? (
                    <>
                      {patient.name}
                      {hasPartner && <span className="text-slate-400 font-normal"> &amp; </span>}
                      {hasPartner && <span className="text-slate-800">{partner.name}</span>}
                    </>
                  ) : (
                    <span>{patient.name}</span>
                  )}
                </h1>
                <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                  {patient.vid}
                </span>

                {/* Color Coded Female Partner Badge */}
                {femalePartner && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                    <span className="text-rose-600 font-black text-sm leading-none">♀</span>
                    <span>{femalePartner.age ? `${femalePartner.age}y` : ''} · {femalePartner.blood_group || '—'}</span>
                  </span>
                )}

                {/* Color Coded Male Partner Badge */}
                {hasPartner && malePartner && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                    <span className="text-sky-600 font-black text-sm leading-none">♂</span>
                    <span>{malePartner.age ? `${malePartner.age}y` : ''} · {malePartner.blood_group || '—'}</span>
                  </span>
                )}

                {!hasPartner && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    Individual Patient
                  </span>
                )}

                {patient.phone && (
                  <span className="text-xs text-slate-500 font-mono hidden lg:inline">
                    📞 {patient.phone}
                  </span>
                )}

                {patient.treating_doctor_name && (
                  <span className="text-xs text-slate-500 hidden xl:inline">
                    Doctor: <strong className="text-slate-700">{patient.treating_doctor_name}</strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setShowEditAlertsModal(true)}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${patient.alert_notes?.length > 0
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                    }`}
                  title="Click to edit clinical alerts & allergies"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                  {patient.alert_notes?.length > 0 ? `${patient.alert_notes.length} Alerts (Edit)` : '+ Alert'}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions & Collapse/Expand Toggle */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center flex-wrap">

            {/* View Mode: Couple View vs Individual View Option */}
            {hasPartner && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('couple')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${viewMode === 'couple'
                      ? 'bg-white text-primary shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                  title="View combined Couple 360 overview"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Couple View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('individual')}
                  className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 ${viewMode === 'individual'
                      ? 'bg-white text-primary shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                    }`}
                  title="View individual patient record"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Individual View</span>
                </button>
              </div>
            )}

            {/* Jump to Partner's Chart */}
            {hasPartner && partner && (
              <Link
                href={`/patients/${partner.id}`}
                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1"
                title={`Open ${partner.name}'s individual medical record`}
              >
                <span>Switch to {partner.name} →</span>
              </Link>
            )}

            {/* Unlink Partner Button */}
            {hasPartner && partner && (
              <button
                type="button"
                onClick={handleUnlinkPartner}
                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1"
                title="Unlink partner and make both records separate"
              >
                <X className="w-3 h-3" />
                <span>Unlink</span>
              </button>
            )}

            {/* Link Partner Button (When Single / Unlinked) */}
            {!hasPartner && (
              <button
                type="button"
                onClick={() => setShowLinkPartnerModal(true)}
                className="px-2.5 py-1 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1"
                title="Link an existing patient as partner"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link Partner</span>
              </button>
            )}

            {activeCycle && (
              <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active: {activeCycle.cycle_id}
              </span>
            )}
            <button
              onClick={handleSendToOPD}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors shadow-2xs"
              title="Add this patient to today's OPD waiting queue in Appointments"
            >
              Add to Queue
            </button>
            <button
              type="button"
              onClick={() => setShowHistoryProforma(true)}
              className="px-2.5 py-1.5 bg-[#2878a8]/10 hover:bg-[#2878a8]/20 border border-[#2878a8]/30 text-[#2878a8] font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
              title="Open Clinical History Proforma (Fertility / Gynaecology / Obstetric)"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>History Proforma</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('workbench');
                router.replace(`/patients/${patientId}?tab=workbench`);
              }}
              className={`px-3 py-1.5 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5 ${activeTab === 'workbench'
                  ? 'bg-[rgb(var(--clr-primary))] text-white'
                  : 'bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.18)]'
                }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              OPD Workbench
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('billing');
                router.replace(`/patients/${patientId}?tab=billing`);
              }}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5"
              title="Open Fertility Advance Wallet & Financial Statement"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Wallet &amp; Billing</span>
            </button>

            {/* Expand / Collapse Header Details Toggle */}
            <button
              type="button"
              onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors flex items-center gap-1 shadow-2xs border border-slate-200/80"
              title={isHeaderExpanded ? 'Hide expanded details' : 'Show full details & photo'}
            >
              <span>{isHeaderExpanded ? 'Hide' : 'Details'}</span>
              {isHeaderExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Row 1.5: Notice when viewing in Individual Mode */}
        {hasPartner && viewMode === 'individual' && (
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-text-main">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span>
                <strong>Individual Patient View:</strong> Managing <strong>{patient.name}</strong> independently. Linked Partner: <strong>{partner.name}</strong> ({partner.vid}).
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('couple')}
                className="text-primary hover:underline font-bold text-xs"
              >
                Switch to Couple 360 View →
              </button>
              <span className="text-slate-300">|</span>
              <Link
                href={`/patients/${partner.id}`}
                className="text-sky-700 hover:underline font-bold text-xs"
              >
                Open {partner.name}&apos;s Chart →
              </Link>
            </div>
          </div>
        )}

        {/* Row 2: Expanded Header Details Drawer (When Opened) */}
        {isHeaderExpanded && (
          <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs animate-in fade-in slide-in-from-top-1">
            {/* Column 1: Patient Photo Preview & Upload/Change Action */}
            <div className="md:col-span-3 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 pr-0 md:pr-3">
              <div className="relative group flex-shrink-0">
                {patient.photo_url ? (
                  <img
                    src={patient.photo_url}
                    alt={patient.name}
                    className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold flex flex-col items-center justify-center text-xs">
                    <Camera className="w-5 h-5 text-primary mb-0.5" />
                    <span>No Photo</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-slate-800 text-xs">Patient Photo</p>
                <p className="text-[10px] text-slate-500">Upload profile image directly</p>
                <div className="flex flex-col gap-1.5 items-start">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-primary rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs">
                    <Camera className="w-3 h-3" />
                    <span>{isUploadingPhoto ? 'Uploading...' : patient.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                  </label>

                  {/* Update Patient Details Option below Upload Photo */}
                  <button
                    type="button"
                    onClick={() => setShowEditPatientModal(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/15 text-primary rounded text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Update Patient Details</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Column 2: Personal & Contact Information */}
            <div className="md:col-span-5 space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 pr-0 md:pr-3">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Contact &amp; Demographics</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <div><span className="text-slate-400 font-medium">DOB / Age:</span> <strong className="text-slate-700">{patient.dob || '—'} ({patient.age || '—'}y)</strong></div>
                <div><span className="text-slate-400 font-medium">Marital Status:</span> <strong className="text-slate-700 capitalize">{patient.marital_status || 'Married'}</strong></div>
                <div><span className="text-slate-400 font-medium">Phone:</span> <strong className="text-slate-700">{patient.phone || '—'}</strong></div>
                <div><span className="text-slate-400 font-medium">Email:</span> <strong className="text-slate-700">{patient.email || '—'}</strong></div>
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Address:</span> <span className="text-slate-700">{patient.address ? `${patient.address}, ` : ''}{patient.area || ''}{patient.city ? `, ${patient.city}` : ''}{patient.pincode ? ` - ${patient.pincode}` : ''}</span>
                </div>
                {patient.emergency_contact_name && (
                  <div className="col-span-2">
                    <span className="text-slate-400 font-medium">Emergency:</span> <span className="text-slate-700 font-semibold">{patient.emergency_contact_name} ({patient.emergency_contact_relation || 'Relation'}) · {patient.emergency_contact_phone || ''}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Referral & Hospital Doctor Info */}
            <div className="md:col-span-4 space-y-1.5">
              <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Hospital &amp; Referral Details</p>
              <div className="space-y-1 text-[11px]">
                <div><span className="text-slate-400 font-medium">Treating Doctor:</span> <strong className="text-slate-800">{patient.treating_doctor_name || 'Unassigned'}</strong></div>
                <div><span className="text-slate-400 font-medium">Referring Doctor:</span> <strong className="text-slate-800">{patient.referring_doctor || 'Direct / Walk-in'}</strong></div>
                <div><span className="text-slate-400 font-medium">Marketing Person:</span> <strong className="text-slate-800">{patient.marketing_person_name || 'None'}</strong></div>
                <div><span className="text-slate-400 font-medium">Registered:</span> <span className="text-slate-600">{formatDate(patient.created_at)}</span></div>
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-400 font-medium">Allergies &amp; Alerts:</span>
                    <button
                      type="button"
                      onClick={() => setShowEditAlertsModal(true)}
                      className="text-[10px] font-bold text-amber-800 hover:underline"
                    >
                      Edit Alerts
                    </button>
                  </div>
                  {patient.alert_notes?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {patient.alert_notes.map((a: string, i: number) => (
                        <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded">
                          {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">No alerts recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Tab Navigation Rail */}
        <div className="flex p-0.5 bg-slate-100/90 rounded-md overflow-x-auto gap-1">
          {currentTabs.map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  router.replace(`/patients/${patientId}?tab=${t.id}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap ${activeTab === t.id
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
              >
                <TabIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === TAB CONTENT AREA === */}
      <div>
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && (
          <div className="space-y-6 w-full">
            {/* Active Cycles Card (Collapsible) */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setIsCyclesCardExpanded(!isCyclesCardExpanded)}
                >
                  <h3 className="font-bold text-sm text-slate-900">Treatment Cycles Overview</h3>
                  <button type="button" className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
                    {isCyclesCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('treatment');
                    setIsCreatingCycle(true);
                    router.replace(`/patients/${patientId}?tab=treatment`);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Cycle</span>
                </button>
              </div>

              {isCyclesCardExpanded && (
                cycles.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No active or completed cycles on file.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cycles.map((c) => (
                      <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-primary">{c.cycle_id}</span>
                            <strong className="text-slate-900">{c.treatment_type} (Attempt #{c.attempt_number})</strong>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              {c.status}
                            </span>
                          </div>
                          <p className="text-slate-400 mt-1">Stimulation Start: {c.sentinel_dates?.stim_start || '—'} · OPU: {c.sentinel_dates?.opu || '—'}</p>
                        </div>
                        <button
                          onClick={() => { setActiveCycle(c); setActiveTab('treatment'); }}
                          className="font-bold text-primary hover:underline"
                        >
                          View Calendar →
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Advance Wallet Card */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">
                    Fertility Wallet / Financial Statement
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Live Ledger
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('billing');
                    router.replace(`/patients/${patientId}?tab=billing`);
                  }}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Open Full Billing Tab</span>
                  <span>→</span>
                </button>
              </div>

              <FertilityWalletCard
                patientId={patientId}
                patientName={patient?.name}
                patientVid={patient?.vid}
                invoices={invoices}
                onWalletUpdated={loadData}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* === TAB 1.5: TIMELINE === */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 w-full max-w-3xl mx-auto py-4">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500"><Clock className="w-5 h-5" /></div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Patient Journey Timeline</h2>
                <p className="text-xs text-slate-500">Chronological history of all touchpoints</p>
              </div>
            </div>

            <div className="relative border-l-2 border-primary/20 ml-4 space-y-8 pb-8">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="relative pl-6">
                  <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${ev.type === 'registration' ? 'bg-teal-500' :
                      ev.type === 'appointment' ? 'bg-primary' :
                        ev.type === 'clinical_record' ? 'bg-emerald-500' :
                          ev.type === 'treatment_cycle' ? 'bg-purple-600' :
                            ev.type === 'invoice' ? 'bg-accent' :
                              'bg-amber-500'
                    }`} />
                  <div className="bg-white border border-slate-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(ev.created_at)}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ev.type === 'registration' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                          ev.type === 'appointment' ? 'bg-primary/10 text-primary border border-primary/20' :
                            ev.type === 'clinical_record' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              ev.type === 'treatment_cycle' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                ev.type === 'invoice' ? 'bg-accent-light text-accent border border-accent/30' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {ev.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 capitalize">{ev.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 font-medium">{ev.description}</p>
                    {ev.type === 'appointment' && ev.metadata?.triage && (
                      <div className="mt-3 text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-lg text-slate-600 font-mono grid grid-cols-2 gap-2">
                        <span><strong className="text-slate-400">BP:</strong> {ev.metadata.triage.vitals?.bp}</span>
                        <span><strong className="text-slate-400">HR:</strong> {ev.metadata.triage.vitals?.hr}</span>
                        <span><strong className="text-slate-400">Temp:</strong> {ev.metadata.triage.vitals?.temp}</span>
                        <span><strong className="text-slate-400">Wt:</strong> {ev.metadata.triage.vitals?.weight}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <div className="pl-6 pt-4 text-sm text-slate-400 font-medium">No events recorded in timeline yet.</div>
              )}
            </div>
          </div>
        )}

        {/* === TAB 2: OPD CLINICAL WORKBENCH & RX === */}
        {activeTab === 'workbench' && (
          <div className="w-full bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <OPDWorkbench
              patientId={patientId}
              appointment={activeAppointment}
              triageData={activeAppointment?.metadata_?.triage || activeAppointment?.metadata?.triage}
              onBack={() => {
                setActiveTab('overview');
                router.replace(`/patients/${patientId}?tab=overview`);
                loadData();
              }}
            />
          </div>
        )}

        {/* === TAB 3: INVESTIGATIONS & USG === */}
        {activeTab === 'investigations' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => { setInvestigationGender('female'); setActiveSchemaType('follicular_scan'); }}
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${investigationGender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  ♀ Female Scans & Reports
                </button>
                <button
                  onClick={() => { setInvestigationGender('male'); setActiveSchemaType('casa_semen_analysis'); }}
                  className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${investigationGender === 'male' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                >
                  ♂ Male Diagnostic Reports
                </button>
              </div>

              <select
                value={activeSchemaType}
                onChange={(e) => setActiveSchemaType(e.target.value)}
                className="vmd-input text-xs font-bold text-slate-800 max-w-xs"
              >
                {investigationGender === 'female' ? (
                  <>
                    <option value="follicular_scan">Baseline Follicular Scan</option>
                    <option value="pelvic_organ_usg">Pelvic Organ Ultrasound</option>
                    <option value="sonohysterogram">Saline Infusion Sonohysterography (SIS)</option>
                    <option value="endometrial_assessment">Endometrial Receptivity Scan</option>
                    <option value="early_pregnancy_scan">Early Pregnancy USG Scan</option>
                  </>
                ) : (
                  <>
                    <option value="casa_semen_analysis">CASA Semen Analysis Report</option>
                    <option value="sperm_dfi">Sperm DNA Fragmentation (DFI)</option>
                    <option value="sperm_preparation">Sperm Preparation (Pre/Post Wash)</option>
                    <option value="semen_freezing">Semen Freezing Log</option>
                  </>
                )}
              </select>
            </div>

            {activeSchema && (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <DynamicForm
                  schema={activeSchema}
                  initialData={historyRecord?.data || {}}
                  onSave={handleSaveInvestigation}
                  isSaving={isSavingRecord}
                  userRole={user?.role || 'doctor'}
                />
              </div>
            )}
          </div>
        )}

        {/* === TAB 4: TREATMENT CYCLES === */}
        {activeTab === 'treatment' && (
          <div className="space-y-6 w-full">
            {isCreatingCycle ? (
              <div className="space-y-4 w-full animate-in fade-in">
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Initiate New Treatment Cycle</h2>
                      <p className="text-[11px] text-slate-500">Configure stimulation protocol, sentinel milestone dates &amp; gonadotropins</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCycle(false)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5 shadow-2xs border border-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel &amp; Return</span>
                  </button>
                </div>

                <TreatmentCycleWizard
                  patientId={patientId}
                  partnerId={partner?.id}
                  userId={user?.id || ''}
                  onCancel={() => setIsCreatingCycle(false)}
                  onSuccess={(newCycle) => {
                    setIsCreatingCycle(false);
                    loadData();
                    if (newCycle) {
                      setActiveCycle(newCycle);
                      treatmentCyclesApi.getCalendar(newCycle.id).then((cal: any) => setCycleCalendar(cal)).catch(() => { });
                    }
                  }}
                />
              </div>
            ) : activeCycle ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                        {activeCycle.cycle_id}
                      </span>
                      {cycles.length > 1 && (
                        <select
                          value={activeCycle.id}
                          onChange={(e) => {
                            const found = cycles.find((c) => c.id === e.target.value);
                            if (found) {
                              setActiveCycle(found);
                              treatmentCyclesApi.getCalendar(found.id).then((cal: any) => setCycleCalendar(cal)).catch(() => { });
                            }
                          }}
                          className="text-xs font-bold bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700 cursor-pointer"
                        >
                          {cycles.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.cycle_id} — {c.treatment_type} (Attempt #{c.attempt_number})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {activeCycle.treatment_type} Cycle (Attempt #{activeCycle.attempt_number})
                    </h2>
                    <p className="text-xs text-slate-500">Stimulation Start: {activeCycle.sentinel_dates?.stim_start || '—'} · OPU: {activeCycle.sentinel_dates?.opu || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowConsentModal(true)}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      title="Statutory Consent Forms"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Consents</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOpuModal(true)}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      title="Egg Retrieval / OPU Aspiration Report"
                    >
                      <Activity className="w-3.5 h-3.5 text-purple-600" />
                      <span>OPU Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEmbryologyModal(true)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      title="Master Embryology & Insemination Form"
                    >
                      <FlaskConical className="w-3.5 h-3.5 text-primary" />
                      <span>Embryology Form</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEtDischargeModal(true)}
                      className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      title="Embryo Transfer Discharge Protocol"
                    >
                      <Users className="w-3.5 h-3.5 text-pink-600" />
                      <span>ET Protocol</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCycle(true)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Cycle</span>
                    </button>
                    <button
                      onClick={() => router.push(`/ivf-lab?cycle_id=${activeCycle.id}`)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors shadow-sm flex items-center gap-1"
                    >
                      <span>IVF Lab →</span>
                    </button>
                  </div>
                </div>

                {/* Day by Day Timetable */}
                {cycleCalendar && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900">Day-by-Day Stimulation Timetable</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {cycleCalendar.days?.map((d: any) => (
                        <div
                          key={d.day_number}
                          className={`p-3 rounded-lg border ${d.milestone ? 'border-accent/40 bg-accent-light/50 shadow-sm' : 'border-slate-200 bg-white'
                            }`}
                        >
                          <div className="flex items-center justify-between border-b pb-1 mb-1">
                            <span className="font-bold text-xs text-slate-800">{d.display_date}</span>
                            <span className="text-[10px] text-slate-400">{d.day_of_week}</span>
                          </div>
                          {d.milestone && <p className="text-xs font-bold text-primary-mid mb-1">{d.milestone}</p>}
                          {d.medications?.map((m: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-1.5 rounded text-[11px] font-medium text-slate-700 mt-1">
                              <strong>{m.drug_name}</strong> — {m.dose} ({m.frequency})
                              {m.instructions && <span className="block text-[10px] text-slate-400">{m.instructions}</span>}
                            </div>
                          ))}

                          {addingMedDay === d.day_number ? (
                            <div className="mt-2 p-2 bg-surface-muted rounded-md border border-primary/20 space-y-2 text-xs">
                              <input
                                type="text"
                                placeholder="Drug name (e.g. Inj. Recagon 225 IU)"
                                value={newMedForm.drug_name}
                                onChange={(e) => setNewMedForm({ ...newMedForm, drug_name: e.target.value })}
                                className="vmd-input text-xs py-1 px-2 w-full font-bold"
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Dose"
                                  value={newMedForm.dose}
                                  onChange={(e) => setNewMedForm({ ...newMedForm, dose: e.target.value })}
                                  className="vmd-input text-xs py-1 px-2 w-1/2"
                                />
                                <select
                                  value={newMedForm.frequency}
                                  onChange={(e) => setNewMedForm({ ...newMedForm, frequency: e.target.value })}
                                  className="vmd-input text-xs py-1 px-2 w-1/2"
                                >
                                  <option value="OD">OD</option>
                                  <option value="BD">BD</option>
                                  <option value="TDS">TDS</option>
                                  <option value="Stat">Stat</option>
                                  <option value="SOS">SOS</option>
                                </select>
                              </div>
                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setAddingMedDay(null)}
                                  className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingMed || !newMedForm.drug_name.trim()}
                                  onClick={() => handleAddMedicationToCycle(d.day_number)}
                                  className="px-2.5 py-1 text-[10px] font-bold bg-primary text-white rounded-lg hover:bg-primary-mid transition-colors shadow-sm disabled:opacity-50"
                                >
                                  {isSavingMed ? 'Adding...' : 'Add'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingMedDay(d.day_number);
                                setNewMedForm({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
                              }}
                              className="w-full mt-2 py-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-dashed border-primary/20 transition-colors"
                            >
                              + Add Medication
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
                <Activity className="w-8 h-8 text-primary mx-auto opacity-70" />
                <h3 className="text-sm font-bold text-slate-800">No Treatment Cycle Active</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No active IVF, ICSI, or IUI treatment cycle is currently recorded for this patient. Start a new cycle to configure stimulation protocols, sentinel milestones, and medication timetables.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingCycle(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-white rounded-md font-bold text-xs transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Cycle</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* === TAB 5: EMBEDDED ANDROLOGY === */}
        {activeTab === 'andrology' && (
          <div className="space-y-6 w-full">
            <AndrologyDataEntry patientId={malePartner?.id || patient.id} patientName={malePartner?.name || patient.name} />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowSpermPrepModal(true)}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 rounded-md font-bold text-xs transition-colors"
              >
                + Semen Wash &amp; IUI
              </button>
              <button
                type="button"
                onClick={() => setShowSpermFreezingModal(true)}
                className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary-mid border border-primary/20 rounded-md font-bold text-xs transition-colors"
              >
                + Semen Freezing
              </button>
            </div>
          </div>
        )}

        {/* === TAB 6: BILLING & WALLET === */}
        {activeTab === 'billing' && (
          <div className="space-y-6 w-full">
            <FertilityWalletCard
              patientId={patientId}
              patientName={patient?.name}
              patientVid={patient?.vid}
              invoices={invoices}
              onWalletUpdated={loadData}
              compact={false}
            />

            {/* Treatment Packages & Service Quotas */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-primary" />
                    Treatment Packages &amp; Service Quotas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track bundled clinical procedures, remaining scan/lab quotas, and log service redemptions
                  </p>
                </div>
                <Link
                  href="/billing?tab=packages"
                  className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Bill New Package
                </Link>
              </div>

              {patientPackages.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No Treatment Packages Subscribed Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When a bundled package (e.g. IVF-ICSI, IUI, Surrogacy) is billed, its service quotas will appear here for 1-click redemption.
                  </p>
                  <Link
                    href="/billing?tab=packages"
                    className="inline-block mt-3 text-xs text-primary font-bold hover:underline"
                  >
                    View Available Treatment Bundles →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientPackages.map((pkg) => {
                    const totalAllocated = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.total_qty || 0), 0);
                    const totalRemaining = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.remaining_qty || 0), 0);
                    const totalConsumed = (pkg.items || []).reduce((acc: number, it: any) => acc + (it.consumed_qty || 0), 0);
                    const progressPct = totalAllocated > 0 ? Math.round((totalConsumed / totalAllocated) * 100) : 0;

                    return (
                      <div key={pkg.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
                        {/* Package Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{pkg.package_name}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                pkg.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-700'
                              }`}>
                                {pkg.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Subscribed on {formatDate(pkg.created_at)} · Base Package Value: <span className="font-mono font-semibold text-slate-700">{formatCurrency(pkg.total_price || 0)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overall Quota</span>
                              <span className="text-xs font-mono font-bold text-slate-700">
                                {totalConsumed} / {totalAllocated} Used ({totalRemaining} Left)
                              </span>
                            </div>
                            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Quotas Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {(pkg.items || []).map((it: any) => {
                            const isAvailable = (it.remaining_qty || 0) > 0;
                            const itemPct = it.total_qty > 0 ? Math.round((it.consumed_qty / it.total_qty) * 100) : 0;

                            return (
                              <div
                                key={it.id}
                                className={`bg-white border rounded-lg p-3 space-y-2.5 transition-all ${
                                  isAvailable ? 'border-slate-200 hover:border-primary/40 shadow-xs' : 'border-slate-200/60 opacity-75'
                                }`}
                              >
                                <div className="flex justify-between items-start gap-1">
                                  <div className="space-y-0.5 min-w-0">
                                    <h5 className="text-xs font-bold text-slate-800 truncate" title={it.name}>
                                      {it.name}
                                    </h5>
                                    {it.service_code && (
                                      <span className="text-[10px] font-mono text-slate-400">[{it.service_code}]</span>
                                    )}
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                                    isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                                  }`}>
                                    {it.remaining_qty} / {it.total_qty} left
                                  </span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                                    <span>Consumed: {it.consumed_qty}</span>
                                    <span>Total: {it.total_qty}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${
                                        isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                                      }`}
                                      style={{ width: `${itemPct}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="text-[10px] font-mono text-slate-400">
                                    Value: {formatCurrency(it.unit_price || 0)}
                                  </span>
                                  {isAvailable ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedRedeemPackage(pkg);
                                        setSelectedRedeemItem(it);
                                        setRedeemQty(1);
                                        setRedeemNotes('');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-md transition-colors shadow-2xs flex items-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Redeem
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400 italic">Fully Utilized</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Recent History for this package */}
                        {(() => {
                          const allHistories = (pkg.items || []).flatMap((it: any) =>
                            (it.history || []).map((h: any) => ({ ...h, itemName: it.name }))
                          ).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                          if (allHistories.length === 0) return null;

                          return (
                            <div className="pt-2 border-t border-slate-200">
                              <details className="text-xs group">
                                <summary className="cursor-pointer text-[11px] font-bold text-slate-500 hover:text-slate-800 select-none flex items-center gap-1.5">
                                  <span>View Consumption Audit Trail ({allHistories.length} redemptions)</span>
                                </summary>
                                <div className="mt-2 space-y-1 max-h-36 overflow-y-auto pr-1">
                                  {allHistories.slice(0, 10).map((hist: any, hIdx: number) => (
                                    <div key={hIdx} className="flex justify-between items-center text-[11px] bg-white p-2 rounded border border-slate-100">
                                      <div>
                                        <span className="font-semibold text-slate-800">{hist.itemName}</span>
                                        <span className="text-slate-400 ml-1.5">({hist.consumed_qty}x)</span>
                                        <span className="text-slate-500 ml-2 italic">— {hist.notes || 'Routine utilization'}</span>
                                      </div>
                                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                        {formatDate(hist.timestamp)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Patient Billing & Invoices</h3>
                <Link href="/billing" className="text-xs text-primary font-bold hover:underline">
                  Open Billing Hub →
                </Link>
              </div>

              {invoices.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No invoices on file for this patient.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Paid Amount</th>
                      <th className="p-3">Pending Due</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-primary">{inv.invoice_number}</td>
                        <td className="p-3">{inv.appointment_source}</td>
                        <td className="p-3 font-bold">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                        <td className="p-3 text-emerald-700 font-bold">₹{parseFloat(inv.paid_amount).toLocaleString()}</td>
                        <td className="p-3 text-rose-700 font-bold">₹{parseFloat(inv.pending_due).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* === TAB 7: DOCUMENTS & CONSENTS === */}
        {activeTab === 'documents' && (
          <div className="space-y-6 w-full">
            {/* Upload New Report Form */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><FolderOpen className="w-4 h-4 text-slate-600" /> Patient Documents & Investigation Reports</h2>
                  <p className="text-xs text-slate-500">Upload or link lab reports, scan images, consent forms, and regulatory documents</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <span className="flex items-center gap-1.5"><FileCheck className="w-3.5 h-3.5 text-amber-700" /> Digital ART Consent (Forms 8, 11, 13, 15)</span>
                </button>
              </div>

              {/* Multi-Document Upload Builder (Extracted Component) */}
              <MultiDocumentUploader
                primaryPatientId={patient.id}
                primaryPatientName={patient.name}
                partnerId={partner?.id}
                partnerName={partner?.name}
                onUploadComplete={loadData}
              />

              {/* Documents List */}
              {patientDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {patientDocs.map((doc: any) => (
                    <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-primary/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 flex-1 leading-tight">{doc.file_name}</p>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Delete this document record?')) return;
                            await documentsApi.delete(doc.id);
                            setPatientDocs((prev) => prev.filter((d: any) => d.id !== doc.id));
                          }}
                          className="text-rose-400 hover:text-rose-600 text-xs font-bold flex-shrink-0"
                          title="Remove"
                        ><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.category === 'report' ? 'bg-info-bg text-info' :
                            doc.category === 'scan' ? 'bg-purple-100 text-purple-800' :
                              doc.category === 'consent' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-100 text-slate-600'
                          }`}>
                          {doc.category?.toUpperCase()}
                        </span>
                        {hasPartner && doc.patient_id === partner?.id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                            Partner: {partner.name}
                          </span>
                        )}
                        {hasPartner && doc.patient_id === patient?.id && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            Self: {patient.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(doc.created_at).toLocaleDateString('en-IN')}</p>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-primary hover:text-primary-mid font-bold underline block truncate"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline mr-1" /> Open / View Document
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No documents on file. Use the form above to register investigation reports, scan images, or consent forms.
                </div>
              )}
            </div>
          </div>
        )}

        {/* === TAB: COUNSELOR NOTES === */}
        {activeTab === 'counseling' && (
          <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2">
            {/* Header / Summary Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">Pre-ART Clinical Counseling Sessions</h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-mono">
                        {counselingNotes.length} Record{counselingNotes.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Standard 8-point fertility counseling record: Source, Procedure, Egg pick up, Discussion, Laparoscopy/hysteroscopy, Egg transfer, Remarks &amp; Signature.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/counseling"
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Open Counselor Portal</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Sessions Case Sheet List */}
            {counselingNotes.length > 0 ? (
              <div className="space-y-4">
                {counselingNotes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="bg-white border border-slate-200 hover:border-violet-300 rounded-xl p-5 shadow-sm transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center font-mono">
                          #{counselingNotes.length - idx}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{note.procedure || 'Pre-ART Consultation'}</span>
                            <span className="text-xs px-2 py-0.5 rounded font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              Source: {note.source || 'Direct'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Session Date: <strong className="text-slate-700">{formatDate(note.created_at)}</strong> · Counselor: <strong className="text-slate-700">{note.counselor_name || 'Counselor'}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingCounselingNote(note)}
                          className="px-3 py-1.5 text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-md transition-colors flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Case Sheet</span>
                        </button>
                      </div>
                    </div>

                    {/* 8 Columns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">1. Source</span>
                        <p className="font-semibold text-slate-800">{note.source || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">2. Procedure</span>
                        <p className="font-semibold text-violet-900">{note.procedure || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">3. Egg Pick Up</span>
                        <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.egg_pick_up || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 md:col-span-2 lg:col-span-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">4. Discussion</span>
                        <p className="text-slate-800 whitespace-pre-line leading-relaxed">{note.discussion || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">5. Laparoscopy / Hysteroscopy / Etc</span>
                        <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.laparoscopy_hysteroscopy || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">6. Egg Transfer</span>
                        <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.egg_transfer || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">7. Remarks</span>
                        <p className="text-slate-700 whitespace-pre-line line-clamp-3">{note.remarks || '—'}</p>
                      </div>
                    </div>

                    {/* Signature Footer */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">8. Counselor Attestation &amp; Signature:</span>
                        <span className="font-serif italic font-bold text-slate-900 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                          {note.signature || 'Digital Sign-off'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Recorded by {note.counselor_name || 'Counselor'} · {formatDate(note.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-700 text-sm">No Counseling Sessions Recorded</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pre-ART counseling notes recorded by the counselor desk will automatically appear here for the medical team and treating doctor.
                </p>
                <Link
                  href="/counseling"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md text-xs font-bold transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Go to Counselor Desk</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>





      {showConsentModal && (
        <StatutoryConsentModal
          patient={patient}
          partner={partner}
          cycle={cycles?.[0]}
          onClose={() => setShowConsentModal(false)}
          onConsentSaved={() => {
            documentsApi.list(patientId).then((docs: any) => setPatientDocs(docs || []));
            loadData();
          }}
        />
      )}

      {/* OPU Aspiration Report Modal */}
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

      {/* Master Embryology Record Modal */}
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

      {/* Embryo Transfer Discharge Modal */}
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

      {/* Sperm Preparation & IUI Wash Modal */}
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

      {/* Sperm Cryopreservation Freezing Modal */}
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

      {/* Link Existing Patient as Partner Modal */}
      {showLinkPartnerModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900">Link Existing Patient as Partner</h3>
                <p className="text-xs text-slate-500">Search and link a partner to {patient?.name} ({patient?.vid})</p>
              </div>
              <button onClick={() => setShowLinkPartnerModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Search by Name, Phone, or VID</label>
                <input
                  type="text"
                  value={partnerSearchQuery}
                  onChange={(e) => handleSearchPartner(e.target.value)}
                  placeholder="e.g. Rahul, +91-98765, VH-VMD-00002"
                  className="vmd-input text-xs"
                  autoFocus
                />
              </div>

              {isSearchingPartner && (
                <div className="py-4 text-center text-xs text-slate-500">Searching patients...</div>
              )}

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {partnerSearchResults.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 border border-slate-200 rounded-lg hover:border-primary/40 hover:bg-accent-light/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {p.vid}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                          {p.gender} · {p.age ? `${p.age}y` : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.phone} {p.area ? `· ${p.area}` : ''}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isLinkingPartner}
                      onClick={() => handleLinkPartner(p.id, p.name)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-bold shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      {isLinkingPartner ? 'Linking...' : 'Link as Partner'}
                    </button>
                  </div>
                ))}
                {!isSearchingPartner && partnerSearchQuery.length >= 2 && partnerSearchResults.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-400">
                    No matching patients found. Ensure the partner is registered first.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowLinkPartnerModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add To OPD Queue Modal */}
      <AddToOPDModal
        open={showAddToOPDModal}
        onClose={() => setShowAddToOPDModal(false)}
        patient={patient}
      />

      {/* Edit Clinical Alerts Modal */}
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

      {/* 8-Point Counselor Notes Case Sheet Modal */}
      {viewingCounselingNote && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs print:p-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-violet-50/80 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-violet-600 text-white flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Pre-ART Clinical Counseling Case Sheet</h3>
                    <span className="bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {viewingCounselingNote.procedure || 'Procedure Note'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-800">{patient?.name || viewingCounselingNote.patient_name || 'Patient'}</strong> ({patient?.vid || viewingCounselingNote.patient_vid || '—'}) · Session: {formatDate(viewingCounselingNote.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingCounselingNote(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: The 8 Clinical Columns */}
            <div className="printable-document p-4 sm:p-6 overflow-y-auto space-y-4 text-xs print:overflow-visible print:p-0">
              <PrintableReportHeader
                title="PRE-ART CLINICAL COUNSELING RECORD"
                subtitle="VaidyaMD Reproductive Medicine • Patient Counseling & Informed Dialogue"
                patient={{
                  name: patient?.name || viewingCounselingNote.patient_name,
                  vid: patient?.vid || viewingCounselingNote.patient_vid,
                  age: patient?.age,
                  gender: patient?.gender || 'Female',
                  partner_name: patient?.partner_name,
                }}
                metaFields={[
                  { label: 'Procedure', value: viewingCounselingNote.procedure || '—' },
                  { label: 'Date', value: formatDate(viewingCounselingNote.created_at) },
                  { label: 'Source', value: viewingCounselingNote.source || 'OPD' },
                  { label: 'Counselor', value: viewingCounselingNote.counselor_name || 'Counselor Specialist' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">1. Source</span>
                  <p className="font-bold text-slate-800 text-sm">{viewingCounselingNote.source || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">2. Procedure</span>
                  <p className="font-bold text-violet-800 text-sm">{viewingCounselingNote.procedure || '—'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">3. Egg Pick Up</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.egg_pick_up || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">4. Discussion</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.discussion || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">5. Laparoscopy / Hysteroscopy / Etc</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.laparoscopy_hysteroscopy || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">6. Egg Transfer</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.egg_transfer || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">7. Remarks</span>
                <p className="text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                  {viewingCounselingNote.remarks || '—'}
                </p>
              </div>

              {/* Signature & Counselor Sign-off Card */}
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-lg flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-violet-700 block">8. Counselor Signature &amp; Attestation</span>
                  <p className="text-sm font-bold font-serif italic text-slate-900 mt-0.5">
                    {viewingCounselingNote.signature || 'Digital Sign-off'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">{viewingCounselingNote.counselor_name || 'Counselor Specialist'}</p>
                  <p className="text-[10px] text-slate-500">Reproductive Counselor · VaidyaMD</p>
                </div>
              </div>
              {/* Dynamic Branch Footer */}
              <PrintableReportFooter
                signatoryTitle={viewingCounselingNote.counselor_name || 'Counselor Specialist'}
                signatorySubtitle="Authorized ART Counselor Signature"
                showSignatory={true}
                showComputerGeneratedNotice={true}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Case Sheet</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingCounselingNote(null)}
                className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinical History Proforma Modal */}
      {showHistoryProforma && (
        <ClinicalHistoryProformaModal
          patient={patient}
          partner={partner}
          onClose={() => setShowHistoryProforma(false)}
          onSaved={loadData}
        />
      )}

      {/* Update Patient Details Modal */}
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

      {/* Service Quota Redemption Modal */}
      {selectedRedeemPackage && selectedRedeemItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  Redeem Package Service
                </h3>
                <p className="text-[11px] text-slate-500">{selectedRedeemPackage.package_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedRedeemPackage(null);
                  setSelectedRedeemItem(null);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemService} className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-950">{selectedRedeemItem.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {selectedRedeemItem.remaining_qty} remaining
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Pre-paid under treatment bundle. Redeeming this will decrement quota with ₹0 invoice fee.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantity to Deduct *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedRedeemItem.remaining_qty || 1}
                  value={redeemQty}
                  onChange={(e) => setRedeemQty(Math.min(selectedRedeemItem.remaining_qty || 1, Math.max(1, Number(e.target.value))))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Clinical Notes / Indication</label>
                <textarea
                  rows={2}
                  value={redeemNotes}
                  onChange={(e) => setRedeemNotes(e.target.value)}
                  placeholder="e.g. Day 8 follicular scan, endometrium 8.2mm triple line"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRedeemPackage(null);
                    setSelectedRedeemItem(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isRedeeming ? 'Deducting...' : 'Confirm & Deduct Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
