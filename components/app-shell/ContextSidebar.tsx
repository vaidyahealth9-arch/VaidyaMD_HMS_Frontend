'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ContextSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get('tab') || searchParams.get('status') || searchParams.get('filter');

  // Check if we are inside a specific patient's profile: /patients/[id]
  const isPatientProfile = pathname.startsWith('/patients/') && pathname !== '/patients/register';
  const patientId = isPatientProfile ? pathname.split('/')[2] : null;

  if (isPatientProfile && patientId) {
    const patientTabs = [
      { id: 'overview', href: `/patients/${patientId}?tab=overview`, icon: '👤', label: 'Overview' },
      { id: 'visits', href: `/patients/${patientId}?tab=visits`, icon: '📋', label: 'Visits & Rx' },
      { id: 'investigations', href: `/patients/${patientId}?tab=investigations`, icon: '🔬', label: 'Investigations & USG' },
      { id: 'treatment', href: `/patients/${patientId}?tab=treatment`, icon: '🧫', label: 'Treatment Cycles' },
      { id: 'andrology', href: `/patients/${patientId}?tab=andrology`, icon: '🧪', label: 'Andrology Lab' },
      { id: 'billing', href: `/patients/${patientId}?tab=billing`, icon: '💰', label: 'Billing & Wallet' },
      { id: 'documents', href: `/patients/${patientId}?tab=documents`, icon: '📁', label: 'Consents & Docs' },
    ];

    return (
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-0 hidden md:flex flex-shrink-0 print:hidden">
        <div className="p-3 border-b border-slate-100 flex flex-col gap-1.5">
          <Link
            href="/patients"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <span>←</span> Patient Directory
          </Link>
          <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mt-1">
            Patient Portal EMR
          </p>
        </div>

        <div className="flex-1 py-3 px-2 space-y-1">
          {patientTabs.map((item) => {
            const isTabActive = (searchParams.get('tab') || 'overview') === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all
                  ${isTabActive
                    ? 'font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm'
                    : 'font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isTabActive && <span className="text-indigo-600 text-xs font-bold">›</span>}
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  // General module sidebars
  const sidebarConfig: Record<string, { label?: string; items: any[] }[]> = {
    '/dashboard': [
      {
        items: [
          { id: 'overview', href: '/dashboard', icon: '📈', label: 'Overview' },
          { id: 'analytics', href: '/analytics', icon: '🧬', label: 'Clinical Analytics' },
          { id: 'billing', href: '/billing', icon: '💵', label: 'Billing Invoices' },
        ],
      },
    ],
    '/patients': [
      {
        label: 'Patient Directory',
        items: [
          { id: 'all-patients', href: '/patients', icon: '👥', label: 'All Patients' },
          { id: 'register', href: '/patients/register', icon: '➕', label: 'Register Patient' },
        ],
      },
      {
        label: 'Category Filters',
        items: [
          { id: 'donors-bank', href: '/patients?filter=donor_bank', icon: '🏦', label: 'ART Bank Donors' },
          { id: 'donors-hospital', href: '/patients?filter=donor_hospital', icon: '🏥', label: 'Hospital Donors' },
        ],
      },
    ],
    '/appointments': [
      {
        label: 'Schedule & Queues',
        items: [
          { id: 'today', href: '/appointments', icon: '📋', label: "Today's Queue", statusDot: 'green' },
          { id: 'all-appts', href: '/appointments?status=all', icon: '📅', label: 'All Scheduled' },
          { id: 'waiting', href: '/appointments?status=waiting', icon: '⏳', label: 'Waiting Room' },
          { id: 'in_progress', href: '/appointments?status=in_progress', icon: '🩺', label: 'In Consultation' },
        ],
      },
    ],
    '/ivf-lab': [
      {
        label: 'Embryology & IVF',
        items: [
          { id: 'embryology', href: '/ivf-lab?tab=embryology', icon: '🧫', label: 'Embryology Suite' },
          { id: 'cryo-bank', href: '/ivf-lab?tab=cryopreservation', icon: '❄️', label: 'Cryo Bank Coordinates' },
        ],
      },
      {
        label: 'Andrology Lab',
        items: [
          { id: 'semen-queue', href: '/ivf-lab?tab=andrology', icon: '🔬', label: 'CASA Semen Analysis' },
          { id: 'qc', href: '/ivf-lab?tab=qc', icon: '🛡️', label: 'Safety & Gas QC' },
        ],
      },
    ],
    '/billing': [
      {
        label: 'Financial Desk',
        items: [
          { id: 'invoices', href: '/billing?tab=invoices', icon: '📑', label: 'Invoices & Receipts' },
          { id: 'pending', href: '/billing?tab=invoices&status=pending', icon: '⏳', label: 'Pending Dues' },
          { id: 'packages', href: '/billing?tab=packages', icon: '📦', label: 'Treatment Packages' },
        ],
      },
    ],
    '/pharmacy': [
      {
        label: 'Dispensary',
        items: [
          { id: 'inventory', href: '/pharmacy?tab=inventory', icon: '📦', label: 'Stock Registry' },
          { id: 'dispensary', href: '/pharmacy?tab=pos', icon: '🏪', label: 'Point of Sale (POS)' },
        ],
      },
    ],
    '/opd': [
      {
        label: 'Outpatient Clinic',
        items: [
          { id: 'opd-queue', href: '/opd', icon: '📋', label: 'OPD Patient Queue', statusDot: 'green' },
        ],
      },
    ],
    '/ipd': [
      {
        label: 'Inpatient Ward',
        items: [
          { id: 'ipd-beds', href: '/ipd', icon: '🛏️', label: 'Bedboard & Admissions', statusDot: 'green' },
          { id: 'ipd-nursing', href: '/ipd?tab=nursing', icon: '💊', label: 'Nursing Checklists' },
          { id: 'ipd-history', href: '/ipd?tab=history', icon: '📋', label: 'Discharge History' },
        ],
      },
    ],
  };

  const activeModule = Object.keys(sidebarConfig).find((key) => pathname.startsWith(key)) || '/dashboard';
  const sections = sidebarConfig[activeModule] || [];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-0 hidden md:flex flex-shrink-0 print:hidden">
      <div className="flex-1 py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const currentTab = searchParams.get('tab');
                const currentStatus = searchParams.get('status');
                let isActive = false;
                if (item.href.includes('?')) {
                  const [itemPath, itemQuery] = item.href.split('?');
                  const itemParams = new URLSearchParams(itemQuery);
                  const pathMatches = pathname === itemPath;
                  const tabMatches = !itemParams.has('tab') || itemParams.get('tab') === (currentTab || (itemPath === '/billing' ? 'invoices' : itemPath === '/pharmacy' ? 'inventory' : null));
                  const statusMatches = !itemParams.has('status') || itemParams.get('status') === currentStatus;
                  isActive = pathMatches && tabMatches && statusMatches;
                } else {
                  isActive = pathname === item.href && (!currentStatus || currentStatus === 'all' || item.id === 'today');
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150
                      ${isActive
                        ? 'font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 shadow-sm'
                        : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.statusDot && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
