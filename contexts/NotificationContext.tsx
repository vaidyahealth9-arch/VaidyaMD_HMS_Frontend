'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { wsClient } from '@/lib/websocket';
import { notificationsApi } from '@/lib/api';

export interface VaidyaNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface NotificationContextValue {
  notifications: VaidyaNotification[];
  unreadCount: number;
  addNotification: (n: VaidyaNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [notifications, setNotifications] = useState<VaidyaNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const initialized = useRef(false);

  // Load initial notifications from API
  useEffect(() => {
    if (!userId || initialized.current) return;
    initialized.current = true;

    notificationsApi.list(userId, false)
      .then((data) => setNotifications(data as VaidyaNotification[]))
      .catch(() => {});
  }, [userId]);

  // Subscribe to WebSocket messages
  useEffect(() => {
    const unsubscribe = wsClient.onMessage((msg) => {
      if (msg.type === 'patient_status' || msg.type === 'appointment' || msg.type === 'billing') {
        const newNotification: VaidyaNotification = {
          id: `ws-${Date.now()}`,
          type: msg.type as string,
          title: msg.title as string,
          message: msg.message as string,
          is_read: false,
          metadata: msg as Record<string, unknown>,
          created_at: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotification, ...prev].slice(0, 50));
      }
    });

    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const addNotification = (n: VaidyaNotification) => {
    setNotifications((prev) => [n, ...prev].slice(0, 50));
  };

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    if (!id.startsWith('ws-')) {
      await notificationsApi.markRead(id).catch(() => {});
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (userId) {
      await notificationsApi.markAllRead(userId).catch(() => {});
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, isOpen, setIsOpen }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
