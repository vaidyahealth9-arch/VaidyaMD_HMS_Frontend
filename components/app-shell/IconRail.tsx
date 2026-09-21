'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn, roleColors, roleLabels } from '@/lib/utils';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  Microscope,
  BedDouble,
  Pill,
  FlaskConical,
  ReceiptText,
  TrendingUp,
  Settings,
  Sparkles,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  HeartHandshake,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';

const navItems = [
  { id: 'dashboard',        href: '/dashboard',                 icon: LayoutDashboard, label: 'Dashboard',          roles: ['admin','doctor','nurse','receptionist','accounts','embryologist','andrologist','pharma','pharmacist','counsellor'] },
  { id: 'counseling',       href: '/counseling',                icon: HeartHandshake,  label: 'Counselor Desk',     roles: ['admin','counsellor','doctor','nurse'] },
  { id: 'patients',         href: '/patients',                  icon: Users,           label: 'Patients & EMR',     roles: ['admin','doctor','nurse','receptionist','accounts','counsellor'] },
  { id: 'appointments',     href: '/appointments',              icon: Calendar,        label: 'Appointments',       roles: ['admin','doctor','nurse','receptionist','accounts','counsellor'] },
  { id: 'cosgyn',           href: '/cosgyn',                    icon: Sparkles,        label: 'Cosmetic Gynae',     roles: ['admin','doctor','nurse','receptionist','accounts'] },
  { id: 'treatment-board',  href: '/fertility/treatment-board', icon: Activity,        label: 'Treatment Board',    roles: ['admin','doctor','nurse','embryologist','receptionist','accounts'], badge: 'Live' },
  { id: 'ivf-lab',          href: '/ivf-lab',                   icon: Microscope,      label: 'IVF Lab',            roles: ['admin','doctor','embryologist','andrologist'], badge: 'ART' },
  { id: 'ipd',              href: '/ipd',                       icon: BedDouble,       label: 'IPD Bedboard',       roles: ['admin','doctor','nurse','receptionist','accounts'] },
  { id: 'pharmacy',         href: '/pharmacy',                  icon: Pill,            label: 'Pharmacy & Stock',   roles: ['admin','pharma','pharmacist','doctor'] },
  { id: 'lims',             href: '/lims',                      icon: FlaskConical,    label: 'LIMS & HL7 Lab',     roles: ['admin','doctor','andrologist','embryologist'] },
  { id: 'billing',          href: '/billing',                   icon: ReceiptText,     label: 'Billing & Cashier',  roles: ['admin','receptionist','accounts','pharma','pharmacist','doctor'] },
];

export default function IconRail() {
  const pathname = usePathname();
  const { user, activeRole, currentBranch } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebar();

  const currentRole = (activeRole || user?.role || 'admin').toLowerCase();
  const visibleItems = navItems.filter((item) =>
    currentRole === 'admin' || item.roles.map((r) => r.toLowerCase()).includes(currentRole)
  );
  const activeItem   = visibleItems.find((item) => pathname.startsWith(item.href));

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-white/10 z-20 flex-shrink-0 h-screen sticky top-0 print:hidden transition-[width] duration-200 ease-in-out bg-rail-bg",
        isExpanded ? 'w-60' : 'w-[60px]'
      )}
    >
      {/* Top Header / Brand */}
      {isExpanded ? (
        <div className="px-3.5 pt-3.5 pb-2.5 flex items-center justify-between gap-2 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 flex-1 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-white/5 group-hover:bg-white/10 transition-colors">
              <Image src="/logo.svg" alt="VaidyaMD" width={28} height={28} priority />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight leading-none text-white">
                Vaidya<span className="text-accent">MD</span>
              </p>
              <p className="text-[10px] leading-tight text-white/40 font-medium truncate mt-1">
                Fertility &amp; ART HMS
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            title="Collapse sidebar (Compact Mode)"
            aria-label="Collapse sidebar"
            className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center pt-3 pb-2 flex-shrink-0">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center mb-2 flex-shrink-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
            title="VaidyaMD HMS Dashboard"
          >
            <Image src="/logo.svg" alt="VaidyaMD" width={34} height={34} priority />
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expand sidebar (Full Menu)"
            aria-label="Expand sidebar"
            className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
          <div className="w-8 h-px mt-2 bg-white/10" />
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 w-full flex flex-col gap-1 p-2 overflow-y-auto hide-scrollbar">
        {visibleItems.map((item) => {
          const isActive = activeItem?.id === item.id;
          const Icon = item.icon;

          if (isExpanded) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 group cursor-pointer",
                  isActive
                    ? "bg-accent/20 text-white font-semibold shadow-2xs"
                    : "text-white/65 hover:text-white hover:bg-white/8 font-normal"
                )}
              >
                {/* Left Active Accent Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                )}

                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn("w-[18px] h-[18px] flex-shrink-0", isActive ? "text-accent" : "text-white/60 group-hover:text-white")}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  <span className="text-xs truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex-shrink-0 bg-accent/20 text-accent border border-accent/35">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          // Collapsed Icon Rail item with Tooltip
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "relative w-full aspect-square flex items-center justify-center rounded-lg transition-colors duration-150 cursor-pointer",
                    isActive
                      ? "bg-accent/20 text-accent"
                      : "text-white/50 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2 : 1.75} />
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-semibold text-xs">{item.label}</p>
                {item.badge && (
                  <span className="text-[10px] font-bold text-accent">
                    {item.badge}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom: Settings + User Section */}
      <div className="w-full p-2 flex flex-col gap-1.5 mt-auto border-t border-white/10">
        {/* Admin Master Settings */}
        {user?.role === 'admin' && (
          isExpanded ? (
            <Link
              href="/settings"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10 text-xs font-medium"
            >
              <Settings className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
              <span className="truncate">Master Settings</span>
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className="w-full aspect-square flex items-center justify-center rounded-lg transition-colors duration-150 text-white/50 hover:text-white hover:bg-white/10"
                >
                  <Settings className="w-[18px] h-[18px]" strokeWidth={1.75} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-semibold text-xs">Master Settings</p>
              </TooltipContent>
            </Tooltip>
          )
        )}

        {/* User Card / Avatar */}
        {isExpanded ? (
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2.5">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0 bg-primary-mid border border-white/20">
                {user?.name?.slice(0, 2).toUpperCase() || 'DR'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.name || 'Doctor'}
              </p>
              <p className="text-[10px] text-white/50 truncate leading-tight mt-0.5">
                {roleLabels[activeRole] || activeRole}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-0.5" title={`${user?.name || 'Doctor'} (${roleLabels[activeRole] || activeRole})`}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold bg-primary-mid border border-white/20">
                {user?.name?.slice(0, 2).toUpperCase() || 'DR'}
              </div>
            )}
          </div>
        )}

        {/* Bottom Collapse Button (Expanded Mode Only) */}
        {isExpanded && (
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
            <span>Collapse Menu</span>
          </button>
        )}
      </div>
    </aside>
  );
}
