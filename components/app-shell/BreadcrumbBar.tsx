'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { VaidyaMdUser } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { roleLabels, getUserRoleDisplay } from '@/lib/utils';
import {
  Bell,
  Building2,
  ChevronDown,
  UserCheck,
  LogOut,
  Settings,
  Menu,
  ChevronRight,
  PanelLeft,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';

/** Map route prefix → human label for the breadcrumb */
const MODULE_LABELS: Record<string, string> = {
  '/dashboard/analytics':   'Analytics & Performance',
  '/dashboard':             'Dashboard',
  '/opd':                   'OPD Workbench',
  '/counseling':            'Counselor Desk',
  '/patients':              'Patients & EMR',
  '/appointments':          'Appointments',
  '/cosgyn':                'Cosmetic Gynae',
  '/fertility':             'Fertility',
  '/ivf-lab':               'IVF Lab',
  '/ipd':                   'IPD Bedboard',
  '/pharmacy':              'Pharmacy & Stock',
  '/lims':                  'LIMS & HL7 Lab',
  '/billing':               'Billing & Cashier',
  '/analytics':             'Revenue & Analytics',
  '/settings':              'Master Settings',
};

function useModuleLabel(pathname: string): string {
  const match = Object.keys(MODULE_LABELS)
    .sort((a, b) => b.length - a.length) // longest prefix first
    .find((key) => pathname.startsWith(key));
  return match ? MODULE_LABELS[match] : 'VaidyaMD HMS';
}

export default function TopBar() {
  const pathname = usePathname();
  const { user, activeRole, switchUser, logout, branches, currentBranch, setCurrentBranch } = useAuth();
  const { unreadCount, setIsOpen: setNotifOpen } = useNotifications();
  const { isExpanded, toggleSidebar } = useSidebar();
  const [allUsers, setAllUsers] = useState<VaidyaMdUser[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const moduleLabel = useModuleLabel(pathname);

  // Split pathname into segments for breadcrumb
  const segments = pathname.split('/').filter(Boolean);

  useEffect(() => {
    authApi.listUsers().then((u) => setAllUsers(u as VaidyaMdUser[])).catch(() => {});
  }, []);

  return (
    <header
      className="h-12 flex items-center justify-between px-4 z-10 flex-shrink-0 print:hidden"
      style={{
        background:   'rgb(var(--clr-topbar-bg))',
        borderBottom: '1px solid rgb(var(--clr-border))',
      }}
    >
      {/* LEFT — Sidebar Toggle + Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Desktop Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={toggleSidebar}
          title={isExpanded ? 'Collapse side panel' : 'Expand side panel'}
          aria-label={isExpanded ? 'Collapse side panel' : 'Expand side panel'}
          className="hidden md:flex text-slate-500 hover:text-slate-800"
        >
          <PanelLeft className="w-4 h-4" />
        </Button>

        {/* Mobile nav trigger */}
        <div className="lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="iconSm">
                <Menu className="w-4 h-4" style={{ color: 'rgb(var(--clr-text-muted))' }} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 overflow-y-auto">
              <SheetHeader className="text-left mb-4">
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <img src="/logo.svg" alt="VaidyaMD" className="w-7 h-7" />
                  <span style={{ color: 'rgb(var(--clr-primary))' }} className="font-semibold">VaidyaMD HMS</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 text-xs">
                {Object.entries(MODULE_LABELS).map(([href, label]) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-md font-medium transition-colors ${
                        isActive
                          ? 'bg-[rgb(var(--clr-primary)/0.12)] text-[rgb(var(--clr-primary))] font-semibold'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Breadcrumb — module + sub-page */}
        <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
          <span className="font-semibold truncate" style={{ color: 'rgb(var(--clr-text))' }}>
            {moduleLabel}
          </span>
          {segments.length > 1 && segments[1] !== 'dashboard' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgb(var(--clr-text-subtle))' }} />
              <span className="text-xs truncate" style={{ color: 'rgb(var(--clr-text-muted))' }}>
                {segments[segments.length - 1]
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* RIGHT — Branch, Bell, Role switcher, User */}
      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
        {/* Branch Switcher */}
        {branches && branches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 text-xs font-medium hidden sm:flex"
                style={{ color: 'rgb(var(--clr-text-muted))' }}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="max-w-[110px] truncate">{currentBranch?.name || 'Main Clinic'}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Switch Clinic Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branches.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => setCurrentBranch(b)}
                  className={`text-xs ${b.id === currentBranch?.id ? 'font-semibold' : ''}`}
                  style={b.id === currentBranch?.id ? { color: 'rgb(var(--clr-primary))' } : {}}
                >
                  <Building2 className="w-3.5 h-3.5 mr-2 opacity-40" />
                  <span className="truncate">{b.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setNotifOpen(true)}
          className="relative"
          style={{ color: 'rgb(var(--clr-text-muted))' }}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              style={{ background: 'rgb(var(--clr-danger))' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Admin Role Switcher */}
        {user?.role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs font-medium h-8 hidden md:flex"
                style={{
                  color:       'rgb(var(--clr-primary))',
                  borderColor: 'rgb(var(--clr-primary) / 0.3)',
                  background:  'rgb(var(--clr-primary-light) / 0.15)',
                }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{getUserRoleDisplay(user)}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-xs">Switch Persona (Admin Preview)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allUsers.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => switchUser(u.email)}
                  className={`flex items-center gap-2.5 py-2 text-xs ${u.email === user?.email ? 'font-semibold' : ''}`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: 'rgb(var(--clr-primary))' }}
                  >
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate" style={{ color: 'rgb(var(--clr-text))' }}>{u.name}</p>
                    <p style={{ color: 'rgb(var(--clr-text-muted))' }}>{getUserRoleDisplay(u)}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Divider */}
        <div className="w-px h-5 mx-0.5" style={{ background: 'rgb(var(--clr-border))' }} />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 focus:outline-none rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
                style={{ background: 'rgb(var(--clr-primary))' }}
              >
                {user?.name?.slice(0, 2).toUpperCase() || 'VM'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold leading-tight" style={{ color: 'rgb(var(--clr-text))' }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p className="text-[10px] leading-tight" style={{ color: 'rgb(var(--clr-text-muted))' }}>
                  {getUserRoleDisplay(user)}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold" style={{ color: 'rgb(var(--clr-text))' }}>{user?.name}</p>
              <p className="text-[11px] truncate" style={{ color: 'rgb(var(--clr-text-muted))' }}>{user?.email}</p>
              <p className="text-[10px] font-medium mt-0.5" style={{ color: 'rgb(var(--clr-primary))' }}>
                {user?.hospital_name || 'VaidyaMD Fertility & ART Centre'}
              </p>
            </div>
            <DropdownMenuSeparator />
            {user?.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer text-xs">
                  <Settings className="w-3.5 h-3.5 mr-2 opacity-50" />
                  Master Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={logout}
              className="text-xs cursor-pointer"
              style={{ color: 'rgb(var(--clr-danger))' }}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
