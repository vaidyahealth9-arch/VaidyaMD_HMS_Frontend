import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  as?: 'label' | 'span' | 'p' | 'h3' | 'h4';
  htmlFor?: string;
  className?: string;
}

/**
 * Standardised all-caps section / form label.
 * Replaces 25+ inline class strings like:
 *   "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1"
 *   "text-xs font-bold text-slate-400 uppercase tracking-wider"   (size inconsistent!)
 *   "text-[11px] font-bold text-slate-400 uppercase tracking-wider"
 *
 * Usage:
 *   <SectionLabel htmlFor="dept-select">Department / Source</SectionLabel>
 *   <SectionLabel as="h3">Active ART Cycles</SectionLabel>
 *   <SectionLabel as="p">Total Revenue</SectionLabel>
 */
export default function SectionLabel({
  children,
  as: Tag = 'label',
  htmlFor,
  className,
}: SectionLabelProps) {
  return (
    <Tag
      htmlFor={Tag === 'label' ? htmlFor : undefined}
      className={cn(
        'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
