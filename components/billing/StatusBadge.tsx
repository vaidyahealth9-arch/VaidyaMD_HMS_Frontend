import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/features/billing/types';

interface StatusBadgeProps {
  status: InvoiceStatus | string;
  size?: 'xs' | 'sm';
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  partially_paid: {
    label: 'Partial',
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  draft: {
    label: 'Draft',
    classes: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-100 text-slate-400 border-slate-200',
  },
};

/**
 * Invoice / payment status badge.
 * Replaces the inline statusColors Record + span pattern repeated in
 * billing/page, patients/[id], and appointments.
 *
 * Usage:
 *   <StatusBadge status="paid" />
 *   <StatusBadge status={invoice.status} size="xs" />
 */
export default function StatusBadge({ status, size = 'xs', className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status?.replace(/_/g, ' ') ?? 'Unknown',
    classes: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold uppercase tracking-wide',
        size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
