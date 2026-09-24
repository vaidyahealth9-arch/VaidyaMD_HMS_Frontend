'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

const variantStyles = {
  danger:  { btn: 'bg-rose-600 hover:bg-rose-700 text-white', icon: 'text-rose-500' },
  warning: { btn: 'bg-amber-500 hover:bg-amber-600 text-white', icon: 'text-amber-500' },
  primary: { btn: 'bg-primary hover:bg-primary/90 text-white', icon: 'text-primary' },
};

/**
 * Accessible confirmation dialog — replaces all native window.confirm() calls
 * and bare "Are you sure?" patterns across the codebase.
 *
 * Usage:
 *   <ConfirmDialog
 *     isOpen={showDeleteConfirm}
 *     onClose={() => setShowDeleteConfirm(false)}
 *     onConfirm={handleDelete}
 *     title="Unlink Partner"
 *     description="Are you sure you want to unlink this partner? Both records will become independent."
 *     confirmLabel="Yes, Unlink"
 *     variant="danger"
 *   />
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = 'Confirm Action',
  description,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const handleClose = onClose || onCancel || (() => {});
  const displayDescription = description || message || '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-current/10')}>
              <AlertTriangle className={cn('w-5 h-5', styles.icon)} />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-slate-600 text-sm leading-relaxed">
            {displayDescription}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); }}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2',
              styles.btn,
              isLoading && 'opacity-70 cursor-wait',
            )}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
