import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  /** Extra classes applied to the outer wrapper */
  className?: string;
  /** Set true for pages that need full-bleed width (e.g. calendar grids) */
  fullWidth?: boolean;
}

/**
 * Standard page wrapper used by every dashboard page.
 * Guarantees all pages are consistently centrally aligned with comfortable,
 * modern margins across all viewports.
 */
export default function PageLayout({ children, className, fullWidth = false }: PageLayoutProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-3 sm:px-5 lg:px-6 py-5 space-y-5',
        fullWidth ? 'max-w-full' : 'max-w-[1600px]',
        className,
      )}
    >
      {children}
    </div>
  );
}
