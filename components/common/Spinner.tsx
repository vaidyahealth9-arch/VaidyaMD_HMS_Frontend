import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';
type SpinnerVariant = 'primary' | 'white' | 'muted';

interface SpinnerProps {
  /** xs=3.5 · sm=4 · md=6 · lg=8  (Tailwind w/h units) */
  size?: SpinnerSize;
  /** primary = brand color · white = inside dark buttons · muted = grey */
  variant?: SpinnerVariant;
  /** Wraps spinner in a p-12 centred flex container for full-section loading */
  fullPage?: boolean;
  /** Accessible label shown as sr-only text */
  label?: string;
  className?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'w-3.5 h-3.5 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

const variantMap: Record<SpinnerVariant, string> = {
  primary: 'border-primary border-t-transparent',
  white:   'border-white/40 border-t-white',
  muted:   'border-slate-300 border-t-slate-500',
};

/**
 * Unified loading spinner — replaces 3 inconsistent animate-spin div shapes
 * spread across 15+ files with different border-widths and colour references.
 *
 * Usage:
 *   <Spinner />                         inline, primary, md
 *   <Spinner size="xs" variant="white"> inside a button
 *   <Spinner size="lg" fullPage />       full-section loading state
 */
export default function Spinner({
  size = 'md',
  variant = 'primary',
  fullPage = false,
  label = 'Loading…',
  className,
}: SpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'rounded-full animate-spin flex-shrink-0',
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="p-12 flex items-center justify-center w-full">
        {spinner}
      </div>
    );
  }

  return spinner;
}
