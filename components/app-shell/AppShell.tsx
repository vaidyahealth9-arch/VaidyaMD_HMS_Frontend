'use client';

import { ReactNode } from 'react';
import IconRail from '@/components/app-shell/IconRail';
import BreadcrumbBar from '@/components/app-shell/BreadcrumbBar';
import ContextSidebar from '@/components/app-shell/ContextSidebar';
import NotificationTray from '@/components/app-shell/NotificationTray';
import AmbientScribeWidget from '@/components/opd/AmbientScribeWidget';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
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
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: 'rgb(var(--clr-rail-bg))' }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Logo mark */}
          <img src="/logo.svg" alt="VaidyaMD" className="w-12 h-12" />
          {/* Wordmark */}
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Vaidya<span style={{ color: 'rgb(var(--clr-accent))' }}>MD</span> HMS
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Fertility & ART Centre
            </p>
          </div>
          {/* Slim loading bar — no bounce, no pulse */}
          <div className="loading-bar" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <NotificationProvider userId={user.id}>
      <SidebarProvider>
        <div className="h-screen flex overflow-hidden" style={{ background: 'rgb(var(--clr-surface-muted))' }}>
          {/* Main Navigation Sidebar / Icon Rail */}
          <IconRail />

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Bar — breadcrumb + controls */}
            <BreadcrumbBar />

            {/* Content Area with Context Sidebar */}
            <div className="flex-1 flex overflow-hidden">
              <ContextSidebar />

              {/* Main Content */}
              <main
                className="flex-1 overflow-y-auto relative"
                style={{ background: 'rgb(var(--clr-surface-muted))' }}
              >
                <div className="fade-in">
                  {children}
                </div>
              </main>
            </div>
          </div>

          {/* Notification Tray (overlay) */}
          <NotificationTray />

          {/* Global Ambient Scribe Widget */}
          <AmbientScribeWidget />
        </div>
      </SidebarProvider>
    </NotificationProvider>
  );
}
