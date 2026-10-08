'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { appointmentsApi, patientsApi, authApi, templatesApi } from '@/lib/api';
import { isUserDoctor } from '@/lib/utils';
import {
  CalendarDays,
  Search,
  Plus,
  RefreshCw,
  Building2,
  ChevronDown,
  Check,
  Clock,
  UserCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { toast } from '@/contexts/ToastContext';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import {
  BookAppointmentModal,
  RescheduleAppointmentModal,
  NurseTriageModal,
  AppointmentCardGrid,
  DEFAULT_VISIT_TYPES,
} from '@/components/appointments';

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [dynamicVisitTypes, setDynamicVisitTypes] = useState<any[]>(DEFAULT_VISIT_TYPES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  const [filter, setFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male' | 'other'>('all');
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modals state
  const [showBookModal, setShowBookModal] = useState(false);
  const [rescheduleApt, setRescheduleApt] = useState<any | null>(null);
  const [triageApt, setTriageApt] = useState<any | null>(null);

  // Close department dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live timer for queue wait times
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const aptParams: any = {};
      if (selectedDate) {
        aptParams.date_filter = selectedDate;
      }

      const [aptRes, patRes, userRes, vtRes] = await Promise.allSettled([
        appointmentsApi.list(aptParams),
        patientsApi.list({ per_page: 500 }),
        authApi.listUsers(),
        templatesApi.list('appointment_visit_type'),
      ]);

      if (vtRes.status === 'fulfilled' && vtRes.value && Array.isArray(vtRes.value)) {
        setDynamicVisitTypes(vtRes.value);
      }

      if (aptRes.status === 'fulfilled' && aptRes.value) {
        const list = Array.isArray(aptRes.value.appointments) ? aptRes.value.appointments : (Array.isArray(aptRes.value) ? aptRes.value : []);
        setAppointments(list);
      }

      if (patRes.status === 'fulfilled' && patRes.value) {
        const pts = patRes.value.patients || [];
        setPatients(pts);
      }

      if (userRes.status === 'fulfilled' && userRes.value) {
        const uList = Array.isArray(userRes.value) ? userRes.value : [];
        let docs = uList.filter((u: any) => isUserDoctor(u));
        if (docs.length === 0) {
          docs = uList.filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            return r === 'doctor' || r === 'admin';
          });
        }
        setDoctors(docs);
      }
    } catch (err: any) {
      if (!silent) {
        toast.error('Failed to load data', err.message || 'Check your connection');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const poll = setInterval(() => loadData(true), 30000);
    return () => clearInterval(poll);
  }, [selectedDate]);

  const updateStatus = async (id: string, status: string) => {
    await appointmentsApi.update(id, { status });
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleStartConsultation = async (apt: any) => {
    try {
      if (apt.status === 'waiting') {
        await appointmentsApi.update(apt.id, { status: 'in_progress' });
      }
      router.push(`/patients/${apt.patient_id}?tab=workbench&appointment_id=${apt.id}`);
    } catch (err: any) {
      toast.error('Could not start consultation', err.message);
    }
  };

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.department) set.add(a.department);
    });
    doctors.forEach((d) => {
      if (d.specialization) set.add(d.specialization);
      (d.departments || []).forEach((dept: string) => set.add(dept));
    });
    return Array.from(set).filter(Boolean).sort();
  }, [appointments, doctors]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (doctorFilter !== 'all' && a.doctor_id !== doctorFilter) return false;
      if (genderFilter !== 'all') {
        const aptGender = (a.patient_gender || patients.find((p) => p.id === a.patient_id)?.gender || '').toLowerCase();
        if (aptGender !== genderFilter.toLowerCase()) return false;
      }
      if (departmentFilters.length > 0) {
        const aptDept = a.department || 'Fertility & IVF';
        if (!departmentFilters.includes(aptDept)) return false;
      }
      if (searchQuery && !a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [appointments, filter, doctorFilter, genderFilter, departmentFilters, searchQuery, patients]);

  const waitingCount = appointments.filter((a) => a.status === 'waiting').length;
  const inProgressCount = appointments.filter((a) => a.status === 'in_progress').length;
  const scheduledCount = appointments.filter((a) => a.status === 'scheduled').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Appointment Queue"
        subtitle="Fertility clinic roster, waiting queue & consultation triage"
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md hidden sm:flex">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-emerald-800">
                {inProgressCount} In Cabin
              </span>
            </div>

            <Button
              onClick={() => setShowBookModal(true)}
              className="gap-1.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs h-9 rounded-md shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </Button>
          </div>
        }
      />

      {/* Date & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[rgb(var(--clr-primary))]"
          />
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
              !selectedDate ? 'bg-primary text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Dates
          </button>
          <button
            type="button"
            onClick={() => loadData()}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 w-40"
            />
          </div>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="all">All Consultants</option>
            {doctors.map((doc) => {
              const docName = (doc.name || doc.email || '').trim();
              const formattedName = /^dr\.?\s+/i.test(docName) ? docName : `Dr. ${docName}`;
              return (
                <option key={doc.id} value={doc.id}>
                  {formattedName}
                </option>
              );
            })}
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
          >
            <option value="all">All Genders</option>
            <option value="female">Female ♀</option>
            <option value="male">Male ♂</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Unified Tab Bar */}
      <TabBar
        activeTab={filter}
        onChange={(v) => setFilter(v)}
        tabs={[
          { id: 'all', label: 'All Appointments', icon: Calendar, badge: appointments.length || undefined },
          { id: 'waiting', label: 'Waiting in OPD', icon: Clock, badge: waitingCount || undefined },
          { id: 'in_progress', label: 'In Cabin', icon: UserCheck, badge: inProgressCount || undefined },
          { id: 'scheduled', label: 'Scheduled', icon: CalendarDays, badge: scheduledCount || undefined },
          { id: 'completed', label: 'Completed', icon: CheckCircle2, badge: completedCount || undefined },
        ]}
      />

      {/* Appointment Queue Grid */}
      <AppointmentCardGrid
        appointments={filteredAppointments}
        patients={patients}
        isLoading={isLoading}
        currentTime={currentTime}
        onStatusChange={updateStatus}
        onStartConsultation={handleStartConsultation}
        onReschedule={(apt) => setRescheduleApt(apt)}
        onTriage={(apt) => setTriageApt(apt)}
      />

      {/* Modals */}
      <BookAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={() => loadData(true)}
        patients={patients}
        doctors={doctors}
        appointments={appointments}
        dynamicVisitTypes={dynamicVisitTypes}
      />

      <RescheduleAppointmentModal
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        onSuccess={() => loadData(true)}
        appointment={rescheduleApt}
        doctors={doctors}
      />

      <NurseTriageModal
        isOpen={!!triageApt}
        onClose={() => setTriageApt(null)}
        onSuccess={() => loadData(true)}
        appointment={triageApt}
      />
    </PageLayout>
  );
}
