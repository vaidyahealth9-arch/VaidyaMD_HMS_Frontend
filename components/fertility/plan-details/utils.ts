import { FollicleCohortStats, FollicleToken, PlanTimelineItem, TreatmentCycleRecord } from './types';

/**
 * Format dose string into standard Sparta style: `(1 X 175) IU` or `(1 X 0.25) mg`
 */
export function formatDoseDisplay(rawDose: string, quantity = 1): string {
  if (!rawDose || !rawDose.trim()) return '';
  const trimmed = rawDose.trim();

  // If already in (Qty X Dose) format
  if (/^\(\s*\d+\s*[xX]\s*[^)]+\)/.test(trimmed)) {
    return trimmed;
  }

  // Check if starts with a number
  const match = trimmed.match(/^([\d.]+)\s*([a-zA-Z/]+)?$/);
  if (match) {
    const val = match[1];
    const unit = match[2] || '';
    return `(${quantity} X ${val}) ${unit}`.trim();
  }

  return `(${quantity} X ${trimmed})`;
}

/**
 * Format scan folliculometry into Sparta's exact format:
 * `ET - 2; R-10; L -4;` or `ET-8.2 mm; R-22,22,22,22,22; L -17,17,17,17,17;`
 */
export function formatScanDetails(
  endometriumMm?: string | number,
  rightFollicles?: string,
  leftFollicles?: string
): string {
  const parts: string[] = [];

  if (endometriumMm !== undefined && endometriumMm !== '') {
    parts.push(`ET - ${endometriumMm}`);
  }
  if (rightFollicles && rightFollicles.trim()) {
    parts.push(`R-${rightFollicles.trim()}`);
  }
  if (leftFollicles && leftFollicles.trim()) {
    parts.push(`L -${leftFollicles.trim()}`);
  }

  return parts.length > 0 ? `${parts.join('; ')};` : '';
}

/**
 * Parse comma/space separated follicle measurements into categorized tokens
 */
export function parseFollicleTokens(follicleStr?: string): {
  tokens: FollicleToken[];
  matureCount: number;
  intermediateCount: number;
  smallCount: number;
} {
  if (!follicleStr) {
    return { tokens: [], matureCount: 0, intermediateCount: 0, smallCount: 0 };
  }
  const matches = follicleStr.match(/\d+(\.\d+)?/g);
  if (!matches) {
    return { tokens: [], matureCount: 0, intermediateCount: 0, smallCount: 0 };
  }

  const tokens = matches.map((m) => {
    const val = parseFloat(m);
    let category: 'mature' | 'intermediate' | 'small' = 'small';
    if (val >= 18) category = 'mature';
    else if (val >= 14) category = 'intermediate';
    return { mm: val, category };
  });

  return {
    tokens,
    matureCount: tokens.filter((t) => t.category === 'mature').length,
    intermediateCount: tokens.filter((t) => t.category === 'intermediate').length,
    smallCount: tokens.filter((t) => t.category === 'small').length,
  };
}

/**
 * Evaluate follicle cohort stats & OHSS safety across all days
 */
export function calculateFollicleStats(days: any[]): FollicleCohortStats {
  const recordedDays = (days || []).filter(
    (d) => d.right_follicles || d.left_follicles || d.endometrium_mm
  );
  const latestDay = recordedDays[recordedDays.length - 1];

  const maxE2 = Math.max(
    0,
    ...(days || []).map((d) => parseFloat(d.e2_pgml || '0')).filter((v) => !isNaN(v))
  );

  if (!latestDay) {
    return {
      hasData: false,
      totalCount: 0,
      matureCount: 0,
      intermediateCount: 0,
      smallCount: 0,
      leadFollicle: 0,
      triggerReady: false,
      peakE2: maxE2,
      isHighOhssRisk: maxE2 >= 3500,
      isModerateOhssRisk: maxE2 >= 2500 && maxE2 < 3500,
    };
  }

  const rParsed = parseFollicleTokens(latestDay.right_follicles);
  const lParsed = parseFollicleTokens(latestDay.left_follicles);

  const allTokens = [...rParsed.tokens, ...lParsed.tokens];
  const totalCount = allTokens.length;
  const matureCount = rParsed.matureCount + lParsed.matureCount;
  const intermediateCount = rParsed.intermediateCount + lParsed.intermediateCount;
  const smallCount = rParsed.smallCount + lParsed.smallCount;
  const leadFollicle = allTokens.length > 0 ? Math.max(...allTokens.map((t) => t.mm)) : 0;
  const triggerReady =
    matureCount >= 3 || (matureCount >= 1 && intermediateCount >= 2 && leadFollicle >= 18);

  const isHighOhssRisk = maxE2 >= 3500 || totalCount >= 18;
  const isModerateOhssRisk = !isHighOhssRisk && (maxE2 >= 2500 || totalCount >= 14);

  return {
    hasData: true,
    dayNumber: latestDay.day_number,
    totalCount,
    matureCount,
    intermediateCount,
    smallCount,
    leadFollicle,
    triggerReady,
    peakE2: maxE2,
    isHighOhssRisk,
    isModerateOhssRisk,
  };
}

const LUTEAL_DRUGS = [
  'duphaston',
  'dubagest',
  'gestone',
  'proluton',
  'susten',
  'progesterone',
  'crinone',
  'endometrin',
  'cyclogest',
  'lubion',
  'lutinus',
  'progynova',
  'estradiol valerate',
];

/**
 * Derive clinical phase: 'stimulation' (Amber) vs 'luteal' (Emerald)
 */
export function deriveItemPhase(
  dayNumber: number,
  itemName: string,
  category: string,
  explicitPhase?: 'stimulation' | 'luteal'
): 'stimulation' | 'luteal' {
  if (explicitPhase) return explicitPhase;
  const lower = (itemName || '').toLowerCase();
  if (LUTEAL_DRUGS.some((d) => lower.includes(d))) {
    return 'luteal';
  }
  if (dayNumber >= 13) {
    return 'luteal';
  }
  return 'stimulation';
}

export function isProcedureName(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase().trim();
  return (
    lower.includes('iui') ||
    lower.includes('insemination') ||
    lower.includes('opu') ||
    lower.includes('retrieval') ||
    lower.includes('collection') ||
    lower.includes('transfer') ||
    lower.includes('icsi') ||
    lower.includes('pesa') ||
    lower.includes('tesa') ||
    lower.includes('tese') ||
    lower.includes('aspiration') ||
    lower.includes('hysteroscopy') ||
    lower.includes('laparoscopy') ||
    lower.includes('biopsy') ||
    lower.includes('curettage') ||
    lower.includes('d&c') ||
    lower.includes('procedure')
  );
}

export function isScanName(name?: string | null): boolean {
  if (!name || typeof name !== 'string') return false;
  const lower = name.toLowerCase().trim();
  if (isProcedureName(lower)) return false;
  return (
    lower.includes('scan') ||
    lower.includes('ultrasound') ||
    lower.includes('tvs') ||
    lower.includes('follic') ||
    lower.includes('tracking') ||
    lower.includes('monitoring') ||
    lower.includes('endometrium')
  );
}

/**
 * Flatten multi-track DayData items into the Sparta row-by-row event ledger
 */
export function flattenDaysToTimelineItems(days: any[]): PlanTimelineItem[] {
  const items: PlanTimelineItem[] = [];

  (days || []).forEach((day, dayIdx) => {
    const dayNumber = day.day_number || dayIdx + 1;
    const stimDayNumber = day.stim_day_number || day.cycle_day_offset || dayNumber;
    const date = day.date || '';
    const displayDate = day.display_date || date;
    const dayOfWeek = day.day_of_week || '';

    // 1. Medications
    if (Array.isArray(day.medications) && day.medications.length > 0) {
      day.medications.forEach((med: any, medIdx: number) => {
        const drugName = med.drug_name || med.name || 'Prescribed Drug';
        items.push({
          id: med.id || `med-${dayNumber}-${medIdx}`,
          day_number: dayNumber,
          date,
          display_date: displayDate,
          day_of_week: dayOfWeek,
          stim_day_number: stimDayNumber,
          phase: deriveItemPhase(dayNumber, drugName, 'medication', med.phase),
          category: 'medication',
          name: drugName,
          dosage: med.dose || '',
          quantity: med.quantity || 1,
          dose_display: med.dose_display || formatDoseDisplay(med.dose || '', med.quantity || 1),
          frequency: med.frequency || 'OD',
          route: med.route || 'SC',
          status: med.status || 'planned',
          administered_at: med.administered_at,
          administered_by: med.administered_by,
          notes: med.instructions || med.notes,
        });
      });
    }

    // 2. Clinical Procedures first (OPU, ET, IUI, Cyst Aspiration, PESA/TESA, etc.)
    const procList: string[] = [];
    if (Array.isArray(day.procedures) && day.procedures.length > 0) {
      day.procedures.forEach((p: string) => {
        if (p && !procList.includes(p)) procList.push(p);
      });
    }
    if (day.milestone && isProcedureName(day.milestone) && !procList.includes(day.milestone)) {
      procList.push(day.milestone);
    }

    // 3. Scans & Folliculometry
    const hasScanData = Boolean(day.right_follicles || day.left_follicles || day.endometrium_mm);
    const scanNames: string[] = [];
    if (day.scans && Array.isArray(day.scans) && day.scans.length > 0) {
      day.scans.forEach((s: string) => {
        if (!s) return;
        // If s was mistakenly added to scans but is a procedure, route to procList instead
        if (isProcedureName(s) || procList.includes(s)) {
          if (!procList.includes(s)) procList.push(s);
          return;
        }
        if (!scanNames.includes(s)) scanNames.push(s);
      });
    }

    if (scanNames.length === 0 && hasScanData) {
      const defaultScanName =
        day.milestone && isScanName(day.milestone) && !isProcedureName(day.milestone)
          ? day.milestone
          : day.milestone && day.milestone.includes('Baseline')
          ? 'Baseline Scan'
          : 'Follicle Tracking';
      scanNames.push(defaultScanName);
    }

    // Only push milestone to scanNames if it is genuinely a scan and NOT a procedure
    if (
      day.milestone &&
      isScanName(day.milestone) &&
      !isProcedureName(day.milestone) &&
      !procList.includes(day.milestone) &&
      !scanNames.includes(day.milestone)
    ) {
      scanNames.push(day.milestone);
    }

    scanNames.forEach((scanName, sIdx) => {
      items.push({
        id: `scan-${dayNumber}-${sIdx}`,
        day_number: dayNumber,
        date,
        display_date: displayDate,
        day_of_week: dayOfWeek,
        stim_day_number: stimDayNumber,
        phase: deriveItemPhase(dayNumber, scanName, 'scan'),
        category: 'scan',
        name: scanName,
        status: 'planned',
        scan_details: formatScanDetails(day.endometrium_mm, day.right_follicles, day.left_follicles),
        endometrium_mm: day.endometrium_mm,
        endometrial_pattern: day.endometrial_pattern,
        right_follicles: day.right_follicles,
        left_follicles: day.left_follicles,
        notes: day.notes,
      });
    });

    // 4. Lab Investigations (LH, E2, P4, CBP, LFT)
    const invList: { name: string; val?: string }[] = [];
    if (day.lh_miu || (day.investigations && day.investigations.includes('Luteinising Hormone (LH)'))) {
      invList.push({ name: 'Luteinising Hormone (LH)', val: day.lh_miu });
    }
    if (day.e2_pgml || (day.investigations && day.investigations.includes('Estradiol (E2)'))) {
      invList.push({ name: 'Estradiol (E2)', val: day.e2_pgml });
    }
    if (day.p4_ngml || (day.investigations && day.investigations.includes('Progesterone (P4)'))) {
      invList.push({ name: 'Progesterone (P4)', val: day.p4_ngml });
    }

    // Other investigations in array
    if (Array.isArray(day.investigations)) {
      day.investigations.forEach((inv: string) => {
        if (!invList.some((x) => x.name.toLowerCase() === inv.toLowerCase())) {
          invList.push({ name: inv });
        }
      });
    }

    invList.forEach((inv, iIdx) => {
      items.push({
        id: `lab-${dayNumber}-${iIdx}`,
        day_number: dayNumber,
        date,
        display_date: displayDate,
        day_of_week: dayOfWeek,
        stim_day_number: stimDayNumber,
        phase: deriveItemPhase(dayNumber, inv.name, 'lab'),
        category: 'lab',
        name: inv.name,
        dosage: inv.val ? `${inv.val}` : undefined,
        status: 'planned',
        lab_result: inv.val,
      });
    });

    // 5. Clinical Procedures
    procList.forEach((procName, pIdx) => {
      items.push({
        id: `proc-${dayNumber}-${pIdx}`,
        day_number: dayNumber,
        date,
        display_date: displayDate,
        day_of_week: dayOfWeek,
        stim_day_number: stimDayNumber,
        phase: deriveItemPhase(dayNumber, procName, 'procedure'),
        category: 'procedure',
        name: procName,
        status: 'planned',
        notes: day.notes,
      });
    });
  });

  return items;
}

/**
 * Unflatten PlanTimelineItem[] back into DayData[] for persistence
 */
export function unflattenTimelineItemsToDays(items: PlanTimelineItem[], existingDays: any[] = []): any[] {
  const daysMap = new Map<number, any>();

  // Seed with existing days if present
  existingDays.forEach((d) => {
    daysMap.set(d.day_number, {
      ...d,
      medications: Array.isArray(d.medications) ? [...d.medications] : [],
      scans: Array.isArray(d.scans) ? [...d.scans] : [],
      investigations: Array.isArray(d.investigations) ? [...d.investigations] : [],
      procedures: Array.isArray(d.procedures) ? [...d.procedures] : [],
    });
  });

  items.forEach((item) => {
    const dayNum = item.day_number;
    let day = daysMap.get(dayNum);
    if (!day) {
      day = {
        day_number: dayNum,
        stim_day_number: item.stim_day_number,
        cycle_day_offset: item.stim_day_number,
        date: item.date,
        display_date: item.display_date,
        day_of_week: item.day_of_week,
        medications: [],
        scans: [],
        investigations: [],
        procedures: [],
      };
      daysMap.set(dayNum, day);
    }

    if (item.category === 'medication') {
      const existingMedIdx = day.medications.findIndex(
        (m: any) => m.drug_name === item.name || (item.id && m.id === item.id)
      );
      const medObj = {
        id: item.id,
        drug_name: item.name,
        dose: item.dosage || '',
        quantity: item.quantity || 1,
        frequency: item.frequency || 'OD',
        route: item.route || 'SC',
        status: item.status,
      };
      if (existingMedIdx >= 0) {
        day.medications[existingMedIdx] = medObj;
      } else {
        day.medications.push(medObj);
      }
    } else if (item.category === 'scan') {
      // Do not store procedure names into day.scans
      if (!isProcedureName(item.name)) {
        if (item.scan_details) {
          const etMatch = item.scan_details.match(/ET\s*[-:]\s*([0-9.]+)/i);
          if (etMatch) day.endometrium_mm = etMatch[1];
          const rMatch = item.scan_details.match(/R\s*[-:]\s*([^;]+)/i);
          if (rMatch) day.right_follicles = rMatch[1].trim();
          const lMatch = item.scan_details.match(/L\s*[-:]\s*([^;]+)/i);
          if (lMatch) day.left_follicles = lMatch[1].trim();
        }
        if (item.endometrium_mm) day.endometrium_mm = item.endometrium_mm;
        if (item.right_follicles) day.right_follicles = item.right_follicles;
        if (item.left_follicles) day.left_follicles = item.left_follicles;
        if (!day.scans) day.scans = [];
        if (!day.scans.includes(item.name)) day.scans.push(item.name);
      }
    } else if (item.category === 'lab') {
      if (item.dosage || item.lab_result) {
        const val = item.dosage || item.lab_result;
        if (item.name.toLowerCase().includes('lh')) day.lh_miu = val;
        else if (item.name.toLowerCase().includes('e2') || item.name.toLowerCase().includes('estradiol')) day.e2_pgml = val;
        else if (item.name.toLowerCase().includes('p4') || item.name.toLowerCase().includes('progesterone')) day.p4_ngml = val;
      }
      if (!day.investigations) day.investigations = [];
      if (!day.investigations.includes(item.name)) day.investigations.push(item.name);
    } else if (item.category === 'procedure') {
      if (!day.procedures) day.procedures = [];
      if (!day.procedures.includes(item.name)) day.procedures.push(item.name);
      if (!day.milestone) day.milestone = item.name;
      // Purge from scans if it was previously saved into scans
      if (Array.isArray(day.scans)) {
        day.scans = day.scans.filter((s: string) => s !== item.name && !isProcedureName(s));
      }
    }
  });

  return Array.from(daysMap.values()).sort((a, b) => a.day_number - b.day_number);
}

export function createEmptyDraftCycle(patientId: string, attemptNumber: number = 1): TreatmentCycleRecord {
  return {
    id: '',
    cycle_id: `CYCLE-${new Date().getFullYear()}-${String(attemptNumber).padStart(3, '0')}`,
    patient_id: patientId,
    treatment_type: '',
    attempt_number: attemptNumber,
    status: 'planned',
    start_date: '',
    created_at: new Date().toISOString(),
    sentinel_dates: {},
    female_factors: [],
    male_factors: [],
    gametes_source: {
      oocyte: 'self',
      sperm: 'partner',
    },
    pgs_pgd_data: {
      indicated: false,
      embryos: [],
    },
    endometrial_monitoring: [],
    medication_calendar: [],
    remarks: '',
  };
}

export function generateDaysFromProtocol(
  proto: any,
  startDateStr?: string,
  totalDays: number = 14
): any[] {
  if (!proto) return [];
  const baseDate = new Date(startDateStr || new Date().toISOString().split('T')[0]);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const days: any[] = [];
  const duration = Math.max(totalDays, 14);

  for (let dayNum = 1; dayNum <= duration; dayNum++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + (dayNum - 1));
    const dayOfWeek = weekdays[d.getDay()];
    const displayDate = `${String(d.getDate()).padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
    const isoDate = d.toISOString().split('T')[0];

    const medications: any[] = [];
    if (proto.rules && Array.isArray(proto.rules)) {
      proto.rules.forEach((rule: any) => {
        const start = rule.day_start_offset || 1;
        const end = rule.day_end_offset || duration;
        if (dayNum >= start && dayNum <= end) {
          medications.push({
            drug_name: rule.drug_name,
            dose: rule.dose,
            dose_display: `(1 X ${rule.dose})`,
            frequency: rule.frequency || 'OD',
            status: 'planned',
            instructions: rule.instructions || '',
          });
        }
      });
    }

    const scans: string[] = [];
    const investigations: string[] = [];
    const procedures: string[] = [];
    let milestone: string | undefined = undefined;
    let notes = '';

    // Check if timeline_events defined in protocol from Master Settings
    if (proto.timeline_events && Array.isArray(proto.timeline_events) && proto.timeline_events.length > 0) {
      proto.timeline_events.forEach((ev: any) => {
        const evOffset = parseInt(ev.day_offset) || 1;
        if (evOffset === dayNum) {
          if (ev.type === 'scan') {
            scans.push(ev.title);
            if (!milestone) milestone = ev.title;
          } else if (ev.type === 'investigation' || ev.type === 'lab') {
            investigations.push(ev.title);
          } else if (ev.type === 'procedure') {
            procedures.push(ev.title);
            if (!milestone) milestone = ev.title;
          }
          if (ev.instructions) {
            notes = notes ? `${notes}; ${ev.instructions}` : ev.instructions;
          }
        }
      });
    } else {
      // Default clinical checkpoints if no timeline events in template
      if (dayNum === 1 || dayNum === 2) {
        scans.push('Baseline TVS Scan');
        milestone = 'Baseline Follicular Scan';
        notes = 'Baseline antral follicle count & endometrial receptivity';
      } else if (dayNum === 6 || dayNum === 8 || dayNum === 10) {
        scans.push(`Follicular Scan Day ${dayNum}`);
        milestone = `Follicular Tracking (Day ${dayNum})`;
      } else if (dayNum === 12) {
        milestone = 'Trigger Checkpoint (hCG / Agonist)';
      } else if (dayNum === 14) {
        procedures.push('Oocyte Pick-Up (OPU / Egg Retrieval)');
        milestone = 'Oocyte Pick-Up (OPU / Egg Retrieval)';
      }
    }

    days.push({
      day_number: dayNum,
      stim_day_number: dayNum,
      date: isoDate,
      display_date: displayDate,
      day_of_week: dayOfWeek,
      medications,
      scans,
      investigations,
      procedures,
      milestone,
      notes,
      endometrium_mm: dayNum <= 2 ? '4.0' : dayNum === 8 ? '8.0' : dayNum >= 12 ? '9.5' : undefined,
      right_follicles: dayNum >= 6 ? '12, 14, 15' : undefined,
      left_follicles: dayNum >= 6 ? '11, 13, 14' : undefined,
    });
  }

  return days;
}


