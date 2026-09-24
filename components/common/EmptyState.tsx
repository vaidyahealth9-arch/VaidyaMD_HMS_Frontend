import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** Lucide icon to display */
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  /** Optional action button (e.g. "Create First Invoice") */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Unified "no data" placeholder — replaces 8 pages that each write
 * their own empty-state div with inconsistent spacing and styles.
 *
 * Usage:
 *   <EmptyState title="No invoices found" subtitle="Adjust filters." />
 *   <EmptyState icon={FileText} title="No records" action={<Button>Add</Button>} />
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center gap-3',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-slate-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-slate-400 max-w-xs">{subtitle}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
