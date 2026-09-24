import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Lucide icon component shown in the branded icon badge */
  icon?: React.ComponentType<{ className?: string }>;
  /** Extra element next to the title (e.g. "MLLP Port Active" status pill) */
  titleBadge?: React.ReactNode;
  /** Right-side action buttons */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header — title + branded icon badge + subtitle + right-side CTA.
 * Replaces the repeated pattern in: lims, ipd, pharmacy, analytics, ivf-lab,
 * counseling, cosgyn (7 pages all writing the same ~15 lines).
 */
export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  titleBadge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col md:flex-row md:items-center justify-between gap-4',
        className,
      )}
    >
      {/* Left: icon badge + title + subtitle */}
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0
                       bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)]
                       flex items-center justify-center text-primary"
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
            {titleBadge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right: action buttons */}
      {actions && (
        <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}
