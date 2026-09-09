'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { roleColors, roleLabels } from '@/lib/utils';
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
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { id: 'dashboard', href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'doctor', 'nurse', 'receptionist', 'embryologist', 'andrologist', 'pharma'] },
  { id: 'opd', href: '/opd', icon: Stethoscope, label: 'OPD Workbench', roles: ['admin', 'doctor', 'nurse'] },
  { id: 'patients', href: '/patients', icon: Users, label: 'Patients & EMR', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { id: 'appointments', href: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { id: 'ivf-lab', href: '/ivf-lab', icon: Microscope, label: 'IVF Embryology', roles: ['admin', 'doctor', 'embryologist', 'andrologist'], badge: 'ART' },
  { id: 'ipd', href: '/ipd', icon: BedDouble, label: 'IPD Bedboard', roles: ['admin', 'doctor', 'nurse', 'receptionist'] },
  { id: 'pharmacy', href: '/pharmacy', icon: Pill, label: 'Pharmacy & Stock', roles: ['admin', 'pharma', 'doctor'] },
  { id: 'lims', href: '/lims', icon: FlaskConical, label: 'LIMS & HL7 Lab', roles: ['admin', 'doctor', 'andrologist', 'embryologist'] },
  { id: 'billing', href: '/billing', icon: ReceiptText, label: 'Billing & Cashier', roles: ['admin', 'receptionist', 'doctor'] },
  { id: 'analytics', href: '/analytics', icon: TrendingUp, label: 'Revenue & Leakage', roles: ['admin', 'doctor'] },
];

export default function IconRail() {
  const pathname = usePathname();
  const { user, activeRole } = useAuth();

  const visibleItems = navItems.filter((item) => item.roles.includes(activeRole || 'admin'));
  const activeItem = visibleItems.find((item) => pathname.startsWith(item.href));

  return (
    <aside className="w-16 bg-slate-900 flex flex-col items-center py-4 border-r border-slate-800 z-20 shadow-xl flex-shrink-0 h-screen sticky top-0 print:hidden">
      {/* Logo */}
      <Link href="/dashboard" className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl flex items-center justify-center font-bold text-sm mb-6 shadow-lg shadow-indigo-500/30 flex-shrink-0 hover:scale-105 transition-transform">
        VM
      </Link>

      {/* Nav Icons */}
      <nav className="flex-1 w-full flex flex-col gap-1.5 px-2 overflow-y-auto hide-scrollbar">
        {visibleItems.map((item) => {
          const isActive = activeItem?.id === item.id;
          const Icon = item.icon;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`
                    w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                  {isActive && (
                    <span className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-400 rounded-full" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                <p className="font-semibold">{item.label}</p>
                {item.badge && <span className="text-[10px] text-indigo-400 font-bold">{item.badge}</span>}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom: Settings (Admin Only) + User Avatar */}
      <div className="w-full px-2 flex flex-col gap-2 mt-auto pt-2 border-t border-slate-800">
        {user?.role === 'admin' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="w-full aspect-square text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center justify-center"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <p className="font-semibold">Master Settings</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* User avatar */}
        <div className="relative mx-auto cursor-pointer group" title={`${user?.name || 'Doctor'} (${roleLabels[activeRole] || activeRole})`}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} className="w-9 h-9 rounded-full object-cover border-2 border-slate-700 shadow-md" />
          ) : (
            <div className={`w-9 h-9 rounded-full border-2 border-slate-700 flex items-center justify-center text-white text-xs font-bold ${roleColors[activeRole] || 'bg-indigo-600'}`}>
              {user?.name?.slice(0, 2).toUpperCase() || 'DR'}
            </div>
          )}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
