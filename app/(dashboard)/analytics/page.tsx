import { redirect } from 'next/navigation';

/**
 * Legacy Analytics route redirect:
 * Consolidates Analytics under Dashboard -> Analytics (/dashboard/analytics)
 */
export default function LegacyAnalyticsPage() {
  redirect('/dashboard/analytics');
}
