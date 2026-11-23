'use client';

import React from 'react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Pill } from 'lucide-react';
import CoupleInvestigationsBlock from './CoupleInvestigationsBlock';
import CoupleMedicationColumn from './CoupleMedicationColumn';

export interface CoupleMedRow {
  drug_name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface CouplePrescriptionManagerProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  register: UseFormRegister<any>;
  femaleName?: string;
  maleName?: string;
  medicineDirectory?: any[];
  medicineStockMap?: Map<string, any>;
}

export default function CouplePrescriptionManager({
  watch,
  setValue,
  femaleName = 'Female (Wife)',
  maleName = 'Male (Partner)',
}: CouplePrescriptionManagerProps) {
  // Watch couple investigations
  const femaleInv = watch('female_investigations') || watch('investigations_to_be_advised') || '';
  const maleInv = watch('male_investigations') || '';

  // Watch couple medications
  const proforma = watch('clinical_proforma') || {};
  const femaleMeds: CoupleMedRow[] = watch('female_medications')?.length
    ? watch('female_medications')
    : proforma.femaleMedications || [];
  const maleMeds: CoupleMedRow[] = watch('male_medications')?.length
    ? watch('male_medications')
    : proforma.maleMedications || [];

  const handleUpdateFemaleMeds = (newMeds: CoupleMedRow[]) => {
    setValue('female_medications', newMeds);
    setValue('clinical_proforma', {
      ...proforma,
      femaleMedications: newMeds.map((m) => ({
        drug: m.drug_name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
    });
  };

  const handleUpdateMaleMeds = (newMeds: CoupleMedRow[]) => {
    setValue('male_medications', newMeds);
    setValue('clinical_proforma', {
      ...proforma,
      maleMedications: newMeds.map((m) => ({
        drug: m.drug_name,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      })),
    });
  };

  const handleAddMed = (partner: 'female' | 'male') => {
    if (partner === 'female') {
      handleUpdateFemaleMeds([
        ...femaleMeds,
        { drug_name: '', dose: '1 tab', frequency: '1-0-1', duration: '5 days', instructions: 'After food' },
      ]);
    } else {
      handleUpdateMaleMeds([
        ...maleMeds,
        { drug_name: '', dose: '1 tab', frequency: '1-0-1', duration: '30 days', instructions: 'After food' },
      ]);
    }
  };

  const handleRemoveMed = (partner: 'female' | 'male', index: number) => {
    if (partner === 'female') {
      const next = [...femaleMeds];
      next.splice(index, 1);
      handleUpdateFemaleMeds(next);
    } else {
      const next = [...maleMeds];
      next.splice(index, 1);
      handleUpdateMaleMeds(next);
    }
  };

  const handleMedChange = (
    partner: 'female' | 'male',
    index: number,
    field: keyof CoupleMedRow,
    value: string
  ) => {
    if (partner === 'female') {
      const next = [...femaleMeds];
      next[index] = { ...next[index], [field]: value };
      handleUpdateFemaleMeds(next);
    } else {
      const next = [...maleMeds];
      next[index] = { ...next[index], [field]: value };
      handleUpdateMaleMeds(next);
    }
  };

  return (
    <div className="space-y-4 pt-1">
      {/* 1. SEPARATE 2-COLUMN INVESTIGATIONS (Female on Left, Male on Right) */}
      <CoupleInvestigationsBlock
        femaleInv={femaleInv}
        maleInv={maleInv}
        setValue={setValue}
        femaleName={femaleName}
        maleName={maleName}
      />

      {/* 2. SEPARATE 2-COLUMN MEDICINE PRESCRIPTION (Female on Left, Male on Right) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Couple Prescriptions (Separate Female &amp; Male Columns)
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Prescribe medications for both partners side-by-side with inventory search dropdown &amp; custom text
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* LEFT COLUMN: FEMALE PRESCRIPTIONS */}
          <CoupleMedicationColumn
            partner="female"
            partnerName={femaleName}
            meds={femaleMeds}
            onAddMed={handleAddMed}
            onRemoveMed={handleRemoveMed}
            onMedChange={handleMedChange}
          />

          {/* RIGHT COLUMN: MALE PRESCRIPTIONS */}
          <CoupleMedicationColumn
            partner="male"
            partnerName={maleName}
            meds={maleMeds}
            onAddMed={handleAddMed}
            onRemoveMed={handleRemoveMed}
            onMedChange={handleMedChange}
          />
        </div>
      </div>
    </div>
  );
}
