export interface EditableSessionItem {
  id: string;
  equipment: string;
  session_number: number;
  date: string;
  time: string;
  duration_mins: number;
  notes?: string;
}

export interface CustomCosgynServiceItem {
  id: string;
  name: string;
  sessions: number;
  unitPrice: number;
  duration_mins: number;
  startDate: string;
  time: string;
  frequency: string;
}
