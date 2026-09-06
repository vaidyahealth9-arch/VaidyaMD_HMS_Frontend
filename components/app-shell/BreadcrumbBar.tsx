'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import { VaidyaMdUser } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { roleLabels } from '@/lib/utils';
import {
  Bell,
  Building2,
  ChevronDown,
  UserCheck,
  LogOut,
  Settings,
  Menu,
  Stethoscope,
  LayoutDashboard,
  Users,
  Calendar,
  Microscope,
  BedDouble,
  Pill,
  FlaskConical,
  ReceiptText,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const moduleItems = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'opd', href: '/opd', label: 'OPD Workbench', icon: Stethoscope },
  { id: 'patients', href: '/patients', label: 'Patients', icon: Users },
  { id: 'appointments', href: '/appointments', label: 'Appointments', icon: Calendar },
  { id: 'ivf-lab', href: '/ivf-lab', label: 'IVF Lab', icon: Microscope, badge: 'ART' },
  { id: 'ipd', href: '/ipd', label: 'IPD Bedboard', icon: BedDouble },
  { id: 'pharmacy', href: '/pharmacy', label: 'Pharmacy', icon: Pill },
  { id: 'lims', href: '/lims', label: 'LIMS Lab', icon: FlaskConical },
  { id: 'billing', href: '/billing', label: 'Billing', icon: ReceiptText },
  { id: 'analytics', href: '/analytics', label: 'Analytics & Leakage', icon: TrendingUp },
];

export default function BreadcrumbBar() {
  const pathname = usePathname();
  const { user, activeRole, switchUser, logout, branches, currentBranch, setCurrentBranch, can } = useAuth();
  const { unreadCount, setIsOpen: setNotifOpen } = useNotifications();
  const [allUsers, setAllUsers] = useState<VaidyaMdUser[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    authApi.listUsers().then((u) => setAllUsers(u as VaidyaMdUser[])).catch(() => {});
  }, []);

  const visibleModules = moduleItems.filter((m) => can(m.id));

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10 flex-shrink-0 shadow-sm">
      {/* Mobile Menu Trigger (Shadcn Sheet) */}
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="iconSm">
              <Menu className="w-5 h-5 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetHeader className="text-left mb-4">
              <SheetTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  VM
                </div>
                <span>VaidyaMD HMS</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1">
              {visibleModules.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span>{item.label}</span>
                    {item.badge && <Badge variant="secondary" className="ml-auto text-[10px]">{item.badge}</Badge>}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Module Navigation Pills */}
      <div className="hidden lg:flex items-center gap-2 overflow-x-auto hide-scrollbar max-w-[65%]">
        <nav className="flex items-center gap-1.5">
          {visibleModules.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1 rounded uppercase">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Clinic Branch, Preview Persona, Notifications, User Menu */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Branch Switcher */}
        {branches && branches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-8 rounded-lg px-2.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline font-bold max-w-[120px] truncate">{currentBranch?.name || 'Main Clinic'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Switch Clinic Branch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {branches.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => setCurrentBranch(b)}
                  className={b.id === currentBranch?.id ? 'bg-indigo-50 text-indigo-700 font-bold' : ''}
                >
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
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
          className="relative text-slate-500 hover:text-slate-900"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Admin Role Switcher (Preview Persona) */}
        {user?.role === 'admin' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1 text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 h-8 rounded-lg">
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Role: {roleLabels[activeRole] || activeRole}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Persona (Admin Testing)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allUsers.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={() => switchUser(u.email)}
                  className={`flex items-center gap-2.5 py-2 ${u.email === user?.email ? 'bg-indigo-50 font-bold' : ''}`}
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                    {u.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-500">{roleLabels[u.role] || u.role}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none ml-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.name?.slice(0, 2).toUpperCase() || 'VM'}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-3 py-2">
              <p className="text-xs font-bold text-slate-900">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">{user?.hospital_name || 'VaidyaMD Clinic'}</p>
            </div>
            <DropdownMenuSeparator />
            {user?.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  <span>Master Settings</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-700 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
