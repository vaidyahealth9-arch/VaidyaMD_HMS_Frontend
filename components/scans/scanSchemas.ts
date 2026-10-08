// Unified Scan & Diagnostic Schemas Definitions for Female Scans & Male Andrology
export interface ScanSchemaOption {
  value: string;
  label: string;
  shortLabel: string;
  category: 'female' | 'male';
  aliases?: string[];
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export const FEMALE_SCAN_OPTIONS: ScanSchemaOption[] = [
  {
    value: 'follicular_scan',
    label: 'Baseline & Serial Follicular Tracking Scan',
    shortLabel: 'Follicular Scan',
    category: 'female',
    badgeColor: 'text-sky-700',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
  },
  {
    value: 'sonohysterogram',
    label: 'Saline Infusion Sonohysterography (SIS)',
    shortLabel: 'SIS Cavity Scan',
    category: 'female',
    aliases: ['sis'],
    badgeColor: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
  },
  {
    value: 'endometrial_assessment',
    label: 'Endometrial Receptivity & Doppler Scan',
    shortLabel: 'Endometrial TVS',
    category: 'female',
    badgeColor: 'text-teal-700',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
  },
  {
    value: 'early_pregnancy_scan',
    label: 'Early Pregnancy Viability USG Scan (6-10 Weeks)',
    shortLabel: 'Early Pregnancy',
    category: 'female',
    badgeColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
  },
  {
    value: 'pelvic_organ_usg',
    label: 'Comprehensive Pelvic Organ Ultrasound (TVS / TAS)',
    shortLabel: 'Pelvic TVS / TAS',
    category: 'female',
    aliases: ['pelvic_usg'],
    badgeColor: 'text-fuchsia-700',
    badgeBg: 'bg-fuchsia-50',
    badgeBorder: 'border-fuchsia-200',
  },
];

export const MALE_SCAN_OPTIONS: ScanSchemaOption[] = [
  {
    value: 'casa_semen_analysis',
    label: 'CASA Semen Analysis Report (WHO 6th Edition)',
    shortLabel: 'CASA Semen',
    category: 'male',
    aliases: ['semen_analysis_casa', 'routine_semen_analysis'],
    badgeColor: 'text-blue-700',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
  },
  {
    value: 'sperm_dfi',
    label: 'Sperm DNA Fragmentation Index (DFI)',
    shortLabel: 'Sperm DFI',
    category: 'male',
    badgeColor: 'text-cyan-700',
    badgeBg: 'bg-cyan-50',
    badgeBorder: 'border-cyan-200',
  },
  {
    value: 'sperm_preparation',
    label: 'Sperm Preparation (Pre/Post Wash Optimization)',
    shortLabel: 'Sperm Prep',
    category: 'male',
    badgeColor: 'text-indigo-700',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
  },
  {
    value: 'semen_freezing',
    label: 'Semen Cryopreservation & Freezing Log',
    shortLabel: 'Semen Freezing',
    category: 'male',
    badgeColor: 'text-teal-700',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
  },
  {
    value: 'surgical_sperm_retrieval',
    label: 'Surgical Sperm Retrieval (TESA / PESA / Micro-TESE)',
    shortLabel: 'Surgical Retrieval',
    category: 'male',
    badgeColor: 'text-purple-700',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
  },
];

export const ALL_SCAN_OPTIONS: ScanSchemaOption[] = [
  ...FEMALE_SCAN_OPTIONS,
  ...MALE_SCAN_OPTIONS,
];

// Backwards-compatible export
export const SCAN_SCHEMA_OPTIONS = ALL_SCAN_OPTIONS;

/**
 * Normalizes schema types accounting for legacy names or aliases
 */
export const normalizeScanType = (schemaType?: string): string => {
  if (!schemaType) return '';
  const s = schemaType.toLowerCase().trim();
  if (s === 'sis') return 'sonohysterogram';
  if (s === 'pelvic_usg') return 'pelvic_organ_usg';
  if (s === 'semen_analysis_casa') return 'casa_semen_analysis';
  return s;
};

/**
 * Checks if a given schema/record is male diagnostics
 */
export const isMaleScanType = (schemaType?: string): boolean => {
  const norm = normalizeScanType(schemaType);
  return [
    'casa_semen_analysis',
    'sperm_dfi',
    'sperm_preparation',
    'semen_freezing',
    'surgical_sperm_retrieval',
  ].includes(norm);
};

export const getScanSchemaInfo = (schemaType?: string): ScanSchemaOption => {
  const norm = normalizeScanType(schemaType);
  const found = ALL_SCAN_OPTIONS.find(
    (s) => s.value === norm || s.value === schemaType || s.aliases?.includes(schemaType || '')
  );
  if (found) return found;

  const isMale = isMaleScanType(schemaType);
  return {
    value: schemaType || 'custom_scan',
    label: (schemaType || 'Diagnostic Scan').replace(/_/g, ' ').toUpperCase(),
    shortLabel: (schemaType || 'Scan').replace(/_/g, ' '),
    category: isMale ? 'male' : 'female',
    badgeColor: isMale ? 'text-blue-700' : 'text-slate-700',
    badgeBg: isMale ? 'bg-blue-50' : 'bg-slate-100',
    badgeBorder: isMale ? 'border-blue-200' : 'border-slate-200',
  };
};

export const getScanKeyHighlights = (rec: any): { label: string; value: string }[] => {
  const d = rec?.data || {};
  const schema = normalizeScanType(rec?.schema_type || rec?.record_type || '');
  const highlights: { label: string; value: string }[] = [];

  // Female Ultrasound Highlights
  if (schema === 'follicular_scan') {
    const et = d.uterine_lining || d.endometrial_thickness || d.endometrium_thickness_mm || d.endometrium;
    if (et) {
      highlights.push({ label: 'Endometrium', value: `${et} mm` });
    }
    const r = d.follicles_right || d.follicle_sizes_right || (d.right_ovary_lead_follicle_mm ? `${d.right_ovary_lead_follicle_mm} mm` : null);
    if (r) {
      highlights.push({ label: 'Right', value: String(r).length > 12 ? `${String(r).slice(0, 10)}...` : String(r) });
    }
    const l = d.follicles_left || d.follicle_sizes_left || (d.left_ovary_lead_follicle_mm ? `${d.left_ovary_lead_follicle_mm} mm` : null);
    if (l) {
      highlights.push({ label: 'Left', value: String(l).length > 12 ? `${String(l).slice(0, 10)}...` : String(l) });
    }
    if ((d.afc_right !== undefined && d.afc_right !== '') || (d.afc_left !== undefined && d.afc_left !== '')) {
      highlights.push({ label: 'AFC', value: `R:${d.afc_right || 0} L:${d.afc_left || 0}` });
    } else if (d.antral_follicle_count_afc || d.afc) {
      highlights.push({ label: 'AFC', value: String(d.antral_follicle_count_afc || d.afc) });
    }
    if (d.cycle_day) {
      highlights.push({ label: 'Day', value: `CD ${d.cycle_day}` });
    }
  } else if (schema === 'sonohysterogram') {
    if (d.cavity_contour) {
      highlights.push({ label: 'Contour', value: String(d.cavity_contour) });
    }
    if (d.right_tubal_spill) {
      highlights.push({ label: 'Right Spill', value: String(d.right_tubal_spill) });
    }
    if (d.left_tubal_spill) {
      highlights.push({ label: 'Left Spill', value: String(d.left_tubal_spill) });
    }
  } else if (schema === 'endometrial_assessment') {
    if (d.endometrial_thickness_mm) {
      highlights.push({ label: 'Lining', value: `${d.endometrial_thickness_mm} mm` });
    }
    if (d.endometrial_pattern) {
      highlights.push({ label: 'Pattern', value: String(d.endometrial_pattern) });
    }
    if (d.subendometrial_vascularity_zone) {
      highlights.push({ label: 'Vascularity', value: String(d.subendometrial_vascularity_zone) });
    }
  } else if (schema === 'early_pregnancy_scan') {
    if (d.gestational_age_weeks_days) {
      highlights.push({ label: 'GA', value: String(d.gestational_age_weeks_days) });
    }
    if (d.fetal_heart_rate_bpm) {
      highlights.push({ label: 'FHR', value: `${d.fetal_heart_rate_bpm} bpm` });
    }
    if (d.crown_rump_length_mm) {
      highlights.push({ label: 'CRL', value: `${d.crown_rump_length_mm} mm` });
    }
  } else if (schema === 'pelvic_organ_usg') {
    if (d.uterus_length_mm && d.uterus_width_mm) {
      highlights.push({ label: 'Uterus', value: `${d.uterus_length_mm}×${d.uterus_width_mm} mm` });
    }
    if (d.endometrial_thickness_mm) {
      highlights.push({ label: 'ET', value: `${d.endometrial_thickness_mm} mm` });
    }
  }

  // Male Diagnostics Highlights
  else if (schema === 'casa_semen_analysis') {
    if (d.sperm_concentration_mil_ml || d.sperm_count_mil_ml) {
      highlights.push({ label: 'Count', value: `${d.sperm_concentration_mil_ml || d.sperm_count_mil_ml} M/mL` });
    }
    if (d.total_motility || d.progressive_motility) {
      highlights.push({ label: 'Prog Motility', value: `${d.progressive_motility || d.total_motility}%` });
    }
    if (d.normal_morphology || d.normal_forms) {
      highlights.push({ label: 'Normal Morph', value: `${d.normal_morphology || d.normal_forms}%` });
    }
    if (d.semen_volume) {
      highlights.push({ label: 'Vol', value: `${d.semen_volume} mL` });
    }
  } else if (schema === 'sperm_dfi') {
    if (d.dfi_percentage !== undefined) {
      highlights.push({ label: 'DFI', value: `${d.dfi_percentage}%` });
    }
    if (d.hds_percentage !== undefined) {
      highlights.push({ label: 'HDS', value: `${d.hds_percentage}%` });
    }
    if (d.dna_integrity_grade) {
      highlights.push({ label: 'Grade', value: String(d.dna_integrity_grade) });
    }
  } else if (schema === 'sperm_preparation') {
    if (d.post_wash_count_mil_ml) {
      highlights.push({ label: 'Post-Wash Count', value: `${d.post_wash_count_mil_ml} M/mL` });
    }
    if (d.post_wash_motility) {
      highlights.push({ label: 'Post-Wash Mot', value: `${d.post_wash_motility}%` });
    }
    if (d.preparation_method) {
      highlights.push({ label: 'Method', value: String(d.preparation_method) });
    }
  } else if (schema === 'semen_freezing') {
    if (d.straws_frozen || d.vials_frozen) {
      highlights.push({ label: 'Straws Frozen', value: String(d.straws_frozen || d.vials_frozen) });
    }
    if (d.tank_id && d.canister_id) {
      highlights.push({ label: 'Storage', value: `Tank ${d.tank_id} / Can ${d.canister_id}` });
    }
  } else if (schema === 'surgical_sperm_retrieval') {
    if (d.procedure_type) {
      highlights.push({ label: 'Procedure', value: String(d.procedure_type) });
    }
    if (d.sperm_retrieval_outcome) {
      highlights.push({ label: 'Outcome', value: String(d.sperm_retrieval_outcome) });
    }
  }

  // Fallback if no specific fields matched
  if (highlights.length === 0) {
    const keys = Object.keys(d).filter(
      (k) => !['scan_date', 'date_of_scan', 'clinical_history', 'remarks', 'cycle_day'].includes(k)
    );
    for (const k of keys.slice(0, 3)) {
      if (d[k] && typeof d[k] !== 'object') {
        highlights.push({ label: k.replace(/_/g, ' '), value: String(d[k]) });
      }
    }
  }

  return highlights;
};
