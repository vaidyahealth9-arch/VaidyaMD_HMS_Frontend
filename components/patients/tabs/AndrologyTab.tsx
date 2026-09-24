'use client';

import React from 'react';
import AndrologyDataEntry from '@/components/fertility/AndrologyDataEntry';

interface AndrologyTabProps {
  patient: any;
  partner?: any;
  malePartner?: any;
  onOpenSpermPrepModal: () => void;
  onOpenSpermFreezingModal: () => void;
}

export default function AndrologyTab({
  patient,
  partner,
  malePartner: propMalePartner,
  onOpenSpermPrepModal,
  onOpenSpermFreezingModal,
}: AndrologyTabProps) {
  const malePartner = propMalePartner || partner;
  const targetId = malePartner?.id || patient.id;
  const targetName = malePartner?.name || patient.name;

  return (
    <div className="space-y-6 w-full">
      <AndrologyDataEntry patientId={targetId} patientName={targetName} />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onOpenSpermPrepModal}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20 rounded-md font-bold text-xs transition-colors"
        >
          + Semen Wash &amp; IUI
        </button>
        <button
          type="button"
          onClick={onOpenSpermFreezingModal}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary-mid border border-primary/20 rounded-md font-bold text-xs transition-colors"
        >
          + Semen Freezing
        </button>
      </div>
    </div>
  );
}
