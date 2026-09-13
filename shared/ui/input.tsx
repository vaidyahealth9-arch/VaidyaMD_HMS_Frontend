import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border bg-white px-3 py-2 text-sm',
          'ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-[rgb(var(--clr-text-subtle))]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          className
        )}
        style={{
          borderColor: 'rgb(var(--clr-border))',
          color:       'rgb(var(--clr-text))',
          // Focus ring colour set via global CSS --tw-ring-color override below
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgb(var(--clr-primary))';
          e.currentTarget.style.boxShadow   = '0 0 0 2px rgb(var(--clr-primary) / 0.15)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgb(var(--clr-border))';
          e.currentTarget.style.boxShadow   = 'none';
          props.onBlur?.(e);
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
