'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  Receipt,
  Users,
  UserPlus,
  Building2,
  CalendarDays,
  Clock,
  Stethoscope,
  FlaskConical,
  Snowflake,
  Microscope,
  ShieldCheck,
  Package,
  ShoppingCart,
  BedDouble,
  ClipboardList,
  History,
  FileText,
  CreditCard,
  FolderOpen,
  TestTube2,
  Sparkles,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  Activity,
  Pill,
  BookOpen,
} from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

// ─── Patient profile tabs ─────────────────────────────────────────────────────
const PATIENT_TABS = [
  { id: 'overview',        icon: User,          label: 'Overview' },
  { id: 'visits',          icon: BookOpen,       label: 'Visits & Rx' },
  { id: 'investigations',  icon: Microscope,     label: 'Investigations & USG' },
  { id: 'treatment',       icon: Activity,       label: 'Treatment Cycles' },
  { id: 'andrology',       icon: TestTube2,      label: 'Andrology Lab' },
  { id: 'cosgyn',          icon: Sparkles,       label: 'Cosmetic Gynae' },
  { id: 'billing',         icon: CreditCard,     label: 'Billing & Wallet' },
  { id: 'documents',       icon: FolderOpen,     label: 'Consents & Docs' },
];

// ─── Module sidebar config ───────────────────────────────────────────────────
const sidebarConfig: Record<string, { label?: string; items: { id: string; href: string; icon: React.ElementType; label: string; statusDot?: boolean }[] }[]> = {
  '/dashboard': [
    {
      items: [
        { id: 'overview',  href: '/dashboard',            icon: LayoutDashboard, label: 'Overview' },
        { id: 'analytics', href: '/dashboard/analytics',  icon: LineChart,       label: 'Analytics' },
        { id: 'billing',   href: '/billing',              icon: Receipt,         label: 'Billing Invoices' },
      ],
    },
  ],
  '/patients': [
    {
      label: 'Patient Directory',
      items: [
        { id: 'all-patients', href: '/patients',          icon: Users,    label: 'All Patients' },
        { id: 'register',     href: '/patients/register', icon: UserPlus, label: 'Register Patient' },
      ],
    },
    {
      label: 'Category Filters',
      items: [
        { id: 'donors-bank',     href: '/patients?filter=donor_bank',     icon: Building2, label: 'ART Bank Donors' },
        { id: 'donors-hospital', href: '/patients?filter=donor_hospital',  icon: Building2, label: 'Hospital Donors' },
      ],
    },
  ],
  '/appointments': [
    {
      label: 'Schedule & Queues',
      items: [
        { id: 'today',       href: '/appointments',                icon: CalendarDays, label: "Today's Queue",    statusDot: true },
        { id: 'all-appts',   href: '/appointments?status=all',    icon: CalendarDays, label: 'All Scheduled' },
        { id: 'waiting',     href: '/appointments?status=waiting', icon: Clock,        label: 'Waiting Room' },
        { id: 'in_progress', href: '/appointments?status=in_progress', icon: Stethoscope, label: 'In Consultation' },
      ],
    },
  ],
  '/ivf-lab': [
    {
      label: 'Embryology & IVF',
      items: [
        { id: 'embryology', href: '/ivf-lab?tab=embryology',      icon: FlaskConical, label: 'Embryology Suite' },
        { id: 'cryo-bank',  href: '/ivf-lab?tab=cryopreservation', icon: Snowflake,    label: 'Cryo Bank Coordinates' },
      ],
    },
    {
      label: 'Andrology Lab',
      items: [
        { id: 'semen-queue', href: '/ivf-lab?tab=andrology', icon: Microscope,  label: 'CASA Semen Analysis' },
        { id: 'qc',          href: '/ivf-lab?tab=qc',        icon: ShieldCheck, label: 'Safety & Gas QC' },
      ],
    },
  ],
  '/billing': [
    {
      label: 'Financial Desk',
      items: [
        { id: 'invoices',  href: '/billing?tab=invoices',              icon: FileText,   label: 'Invoices & Receipts' },
        { id: 'pending',   href: '/billing?tab=invoices&status=pending', icon: Clock,    label: 'Pending Dues' },
        { id: 'packages',  href: '/billing?tab=packages',              icon: Package,    label: 'Treatment Packages' },
      ],
    },
  ],
  '/pharmacy': [
    {
      label: 'Dispensary',
      items: [
        { id: 'inventory',  href: '/pharmacy?tab=inventory', icon: Package,      label: 'Stock Registry' },
        { id: 'dispensary', href: '/pharmacy?tab=pos',       icon: ShoppingCart, label: 'Point of Sale (POS)' },
      ],
    },
  ],
  '/cosgyn': [
    {
      label: 'Cosmetic Gynecology',
      items: [
        { id: 'schedule', href: '/cosgyn', icon: Sparkles, label: 'Equipment Schedule' },
      ],
    },
  ],
  '/ipd': [
    {
      label: 'Inpatient Ward',
      items: [
        { id: 'ipd-beds',    href: '/ipd',               icon: BedDouble,    label: 'Bedboard & Admissions', statusDot: true },
        { id: 'ipd-nursing', href: '/ipd?tab=nursing',   icon: Pill,         label: 'Nursing Checklists' },
        { id: 'ipd-history', href: '/ipd?tab=history',   icon: History,      label: 'Discharge History' },
      ],
    },
  ],
  '/lims': [
    {
      label: 'Laboratory',
      items: [
        { id: 'lims-queue', href: '/lims', icon: TestTube2, label: 'Lab Order Queue', statusDot: true },
      ],
    },
  ],
};

// ─── Nav item component ───────────────────────────────────────────────────────
function SideNavItem({
  href,
  icon: Icon,
  label,
  isActive,
  statusDot,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  statusDot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors duration-100"
      style={{
        color:      isActive ? 'rgb(var(--clr-primary))' : 'rgb(var(--clr-text-muted))',
        background: isActive ? 'rgb(var(--clr-primary-light) / 0.18)' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        borderLeft: isActive ? '2px solid rgb(var(--clr-primary))' : '2px solid transparent',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
        <span className="leading-snug">{label}</span>
      </div>
      {statusDot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: 'rgb(var(--clr-success))' }}
        />
      )}
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ContextSidebar() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { isContextSidebarOpen, toggleContextSidebar } = useSidebar();

  // Patient profile detection
  const isPatientProfile = pathname.startsWith('/patients/') && pathname !== '/patients/register';
  const patientId        = isPatientProfile ? pathname.split('/')[2] : null;

  // General module sidebar
  const activeModule = Object.keys(sidebarConfig).find((key) => pathname.startsWith(key));
  const sections = activeModule ? sidebarConfig[activeModule] : [];

  if (!isPatientProfile && (!activeModule || sections.length === 0)) {
    return null;
  }

  // When context sidebar is collapsed
  if (!isContextSidebarOpen) {
    return (
      <aside
        className="w-8 flex flex-col items-center py-2 z-0 hidden md:flex flex-shrink-0 print:hidden border-r bg-[rgb(var(--clr-surface))]"
        style={{ borderColor: 'rgb(var(--clr-border))' }}
      >
        <button
          type="button"
          onClick={toggleContextSidebar}
          title="Expand submenu"
          aria-label="Expand submenu"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer mb-3"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-slate-400 [writing-mode:vertical-lr] rotate-180 uppercase tracking-widest select-none">
            {isPatientProfile ? 'EMR Tabs' : 'Submenu'}
          </span>
        </div>
      </aside>
    );
  }

  if (isPatientProfile && patientId) {
    return (
      <aside
        className="w-56 flex flex-col overflow-y-auto z-0 hidden md:flex flex-shrink-0 print:hidden transition-[width] duration-200"
        style={{
          background:   'rgb(var(--clr-surface))',
          borderRight:  '1px solid rgb(var(--clr-border))',
        }}
      >
        {/* Back + section label + collapse button */}
        <div className="px-3 py-2.5 flex items-start justify-between border-b" style={{ borderColor: 'rgb(var(--clr-border))' }}>
          <div>
            <Link
              href="/patients"
              className="flex items-center gap-1.5 text-xs font-medium transition-colors mb-1.5 hover:text-slate-900"
              style={{ color: 'rgb(var(--clr-text-muted))' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Patient Directory
            </Link>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgb(var(--clr-text-subtle))' }}
            >
              Patient Portal EMR
            </p>
          </div>
          <button
            type="button"
            onClick={toggleContextSidebar}
            title="Collapse EMR tabs"
            aria-label="Collapse EMR tabs"
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 py-2 px-2 space-y-0.5">
          {PATIENT_TABS.map((item) => {
            const isTabActive = (searchParams.get('tab') || 'overview') === item.id;
            return (
              <SideNavItem
                key={item.id}
                href={`/patients/${patientId}?tab=${item.id}`}
                icon={item.icon}
                label={item.label}
                isActive={isTabActive}
              />
            );
          })}
        </div>
      </aside>
    );
  }

  // General module sidebar
  return (
    <aside
      className="w-52 flex flex-col overflow-y-auto z-0 hidden md:flex flex-shrink-0 print:hidden transition-[width] duration-200"
      style={{
        background:  'rgb(var(--clr-surface))',
        borderRight: '1px solid rgb(var(--clr-border))',
      }}
    >
      <div className="px-3 py-2 flex items-center justify-between border-b" style={{ borderColor: 'rgb(var(--clr-border))' }}>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgb(var(--clr-text-subtle))' }}
        >
          Navigation
        </p>
        <button
          type="button"
          onClick={toggleContextSidebar}
          title="Collapse submenu"
          aria-label="Collapse submenu"
          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2.5 mb-1.5"
                style={{ color: 'rgb(var(--clr-text-subtle))' }}
              >
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const currentTab    = searchParams.get('tab');
                const currentStatus = searchParams.get('status');
                let isActive = false;

                if (item.href.includes('?')) {
                  const [itemPath, itemQuery] = item.href.split('?');
                  const itemParams = new URLSearchParams(itemQuery);
                  const pathMatches   = pathname === itemPath;
                  const defaultTab    = itemPath === '/billing' ? 'invoices' : itemPath === '/pharmacy' ? 'inventory' : null;
                  const tabMatches    = !itemParams.has('tab')    || itemParams.get('tab')    === (currentTab    || defaultTab);
                  const statusMatches = !itemParams.has('status') || itemParams.get('status') === currentStatus;
                  isActive = pathMatches && tabMatches && statusMatches;
                } else {
                  isActive = pathname === item.href && (!currentStatus || currentStatus === 'all' || item.id === 'today');
                }

                return (
                  <SideNavItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={isActive}
                    statusDot={item.statusDot}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
