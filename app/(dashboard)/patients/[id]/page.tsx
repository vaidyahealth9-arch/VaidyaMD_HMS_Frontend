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
  andrologyApi,
  embryologyApi,
  opdApi,
  appointmentsApi,
  documentsApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatCurrency } from '@/lib/utils';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import TreatmentCycleWizard from '@/components/fertility/TreatmentCycleWizard';
import PrintablePrescription from '@/components/common/PrintablePrescription';

const tabs = [
  { id: 'overview', label: 'Couple 360', icon: '👫' },
  { id: 'timeline', label: 'Timeline', icon: '🕒' },
  { id: 'visits', label: 'Visits & Rx', icon: '📋' },
  { id: 'investigations', label: 'Investigations & USG', icon: '🔬' },
  { id: 'treatment', label: 'Treatment Cycles', icon: '🧫' },
  { id: 'andrology', label: 'Andrology Lab', icon: '🧪' },
  { id: 'billing', label: 'Billing & Wallet', icon: '💰' },
  { id: 'documents', label: 'Consents & Docs', icon: '📁' },
];

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const patientId = params.id as string;

  const tabFromUrl = searchParams.get('tab');
  const [patient, setPatient] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  // Dues & Wallet
  const [duesInfo, setDuesInfo] = useState<any>(null);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('25000');
  const [depositMode, setDepositMode] = useState('upi');

  // Treatment Cycles
  const [cycles, setCycles] = useState<any[]>([]);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [showNewCycleModal, setShowNewCycleModal] = useState(false);
  const [cycleCalendar, setCycleCalendar] = useState<any>(null);
  const [addingMedDay, setAddingMedDay] = useState<number | null>(null);
  const [newMedForm, setNewMedForm] = useState({ drug_name: '', dose: '1 tab', frequency: 'OD', instructions: '' });
  const [isSavingMed, setIsSavingMed] = useState(false);

  // Timeline
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Visits & Prescriptions State
  const [visitLogs, setVisitLogs] = useState<any[]>([]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [printablePrescription, setPrintablePrescription] = useState<any>(null);
  const [visitForm, setVisitForm] = useState({
    visit_type: 'Consultation Visit',
    seen_by: '',
    chief_complaint: '',
    history_of_illness: '',
    past_medical_history: '',
    vitals_bp: '',
    vitals_pulse: '',
    vitals_weight: '',
    provisional_diagnosis: '',
    summary: '',
    wife_investigations: [] as string[],
    husband_investigations: [] as string[],
    wife_medications: [] as any[],
    husband_medications: [] as any[],
    patient_medications: [] as any[],
    next_follow_up: 'Review in 1 week with lab reports',
    visit_date: new Date().toISOString().split('T')[0],
  });

  // Investigations Tab Sub-states
  const [investigationGender, setInvestigationGender] = useState<'female' | 'male'>('female');
  const [activeSchemaType, setActiveSchemaType] = useState('follicular_scan');
  const [activeSchema, setActiveSchema] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<any>(null);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

interface AndrologyFormData {
  collection_date: string;
  abstinence_days: number | string;
  volume_ml: number | string;
  liquefaction_time_min: number | string;
  ph: number | string;
  pre_conc_million_ml: number | string;
  total_motility_pct: number | string;
  progressive_motility_pct: number | string;
  normal_forms_pct: number | string;
  dfi_total_pct: number | string;
  impression: string;
}

  // Embedded Andrology Sub-states
  const [andrologyForm, setAndrologyForm] = useState<AndrologyFormData>({
    collection_date: new Date().toISOString().split('T')[0],
    abstinence_days: 3,
    volume_ml: '',
    liquefaction_time_min: '',
    ph: '',
    pre_conc_million_ml: '',
    total_motility_pct: '',
    progressive_motility_pct: '',
    normal_forms_pct: '',
    dfi_total_pct: '',
    impression: '',
  });
  const [isSavingAndrology, setIsSavingAndrology] = useState(false);
  const [andrologyHistory, setAndrologyHistory] = useState<any[]>([]);

  // Invoices Sub-states
  const [invoices, setInvoices] = useState<any[]>([]);

  // Consents & Documents State
  const [selectedConsentDoc, setSelectedConsentDoc] = useState<any>(null);
  const [patientDocs, setPatientDocs] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadDocForm, setUploadDocForm] = useState({ file_name: '', file_path: '', category: 'report' });

  const loadData = () => {
    setIsLoading(true);
    patientsApi.getCouple(patientId)
      .then((res: any) => {
        setPatient(res.primary_patient);
        setPartner(res.partner);
        if (res.primary_patient?.treating_doctor_name && user) {
          setVisitForm((prev) => ({ ...prev, seen_by: user.name }));
        }

        // Fetch Male Partner Andrology Record if available
        const maleId = res.primary_patient?.gender === 'male' ? res.primary_patient.id : (res.partner?.gender === 'male' ? res.partner?.id : null);
        if (maleId) {
          andrologyApi.list({ patient_id: maleId }).then((andRes: any) => {
            if (andRes && andRes.length > 0) {
              setAndrologyHistory(andRes);
              if (andRes[0].data) {
                setAndrologyForm((prev: AndrologyFormData) => ({ ...prev, ...andRes[0].data }));
              }
            }
          }).catch((err) => console.error("Failed to load andrology data", err));
        }
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
      .catch(() => {});

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

    // Fetch patient documents
    documentsApi.list(patientId)
      .then((docs: any) => setPatientDocs(docs || []))
      .catch((err) => console.error("Failed to load documents", err));
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
        .catch(() => {});
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

  const handleSaveAndrologyDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    const maleId = patient?.gender === 'male' ? patient.id : partner?.id;
    if (!maleId || !user) {
      alert('No male partner linked to record andrology data.');
      return;
    }
    setIsSavingAndrology(true);
    try {
      await andrologyApi.create({
        patient_id: maleId,
        record_type: 'casa_semen_analysis',
        data: andrologyForm,
        created_by: user.id,
      });
      alert('CASA Semen Analysis diagnostic report saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save andrology report');
    } finally {
      setIsSavingAndrology(false);
    }
  };

  const handleAddMedication = (target: 'wife' | 'husband' | 'patient') => {
    if (target === 'wife') {
      setVisitForm({
        ...visitForm,
        wife_medications: [...visitForm.wife_medications, { drug: '', dose: '1 tab', route: 'Oral', freq: 'OD', duration: '10 days', instructions: 'After meals' }],
      });
    } else if (target === 'husband') {
      setVisitForm({
        ...visitForm,
        husband_medications: [...visitForm.husband_medications, { drug: '', dose: '1 tab', route: 'Oral', freq: 'OD', duration: '30 days', instructions: 'After meals' }],
      });
    } else {
      setVisitForm({
        ...visitForm,
        patient_medications: [...visitForm.patient_medications, { drug: '', dose: '1 tab', route: 'Oral', freq: 'OD', duration: '10 days', instructions: 'After meals' }],
      });
    }
  };

  const handleRemoveMedication = (target: 'wife' | 'husband' | 'patient', idx: number) => {
    if (target === 'wife') {
      setVisitForm({
        ...visitForm,
        wife_medications: visitForm.wife_medications.filter((_, i) => i !== idx),
      });
    } else if (target === 'husband') {
      setVisitForm({
        ...visitForm,
        husband_medications: visitForm.husband_medications.filter((_, i) => i !== idx),
      });
    } else {
      setVisitForm({
        ...visitForm,
        patient_medications: visitForm.patient_medications.filter((_, i) => i !== idx),
      });
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

  const handleSaveVisit = async (e?: React.FormEvent, andPrint = false) => {
    if (e) e.preventDefault();
    if (!user) return;
    try {
      const saved = await fertilityApi.saveRecord({
        patient_id: patientId,
        record_type: 'visit_consultation',
        data: {
          ...visitForm,
          seen_by: visitForm.seen_by || user.name,
        },
        created_by: user.id,
      });

      // Auto-Link to Billing if investigations were ordered
      const allInvs = [...visitForm.wife_investigations, ...visitForm.husband_investigations];
      if (allInvs.length > 0) {
        await billingApi.createInvoice({
          patient_id: patientId,
          appointment_source: 'Lab',
          reason_for_attendance: `Consultation Investigations: ${allInvs.join(', ')}`,
          items: allInvs.map((inv) => ({
            description: inv,
            quantity: 1,
            unit_price: 1500,
            total: 1500,
          })),
          payment_method: 'pending',
          created_by: user.id,
        }).catch(() => {});
      }

      setVisitLogs((prev) => [saved, ...prev]);
      setShowVisitModal(false);

      if (andPrint) {
        setPrintablePrescription({
          patient,
          doctor: { name: visitForm.seen_by || user.name },
          visitDate: visitForm.visit_date,
          chiefComplaint: visitForm.chief_complaint,
          hopi: visitForm.history_of_illness,
          pastHistory: visitForm.past_medical_history,
          vitals: {
            bp: visitForm.vitals_bp,
            pulse: visitForm.vitals_pulse,
            weight: visitForm.vitals_weight,
          },
          diagnosis: visitForm.provisional_diagnosis,
          medications: hasPartner ? visitForm.wife_medications : (visitForm.patient_medications.length > 0 ? visitForm.patient_medications : visitForm.wife_medications),
          partnerMedications: hasPartner ? visitForm.husband_medications : [],
          partnerName: partner?.name,
          advice: visitForm.summary,
          nextFollowUp: visitForm.next_follow_up,
        });
      } else {
        alert('Consultation visit saved and prescription recorded!');
      }

      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save consultation');
    }
  };

  const handleDepositWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await walletApi.deposit({
        patient_id: patientId,
        amount: parseFloat(depositAmount) || 0,
        payment_mode: depositMode,
        notes: 'Patient Advance Deposit at Front Desk',
        created_by: user.id,
      });
      setShowDepositModal(false);
      walletApi.getWallet(patientId).then((w: any) => setWalletInfo(w)).catch(() => {});
      alert(`Successfully credited ₹${depositAmount} to Advance Wallet!`);
    } catch (err: any) {
      alert(err.message || 'Deposit failed');
    }
  };

  const handleSendToOPD = async () => {
    if (!user || !patient) return;
    try {
      await appointmentsApi.create({
        patient_id: patientId,
        doctor_id: patient.treating_doctor_id || user.id,
        department: 'OPD',
        scheduled_at: new Date().toISOString(),
        visit_type: 'consultation',
        status: 'waiting',
      });
      alert('Patient successfully added to OPD Queue for today!');
    } catch (err: any) {
      alert(err.message || 'Failed to add to OPD Queue');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">Patient not found</p>
        <Link href="/patients" className="text-indigo-600 font-bold text-sm">← Back to Patient Directory</Link>
      </div>
    );
  }

  const hasPartner = !!partner;
  const femalePartner = patient.gender === 'female' ? patient : partner;
  const malePartner = patient.gender === 'male' ? patient : partner;

  const currentTabs = tabs.map((t) => {
    if (t.id === 'overview') {
      return hasPartner
        ? { ...t, label: 'Couple 360', icon: '👫' }
        : { ...t, label: 'Patient 360', icon: patient.gender === 'male' ? '👨' : '👩' };
    }
    return t;
  });

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* === PATIENT / COUPLE 360 HEADER CARDS === */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              {hasPartner ? '👫' : patient.gender === 'male' ? '👨' : '👩'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {patient.name} {hasPartner ? `& ${partner.name}` : ''}
                </h1>
                <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {patient.vid}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Area: {patient.area || '—'} · Treating Doctor: <strong className="text-slate-700">{patient.treating_doctor_name || 'Unassigned (Assign at OPD)'}</strong>
              </p>
            </div>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2">
            {activeCycle && (
              <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Cycle: {activeCycle.cycle_id} ({activeCycle.treatment_type})
              </span>
            )}
            <button
              onClick={handleSendToOPD}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              Move to OPD
            </button>
            <button
              onClick={() => setShowVisitModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
            >
              + Log Visit & Rx
            </button>
          </div>
        </div>

        {/* Demographics Area: Unified Single Patient OR Dual Partner Grid */}
        {!hasPartner ? (
          <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{patient.gender === 'male' ? '👨' : '👩'}</span>
                <div>
                  <h3 className="font-black text-base text-slate-900">{patient.name}</h3>
                  <p className="text-xs font-mono text-indigo-700 font-bold">{patient.vid}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                Individual Patient ({patient.registration_type || 'General OPD'})
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span> <strong>{patient.gender || '—'}</strong></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span> <strong>{patient.age ? `${patient.age} yrs` : '—'}</strong></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span> <strong>{patient.blood_group || '—'}</strong></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span> <strong>{patient.phone || '—'}</strong></div>
              {patient.email && <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span> <strong>{patient.email}</strong></div>}
              {patient.area && <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Area</span> <strong>{patient.area}</strong></div>}
              {patient.address && <div className="sm:col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-bold">Address</span> <strong>{patient.address}</strong></div>}
            </div>
            {patient.alert_notes?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-amber-800">Clinical Alerts:</span>
                {patient.alert_notes.map((a: string, i: number) => (
                  <span key={i} className="text-xs font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded-lg">
                    ⚠️ {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Side-by-Side Dual Partner Demographics Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Female Partner Card */}
            {femalePartner ? (
              <div className="bg-pink-50/40 border border-pink-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👩</span>
                    <div>
                      <h3 className="font-bold text-sm text-pink-950">{femalePartner.name}</h3>
                      <p className="text-[11px] font-mono text-pink-700 font-bold">{femalePartner.vid}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                    Female Partner
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-xl border border-pink-100">
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span> <strong>{femalePartner.age} yrs</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span> <strong>{femalePartner.blood_group || '—'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span> <strong>{femalePartner.phone}</strong></div>
                </div>
                {femalePartner.alert_notes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {femalePartner.alert_notes.map((a: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 flex items-center justify-center">
                No female partner registered
              </div>
            )}

            {/* Male Partner Card */}
            {malePartner ? (
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👨</span>
                    <div>
                      <h3 className="font-bold text-sm text-blue-950">{malePartner.name}</h3>
                      <p className="text-[11px] font-mono text-blue-700 font-bold">{malePartner.vid}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Male Partner
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-700 bg-white/70 p-2.5 rounded-xl border border-blue-100">
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Age</span> <strong>{malePartner.age} yrs</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Group</span> <strong>{malePartner.blood_group || '—'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span> <strong>{malePartner.phone}</strong></div>
                </div>
                {malePartner.alert_notes?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {malePartner.alert_notes.map((a: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        ⚠️ {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 flex items-center justify-center">
                No male partner linked to couple
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation Pill Rail */}
        <div className="flex p-1 bg-slate-100 rounded-2xl overflow-x-auto gap-1">
          {currentTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                router.replace(`/patients/${patientId}?tab=${t.id}`);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* === TAB CONTENT AREA === */}
      <div>
        {/* === TAB 1: OVERVIEW === */}
        {activeTab === 'overview' && (
          <div className="space-y-6 w-full">
            {/* Active Cycles Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-black text-sm text-slate-900">Treatment Cycles Overview</h3>
                <button
                  onClick={() => setShowNewCycleModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  + Add New Cycle
                </button>
              </div>

              {cycles.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No active or completed cycles on file.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {cycles.map((c) => (
                    <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-700">{c.cycle_id}</span>
                          <strong className="text-slate-900">{c.treatment_type} (Attempt #{c.attempt_number})</strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {c.status}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">Stimulation Start: {c.sentinel_dates?.stim_start || '—'} · OPU: {c.sentinel_dates?.opu || '—'}</p>
                      </div>
                      <button
                        onClick={() => { setActiveCycle(c); setActiveTab('treatment'); }}
                        className="font-bold text-indigo-600 hover:underline"
                      >
                        View Calendar →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advance Wallet Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Patient Advance Deposit Wallet</p>
                <p className="text-3xl font-black mt-1">₹{walletInfo ? walletInfo.balance.toLocaleString() : '0'}</p>
                <p className="text-xs text-slate-400 mt-1">Available credit balance for treatment packages & procedure invoices</p>
              </div>
              <button
                onClick={() => setShowDepositModal(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
              >
                💳 Deposit Advance Funds
              </button>
            </div>
          </div>
        )}

        {/* === TAB 1.5: TIMELINE === */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 w-full max-w-3xl mx-auto py-4">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🕒</span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Patient Journey Timeline</h2>
                <p className="text-xs text-slate-500">Chronological history of all touchpoints</p>
              </div>
            </div>

            <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-8">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="relative pl-6">
                  <span className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    ev.type === 'registration' ? 'bg-teal-500' :
                    ev.type === 'appointment' ? 'bg-indigo-500' :
                    ev.type === 'clinical_record' ? 'bg-emerald-500' :
                    ev.type === 'treatment_cycle' ? 'bg-purple-600' :
                    ev.type === 'invoice' ? 'bg-blue-600' :
                    'bg-amber-500'
                  }`} />
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(ev.created_at)}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ev.type === 'registration' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                        ev.type === 'appointment' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        ev.type === 'clinical_record' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        ev.type === 'treatment_cycle' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        ev.type === 'invoice' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {ev.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 capitalize">{ev.title}</h4>
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

        {/* === TAB 2: VISITS & RX === */}
        {activeTab === 'visits' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Consultation Visit History</h2>
                <p className="text-xs text-slate-500">Record clinical advice, investigations & dual partner prescriptions</p>
              </div>
              <button
                onClick={() => setShowVisitModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                + Log Consultation Visit
              </button>
            </div>

            {visitLogs.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs">
                No consultations logged yet. Click "+ Log Consultation Visit".
              </div>
            ) : (
              <div className="space-y-4">
                {visitLogs.map((v) => (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {v.data?.visit_type || (v.record_type === 'opd_consultation' ? 'OPD Consultation' : 'Consultation')}
                        </span>
                        <span className="text-xs text-slate-400">· {formatDate(v.created_at)}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                        Dr. {v.data?.seen_by || 'Consultant'}
                      </span>
                    </div>

                    {v.record_type === 'opd_consultation' ? (
                      <div className="space-y-3">
                        {v.data?.chief_complaints && (
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaints</p>
                            <p className="text-xs text-slate-800">{v.data.chief_complaints}</p>
                          </div>
                        )}
                        {v.data?.clinical_notes && (
                          <div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Notes</p>
                            <p className="text-xs text-slate-800">{v.data.clinical_notes}</p>
                          </div>
                        )}
                        {v.data?.investigations_ordered && (
                          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5">
                            <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-2">🔬 Investigations Ordered</p>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap">{v.data.investigations_ordered}</p>
                          </div>
                        )}
                        {v.data?.plan && (
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5">
                            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-2">📋 Treatment Plan / Rx</p>
                            <p className="text-xs text-slate-800 whitespace-pre-wrap">{v.data.plan}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-700"><strong>Advice / Summary:</strong> {v.data?.summary || 'Routine review.'}</p>

                        {/* Prescriptions */}
                        {v.data?.wife_medications?.length > 0 && (
                          <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-3.5 space-y-2">
                            <p className="text-[11px] font-bold text-pink-900 uppercase tracking-wider">👩 Wife Prescription</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {v.data.wife_medications.map((m: any, i: number) => (
                                <div key={i} className="bg-white p-2 rounded-xl text-xs border border-pink-100 font-medium">
                                  <strong>{m.drug}</strong> — {m.dose} ({m.freq}) for {m.duration}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {v.data?.next_follow_up ? `Next Follow-up: ${v.data.next_follow_up}` : ''}
                      </span>
                      <button
                        onClick={() => {
                          setPrintablePrescription({
                            patient,
                            doctor: { name: v.data?.seen_by || patient.treating_doctor_name || user?.name },
                            visitDate: v.created_at,
                            chiefComplaint: v.data?.chief_complaint || v.data?.chief_complaints,
                            hopi: v.data?.history_of_illness,
                            pastHistory: v.data?.past_medical_history,
                            vitals: {
                              bp: v.data?.vitals_bp || (v.data?.blood_pressure_systolic ? `${v.data?.blood_pressure_systolic}/${v.data?.blood_pressure_diastolic}` : undefined),
                              pulse: v.data?.vitals_pulse || v.data?.heart_rate,
                              weight: v.data?.vitals_weight || v.data?.weight,
                            },
                            diagnosis: v.data?.provisional_diagnosis,
                            medications: hasPartner ? (v.data?.wife_medications || []) : (v.data?.patient_medications || v.data?.wife_medications || (v.data?.plan ? [{ drug: v.data.plan }] : [])),
                            partnerMedications: hasPartner ? (v.data?.husband_medications || []) : [],
                            partnerName: partner?.name,
                            advice: v.data?.summary || v.data?.plan,
                            nextFollowUp: v.data?.next_follow_up,
                          });
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors shadow-sm"
                      >
                        <span>🖨️</span> Print Prescription (Rx)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === TAB 3: INVESTIGATIONS & USG === */}
        {activeTab === 'investigations' && (
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-2xl shadow-sm">
              <div className="flex gap-2">
                <button
                  onClick={() => { setInvestigationGender('female'); setActiveSchemaType('follicular_scan'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    investigationGender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  👩 Female Scans & Reports
                </button>
                <button
                  onClick={() => { setInvestigationGender('male'); setActiveSchemaType('casa_semen_analysis'); }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    investigationGender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  👨 Male Diagnostic Reports
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
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
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
            {activeCycle ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {activeCycle.cycle_id}
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">
                      {activeCycle.treatment_type} Cycle (Attempt #{activeCycle.attempt_number})
                    </h2>
                    <p className="text-xs text-slate-500">Stimulation Start: {activeCycle.sentinel_dates?.stim_start || '—'} · OPU: {activeCycle.sentinel_dates?.opu || '—'}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/ivf-lab?cycle_id=${activeCycle.id}`)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
                  >
                    Open in IVF Lab 🧫 →
                  </button>
                </div>

                {/* Day by Day Timetable */}
                {cycleCalendar && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-slate-900">Day-by-Day Stimulation Timetable</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {cycleCalendar.days?.map((d: any) => (
                        <div
                          key={d.day_number}
                          className={`p-3 rounded-2xl border ${
                            d.milestone ? 'border-indigo-400 bg-indigo-50/40 shadow-sm' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between border-b pb-1 mb-1">
                            <span className="font-bold text-xs text-slate-800">{d.display_date}</span>
                            <span className="text-[10px] text-slate-400">{d.day_of_week}</span>
                          </div>
                          {d.milestone && <p className="text-xs font-black text-indigo-800 mb-1">{d.milestone}</p>}
                          {d.medications?.map((m: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-1.5 rounded text-[11px] font-medium text-slate-700 mt-1">
                              <strong>{m.drug_name}</strong> — {m.dose} ({m.frequency})
                              {m.instructions && <span className="block text-[10px] text-slate-400">{m.instructions}</span>}
                            </div>
                          ))}

                          {addingMedDay === d.day_number ? (
                            <div className="mt-2 p-2 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2 text-xs">
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
                                  className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
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
                              className="w-full mt-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100 rounded-lg border border-dashed border-indigo-200 transition-colors"
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
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
                No active cycle selected. Click "+ Add New Cycle" to start.
              </div>
            )}
          </div>
        )}

        {/* === TAB 5: EMBEDDED ANDROLOGY === */}
        {activeTab === 'andrology' && (
          <div className="space-y-6 w-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Partner Andrology Diagnostics
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    CASA Semen Analysis & DFI: {malePartner?.name || patient.name}
                  </h2>
                  <p className="text-xs text-slate-500">WHO 6th Edition reference standards</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  🖨️ Print Andrology Report
                </button>
              </div>

              <form onSubmit={handleSaveAndrologyDirect} className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                    <input
                      type="number"
                      value={andrologyForm.abstinence_days}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, abstinence_days: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume (mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={andrologyForm.volume_ml}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, volume_ml: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Concentration (M/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={andrologyForm.pre_conc_million_ml}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, pre_conc_million_ml: e.target.value })}
                      className="vmd-input text-xs font-bold text-indigo-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive (PR) %</label>
                    <input
                      type="number"
                      value={andrologyForm.progressive_motility_pct}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, progressive_motility_pct: e.target.value })}
                      className="vmd-input text-xs font-bold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Normal Forms % (Kruger)</label>
                    <input
                      type="number"
                      value={andrologyForm.normal_forms_pct}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, normal_forms_pct: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm DFI % (Halosperm)</label>
                    <input
                      type="number"
                      value={andrologyForm.dfi_total_pct}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, dfi_total_pct: e.target.value })}
                      className="vmd-input text-xs font-bold text-violet-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Impression</label>
                    <input
                      type="text"
                      value={andrologyForm.impression}
                      onChange={(e) => setAndrologyForm({ ...andrologyForm, impression: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingAndrology}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {isSavingAndrology ? 'Saving...' : '💾 Save Andrology Metrics'}
                </button>
              </form>
            </div>

            {/* Andrology History Records */}
            {andrologyHistory.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-3">📋 Previous Semen Analysis Reports</h3>
                <div className="space-y-3">
                  {andrologyHistory.map((rec: any, idx: number) => (
                    <div key={rec.id || idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-700">
                          🗓 {rec.data?.collection_date || new Date(rec.created_at).toLocaleDateString('en-IN')}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rec.data?.impression?.toLowerCase().includes('normal') ? 'bg-emerald-100 text-emerald-800' :
                          rec.data?.impression?.toLowerCase().includes('asthen') ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>{rec.data?.impression || 'Report on File'}</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] text-slate-700">
                        <div><span className="text-slate-400 block font-bold">Volume</span><strong>{rec.data?.volume_ml ?? '—'} mL</strong></div>
                        <div><span className="text-slate-400 block font-bold">Conc (M/mL)</span><strong>{rec.data?.pre_conc_million_ml ?? '—'}</strong></div>
                        <div><span className="text-slate-400 block font-bold">PR Motility</span><strong>{rec.data?.progressive_motility_pct ?? '—'}%</strong></div>
                        <div><span className="text-slate-400 block font-bold">Normal Forms</span><strong>{rec.data?.normal_forms_pct ?? '—'}%</strong></div>
                        <div><span className="text-slate-400 block font-bold">DFI %</span><strong>{rec.data?.dfi_total_pct ?? '—'}%</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* === TAB 6: BILLING & WALLET === */}
        {activeTab === 'billing' && (
          <div className="space-y-6 w-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold text-slate-900">Patient Billing & Invoices</h3>
                <Link href="/billing" className="text-xs text-indigo-600 font-bold hover:underline">
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
                        <td className="p-3 font-mono font-bold text-indigo-700">{inv.invoice_number}</td>
                        <td className="p-3">{inv.appointment_source}</td>
                        <td className="p-3 font-bold">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                        <td className="p-3 text-emerald-700 font-bold">₹{parseFloat(inv.paid_amount).toLocaleString()}</td>
                        <td className="p-3 text-rose-700 font-bold">₹{parseFloat(inv.pending_due).toLocaleString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
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
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">📁 Patient Documents & Investigation Reports</h2>
                  <p className="text-xs text-slate-500">Upload or link lab reports, scan images, consent forms, and regulatory documents</p>
                </div>
              </div>

              {/* Quick Upload Form */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">📤 Register New Document</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Document / File Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Day 3 FSH Report Aug 2026"
                      value={uploadDocForm.file_name}
                      onChange={(e) => setUploadDocForm({ ...uploadDocForm, file_name: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">File URL / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. https://drive.google.com/... or /uploads/..."
                      value={uploadDocForm.file_path}
                      onChange={(e) => setUploadDocForm({ ...uploadDocForm, file_path: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Category</label>
                    <select
                      value={uploadDocForm.category}
                      onChange={(e) => setUploadDocForm({ ...uploadDocForm, category: e.target.value })}
                      className="vmd-input text-xs"
                    >
                      <option value="report">Lab Report</option>
                      <option value="scan">Ultrasound / Scan</option>
                      <option value="consent">Consent Form</option>
                      <option value="prescription">Prescription</option>
                      <option value="referral">Referral Letter</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isUploadingDoc || !uploadDocForm.file_name || !uploadDocForm.file_path}
                  onClick={async () => {
                    if (!uploadDocForm.file_name || !uploadDocForm.file_path) return;
                    setIsUploadingDoc(true);
                    try {
                      await documentsApi.create({
                        patient_id: patientId,
                        file_name: uploadDocForm.file_name,
                        file_path: uploadDocForm.file_path,
                        category: uploadDocForm.category,
                      });
                      const docs = await documentsApi.list(patientId);
                      setPatientDocs(docs || []);
                      setUploadDocForm({ file_name: '', file_path: '', category: 'report' });
                    } catch (err: any) {
                      alert('Failed to upload: ' + (err.message || 'Unknown error'));
                    } finally {
                      setIsUploadingDoc(false);
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {isUploadingDoc ? 'Saving...' : '📤 Register Document'}
                </button>
              </div>

              {/* Documents List */}
              {patientDocs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {patientDocs.map((doc: any) => (
                    <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition-colors">
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
                        >✕</button>
                      </div>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.category === 'report' ? 'bg-blue-100 text-blue-800' :
                        doc.category === 'scan' ? 'bg-purple-100 text-purple-800' :
                        doc.category === 'consent' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {doc.category?.toUpperCase()}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(doc.created_at).toLocaleDateString('en-IN')}</p>
                      <a
                        href={doc.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline block truncate"
                      >
                        🔗 Open / View Document
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
      </div>

      {/* New Treatment Cycle Modal */}
      {showNewCycleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <TreatmentCycleWizard
            patientId={patientId}
            partnerId={partner?.id}
            userId={user?.id || ''}
            onCancel={() => setShowNewCycleModal(false)}
            onSuccess={() => {
              setShowNewCycleModal(false);
              loadData();
            }}
          />
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">💳 Deposit Funds to Advance Wallet</h3>
            <form onSubmit={handleDepositWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="vmd-input text-base font-black text-indigo-700"
                  min="100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Method</label>
                <select
                  value={depositMode}
                  onChange={(e) => setDepositMode(e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="upi">UPI (GPay / PhonePe)</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">NEFT / Bank Transfer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700">
                  Confirm Advance Deposit
                </button>
                <button type="button" onClick={() => setShowDepositModal(false)} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Visit & Prescription Modal with Dynamic Medication Row Manager */}
      {showVisitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {hasPartner ? 'Log Consultation Visit & Couple Prescription' : 'Log Consultation Visit & Prescription'}
                </h3>
                <p className="text-xs text-slate-500">Record clinical findings, vitals, diagnosis, and issue printable Rx.</p>
              </div>
              <button onClick={() => setShowVisitModal(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <form onSubmit={(e) => handleSaveVisit(e, false)} className="space-y-4">
              {/* Doctor & Visit Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Attending Doctor / Specialist</label>
                  <input
                    type="text"
                    value={visitForm.seen_by}
                    onChange={(e) => setVisitForm({ ...visitForm, seen_by: e.target.value })}
                    className="vmd-input text-xs"
                    placeholder="Doctor Name (e.g. Dr. Ramesh)"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Visit Date</label>
                  <input
                    type="date"
                    value={visitForm.visit_date}
                    onChange={(e) => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                    className="vmd-input text-xs"
                    required
                  />
                </div>
              </div>

              {/* Vitals & Diagnosis */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">🩺 Vitals & Examination</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">BP (mmHg)</label>
                    <input
                      type="text"
                      placeholder="e.g. 120/80"
                      value={visitForm.vitals_bp}
                      onChange={(e) => setVisitForm({ ...visitForm, vitals_bp: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pulse (bpm)</label>
                    <input
                      type="text"
                      placeholder="e.g. 74"
                      value={visitForm.vitals_pulse}
                      onChange={(e) => setVisitForm({ ...visitForm, vitals_pulse: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Weight (kg)</label>
                    <input
                      type="text"
                      placeholder="e.g. 62"
                      value={visitForm.vitals_weight}
                      onChange={(e) => setVisitForm({ ...visitForm, vitals_weight: e.target.value })}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Provisional / Working Diagnosis</label>
                  <input
                    type="text"
                    placeholder="e.g. Primary Infertility, Diminished Ovarian Reserve"
                    value={visitForm.provisional_diagnosis}
                    onChange={(e) => setVisitForm({ ...visitForm, provisional_diagnosis: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              {/* Chief Complaints & HOPI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Chief Complaints</label>
                  <textarea
                    rows={2}
                    value={visitForm.chief_complaint}
                    onChange={(e) => setVisitForm({ ...visitForm, chief_complaint: e.target.value })}
                    placeholder="e.g. Trying to conceive for 3 years, irregular cycles..."
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">History of Present Illness (HOPI)</label>
                  <textarea
                    rows={2}
                    value={visitForm.history_of_illness}
                    onChange={(e) => setVisitForm({ ...visitForm, history_of_illness: e.target.value })}
                    placeholder="e.g. Prior failed IUI cycle in 2024. Normal AMH..."
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              {/* Past Medical History & Consultation Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Past Medical / Surgical History</label>
                  <textarea
                    rows={2}
                    value={visitForm.past_medical_history}
                    onChange={(e) => setVisitForm({ ...visitForm, past_medical_history: e.target.value })}
                    placeholder="e.g. Hypothyroidism on Thyronorm 50mcg, Diagnostic laparoscopy in 2023..."
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Consultation Advice / Summary *</label>
                  <textarea
                    value={visitForm.summary}
                    onChange={(e) => setVisitForm({ ...visitForm, summary: e.target.value })}
                    required
                    rows={2}
                    className="vmd-input text-xs"
                    placeholder="Clinical evaluation and treatment plan summary..."
                  />
                </div>
              </div>

              {/* Prescription Section - Dynamic for Couple or Single Patient */}
              {hasPartner ? (
                <>
                  {/* Wife Medications */}
                  <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-pink-900 uppercase">👩 Wife Medications</span>
                      <button
                        type="button"
                        onClick={() => handleAddMedication('wife')}
                        className="text-xs text-pink-700 font-bold hover:underline"
                      >
                        + Add Medication Row
                      </button>
                    </div>
                    {visitForm.wife_medications.map((m, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Drug Name (e.g. Inj. Recagon 150 IU)"
                          value={m.drug}
                          onChange={(e) => {
                            const updated = [...visitForm.wife_medications];
                            updated[idx].drug = e.target.value;
                            setVisitForm({ ...visitForm, wife_medications: updated });
                          }}
                          className="vmd-input text-xs flex-1"
                        />
                        <input
                          type="text"
                          placeholder="Dose"
                          value={m.dose}
                          onChange={(e) => {
                            const updated = [...visitForm.wife_medications];
                            updated[idx].dose = e.target.value;
                            setVisitForm({ ...visitForm, wife_medications: updated });
                          }}
                          className="vmd-input text-xs w-20"
                        />
                        <input
                          type="text"
                          placeholder="Freq"
                          value={m.freq}
                          onChange={(e) => {
                            const updated = [...visitForm.wife_medications];
                            updated[idx].freq = e.target.value;
                            setVisitForm({ ...visitForm, wife_medications: updated });
                          }}
                          className="vmd-input text-xs w-20"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication('wife', idx)}
                          className="text-rose-500 font-bold hover:text-rose-700 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {visitForm.wife_medications.length === 0 && (
                      <p className="text-[11px] text-pink-400 italic">No medications added yet. Click + Add Medication Row.</p>
                    )}
                  </div>

                  {/* Husband Medications */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-900 uppercase">👨 Husband Medications</span>
                      <button
                        type="button"
                        onClick={() => handleAddMedication('husband')}
                        className="text-xs text-blue-700 font-bold hover:underline"
                      >
                        + Add Medication Row
                      </button>
                    </div>
                    {visitForm.husband_medications.map((m, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Drug Name (e.g. Tab. CoQ10 100mg)"
                          value={m.drug}
                          onChange={(e) => {
                            const updated = [...visitForm.husband_medications];
                            updated[idx].drug = e.target.value;
                            setVisitForm({ ...visitForm, husband_medications: updated });
                          }}
                          className="vmd-input text-xs flex-1"
                        />
                        <input
                          type="text"
                          placeholder="Dose"
                          value={m.dose}
                          onChange={(e) => {
                            const updated = [...visitForm.husband_medications];
                            updated[idx].dose = e.target.value;
                            setVisitForm({ ...visitForm, husband_medications: updated });
                          }}
                          className="vmd-input text-xs w-20"
                        />
                        <input
                          type="text"
                          placeholder="Freq"
                          value={m.freq}
                          onChange={(e) => {
                            const updated = [...visitForm.husband_medications];
                            updated[idx].freq = e.target.value;
                            setVisitForm({ ...visitForm, husband_medications: updated });
                          }}
                          className="vmd-input text-xs w-20"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication('husband', idx)}
                          className="text-rose-500 font-bold hover:text-rose-700 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {visitForm.husband_medications.length === 0 && (
                      <p className="text-[11px] text-blue-400 italic">No medications added yet. Click + Add Medication Row.</p>
                    )}
                  </div>
                </>
              ) : (
                /* Single Patient Medications */
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-900 uppercase">💊 Prescribed Medications</span>
                    <button
                      type="button"
                      onClick={() => handleAddMedication('patient')}
                      className="text-xs text-indigo-700 font-bold hover:underline"
                    >
                      + Add Medication Row
                    </button>
                  </div>
                  {visitForm.patient_medications.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Drug Name (e.g. Tab. Paracetamol 650mg)"
                        value={m.drug}
                        onChange={(e) => {
                          const updated = [...visitForm.patient_medications];
                          updated[idx].drug = e.target.value;
                          setVisitForm({ ...visitForm, patient_medications: updated });
                        }}
                        className="vmd-input text-xs flex-1"
                      />
                      <input
                        type="text"
                        placeholder="Dose"
                        value={m.dose}
                        onChange={(e) => {
                          const updated = [...visitForm.patient_medications];
                          updated[idx].dose = e.target.value;
                          setVisitForm({ ...visitForm, patient_medications: updated });
                        }}
                        className="vmd-input text-xs w-20"
                      />
                      <input
                        type="text"
                        placeholder="Freq"
                        value={m.freq}
                        onChange={(e) => {
                          const updated = [...visitForm.patient_medications];
                          updated[idx].freq = e.target.value;
                          setVisitForm({ ...visitForm, patient_medications: updated });
                        }}
                        className="vmd-input text-xs w-20"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication('patient', idx)}
                        className="text-rose-500 font-bold hover:text-rose-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {visitForm.patient_medications.length === 0 && (
                    <p className="text-[11px] text-indigo-400 italic">No medications added yet. Click + Add Medication Row.</p>
                  )}
                </div>
              )}

              {/* Next Follow-up */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Next Follow-Up / Review Instructions</label>
                <input
                  type="text"
                  value={visitForm.next_follow_up}
                  onChange={(e) => setVisitForm({ ...visitForm, next_follow_up: e.target.value })}
                  className="vmd-input text-xs"
                  placeholder="e.g. Review after 5 days with USG Follicular Scan report"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                >
                  Save Consultation Record
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveVisit(e, true)}
                  className="py-3 px-5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-all"
                >
                  🖨️ Save & Print Rx
                </button>
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Prescription Modal */}
      {printablePrescription && (
        <PrintablePrescription
          {...printablePrescription}
          onClose={() => setPrintablePrescription(null)}
        />
      )}
    </div>
  );
}
