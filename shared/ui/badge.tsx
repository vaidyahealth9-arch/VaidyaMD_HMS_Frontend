import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge — clinical, muted palette.
 * `rounded` (not `rounded-full`) — flat, not candy.
 * No hover colour change — badges are not buttons.
 */
const badgeVariants = cva(
  'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium leading-none transition-none focus:outline-none',
  {
    variants: {
      variant: {
        default:     'border-transparent text-white',
        secondary:   'border-[rgb(var(--clr-border))] bg-[rgb(var(--clr-surface-muted))] text-[rgb(var(--clr-text-muted))]',
        destructive: 'border-[rgb(var(--clr-danger-bg))] bg-[rgb(var(--clr-danger-bg))] text-[rgb(var(--clr-danger))]',
        outline:     'border-[rgb(var(--clr-border-strong))] text-[rgb(var(--clr-text-muted))] bg-transparent',
        success:     'border-[rgb(var(--clr-success-bg))] bg-[rgb(var(--clr-success-bg))] text-[rgb(var(--clr-success))]',
        warning:     'border-[rgb(var(--clr-warning-bg))] bg-[rgb(var(--clr-warning-bg))] text-[rgb(var(--clr-warning))]',
        info:        'border-[rgb(var(--clr-info-bg))]    bg-[rgb(var(--clr-info-bg))]    text-[rgb(var(--clr-info))]',
        accent:      'border-[rgb(var(--clr-accent-light))] bg-[rgb(var(--clr-accent-light))] text-[rgb(var(--clr-accent))]',
        // Legacy alias — keep compatibility with existing code that uses 'purple'
        purple:      'border-purple-100 bg-purple-50 text-purple-700',
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

function Badge({ className, variant, style, ...props }: BadgeProps) {
  // Default variant needs the primary colour applied inline (CSS var)
  const inlineStyle =
    variant === 'default' || !variant
      ? { background: 'rgb(var(--clr-primary))', ...style }
      : style;

  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={inlineStyle}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
