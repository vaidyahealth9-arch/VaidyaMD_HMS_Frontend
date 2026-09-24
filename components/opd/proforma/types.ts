export interface ClinicalHistoryProformaModalProps {
  patient: any;
  partner?: any;
  onClose?: () => void;
  onSaved?: () => void;
  initialType?: 'fertility' | 'gynaecology' | 'obstetric';
  inline?: boolean;
  onDataChange?: (
    data: any,
    summary: { complaints: string; history: string; exam: string; pastHistory: string }
  ) => void;
  initialData?: any;
}

export interface ObstetricRow {
  year: string;
  place: string;
  details: string;
  outcome: string;
  gestation?: string;
  mode?: string;
  babySexWeight?: string;
}

export interface MedicationRow {
  drug: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  instructions: string;
}
