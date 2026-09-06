'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

// Convenience global toast function callable anywhere
export const toast = {
  success: (title: string, description?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: 'success', title, description });
    } else {
      console.log('Toast (success):', title, description);
    }
  },
  error: (title: string, description?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: 'error', title, description });
    } else {
      console.error('Toast (error):', title, description);
    }
  },
  info: (title: string, description?: string) => {
    if (globalShowToast) {
      globalShowToast({ type: 'info', title, description });
    } else {
      console.info('Toast (info):', title, description);
    }
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toastData: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toastData, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toastData.duration || 4500;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  globalShowToast = showToast;

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-2 fade-in ${
              t.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-700/60'
                : t.type === 'error'
                ? 'bg-red-900/95 text-white border-red-700/60'
                : 'bg-slate-900/95 text-white border-slate-700/60'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}

            <div className="flex-1 text-xs">
              <p className="font-bold text-sm leading-snug">{t.title}</p>
              {t.description && <p className="opacity-90 mt-0.5 leading-relaxed">{t.description}</p>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white transition-opacity p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
