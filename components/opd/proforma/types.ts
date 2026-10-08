export interface ObstetricRow {
  year: string;
  place: string;
  details: string;
  outcome: string;
  gestation: string;
  mode: string;
  babySexWeight: string;
}

export interface MedicationRow {
  drug: string;
  dose: string;
  duration: string;
  response: string;
}

export interface ClinicalHistoryProformaModalProps {
  patient: any;
  partner?: any;
  initialTab?: 'fertility' | 'gynaecology' | 'obstetric';
  initialType?: 'fertility' | 'gynaecology' | 'obstetric';
  initialData?: any;
  onClose?: () => void;
  onSaved?: () => void;
  onDataChange?: (data: any, summary: { complaints: string; history: string; exam: string; pastHistory: string }) => void;
  inline?: boolean;
}

export const toggleArrayItem = (list: string[], setList: (val: string[]) => void, item: string) => {
  if (list.includes(item)) {
    setList(list.filter((x) => x !== item));
  } else {
    setList([...list, item]);
  }
};
