import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — clinical, muted palette.
 * `rounded` (not `rounded-full`) — flat, not candy.
 * No hover colour change — badges are not buttons.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none transition-none focus:outline-none',
  {
    variants: {
      variant: {
        default:     'border-primary/20 bg-primary/10 text-primary',
        secondary:   'border-border bg-surface-muted text-text-muted',
        destructive: 'border-danger/20 bg-danger-bg text-danger',
        outline:     'border-border-strong text-text-muted bg-transparent',
        success:     'border-success/20 bg-success-bg text-success',
        warning:     'border-warning/20 bg-warning-bg text-warning',
        info:        'border-info/20 bg-info-bg text-info',
        accent:      'border-accent/30 bg-accent-light text-accent font-semibold',
        // Legacy alias — keep compatibility with existing code that uses 'purple'
        purple:      'border-purple-200 bg-purple-50 text-purple-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
