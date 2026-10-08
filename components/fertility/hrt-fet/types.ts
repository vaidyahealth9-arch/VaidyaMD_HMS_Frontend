export interface HrtFetRowData {
  cycle_day: number;
  day_number?: number;
  date: string;
  display_date: string;
  day_of_week: string;
  estrogen_day: number | null;
  phase: string;
  medication: string;
  dose: string;
  unit: string;
  route: string;
  frequency: string;
  timing: string;
  monitoring_criteria: string;
  result_value: string;
  embryo_stage: string;
  notes: string;
}

export interface HrtFetProtocolSheetProps {
  cycleId?: string;
  startDate?: string;
  initialDays?: any[];
  sentinelDates?: Record<string, any>;
  readonly?: boolean;
  onCalendarSaved?: (days: any[]) => void;
}

export interface MedModalState {
  open: boolean;
  cycleDay: number;
  medication: string;
  dose: string;
  unit: string;
  route: string;
  frequency: string;
  timing: string;
  applyFromDay: number;
  applyToDay: number;
}

export interface CalculatedDates {
  bleedDate: string;
  d12Assessment: string;
  p0Date: string;
  transferDate: string;
  betaHcgDate: string;
}
