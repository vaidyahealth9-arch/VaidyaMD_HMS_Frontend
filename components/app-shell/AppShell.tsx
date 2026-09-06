'use client';

import { ReactNode } from 'react';
import IconRail from '@/components/app-shell/IconRail';
import BreadcrumbBar from '@/components/app-shell/BreadcrumbBar';
import ContextSidebar from '@/components/app-shell/ContextSidebar';
import NotificationTray from '@/components/app-shell/NotificationTray';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/30">
            VM
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="text-slate-400 text-sm font-medium">Loading VaidyaMD HMS...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <NotificationProvider userId={user.id}>
      <div className="h-screen flex overflow-hidden bg-slate-50">
        {/* Icon Rail (leftmost) */}
        <IconRail />

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Horizontal Breadcrumb/Module Bar */}
          <BreadcrumbBar />

          {/* Content Area with Context Sidebar */}
          <div className="flex-1 flex overflow-hidden">
            <ContextSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
              <div className="fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* Notification Tray (overlay) */}
        <NotificationTray />
      </div>
    </NotificationProvider>
  );
}
