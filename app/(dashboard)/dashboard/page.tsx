'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentsApi, patientsApi, treatmentCyclesApi, billingApi } from '@/lib/api';
import { formatDateTime, statusColors, statusLabels, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

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

  const dynamicStatCards = [
    {
      label: "Today's Appointments",
      value: appointments.length.toString(),
      icon: '🏥',
      color: 'bg-indigo-50 border-indigo-100',
      textColor: 'text-indigo-700',
      trend: appointments.length > 0 ? `${appointments.filter(a => a.status === 'in_progress').length} currently in consultation` : 'No appointments scheduled for today',
    },
    {
      label: 'Registered Patients',
      value: patientCount.toString(),
      icon: '👥',
      color: 'bg-blue-50 border-blue-100',
      textColor: 'text-blue-700',
      trend: patientCount > 0 ? `${patientCount} active patient/couple files` : 'Clean database — 0 patient records',
    },
    {
      label: 'Active IVF / ART Cycles',
      value: activeCycleCount.toString(),
      icon: '🧫',
      color: 'bg-violet-50 border-violet-100',
      textColor: 'text-violet-700',
      trend: activeCycleCount > 0 ? `${activeCycleCount} running stimulation/FET protocols` : 'No active treatment cycles running',
    },
    {
      label: 'Pending Invoices & Dues',
      value: pendingDuesTotal > 0 ? `₹${pendingDuesTotal.toLocaleString()}` : '₹0',
      icon: '💰',
      color: 'bg-amber-50 border-amber-100',
      textColor: 'text-amber-700',
      trend: pendingInvoicesCount > 0 ? `${pendingInvoicesCount} invoices pending settlement` : 'All invoices cleared & up to date',
    },
  ];

  const quickActions = [
    { label: 'Register Patient', href: '/patients/register', icon: '➕', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { label: 'Schedule Appointment', href: '/appointments', icon: '📅', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
    { label: 'Generate Invoice', href: '/billing', icon: '📄', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
    { label: 'IVF Lab Console', href: '/ivf-lab', icon: '🔬', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200' },
  ];

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}<span className="font-semibold text-indigo-600">{user?.hospital_name || 'VaidyaMD Fertility & ART Centre'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full w-fit">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-indigo-700">Fertility + OPD System Live</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${action.color}`}
          >
            <span>{action.icon}</span>
            {action.label}
          </Link>
        ))}
      </div>

      {/* Real Dynamic Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {dynamicStatCards.map((card) => (
          <div key={card.label} className={`${card.color} border rounded-3xl p-5 space-y-3 hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`text-3xl font-black ${card.textColor}`}>{card.value}</p>
            <p className="text-xs text-slate-500">{card.trend}</p>
          </div>
        ))}
      </div>

      {/* Today's Schedule */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Today's Appointment Queue</h2>
            <p className="text-xs text-slate-500">{appointments.length} appointments scheduled</p>
          </div>
          <Link href="/appointments" className="text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors">
            View Schedule Queue →
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-3xl">📋</p>
            <p className="text-xs font-semibold text-slate-500">No appointments scheduled for today.</p>
            <Link href="/appointments" className="text-xs text-indigo-600 font-bold hover:underline inline-block mt-1">
              + Schedule New Patient Appointment
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.slice(0, 5).map((apt: any) => (
              <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                    {apt.patient_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-xs">{apt.patient_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {apt.department} · Dr. {apt.doctor_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(apt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusColors[apt.status]}`}>
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
