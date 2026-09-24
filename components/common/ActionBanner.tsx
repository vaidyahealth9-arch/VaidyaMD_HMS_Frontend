'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type BannerVariant = 'success' | 'error' | 'warning' | 'info';

interface ActionBannerProps {
  /** Pass null/undefined to hide the banner */
  message: string | null | undefined;
  variant?: BannerVariant;
  /** Auto-dismiss after N ms. Pass 0 to disable. Default: 5000 */
  autoDismissMs?: number;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<
  BannerVariant,
  { icon: React.ComponentType<{ className?: string }>; classes: string }
> = {
  success: {
    icon: CheckCircle2,
    classes:
      'bg-emerald-50 border-emerald-200 text-emerald-800 [&_svg]:text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    classes:
      'bg-rose-50 border-rose-200 text-rose-800 [&_svg]:text-rose-600',
  },
  warning: {
    icon: AlertTriangle,
    classes:
      'bg-amber-50 border-amber-200 text-amber-800 [&_svg]:text-amber-600',
  },
  info: {
    icon: Info,
    classes:
      'bg-sky-50 border-sky-200 text-sky-800 [&_svg]:text-sky-600',
  },
};

/**
 * Inline action banner — replaces the identical 5-copy pattern in
 * ipd, pharmacy, cosgyn, lims, analytics pages.
 *
 * Usage:
 *   <ActionBanner message={actionSuccess} autoDismissMs={4000} />
 *   <ActionBanner message={errorMsg} variant="error" />
 *
 * Pair with the useActionBanner hook for auto-reset state management.
 */
export default function ActionBanner({
  message,
  variant = 'success',
  autoDismissMs = 5000,
  onDismiss,
  className,
}: ActionBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      if (autoDismissMs > 0) {
        const t = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoDismissMs);
        return () => clearTimeout(t);
      }
    } else {
      setVisible(false);
    }
  }, [message, autoDismissMs, onDismiss]);

  if (!visible || !message) return null;

  const { icon: Icon, classes } = variantConfig[variant];

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs font-bold',
        'shadow-sm animate-in fade-in slide-in-from-top-1 duration-200',
        classes,
        className,
      )}
      role="alert"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─── Companion hook ─────────────────────────────────────────── */

/**
 * Manages the actionSuccess / actionError string state pattern
 * that was copy-pasted across 5 pages.
 *
 * Usage:
 *   const { message, variant, show, clear } = useActionBanner();
 *   show('Session completed!');           // green success
 *   show('Failed to save', 'error');      // red error
 *   <ActionBanner message={message} variant={variant} />
 */
export function useActionBanner(autoDismissMs = 5000) {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<BannerVariant>('success');

  const show = useCallback(
    (msg: string, v: BannerVariant = 'success') => {
      setVariant(v);
      setMessage(msg);
      if (autoDismissMs > 0) {
        setTimeout(() => setMessage(null), autoDismissMs);
      }
    },
    [autoDismissMs],
  );

  const clear = useCallback(() => setMessage(null), []);

  return { message, variant, show, clear };
}
