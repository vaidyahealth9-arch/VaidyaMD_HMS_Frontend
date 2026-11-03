import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  /** Extra classes applied to the outer wrapper */
  className?: string;
  /** Set false only if a page explicitly needs a narrow reading column */
  fullWidth?: boolean;
}

/**
 * Standard page wrapper used by dashboard pages.
 * Adapts fluidly to all viewports and zoom levels, eliminating dead gutters.
 */
export default function PageLayout({ children, className, fullWidth = true }: PageLayoutProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto transition-all duration-150',
        fullWidth
          ? 'max-w-full px-2 sm:px-4 lg:px-6 py-3.5 space-y-4'
          : 'max-w-5xl px-3 sm:px-5 lg:px-6 py-4 space-y-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
