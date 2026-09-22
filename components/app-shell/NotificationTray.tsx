'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDateTime } from '@/lib/utils';
import {
  Building2,
  CalendarDays,
  CreditCard,
  FlaskConical,
  Settings,
  Pill,
  BellOff,
  Pin,
  X,
} from 'lucide-react';

const typeIcons: Record<string, React.ReactNode> = {
  patient_status: <Building2 className="w-4 h-4 text-sky-700" />,
  appointment: <CalendarDays className="w-4 h-4 text-teal-700" />,
  billing: <CreditCard className="w-4 h-4 text-amber-700" />,
  lab_result: <FlaskConical className="w-4 h-4 text-emerald-700" />,
  system: <Settings className="w-4 h-4 text-slate-600" />,
  prescription: <Pill className="w-4 h-4 text-rose-700" />,
};

export default function NotificationTray() {
  const { notifications, unreadCount, markRead, markAllRead, isOpen, setIsOpen } = useNotifications();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 print:hidden" onClick={() => setIsOpen(false)} />

      {/* Tray Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col slide-in-right print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm">Notifications</h2>
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[rgb(var(--clr-primary))] font-semibold hover:underline transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <BellOff className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-600">No notifications</p>
              <p className="text-[11px] text-slate-400">You are all caught up with clinic updates.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left p-3.5 hover:bg-slate-50 transition-colors ${
                    !n.is_read ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {typeIcons[n.type] || <Pin className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs font-semibold truncate ${!n.is_read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 bg-[rgb(var(--clr-primary))] rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{formatDateTime(n.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
