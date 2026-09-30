'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  adminApi,
  authApi,
  billingApi,
  branchesApi,
  ipdApi,
  templatesApi,
  treatmentCyclesApi,
  protocolsApi,
  permissionProfilesApi,
  pharmacyApi,
  limsApi,
  cryoApi,
  cosgynApi,
  getApiBase,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { resolveLogoUrl } from '@/components/common/PrintableReportHeader';
import PageLayout from '@/components/common/PageLayout';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import {
  Building2,
  Users,
  IndianRupee,
  Sparkles,
  Activity,
  ClipboardList,
  Calendar,
  BedDouble,
  Dna,
  FileText,
  FlaskConical,
  Pill,
  ShieldCheck,
  UploadCloud,
  Download,
  Check,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Code,
  Printer,
  KeyRound,
  X,
  Layers,
  FileSpreadsheet,
  Phone,
  Mail,
  MapPin,
  Lock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Globe,
  Clock,
  Palette,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Canonical VaidyaMD System Roles List
const VAIDYAMD_ROLES = [
  { id: 'admin', name: 'Administrator / Medical Director', desc: 'Full clinical, administrative, lab, and financial permissions across all hospital branches' },
  { id: 'doctor', name: 'Treating Doctor / Consultant', desc: 'Clinical consultations, prescriptions, ultrasound tracking, and couple EMR access' },
  { id: 'nurse', name: 'Fertility Nurse / Station', desc: 'Patient intake, vitals, nursing notes, and medication calendar administration' },
  { id: 'receptionist', name: 'Front Desk Receptionist', desc: 'Patient registration, appointment scheduling, and front-desk visitor flow' },
  { id: 'embryologist', name: 'Clinical Embryologist', desc: 'IVF lab dish preparation, ICSI, culture scoring, dual-witnessing, and cryobank straw coordinates' },
  { id: 'andrologist', name: 'Andrologist / Semen Lab', desc: 'Semen analysis (WHO 6th), sperm processing, swim-up, and DFI testing' },
  { id: 'pharma', name: 'Lead Pharmacist', desc: 'Pharmacy inventory, batch dispensing, FEFO management, and vendor purchase orders' },
  { id: 'manager', name: 'Clinic Operations Manager', desc: 'Operational reporting, branch oversight, bed allocation, and staff scheduling' },
  { id: 'accounts', name: 'Billing & Accounts Desk', desc: 'Invoicing, package assignments, advance wallet management, and payment receipts' },
  { id: 'scanning', name: 'Ultrasonologist / Sonography', desc: 'Folliculometry, TVS Doppler scans, cavity scans, and imaging reporting' },
  { id: 'counsellor', name: 'Clinical Fertility Counsellor', desc: 'Pre-ART psychological counseling, couple consent walkthroughs, and emotional support notes' },
];

// Canonical Menu Permissions List
const menuKeys = [
  { key: 'patients', label: 'Patient Directory' },
  { key: 'patient_register', label: 'Patient / Couple Registration' },
  { key: 'patient_360', label: 'Couple 360 EMR Portal' },
  { key: 'treatment_cycles', label: 'Treatment Cycles & Protocol Engine' },
  { key: 'ivf_lab', label: 'IVF Lab' },
  { key: 'cryopreservation', label: 'Cryobank Tank Coordinates' },
  { key: 'billing', label: 'Billing & Invoices' },
  { key: 'wallet', label: 'Patient Advance Wallet' },
  { key: 'analytics', label: 'Analytics & Financial Reports' },
  { key: 'pharmacy', label: 'Pharmacy Dispensary' },
  { key: 'ipd', label: 'IPD Bedboard & Nursing' },
];

const getDefaultPermissionsForRole = (roleId: string): Record<string, boolean> => ({
  patients: true,
  patient_register: ['admin', 'doctor', 'nurse', 'receptionist'].includes(roleId),
  patient_360: ['admin', 'doctor', 'nurse', 'embryologist', 'andrologist', 'counsellor'].includes(roleId),
  treatment_cycles: ['admin', 'doctor', 'nurse', 'embryologist'].includes(roleId),
  ivf_lab: ['admin', 'doctor', 'embryologist', 'andrologist'].includes(roleId),
  cryopreservation: ['admin', 'embryologist', 'doctor'].includes(roleId),
  billing: ['admin', 'accounts', 'receptionist', 'manager'].includes(roleId),
  wallet: ['admin', 'accounts'].includes(roleId),
  analytics: ['admin', 'manager', 'accounts'].includes(roleId),
  pharmacy: ['admin', 'pharma', 'nurse'].includes(roleId),
  ipd: ['admin', 'nurse', 'doctor'].includes(roleId),
});

const findProfileForRole = (roleId: string, profileList: any[]) => {
  return profileList.find((p) => {
    const pName = (p.name || '').toLowerCase();
    switch (roleId) {
      case 'admin':
        return pName.includes('admin') || pName.includes('director');
      case 'doctor':
        return pName.includes('doctor') || pName.includes('consultant');
      case 'nurse':
        return pName.includes('nurse') || pName.includes('coordinator');
      case 'receptionist':
        return pName.includes('reception') || pName.includes('front desk');
      case 'embryologist':
        return pName.includes('embryo');
      case 'andrologist':
        return pName.includes('andro') || pName.includes('semen');
      case 'pharma':
        return pName.includes('pharma') || pName.includes('chemist');
      case 'manager':
        return pName.includes('manager') || pName.includes('operations');
      case 'accounts':
        return pName.includes('account') || pName.includes('billing');
      case 'scanning':
        return pName.includes('scan') || pName.includes('sonog') || pName.includes('imaging') || pName.includes('ultrasound');
      case 'counsellor':
        return pName.includes('counsel') || pName.includes('psycholog');
      default:
        return pName.includes(roleId);
    }
  });
};


// ==========================================
// CLINICAL TEMPLATE PURPOSE SUBTABS CONFIG
// ==========================================
export type TemplatePurpose = 'all' | 'proformas' | 'scans' | 'order_sets' | 'rx' | 'visit_types';

export interface PurposeTabConfig {
  id: TemplatePurpose;
  label: string;
  badgeLabel: string;
  icon: any;
  hint: string;
  description: string;
}

export const TEMPLATE_PURPOSE_TABS: PurposeTabConfig[] = [
  {
    id: 'all',
    label: 'All Templates',
    badgeLabel: 'All',
    icon: Layers,
    hint: 'Master repository',
    description: 'Master directory of clinical evaluation proformas, ultrasound scans, smart order sets, daily Rx protocols, and appointment booking types.',
  },
  {
    id: 'proformas',
    label: 'Clinical Proformas',
    badgeLabel: 'Proforma',
    icon: FileText,
    hint: 'Consultations & History',
    description: 'Initial consultation questionnaires, fertility couple workups, routine gynaecology checkups, antenatal ANC proformas, and PCOS clinical reviews.',
  },
  {
    id: 'scans',
    label: 'Ultrasound & Scans',
    badgeLabel: 'USG Scan',
    icon: Activity,
    hint: 'Sonography & Monitoring',
    description: 'Transvaginal sonography (TVS), follicular tracking monitoring sheets, endometrial receptivity assessments, and pelvic ultrasound schemas.',
  },
  {
    id: 'order_sets',
    label: 'Smart Order Sets',
    badgeLabel: 'Order Set',
    icon: ClipboardList,
    hint: 'Diagnostic Bundles',
    description: 'Pre-configured investigation and order bundles for couple workups, PCOS diagnostic panels, RPL screening, and IVF pre-cycle checks.',
  },
  {
    id: 'rx',
    label: 'Rx & Protocols',
    badgeLabel: 'Rx Protocol',
    icon: Pill,
    hint: 'Daily Stimulation Rx',
    description: 'Stimulation daily medication protocols (antagonist, agonist, PPOS), luteal phase support regimens, and clinical post-OPU/FET discharge prescriptions.',
  },
  {
    id: 'visit_types',
    label: 'Visit Types',
    badgeLabel: 'Visit Type',
    icon: Calendar,
    hint: 'Booking Slot Types',
    description: 'Outpatient clinic visit types, procedure appointments (OPU, ET, IUI), and semen collection slot durations configured for appointment scheduling.',
  },
];

export const getTemplatePurpose = (tmpl: any): TemplatePurpose => {
  if (!tmpl) return 'proformas';
  const pId = (tmpl.plugin_id || '').toLowerCase();
  const rType = (tmpl.record_type || '').toLowerCase();
  const title = (tmpl.title || '').toLowerCase();

  // 1. Visit Types (Booking slot templates)
  if (pId === 'appointment_visit_type' || rType.startsWith('visit_')) {
    return 'visit_types';
  }

  // 2. Rx & Drug Regimens
  if (pId === 'rx_template' || rType.startsWith('rx_') || rType.includes('stim') || rType.includes('protocol')) {
    return 'rx';
  }

  // 3. Smart Order Sets
  if (pId === 'opd_order_set' || rType.startsWith('os_') || rType.includes('order_set') || rType.includes('bundle')) {
    return 'order_sets';
  }

  // 4. Ultrasound & Scans
  if (
    rType.includes('follicular') ||
    rType.includes('scan') ||
    rType.includes('usg') ||
    rType.includes('ultrasound') ||
    title.includes('ultrasound') ||
    title.includes('follicular') ||
    title.includes('scan') ||
    title.includes('usg') ||
    title.includes('tvs')
  ) {
    return 'scans';
  }

  // 5. Default: Clinical Proformas
  return 'proformas';
};

export const getPurposeBadgeStyle = (purpose: TemplatePurpose) => {
  switch (purpose) {
    case 'proformas':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'scans':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'order_sets':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'rx':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'visit_types':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export default function SettingsMasterPage() {
  const queryClient = useQueryClient();
  const { user, currentBranch, setCurrentBranch } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'hospital' | 'staff' | 'tariffs' | 'ipd' | 'cycles' | 'templates' | 'labs' | 'pharmacy' | 'profiles' | 'csv_hub'
  >('hospital');

  const isSuperAdmin = user?.role === 'admin' || (user?.role as any)?.value === 'admin';

  // Collapsible vertical navigation rail
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Logo upload state
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Bundled Packages dual-mode editor
  const [packageEditorMode, setPackageEditorMode] = useState<'form' | 'json'>('form');
  const [packageFormItems, setPackageFormItems] = useState<Array<{ name: string; quantity: number; price: number }>>([]);

  // ART Cycles & Protocols configuration state
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycleType, setEditingCycleType] = useState<any>(null);
  const [cycleTypeForm, setCycleTypeForm] = useState({ name: '', category: 'Stimulation', display_order: 0, is_active: true });
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [protocolForm, setProtocolForm] = useState({ name: '', category: 'stimulation', description: '', rules: [] as any[], timeline_events: [] as any[] });

  // Labs & Cryobank configuration state
  const [showLimsModal, setShowLimsModal] = useState(false);
  const [editingLimsTest, setEditingLimsTest] = useState<any>(null);
  const [limsForm, setLimsForm] = useState({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });
  const [cryoTanks, setCryoTanks] = useState<any[]>([]);
  const [showCryoTankModal, setShowCryoTankModal] = useState(false);
  const [editingCryoTank, setEditingCryoTank] = useState<any>(null);
  const [cryoTankForm, setCryoTankForm] = useState({ tank_name: '', tank_code: '', tank_type: 'Autologous Embryos', canister_count: 6, capacity_litres: 35, location: 'IVF Cleanroom Cryo Suite A' });

  // Pharmacy vendor edit state
  const [editingVendor, setEditingVendor] = useState<any>(null);

  // ==========================================
  // 1. HOSPITAL & BRANDING STATE
  // ==========================================
  const [hospitalProfile, setHospitalProfile] = useState<any>(null);
  const [hospitalBranches, setHospitalBranches] = useState<any[]>([]);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number>(0);
  const [isSavingHospital, setIsSavingHospital] = useState(false);
  const [liveReceiptHeader, setLiveReceiptHeader] = useState<any>({
    title: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    cin: '',
    art_reg_number: '',
    cea_reg_number: '',
    header_bold_color: '#4A2E2B',
    header_small_color: '#C29B7F',
    pad_header_height_mm: 35,
    pad_footer_height_mm: 25,
    watermark_url: '',
    watermark_opacity: 0.08,
    disclaimer: 'Valid for statutory compliance and official healthcare documentation.',
  });
  const [isUploadingWatermark, setIsUploadingWatermark] = useState(false);
  const watermarkInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // 2. STAFF USER ROSTER STATE
  // ==========================================
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffUser, setEditingStaffUser] = useState<any>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    is_doctor: true,
    branch_id: '',
    specialization: '',
    qualification: '',
    reg_number: '',
    phone: '',
    departments: '',
    is_active: true,
  });

  // ==========================================
  // 3. TARIFFS & PACKAGES STATE
  // ==========================================
  const [tariffSubTab, setTariffSubTab] = useState<'catalog' | 'packages' | 'cosgyn'>('catalog');
  const [serviceCatalog, setServiceCatalog] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCatFilter, setCatalogCatFilter] = useState('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<any>(null);
  const [serviceItemForm, setServiceItemForm] = useState({
    code: '',
    name: '',
    category: 'Consultation',
    base_price: 0,
    hsn_sac: '',
    gst_rate: 0,
    branch_id: '',
  });

  const [treatmentPackages, setTreatmentPackages] = useState<any[]>([]);
  const [packageSearch, setPackageSearch] = useState('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    plugin_id: 'fertility',
    base_price: 0,
    items_json: '[]',
  });

  // CosGyn Packages State
  const [cosgynTreatments, setCosgynTreatments] = useState<any[]>([]);
  const [cosgynSearch, setCosgynSearch] = useState('');
  const [showCosgynModal, setShowCosgynModal] = useState(false);
  const [editingCosgynTreatment, setEditingCosgynTreatment] = useState<any>(null);
  const [cosgynForm, setCosgynForm] = useState({
    name: '',
    package_combo: '',
    jet_plasma_sessions: 0,
    jet_plasma_duration_mins: 30,
    tesla_chair_sessions: 0,
    tesla_chair_duration_mins: 30,
    prp_sessions: 0,
    price: 25000,
  });

  const refreshCosgynTreatments = () => {
    cosgynApi
      .getTreatments()
      .then((res: any) => setCosgynTreatments(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  // ==========================================
  // 4. IPD WARDS & BEDS STATE
  // ==========================================
  const [wards, setWards] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [wardFormName, setWardFormName] = useState('');
  const [wardFormCode, setWardFormCode] = useState('');
  const [wardFormDept, setWardFormDept] = useState('General IPD');
  const [wardFormRate, setWardFormRate] = useState<number>(0);
  const [wardFormBeds, setWardFormBeds] = useState<number>(1);

  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [bedFormWardId, setBedFormWardId] = useState('');
  const [bedFormNumber, setBedFormNumber] = useState('');
  const [bedFormType, setBedFormType] = useState('Standard');
  const [bedFormRate, setBedFormRate] = useState<number>(0);
  const [bedFormStatus, setBedFormStatus] = useState('Vacant');

  // ==========================================
  // 5. TREATMENT CYCLES & PROTOCOLS STATE
  // ==========================================
  const [cycleSubTab, setCycleSubTab] = useState<'modalities' | 'protocols'>('modalities');
  const [cycleTypes, setCycleTypes] = useState<any[]>([]);
  const [cycleSearch, setCycleSearch] = useState('');
  const [cycleCategoryFilter, setCycleCategoryFilter] = useState('all');
  const [cycleStatusFilter, setCycleStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [protocols, setProtocols] = useState<any[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [protocolPreviewCalendar, setProtocolPreviewCalendar] = useState<any[]>([]);
  const [protocolStatusFilter, setProtocolStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [protocolSearch, setProtocolSearch] = useState('');

  // ==========================================
  // 6. CLINICAL TEMPLATES STATE
  // ==========================================
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePurposeTab, setTemplatePurposeTab] = useState<TemplatePurpose>('all');
  const [newTemplatePurpose, setNewTemplatePurpose] = useState<TemplatePurpose>('proformas');
  const [templateFilterPlugin, setTemplateFilterPlugin] = useState('all');
  const [templateViewMode, setTemplateViewMode] = useState<'preview' | 'json' | 'builder'>('preview');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateJsonText, setTemplateJsonText] = useState('');
  const [templateJsonError, setTemplateJsonError] = useState<string | null>(null);
  const [parsedSchema, setParsedSchema] = useState<any>(null);
  const [activeTemplateFields, setActiveTemplateFields] = useState<Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string;
    required?: boolean;
  }>>([]);
  const [previewRole, setPreviewRole] = useState<string>('doctor');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [builderGenericMode, setBuilderGenericMode] = useState(false);

  // -------------------------------------------------------------
  // Tailored Clinical Editor State (for selectedTemplate in Tab 6)
  // -------------------------------------------------------------
  // 1. Rx & Protocols
  const [rxCategory, setRxCategory] = useState('Stimulation / OI');
  const [rxMedications, setRxMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }
  ]);
  const [rxAdvice, setRxAdvice] = useState('');

  // 2. Smart Order Sets
  const [orderCategory, setOrderCategory] = useState('Fertility / IVF');
  const [orderInvestigations, setOrderInvestigations] = useState('');
  const [orderMedications, setOrderMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([]);
  const [orderInstructions, setOrderInstructions] = useState('');

  // 3. Clinical Proformas
  const [proformaComplaint, setProformaComplaint] = useState('');
  const [proformaHopi, setProformaHopi] = useState('');
  const [proformaDiagnosis, setProformaDiagnosis] = useState('');
  const [proformaInvestigations, setProformaInvestigations] = useState('');
  const [proformaPlan, setProformaPlan] = useState('');

  // 4. Ultrasound Scans
  const [scanType, setScanType] = useState('Transvaginal Sonography (TVS)');
  const [scanEndometrium, setScanEndometrium] = useState('');
  const [scanRightOvary, setScanRightOvary] = useState('');
  const [scanLeftOvary, setScanLeftOvary] = useState('');
  const [scanPod, setScanPod] = useState('Clear / No free fluid');
  const [scanImpression, setScanImpression] = useState('');

  // 5. Visit Types
  const [visitDurationMinutes, setVisitDurationMinutes] = useState(30);
  const [visitConsultationType, setVisitConsultationType] = useState('Couple Consultation');
  const [visitRoom, setVisitRoom] = useState('Consultation Room 1');
  const [visitTariffCode, setVisitTariffCode] = useState('');
  const [visitInstructions, setVisitInstructions] = useState('');

  // -------------------------------------------------------------
  // Tailored Clinical Editor State (for New Template Modal)
  // -------------------------------------------------------------
  const [newRxCategory, setNewRxCategory] = useState('Stimulation / OI');
  const [newRxMedications, setNewRxMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: 'Tab Clomiphene Citrate', dose: '50mg', frequency: 'OD', duration: '5 days', instructions: 'Day 2 to Day 6 of cycle' }
  ]);
  const [newRxAdvice, setNewRxAdvice] = useState('Report for Follicular Scan on Day 9. Adequate oral hydration.');

  const [newOrderCategory, setNewOrderCategory] = useState('Fertility / IVF');
  const [newOrderInvestigations, setNewOrderInvestigations] = useState('Serum AMH, Day 2 FSH/LH, Baseline TVS, Semen Analysis');
  const [newOrderMedications, setNewOrderMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: 'Inj Recombinant FSH', dose: '225 IU', frequency: 'OD', duration: '4 days', instructions: 'Subcutaneous at 9:00 PM' }
  ]);
  const [newOrderInstructions, setNewOrderInstructions] = useState('Fasting 8-10 hours for metabolic & hormonal panel. Empty bladder for TVS.');

  const [newProformaComplaint, setNewProformaComplaint] = useState('Primary Infertility for 2.5 years, irregular menstrual cycles');
  const [newProformaHopi, setNewProformaHopi] = useState('Married for 2.5 years. No prior conceptions. Menstrual cycle 35-45 days. Partner semen analysis normozoospermic.');
  const [newProformaDiagnosis, setNewProformaDiagnosis] = useState('Primary Infertility / Polycystic Ovarian Syndrome (PCOS)');
  const [newProformaInvestigations, setNewProformaInvestigations] = useState('Day 2 Baseline TVS, Serum AMH, TSH, Fasting Insulin, Viral Markers');
  const [newProformaPlan, setNewProformaPlan] = useState('Start Ovulation Induction on Day 2 with Letrozole 2.5mg. Counsel on timed intercourse / IUI.');

  const [newScanType, setNewScanType] = useState('Transvaginal Sonography (TVS)');
  const [newScanEndometrium, setNewScanEndometrium] = useState('8.2mm, Trilaminar Triple-Line, Homogeneous');
  const [newScanRightOvary, setNewScanRightOvary] = useState('AFC: 8 | Dominant Follicle: 18.5mm x 17.0mm');
  const [newScanLeftOvary, setNewScanLeftOvary] = useState('AFC: 7 | Leading Follicle: 12.0mm');
  const [newScanPod, setNewScanPod] = useState('Clear / No free fluid');
  const [newScanImpression, setNewScanImpression] = useState('Dominant follicle in Right Ovary nearing ovulation. Receptive trilaminar endometrium.');

  const [newVisitDurationMinutes, setNewVisitDurationMinutes] = useState(30);
  const [newVisitConsultationType, setNewVisitConsultationType] = useState('Couple Infertility Workup');
  const [newVisitRoom, setNewVisitRoom] = useState('Consultation Room 1');
  const [newVisitTariffCode, setNewVisitTariffCode] = useState('OPD-CONS-01');
  const [newVisitInstructions, setNewVisitInstructions] = useState('Please bring all previous test reports, semen analyses, and ultrasound scans.');


  // Clinical templates list excluding LIMS & Cryo (which reside in Tab 7)
  const clinicalTemplates = useMemo(() => {
    return templates.filter((t) => {
      const pId = (t.plugin_id || '').toLowerCase();
      const rType = (t.record_type || '').toLowerCase();
      return pId !== 'lims' && pId !== 'fertility_cryo' && !rType.startsWith('lims_') && !rType.startsWith('cryo_');
    });
  }, [templates]);

  // Live count per clinical purpose category
  const purposeCounts = useMemo(() => {
    const counts: Record<TemplatePurpose, number> = {
      all: clinicalTemplates.length,
      proformas: 0,
      scans: 0,
      order_sets: 0,
      rx: 0,
      visit_types: 0,
    };
    clinicalTemplates.forEach((t) => {
      const p = getTemplatePurpose(t);
      counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [clinicalTemplates]);

  // Filtered templates by active purpose subtab + search query
  const filteredTemplates = useMemo(() => {
    return clinicalTemplates.filter((tmpl) => {
      if (templatePurposeTab !== 'all') {
        const p = getTemplatePurpose(tmpl);
        if (p !== templatePurposeTab) return false;
      }
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchTitle = (tmpl.title || '').toLowerCase().includes(q);
        const matchSlug = (tmpl.record_type || '').toLowerCase().includes(q);
        const matchDesc = (tmpl.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchDesc) return false;
      }
      return true;
    });
  }, [clinicalTemplates, templatePurposeTab, templateSearch]);

  const handleSelectPurposeTab = (tabId: TemplatePurpose) => {
    setTemplatePurposeTab(tabId);
    const matching = clinicalTemplates.filter((tmpl) => {
      if (tabId === 'all') return true;
      return getTemplatePurpose(tmpl) === tabId;
    });
    if (matching.length > 0) {
      const isCurrentInMatching = matching.some((m) => m.id === selectedTemplate?.id);
      if (!isCurrentInMatching) {
        handleSelectTemplate(matching[0]);
      }
    }
  };
  
  // New Template Modal State
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: '',
    record_type: 'clinical_template',
    plugin_id: 'fertility',
    description: '',
    schema_json: '[\n  {\n    "id": "field_1",\n    "label": "Assessment Notes",\n    "type": "textarea",\n    "placeholder": "Enter clinical assessment notes...",\n    "required": true\n  }\n]',
  });
  const [newTemplateEditorMode, setNewTemplateEditorMode] = useState<'form' | 'json'>('form');
  const [newTemplateFields, setNewTemplateFields] = useState<Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string;
    required?: boolean;
  }>>([
    { id: 'field_1', label: 'Assessment Notes', type: 'textarea', placeholder: 'Enter clinical assessment notes...', required: true }
  ]);
  const [isSavingNewTemplate, setIsSavingNewTemplate] = useState(false);
  const [newTemplateJsonError, setNewTemplateJsonError] = useState<string | null>(null);

  // ==========================================
  // 7. LABS & CRYOBANK STATE
  // ==========================================
  const [labSubTab, setLabSubTab] = useState<'lims' | 'cryo'>('lims');
  const [limsTests, setLimsTests] = useState<any[]>([]);
  const [cryoTankMap, setCryoTankMap] = useState<any>(null);

  // ==========================================
  // 8. PHARMACY MASTER STATE
  // ==========================================
  const [pharmaSubTab, setPharmaSubTab] = useState<'vendors' | 'inventory'>('vendors');
  const [pharmacyVendors, setPharmacyVendors] = useState<any[]>([]);
  const [pharmacyBatches, setPharmacyBatches] = useState<any[]>([]);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    gst_number: '',
    contact_phone: '',
    contact_email: '',
    address: '',
  });

  // Pharmacy stock batch edit state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [batchForm, setBatchForm] = useState({
    item_code: '',
    item_name: '',
    generic_name: '',
    category: 'Fertility / Hormones',
    batch_number: '',
    expiry_date: '',
    quantity_available: 50,
    quantity_received: 50,
    purchase_rate: 0,
    mrp: 0,
    selling_price: 0,
    rack_location: 'A003',
    branch_id: '',
    is_active: true,
  });
  const [batchSearch, setBatchSearch] = useState('');
  const [batchCategoryFilter, setBatchCategoryFilter] = useState('ALL');
  const [batchStatusFilter, setBatchStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // ==========================================
  // 9. ROLE PERMISSIONS STATE
  // ==========================================
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('admin');
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ==========================================
  // 10. IN-APP CSV HUB STATE
  // ==========================================
  const [csvDomains, setCsvDomains] = useState<any[]>([]);
  const [importDomainModal, setImportDomainModal] = useState<any | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [conflictMode, setConflictMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewingCsv, setIsPreviewingCsv] = useState(false);
  const [csvPreviewData, setCsvPreviewData] = useState<any | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<any[]>([]);
  const [csvPreviewFilter, setCsvPreviewFilter] = useState<'all' | 'overrides' | 'new'>('all');
  const [editingCsvRowIndex, setEditingCsvRowIndex] = useState<number | null>(null);
  const [editingCsvRowForm, setEditingCsvRowForm] = useState<any>({});
  const [importResult, setImportResult] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ==========================================
  // INITIAL DATA LOADER
  // ==========================================
  const loadInitialData = async () => {
    // 1. Hospital Profile & Multi-Branch
    adminApi
      .getHospitalProfile()
      .then((data) => {
        setHospitalProfile(data.hospital);
        const brs = data.branches || [];
        setHospitalBranches(brs);
        if (brs.length > 0) {
          const mainBr = brs.find((b) => b.is_main_branch) || brs[0];
          setLiveReceiptHeader((prev: any) => ({ ...prev, ...(mainBr.receipt_header || {}) }));
        }
      })
      .catch(() => {});

    // 2. Staff Users
    authApi
      .listUsers({ include_inactive: true })
      .then((res: any) => setStaffUsers(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 3. Billing Service Catalog & Packages
    billingApi
      .getServiceCatalog()
      .then((res: any) => setServiceCatalog(Array.isArray(res) ? res : []))
      .catch(() => {});
    billingApi
      .listPackages()
      .then((res: any) => setTreatmentPackages(Array.isArray(res) ? res : []))
      .catch(() => {});
    cosgynApi
      .getTreatments()
      .then((res: any) => setCosgynTreatments(Array.isArray(res) ? res : []))
      .catch(() => {});

    // 4. IPD Wards & Beds
    Promise.all([ipdApi.listWards(), ipdApi.listBeds()])
      .then(([w, b]: any) => {
        setWards(Array.isArray(w) ? w : []);
        setBeds(Array.isArray(b) ? b : []);
      })
      .catch(() => {});

    // 5. Treatment Cycles & Protocols
    treatmentCyclesApi
      .listTypes({ include_inactive: true })
      .then((ct: any) => setCycleTypes(Array.isArray(ct) ? ct : []))
      .catch(() => {});
    protocolsApi
      .list({ include_inactive: true })
      .then((pr: any) => {
        const pList = Array.isArray(pr) ? pr : [];
        setProtocols(pList);
        const activeList = pList.filter((p: any) => p.is_active !== false);
        if (activeList.length > 0) handleSelectProtocol(activeList[0]);
        else if (pList.length > 0) handleSelectProtocol(pList[0]);
      })
      .catch(() => {});

    // 6. Clinical Templates
    templatesApi
      .list()
      .then((t: any) => {
        const list = Array.isArray(t) ? t : [];
        setTemplates(list);
        const clinicalList = list.filter((item: any) => {
          const pId = (item.plugin_id || '').toLowerCase();
          const rType = (item.record_type || '').toLowerCase();
          return pId !== 'lims' && pId !== 'fertility_cryo' && !rType.startsWith('lims_') && !rType.startsWith('cryo_');
        });
        if (clinicalList.length > 0 && !selectedTemplate) handleSelectTemplate(clinicalList[0]);
      })
      .catch(() => {});

    // 7. Cryo Tanks & LIMS
    cryoApi.getTankMap().then((m: any) => setCryoTankMap(m)).catch(() => {});
    templatesApi.list('lims').then((res: any) => setLimsTests(Array.isArray(res) ? res : [])).catch(() => {});
    templatesApi.list('fertility_cryo').then((res: any) => {
      if (Array.isArray(res) && res.length > 0) setCryoTanks(res);
    }).catch(() => {});

    // 8. Pharmacy Vendors & Batches (Load all including inactive for master administration)
    pharmacyApi.listVendors().then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : [])).catch(() => {});
    pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : [])).catch(() => {});

    // 9. Role Permissions
    permissionProfilesApi
      .list()
      .then((p: any) => {
        const profList = p || [];
        setProfiles(profList);
        const adminProf = findProfileForRole('admin', profList) || profList[0];
        if (adminProf && !selectedProfile) {
          setSelectedProfile(adminProf);
          setSelectedRoleId('admin');
        }
      })
      .catch(() => {});

    // 10. CSV Hub Domains
    adminApi
      .listDomains()
      .then((d: any) => setCsvDomains(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Update receipt header form when selected branch changes
  useEffect(() => {
    if (hospitalBranches[selectedBranchIndex]) {
      const b = hospitalBranches[selectedBranchIndex];
      setLiveReceiptHeader((prev: any) => ({ ...prev, ...(b.receipt_header || {}) }));
    }
  }, [selectedBranchIndex, hospitalBranches]);

  // Protocol calendar preview
  const handleSelectProtocol = (proto: any) => {
    setSelectedProtocol(proto);
    if (proto?.id) {
      const today = new Date().toISOString().split('T')[0];
      protocolsApi
        .previewCalendar({
          protocol_template_id: proto.id,
          sentinel_dates: { stim_start: today, lmp_day1: today },
        })
        .then((res: any) => setProtocolPreviewCalendar(res?.days || []))
        .catch(() => setProtocolPreviewCalendar([]));
    }
  };

  // Schema parsing & field builder synchronization
  const parseSchemaToFields = (schemaObj: any) => {
    let fieldsArray: any[] = [];
    if (Array.isArray(schemaObj)) {
      fieldsArray = schemaObj;
    } else if (Array.isArray(schemaObj?.sections) && schemaObj.sections[0]?.fields) {
      fieldsArray = schemaObj.sections[0].fields;
    } else if (Array.isArray(schemaObj?.fields)) {
      fieldsArray = schemaObj.fields;
    } else if (typeof schemaObj === 'object' && schemaObj !== null) {
      fieldsArray = Object.entries(schemaObj).map(([k, v]) => ({
        id: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: typeof v === 'string' && (v.includes('\n') || v.length > 50) ? 'textarea' : 'text',
        placeholder: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
      }));
    }
    return fieldsArray.map((f: any, idx: number) => ({
      id: f.id || `field_${idx + 1}`,
      label: f.label || `Field ${idx + 1}`,
      type: f.type || 'text',
      placeholder: f.placeholder || '',
      options: Array.isArray(f.options) ? f.options.map((o: any) => typeof o === 'string' ? o : (o.label || o.value)).join(', ') : '',
      required: !!f.required,
    }));
  };

  const buildSchemaFromFields = (fields: Array<{ id: string; label: string; type: string; placeholder?: string; options?: string; required?: boolean }>) => {
    return fields.map((f, idx) => ({
      id: f.id || (f.label ? f.label.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : `field_${idx + 1}`),
      label: f.label || `Field ${idx + 1}`,
      type: f.type || 'text',
      placeholder: f.placeholder || undefined,
      options: ['select', 'checkbox_group'].includes(f.type) && f.options ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      required: !!f.required,
    }));
  };

  const handleActiveFieldsChange = (newFields: typeof activeTemplateFields) => {
    setActiveTemplateFields(newFields);
    const updatedSchema = buildSchemaFromFields(newFields);
    setParsedSchema(updatedSchema);
    setTemplateJsonText(JSON.stringify(updatedSchema, null, 2));
    setTemplateJsonError(null);
  };

  const handleNewTemplateFieldsChange = (newFields: typeof newTemplateFields) => {
    setNewTemplateFields(newFields);
    const updatedSchema = buildSchemaFromFields(newFields);
    setNewTemplateForm((prev) => ({
      ...prev,
      schema_json: JSON.stringify(updatedSchema, null, 2),
    }));
    setNewTemplateJsonError(null);
  };

  const handleNewTemplateJsonChange = (val: string) => {
    setNewTemplateForm((prev) => ({ ...prev, schema_json: val }));
    try {
      const parsed = JSON.parse(val);
      setNewTemplateFields(parseSchemaToFields(parsed));
      setNewTemplateJsonError(null);
    } catch (e: any) {
      setNewTemplateJsonError(e.message);
    }
  };

  const applyTemplatePreset = (type: 'consultation' | 'ultrasound' | 'rx' | 'order_set' | 'visit_type', target: 'new' | 'active') => {
    let presetFields: Array<{ id: string; label: string; type: string; placeholder?: string; options?: string; required?: boolean }> = [];
    if (type === 'consultation') {
      presetFields = [
        { id: 'chief_complaints', label: 'Chief Complaints & Onset', type: 'textarea', placeholder: 'Describe presenting symptoms...', required: true },
        { id: 'medical_history', label: 'Medical & Surgical History', type: 'textarea', placeholder: 'Prior interventions, surgeries, chronic conditions...' },
        { id: 'clinical_examination', label: 'Physical Examination Findings', type: 'textarea', placeholder: 'General, systemic, and local findings...' },
        { id: 'provisional_diagnosis', label: 'Provisional Diagnosis', type: 'text', placeholder: 'e.g. Primary Infertility, PCOS Phenotype B', required: true },
        { id: 'treatment_plan', label: 'Plan of Management & Advice', type: 'textarea', placeholder: 'Medications, follow-up tests, scheduled scans...' }
      ];
    } else if (type === 'ultrasound') {
      presetFields = [
        { id: 'scan_type', label: 'Scan Modality', type: 'select', options: 'TVS Pelvis, TAS Pelvis, Follicular Tracking, Early Pregnancy Viability', required: true },
        { id: 'endometrial_thickness', label: 'Endometrial Thickness (mm)', type: 'number', placeholder: 'e.g. 8.5', required: true },
        { id: 'endometrial_pattern', label: 'Endometrial Pattern', type: 'select', options: 'Triple Line (Trilaminar), Homogeneous, Hyperechoic, Cystic' },
        { id: 'dominant_follicle_size', label: 'Dominant Follicle Diameter (mm)', type: 'number', placeholder: 'e.g. 18.0' },
        { id: 'ovarian_afc', label: 'Antral Follicle Count (R/L)', type: 'text', placeholder: 'e.g. Right: 8, Left: 6' },
        { id: 'pod_fluid', label: 'Pouch of Douglas (POD) Fluid', type: 'select', options: 'Absent, Minimal, Significant Free Fluid' },
        { id: 'scan_impression', label: 'Sonographic Impression', type: 'textarea', placeholder: 'Key ultrasound summary...' }
      ];
    } else if (type === 'order_set') {
      presetFields = [
        { id: 'investigation_bundle', label: 'Included Diagnostic Investigations', type: 'checkbox_group', options: 'Serum AMH, Day 2 FSH/LH, Semen Analysis, TVS Baseline, Thyroid Profile (TSH), Prolactin, Viral Markers Panel', required: true },
        { id: 'clinical_indications', label: 'Clinical Indications', type: 'textarea', placeholder: 'e.g. Primary subfertility > 1.5 years, irregular cycles' },
        { id: 'pre_procedure_fasting', label: 'Fasting / Special Instructions', type: 'text', placeholder: 'e.g. 8-10 hours overnight fasting for metabolic panel' },
        { id: 'priority', label: 'Order Priority', type: 'select', options: 'Routine, Urgent, Stat' }
      ];
    } else if (type === 'rx') {
      presetFields = [
        { id: 'primary_drug', label: 'Drug / Brand Name', type: 'text', placeholder: 'e.g. Tab Metformin 500mg ER', required: true },
        { id: 'dosage', label: 'Dosage / Strength', type: 'text', placeholder: 'e.g. 500mg', required: true },
        { id: 'frequency', label: 'Frequency', type: 'select', options: 'OD (Once Daily), BD (Twice Daily), TDS (Thrice Daily), HS (At Bedtime), SOS (As Needed)', required: true },
        { id: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 30 days', required: true },
        { id: 'route', label: 'Route of Administration', type: 'select', options: 'Oral, Subcutaneous (SC), Intramuscular (IM), Vaginal, Topical' },
        { id: 'special_instructions', label: 'Special Instructions', type: 'textarea', placeholder: 'e.g. Take after food at night. Adequate water intake.' }
      ];
    } else if (type === 'visit_type') {
      presetFields = [
        { id: 'slot_duration_minutes', label: 'Default Slot Duration (Minutes)', type: 'number', placeholder: '30', required: true },
        { id: 'specialty_room', label: 'Designated Room / Cleanroom', type: 'select', options: 'Consultation Room 1, TVS Ultrasound Suite, IVF Cleanroom OT, Andrology Collection Room', required: true },
        { id: 'requires_empty_bladder', label: 'Bladder Preparation Protocol', type: 'select', options: 'Empty Bladder (TVS), Full Bladder (TAS/ET), Not Applicable' },
        { id: 'clinical_notes', label: 'Pre-Appointment Preparation Instructions', type: 'textarea', placeholder: 'Instructions sent to patient in booking SMS...' }
      ];
    }

    if (target === 'new') {
      handleNewTemplateFieldsChange(presetFields);
    } else {
      handleActiveFieldsChange(presetFields);
    }
  };

  const handleSetNewTemplatePurpose = (purpose: TemplatePurpose) => {
    setNewTemplatePurpose(purpose);
    let defaultRecordType = 'clinical_custom_proforma';
    let defaultPluginId = 'fertility';
    let defaultDesc = '';

    if (purpose === 'proformas') {
      defaultRecordType = 'clinical_workup_proforma';
      defaultPluginId = 'fertility';
      defaultDesc = 'Outpatient clinical evaluation & consultation history proforma';
      applyTemplatePreset('consultation', 'new');
    } else if (purpose === 'scans') {
      defaultRecordType = 'scan_pelvic_usg';
      defaultPluginId = 'fertility';
      defaultDesc = 'Ultrasound sonography scan & follicular tracking record';
      applyTemplatePreset('ultrasound', 'new');
    } else if (purpose === 'order_sets') {
      defaultRecordType = 'os_diagnostic_bundle';
      defaultPluginId = 'opd_order_set';
      defaultDesc = 'Bundled diagnostic investigations & clinical order set';
      applyTemplatePreset('order_set', 'new');
    } else if (purpose === 'rx') {
      defaultRecordType = 'rx_daily_regimen';
      defaultPluginId = 'rx_template';
      defaultDesc = 'Daily protocol prescription & hormonal medication support';
      applyTemplatePreset('rx', 'new');
    } else if (purpose === 'visit_types') {
      defaultRecordType = 'visit_scheduled_procedure';
      defaultPluginId = 'appointment_visit_type';
      defaultDesc = 'Appointment scheduling duration & facility resource allocation';
      applyTemplatePreset('visit_type', 'new');
    }

    setNewTemplateForm((prev) => ({
      ...prev,
      record_type: defaultRecordType,
      plugin_id: defaultPluginId,
      description: defaultDesc,
    }));
  };

  // Template select
  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setTemplateTitle(tmpl.title || '');
    setTemplateDesc(tmpl.description || '');
    const schemaObj = tmpl.schema_json || {};
    setParsedSchema(schemaObj);
    setTemplateJsonText(JSON.stringify(schemaObj, null, 2));
    setTemplateJsonError(null);
    setActiveTemplateFields(parseSchemaToFields(schemaObj));
    setBuilderGenericMode(false);

    const purpose = getTemplatePurpose(tmpl);
    if (purpose === 'rx') {
      setRxCategory(schemaObj?.category || 'Stimulation / OI');
      if (Array.isArray(schemaObj?.medications) && schemaObj.medications.length > 0) {
        setRxMedications(schemaObj.medications.map((m: any) => ({
          drug_name: m.drug_name || m.name || '',
          dose: m.dose || m.dosage || '',
          frequency: m.frequency || 'OD',
          duration: m.duration || '',
          instructions: m.instructions || '',
        })));
      } else {
        setRxMedications([{ drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }]);
      }
      setRxAdvice(schemaObj?.advice || '');
    } else if (purpose === 'order_sets') {
      setOrderCategory(schemaObj?.category || 'Fertility / IVF');
      if (Array.isArray(schemaObj?.investigations)) {
        setOrderInvestigations(schemaObj.investigations.join(', '));
      } else {
        setOrderInvestigations(schemaObj?.investigations || '');
      }
      if (Array.isArray(schemaObj?.medications) && schemaObj.medications.length > 0) {
        setOrderMedications(schemaObj.medications.map((m: any) => ({
          drug_name: m.drug_name || m.name || '',
          dose: m.dose || m.dosage || '',
          frequency: m.frequency || 'OD',
          duration: m.duration || '',
          instructions: m.instructions || '',
        })));
      } else {
        setOrderMedications([]);
      }
      setOrderInstructions(schemaObj?.instructions || '');
    } else if (purpose === 'proformas') {
      setProformaComplaint(schemaObj?.complaint || '');
      setProformaHopi(schemaObj?.hopi || '');
      setProformaDiagnosis(schemaObj?.diagnosis || '');
      setProformaInvestigations(schemaObj?.investigations || '');
      setProformaPlan(schemaObj?.plan || '');
    } else if (purpose === 'scans') {
      setScanType(schemaObj?.scan_type || 'Transvaginal Sonography (TVS)');
      setScanEndometrium(schemaObj?.endometrium || '');
      setScanRightOvary(schemaObj?.right_ovary || '');
      setScanLeftOvary(schemaObj?.left_ovary || '');
      setScanPod(schemaObj?.pouch_of_douglas || 'Clear / No free fluid');
      setScanImpression(schemaObj?.impression || '');
    } else if (purpose === 'visit_types') {
      setVisitDurationMinutes(schemaObj?.duration_minutes ? Number(schemaObj.duration_minutes) : 30);
      setVisitConsultationType(schemaObj?.consultation_type || 'Couple Consultation');
      setVisitRoom(schemaObj?.room || 'Consultation Room 1');
      setVisitTariffCode(schemaObj?.tariff_code || '');
      setVisitInstructions(schemaObj?.instructions || '');
    }
  };

  const handleJsonChange = (val: string) => {
    setTemplateJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setParsedSchema(parsed);
      setActiveTemplateFields(parseSchemaToFields(parsed));
      setTemplateJsonError(null);
    } catch (e: any) {
      setTemplateJsonError(e.message);
    }
  };

  // -------------------------------------------------------------
  // SAVE HANDLERS
  // -------------------------------------------------------------
  const handleSaveHospitalProfile = async () => {
    if (!hospitalProfile) return;
    setIsSavingHospital(true);
    try {
      const curBranch = hospitalBranches[selectedBranchIndex];
      const updatedReceiptHeader = {
        ...liveReceiptHeader,
        logo_url: hospitalProfile.logo_url || liveReceiptHeader.logo_url,
      };
      const branchesPayload = curBranch
        ? [
            {
              branch_id: curBranch.id,
              name: curBranch.name,
              code: curBranch.code,
              address: curBranch.address,
              phone: curBranch.phone,
              email: curBranch.email,
              gstin: liveReceiptHeader.gstin || curBranch.gstin,
              receipt_header: updatedReceiptHeader,
            },
          ]
        : [];

      await adminApi.updateHospitalProfile({
        name: hospitalProfile.name,
        address: hospitalProfile.address,
        phone: hospitalProfile.phone,
        email: hospitalProfile.email,
        logo_url: hospitalProfile.logo_url,
        branches: branchesPayload,
      });

      setLiveReceiptHeader(updatedReceiptHeader);
      alert('Hospital profile and branch receipt configuration saved successfully!');
      adminApi.getHospitalProfile().then((data) => {
        setHospitalProfile(data.hospital);
        setHospitalBranches(data.branches || []);
        if (data.branches && data.branches.length > 0 && setCurrentBranch) {
          const matchingBranch = data.branches.find((b: any) => b.id === curBranch?.id) || data.branches[0];
          setCurrentBranch(matchingBranch);
        }
      });
    } catch (e: any) {
      alert(e.message || 'Failed to save hospital settings');
    } finally {
      setIsSavingHospital(false);
    }
  };

  // Logo Upload Handler — validates pixel dimensions first
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate dimensions before uploading
    const dims = await new Promise<{ width: number; height: number }>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url); };
      img.src = url;
    });

    const MIN_W = 400, MAX_W = 2400, MIN_H = 60, MAX_H = 600;
    if (dims.width < MIN_W || dims.width > MAX_W || dims.height < MIN_H || dims.height > MAX_H) {
      alert(
        `Logo dimensions out of range.\n\n` +
        `Your image: ${dims.width} × ${dims.height} px\n` +
        `Required: width ${MIN_W}–${MAX_W} px, height ${MIN_H}–${MAX_H} px\n\n` +
        `Please crop or resize the image and try again.\n` +
        `(A horizontal/landscape logo 800–1600 px wide and 120–300 px tall works best.)`
      );
      e.target.value = '';
      return;
    }

    setIsUploadingLogo(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'hospital_logo');
      formData.append('category', 'branding');
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/core/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      const newLogo = data.url;
      setHospitalProfile((prev: any) => ({ ...prev, logo_url: newLogo }));
      setLiveReceiptHeader((prev: any) => ({ ...prev, logo_url: newLogo }));
      // Immediately persist to backend so it is saved without requiring extra manual action
      try {
        await adminApi.updateHospitalProfile({ ...hospitalProfile, logo_url: newLogo });
      } catch (saveErr) {
        console.warn('Auto-persist logo notice:', saveErr);
      }
      alert(`Hospital logo uploaded successfully! (${dims.width} × ${dims.height} px)`);
    } catch (err: any) {
      alert('Failed to upload logo: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Watermark / Background Image Upload Handler
  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingWatermark(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('vaidya_md_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'letterhead_watermark');
      formData.append('category', 'branding');
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/core/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(err.detail || 'Upload failed');
      }
      const data = await res.json();
      const newWatermark = data.url;
      setLiveReceiptHeader((prev: any) => ({ ...prev, watermark_url: newWatermark }));
      alert('Watermark background image uploaded successfully! View the live preview on the right.');
    } catch (err: any) {
      alert('Failed to upload watermark image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingWatermark(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveWatermark = () => {
    setLiveReceiptHeader((prev: any) => ({ ...prev, watermark_url: '' }));
  };

  // CSV Hub Authenticated Download Handler
  const handleDownloadCsv = async (domainKey: string, mode: 'blank' | 'export') => {
    try {
      await adminApi.downloadCsv(domainKey, mode, `${domainKey}_${mode}.csv`);
    } catch (err: any) {
      alert('Download failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Cycle Modality CRUD Handlers
  const handleSaveCycleType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycleType) {
        await treatmentCyclesApi.updateType(editingCycleType.id, cycleTypeForm);
        alert('Cycle modality updated successfully!');
      } else {
        await treatmentCyclesApi.createType(cycleTypeForm);
        alert('Cycle modality created successfully!');
      }
      setShowCycleModal(false);
      setEditingCycleType(null);
      setCycleTypeForm({ name: '', category: 'Stimulation', display_order: 0, is_active: true });
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to save cycle type');
    }
  };

  const handleToggleCycleType = async (cycleType: any) => {
    try {
      if (cycleType.is_active !== false) {
        if (!confirm(`Are you sure you want to deactivate modality "${cycleType.name}"? It will be disabled and hidden from new patient cycles.`)) return;
        await treatmentCyclesApi.deleteType(cycleType.id, false);
        alert('Modality deactivated successfully!');
      } else {
        await treatmentCyclesApi.reactivateType(cycleType.id);
        alert('Modality reactivated successfully!');
      }
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to update modality status');
    }
  };

  const handleHardDeleteCycleType = async (typeId: string, name: string) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete modality "${name}"? This CANNOT be undone!`)) return;
    try {
      await treatmentCyclesApi.deleteType(typeId, true);
      alert('Cycle modality permanently deleted!');
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to delete cycle modality');
    }
  };

  // Protocol CRUD Handlers
  const handleSaveProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProtocol) {
        await protocolsApi.update(editingProtocol.id, protocolForm);
        alert('Protocol updated successfully!');
      } else {
        await protocolsApi.create({ ...protocolForm, created_by: user?.id });
        alert('Protocol created successfully!');
      }
      setShowProtocolModal(false);
      setEditingProtocol(null);
      setProtocolForm({ name: '', category: 'stimulation', description: '', rules: [], timeline_events: [] });
      const updated = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(updated) ? updated : [];
      setProtocols(pList);
      if (editingProtocol) {
        const found = pList.find((p: any) => p.id === editingProtocol.id);
        if (found) handleSelectProtocol(found);
      } else if (pList.length > 0) {
        handleSelectProtocol(pList[0]);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save protocol');
    }
  };

  const handleDeactivateProtocol = async (protocolId: string) => {
    if (!confirm('Are you sure you want to deactivate this protocol template? It will be marked inactive and moved to the Inactive list.')) return;
    try {
      await protocolsApi.delete(protocolId, false);
      alert('Protocol template deactivated successfully!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      const updated = pList.find((p: any) => p.id === protocolId);
      if (updated) setSelectedProtocol(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate protocol');
    }
  };

  const handleReactivateProtocol = async (protocolId: string) => {
    try {
      await protocolsApi.reactivate(protocolId);
      alert('Protocol template reactivated successfully!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      const updated = pList.find((p: any) => p.id === protocolId);
      if (updated) setSelectedProtocol(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to reactivate protocol');
    }
  };

  const handleHardDeleteProtocol = async (protocolId: string, name: string) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete protocol "${name}" and all its rules? This action CANNOT be undone!`)) return;
    try {
      await protocolsApi.delete(protocolId, true);
      alert('Protocol permanently deleted!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      if (pList.length > 0) handleSelectProtocol(pList[0]);
      else setSelectedProtocol(null);
    } catch (e: any) {
      alert(e.message || 'Failed to delete protocol');
    }
  };

  // LIMS Test CRUD Handlers
  const handleSaveLimsTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = limsForm.test_code.toUpperCase().replace(/\s+/g, '-');
      const schemaData = {
        test_name: limsForm.test_name,
        test_code: code,
        category: limsForm.category,
        sample_type: limsForm.sample_type,
        tat_hours: Number(limsForm.tat_hours),
        parameters: [
          {
            name: limsForm.test_name,
            unit: limsForm.unit || '',
            ref_range: limsForm.ref_range,
          },
        ],
      };
      if (editingLimsTest) {
        await templatesApi.update(editingLimsTest.id, {
          title: limsForm.test_name,
          description: `${limsForm.category} | Sample: ${limsForm.sample_type} | TAT: ${limsForm.tat_hours}h | Code: ${code}`,
          schema_json: schemaData,
        });
        alert('LIMS test template updated!');
      } else {
        await templatesApi.create({
          plugin_id: 'lims',
          record_type: `lims_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: limsForm.test_name,
          description: `${limsForm.category} | Sample: ${limsForm.sample_type} | TAT: ${limsForm.tat_hours}h | Code: ${code}`,
          schema_json: schemaData,
        });
        alert('LIMS test template created!');
      }
      setShowLimsModal(false);
      setEditingLimsTest(null);
      setLimsForm({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });
      templatesApi.list('lims').then((res: any) => setLimsTests(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save LIMS test');
    }
  };

  const handleDeleteLimsTest = async (testId: string) => {
    if (!confirm('Are you sure you want to deactivate this LIMS test template?')) return;
    try {
      await templatesApi.update(testId, { is_active: false });
      alert('LIMS test template deactivated!');
      templatesApi.list('lims').then((res: any) => setLimsTests(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate LIMS test');
    }
  };

  // Cryo Tank CRUD Handlers
  const handleSaveCryoTank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = cryoTankForm.tank_code.toUpperCase().replace(/\s+/g, '-');
      const schemaData = {
        tank_name: cryoTankForm.tank_name,
        tank_code: code,
        tank_type: cryoTankForm.tank_type,
        location: cryoTankForm.location,
        canister_count: Number(cryoTankForm.canister_count),
        capacity_litres: Number(cryoTankForm.capacity_litres),
        canister_colours: ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Orange'],
        supported_device_types: ['Cryotop', 'CryoLock', 'CBS Straw'],
      };
      if (editingCryoTank) {
        await templatesApi.update(editingCryoTank.id, {
          title: cryoTankForm.tank_name,
          description: `${cryoTankForm.tank_type} | ${cryoTankForm.capacity_litres}L | ${cryoTankForm.location} | ${cryoTankForm.canister_count} Canisters`,
          schema_json: schemaData,
        });
        alert('Cryo tank storage updated!');
      } else {
        await templatesApi.create({
          plugin_id: 'fertility_cryo',
          record_type: `cryo_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: cryoTankForm.tank_name,
          description: `${cryoTankForm.tank_type} | ${cryoTankForm.capacity_litres}L | ${cryoTankForm.location} | ${cryoTankForm.canister_count} Canisters`,
          schema_json: schemaData,
        });
        alert('Cryo tank storage created!');
      }
      setShowCryoTankModal(false);
      setEditingCryoTank(null);
      setCryoTankForm({ tank_name: '', tank_code: '', tank_type: 'Autologous Embryos', canister_count: 6, capacity_litres: 35, location: 'IVF Cleanroom Cryo Suite A' });
      templatesApi.list('fertility_cryo').then((res: any) => setCryoTanks(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save Cryo tank');
    }
  };

  const handleDeleteCryoTank = async (tankId: string) => {
    if (!confirm('Are you sure you want to deactivate this Cryo tank?')) return;
    try {
      await templatesApi.update(tankId, { is_active: false });
      alert('Cryo tank deactivated!');
      templatesApi.list('fertility_cryo').then((res: any) => setCryoTanks(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate Cryo tank');
    }
  };

  const handleSaveStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deptsArray = staffForm.departments.split(',').map((d) => d.trim()).filter(Boolean);
      const isAdminRole = staffForm.role === 'admin' || staffForm.role === 'ADMIN';
      const effectiveIsActive = isAdminRole ? true : staffForm.is_active;
      if (editingStaffUser) {
        await authApi.adminUpdateUser(editingStaffUser.id, {
          name: staffForm.name,
          email: staffForm.email,
          role: staffForm.role,
          is_doctor: staffForm.is_doctor,
          branch_id: staffForm.branch_id || null,
          specialization: staffForm.specialization,
          qualification: staffForm.qualification,
          reg_number: staffForm.reg_number,
          phone: staffForm.phone,
          departments: deptsArray,
          is_active: effectiveIsActive,
          ...(staffForm.password ? { password: staffForm.password } : {}),
        });
        alert('Staff user updated successfully!');
      } else {
        if (!staffForm.password) {
          alert('Temporary password is required to create a new staff account.');
          return;
        }
        await authApi.createUser({
          name: staffForm.name,
          email: staffForm.email,
          password: staffForm.password,
          role: staffForm.role,
          is_doctor: staffForm.is_doctor,
          branch_id: staffForm.branch_id || null,
          specialization: staffForm.specialization,
          qualification: staffForm.qualification,
          reg_number: staffForm.reg_number,
          phone: staffForm.phone,
          departments: deptsArray,
        });
        alert('Staff user created successfully!');
      }
      setShowAddStaffModal(false);
      setShowEditStaffModal(false);
      authApi.listUsers({ include_inactive: true }).then((res: any) => setStaffUsers(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Error saving staff user');
    }
  };

  const handleSaveServiceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingServiceItem) {
        await billingApi.updateServiceItem(editingServiceItem.id, {
          code: serviceItemForm.code,
          name: serviceItemForm.name,
          category: serviceItemForm.category,
          base_price: Number(serviceItemForm.base_price),
          hsn_sac: serviceItemForm.hsn_sac,
          gst_rate: Number(serviceItemForm.gst_rate),
          branch_id: serviceItemForm.branch_id || null,
        });
        alert('Service item updated!');
      } else {
        await billingApi.createServiceItem({
          code: serviceItemForm.code,
          name: serviceItemForm.name,
          category: serviceItemForm.category,
          base_price: Number(serviceItemForm.base_price),
          hsn_sac: serviceItemForm.hsn_sac,
          gst_rate: Number(serviceItemForm.gst_rate),
          branch_id: serviceItemForm.branch_id || null,
        });
        alert('Service item created!');
      }
      setShowServiceModal(false);
      billingApi.getServiceCatalog().then((res: any) => setServiceCatalog(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save service item');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let itemsParsed: any[] = [];
      if (packageEditorMode === 'form') {
        itemsParsed = packageFormItems.map((it: any) => ({
          name: it.name?.trim() || 'Service Item',
          quantity: Math.max(1, Number(it.quantity || 1)),
          price: Math.max(0, Number(it.price ?? it.cost ?? 0)),
          service_code: it.code || it.service_code || '',
        }));
      } else {
        try {
          const raw = JSON.parse(packageForm.items_json);
          if (!Array.isArray(raw)) throw new Error('Items must be an array');
          itemsParsed = raw.map((it: any) => ({
            name: it.name?.trim() || 'Service Item',
            quantity: Math.max(1, Number(it.quantity || 1)),
            price: Math.max(0, Number(it.price ?? it.cost ?? 0)),
            service_code: it.code || it.service_code || '',
          }));
        } catch {
          alert('Items JSON is invalid. Please format as a JSON array of objects.');
          return;
        }
      }
      if (editingPackage) {
        await billingApi.updatePackage(editingPackage.id, {
          name: packageForm.name,
          description: packageForm.description,
          plugin_id: packageForm.plugin_id,
          base_price: Number(packageForm.base_price),
          items: itemsParsed,
        });
        alert('Package updated!');
      } else {
        await billingApi.createPackage({
          name: packageForm.name,
          description: packageForm.description,
          plugin_id: packageForm.plugin_id,
          base_price: Number(packageForm.base_price),
          items: itemsParsed,
          is_active: true,
        });
        alert('Treatment package created!');
      }
      setShowPackageModal(false);
      billingApi.listPackages().then((res: any) => setTreatmentPackages(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save package');
    }
  };

  const handleSaveCosgynTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!cosgynForm.name.trim()) {
        alert('Package name is required.');
        return;
      }
      const payload = {
        name: cosgynForm.name.trim(),
        package_combo: cosgynForm.package_combo.trim() || undefined,
        jet_plasma_sessions: Number(cosgynForm.jet_plasma_sessions) || 0,
        jet_plasma_duration_mins: Number(cosgynForm.jet_plasma_duration_mins) || 30,
        tesla_chair_sessions: Number(cosgynForm.tesla_chair_sessions) || 0,
        tesla_chair_duration_mins: Number(cosgynForm.tesla_chair_duration_mins) || 30,
        prp_sessions: Number(cosgynForm.prp_sessions) || 0,
        price: Number(cosgynForm.price) || 0,
      };

      if (editingCosgynTreatment) {
        await cosgynApi.updateTreatment(editingCosgynTreatment.id, payload);
        alert('CosGyn package updated successfully!');
      } else {
        await cosgynApi.createTreatment(payload);
        alert('CosGyn specialty package created successfully!');
      }
      setShowCosgynModal(false);
      refreshCosgynTreatments();
    } catch (err: any) {
      alert(err.message || 'Failed to save CosGyn package');
    }
  };

  const handleDeleteCosgynTreatment = async (treatmentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete CosGyn package "${name}"?`)) return;
    try {
      await cosgynApi.deleteTreatment(treatmentId);
      alert('Package deleted successfully.');
      refreshCosgynTreatments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await pharmacyApi.updateVendor(editingVendor.id, vendorForm);
        alert('Approved vendor updated successfully!');
      } else {
        await pharmacyApi.createVendor(vendorForm);
        alert('Approved vendor created successfully!');
      }
      setShowVendorModal(false);
      setEditingVendor(null);
      setVendorForm({ name: '', gst_number: '', contact_phone: '', contact_email: '', address: '' });
      pharmacyApi.listVendors().then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to deactivate/delete this vendor?')) return;
    try {
      await pharmacyApi.deleteVendor(vendorId);
      alert('Vendor deactivated successfully!');
      pharmacyApi.listVendors().then((v: any) => setPharmacyVendors(Array.isArray(v) ? v : []));
    } catch (e: any) {
      alert(e.message || 'Failed to delete vendor');
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBatch) {
        await pharmacyApi.updateBatch(editingBatch.id, batchForm);
        alert('Pharmacy formulary batch updated successfully!');
      } else {
        await pharmacyApi.createBatch(batchForm);
        alert('New pharmacy formulary batch created successfully!');
      }
      setShowBatchModal(false);
      setEditingBatch(null);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save pharmacy batch');
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    const target = pharmacyBatches.find((b) => b.id === batchId);
    const medName = target?.item_name || 'this medicine';
    if (!confirm(`Are you sure you want to deactivate "${medName}" (${target?.batch_number || ''})?\n\nDeactivating will prevent it from appearing in pharmacy stock and prevent dispensing.`)) return;
    try {
      await pharmacyApi.deleteBatch(batchId, { deactivate_all: true });
      alert(`Medication "${medName}" deactivated successfully. It is now excluded from pharmacy stock and FEFO dispensing.`);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate pharmacy batch');
    }
  };

  const handleReactivateBatch = async (batch: any) => {
    if (!confirm(`Reactivate "${batch.item_name}" (${batch.batch_number}) for pharmacy stock and dispensing?`)) return;
    try {
      await pharmacyApi.updateBatch(batch.id, { is_active: true });
      alert(`Medication "${batch.item_name}" reactivated successfully! It is now active in pharmacy stock.`);
      pharmacyApi.listBatches({ active_only: false }).then((b: any) => setPharmacyBatches(Array.isArray(b) ? b : []));
      queryClient.invalidateQueries({ queryKey: ['pharmacy-batches'] });
      window.dispatchEvent(new CustomEvent('pharmacy_inventory_updated'));
      if (typeof window !== 'undefined') {
        localStorage.setItem('pharmacy_stock_timestamp', Date.now().toString());
      }
    } catch (e: any) {
      alert(e.message || 'Failed to reactivate pharmacy batch');
    }
  };

  const handleSaveWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWard) {
        await ipdApi.updateWard(editingWard.id, {
          name: wardFormName,
          department: wardFormDept,
          base_charge_per_day: Number(wardFormRate),
        });
      } else {
        await ipdApi.createWard({
          name: wardFormName,
          code: wardFormCode.toUpperCase(),
          department: wardFormDept,
          base_charge_per_day: Number(wardFormRate),
          total_beds: Number(wardFormBeds),
          branch_id: hospitalBranches[selectedBranchIndex]?.id || hospitalBranches[0]?.id || null,
        });
      }
      setShowWardModal(false);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to save ward');
    }
  };

  const handleDeleteWard = async (wardId: string) => {
    if (!confirm('Are you sure you want to deactivate this ward?')) return;
    try {
      await ipdApi.deleteWard(wardId);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate ward');
    }
  };

  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!bedFormWardId) {
        alert('Please select a ward for the bed');
        return;
      }
      if (editingBed) {
        await ipdApi.updateBed(editingBed.id, {
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: Number(bedFormRate),
          status: bedFormStatus,
        });
      } else {
        await ipdApi.createBed({
          ward_id: bedFormWardId,
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: Number(bedFormRate),
          status: bedFormStatus,
        });
      }
      setShowBedModal(false);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to save bed');
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    if (!confirm('Are you sure you want to delete this bed?')) return;
    try {
      await ipdApi.deleteBed(bedId);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete bed');
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    setIsSavingProfile(true);
    try {
      if (selectedProfile.id) {
        await permissionProfilesApi.update(selectedProfile.id, {
          name: selectedProfile.name,
          description: selectedProfile.description,
          menu_permissions: selectedProfile.menu_permissions,
        });
        alert('Permission profile updated successfully!');
      } else {
        const created: any = await permissionProfilesApi.create({
          name: selectedProfile.name,
          description: selectedProfile.description,
          menu_permissions: selectedProfile.menu_permissions,
        });
        setSelectedProfile(created);
        alert('Permission profile created successfully!');
      }
      const updatedProfiles: any = await permissionProfilesApi.list();
      setProfiles(Array.isArray(updatedProfiles) ? updatedProfiles : []);
    } catch (e: any) {
      alert(e.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (templateJsonError || !selectedTemplate || !user) return;
    setIsSavingTemplate(true);
    try {
      let schemaPayload: any = parsedSchema;
      const purpose = getTemplatePurpose(selectedTemplate);

      if (templateViewMode === 'builder') {
        if (builderGenericMode) {
          schemaPayload = buildSchemaFromFields(activeTemplateFields);
        } else if (purpose === 'rx') {
          const validMeds = rxMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: rxCategory,
            medications: validMeds,
            advice: rxAdvice,
          };
        } else if (purpose === 'order_sets') {
          const invList = orderInvestigations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const validMeds = orderMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: orderCategory,
            investigations: invList,
            medications: validMeds,
            instructions: orderInstructions,
          };
        } else if (purpose === 'proformas') {
          schemaPayload = {
            complaint: proformaComplaint,
            hopi: proformaHopi,
            diagnosis: proformaDiagnosis,
            investigations: proformaInvestigations,
            plan: proformaPlan,
          };
        } else if (purpose === 'scans') {
          schemaPayload = {
            scan_type: scanType,
            endometrium: scanEndometrium,
            right_ovary: scanRightOvary,
            left_ovary: scanLeftOvary,
            pouch_of_douglas: scanPod,
            impression: scanImpression,
          };
        } else if (purpose === 'visit_types') {
          schemaPayload = {
            duration_minutes: Number(visitDurationMinutes),
            consultation_type: visitConsultationType,
            room: visitRoom,
            tariff_code: visitTariffCode,
            instructions: visitInstructions,
          };
        } else {
          schemaPayload = buildSchemaFromFields(activeTemplateFields);
        }
      } else if (templateViewMode === 'json') {
        schemaPayload = parsedSchema;
      }

      const updated: any = await templatesApi.update(selectedTemplate.id, {
        title: templateTitle,
        description: templateDesc,
        schema_json: schemaPayload,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTemplate(updated);
      setParsedSchema(schemaPayload);
      setTemplateJsonText(JSON.stringify(schemaPayload, null, 2));
      alert('Clinical Template schema published to EMR successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.title.trim()) {
      alert('Template Title is required.');
      return;
    }
    if (!newTemplateForm.record_type.trim()) {
      alert('Record Type / Slug is required.');
      return;
    }
    setIsSavingNewTemplate(true);
    try {
      let schemaPayload: any = [];
      if (newTemplateEditorMode === 'json') {
        try {
          schemaPayload = JSON.parse(newTemplateForm.schema_json);
        } catch (je: any) {
          alert('JSON Syntax Error: ' + je.message);
          setIsSavingNewTemplate(false);
          return;
        }
      } else {
        // Purpose-based clinical payload
        if (newTemplatePurpose === 'rx') {
          const validMeds = newRxMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: newRxCategory,
            medications: validMeds,
            advice: newRxAdvice,
          };
        } else if (newTemplatePurpose === 'order_sets') {
          const invList = newOrderInvestigations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const validMeds = newOrderMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: newOrderCategory,
            investigations: invList,
            medications: validMeds,
            instructions: newOrderInstructions,
          };
        } else if (newTemplatePurpose === 'proformas') {
          schemaPayload = {
            complaint: newProformaComplaint,
            hopi: newProformaHopi,
            diagnosis: newProformaDiagnosis,
            investigations: newProformaInvestigations,
            plan: newProformaPlan,
          };
        } else if (newTemplatePurpose === 'scans') {
          schemaPayload = {
            scan_type: newScanType,
            endometrium: newScanEndometrium,
            right_ovary: newScanRightOvary,
            left_ovary: newScanLeftOvary,
            pouch_of_douglas: newScanPod,
            impression: newScanImpression,
          };
        } else if (newTemplatePurpose === 'visit_types') {
          schemaPayload = {
            duration_minutes: Number(newVisitDurationMinutes),
            consultation_type: newVisitConsultationType,
            room: newVisitRoom,
            tariff_code: newVisitTariffCode,
            instructions: newVisitInstructions,
          };
        } else {
          schemaPayload = buildSchemaFromFields(newTemplateFields);
        }
      }

      const created: any = await templatesApi.create({
        title: newTemplateForm.title.trim(),
        record_type: newTemplateForm.record_type.trim(),
        plugin_id: newTemplateForm.plugin_id,
        description: newTemplateForm.description.trim(),
        schema_json: schemaPayload,
        is_active: true,
      });

      alert('Template created successfully!');
      setShowNewTemplateModal(false);
      setNewTemplateForm({
        title: '',
        record_type: 'clinical_template',
        plugin_id: 'fertility',
        description: '',
        schema_json: '[\n  {\n    "id": "field_1",\n    "label": "Assessment Notes",\n    "type": "textarea",\n    "placeholder": "Enter clinical assessment notes...",\n    "required": true\n  }\n]',
      });
      const res: any = await templatesApi.list();
      const list = Array.isArray(res) ? res : [];
      setTemplates(list);
      const found = list.find((t: any) => t.id === created?.id) || created;
      if (found) handleSelectTemplate(found);
    } catch (err: any) {
      alert(err.message || 'Failed to create template');
    } finally {
      setIsSavingNewTemplate(false);
    }
  };

  const handleFileSelectForImport = async (file: File, mode: 'overwrite' | 'skip' = conflictMode) => {
    setImportFile(file);
    setIsPreviewingCsv(true);
    setImportResult(null);
    setCsvPreviewData(null);
    setCsvPreviewRows([]);
    setEditingCsvRowIndex(null);

    try {
      const res = await adminApi.previewCsv(importDomainModal.key, file, mode);
      setCsvPreviewData(res);
      setCsvPreviewRows(res.stats?.preview_rows || []);
    } catch (err: any) {
      // Fallback client-side parsing if backend preview gives an error
      try {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
          const fallbackRows = lines.slice(1).map((line, idx) => {
            const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const rowObj: any = {};
            headers.forEach((h, i) => {
              rowObj[h] = vals[i] || '';
            });
            return {
              row_index: idx + 1,
              identifier: vals[0] || `Row ${idx + 1}`,
              name: vals[1] || vals[0] || `Item ${idx + 1}`,
              action: 'create',
              is_override: false,
              details: 'Ready to insert.',
              raw: rowObj,
            };
          });
          setCsvPreviewRows(fallbackRows);
          setCsvPreviewData({
            stats: {
              total_rows: fallbackRows.length,
              to_create: fallbackRows.length,
              inserted: fallbackRows.length,
              to_update: 0,
              updated: 0,
              to_skip: 0,
              skipped: 0,
              preview_rows: fallbackRows,
            },
          });
        }
      } catch (clientErr) {
        alert(err.message || 'Failed to preview CSV file');
      }
    } finally {
      setIsPreviewingCsv(false);
    }
  };

  const handleConflictModeChange = async (newMode: 'overwrite' | 'skip') => {
    setConflictMode(newMode);
    if (importFile && importDomainModal) {
      handleFileSelectForImport(importFile, newMode);
    }
  };

  const handleExecuteCsvImport = async () => {
    if (!importDomainModal || (!importFile && csvPreviewRows.length === 0)) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      let fileToUpload: File | Blob = importFile!;
      // If rows were edited or modified, reconstruct CSV Blob
      if (csvPreviewRows.length > 0 && importDomainModal.headers) {
        const headers: string[] = importDomainModal.headers;
        const csvLines = [headers.join(',')];
        for (const row of csvPreviewRows) {
          const rowVals = headers.map((h) => {
            const val = String(row.raw?.[h] ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
          });
          csvLines.push(rowVals.join(','));
        }
        fileToUpload = new Blob([csvLines.join('\r\n')], { type: 'text/csv' });
      }

      const res = await adminApi.importCsv(importDomainModal.key, fileToUpload, conflictMode, false);
      const inserted = res.stats?.inserted ?? res.stats?.created ?? 0;
      const updated = res.stats?.updated ?? 0;
      const skipped = res.stats?.skipped ?? 0;
      const normalizedResult = {
        ...res,
        stats: {
          ...res.stats,
          inserted,
          updated,
          skipped,
          total_rows: res.stats?.total_rows ?? csvPreviewRows.length,
        },
      };
      setImportResult(normalizedResult);
      alert(`Import completed successfully: ${inserted} inserted, ${updated} updated, ${skipped} skipped.`);
      loadInitialData();
    } catch (e: any) {
      alert(e.message || 'CSV Ingestion failed');
    } finally {
      setIsImporting(false);
    }
  };

  // -------------------------------------------------------------
  // RBAC ACCESS GUARD SCREEN
  // -------------------------------------------------------------
  if (!isSuperAdmin) {
    return (
      <div className="w-full h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-xl border border-slate-200 mt-6 shadow-sm">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Master Administration Restricted</h2>
        <p className="text-slate-500 text-sm max-w-md mt-2 mb-6">
          Hospital legal settings, staff credentialing, statutory tariffs, cycle rules, and bulk database sync are strictly reserved for Super-Administrator accounts.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-mid text-white font-medium text-xs rounded-lg shadow-sm transition-colors"
        >
          ← Return to Clinical Dashboard
        </a>
      </div>
    );
  }

  return (
    <PageLayout className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hospital Master Settings</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-md">
              Super-Admin Control Center
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Centralized governance for Multi-Branch Branding, Staff Roster, Tariffs, IPD Beds, ART Cycles, EMR Schemas, Cryobank & CSV Sync.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInitialData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload All Masters
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout: Collapsible Left-Side Settings Rail + Main Panel */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Collapsible Settings Rail */}
        <aside className={`transition-all duration-200 shrink-0 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs sticky top-4 z-10 ${
          isNavCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-2">
            {!isNavCollapsed && (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Settings Menu
              </span>
            )}
            <button
              onClick={() => setIsNavCollapsed(!isNavCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors mx-auto lg:mx-0"
              title={isNavCollapsed ? 'Expand Navigation' : 'Collapse Navigation'}
            >
              {isNavCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
          <nav className="space-y-1">
            {[
              { id: 'hospital', label: '1. Hospital & Branding', icon: Building2, badge: `${hospitalBranches.length}` },
              { id: 'staff', label: '2. Staff User Roster', icon: Users, badge: `${staffUsers.length}` },
              { id: 'tariffs', label: '3. Tariffs & Packages', icon: IndianRupee, badge: `${serviceCatalog.length}` },
              { id: 'ipd', label: '4. IPD Wards & Beds', icon: BedDouble, badge: `${beds.length}` },
              { id: 'cycles', label: '5. ART Cycles & Protocols', icon: Dna, badge: `${cycleTypes.length}` },
              { id: 'templates', label: '6. Clinical & Rx Templates', icon: FileText, badge: `${clinicalTemplates.length}` },
              { id: 'labs', label: '7. Labs & Cryobank', icon: FlaskConical, badge: `${limsTests.length || 'LIMS'}` },
              { id: 'pharmacy', label: '8. Pharmacy Master', icon: Pill, badge: `${pharmacyVendors.length}` },
              { id: 'profiles', label: '9. Role Permissions', icon: ShieldCheck, badge: `${VAIDYAMD_ROLES.length}` },
              { id: 'csv_hub', label: '10. In-App CSV Hub', icon: FileSpreadsheet, badge: `${csvDomains.length || 14}` },
            ].map((t) => {
              const TabIcon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  title={isNavCollapsed ? t.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  } ${isNavCollapsed ? 'justify-center px-2' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TabIcon className="w-4 h-4 shrink-0" />
                    {!isNavCollapsed && <span className="truncate">{t.label}</span>}
                  </div>
                  {!isNavCollapsed && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-white/20 text-white font-normal' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area for Selected Tab */}
        <div className="flex-1 min-w-0 w-full space-y-6">

      {/* ========================================================================= */}
      {/* TAB 1: HOSPITAL & MULTI-BRANCH BRANDING WITH LIVE A4 PRINT PREVIEW        */}
      {/* ========================================================================= */}
      {activeTab === 'hospital' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Hospital Profile & Branch Header Form */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Hospital Legal Identity</h2>
                  <p className="text-[11px] text-slate-500">Global parent organization registered credentials</p>
                </div>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                  VID Prefix: {hospitalProfile?.code || '---'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hospital / Institute Name</label>
                  <input
                    type="text"
                    value={hospitalProfile?.name || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Hospital Email</label>
                  <input
                    type="email"
                    value={hospitalProfile?.email || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Central Helpline Phone</label>
                  <input
                    type="text"
                    value={hospitalProfile?.phone || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-slate-700 font-semibold">Hospital Logo</label>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="text-[11px] text-primary hover:text-primary-mid font-semibold flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    {hospitalProfile?.logo_url && (
                      <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center p-0.5">
                        <img
                          src={resolveLogoUrl(hospitalProfile.logo_url)}
                          alt="Logo"
                          className="max-w-full max-h-full object-contain"
                          crossOrigin="anonymous"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      value={hospitalProfile?.logo_url || ''}
                      onChange={(e) => setHospitalProfile({ ...hospitalProfile, logo_url: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary text-xs"
                      placeholder="Upload file or enter URL..."
                    />
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Registered Headquarters Address</label>
                  <input
                    type="text"
                    value={hospitalProfile?.address || ''}
                    onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Branch Selector & Receipt Customizer */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Branch Receipt & Invoice Letterhead</h2>
                  <p className="text-[11px] text-slate-500">Configure physical print headers for outpatient bills, lab reports & discharge summaries</p>
                </div>
                {/* Branch Switcher Pill */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                  {hospitalBranches.map((br, idx) => (
                    <button
                      key={br.id}
                      onClick={() => setSelectedBranchIndex(idx)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedBranchIndex === idx ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {br.name} {br.is_main_branch ? '⭐' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {hospitalBranches[selectedBranchIndex] && (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Receipt Header Title</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.title || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, title: e.target.value })}
                        placeholder="e.g. Vaidya Institute of Reproductive Medicine"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Tagline / Subtext</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.tagline || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, tagline: e.target.value })}
                        placeholder="e.g. Centre for Advanced Reproductive Genetics & IVF"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Branch GSTIN</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.gstin || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, gstin: e.target.value })}
                        placeholder="36AAAAA0000A1Z5"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">ART Clinic Reg. No.</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.art_reg_number || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, art_reg_number: e.target.value })}
                        placeholder="ART/TEL/HYD/2024/008"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">CEA / State Reg. No.</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.cea_reg_number || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, cea_reg_number: e.target.value })}
                        placeholder="CEA/HYD/8892"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Physical Address on Letterhead</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.address || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, address: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Contact Phone(s)</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.phone || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Website URL</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.website || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, website: e.target.value })}
                        placeholder="e.g. www.vaidyafertility.in"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Clinic Timings (for footer)</label>
                      <input
                        type="text"
                        value={liveReceiptHeader.timings || ''}
                        onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, timings: e.target.value })}
                        placeholder="e.g. Mon–Sat: 9:00 AM – 6:00 PM"
                        className="w-full px-3 py-2 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Statutory Invoice Footer / Disclaimer</label>
                    <textarea
                      rows={2}
                      value={liveReceiptHeader.disclaimer || ''}
                      onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, disclaimer: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs"
                    />
                  </div>

                  {/* ── Print Header Lines & Color Customization ── */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Palette className="w-4 h-4 text-primary" />
                      <span>Print Header Lines & Pre-printed Pad Dimensions</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Bold Accent Line Color */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <label className="block text-slate-700 font-semibold text-[11px]">
                          Bold Header & Footer Stripe (Primary)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={liveReceiptHeader.header_bold_color || '#4A2E2B'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={liveReceiptHeader.header_bold_color || '#4A2E2B'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: e.target.value })}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400">Presets:</span>
                          {[
                            { color: '#4A2E2B', label: 'Mahogany' },
                            { color: '#0B4F6C', label: 'Navy' },
                            { color: '#065F46', label: 'Emerald' },
                            { color: '#1E40AF', label: 'Royal' },
                            { color: '#334155', label: 'Slate' },
                          ].map((p) => (
                            <button
                              key={p.color}
                              type="button"
                              onClick={() => setLiveReceiptHeader({ ...liveReceiptHeader, header_bold_color: p.color })}
                              title={p.label}
                              className="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-110 transition-transform"
                              style={{ background: p.color }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Small / Thin Divider Line Color */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <label className="block text-slate-700 font-semibold text-[11px]">
                          Small Divider Line (Secondary)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={liveReceiptHeader.header_small_color || '#C29B7F'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                          />
                          <input
                            type="text"
                            value={liveReceiptHeader.header_small_color || '#C29B7F'}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: e.target.value })}
                            className="w-24 px-2 py-1 text-xs border border-slate-200 rounded font-mono uppercase font-bold"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400">Presets:</span>
                          {[
                            { color: '#C29B7F', label: 'Warm Tan' },
                            { color: '#94A3B8', label: 'Subtle Slate' },
                            { color: '#D97706', label: 'Amber Gold' },
                            { color: '#E2A99B', label: 'Rose Gold' },
                            { color: '#64748B', label: 'Cool Gray' },
                          ].map((p) => (
                            <button
                              key={p.color}
                              type="button"
                              onClick={() => setLiveReceiptHeader({ ...liveReceiptHeader, header_small_color: p.color })}
                              title={p.label}
                              className="w-4 h-4 rounded-full border border-white shadow-xs hover:scale-110 transition-transform"
                              style={{ background: p.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pre-printed Pad Spacing Dimensions */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Pad Header Spacing (Non-header prints)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={liveReceiptHeader.pad_header_height_mm ?? 35}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, pad_header_height_mm: Number(e.target.value) })}
                            className="w-28 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium">mm (default: 35)</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Pad Footer Spacing (Non-header prints)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="80"
                            value={liveReceiptHeader.pad_footer_height_mm ?? 25}
                            onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, pad_footer_height_mm: Number(e.target.value) })}
                            className="w-28 px-3 py-1.5 border border-slate-200 rounded font-mono text-xs font-bold"
                          />
                          <span className="text-xs text-slate-500 font-medium">mm (default: 25)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Background Watermark Upload & Configuration ── */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <UploadCloud className="w-4 h-4 text-primary" />
                        <span>Print Watermark / Background Image</span>
                      </div>
                      {liveReceiptHeader.watermark_url && (
                        <button
                          type="button"
                          onClick={handleRemoveWatermark}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Remove Watermark
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <input
                          ref={watermarkInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleWatermarkUpload}
                        />
                        <button
                          type="button"
                          disabled={isUploadingWatermark}
                          onClick={() => watermarkInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 border-2 border-dashed border-slate-300 hover:border-primary rounded-lg text-slate-700 font-semibold text-xs transition-colors bg-slate-50/50"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isUploadingWatermark ? 'Uploading...' : liveReceiptHeader.watermark_url ? 'Change Watermark Image' : 'Upload Watermark Image'}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          PNG or JPG (transparent background works best)
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold text-[11px] mb-1">
                          Watermark Opacity: {Math.round((liveReceiptHeader.watermark_opacity ?? 0.08) * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.02"
                          max="0.25"
                          step="0.01"
                          value={liveReceiptHeader.watermark_opacity ?? 0.08}
                          onChange={(e) => setLiveReceiptHeader({ ...liveReceiptHeader, watermark_opacity: parseFloat(e.target.value) })}
                          className="w-full cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[9px] text-slate-400">
                          <span>Faint (2%)</span>
                          <span>Default (8%)</span>
                          <span>Vivid (25%)</span>
                        </div>
                      </div>
                    </div>

                    {liveReceiptHeader.watermark_url && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <img
                          src={resolveLogoUrl(liveReceiptHeader.watermark_url)}
                          alt="Watermark Preview"
                          className="w-12 h-12 object-contain bg-white rounded border border-slate-200 p-1"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800 block">Watermark Active</span>
                          <span className="text-[10px] text-slate-500">Will render centered behind content on all hospital prints</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveHospitalProfile}
                      disabled={isSavingHospital}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {isSavingHospital ? 'Saving Updates...' : 'Save & Publish Branding'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live A4 Physical Print Letterhead Preview */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-slate-500" />
                Live Side-by-Side A4 Receipt & Report Preview
              </span>
              <span className="text-[11px] text-slate-500">Reflects real-time input changes</span>
            </div>

            {/* A4 Sheet Container — mirrors PrintableReportHeader + PrintableReportFooter exactly */}
            <div className="bg-white border-2 border-slate-300 rounded-xl shadow-md font-sans text-slate-800 flex flex-col min-h-[700px] overflow-hidden relative">

              {/* Centered Watermark Background (matching reference photo) */}
              {liveReceiptHeader.watermark_url && (
                <div
                  className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-0"
                  aria-hidden="true"
                >
                  <img
                    src={resolveLogoUrl(liveReceiptHeader.watermark_url)}
                    alt=""
                    className="w-64 max-h-64 object-contain"
                    style={{ opacity: liveReceiptHeader.watermark_opacity ?? 0.08 }}
                  />
                </div>
              )}

              {/* ── TOP BOLD ACCENT STRIPE (Full Bleed to Paper Edges) ── */}
              <div
                className="h-2 w-full relative z-10 block m-0 p-0"
                style={{
                  background: liveReceiptHeader.header_bold_color || '#4A2E2B',
                  borderTop: `6px solid ${liveReceiptHeader.header_bold_color || '#4A2E2B'}`,
                }}
              />

              {/* ── LOGO-ONLY CENTERED HEADER ── */}
              <div className="pb-3 pt-3 flex flex-col items-center justify-center text-center gap-1 px-6 relative z-10">
                {hospitalProfile?.logo_url || liveReceiptHeader?.logo_url ? (
                  <img
                    src={resolveLogoUrl(hospitalProfile?.logo_url || liveReceiptHeader?.logo_url)}
                    alt="Hospital Logo"
                    className="max-h-24 max-w-full object-contain mx-auto"
                    crossOrigin="anonymous"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow"
                      style={{ background: liveReceiptHeader.header_bold_color || '#4A2E2B' }}
                    >
                      {hospitalProfile?.name?.charAt(0) || 'V'}
                    </div>
                    <div className="text-left">
                      <h1 className="font-bold text-base leading-tight text-slate-900 tracking-wide uppercase">
                        {hospitalProfile?.name || 'HOSPITAL & FERTILITY INSTITUTE'}
                      </h1>
                      <p className="text-[10px] font-semibold text-slate-500">
                        {liveReceiptHeader.tagline || 'Clinical Department & Medical Records'}
                      </p>
                    </div>
                  </div>
                )}
                {/* ── SMALL / THIN DIVIDER LINE UNDER LOGO ── */}
                <div
                  className="w-full mt-2"
                  style={{
                    height: '1.5px',
                    background: liveReceiptHeader.header_small_color || '#C29B7F',
                    borderTop: `1.5px solid ${liveReceiptHeader.header_small_color || '#C29B7F'}`,
                  }}
                />
              </div>

              {/* ── DOCUMENT TITLE ── */}
              <div className="text-center py-2 border-b border-slate-100 px-6 relative z-10">
                <h2 className="text-xs font-bold text-slate-900 tracking-wide uppercase">OFFICIAL INVOICE / CLINICAL REPORT</h2>
              </div>

              {/* ── PATIENT METADATA BANNER ── */}
              <div className="bg-slate-50/90 border-b border-slate-200 p-3 grid grid-cols-4 gap-3 text-[10px] px-6 relative z-10 backdrop-blur-2xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Patient</span>
                  <span className="font-bold text-slate-800">Priya Sharma</span>
                  <span className="text-slate-500 block">29Y / Female</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">VID / MRN</span>
                  <span className="font-bold font-mono text-slate-800">HYD01-2024-0012</span>
                  <span className="text-slate-500 block">Blood: A+</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Consultant</span>
                  <span className="font-bold text-slate-800">Dr. Ananya Rao</span>
                  <span className="text-slate-500 block">MD, DRM · TSMC-44912</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Document No.</span>
                  <span className="font-bold font-mono text-slate-800">INV-MAIN-00104</span>
                  <span className="text-slate-500 block">Date: {new Date().toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* ── SAMPLE LINE ITEMS ── */}
              <div className="flex-1 px-6 py-4 relative z-10">
                <table className="w-full text-left text-[10px] border border-slate-200 rounded overflow-hidden bg-white/95">
                  <thead className="bg-slate-100 text-slate-700 text-[9px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Service Description</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 px-3 font-medium">IVF ICSI Cycle Procedure Fee</td><td className="py-1.5 px-2 text-center">1</td><td className="py-1.5 px-2 text-right font-mono">₹1,20,000</td><td className="py-1.5 px-3 text-right font-mono">₹1,20,000</td></tr>
                    <tr><td className="py-1.5 px-3 font-medium">Follicular Monitoring Ultrasound</td><td className="py-1.5 px-2 text-center">4</td><td className="py-1.5 px-2 text-right font-mono">₹1,200</td><td className="py-1.5 px-3 text-right font-mono">₹4,800</td></tr>
                    <tr><td className="py-1.5 px-3 font-medium">LIMS Serum Estradiol (E2) Assay</td><td className="py-1.5 px-2 text-center">2</td><td className="py-1.5 px-2 text-right font-mono">₹800</td><td className="py-1.5 px-3 text-right font-mono">₹1,600</td></tr>
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-[10px]">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right">Total Payable:</td>
                      <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: liveReceiptHeader.header_bold_color || '#4A2E2B' }}>
                        ₹1,26,400
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatory */}
                <div className="flex justify-between items-end mt-6 text-[10px] text-slate-500">
                  <p className="italic">{liveReceiptHeader.disclaimer || 'Computer-generated certified clinical documentation.'}</p>
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1" />
                    <span className="font-semibold text-slate-700">Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* ── FOOTER — matches PrintableReportFooter exactly (Full Bleed) ── */}
              <div className="relative z-10 mt-auto w-full">
                <div className="px-6 space-y-1 text-center">
                  {/* ── Small Divider Line Above Footer ── */}
                  <div
                    className="w-full"
                    style={{
                      height: '1.5px',
                      background: liveReceiptHeader.header_small_color || '#C29B7F',
                      borderTop: `1.5px solid ${liveReceiptHeader.header_small_color || '#C29B7F'}`,
                    }}
                  />

                  <div className="pt-2 pb-1 space-y-1">
                    {(hospitalProfile?.address || liveReceiptHeader?.address) && (
                      <div className="flex items-start justify-center gap-1 font-semibold text-slate-700 text-[9px]">
                        <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{hospitalProfile?.address || liveReceiptHeader?.address || 'Clinic Address'}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-x-2.5 text-[8.5px] text-slate-600 font-medium">
                      {(hospitalProfile?.phone || liveReceiptHeader?.phone) && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-2 h-2 text-slate-500" />
                          <span>{hospitalProfile?.phone || liveReceiptHeader?.phone}</span>
                        </div>
                      )}
                      {(hospitalProfile?.phone || liveReceiptHeader?.phone) && (hospitalProfile?.email || liveReceiptHeader?.email) && <span className="text-slate-300">|</span>}
                      {(hospitalProfile?.email || liveReceiptHeader?.email) && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-2 h-2 text-slate-500" />
                          <span>{hospitalProfile?.email || liveReceiptHeader?.email}</span>
                        </div>
                      )}
                      {(liveReceiptHeader?.website) && <><span className="text-slate-300">|</span><div className="flex items-center gap-1"><Globe className="w-2 h-2 text-slate-500" /><span>{liveReceiptHeader.website}</span></div></>}
                      {(liveReceiptHeader?.timings) && <><span className="text-slate-300">|</span><div className="flex items-center gap-1"><Clock className="w-2 h-2 text-slate-500" /><span>{liveReceiptHeader.timings}</span></div></>}
                    </div>
                  </div>

                  {/* Dynamic Page Counter & Certification */}
                  <div className="flex items-center justify-between text-[8px] text-slate-400 pb-1">
                    <span className="italic truncate">{liveReceiptHeader.disclaimer || 'Certified computer-generated medical record.'}</span>
                    <span className="font-mono font-medium shrink-0">Page 1 of 1</span>
                  </div>
                </div>

                {/* ── BOTTOM BOLD ACCENT STRIPE (Full Bleed to Paper Edges) ── */}
                <div
                  className="h-2 w-full block m-0 p-0"
                  style={{
                    backgroundColor: liveReceiptHeader.header_bold_color || '#4A2E2B',
                    borderTop: `6px solid ${liveReceiptHeader.header_bold_color || '#4A2E2B'}`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB 2: STAFF USER ROSTER & CREDENTIALING                                  */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff name, email, reg no..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <select
                value={staffRoleFilter}
                onChange={(e) => setStaffRoleFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctor</option>
                <option value="embryologist">Embryologist</option>
                <option value="nurse">Nurse</option>
                <option value="pharma">Pharmacist</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <button
              onClick={() => {
                setEditingStaffUser(null);
                setStaffForm({
                  name: '',
                  email: '',
                  password: '',
                  role: 'doctor',
                  is_doctor: true,
                  branch_id: hospitalBranches[0]?.id || '',
                  specialization: 'Reproductive Medicine',
                  qualification: 'MBBS, MS (OBG), DRM',
                  reg_number: '',
                  phone: '',
                  departments: 'OPD, Fertility',
                  is_active: true,
                });
                setShowAddStaffModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add New Staff User
            </button>
          </div>

          {/* Staff Roster Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Role & Privileges</th>
                  <th className="py-3 px-3">Specialization & Qualifications</th>
                  <th className="py-3 px-3">Registration No.</th>
                  <th className="py-3 px-3">Branch Location</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffUsers
                  .filter((u) => {
                    const matchesSearch =
                      u.name?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                      u.email?.toLowerCase().includes(staffSearch.toLowerCase()) ||
                      u.reg_number?.toLowerCase().includes(staffSearch.toLowerCase());
                    const matchesRole = staffRoleFilter === 'all' || u.role?.toLowerCase() === staffRoleFilter.toLowerCase();
                    return matchesSearch && matchesRole;
                  })
                  .map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{userItem.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{userItem.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 text-slate-700">
                          {userItem.role}
                        </span>
                        {userItem.is_doctor && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            Specialist MD
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{userItem.specialization || 'Clinical Staff'}</div>
                        <div className="text-[10px] text-slate-500">{userItem.qualification || '---'}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                        {userItem.reg_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {hospitalBranches.find((b) => b.id === userItem.branch_id)?.name || 'Main Facility'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            userItem.role === 'admin'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : userItem.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {userItem.role === 'admin' ? 'Permanent Active' : userItem.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingStaffUser(userItem);
                            setStaffForm({
                              name: userItem.name,
                              email: userItem.email,
                              password: '',
                              role: userItem.role,
                              is_doctor: userItem.is_doctor,
                              branch_id: userItem.branch_id || '',
                              specialization: userItem.specialization || '',
                              qualification: userItem.qualification || '',
                              reg_number: userItem.reg_number || '',
                              phone: userItem.phone || '',
                              departments: (userItem.departments || []).join(', '),
                              is_active: userItem.is_active,
                            });
                            setShowEditStaffModal(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md shadow-xs"
                        >
                          Edit / Reset Pwd
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TARIFFS & PACKAGES MASTER                                         */}
      {/* ========================================================================= */}
      {activeTab === 'tariffs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTariffSubTab('catalog')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tariffSubTab === 'catalog' ? 'bg-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Master Service Catalog ({serviceCatalog.length})
              </button>
              <button
                onClick={() => setTariffSubTab('packages')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tariffSubTab === 'packages' ? 'bg-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Bundled Treatment Packages ({treatmentPackages.length})
              </button>
              <button
                onClick={() => setTariffSubTab('cosgyn')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  tariffSubTab === 'cosgyn' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                CosGyn Specialty Packages ({cosgynTreatments.length})
              </button>
            </div>
            {tariffSubTab === 'catalog' && (
              <button
                onClick={() => {
                  setEditingServiceItem(null);
                  setServiceItemForm({
                    code: '',
                    name: '',
                    category: 'Consultation',
                    base_price: 1000,
                    hsn_sac: '999312',
                    gst_rate: 0,
                    branch_id: '',
                  });
                  setShowServiceModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service Item
              </button>
            )}
            {tariffSubTab === 'packages' && (
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setPackageFormItems([{ name: 'Consultation & Scan', quantity: 1, price: 1500 }]);
                  setPackageEditorMode('form');
                  setPackageForm({
                    name: '',
                    description: '',
                    plugin_id: 'fertility',
                    base_price: 150000,
                    items_json: JSON.stringify([{ name: 'Consultation & Scan', quantity: 1, price: 1500 }], null, 2),
                  });
                  setShowPackageModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Treatment Package
              </button>
            )}
            {tariffSubTab === 'cosgyn' && (
              <button
                onClick={() => {
                  setEditingCosgynTreatment(null);
                  setCosgynForm({
                    name: '',
                    package_combo: '',
                    jet_plasma_sessions: 0,
                    jet_plasma_duration_mins: 30,
                    tesla_chair_sessions: 0,
                    tesla_chair_duration_mins: 30,
                    prp_sessions: 0,
                    price: 25000,
                  });
                  setShowCosgynModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add CosGyn Package
              </button>
            )}
          </div>

          {tariffSubTab === 'catalog' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-3">Service Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">HSN/SAC</th>
                    <th className="py-3 px-3 text-center">GST Rate</th>
                    <th className="py-3 px-4 text-right">Standard Tariff</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceCatalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{item.code}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                          {item.category || item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{item.hsn_sac || '999312'}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{item.gst_rate}%</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.base_price || item.cost || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingServiceItem(item);
                            setServiceItemForm({
                              code: item.code,
                              name: item.name,
                              category: item.category || 'Consultation',
                              base_price: item.base_price || item.cost,
                              hsn_sac: item.hsn_sac || '999312',
                              gst_rate: item.gst_rate || 0,
                              branch_id: item.branch_id || '',
                            });
                            setShowServiceModal(true);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-primary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tariffSubTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatmentPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{pkg.name}</h3>
                    <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                      {formatCurrency(pkg.base_price ?? pkg.price ?? pkg.amount ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{pkg.description || 'Comprehensive treatment bundle.'}</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1.5">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-700">Included Services ({(pkg.items || []).length}):</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Sum: {formatCurrency((pkg.items || []).reduce((acc: number, it: any) => acc + ((Number(it.price ?? it.cost ?? 0)) * Number(it.quantity || 1)), 0))}
                      </span>
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {(pkg.items || []).slice(0, 4).map((it: any, i: number) => {
                        const price = Number(it.price ?? it.cost ?? 0);
                        const qty = Number(it.quantity || 1);
                        return (
                          <li key={i} className="flex justify-between items-center text-[11px] border-b border-slate-100 last:border-0 pb-0.5">
                            <span className="truncate pr-2 font-medium text-slate-700">
                              • {it.name || it.description} <span className="text-slate-400 font-mono text-[10px]">({qty}x)</span>
                            </span>
                            <span className="font-mono font-semibold text-slate-800 shrink-0">
                              {formatCurrency(price * qty)}
                            </span>
                          </li>
                        );
                      })}
                      {(pkg.items || []).length > 4 && (
                        <li className="text-primary font-semibold text-[10px] pt-0.5 text-right">
                          + {(pkg.items || []).length - 4} more services included
                        </li>
                      )}
                      {(!pkg.items || pkg.items.length === 0) && (
                        <li className="text-slate-400 italic">No services listed</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingPackage(pkg);
                        const itms = Array.isArray(pkg.items) ? pkg.items : [];
                        setPackageFormItems(itms);
                        setPackageEditorMode('form');
                        setPackageForm({
                          name: pkg.name,
                          description: pkg.description || '',
                          plugin_id: pkg.plugin_id || 'fertility',
                          base_price: pkg.base_price ?? pkg.price ?? 0,
                          items_json: JSON.stringify(itms, null, 2),
                        });
                        setShowPackageModal(true);
                      }}
                      className="text-xs text-primary hover:text-primary-mid font-semibold"
                    >
                      Edit Bundle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tariffSubTab === 'cosgyn' && (
            <div className="space-y-4">
              {/* CosGyn Packages Header Banner */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cosmetic Gynecology &amp; Aesthetics Protocol Tariffs</h4>
                    <p className="text-xs text-slate-500">
                      Jet Plasma mucosal regeneration, Tesla Chair (HIFEM) pelvic floor therapy, autologous PRP revitalization, and contouring packages.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-pink-200 text-pink-700 rounded-lg">
                    {cosgynTreatments.length} Active Protocols
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={cosgynSearch}
                    onChange={(e) => setCosgynSearch(e.target.value)}
                    placeholder="Search CosGyn package name or protocol..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Treatments Cards Grid */}
              {cosgynTreatments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-pink-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No CosGyn Specialty Packages Configured</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add Jet Plasma, Tesla Chair, PRP or surgical rejuvenation protocols with custom session counts and pricing.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCosgynTreatment(null);
                      setCosgynForm({
                        name: '',
                        package_combo: '',
                        jet_plasma_sessions: 0,
                        jet_plasma_duration_mins: 30,
                        tesla_chair_sessions: 0,
                        tesla_chair_duration_mins: 30,
                        prp_sessions: 0,
                        price: 25000,
                      });
                      setShowCosgynModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs rounded-lg shadow-xs"
                  >
                    Add First Package
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cosgynTreatments
                    .filter((t: any) => {
                      if (!cosgynSearch) return true;
                      const q = cosgynSearch.toLowerCase();
                      return (
                        (t.name || '').toLowerCase().includes(q) ||
                        (t.package_combo || '').toLowerCase().includes(q)
                      );
                    })
                    .map((t: any) => (
                      <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-pink-200 transition-all">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm leading-snug">{t.name}</h3>
                              {t.package_combo && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-50 text-pink-700 border border-pink-100">
                                  {t.package_combo}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-sm text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 shrink-0">
                              {formatCurrency(t.price || 0)}
                            </span>
                          </div>

                          {/* Session breakdown pill list */}
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Protocol Sessions:</div>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                  Jet Plasma:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.jet_plasma_sessions > 0
                                    ? `${t.jet_plasma_sessions} sessions (${t.jet_plasma_duration_mins || 30}m)`
                                    : 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                  Tesla Chair (HIFEM):
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.tesla_chair_sessions > 0
                                    ? `${t.tesla_chair_sessions} sessions (${t.tesla_chair_duration_mins || 30}m)`
                                    : 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  PRP Revitalization:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.prp_sessions > 0 ? `${t.prp_sessions} sessions` : 'None'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCosgynTreatment(t);
                              setCosgynForm({
                                name: t.name,
                                package_combo: t.package_combo || '',
                                jet_plasma_sessions: t.jet_plasma_sessions || 0,
                                jet_plasma_duration_mins: t.jet_plasma_duration_mins || 30,
                                tesla_chair_sessions: t.tesla_chair_sessions || 0,
                                tesla_chair_duration_mins: t.tesla_chair_duration_mins || 30,
                                prp_sessions: t.prp_sessions || 0,
                                price: t.price || 0,
                              });
                              setShowCosgynModal(true);
                            }}
                            className="px-2.5 py-1 text-xs text-primary hover:text-primary-mid font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCosgynTreatment(t.id, t.name)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: IPD WARDS & BEDS (PRESERVED & EXPANDED)                           */}
      {/* ========================================================================= */}
      {activeTab === 'ipd' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Filter by Ward:</span>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">All Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingWard(null);
                  setWardFormName('');
                  setWardFormCode('');
                  setWardFormDept('General IPD');
                  setWardFormRate(2500);
                  setWardFormBeds(4);
                  setShowWardModal(true);
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ward
              </button>
              <button
                onClick={() => {
                  setEditingBed(null);
                  setBedFormWardId(selectedWardFilter !== 'all' ? selectedWardFilter : (wards[0]?.id || ''));
                  setBedFormNumber('');
                  setBedFormType('standard_manual');
                  const currentW = wards.find((w) => w.id === (selectedWardFilter !== 'all' ? selectedWardFilter : wards[0]?.id));
                  setBedFormRate(currentW?.base_charge_per_day || 2500);
                  setBedFormStatus('Vacant');
                  setShowBedModal(true);
                }}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bed
              </button>
            </div>
          </div>

          {/* Wards Management Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Inpatient Wards Directory</span>
              <span className="text-[11px] text-slate-500 font-medium">{wards.length} Wards Configured</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ward Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Base Tariff</th>
                  <th className="py-2.5 px-3 text-center">Beds</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No wards configured yet. Click &quot;+ Add Ward&quot; above to create a ward.
                    </td>
                  </tr>
                ) : (
                  wards.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{w.name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-primary font-semibold">{w.code}</td>
                      <td className="py-2 px-3 text-slate-600">{w.department || 'General IPD'}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{formatCurrency(w.base_charge_per_day || 2500)}/day</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">{w.total_beds || 0}</td>
                      <td className="py-2 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingWard(w);
                            setWardFormName(w.name);
                            setWardFormCode(w.code);
                            setWardFormDept(w.department || 'General IPD');
                            setWardFormRate(w.base_charge_per_day || 2500);
                            setWardFormBeds(w.total_beds || 0);
                            setShowWardModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded inline-block"
                          title="Edit Ward"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWard(w.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded inline-block"
                          title="Deactivate Ward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Beds Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Hospital Beds Grid ({beds.filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter).length} Beds)
              </h4>
            </div>

            {beds.filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs italic">
                No beds found for this selection. Click &quot;+ Add Bed&quot; above to create a bed.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {beds
                  .filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter)
                  .map((b) => {
                    const isVac = b.status === 'Vacant' || b.status?.toLowerCase() === 'available';
                    const isOcc = b.status === 'Occupied';
                    return (
                      <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-xs">{b.bed_number}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              isVac
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOcc
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isVac ? 'Vacant' : b.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          <div className="capitalize">{b.bed_type || b.type || 'Standard'}</div>
                          <div className="font-mono font-semibold text-slate-800">{formatCurrency(b.daily_rate || 2500)}/day</div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingBed(b);
                              setBedFormWardId(b.ward_id);
                              setBedFormNumber(b.bed_number);
                              setBedFormType(b.bed_type || 'standard_manual');
                              setBedFormRate(b.daily_rate || 2500);
                              setBedFormStatus(b.status || 'Vacant');
                              setShowBedModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit Bed"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteBed(b.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Bed"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ART CYCLES & PROTOCOLS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'cycles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setCycleSubTab('modalities')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  cycleSubTab === 'modalities' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ART Modality Catalog ({cycleTypes.length})
              </button>
              <button
                onClick={() => setCycleSubTab('protocols')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  cycleSubTab === 'protocols' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Clinical Protocols & Timeline ({protocols.length})
              </button>
            </div>
          </div>

          {cycleSubTab === 'modalities' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ART Modality Catalog ({cycleTypes.length})</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Master registry of clinical cycle types offered by the hospital. Populates the treatment type dropdown across Patient Charts, IVF Lab, and Billing packages.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCycleType(null);
                    setCycleTypeForm({ name: '', category: 'Stimulation', display_order: cycleTypes.length + 1, is_active: true });
                    setShowCycleModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Modality
                </button>
              </div>

              {/* Modalities Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search modality name..."
                    value={cycleSearch}
                    onChange={(e) => setCycleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <select
                    value={cycleCategoryFilter}
                    onChange={(e) => setCycleCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50"
                  >
                    <option value="all">All Categories</option>
                    <option value="Stimulation">Stimulation (ICSI, IVF)</option>
                    <option value="FET">FET (Frozen Embryo Transfer)</option>
                    <option value="IUI">IUI & Ovulation Induction</option>
                    <option value="Preservation">Preservation (Egg/Embryo Freeze)</option>
                    <option value="Third-Party">Third-Party (Donation / Surrogacy)</option>
                    <option value="Diagnostics">Diagnostics (PGT-A / PGT-M)</option>
                    <option value="Surgical">Surgical (TESA / PESA)</option>
                  </select>
                </div>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setCycleStatusFilter('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({cycleTypes.length})
                  </button>
                  <button
                    onClick={() => setCycleStatusFilter('active')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'active' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Enabled ({cycleTypes.filter(c => c.is_active !== false).length})
                  </button>
                  <button
                    onClick={() => setCycleStatusFilter('inactive')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'inactive' ? 'bg-white shadow-2xs text-rose-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Disabled ({cycleTypes.filter(c => c.is_active === false).length})
                  </button>
                </div>
              </div>

              {/* Modalities Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Cycle Modality</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Display Order</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cycleTypes
                      .filter((c) => {
                        const matchesSearch = !cycleSearch || c.name.toLowerCase().includes(cycleSearch.toLowerCase());
                        const matchesCategory = cycleCategoryFilter === 'all' || (c.category || '').toLowerCase() === cycleCategoryFilter.toLowerCase();
                        const matchesStatus =
                          cycleStatusFilter === 'all'
                            ? true
                            : cycleStatusFilter === 'active'
                            ? c.is_active !== false
                            : c.is_active === false;
                        return matchesSearch && matchesCategory && matchesStatus;
                      })
                      .map((c) => (
                        <tr key={c.id || c.name} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                              {c.category || 'Stimulation'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{c.display_order || 0}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                c.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {c.is_active !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCycleType(c);
                                  setCycleTypeForm({
                                    name: c.name,
                                    category: c.category || 'Stimulation',
                                    display_order: c.display_order || 0,
                                    is_active: c.is_active !== false,
                                  });
                                  setShowCycleModal(true);
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                                title="Edit Modality"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleToggleCycleType(c)}
                                className={`px-2 py-1 border rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs ${
                                  c.is_active !== false
                                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title={c.is_active !== false ? 'Deactivate Modality' : 'Enable Modality'}
                              >
                                {c.is_active !== false ? (
                                  <>
                                    <EyeOff className="w-3 h-3" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Enable
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleHardDeleteCycleType(c.id, c.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Permanently Delete Modality"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Protocols Library Left Rail */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Protocols Library</span>
                    <span className="text-[10px] text-slate-500">
                      {protocols.filter(p => p.is_active !== false).length} Active · {protocols.filter(p => p.is_active === false).length} Inactive
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProtocol(null);
                      setProtocolForm({ name: '', category: 'stimulation', description: '', rules: [], timeline_events: [] });
                      setShowProtocolModal(true);
                    }}
                    className="px-2.5 py-1 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> Add Protocol
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setProtocolStatusFilter('active')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'active' ? 'bg-white shadow-2xs text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Active ({protocols.filter(p => p.is_active !== false).length})
                  </button>
                  <button
                    onClick={() => setProtocolStatusFilter('inactive')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'inactive' ? 'bg-white shadow-2xs text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Inactive ({protocols.filter(p => p.is_active === false).length})
                  </button>
                  <button
                    onClick={() => setProtocolStatusFilter('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({protocols.length})
                  </button>
                </div>

                {/* Protocols Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search protocols..."
                    value={protocolSearch}
                    onChange={(e) => setProtocolSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                {/* Protocol Card List */}
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  {protocols
                    .filter((proto) => {
                      const matchesSearch = !protocolSearch || proto.name.toLowerCase().includes(protocolSearch.toLowerCase());
                      const matchesStatus =
                        protocolStatusFilter === 'all'
                          ? true
                          : protocolStatusFilter === 'active'
                          ? proto.is_active !== false
                          : proto.is_active === false;
                      return matchesSearch && matchesStatus;
                    })
                    .map((proto) => (
                      <button
                        key={proto.id}
                        onClick={() => handleSelectProtocol(proto)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedProtocol?.id === proto.id
                            ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-slate-900 text-xs truncate">{proto.name}</div>
                          {proto.is_active === false && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 capitalize flex items-center justify-between">
                          <span>{proto.category} Protocol</span>
                          <span className="text-[10px] text-slate-400">
                            {proto.rules?.length || 0} drugs · {proto.timeline_events?.length || 0} events
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Protocol Detail Pane */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedProtocol?.name || 'Protocol Details'}
                      </h3>
                      {selectedProtocol?.category && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                          {selectedProtocol.category}
                        </span>
                      )}
                      {selectedProtocol?.is_active === false && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                          Deactivated / Inactive
                        </span>
                      )}
                    </div>
                    {selectedProtocol?.description && (
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">{selectedProtocol.description}</p>
                    )}
                  </div>
                  {selectedProtocol && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingProtocol(selectedProtocol);
                          setProtocolForm({
                            name: selectedProtocol.name,
                            category: selectedProtocol.category || 'stimulation',
                            description: selectedProtocol.description || '',
                            rules: (selectedProtocol.rules || []).map((r: any) => ({
                              drug_name: r.drug_name || '',
                              dose: r.dose || '',
                              route: r.route || 'SC',
                              frequency: r.frequency || 'OD',
                              day_start_offset: r.day_start_offset ?? 1,
                              day_end_offset: r.day_end_offset ?? 10,
                              instructions: r.instructions || '',
                            })),
                            timeline_events: (selectedProtocol.timeline_events || []).map((ev: any) => ({
                              type: ev.type || 'scan',
                              day_offset: ev.day_offset ?? 1,
                              title: ev.title || '',
                              instructions: ev.instructions || '',
                            })),
                          });
                          setShowProtocolModal(true);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>

                      {/* Deactivate vs Reactivate Buttons */}
                      {selectedProtocol.is_active !== false ? (
                        <button
                          onClick={() => handleDeactivateProtocol(selectedProtocol.id)}
                          className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                          title="Deactivate protocol (archives it without permanently deleting)"
                        >
                          <EyeOff className="w-3 h-3" /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateProtocol(selectedProtocol.id)}
                          className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                          title="Reactivate protocol (restores it to active clinical schedules)"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Reactivate
                        </button>
                      )}

                      {/* Permanent Delete Button */}
                      <button
                        onClick={() => handleHardDeleteProtocol(selectedProtocol.id, selectedProtocol.name)}
                        className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                        title="Permanently delete this protocol and its rules"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Section A: Configured Drug Rules */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Configured Prescriptions & Drug Rules ({selectedProtocol?.rules?.length || 0})
                  </h4>
                  {selectedProtocol?.rules && selectedProtocol.rules.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Medication</th>
                            <th className="py-2 px-2">Dose</th>
                            <th className="py-2 px-2">Route</th>
                            <th className="py-2 px-2">Freq</th>
                            <th className="py-2 px-2 text-center">Cycle Days</th>
                            <th className="py-2 px-3">Clinical Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedProtocol.rules.map((r: any, rIdx: number) => (
                            <tr key={r.id || rIdx} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 font-bold text-slate-800">{r.drug_name}</td>
                              <td className="py-2 px-2 font-mono text-primary font-bold">{r.dose}</td>
                              <td className="py-2 px-2 text-slate-600">{r.route || 'SC'}</td>
                              <td className="py-2 px-2 text-slate-600">{r.frequency || 'OD'}</td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                                D{r.day_start_offset}–D{r.day_end_offset}
                              </td>
                              <td className="py-2 px-3 text-slate-500 text-[11px]">{r.instructions || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No drug rules configured.</p>
                  )}
                </div>

                {/* Section B: Scheduled Clinical Events (Scans, Labs, Procedures) */}
                {selectedProtocol?.timeline_events && selectedProtocol.timeline_events.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Scheduled Scans, Investigations & Procedures ({selectedProtocol.timeline_events.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {selectedProtocol.timeline_events.map((ev: any, evIdx: number) => {
                        const isScan = ev.type === 'scan';
                        const isInv = ev.type === 'investigation';
                        const isProc = ev.type === 'procedure';

                        return (
                          <div
                            key={evIdx}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                              isScan
                                ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                                : isInv
                                ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                                : 'bg-amber-50/60 border-amber-200 text-amber-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60">
                                Day {ev.day_offset}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {isScan ? '🔍 Scan' : isInv ? '🧪 Lab' : '🧫 Procedure'}
                              </span>
                            </div>
                            <div className="font-bold text-xs">{ev.title}</div>
                            {ev.instructions && (
                              <div className="text-[10px] opacity-75 mt-0.5 truncate" title={ev.instructions}>
                                {ev.instructions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section C: Day-by-Day Timeline Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Generated Day-by-Day Clinical Timeline ({protocolPreviewCalendar.length} Days)
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Computed live via Rules Engine</span>
                  </div>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    {protocolPreviewCalendar.map((dayItem: any, idx: number) => {
                      const hasEvents = (dayItem.scans?.length || 0) + (dayItem.investigations?.length || 0) + (dayItem.procedures?.length || 0) > 0;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                            hasEvents ? 'bg-slate-50/90 border-slate-300' : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <span className="font-bold font-mono text-primary text-xs shrink-0 w-24">
                              {dayItem.stim_day_label || `Day ${dayItem.day_number || idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {dayItem.display_date || ''}
                            </span>
                          </div>

                          {/* Multi-Track Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {dayItem.milestone && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {dayItem.milestone}
                              </span>
                            )}
                            {(dayItem.scans || []).map((s: string, sIdx: number) => (
                              <span key={sIdx} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                🔍 {s}
                              </span>
                            ))}
                            {(dayItem.investigations || []).map((inv: string, iIdx: number) => (
                              <span key={iIdx} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[200px]" title={inv}>
                                🧪 {inv}
                              </span>
                            ))}
                            {(dayItem.procedures || []).map((p: string, pIdx: number) => (
                              <span key={pIdx} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
                                🧫 {p}
                              </span>
                            ))}
                            {(dayItem.medications || []).map((m: any, mIdx: number) => (
                              <span key={mIdx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium text-slate-800 shadow-2xs">
                                💊 {m.drug_name || m.name} <strong className="text-primary">{m.dose || m.dosage}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CLINICAL & RX TEMPLATES (ORGANIZED BY PURPOSE)                     */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Top Horizontal Purpose Sub-Tabs Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Clinical & Rx Templates</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {clinicalTemplates.length} Active Templates
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Organized by clinical purpose for consultation workups, sonography scans, smart order sets, daily Rx, and appointment scheduling.
                </p>
              </div>
              <button
                onClick={() => {
                  const initialPurpose = templatePurposeTab === 'all' ? 'proformas' : templatePurposeTab;
                  setNewTemplatePurpose(initialPurpose);
                  handleSetNewTemplatePurpose(initialPurpose);
                  setShowNewTemplateModal(true);
                }}
                className="px-3.5 py-1.5 text-xs bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Template
              </button>
            </div>

            {/* Horizontal Sub-Tabs List with Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {TEMPLATE_PURPOSE_TABS.map((ptab) => {
                const TabIcon = ptab.icon;
                const isActive = templatePurposeTab === ptab.id;
                const count = purposeCounts[ptab.id] || 0;

                return (
                  <button
                    key={ptab.id}
                    type="button"
                    onClick={() => handleSelectPurposeTab(ptab.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-primary/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-primary'}`} />
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {ptab.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {ptab.hint}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Purpose Summary Banner */}
            {(() => {
              const activeTabInfo = TEMPLATE_PURPOSE_TABS.find((t) => t.id === templatePurposeTab) || TEMPLATE_PURPOSE_TABS[0];
              const ActiveIcon = activeTabInfo.icon;
              return (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ActiveIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-slate-800">{activeTabInfo.label}:</span>
                    <span className="text-slate-500 text-[11px]">{activeTabInfo.description}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Showing <span className="font-bold text-slate-800">{filteredTemplates.length}</span> of {purposeCounts[templatePurposeTab] || 0} templates
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Two-Column Editor Layout: Left Template Selector, Right Schema Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              {/* Search within Purpose */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder={`Search ${templatePurposeTab === 'all' ? 'all templates' : TEMPLATE_PURPOSE_TABS.find(t => t.id === templatePurposeTab)?.label}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              {/* Template Cards List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredTemplates.map((tmpl) => {
                  const purpose = getTemplatePurpose(tmpl);
                  const purposeConfig = TEMPLATE_PURPOSE_TABS.find((t) => t.id === purpose);
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  const fieldCount = Array.isArray(tmpl.schema_json)
                    ? tmpl.schema_json.length
                    : typeof tmpl.schema_json === 'object' && tmpl.schema_json !== null
                    ? Object.keys(tmpl.schema_json).length
                    : 0;

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 text-xs leading-snug truncate max-w-[210px]">
                          {tmpl.title}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${getPurposeBadgeStyle(purpose)}`}>
                          {purposeConfig?.badgeLabel || purpose}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span className="truncate max-w-[170px]">{tmpl.record_type}</span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {fieldCount > 0 ? `${fieldCount} fields` : 'Custom schema'}
                        </span>
                      </div>
                      {tmpl.description && (
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          {tmpl.description}
                        </p>
                      )}
                    </button>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-500">No templates found in this purpose category.</p>
                    <button
                      type="button"
                      onClick={() => {
                        const initialPurpose = templatePurposeTab === 'all' ? 'proformas' : templatePurposeTab;
                        setNewTemplatePurpose(initialPurpose);
                        handleSetNewTemplatePurpose(initialPurpose);
                        setShowNewTemplateModal(true);
                      }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Create New Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{templateTitle || 'Template Editor'}</h3>
                <p className="text-[11px] text-slate-500">{selectedTemplate?.record_type} · {selectedTemplate?.plugin_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* 3-Mode Toggle: Form Builder | JSON Schema | Live Preview */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplateFields(parseSchemaToFields(parsedSchema));
                      setTemplateViewMode('builder');
                    }}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'builder' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Form Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewMode('json')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    JSON Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewMode('preview')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'preview' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </button>
                </div>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || !!templateJsonError}
                  className="px-3.5 py-1.5 text-xs bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>

            {/* In Form Builder mode */}
            {templateViewMode === 'builder' && (
              <div className="space-y-4">
                {/* Purpose Group Header Banner & Toggle */}
                {(() => {
                  const purpose = getTemplatePurpose(selectedTemplate);
                  const pConfig = TEMPLATE_PURPOSE_TABS.find((t) => t.id === purpose) || TEMPLATE_PURPOSE_TABS[0];
                  const IconComp = pConfig.icon;

                  return (
                    <div className="flex flex-wrap justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{builderGenericMode ? 'Generic Form Builder' : pConfig.label + ' Clinical Editor'}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getPurposeBadgeStyle(purpose)}`}>
                              {pConfig.badgeLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{pConfig.hint}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBuilderGenericMode(!builderGenericMode)}
                          className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors"
                        >
                          {builderGenericMode ? '← Back to Tailored Clinical UI' : '⚙ Raw Field Builder'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 1. PURPOSE: RX PRESCRIPTIONS & MEDICATION PROTOCOLS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'rx' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-950">Prescription & Protocol Editor</h4>
                          <p className="text-[11px] text-indigo-700">Define daily dosing regimens, frequency, and instructions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Category:</label>
                        <select
                          value={rxCategory}
                          onChange={(e) => setRxCategory(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                        >
                          <option value="Stimulation / OI">Stimulation / Ovulation Induction</option>
                          <option value="Luteal Phase Support">Luteal Phase Support</option>
                          <option value="Down-Regulation / Agonist">Down-Regulation / Agonist</option>
                          <option value="FET Preparation">FET Endometrial Preparation</option>
                          <option value="Post-OPU / Transfer">Post-OPU / Transfer Support</option>
                          <option value="General Clinical Rx">General Clinical Rx</option>
                        </select>
                      </div>
                    </div>

                    {/* Medications Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Prescribed Medications ({rxMedications.length})</span>
                        <button
                          type="button"
                          onClick={() => setRxMedications([...rxMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                          className="text-xs font-semibold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Medication
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="p-2.5 w-8 text-center">#</th>
                              <th className="p-2.5">Drug / Brand Name *</th>
                              <th className="p-2.5">Dose / Strength</th>
                              <th className="p-2.5">Frequency</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Instructions</th>
                              <th className="p-2.5 text-center w-10">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rxMedications.map((med, mIdx) => (
                              <tr key={mIdx} className="hover:bg-slate-50/50">
                                <td className="p-2 text-slate-400 font-mono text-[11px] text-center">{mIdx + 1}</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.drug_name}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].drug_name = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. Tab Letrozole 2.5mg"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.dose}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].dose = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. 5mg or 150 IU"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={med.frequency}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].frequency = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary font-semibold"
                                  >
                                    <option value="OD">OD (Once Daily)</option>
                                    <option value="BD">BD (Twice Daily)</option>
                                    <option value="TDS">TDS (Thrice Daily)</option>
                                    <option value="QID">QID (4 Times Daily)</option>
                                    <option value="HS">HS (At Bedtime)</option>
                                    <option value="SOS">SOS (When Needed)</option>
                                    <option value="STAT">STAT (Immediate)</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].duration = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. 5 Days"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.instructions}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].instructions = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. After food with water"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setRxMedications(rxMedications.filter((_, i) => i !== mIdx))}
                                    disabled={rxMedications.length <= 1}
                                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                                    title="Remove medication row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* General Clinical Advice */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">General Clinical Advice / Protocol Instructions</label>
                      <textarea
                        rows={3}
                        value={rxAdvice}
                        onChange={(e) => setRxAdvice(e.target.value)}
                        placeholder="e.g. Continue adequate hydration (2.5 - 3 Litres/day). Report for Day 9 Follicular Monitoring USG with empty bladder."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. PURPOSE: SMART ORDER SETS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'order_sets' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">Smart Order Set Editor</h4>
                          <p className="text-[11px] text-emerald-700">Bundle diagnostic lab investigations, imaging scans, and companion medicines</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Category:</label>
                        <select
                          value={orderCategory}
                          onChange={(e) => setOrderCategory(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                        >
                          <option value="Fertility / IVF">Fertility / IVF</option>
                          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                          <option value="General Medicine">General Medicine</option>
                          <option value="Andrology / Male Fertility">Andrology / Male Fertility</option>
                          <option value="Endocrinology">Endocrinology</option>
                        </select>
                      </div>
                    </div>

                    {/* Diagnostic Investigations */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Bundled Diagnostic Investigations & Lab Tests (Comma-separated)
                      </label>
                      <textarea
                        rows={2}
                        value={orderInvestigations}
                        onChange={(e) => setOrderInvestigations(e.target.value)}
                        placeholder="e.g. Serum AMH, Serum FSH, Serum LH, Serum Estradiol E2, Serum TSH, Serum Prolactin, Pelvic TVS Ultrasound"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold py-0.5">Quick Add:</span>
                        {['Serum AMH', 'Baseline TVS', 'Day 2 FSH/LH', 'Thyroid Profile', 'Viral Markers', 'Semen Analysis WHO 6th', 'Serum Progesterone'].map((test) => (
                          <button
                            key={test}
                            type="button"
                            onClick={() => {
                              const current = orderInvestigations.split(',').map((s) => s.trim()).filter(Boolean);
                              if (!current.includes(test)) {
                                setOrderInvestigations(current.concat(test).join(', '));
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 transition-colors"
                          >
                            + {test}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bundled Medications Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Bundled Regimen Medications ({orderMedications.length})</span>
                        <button
                          type="button"
                          onClick={() => setOrderMedications([...orderMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                          className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Medication
                        </button>
                      </div>

                      {orderMedications.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <tr>
                                <th className="p-2 w-8 text-center">#</th>
                                <th className="p-2">Drug Name</th>
                                <th className="p-2">Dose</th>
                                <th className="p-2">Frequency</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Instructions</th>
                                <th className="p-2 text-center w-10">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {orderMedications.map((med, mIdx) => (
                                <tr key={mIdx} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-slate-400 font-mono text-[11px] text-center">{mIdx + 1}</td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.drug_name}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].drug_name = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. Inj Menopur 150 IU"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.dose}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].dose = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. 150 IU"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={med.frequency}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].frequency = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary font-semibold"
                                    >
                                      <option value="OD">OD</option>
                                      <option value="BD">BD</option>
                                      <option value="TDS">TDS</option>
                                      <option value="HS">HS</option>
                                      <option value="STAT">STAT</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.duration}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].duration = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. 4 Days"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.instructions}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].instructions = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. Subcutaneously at 9 PM"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setOrderMedications(orderMedications.filter((_, i) => i !== mIdx))}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center">
                          No bundled medications added to this order set yet (Optional).
                        </div>
                      )}
                    </div>

                    {/* Nursing / Patient Instructions */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Clinical & Nursing Instructions</label>
                      <textarea
                        rows={2}
                        value={orderInstructions}
                        onChange={(e) => setOrderInstructions(e.target.value)}
                        placeholder="e.g. Fasting 8-10 hours overnight. Collect blood sample before taking morning thyroid medication."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. PURPOSE: CLINICAL PROFORMAS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'proformas' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-950">Clinical Consultation Proforma</h4>
                          <p className="text-[11px] text-blue-700">Configure complaints, presenting illness, diagnosis, and treatment plans</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Chief Complaints & Duration *</label>
                        <textarea
                          rows={2}
                          value={proformaComplaint}
                          onChange={(e) => setProformaComplaint(e.target.value)}
                          placeholder="e.g. Primary Infertility for 2.5 years, irregular menstrual cycles with severe dysmenorrhea..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">History of Presenting Illness (HOPI) & Clinical Background</label>
                        <textarea
                          rows={3}
                          value={proformaHopi}
                          onChange={(e) => setProformaHopi(e.target.value)}
                          placeholder="e.g. Married for 3 years, non-consanguineous. Regular coitus. Menstrual cycle 35-45 days. No past abdominal surgeries. Partner semen analysis reports normozoospermia."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Provisional / Differential Diagnosis *</label>
                          <input
                            type="text"
                            value={proformaDiagnosis}
                            onChange={(e) => setProformaDiagnosis(e.target.value)}
                            placeholder="e.g. Polycystic Ovarian Syndrome (Rotterdam Criteria)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Recommended Investigations</label>
                          <input
                            type="text"
                            value={proformaInvestigations}
                            onChange={(e) => setProformaInvestigations(e.target.value)}
                            placeholder="e.g. Day 2 Baseline TVS, Serum AMH, TSH, Fasting Insulin"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Plan of Management & Counseling Notes</label>
                        <textarea
                          rows={3}
                          value={proformaPlan}
                          onChange={(e) => setProformaPlan(e.target.value)}
                          placeholder="e.g. Weight management lifestyle counseling. Start Ovulation Induction with Letrozole on Day 2 of next cycle. Plan IUI."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PURPOSE: ULTRASOUND SCANS & FOLLICULAR TRACKING */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'scans' && (
                  <div className="space-y-4">
                    <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-sky-950">Ultrasound & Follicular Scan Schema</h4>
                          <p className="text-[11px] text-sky-700">Configure sonographic pelvic organ metrics, follicle tracking, and endometrial patterns</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Scan Modality:</label>
                        <select
                          value={scanType}
                          onChange={(e) => setScanType(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                        >
                          <option value="Transvaginal Sonography (TVS)">Transvaginal Sonography (TVS)</option>
                          <option value="Follicular Tracking Study">Follicular Tracking Study</option>
                          <option value="Transabdominal Pelvic USG (TAS)">Transabdominal Pelvic USG (TAS)</option>
                          <option value="Early Pregnancy Viability USG">Early Pregnancy Viability USG</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Endometrium (Thickness & Echogenicity)</label>
                        <input
                          type="text"
                          value={scanEndometrium}
                          onChange={(e) => setScanEndometrium(e.target.value)}
                          placeholder="e.g. 8.2mm, Trilaminar Triple-Line, Homogeneous"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Pouch of Douglas (POD) Fluid</label>
                        <input
                          type="text"
                          value={scanPod}
                          onChange={(e) => setScanPod(e.target.value)}
                          placeholder="e.g. Clear / No free fluid in cul-de-sac"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Right Ovary (AFC & Dominant Follicle)</label>
                        <input
                          type="text"
                          value={scanRightOvary}
                          onChange={(e) => setScanRightOvary(e.target.value)}
                          placeholder="e.g. AFC: 8 | Dominant Follicle: 18.5mm x 17.0mm"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Left Ovary (AFC & Secondary Follicles)</label>
                        <input
                          type="text"
                          value={scanLeftOvary}
                          onChange={(e) => setScanLeftOvary(e.target.value)}
                          placeholder="e.g. AFC: 7 | Leading Follicle: 12.0mm"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block font-semibold text-slate-700 mb-1">Sonographer Impression / Summary Findings</label>
                      <textarea
                        rows={3}
                        value={scanImpression}
                        onChange={(e) => setScanImpression(e.target.value)}
                        placeholder="e.g. Day 11 Follicular Study reveals mature pre-ovulatory dominant follicle in Right Ovary with receptive trilaminar endometrium. Advise trigger when > 18mm."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 5. PURPOSE: APPOINTMENT VISIT TYPES */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'visit_types' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-950">Appointment Visit Type & Resource Schema</h4>
                          <p className="text-[11px] text-amber-700">Configure appointment calendar slot durations, rooms, and patient prep</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Slot Duration (Minutes) *</label>
                        <select
                          value={visitDurationMinutes}
                          onChange={(e) => setVisitDurationMinutes(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary font-semibold"
                        >
                          <option value={15}>15 Minutes (Brief Follow-up / Scan Review)</option>
                          <option value={20}>20 Minutes (Standard Review)</option>
                          <option value={30}>30 Minutes (Couple Consultation / Evaluation)</option>
                          <option value={45}>45 Minutes (Comprehensive ART Counseling)</option>
                          <option value={60}>60 Minutes (Primary Infertility Workup / Pre-Op)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Consultation Modality / Service Category</label>
                        <input
                          type="text"
                          value={visitConsultationType}
                          onChange={(e) => setVisitConsultationType(e.target.value)}
                          placeholder="e.g. In-Person Couple Consultation / Video Teleconsult"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Allocated Clinical Room / Resource</label>
                        <select
                          value={visitRoom}
                          onChange={(e) => setVisitRoom(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                        >
                          <option value="Consultation Room 1">Consultation Room 1 (Senior Consultant)</option>
                          <option value="Consultation Room 2">Consultation Room 2 (Junior Consultant)</option>
                          <option value="Ultrasound TVS Suite A">Ultrasound TVS Suite A</option>
                          <option value="IVF Cleanroom Procedure OT">IVF Cleanroom Procedure OT (OPU / ET)</option>
                          <option value="Andrology Semen Collection Suite">Andrology Semen Collection Suite</option>
                          <option value="Counseling Room B">Counseling Room B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Linked Tariff Code (Service Catalog)</label>
                        <input
                          type="text"
                          value={visitTariffCode}
                          onChange={(e) => setVisitTariffCode(e.target.value)}
                          placeholder="e.g. OPD-CONS-01"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block font-semibold text-slate-700 mb-1">Pre-Appointment Instructions for Patient (Included in SMS/WhatsApp)</label>
                      <textarea
                        rows={3}
                        value={visitInstructions}
                        onChange={(e) => setVisitInstructions(e.target.value)}
                        placeholder="e.g. Please bring all previous investigation reports, semen analysis, and surgical discharge summaries. Arrive 15 minutes before slot."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 6. GENERIC FIELD BUILDER (When toggled or for custom schemas) */}
                {builderGenericMode && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-xs font-bold text-slate-700">
                        Dynamic Schema Fields ({activeTemplateFields.length})
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('consultation', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Proforma
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('ultrasound', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: USG Scan
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('order_set', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Order Set
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('rx', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Rx
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('visit_type', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Visit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [
                              ...activeTemplateFields,
                              { id: `field_${activeTemplateFields.length + 1}`, label: '', type: 'text', placeholder: '', required: false }
                            ];
                            handleActiveFieldsChange(next);
                          }}
                          className="text-[11px] px-2.5 py-1 bg-primary text-white rounded font-semibold hover:bg-primary-mid flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Field
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {activeTemplateFields.map((fld, fIdx) => (
                        <div key={fIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              #{fIdx + 1} · {fld.id || `field_${fIdx + 1}`}
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!fld.required}
                                  onChange={(e) => {
                                    const next = [...activeTemplateFields];
                                    next[fIdx] = { ...next[fIdx], required: e.target.checked };
                                    handleActiveFieldsChange(next);
                                  }}
                                  className="accent-primary rounded"
                                />
                                Required
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = activeTemplateFields.filter((_, i) => i !== fIdx);
                                  handleActiveFieldsChange(next);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Field Label</label>
                              <input
                                type="text"
                                value={fld.label}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], label: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                placeholder="e.g. Endometrial Thickness (mm)"
                                className="vmd-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Input Type</label>
                              <select
                                value={fld.type}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], type: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                className="vmd-input text-xs"
                              >
                                <option value="text">Text Line</option>
                                <option value="textarea">Textarea (Multi-line)</option>
                                <option value="number">Number</option>
                                <option value="select">Dropdown Select</option>
                                <option value="checkbox_group">Checkbox Multi-Select</option>
                                <option value="date">Date Picker</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Placeholder / Helper Text</label>
                              <input
                                type="text"
                                value={fld.placeholder || ''}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], placeholder: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                placeholder="Optional placeholder..."
                                className="vmd-input text-xs"
                              />
                            </div>
                            {['select', 'checkbox_group'].includes(fld.type) && (
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Options (comma-separated)</label>
                                <input
                                  type="text"
                                  value={fld.options || ''}
                                  onChange={(e) => {
                                    const next = [...activeTemplateFields];
                                    next[fIdx] = { ...next[fIdx], options: e.target.value };
                                    handleActiveFieldsChange(next);
                                  }}
                                  placeholder="e.g. Triple Line, Homogeneous, Hyperechoic"
                                  className="vmd-input text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {activeTemplateFields.length === 0 && (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                          No visual fields defined yet. Click "+ Add Field" or choose a quick preset above.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In Raw JSON mode */}
            {templateViewMode === 'json' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Edit raw JSON schema structure</span>
                  {templateJsonError ? (
                    <span className="text-rose-600 font-semibold">⚠ {templateJsonError}</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">✓ Valid JSON Schema</span>
                  )}
                </div>
                <textarea
                  rows={18}
                  value={templateJsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg bg-slate-900 text-slate-100"
                />
              </div>
            )}

            {/* In Live Preview mode */}
            {templateViewMode === 'preview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Interactive EMR Simulation (Doctor View)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Preview as Role:</span>
                    <select
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                    >
                      <option value="doctor">Doctor / Consultant</option>
                      <option value="nurse">Nurse</option>
                      <option value="embryologist">Embryologist</option>
                      <option value="admin">Administrator</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                  </div>
                </div>

                {/* Purpose 1 Preview: Prescription Slip */}
                {getTemplatePurpose(selectedTemplate) === 'rx' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-4 font-sans text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-2xl font-serif font-bold text-indigo-700">℞</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Prescription Protocol'}</h4>
                        <p className="text-[11px] text-slate-500">{templateDesc || 'Outpatient Medication Regimen'}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                        {rxCategory}
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Medication & Strength</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rxMedications.filter((m) => m.drug_name).length > 0 ? (
                            rxMedications
                              .filter((m) => m.drug_name)
                              .map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                                    <Pill className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>{m.drug_name}</span>
                                  </td>
                                  <td className="p-2.5 text-slate-700">{m.dose || '—'}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[11px] border border-indigo-100">
                                      {m.frequency}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-700">{m.duration || '—'}</td>
                                  <td className="p-2.5 text-slate-500 italic">{m.instructions || 'As directed'}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400">
                                No medication rows defined in this Rx template yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {rxAdvice && (
                      <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 space-y-1">
                        <span className="font-bold text-amber-900 text-xs block">Patient & Clinical Advice:</span>
                        <p className="text-amber-800 text-xs whitespace-pre-wrap">{rxAdvice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 2 Preview: Smart Order Set Sheet */}
                {getTemplatePurpose(selectedTemplate) === 'order_sets' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-4 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">OPD Order Set</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Order Set'}</h4>
                        <p className="text-[11px] text-slate-500">{templateDesc}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {orderCategory}
                      </span>
                    </div>

                    {/* Investigations Badges */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">Requisitioned Investigations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {orderInvestigations.split(',').map((inv, idx) => {
                          const trimmed = inv.trim();
                          if (!trimmed) return null;
                          return (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                              {trimmed}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {orderMedications.filter((m) => m.drug_name).length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800 block text-xs">Companion Protocol Medications:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {orderMedications
                            .filter((m) => m.drug_name)
                            .map((m, idx) => (
                              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-800 block">{m.drug_name}</span>
                                  <span className="text-[11px] text-slate-500">{m.dose} · {m.frequency} · {m.duration}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 italic max-w-[120px] text-right truncate">
                                  {m.instructions}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {orderInstructions && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px]">Nursing & Preparation Notes:</span>
                        <p className="text-xs whitespace-pre-wrap">{orderInstructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 3 Preview: Consultation Proforma */}
                {getTemplatePurpose(selectedTemplate) === 'proformas' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">EMR Consultation Workup</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Consultation Proforma'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        Proforma
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Chief Complaints & Onset</span>
                        <p className="text-slate-800 font-medium">{proformaComplaint || '—'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">History of Presenting Illness (HOPI)</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{proformaHopi || '—'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                          <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wide">Provisional Diagnosis</span>
                          <p className="text-blue-950 font-bold">{proformaDiagnosis || '—'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Planned Investigations</span>
                          <p className="text-slate-800">{proformaInvestigations || '—'}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                        <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wide">Treatment Plan & Counseling</span>
                        <p className="text-emerald-950 leading-relaxed whitespace-pre-wrap">{proformaPlan || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purpose 4 Preview: Ultrasound Scan Worksheet */}
                {getTemplatePurpose(selectedTemplate) === 'scans' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-sky-600 tracking-wider uppercase">Sonography Imaging Worksheet</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Ultrasound Scan'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded">
                        {scanType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Endometrium</span>
                        <p className="text-slate-900 font-semibold">{scanEndometrium || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Pouch of Douglas (POD)</span>
                        <p className="text-slate-900 font-semibold">{scanPod || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Right Ovary Metrics</span>
                        <p className="text-slate-900 font-semibold">{scanRightOvary || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Left Ovary Metrics</span>
                        <p className="text-slate-900 font-semibold">{scanLeftOvary || '—'}</p>
                      </div>
                    </div>

                    {scanImpression && (
                      <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
                        <span className="font-bold text-sky-950 block text-[11px] uppercase tracking-wide">Sonographic Impression</span>
                        <p className="text-sky-900 leading-relaxed whitespace-pre-wrap">{scanImpression}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 5 Preview: Appointment Visit Type */}
                {getTemplatePurpose(selectedTemplate) === 'visit_types' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase">Appointment Slot Booking</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Visit Type'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {visitDurationMinutes} Mins
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Consultation Modality</span>
                        <p className="text-slate-900 font-semibold">{visitConsultationType}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Allocated Room / Resource</span>
                        <p className="text-slate-900 font-semibold">{visitRoom}</p>
                      </div>
                    </div>

                    {visitTariffCode && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Billing Tariff Code:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{visitTariffCode}</span>
                      </div>
                    )}

                    {visitInstructions && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-1 text-amber-900">
                        <span className="font-bold block text-[11px]">Patient Booking Guidelines (SMS/WhatsApp Preview):</span>
                        <p className="text-xs whitespace-pre-wrap">{visitInstructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback to DynamicForm if user is in generic schema mode or has custom field array */}
                {(builderGenericMode || Array.isArray(parsedSchema)) && (
                  <DynamicForm
                    key={`${selectedTemplate?.id || 'none'}-${previewRole}-${templateJsonText.length}`}
                    schema={parsedSchema}
                    userRole={previewRole}
                    onSave={async () => { alert('Form submitted in preview mode!'); }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: LABS & CRYOBANK                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'labs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setLabSubTab('lims')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  labSubTab === 'lims' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                LIMS Diagnostic Directory
              </button>
              <button
                onClick={() => setLabSubTab('cryo')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  labSubTab === 'cryo' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cryobank LN2 Storage Infrastructure
              </button>
            </div>
          </div>

          {labSubTab === 'lims' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">LIMS Diagnostic Directory & Reference Intervals</h3>
                  <p className="text-[11px] text-slate-500">Analyzer test templates, normal ranges, and turnaround times ({limsTests.length} tests)</p>
                </div>
                <button
                  onClick={() => {
                    setEditingLimsTest(null);
                    setLimsForm({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });
                    setShowLimsModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add LIMS Test
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(limsTests.length > 0 ? limsTests : [
                  { id: '1', title: 'Serum Beta-hCG (Rapid)', schema_json: { test_code: 'LAB-HCG', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 3, parameters: [{ ref_range: '< 5.0 mIU/mL' }] } },
                  { id: '2', title: 'Anti-Müllerian Hormone (AMH)', schema_json: { test_code: 'LAB-AMH', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 6, parameters: [{ ref_range: '1.5 - 4.0 ng/mL' }] } },
                  { id: '3', title: 'Serum Estradiol (E2)', schema_json: { test_code: 'LAB-E2', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 4, parameters: [{ ref_range: '20 - 400 pg/mL' }] } },
                  { id: '4', title: 'Thyroid Profile (TSH & FT4)', schema_json: { test_code: 'LAB-THY', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 4, parameters: [{ ref_range: '0.4 - 2.5 mIU/L' }] } },
                  { id: '5', title: 'Semen Analysis (WHO 6th)', schema_json: { test_code: 'AND-SEMEN', sample_type: 'Semen', category: 'Andrology', tat_hours: 2, parameters: [{ ref_range: '> 15 M/mL, > 40% Motility' }] } },
                ]).map((t: any) => {
                  const s = t.schema_json || {};
                  const param = (s.parameters && s.parameters[0]) || {};
                  return (
                    <div key={t.id || s.test_code} className="p-3.5 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50 hover:bg-white transition-all shadow-2xs">
                      <div className="flex justify-between items-start font-bold text-xs text-slate-900">
                        <span className="truncate max-w-[170px]">{t.title || s.test_name}</span>
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {s.test_code || 'LAB'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Normal: <span className="font-semibold text-slate-800">{param.ref_range || s.ref_range || 'Clinical normal'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Specimen: {s.sample_type || 'Serum'} · TAT: {s.tat_hours || 4}h</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingLimsTest(t);
                              setLimsForm({
                                test_name: t.title || s.test_name || '',
                                test_code: s.test_code || '',
                                category: s.category || 'Biochemistry',
                                sample_type: s.sample_type || 'Serum',
                                tat_hours: s.tat_hours || 4,
                                ref_range: param.ref_range || s.ref_range || '',
                                unit: param.unit || '',
                              });
                              setShowLimsModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded"
                            title="Edit Test"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLimsTest(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Deactivate Test"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cryopreservation LN2 Tanks & Canister Matrix</h3>
                  <p className="text-[11px] text-slate-500">Cryogenic liquid nitrogen containers ({cryoTanks.length || 4} tanks configured)</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCryoTank(null);
                    setCryoTankForm({
                      tank_name: '',
                      tank_code: `TANK-0${cryoTanks.length + 1}`,
                      tank_type: 'Autologous Embryos',
                      canister_count: 6,
                      capacity_litres: 35,
                      location: 'IVF Cleanroom Cryo Suite A',
                    });
                    setShowCryoTankModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cryo Tank
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(cryoTanks.length > 0 ? cryoTanks : [
                  { id: '1', title: 'Tank 1 — Main Autologous Embryo Bank', schema_json: { tank_code: 'TANK-01', tank_type: 'Autologous Embryos', capacity_litres: 47, canister_count: 6, location: 'Suite A' } },
                  { id: '2', title: 'Tank 2 — Autologous Sperm & TESA Bank', schema_json: { tank_code: 'TANK-02', tank_type: 'Autologous Gametes', capacity_litres: 35, canister_count: 6, location: 'Suite A' } },
                  { id: '3', title: 'Tank 3 — Certified ART Donor Bank', schema_json: { tank_code: 'TANK-03', tank_type: 'Donor Gametes', capacity_litres: 35, canister_count: 6, location: 'Vault B' } },
                ]).map((tank: any, idx: number) => {
                  const s = tank.schema_json || {};
                  return (
                    <div key={tank.id || idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-start font-bold text-xs text-slate-900">
                        <div>
                          <span className="block truncate max-w-[180px]">{tank.title || s.tank_name}</span>
                          <span className="text-[10px] font-mono text-primary font-semibold">{s.tank_code || `LN2-0${idx + 1}`}</span>
                        </div>
                        <span className="text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold shrink-0">
                          -196°C LN2
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.canister_count || 6} Canisters · {s.capacity_litres || 35}L · {s.location || 'IVF Cleanroom'}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.min(90, (idx + 1) * 28)}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>{s.tank_type || 'Cryo Storage'}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCryoTank(tank);
                              setCryoTankForm({
                                tank_name: tank.title || s.tank_name || '',
                                tank_code: s.tank_code || '',
                                tank_type: s.tank_type || 'Autologous Embryos',
                                canister_count: s.canister_count || 6,
                                capacity_litres: s.capacity_litres || 35,
                                location: s.location || 'IVF Cleanroom Cryo Suite A',
                              });
                              setShowCryoTankModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded"
                            title="Edit Tank"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCryoTank(tank.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Deactivate Tank"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: PHARMACY MASTER                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setPharmaSubTab('vendors')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  pharmaSubTab === 'vendors' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Approved Vendors ({pharmacyVendors.length})
              </button>
              <button
                onClick={() => setPharmaSubTab('inventory')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  pharmaSubTab === 'inventory' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Formulary Stock & Reorder Levels ({pharmacyBatches.length})
              </button>
            </div>
            {pharmaSubTab === 'vendors' ? (
              <button
                onClick={() => {
                  setEditingVendor(null);
                  setVendorForm({ name: '', gst_number: '', contact_phone: '', contact_email: '', address: '' });
                  setShowVendorModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Vendor
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingBatch(null);
                  setBatchForm({
                    item_code: '',
                    item_name: '',
                    generic_name: '',
                    category: 'Fertility / Hormones',
                    batch_number: '',
                    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    quantity_available: 50,
                    quantity_received: 50,
                    purchase_rate: 0,
                    mrp: 0,
                    selling_price: 0,
                    rack_location: 'A003',
                    branch_id: '',
                    is_active: true,
                  });
                  setShowBatchModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Drug Batch
              </button>
            )}
          </div>

          {pharmaSubTab === 'vendors' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Vendor Legal Name</th>
                    <th className="py-3 px-3">GSTIN</th>
                    <th className="py-3 px-3">Contact Phone</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pharmacyVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{v.gst_number || '---'}</td>
                      <td className="py-3 px-3 text-slate-600">{v.contact_phone || '---'}</td>
                      <td className="py-3 px-3 text-slate-600">{v.contact_email || '---'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          Active Supplier
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingVendor(v);
                              setVendorForm({
                                name: v.name,
                                gst_number: v.gst_number || '',
                                contact_phone: v.contact_phone || '',
                                contact_email: v.contact_email || '',
                                address: v.address || '',
                              });
                              setShowVendorModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded hover:bg-slate-100"
                            title="Edit Vendor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Delete Vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-0">
              {/* Search & Category Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search brand, salt, batch #, rack..."
                    value={batchSearch}
                    onChange={(e) => setBatchSearch(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {batchSearch && (
                    <button
                      onClick={() => setBatchSearch('')}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                    <select
                      value={batchStatusFilter}
                      onChange={(e) => setBatchStatusFilter(e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="ALL">All Batches ({pharmacyBatches.length})</option>
                      <option value="ACTIVE">Active Formulary ({pharmacyBatches.filter((b) => b.is_active !== false).length})</option>
                      <option value="INACTIVE">Deactivated ({pharmacyBatches.filter((b) => b.is_active === false).length})</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">Category:</span>
                    <select
                      value={batchCategoryFilter}
                      onChange={(e) => setBatchCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="ALL">All Categories</option>
                      {Array.from(new Set(pharmacyBatches.map((b) => b.category).filter(Boolean))).sort().map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Batches Table with Edit Actions */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Brand &amp; Formulation</th>
                      <th className="py-3 px-3">Item Code</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Batch &amp; Rack</th>
                      <th className="py-3 px-3">Expiry Date</th>
                      <th className="py-3 px-3 text-center">Available Stock</th>
                      <th className="py-3 px-3 text-right">Purchase Rate</th>
                      <th className="py-3 px-3 text-right">MRP</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pharmacyBatches
                      .filter((b) => {
                        const q = batchSearch.toLowerCase().trim();
                        const matchesSearch =
                          !q ||
                          (b.item_name || '').toLowerCase().includes(q) ||
                          (b.generic_name || '').toLowerCase().includes(q) ||
                          (b.batch_number || '').toLowerCase().includes(q) ||
                          (b.item_code || '').toLowerCase().includes(q) ||
                          (b.rack_location || '').toLowerCase().includes(q);
                        const matchesCat =
                          batchCategoryFilter === 'ALL' || (b.category || '') === batchCategoryFilter;
                        const matchesStatus =
                          batchStatusFilter === 'ALL' ||
                          (batchStatusFilter === 'ACTIVE' && b.is_active !== false) ||
                          (batchStatusFilter === 'INACTIVE' && b.is_active === false);
                        return matchesSearch && matchesCat && matchesStatus;
                      })
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.item_name}</div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">{b.generic_name || '---'}</div>
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-700">{b.item_code || '---'}</td>
                          <td className="py-3 px-3 text-slate-600">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                              {b.category || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-800 font-semibold">{b.batch_number}</div>
                            <div className="text-[10px] text-slate-500">Rack: {b.rack_location || '---'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            {b.expiry_date ? String(b.expiry_date).split('T')[0] : '---'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                (b.quantity_available || 0) <= 5
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : (b.quantity_available || 0) <= 20
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {b.quantity_available ?? 0} units
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600">
                            {formatCurrency(b.purchase_rate || 0)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(b.mrp || 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                b.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {b.is_active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingBatch(b);
                                  setBatchForm({
                                    item_code: b.item_code || '',
                                    item_name: b.item_name || '',
                                    generic_name: b.generic_name || '',
                                    category: b.category || 'General Pharmacy',
                                    batch_number: b.batch_number || '',
                                    expiry_date: b.expiry_date ? String(b.expiry_date).split('T')[0] : '',
                                    quantity_available: b.quantity_available ?? 0,
                                    quantity_received: b.quantity_received ?? b.quantity_available ?? 0,
                                    purchase_rate: b.purchase_rate ?? 0,
                                    mrp: b.mrp ?? 0,
                                    selling_price: b.selling_price ?? b.mrp ?? 0,
                                    rack_location: b.rack_location || '',
                                    branch_id: b.branch_id || '',
                                    is_active: b.is_active !== false,
                                  });
                                  setShowBatchModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors"
                                title="Edit Batch Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {b.is_active !== false ? (
                                <button
                                  onClick={() => handleDeleteBatch(b.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                                  title="Deactivate Batch"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivateBatch(b)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors"
                                  title="Reactivate Batch"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: ROLE PERMISSIONS MATRIX                                            */}
      {/* ========================================================================= */}
      {activeTab === 'profiles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold text-slate-700 px-1 mb-1">
              VaidyaMD Canonical Roles ({VAIDYAMD_ROLES.length})
            </div>
            {VAIDYAMD_ROLES.map((roleDef) => {
              const matchedProfile = findProfileForRole(roleDef.id, profiles);
              const isSelected = selectedRoleId === roleDef.id;
              return (
                <button
                  key={roleDef.id}
                  onClick={() => {
                    setSelectedRoleId(roleDef.id);
                    if (matchedProfile) {
                      setSelectedProfile(matchedProfile);
                    } else {
                      setSelectedProfile({
                        name: roleDef.name,
                        description: roleDef.desc,
                        menu_permissions: getDefaultPermissionsForRole(roleDef.id),
                      });
                    }
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs">{roleDef.name}</div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 font-semibold'
                      }`}
                    >
                      {roleDef.id}
                    </span>
                  </div>
                  <div className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                    {roleDef.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Permissions Matrix: {selectedProfile?.name}</h3>
                <p className="text-[11px] text-slate-500">Toggle functional clinical and administrative modules</p>
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                {isSavingProfile ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuKeys.map((menu) => {
                const isChecked = !!selectedProfile?.menu_permissions?.[menu.key];
                return (
                  <label
                    key={menu.key}
                    className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/80 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const cur = selectedProfile?.menu_permissions || {};
                        setSelectedProfile({
                          ...selectedProfile,
                          menu_permissions: { ...cur, [menu.key]: !cur[menu.key] },
                        });
                      }}
                      className="rounded text-primary focus:ring-primary focus:border-primary w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-800">{menu.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 10: IN-APP CSV IMPORT / EXPORT HUB (ALL 14 DOMAINS)                    */}
      {/* ========================================================================= */}
      {activeTab === 'csv_hub' && (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs text-primary flex justify-between items-center">
            <div>
              <span className="font-bold block text-sm">Dynamic In-App CSV Import & Export Hub</span>
              <span>Download blank RFC 4180 headers, live export existing hospital records, or ingest bulk datasets.</span>
            </div>
            <span className="px-2.5 py-1 bg-white text-primary font-mono font-bold rounded border border-primary/20">
              {csvDomains.length || 14} Domains Supported
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {csvDomains.map((dom) => (
              <div key={dom.key} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{dom.title}</h3>
                    <span className="font-mono text-[10px] text-slate-400 font-semibold">{dom.key}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{dom.description}</p>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono line-clamp-1">
                    Headers: {dom.headers?.join(', ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(dom.key, 'blank')}
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Template
                  </button>
                  <button
                    onClick={() => handleDownloadCsv(dom.key, 'export')}
                    className="flex-1 text-center py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => {
                      setImportDomainModal(dom);
                      setImportFile(null);
                      setImportResult(null);
                      setConflictMode('overwrite');
                    }}
                    className="flex-1 py-1.5 px-2 bg-primary hover:bg-primary-mid text-white font-semibold text-[11px] rounded-md transition-colors"
                  >
                    Import
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STAFF USER                                              */}
      {/* ========================================================================= */}
      {(showAddStaffModal || showEditStaffModal) && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingStaffUser ? 'Edit Staff User & Credentials' : 'Add New Staff User'}
              </h3>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setShowEditStaffModal(false);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaffUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Corporate Email Address *</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {editingStaffUser ? 'New Password (Leave blank to keep)' : 'Temporary Password *'}
                  </label>
                  <input
                    type="password"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Branch Facility</label>
                  <select
                    value={staffForm.branch_id}
                    onChange={(e) => setStaffForm({ ...staffForm, branch_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="">Main Facility (All)</option>
                    {hospitalBranches.map((br) => (
                      <option key={br.id} value={br.id}>{br.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="embryologist">Embryologist</option>
                    <option value="nurse">Nurse</option>
                    <option value="pharma">Pharmacist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="manager">Manager</option>
                    <option value="accounts">Accounts</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">NMC / State Reg No.</label>
                  <input
                    type="text"
                    value={staffForm.reg_number}
                    onChange={(e) => setStaffForm({ ...staffForm, reg_number: e.target.value })}
                    placeholder="TSMC-44912"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Specialization</label>
                  <input
                    type="text"
                    value={staffForm.specialization}
                    onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                    placeholder="Reproductive Medicine / Embryology"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Degrees & Qualifications</label>
                  <input
                    type="text"
                    value={staffForm.qualification}
                    onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                    placeholder="MBBS, MS (OBG), DRM"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffForm.is_doctor}
                    onChange={(e) => setStaffForm({ ...staffForm, is_doctor: e.target.checked })}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-slate-700">Treating Doctor Privileges</span>
                </label>
                {staffForm.role !== 'admin' && staffForm.role !== 'ADMIN' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffForm.is_active}
                      onChange={(e) => setStaffForm({ ...staffForm, is_active: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="font-semibold text-slate-700">Account Active</span>
                  </label>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Administrator accounts are permanently active</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setShowEditStaffModal(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Staff User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT SERVICE CATALOG ITEM                                    */}
      {/* ========================================================================= */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingServiceItem ? 'Edit Service Catalog Item' : 'New Service Catalog Item'}
              </h3>
              <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveServiceItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Code *</label>
                <input
                  type="text"
                  required
                  value={serviceItemForm.code}
                  onChange={(e) => setServiceItemForm({ ...serviceItemForm, code: e.target.value })}
                  placeholder="e.g. OPD-001, USG-002"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Service Name *</label>
                <input
                  type="text"
                  required
                  value={serviceItemForm.name}
                  onChange={(e) => setServiceItemForm({ ...serviceItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={serviceItemForm.category}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Consultation">Consultation</option>
                    <option value="Scan">Scan</option>
                    <option value="Lab">Lab</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Daycare">Daycare</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={serviceItemForm.base_price}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, base_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={serviceItemForm.hsn_sac}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, hsn_sac: e.target.value })}
                    placeholder="999312"
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Rate (%)</label>
                  <input
                    type="number"
                    value={serviceItemForm.gst_rate}
                    onChange={(e) => setServiceItemForm({ ...serviceItemForm, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT TREATMENT PACKAGE                                       */}
      {/* ========================================================================= */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPackage ? 'Edit Bundled Package' : 'New Bundled Package'}
              </h3>
              <button onClick={() => setShowPackageModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="e.g. IVF-ICSI Comprehensive Package"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Includes OPU, ICSI, Embryo Transfer & 4 Scans"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bundle Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={packageForm.base_price}
                  onChange={(e) => setPackageForm({ ...packageForm, base_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-700 font-semibold">Included Services & Components</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(packageForm.items_json);
                          if (Array.isArray(parsed)) setPackageFormItems(parsed);
                        } catch {}
                        setPackageEditorMode('form');
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        packageEditorMode === 'form' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Form View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(packageFormItems, null, 2) }));
                        setPackageEditorMode('json');
                      }}
                      className={`px-3 py-1 rounded-md transition-all ${
                        packageEditorMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      JSON Editor
                    </button>
                  </div>
                </div>

                {packageEditorMode === 'form' ? (
                  <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto">
                    {packageFormItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <input
                          type="text"
                          placeholder="Service name"
                          value={item.name || ''}
                          onChange={(e) => {
                            const next = [...packageFormItems];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setPackageFormItems(next);
                            setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                          }}
                          className="flex-1 px-2 py-1 border border-slate-200 rounded text-xs"
                        />
                        <div className="w-16 flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => {
                              const next = [...packageFormItems];
                              next[idx] = { ...next[idx], quantity: Math.max(1, Number(e.target.value)) };
                              setPackageFormItems(next);
                              setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                            }}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs text-center font-mono"
                          />
                        </div>
                        <div className="w-24 flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={item.price || 0}
                            onChange={(e) => {
                              const next = [...packageFormItems];
                              next[idx] = { ...next[idx], price: Number(e.target.value) };
                              setPackageFormItems(next);
                              setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                            }}
                            className="w-full px-1 py-1 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = packageFormItems.filter((_, i) => i !== idx);
                            setPackageFormItems(next);
                            setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...packageFormItems, { name: '', quantity: 1, price: 0 }];
                          setPackageFormItems(next);
                          setPackageForm((prev) => ({ ...prev, items_json: JSON.stringify(next, null, 2) }));
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-md flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Service Item
                      </button>

                      {packageFormItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const sum = packageFormItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                            setPackageForm((prev) => ({ ...prev, base_price: sum }));
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Calculate Total: ₹{packageFormItems.reduce((acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)), 0).toLocaleString('en-IN')}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={5}
                      value={packageForm.items_json}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPackageForm({ ...packageForm, items_json: val });
                        try {
                          const parsed = JSON.parse(val);
                          if (Array.isArray(parsed)) setPackageFormItems(parsed);
                        } catch {}
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-[11px]"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>Live JSON Array Schema: [&#123; name, quantity, price &#125;]</span>
                      {(() => {
                        try {
                          const p = JSON.parse(packageForm.items_json);
                          return Array.isArray(p) ? (
                            <span className="text-emerald-600 font-semibold">✓ Valid JSON ({p.length} items)</span>
                          ) : (
                            <span className="text-amber-600">Must be array</span>
                          );
                        } catch {
                          return <span className="text-rose-500 font-semibold">⚠ Syntax Error</span>;
                        }
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT COSGYN SPECIALTY PACKAGE                              */}
      {/* ========================================================================= */}
      {showCosgynModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingCosgynTreatment ? 'Edit CosGyn Specialty Package' : 'Create CosGyn Specialty Package'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure regenerative aesthetic gynecology protocol, modalities & tariff</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCosgynModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCosgynTreatment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Package Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Postpartum Pelvic Rejuvenation - Gold"
                  value={cosgynForm.name}
                  onChange={(e) => setCosgynForm({ ...cosgynForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Protocol / Combo Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jet Plasma + Tesla Chair HIFEM"
                    value={cosgynForm.package_combo}
                    onChange={(e) => setCosgynForm({ ...cosgynForm, package_combo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Optional descriptive sub-label</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Package Tariff (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={cosgynForm.price}
                      onChange={(e) => setCosgynForm({ ...cosgynForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Inclusive price billed on prescription</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    Clinical Modality Sessions
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Session quotas for patient passbook</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-sky-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Jet Plasma
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.jet_plasma_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, jet_plasma_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Duration (mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.jet_plasma_duration_mins}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, jet_plasma_duration_mins: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-purple-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Tesla Chair HIFEM
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.tesla_chair_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, tesla_chair_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Duration (mins)</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.tesla_chair_duration_mins}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, tesla_chair_duration_mins: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                    <div className="text-xs font-semibold text-rose-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      PRP Revitalization
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500">Sessions</label>
                      <input
                        type="number"
                        min="0"
                        value={cosgynForm.prp_sessions}
                        onChange={(e) => setCosgynForm({ ...cosgynForm, prp_sessions: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs"
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 pt-2">
                      Autologous concentrate therapy
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCosgynModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {editingCosgynTreatment ? 'Update CosGyn Package' : 'Save CosGyn Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW CLINICAL / RX TEMPLATE                                  */}
      {/* ========================================================================= */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create New Clinical / Rx Template</h3>
                <p className="text-xs text-slate-500">Configure consultation proformas, order sets, or stimulation protocol templates</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-4">
              {/* Purpose Group Selector */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Clinical Purpose / Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'proformas', label: 'Clinical Proforma', desc: 'Consultation & ANC' },
                    { id: 'scans', label: 'Ultrasound & Scan', desc: 'Follicular / TVS' },
                    { id: 'order_sets', label: 'Smart Order Set', desc: 'Investigation Bundle' },
                    { id: 'rx', label: 'Rx & Protocol', desc: 'Daily Drug Regimen' },
                    { id: 'visit_types', label: 'Visit Type', desc: 'Appointment Slot' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSetNewTemplatePurpose(cat.id as TemplatePurpose)}
                      className={`text-left p-2 rounded-lg border transition-all ${
                        newTemplatePurpose === cat.id
                          ? 'bg-primary text-white border-primary shadow-xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="text-[11px] truncate">{cat.label}</div>
                      <div className={`text-[9px] truncate ${newTemplatePurpose === cat.id ? 'text-white/80' : 'text-slate-400'}`}>
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Template Title *</label>
                  <input
                    type="text"
                    required
                    value={newTemplateForm.title}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                    placeholder="e.g. Endometriosis Workup Proforma"
                    className="vmd-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Record Type / Slug *</label>
                  <input
                    type="text"
                    required
                    value={newTemplateForm.record_type}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, record_type: e.target.value })}
                    placeholder="e.g. endometriosis_workup"
                    className="vmd-input font-mono"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['clinical_template', 'opd_order_set', 'rx_template', 'follicular_study'].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setNewTemplateForm((prev) => ({ ...prev, record_type: slug }))}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono"
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Plugin / Department</label>
                  <select
                    value={newTemplateForm.plugin_id}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, plugin_id: e.target.value })}
                    className="vmd-input"
                  >
                    <option value="fertility">Reproductive Medicine (Fertility)</option>
                    <option value="opd">Outpatient Clinic (OPD)</option>
                    <option value="lims">Diagnostic Laboratory (LIMS)</option>
                    <option value="counseling">Clinical Counseling</option>
                    <option value="ipd">Inpatient Wards (IPD)</option>
                    <option value="pharmacy">Pharmacy Dispensary</option>
                    <option value="admin">Hospital Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={newTemplateForm.description}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
                    placeholder="Brief description of when this template is used..."
                    className="vmd-input"
                  />
                </div>
              </div>

              {/* Schema Configuration Header with Dual Toggle & Presets */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Field Configuration & Schema
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(newTemplateForm.schema_json);
                            setNewTemplateFields(parseSchemaToFields(parsed));
                          } catch {}
                          setNewTemplateEditorMode('form');
                        }}
                        className={`px-3 py-1 rounded-md transition-all ${
                          newTemplateEditorMode === 'form' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Form Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = buildSchemaFromFields(newTemplateFields);
                          setNewTemplateForm((prev) => ({ ...prev, schema_json: JSON.stringify(updated, null, 2) }));
                          setNewTemplateEditorMode('json');
                        }}
                        className={`px-3 py-1 rounded-md transition-all ${
                          newTemplateEditorMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                  <span className="text-slate-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('consultation', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('ultrasound', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Ultrasound Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('order_set', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Order Set
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('rx', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Rx Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('visit_type', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Visit Type
                  </button>
                </div>

                {/* Form Builder Mode */}
                {newTemplateEditorMode === 'form' ? (
                  <div className="space-y-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
                    {/* 1. Rx New Template Editor */}
                    {newTemplatePurpose === 'rx' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">Protocol Category</label>
                          <select
                            value={newRxCategory}
                            onChange={(e) => setNewRxCategory(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Stimulation / OI">Stimulation / Ovulation Induction</option>
                            <option value="Luteal Phase Support">Luteal Phase Support</option>
                            <option value="Down-Regulation / Agonist">Down-Regulation / Agonist</option>
                            <option value="FET Preparation">FET Endometrial Preparation</option>
                            <option value="Post-OPU / Transfer">Post-OPU / Transfer Support</option>
                            <option value="General Clinical Rx">General Clinical Rx</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-700">Prescription Medication Regimen ({newRxMedications.length})</span>
                            <button
                              type="button"
                              onClick={() => setNewRxMedications([...newRxMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                              className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" /> Add Drug
                            </button>
                          </div>

                          <div className="space-y-2">
                            {newRxMedications.map((med, mIdx) => (
                              <div key={mIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-mono font-bold text-indigo-600">#{mIdx + 1} Medication</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewRxMedications(newRxMedications.filter((_, i) => i !== mIdx))}
                                    disabled={newRxMedications.length <= 1}
                                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={med.drug_name}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].drug_name = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Drug Name (e.g. Tab Letrozole)"
                                    className="vmd-input text-xs sm:col-span-2"
                                  />
                                  <input
                                    type="text"
                                    value={med.dose}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].dose = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Dose (e.g. 2.5mg)"
                                    className="vmd-input text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <select
                                    value={med.frequency}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].frequency = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    className="vmd-input text-xs font-semibold"
                                  >
                                    <option value="OD">OD (Once Daily)</option>
                                    <option value="BD">BD (Twice Daily)</option>
                                    <option value="TDS">TDS (Thrice Daily)</option>
                                    <option value="QID">QID (4 Times Daily)</option>
                                    <option value="HS">HS (At Bedtime)</option>
                                    <option value="SOS">SOS (When Needed)</option>
                                    <option value="STAT">STAT (Immediate)</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].duration = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Duration (e.g. 5 days)"
                                    className="vmd-input text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={med.instructions}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].instructions = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Instructions (e.g. After food)"
                                    className="vmd-input text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Patient & Protocol Advice</label>
                          <textarea
                            rows={2}
                            value={newRxAdvice}
                            onChange={(e) => setNewRxAdvice(e.target.value)}
                            placeholder="Advice given on prescription slip..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Order Sets New Template Editor */}
                    {newTemplatePurpose === 'order_sets' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">Specialty Category</label>
                          <select
                            value={newOrderCategory}
                            onChange={(e) => setNewOrderCategory(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Fertility / IVF">Fertility / IVF</option>
                            <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Andrology / Male Fertility">Andrology / Male Fertility</option>
                            <option value="Endocrinology">Endocrinology</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">
                            Requisitioned Diagnostic Tests (Comma-separated)
                          </label>
                          <textarea
                            rows={2}
                            value={newOrderInvestigations}
                            onChange={(e) => setNewOrderInvestigations(e.target.value)}
                            placeholder="e.g. Serum AMH, Baseline TVS, Day 2 FSH/LH, Semen Analysis"
                            className="vmd-input text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-700">Bundled Companion Medications ({newOrderMedications.length})</span>
                            <button
                              type="button"
                              onClick={() => setNewOrderMedications([...newOrderMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                              className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" /> Add Med
                            </button>
                          </div>

                          {newOrderMedications.map((med, mIdx) => (
                            <div key={mIdx} className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              <input
                                type="text"
                                value={med.drug_name}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].drug_name = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Drug name"
                                className="vmd-input text-xs"
                              />
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].dose = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Dose"
                                className="vmd-input text-xs"
                              />
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].frequency = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Frequency (OD/BD)"
                                className="vmd-input text-xs"
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => {
                                    const next = [...newOrderMedications];
                                    next[mIdx].duration = e.target.value;
                                    setNewOrderMedications(next);
                                  }}
                                  placeholder="Duration"
                                  className="vmd-input text-xs flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewOrderMedications(newOrderMedications.filter((_, i) => i !== mIdx))}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Clinical / Nursing Instructions</label>
                          <textarea
                            rows={2}
                            value={newOrderInstructions}
                            onChange={(e) => setNewOrderInstructions(e.target.value)}
                            placeholder="Special nursing or fasting instructions..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Clinical Proformas New Template Editor */}
                    {newTemplatePurpose === 'proformas' && (
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Chief Complaints & Duration *</label>
                          <textarea
                            rows={2}
                            value={newProformaComplaint}
                            onChange={(e) => setNewProformaComplaint(e.target.value)}
                            placeholder="e.g. Primary Infertility for 2.5 years..."
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">History of Presenting Illness (HOPI)</label>
                          <textarea
                            rows={2}
                            value={newProformaHopi}
                            onChange={(e) => setNewProformaHopi(e.target.value)}
                            placeholder="Detailed clinical history..."
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Provisional Diagnosis *</label>
                            <input
                              type="text"
                              value={newProformaDiagnosis}
                              onChange={(e) => setNewProformaDiagnosis(e.target.value)}
                              placeholder="e.g. Primary Infertility / PCOS"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Diagnostic Investigations</label>
                            <input
                              type="text"
                              value={newProformaInvestigations}
                              onChange={(e) => setNewProformaInvestigations(e.target.value)}
                              placeholder="e.g. Day 2 Baseline TVS, Serum AMH"
                              className="vmd-input text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Plan of Management</label>
                          <textarea
                            rows={2}
                            value={newProformaPlan}
                            onChange={(e) => setNewProformaPlan(e.target.value)}
                            placeholder="Management steps, OI protocol, counseling notes..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. Ultrasound Scans New Template Editor */}
                    {newTemplatePurpose === 'scans' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700">Scan Modality</label>
                          <select
                            value={newScanType}
                            onChange={(e) => setNewScanType(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Transvaginal Sonography (TVS)">Transvaginal Sonography (TVS)</option>
                            <option value="Follicular Tracking Study">Follicular Tracking Study</option>
                            <option value="Transabdominal Pelvic USG (TAS)">Transabdominal Pelvic USG (TAS)</option>
                            <option value="Early Pregnancy Viability USG">Early Pregnancy Viability USG</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Endometrium Metrics</label>
                            <input
                              type="text"
                              value={newScanEndometrium}
                              onChange={(e) => setNewScanEndometrium(e.target.value)}
                              placeholder="e.g. 8.2mm, Trilaminar Triple-Line"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Pouch of Douglas (POD)</label>
                            <input
                              type="text"
                              value={newScanPod}
                              onChange={(e) => setNewScanPod(e.target.value)}
                              placeholder="e.g. Clear / No free fluid"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Right Ovary Metrics</label>
                            <input
                              type="text"
                              value={newScanRightOvary}
                              onChange={(e) => setNewScanRightOvary(e.target.value)}
                              placeholder="e.g. AFC: 8 | Dominant: 18.5mm"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Left Ovary Metrics</label>
                            <input
                              type="text"
                              value={newScanLeftOvary}
                              onChange={(e) => setNewScanLeftOvary(e.target.value)}
                              placeholder="e.g. AFC: 7 | Leading: 12.0mm"
                              className="vmd-input text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Sonographic Impression</label>
                          <textarea
                            rows={2}
                            value={newScanImpression}
                            onChange={(e) => setNewScanImpression(e.target.value)}
                            placeholder="Summary ultrasound impression..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 5. Visit Types New Template Editor */}
                    {newTemplatePurpose === 'visit_types' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Slot Duration</label>
                            <select
                              value={newVisitDurationMinutes}
                              onChange={(e) => setNewVisitDurationMinutes(Number(e.target.value))}
                              className="vmd-input text-xs font-semibold"
                            >
                              <option value={15}>15 Minutes</option>
                              <option value={20}>20 Minutes</option>
                              <option value={30}>30 Minutes</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Consultation Modality</label>
                            <input
                              type="text"
                              value={newVisitConsultationType}
                              onChange={(e) => setNewVisitConsultationType(e.target.value)}
                              placeholder="e.g. Couple Infertility Workup"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Allocated Room / Suite</label>
                            <select
                              value={newVisitRoom}
                              onChange={(e) => setNewVisitRoom(e.target.value)}
                              className="vmd-input text-xs"
                            >
                              <option value="Consultation Room 1">Consultation Room 1</option>
                              <option value="Consultation Room 2">Consultation Room 2</option>
                              <option value="Ultrasound TVS Suite A">Ultrasound TVS Suite A</option>
                              <option value="IVF Cleanroom Procedure OT">IVF Cleanroom Procedure OT</option>
                              <option value="Andrology Semen Collection Suite">Andrology Semen Collection Suite</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Linked Tariff Code</label>
                            <input
                              type="text"
                              value={newVisitTariffCode}
                              onChange={(e) => setNewVisitTariffCode(e.target.value)}
                              placeholder="e.g. OPD-CONS-01"
                              className="vmd-input text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Patient Preparation Guidelines</label>
                          <textarea
                            rows={2}
                            value={newVisitInstructions}
                            onChange={(e) => setNewVisitInstructions(e.target.value)}
                            placeholder="Instructions communicated to patient on booking confirmation..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={10}
                      value={newTemplateForm.schema_json}
                      onChange={(e) => handleNewTemplateJsonChange(e.target.value)}
                      className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg bg-slate-900 text-slate-100"
                    />
                    <div className="mt-1 text-[11px]">
                      {newTemplateJsonError ? (
                        <span className="text-rose-500 font-semibold">⚠ {newTemplateJsonError}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">✓ Valid JSON</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewTemplate}
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                >
                  {isSavingNewTemplate ? 'Creating Template...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PHARMACY VENDOR                                                */}
      {/* ========================================================================= */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingVendor ? 'Edit Pharmacy Vendor' : 'Add Approved Pharmacy Vendor'}
              </h3>
              <button onClick={() => setShowVendorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor Trade Name *</label>
                <input
                  type="text"
                  required
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                  placeholder="e.g. Merck India Pharma Ltd."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Vendor GSTIN</label>
                <input
                  type="text"
                  value={vendorForm.gst_number}
                  onChange={(e) => setVendorForm({ ...vendorForm, gst_number: e.target.value })}
                  placeholder="36AAAAA1234A1Z5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                  <input
                    type="text"
                    value={vendorForm.contact_phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorForm.contact_email}
                    onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Warehouse Address</label>
                <input
                  type="text"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PHARMACY STOCK BATCH                                    */}
      {/* ========================================================================= */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingBatch ? 'Edit Pharmacy Inventory Batch' : 'Add New Drug Formulary Batch'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingBatch ? `Updating batch ${editingBatch.batch_number}` : 'Create a new stock batch with FEFO expiry and pricing'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Medication / Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.item_name}
                    onChange={(e) => setBatchForm({ ...batchForm, item_name: e.target.value })}
                    placeholder="e.g. DUPHASTON TAB 10MG"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Generic Name / Salt Formulation</label>
                  <input
                    type="text"
                    value={batchForm.generic_name}
                    onChange={(e) => setBatchForm({ ...batchForm, generic_name: e.target.value })}
                    placeholder="e.g. Dydrogesterone 10mg"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Item Code / SKU *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.item_code}
                    onChange={(e) => setBatchForm({ ...batchForm, item_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SODU02"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-semibold focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Therapeutic Category *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.category}
                    onChange={(e) => setBatchForm({ ...batchForm, category: e.target.value })}
                    placeholder="e.g. Luteal Support / Hormones"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batch_number}
                    onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. MAW26022"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiry_date}
                    onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Available Quantity (Units) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={batchForm.quantity_available}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity_available: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-primary focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Quantity Received</label>
                  <input
                    type="number"
                    min="0"
                    value={batchForm.quantity_received}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity_received: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Purchase / Cost Rate (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchForm.purchase_rate}
                    onChange={(e) => setBatchForm({ ...batchForm, purchase_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">MRP (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={batchForm.mrp}
                    onChange={(e) => setBatchForm({ ...batchForm, mrp: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={batchForm.selling_price || batchForm.mrp}
                    onChange={(e) => setBatchForm({ ...batchForm, selling_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rack / Storage Location</label>
                  <input
                    type="text"
                    value={batchForm.rack_location}
                    onChange={(e) => setBatchForm({ ...batchForm, rack_location: e.target.value })}
                    placeholder="e.g. D210 / Fridge 1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary uppercase"
                  />
                </div>

                {hospitalBranches.length > 1 && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Branch Context</label>
                    <select
                      value={batchForm.branch_id}
                      onChange={(e) => setBatchForm({ ...batchForm, branch_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Default Main Branch</option>
                      {hospitalBranches.map((br) => (
                        <option key={br.id} value={br.id}>
                          {br.name} ({br.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={batchForm.is_active}
                      onChange={(e) => setBatchForm({ ...batchForm, is_active: e.target.checked })}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="text-slate-700 font-semibold">Active Formulary Stock (Eligible for FEFO OPD Dispensing)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {editingBatch ? 'Update Batch' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IN-APP CSV IMPORT EXECUTION                                        */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* MODAL: IN-APP CSV IMPORT EXECUTION & OVERRIDE PREVIEW                     */}
      {/* ========================================================================= */}
      {importDomainModal && (
        <div className="fixed inset-0 bg-rail-bg/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>Import CSV: {importDomainModal.title}</span>
                </h3>
                <p className="text-[11px] text-slate-500">Domain: {importDomainModal.key} ({importDomainModal.filename})</p>
              </div>
              <button
                onClick={() => {
                  setImportDomainModal(null);
                  setImportFile(null);
                  setCsvPreviewRows([]);
                  setCsvPreviewData(null);
                  setImportResult(null);
                  setEditingCsvRowIndex(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Conflict Policy Selector */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Conflict Resolution Policy:</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                      conflictMode === 'overwrite' ? 'bg-amber-500/10 border-amber-500/40 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflict"
                      checked={conflictMode === 'overwrite'}
                      onChange={() => handleConflictModeChange('overwrite')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold block text-xs flex items-center gap-1">
                        <span>⚡ Overwrite (Upsert)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Existing records in database will be updated with uploaded CSV values</span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-colors ${
                      conflictMode === 'skip' ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="conflict"
                      checked={conflictMode === 'skip'}
                      onChange={() => handleConflictModeChange('skip')}
                      className="text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="font-bold block text-xs">○ Skip Existing</span>
                      <span className="text-[10px] text-slate-500">Only inserts new rows; preserves existing database records untouched</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Drag and drop file picker */}
              {!importFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-primary rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 transition-colors"
                >
                  <UploadCloud className="w-10 h-10 text-primary mx-auto mb-2" />
                  <span className="font-bold text-slate-700 block text-sm">Click to select CSV file</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Standard RFC 4180 CSV formatted file matching canonical headers
                  </span>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono">
                    Expected headers: {importDomainModal.headers?.join(', ')}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelectForImport(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-primary shadow-xs border border-slate-200">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">{importFile.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(importFile.size / 1024).toFixed(1)} KB · {csvPreviewRows.length} total rows detected
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImportFile(null);
                      setCsvPreviewRows([]);
                      setCsvPreviewData(null);
                      setImportResult(null);
                      setEditingCsvRowIndex(null);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded hover:bg-rose-50"
                  >
                    Change File
                  </button>
                </div>
              )}

              {/* Ingestion Conflict Analysis & Preview */}
              {isPreviewingCsv && (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <RefreshCw className="w-6 h-6 text-primary mx-auto animate-spin" />
                  <p className="font-semibold text-xs text-slate-800">Analyzing CSV rows & cross-referencing live database...</p>
                  <p className="text-[10px] text-slate-400">Checking for duplicate keys and existing entities</p>
                </div>
              )}

              {!isPreviewingCsv && csvPreviewRows.length > 0 && !importResult && (
                <div className="space-y-3">
                  {/* Summary Badges Bar */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Total Rows</div>
                      <div className="text-base font-bold text-slate-800">{csvPreviewRows.length}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <div className="text-[9px] uppercase font-bold text-emerald-600">New (Insert)</div>
                      <div className="text-base font-bold text-emerald-700">
                        {csvPreviewRows.filter((r) => !r.is_override).length}
                      </div>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <div className="text-[9px] uppercase font-bold text-amber-700 flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Overrides (Update)</span>
                      </div>
                      <div className="text-base font-bold text-amber-800">
                        {csvPreviewRows.filter((r) => r.is_override && conflictMode === 'overwrite').length}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[9px] uppercase font-bold text-slate-400">Skipped</div>
                      <div className="text-base font-bold text-slate-500">
                        {csvPreviewRows.filter((r) => r.is_override && conflictMode === 'skip').length}
                      </div>
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('all')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Rows ({csvPreviewRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('overrides')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'overrides' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Overrides ({csvPreviewRows.filter((r) => r.is_override).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCsvPreviewFilter('new')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          csvPreviewFilter === 'new' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        + New ({csvPreviewRows.filter((r) => !r.is_override).length})
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 italic">
                      Review changes below before saving
                    </span>
                  </div>

                  {/* Interactive Rows Preview Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-2 px-3 w-12 text-center">Row</th>
                          <th className="py-2 px-3 w-28">Action</th>
                          <th className="py-2 px-3">Unique Key / Identifier</th>
                          <th className="py-2 px-3">Entity Name / Details</th>
                          <th className="py-2 px-3 text-right w-24">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreviewRows
                          .filter((r) => {
                            if (csvPreviewFilter === 'overrides') return r.is_override;
                            if (csvPreviewFilter === 'new') return !r.is_override;
                            return true;
                          })
                          .map((row) => (
                            <tr
                              key={row.row_index}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                row.is_override
                                  ? conflictMode === 'overwrite'
                                    ? 'bg-amber-50/40'
                                    : 'bg-slate-50/40 opacity-70'
                                  : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                                #{row.row_index}
                              </td>
                              <td className="py-2 px-3">
                                {row.is_override ? (
                                  conflictMode === 'overwrite' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      <span>⚡ Overwrite</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      <span>○ Skip</span>
                                    </span>
                                  )
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <span>+ New</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-800">
                                {row.identifier || '—'}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-800 block truncate max-w-md">
                                  {row.name || '—'}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate max-w-md">
                                  {row.details}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                                <button
                                  type="button"
                                  title="Edit row data before importing"
                                  onClick={() => {
                                    setEditingCsvRowIndex(row.row_index);
                                    setEditingCsvRowForm({ ...row.raw });
                                  }}
                                  className="p-1 text-slate-500 hover:text-primary rounded hover:bg-slate-100"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  title="Remove this row from import"
                                  onClick={() => {
                                    setCsvPreviewRows((prev) => prev.filter((r) => r.row_index !== row.row_index));
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline Row Editor Dialog */}
                  {editingCsvRowIndex !== null && (
                    <div className="p-4 bg-slate-50 border border-primary/30 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5 text-primary" />
                          <span>Modify Row #{editingCsvRowIndex} Before Saving</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCsvRowIndex(null)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {Object.keys(editingCsvRowForm).map((colKey) => (
                          <div key={colKey}>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate mb-0.5">
                              {colKey}
                            </label>
                            <input
                              type="text"
                              value={editingCsvRowForm[colKey] || ''}
                              onChange={(e) =>
                                setEditingCsvRowForm({
                                  ...editingCsvRowForm,
                                  [colKey]: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded font-mono bg-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => setEditingCsvRowIndex(null)}
                          className="px-3 py-1.5 border border-slate-300 text-slate-600 rounded text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvPreviewRows((prev) =>
                              prev.map((r) => {
                                if (r.row_index === editingCsvRowIndex) {
                                  const firstVal = Object.values(editingCsvRowForm)[0] || r.identifier;
                                  const secondVal = Object.values(editingCsvRowForm)[1] || r.name;
                                  return {
                                    ...r,
                                    identifier: String(firstVal),
                                    name: String(secondVal),
                                    raw: { ...editingCsvRowForm },
                                  };
                                }
                                return r;
                              })
                            );
                            setEditingCsvRowIndex(null);
                          }}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-semibold shadow-xs"
                        >
                          Apply Row Edits
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Results display after execution */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>CSV Ingestion Completed Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    Database synchronization complete for domain <strong>{importDomainModal.title}</strong>.
                  </p>
                  <div className="text-xs grid grid-cols-4 gap-2 text-center mt-2 font-mono">
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Total Rows</div>
                      <div className="font-bold text-sm text-slate-800">{importResult.stats?.total_rows || 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-emerald-600 font-bold uppercase">Inserted (New)</div>
                      <div className="font-bold text-sm text-emerald-700">{importResult.stats?.inserted ?? importResult.stats?.created ?? 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-amber-600 font-bold uppercase">Updated (Upsert)</div>
                      <div className="font-bold text-sm text-amber-700">{importResult.stats?.updated || 0}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-emerald-200 shadow-xs">
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Skipped</div>
                      <div className="font-bold text-sm text-slate-600">{importResult.stats?.skipped || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
              <span className="text-[11px] text-slate-400">
                {importFile ? `${csvPreviewRows.length} rows queued` : 'Select a file to begin'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportDomainModal(null);
                    setImportFile(null);
                    setCsvPreviewRows([]);
                    setCsvPreviewData(null);
                    setImportResult(null);
                    setEditingCsvRowIndex(null);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs"
                >
                  {importResult ? 'Done' : 'Cancel'}
                </button>

                {!importResult && (
                  <button
                    type="button"
                    disabled={!importFile || isImporting || isPreviewingCsv || csvPreviewRows.length === 0}
                    onClick={handleExecuteCsvImport}
                    className="px-5 py-2 bg-primary hover:bg-primary-mid disabled:opacity-50 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Ingesting Data...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save & Ingest ({csvPreviewRows.length} Rows)</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT WARD                                                    */}
      {/* ========================================================================= */}
      {showWardModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingWard ? 'Edit Ward Details' : 'Create New Inpatient Ward'}
              </h3>
              <button onClick={() => setShowWardModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveWard} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day Care Post-OP Recovery"
                  value={wardFormName}
                  onChange={(e) => setWardFormName(e.target.value)}
                  className="vmd-input text-xs w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ward Code *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingWard)}
                    placeholder="e.g. DAYCARE"
                    value={wardFormCode}
                    onChange={(e) => setWardFormCode(e.target.value.toUpperCase())}
                    className="vmd-input text-xs w-full font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Inpatient Care"
                    value={wardFormDept}
                    onChange={(e) => setWardFormDept(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Base Tariff / Day (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={wardFormRate}
                    onChange={(e) => setWardFormRate(Number(e.target.value))}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                {!editingWard && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Auto-Provision Beds</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={wardFormBeds}
                      onChange={(e) => setWardFormBeds(Number(e.target.value))}
                      className="vmd-input text-xs w-full font-mono"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWardModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingWard ? 'Update Ward' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BED                                                     */}
      {/* ========================================================================= */}
      {showBedModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBed ? 'Edit Bed Details' : 'Add New Hospital Bed'}
              </h3>
              <button onClick={() => setShowBedModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBed} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Ward *</label>
                <select
                  required
                  disabled={Boolean(editingBed)}
                  value={bedFormWardId}
                  onChange={(e) => {
                    setBedFormWardId(e.target.value);
                    const selectedW = wards.find((w) => w.id === e.target.value);
                    if (selectedW && !editingBed) {
                      setBedFormRate(selectedW.base_charge_per_day || 2500);
                    }
                  }}
                  className="vmd-input text-xs w-full bg-white"
                >
                  <option value="">Select Ward...</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code}) — ₹{w.base_charge_per_day}/day
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bed Number / Identifier *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DC-05 or DLX-103"
                    value={bedFormNumber}
                    onChange={(e) => setBedFormNumber(e.target.value)}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bed Type</label>
                  <select
                    value={bedFormType}
                    onChange={(e) => setBedFormType(e.target.value)}
                    className="vmd-input text-xs w-full bg-white"
                  >
                    <option value="standard_manual">Standard Manual</option>
                    <option value="electric_fowler">Electric Fowler</option>
                    <option value="icu_monitor_bed">ICU Monitor Bed</option>
                    <option value="deluxe_suite">Deluxe Suite Bed</option>
                    <option value="daycare_recliner">Daycare Recliner</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Tariff (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={bedFormRate}
                    onChange={(e) => setBedFormRate(Number(e.target.value))}
                    className="vmd-input text-xs w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
                  <select
                    value={bedFormStatus}
                    onChange={(e) => setBedFormStatus(e.target.value)}
                    className="vmd-input text-xs w-full bg-white font-semibold"
                  >
                    <option value="Vacant">Vacant (Available)</option>
                    <option value="Cleaning">Cleaning / Sanitization</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Occupied">Occupied</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBedModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingBed ? 'Update Bed' : 'Create Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ART MODALITY                                             */}
      {/* ========================================================================= */}
      {showCycleModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCycleType ? 'Edit Treatment Modality' : 'Add New ART Modality'}
              </h3>
              <button onClick={() => setShowCycleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCycleType} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Modality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ICSI + PGT-A or Oocyte Vitrification"
                  value={cycleTypeForm.name}
                  onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Clinical Category</label>
                  <select
                    value={cycleTypeForm.category}
                    onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Stimulation">Stimulation</option>
                    <option value="FET">Frozen Embryo Transfer (FET)</option>
                    <option value="IUI">Intrauterine Insemination (IUI)</option>
                    <option value="Preservation">Cryopreservation</option>
                    <option value="Third-Party">Third-Party Reproduction</option>
                    <option value="Diagnostics">Diagnostics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={cycleTypeForm.display_order}
                    onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={cycleTypeForm.is_active}
                  onChange={(e) => setCycleTypeForm({ ...cycleTypeForm, is_active: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <span className="font-semibold text-slate-700">Active Modality (Selectable in Cycle Wizard)</span>
              </label>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCycleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingCycleType ? 'Update Modality' : 'Save Modality'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CLINICAL PROTOCOL (FULL DRUG & TIMELINE EVENT BUILDER)   */}
      {/* ========================================================================= */}
      {showProtocolModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingProtocol ? `Edit Protocol: ${editingProtocol.name}` : 'Add New Clinical Protocol Template'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure protocol metadata, prescription dosing rules, and scheduled clinical scans, labs, and procedures.
                </p>
              </div>
              <button onClick={() => setShowProtocolModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProtocol} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* SECTION 1: PROTOCOL IDENTITY */}
              <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Dna className="w-4 h-4 text-primary" /> Protocol Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Protocol Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Antagonist (Flexible) Protocol"
                      value={protocolForm.name}
                      onChange={(e) => setProtocolForm({ ...protocolForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                    <select
                      value={protocolForm.category}
                      onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white capitalize"
                    >
                      <option value="stimulation">Stimulation</option>
                      <option value="fet">FET Endometrial Prep</option>
                      <option value="luteal">Luteal Phase Support</option>
                      <option value="iui">IUI Mild Stimulation</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-slate-700 font-semibold mb-1">Clinical Description / Indication</label>
                    <input
                      type="text"
                      placeholder="e.g. Standard GnRH antagonist protocol for normal-to-high responders"
                      value={protocolForm.description}
                      onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: MEDICATION RULES */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-primary" /> Configured Prescriptions & Drug Rules ({protocolForm.rules.length})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Define medications, cycle day offsets, and dosing schedules.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolForm({
                        ...protocolForm,
                        rules: [
                          ...protocolForm.rules,
                          {
                            drug_name: '',
                            dose: '',
                            route: 'SC',
                            frequency: 'OD',
                            day_start_offset: 1,
                            day_end_offset: 10,
                            instructions: '',
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg flex items-center gap-1 border border-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </button>
                </div>

                {protocolForm.rules.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Medication *</th>
                          <th className="py-2.5 px-2 w-24">Dose *</th>
                          <th className="py-2.5 px-2 w-24">Route</th>
                          <th className="py-2.5 px-2 w-20">Freq</th>
                          <th className="py-2.5 px-2 w-16 text-center">Start Day</th>
                          <th className="py-2.5 px-2 w-16 text-center">End Day</th>
                          <th className="py-2.5 px-3">Instructions</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {protocolForm.rules.map((rule: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                required
                                placeholder="e.g. Inj Gonal-F"
                                value={rule.drug_name}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].drug_name = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <input
                                type="text"
                                required
                                placeholder="225 IU"
                                value={rule.dose}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].dose = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-mono font-bold text-primary"
                              />
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={rule.route || 'SC'}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].route = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              >
                                <option value="SC">SC</option>
                                <option value="Oral">Oral</option>
                                <option value="IM">IM</option>
                                <option value="Vaginal">Vaginal</option>
                                <option value="Sublingual">Sublingual</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2">
                              <select
                                value={rule.frequency || 'OD'}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].frequency = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              >
                                <option value="OD">OD</option>
                                <option value="BD">BD</option>
                                <option value="TDS">TDS</option>
                                <option value="QID">QID</option>
                                <option value="STAT">STAT</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={rule.day_start_offset}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].day_start_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-14 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={rule.day_end_offset}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].day_end_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-14 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="e.g. Evening at 9 PM"
                                value={rule.instructions || ''}
                                onChange={(e) => {
                                  const updated = [...protocolForm.rules];
                                  updated[idx].instructions = e.target.value;
                                  setProtocolForm({ ...protocolForm, rules: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setProtocolForm({
                                    ...protocolForm,
                                    rules: protocolForm.rules.filter((_: any, i: number) => i !== idx),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remove rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    No medication rules added yet. Click &quot;+ Add Medication&quot; to configure dosing.
                  </div>
                )}
              </div>

              {/* SECTION 3: TIMELINE EVENTS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-blue-600" /> Scheduled Scans, Labs & Procedures ({protocolForm.timeline_events?.length || 0})
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Schedule follicular ultrasound scans (🔍), diagnostic blood tests (🧪), and procedures (🧫).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolForm({
                        ...protocolForm,
                        timeline_events: [
                          ...(protocolForm.timeline_events || []),
                          {
                            type: 'scan',
                            day_offset: 2,
                            title: '',
                            instructions: '',
                          },
                        ],
                      })
                    }
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg flex items-center gap-1 border border-blue-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Clinical Event
                  </button>
                </div>

                {protocolForm.timeline_events && protocolForm.timeline_events.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-36">Event Track *</th>
                          <th className="py-2.5 px-2 w-20 text-center">Day Offset *</th>
                          <th className="py-2.5 px-3">Event Title *</th>
                          <th className="py-2.5 px-3">Clinical Instructions / Criteria</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {protocolForm.timeline_events.map((ev: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-1.5 px-3">
                              <select
                                value={ev.type || 'scan'}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].type = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-semibold text-[11px]"
                              >
                                <option value="scan">🔍 Ultrasound Scan</option>
                                <option value="investigation">🧪 Diagnostic Lab</option>
                                <option value="procedure">🧫 Clinical Procedure</option>
                              </select>
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <input
                                type="number"
                                required
                                value={ev.day_offset}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].day_offset = parseInt(e.target.value) || 0;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-16 px-1.5 py-1 border border-slate-200 rounded bg-white font-mono text-center font-bold"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                required
                                placeholder="e.g. Follicular Monitoring Scan or Serum E2"
                                value={ev.title}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].title = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white font-medium"
                              />
                            </td>
                            <td className="py-1.5 px-3">
                              <input
                                type="text"
                                placeholder="e.g. Baseline AFC scan or Trigger criteria"
                                value={ev.instructions || ''}
                                onChange={(e) => {
                                  const updated = [...(protocolForm.timeline_events || [])];
                                  updated[idx].instructions = e.target.value;
                                  setProtocolForm({ ...protocolForm, timeline_events: updated });
                                }}
                                className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-[11px]"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setProtocolForm({
                                    ...protocolForm,
                                    timeline_events: protocolForm.timeline_events.filter((_: any, i: number) => i !== idx),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Remove event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-slate-400">
                    No scheduled clinical events added yet. Click &quot;+ Add Clinical Event&quot; to schedule milestone scans, labs, or OPU/ET.
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProtocolModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> {editingProtocol ? 'Update Protocol & Rules' : 'Save Protocol & Rules'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT LIMS TEST TEMPLATE                                       */}
      {/* ========================================================================= */}
      {showLimsModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingLimsTest ? 'Edit LIMS Test Template' : 'Add LIMS Test Template'}
              </h3>
              <button onClick={() => setShowLimsModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveLimsTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Test Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Serum Anti-Müllerian Hormone (AMH)"
                  value={limsForm.test_name}
                  onChange={(e) => setLimsForm({ ...limsForm, test_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-AMH-02"
                    value={limsForm.test_code}
                    onChange={(e) => setLimsForm({ ...limsForm, test_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={limsForm.category}
                    onChange={(e) => setLimsForm({ ...limsForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Andrology">Andrology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Serology">Serology</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sample / Specimen</label>
                  <select
                    value={limsForm.sample_type}
                    onChange={(e) => setLimsForm({ ...limsForm, sample_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Serum">Serum</option>
                    <option value="Whole Blood">Whole Blood (EDTA)</option>
                    <option value="Plasma">Plasma</option>
                    <option value="Semen Ejaculate">Semen Ejaculate</option>
                    <option value="Urine Random">Urine Random</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">TAT (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    value={limsForm.tat_hours}
                    onChange={(e) => setLimsForm({ ...limsForm, tat_hours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Normal Reference Interval</label>
                <input
                  type="text"
                  placeholder="e.g. 1.50 - 4.00 ng/mL"
                  value={limsForm.ref_range}
                  onChange={(e) => setLimsForm({ ...limsForm, ref_range: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLimsModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingLimsTest ? 'Update Test' : 'Save Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CRYO TANK                                                */}
      {/* ========================================================================= */}
      {showCryoTankModal && (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCryoTank ? 'Edit Cryo Tank Storage' : 'Add Cryo Storage Tank'}
              </h3>
              <button onClick={() => setShowCryoTankModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCryoTank} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tank 1 — Main Autologous Embryo Bank"
                  value={cryoTankForm.tank_name}
                  onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tank Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TANK-01"
                    value={cryoTankForm.tank_code}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tank Specimen Type</label>
                  <select
                    value={cryoTankForm.tank_type}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, tank_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white"
                  >
                    <option value="Autologous Embryos">Autologous Embryos</option>
                    <option value="Autologous Gametes">Autologous Gametes (Sperm/Oocytes)</option>
                    <option value="Donor Gametes">Donor Gametes (Certified Bank)</option>
                    <option value="Quarantine / Infectious">Quarantine / Reactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Canister Count</label>
                  <input
                    type="number"
                    min="1"
                    value={cryoTankForm.canister_count}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, canister_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacity (Litres)</label>
                  <input
                    type="number"
                    min="1"
                    value={cryoTankForm.capacity_litres}
                    onChange={(e) => setCryoTankForm({ ...cryoTankForm, capacity_litres: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Physical Location / Room</label>
                <input
                  type="text"
                  placeholder="e.g. IVF Cleanroom Cryo Suite A"
                  value={cryoTankForm.location}
                  onChange={(e) => setCryoTankForm({ ...cryoTankForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCryoTankModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {editingCryoTank ? 'Update Tank' : 'Save Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </PageLayout>
  );
}
