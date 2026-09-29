'use client';

import React from 'react';
import UnifiedScanWorkbench from '@/components/scans/UnifiedScanWorkbench';

interface InvestigationsTabProps {
  patient: any;
  partner?: any;
  user: any;
}

export default function InvestigationsTab({ patient, partner, user }: InvestigationsTabProps) {
  return (
    <div className="w-full">
      <UnifiedScanWorkbench
        patient={patient}
        partner={partner}
        user={user}
        initialSchemaType="follicular_scan"
      />
    </div>
  );
}
