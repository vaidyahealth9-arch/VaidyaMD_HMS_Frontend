import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base — rounded-md (clinical, not bubbly), no glow shadow
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:     'bg-primary hover:bg-primary-mid text-white shadow-xs focus-visible:ring-primary',
        destructive: 'bg-danger text-white shadow-xs hover:opacity-90 active:opacity-100 focus-visible:ring-danger',
        outline:     'border border-border bg-white shadow-xs hover:bg-surface-muted text-text-main focus-visible:ring-primary',
        secondary:   'bg-surface-muted text-text-main shadow-xs hover:bg-border focus-visible:ring-primary',
        ghost:       'hover:bg-surface-muted text-text-muted hover:text-text-main focus-visible:ring-primary',
        link:        'text-primary underline-offset-4 hover:underline focus-visible:ring-primary',
        success:     'bg-success text-white shadow-xs hover:opacity-90 focus-visible:ring-success',
        accent:      'bg-accent hover:opacity-90 text-white shadow-xs focus-visible:ring-accent',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-md px-6',
        icon:    'h-9 w-9',
        iconSm:  'h-8 w-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
