import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

/**
 * TabsList — underline style, not segmented pill.
 * Looks like a professional web app (GitHub, Linear, Figma) not a mobile app.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-0 border-b text-sm',
      className
    )}
    style={{ borderColor: 'rgb(var(--clr-border))' }}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // Underline tab style — active gets a bottom border in primary colour
      'relative px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors',
      'border-b-2 border-transparent -mb-px',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
      'disabled:pointer-events-none disabled:opacity-40',
      'data-[state=active]:font-semibold',
      className
    )}
    style={
      {
        color: 'rgb(var(--clr-text-muted))',
        '--active-border': 'rgb(var(--clr-primary))',
        '--active-color':  'rgb(var(--clr-primary))',
      } as React.CSSProperties
    }
    onMouseEnter={(e) => {
      const el = e.currentTarget;
      if (el.dataset.state !== 'active') {
        el.style.color = 'rgb(var(--clr-text))';
      }
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget;
      if (el.dataset.state !== 'active') {
        el.style.color = 'rgb(var(--clr-text-muted))';
      }
    }}
    onFocus={(e) => {
      e.currentTarget.style.outlineColor = 'rgb(var(--clr-primary))';
    }}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * We use a global CSS rule for data-[state=active] because inline styles
 * can't target pseudo/data selectors cleanly.
 */
const TabsActiveStyle = () => (
  <style>{`
    [data-radix-tabs-trigger][data-state="active"] {
      color: rgb(var(--clr-primary)) !important;
      border-bottom-color: rgb(var(--clr-primary)) !important;
    }
  `}</style>
);

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsActiveStyle };
