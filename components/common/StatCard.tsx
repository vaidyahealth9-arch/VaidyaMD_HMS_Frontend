import { cn } from '@/lib/utils';

type StatCardColor = 'default' | 'success' | 'danger' | 'warning' | 'primary' | 'info';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: StatCardColor;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional trend indicator: e.g. { value: 12, label: 'vs last month' } */
  trend?: { value: number; label?: string };
  className?: string;
}

const colorMap: Record<StatCardColor, { label: string; value: string; subtext: string }> = {
  default: {
    label: 'text-slate-400',
    value: 'text-slate-900',
    subtext: 'text-slate-500',
  },
  success: {
    label: 'text-emerald-600',
    value: 'text-emerald-700',
    subtext: 'text-emerald-600/80',
  },
  danger: {
    label: 'text-rose-600',
    value: 'text-rose-700',
    subtext: 'text-rose-600/80',
  },
  warning: {
    label: 'text-amber-600',
    value: 'text-amber-700',
    subtext: 'text-amber-600/80',
  },
  primary: {
    label: 'text-primary/80',
    value: 'text-primary',
    subtext: 'text-primary/70',
  },
  info: {
    label: 'text-sky-600',
    value: 'text-sky-700',
    subtext: 'text-sky-600/80',
  },
};

/**
 * Standard metric/stat tile — replaces the repeated card pattern in
 * billing, counseling, pharmacy, lims, analytics pages.
 *
 * Usage:
 *   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 *     <StatCard label="Total Billed"    value="₹4,50,000" subtext="23 invoices" />
 *     <StatCard label="Total Collected" value="₹3,80,000" color="success" />
 *     <StatCard label="Outstanding"     value="₹70,000"   color="danger" />
 *   </div>
 */
export default function StatCard({
  label,
  value,
  subtext,
  color = 'default',
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        'bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-1',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn('text-[10px] font-bold uppercase tracking-wider', c.label)}>
          {label}
        </p>
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', `bg-current/10`)}>
            <Icon className={cn('w-4 h-4', c.label)} />
          </div>
        )}
      </div>

      <p className={cn('text-2xl font-bold mt-0.5 font-mono', c.value)}>
        {value}
      </p>

      <div className="flex items-center gap-2">
        {subtext && (
          <p className={cn('text-[11px]', c.subtext)}>{subtext}</p>
        )}
        {trend !== undefined && (
          <span
            className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              trend.value >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700',
            )}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            {trend.label ? ` ${trend.label}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
