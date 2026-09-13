import { redirect } from 'next/navigation';

/**
 * Legacy OPD route redirect:
 * Consolidates outpatient queues into Appointments (/appointments?status=waiting)
 * and clinical consultation charting into Patient EMR (/patients/[id]?tab=workbench).
 */
export default function LegacyOPDPage() {
  redirect('/appointments?status=waiting');
}
