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
        default:     '', // inline style applied below via className override
        destructive: 'bg-[rgb(var(--clr-danger))]   text-white shadow-sm hover:opacity-90 active:opacity-100 focus-visible:ring-[rgb(var(--clr-danger))]',
        outline:     'border border-[rgb(var(--clr-border))] bg-white shadow-sm hover:bg-[rgb(var(--clr-surface-muted))] text-[rgb(var(--clr-text))]',
        secondary:   'bg-[rgb(var(--clr-surface-muted))] text-[rgb(var(--clr-text))] shadow-sm hover:bg-[rgb(var(--clr-border))]',
        ghost:       'hover:bg-[rgb(var(--clr-surface-muted))] text-[rgb(var(--clr-text-muted))] hover:text-[rgb(var(--clr-text))]',
        link:        'text-[rgb(var(--clr-primary))] underline-offset-4 hover:underline',
        success:     'bg-[rgb(var(--clr-success))]   text-white shadow-sm hover:opacity-90',
        accent:      '', // gold — inline style below
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
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Apply primary/accent colours as inline style (CSS vars don't purge-proof in tw v4 cva)
    let inlineStyle: React.CSSProperties = style || {};
    if (variant === 'default' || !variant) {
      inlineStyle = {
        background: 'rgb(var(--clr-primary))',
        color: 'white',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.08)',
        ...style,
      };
    } else if (variant === 'accent') {
      inlineStyle = {
        background: 'rgb(var(--clr-accent))',
        color: 'white',
        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.08)',
        ...style,
      };
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={inlineStyle}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
