'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi, patientsApi, treatmentCyclesApi, billingApi } from '@/lib/api';
import { formatDateTime, statusColors, statusLabels, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { CalendarDays, Users, Activity, CreditCard, UserPlus, Calendar, Receipt, Microscope } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';

export default function DashboardPage() {
  const { user, activeRole } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patientCount, setPatientCount] = useState(0);
  const [activeCycleCount, setActiveCycleCount] = useState(0);
  const [pendingDuesTotal, setPendingDuesTotal] = useState(0);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      appointmentsApi.list({ date_filter: today }).catch(() => ({ appointments: [] })),
      patientsApi.list({ per_page: 100 }).catch(() => ({ patients: [], total: 0 })),
      treatmentCyclesApi.list({ status: 'running' }).catch(() => []),
      billingApi.listInvoices({ status: 'pending' }).catch(() => []),
    ]).then(([aptData, patData, cycleData, invData]: any) => {
      setAppointments(aptData?.appointments || []);
      setPatientCount(patData?.total || patData?.patients?.length || 0);
      const cycles = Array.isArray(cycleData) ? cycleData : [];
      setActiveCycleCount(cycles.length);
      const invs = Array.isArray(invData) ? invData : [];
      setPendingInvoicesCount(invs.length);
      const dues = invs.reduce((acc: number, item: any) => acc + (parseFloat(item.pending_due) || 0), 0);
      setPendingDuesTotal(dues);
    }).finally(() => setIsLoading(false));
  }, []);

  const statCards = [
    {
      label: "Today's Appointments",
      value: appointments.length.toString(),
      icon: CalendarDays,
      sub: appointments.length > 0
        ? `${appointments.filter(a => a.status === 'in_progress').length} in consultation`
        : 'No appointments today',
    },
    {
      label: 'Registered Patients',
      value: patientCount.toString(),
      icon: Users,
      sub: patientCount > 0 ? `${patientCount} active files` : 'No records yet',
    },
    {
      label: 'Active IVF / ART Cycles',
      value: activeCycleCount.toString(),
      icon: Activity,
      sub: activeCycleCount > 0 ? `${activeCycleCount} running protocols` : 'No active cycles',
    },
    {
      label: 'Pending Dues',
      value: pendingDuesTotal > 0 ? `₹${pendingDuesTotal.toLocaleString()}` : '₹0',
      icon: CreditCard,
      sub: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} invoices outstanding` : 'All invoices cleared',
    },
  ];

  const quickActions = [
    { label: 'Register Patient',        href: '/patients/register', icon: UserPlus,    primary: true },
    { label: 'Schedule Appointment',    href: '/appointments',      icon: Calendar,    primary: false },
    { label: 'Generate Invoice',        href: '/billing',           icon: Receipt,     primary: false },
    { label: 'IVF Lab Console',         href: '/ivf-lab',           icon: Microscope,  primary: false },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'rgb(var(--clr-text))' }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--clr-text-muted))' }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}
            <span style={{ color: 'rgb(var(--clr-primary))' }}>
              {user?.hospital_name || 'VaidyaMD Fertility & ART Centre'}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium w-fit"
          style={{ background: 'rgb(var(--clr-success-bg))', color: 'rgb(var(--clr-success))', border: '1px solid rgb(var(--clr-success-bg))' }}>
          <span className="status-dot-live" />
          System Live
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
              style={
                action.primary
                  ? { background: 'rgb(var(--clr-primary))', color: 'white', boxShadow: 'var(--shadow-card)' }
                  : { background: 'white', color: 'rgb(var(--clr-text))', border: '1px solid rgb(var(--clr-border))', boxShadow: 'var(--shadow-card)' }
              }
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-lg p-4 space-y-3"
              style={{ background: 'white', border: '1px solid rgb(var(--clr-border))', boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgb(var(--clr-text-subtle))' }}>
                  {card.label}
                </p>
                <div className="w-7 h-7 rounded-md flex items-center justify-center"
                  style={{ background: 'rgb(var(--clr-primary-light))', }}>
                  <Icon className="w-4 h-4" style={{ color: 'rgb(var(--clr-primary))' }} strokeWidth={1.75} />
                </div>
              </div>
              <p className="text-2xl font-semibold font-mono" style={{ color: 'rgb(var(--clr-text))' }}>
                {card.value}
              </p>
              <p className="text-[11px]" style={{ color: 'rgb(var(--clr-text-muted))' }}>{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Today's Schedule */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'white', border: '1px solid rgb(var(--clr-border))', boxShadow: 'var(--shadow-card)' }}>
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: '1px solid rgb(var(--clr-border))' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--clr-text))' }}>Today's Appointment Queue</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--clr-text-muted))' }}>{appointments.length} appointments scheduled</p>
          </div>
          <Link href="/appointments" className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: 'rgb(var(--clr-primary))' }}>
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center">
            <div className="loading-bar" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <CalendarDays className="w-8 h-8 mx-auto" style={{ color: 'rgb(var(--clr-text-subtle))' }} strokeWidth={1} />
            <p className="text-xs font-medium" style={{ color: 'rgb(var(--clr-text-muted))' }}>No appointments scheduled for today.</p>
            <Link href="/appointments" className="text-xs font-medium hover:opacity-80 inline-block"
              style={{ color: 'rgb(var(--clr-primary))' }}>
              + Schedule New Appointment
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
            {appointments.slice(0, 6).map((apt: any) => (
              <div key={apt.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                    style={{ background: 'rgb(var(--clr-primary))' }}>
                    {apt.patient_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'rgb(var(--clr-text))' }}>{apt.patient_name}</p>
                    <p className="text-[11px]" style={{ color: 'rgb(var(--clr-text-muted))' }}>
                      {apt.department} · Dr. {apt.doctor_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono" style={{ color: 'rgb(var(--clr-text-muted))' }}>
                    {new Date(apt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusColors[apt.status]}`}>
                    {statusLabels[apt.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
