'use client';

import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional numeric badge shown next to label (e.g. pending count) */
  badge?: string | number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  /** 'pill' (default) = pill container; 'underline' = bottom-border style */
  variant?: 'pill' | 'underline';
  className?: string;
}

/**
 * Unified tab navigation bar — replaces 4 inconsistent tab styles:
 *  1. billing  — plain button row with border-b
 *  2. ivf-lab  — pill container, dark active
 *  3. pharmacy — shadcn <Tabs> with h-11
 *  4. patients/[id] — custom map loop with primary active colour
 *
 * Design: pill container, brand-primary active state, icon + label, mobile-scrollable.
 */
export default function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className,
}: TabBarProps) {
  if (variant === 'underline') {
    return (
      <div className={cn('flex gap-1 border-b border-slate-200 overflow-x-auto', className)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap',
                'border-b-2 -mb-px transition-all',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300',
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.badge !== undefined && tab.badge !== null && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-200 text-slate-500',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pill variant
  return (
    <div
      className={cn(
        'flex bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto gap-0.5',
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap rounded-lg transition-all',
              isActive
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60',
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
            {tab.label}
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-300/60 text-slate-600',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
