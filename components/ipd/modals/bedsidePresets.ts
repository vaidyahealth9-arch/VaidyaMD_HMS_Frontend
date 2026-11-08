export interface PresetItem {
  name: string;
  item_type: string;
  category: string;
  service_code: string;
  unit_price: number;
}

export const PRESET_ITEMS: PresetItem[] = [
  {
    name: 'Oxygen Inhalation Therapy (per hour)',
    item_type: 'equipment',
    category: 'Oxygen & Gas',
    service_code: 'MED-O2-HR',
    unit_price: 150,
  },
  {
    name: 'IV Cannulation & Infusion Set Consumables',
    item_type: 'pharmacy_surgical',
    category: 'Surgical Consumables',
    service_code: 'SURG-IV-CAN',
    unit_price: 220,
  },
  {
    name: 'Sterile Surgical Wound Dressing (Large)',
    item_type: 'procedure_ot',
    category: 'Procedures',
    service_code: 'PROC-DRESS-LG',
    unit_price: 350,
  },
  {
    name: 'Foley Catheterization Insertion & Bag',
    item_type: 'procedure_ot',
    category: 'Procedures',
    service_code: 'PROC-CATH-INS',
    unit_price: 450,
  },
  {
    name: 'Therapeutic Diabetic Diet Meal (Ad-hoc)',
    item_type: 'diet',
    category: 'Diet & Nutrition',
    service_code: 'DIET-MEAL-SP',
    unit_price: 180,
  },
  {
    name: 'Nebulization Treatment Kit & Solution',
    item_type: 'pharmacy_medication',
    category: 'Medication',
    service_code: 'MED-NEB-KIT',
    unit_price: 250,
  },
  {
    name: 'Surgical Disposable Gloves & Syringes Pack',
    item_type: 'pharmacy_surgical',
    category: 'Surgical Consumables',
    service_code: 'SURG-GLV-SYR',
    unit_price: 160,
  },
  {
    name: 'Continuous Multi-Para Cardiac Monitoring (24h)',
    item_type: 'equipment',
    category: 'Equipment',
    service_code: 'EQP-MONITOR-24H',
    unit_price: 600,
  },
];
