import {
  FileText,
  Activity,
  ClipboardList,
  Pill,
  Calendar,
  Layers,
} from 'lucide-react';

// Canonical VaidyaMD System Roles List
export const VAIDYAMD_ROLES = [
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
export const menuKeys = [
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

export const getDefaultPermissionsForRole = (roleId: string): Record<string, boolean> => ({
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

export const findProfileForRole = (roleId: string, profileList: any[]) => {
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

export const parseSchemaToFields = (schemaObj: any) => {
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

export const buildSchemaFromFields = (fields: Array<{ id: string; label: string; type: string; placeholder?: string; options?: string; required?: boolean }>) => {
  return fields.map((f, idx) => ({
    id: f.id || (f.label ? f.label.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : `field_${idx + 1}`),
    label: f.label || `Field ${idx + 1}`,
    type: f.type || 'text',
    placeholder: f.placeholder || undefined,
    options: ['select', 'checkbox_group'].includes(f.type) && f.options ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
    required: !!f.required,
  }));
};

// ==========================================
// CLINICAL DEPARTMENTS FOR DOCTORS & STAFF
// ==========================================
export interface ClinicalDepartmentOption {
  id: string;
  name: string;
  short: string;
  desc: string;
  iconName?: string;
  defaultForDoctor?: boolean;
}

export const CLINICAL_DEPARTMENTS: ClinicalDepartmentOption[] = [
  {
    id: 'fertility',
    name: 'Reproductive Medicine & Infertility',
    short: 'Fertility / IVF',
    desc: 'IVF, ICSI, IUI, OPU, Embryo Transfer & Stimulation protocols',
    defaultForDoctor: true,
  },
  {
    id: 'opd',
    name: 'Outpatient Department (OPD)',
    short: 'OPD Clinic',
    desc: 'General clinical consults, triage, prescription & review',
    defaultForDoctor: true,
  },
  {
    id: 'obg',
    name: 'Obstetrics & Gynaecology (OBG)',
    short: 'OBG',
    desc: 'Antenatal care, high-risk pregnancy, routine gynecology',
  },
  {
    id: 'andrology',
    name: 'Andrology & Male Reproductive Health',
    short: 'Andrology',
    desc: 'Male factor infertility, CASA semen analysis, TESA/PESA, varicocele',
  },
  {
    id: 'cosgyn',
    name: 'Cosmetic & Regenerative Gynaecology',
    short: 'Cosmetic Gyn',
    desc: 'PRP, laser rejuvenation, labiaplasty, vaginal tightening',
  },
  {
    id: 'fetal_medicine',
    name: 'Ultrasonography & Fetal Medicine',
    short: 'Sonography / USG',
    desc: 'Follicular tracking, 3D/4D TVS scans, NT scans, Doppler',
  },
  {
    id: 'laparoscopy',
    name: 'Minimally Invasive & Laparoscopic Surgery',
    short: 'Laparoscopy / OT',
    desc: 'Diagnostic hysteroscopy, laparoscopy, cystectomy, myomectomy',
  },
  {
    id: 'ipd',
    name: 'Inpatient Department (IPD)',
    short: 'Inpatient / Ward',
    desc: 'Daycare admissions, post-op observation, recovery ward care',
  },
  {
    id: 'ivf_lab',
    name: 'Embryology & IVF Laboratory',
    short: 'IVF Lab',
    desc: 'Embryology culture, vitrification, micromanipulation',
  },
  {
    id: 'counseling',
    name: 'Psychological & ART Counseling',
    short: 'Counseling',
    desc: 'Pre-ART psychological counseling, couple consent walkthroughs',
  },
];


