'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { appointmentsApi, patientsApi, authApi } from '@/lib/api';
import { statusColors, statusLabels, formatDateTime, isUserDoctor } from '@/lib/utils';
import { toast } from '@/contexts/ToastContext';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  X,
  Plus,
  Stethoscope,
  Check,
  Activity,
  Sparkles,
  Search,
  User as UserIcon,
  Users,
  AlertCircle,
  Info,
  Heart,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Clock3,
  CalendarDays,
  ShieldAlert,
  MessageSquare,
  Send,
  UserPlus,
  Bell,
} from 'lucide-react';

const statusOrder = ['in_progress', 'waiting', 'scheduled', 'completed', 'cancelled'];

interface FertilityVisitType {
  id: string;
  label: string;
  badge: string;
  color: string;
  desc: string;
  prepTip: string;
  defaultNotes: string;
  duration: string;
}

/** Specialized Fertility Clinical Visit Types with Clinical Prep Rules */
const fertilityVisitTypes: FertilityVisitType[] = [
  {
    id: 'consultation',
    label: 'Consultation',
    badge: 'Clinical Review',
    color: 'border-blue-200 bg-blue-50/60 text-blue-800',
    desc: 'Initial couple fertility assessment or routine review',
    prepTip: 'Both partners recommended for initial workup',
    defaultNotes: 'Initial fertility evaluation & history',
    duration: '30m',
  },
  {
    id: 'tvs_scan',
    label: 'TVS Follicular Scan',
    badge: 'Ultrasound',
    color: 'border-purple-200 bg-purple-50/60 text-purple-800',
    desc: 'Cycle follicular monitoring & endometrial tracking',
    prepTip: 'Empty bladder immediately before scan',
    defaultNotes: 'Follicular scan (Day of cycle tracking)',
    duration: '15m',
  },
  {
    id: 'opu_procedure',
    label: 'OPU (Egg Retrieval)',
    badge: 'OT Daycare',
    color: 'border-rose-200 bg-rose-50/60 text-rose-800',
    desc: 'Ovum pick-up procedure under IV sedation',
    prepTip: 'Strict fasting 6h; check trigger timing (34-36h prior)',
    defaultNotes: 'OPU Ovum Pick Up procedure',
    duration: '60m',
  },
  {
    id: 'embryo_transfer',
    label: 'Embryo Transfer (FET/Fresh)',
    badge: 'OT Transfer',
    color: 'border-emerald-200 bg-emerald-50/60 text-emerald-800',
    desc: 'Ultrasound-guided blastocyst/cleavage transfer',
    prepTip: 'Full bladder required; drink 3 glasses water 45m prior',
    defaultNotes: 'Embryo transfer procedure',
    duration: '30m',
  },
  {
    id: 'semen_analysis',
    label: 'Semen Analysis / Collection',
    badge: 'Andrology',
    color: 'border-cyan-200 bg-cyan-50/60 text-cyan-800',
    desc: 'Diagnostic workup or sample for IUI/ICSI',
    prepTip: 'Mandatory 2 to 5 days sexual abstinence required',
    defaultNotes: 'Semen sample collection & analysis',
    duration: '30m',
  },
  {
    id: 'iui_procedure',
    label: 'IUI Insemination',
    badge: 'Procedure',
    color: 'border-amber-200 bg-amber-50/60 text-amber-800',
    desc: 'Intrauterine insemination with processed sample',
    prepTip: 'Sample prepared 1-2h prior in andrology lab',
    defaultNotes: 'IUI Insemination procedure',
    duration: '20m',
  },
  {
    id: 'beta_hcg',
    label: 'Beta-hCG / Review',
    badge: 'Outcome',
    color: 'border-teal-200 bg-teal-50/60 text-teal-800',
    desc: 'Post-transfer serum pregnancy test & luteal review',
    prepTip: 'Serum draw at lab followed by doctor consultation',
    defaultNotes: 'Post-transfer Beta-hCG review',
    duration: '15m',
  },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(() => (statusParam && statusParam !== 'today' ? statusParam : 'all'));
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'female' | 'male' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Triage Modal State
  const [triageApt, setTriageApt] = useState<any>(null);
  const [triageForm, setTriageForm] = useState({
    bp: '', hr: '', temp: '', weight: '', spo2: '', chief_complaint: ''
  });
  const [isSavingTriage, setIsSavingTriage] = useState(false);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s === 'today') {
      const d = new Date();
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setSelectedDate(d.toISOString().split('T')[0]);
      setFilter('all');
    } else if (s) {
      setFilter(s);
    }
  }, [searchParams]);

  // Utility to get current local date-time string (YYYY-MM-DDTHH:mm)
  const getNowDateTimeLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Book Appointment Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  
  const getInitialBookForm = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    // Default 10:00 AM on today, or current time if already past 10am
    let defaultTime = `${d.toISOString().split('T')[0]}T10:00`;
    if (d.getHours() >= 10) {
      d.setMinutes(d.getMinutes() + 15);
      defaultTime = d.toISOString().slice(0, 16);
    }

    return {
      patient_id: '',
      doctor_id: '',
      department: 'Fertility & IVF',
      scheduled_at: defaultTime,
      visit_type: 'consultation',
      status: 'scheduled',
      notes: '',
    };
  };
  
  const [bookForm, setBookForm] = useState(getInitialBookForm);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchFocus, setPatientSearchFocus] = useState(false);
  const [notifyPatientSms, setNotifyPatientSms] = useState(true);
  const [notifyPartnerSms, setNotifyPartnerSms] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Reschedule Modal State
  const [rescheduleApt, setRescheduleApt] = useState<any>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduled_at: '',
    doctor_id: '',
  });

  const openReschedule = (apt: any) => {
    setRescheduleForm({
      scheduled_at: apt.scheduled_at.substring(0, 16),
      doctor_id: apt.doctor_id,
    });
    setRescheduleApt(apt);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;

    // Strict validation: must be current or future
    const schedMs = new Date(rescheduleForm.scheduled_at).getTime();
    if (schedMs < Date.now() - 60000) {
      toast.error('Invalid Date/Time', 'Rescheduled appointment cannot be set to a past date or time.');
      return;
    }

    try {
      await appointmentsApi.update(rescheduleApt.id, {
        scheduled_at: new Date(rescheduleForm.scheduled_at).toISOString(),
        doctor_id: rescheduleForm.doctor_id,
      });
      setRescheduleApt(null);
      toast.success('Rescheduled', 'Appointment time updated successfully');
      loadData(true);
    } catch (err: any) {
      toast.error('Failed to reschedule', err.message);
    }
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageApt) return;
    try {
      setIsSavingTriage(true);
      await appointmentsApi.triage(triageApt.id, {
        vitals: {
          bp: triageForm.bp,
          hr: triageForm.hr,
          temp: triageForm.temp,
          weight: triageForm.weight,
          spo2: triageForm.spo2,
        },
        chief_complaint: triageForm.chief_complaint,
      });
      toast.success('Triage Saved', `Recorded clinical vitals for ${triageApt.patient_name}`);
      setTriageApt(null);
      loadData(true);
    } catch (err: any) {
      toast.error('Failed to save triage', err.message);
    } finally {
      setIsSavingTriage(false);
    }
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

  // Time for Wait calculations
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [aptRes, patRes, userRes] = await Promise.allSettled([
        appointmentsApi.list({ date_filter: selectedDate }),
        patientsApi.list({ per_page: 100 }),
        authApi.listUsers(),
      ]);

      if (aptRes.status === 'fulfilled' && aptRes.value) {
        const sorted = (aptRes.value.appointments || []).sort((a: any, b: any) =>
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        );
        setAppointments(sorted);
      }

      if (patRes.status === 'fulfilled' && patRes.value) {
        const pts = patRes.value.patients || [];
        setPatients(pts);
      }

      if (userRes.status === 'fulfilled' && userRes.value) {
        const uList = Array.isArray(userRes.value) ? userRes.value : [];
        let docs = uList.filter((u: any) => isUserDoctor(u));
        // Safe fallback: if none flagged, include doctor or admin role users
        if (docs.length === 0) {
          docs = uList.filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            return r === 'doctor' || r === 'admin';
          });
        }
        setDoctors(docs);

        // If booking form has no doctor selected yet, default to first doctor
        if (docs.length > 0) {
          setBookForm((prev) => {
            if (!prev.doctor_id) {
              const defaultDoc = docs[0];
              const dept = defaultDoc.departments?.[0] || defaultDoc.specialization || 'Fertility / IVF';
              return { ...prev, doctor_id: defaultDoc.id, department: dept };
            }
            return prev;
          });
        }
      }
    } catch (err: any) {
      if (!silent) {
        console.error('loadData error:', err);
        toast.error('Failed to load data', err.message || 'Check your connection');
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const poll = setInterval(() => loadData(true), 30000); // 30 sec silent poll
    return () => clearInterval(poll);
  }, [selectedDate]);

  const updateStatus = async (id: string, status: string) => {
    await appointmentsApi.update(id, { status });
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
  };

  // Handle doctor selection and auto-resolve department
  const handleSelectDoctor = (docId: string) => {
    const doc = doctors.find((d) => d.id === docId);
    const autoDept = doc?.departments?.[0] || doc?.specialization || 'Fertility / IVF';
    setBookForm((prev) => ({
      ...prev,
      doctor_id: docId,
      department: autoDept,
    }));
  };

  // Handle Book Appointment submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patient_id || !bookForm.doctor_id) {
      toast.error('Missing fields', 'Please select both patient and treating consultant');
      return;
    }

    // Strict validation: must be current or future
    const schedMs = new Date(bookForm.scheduled_at).getTime();
    if (schedMs < Date.now() - 60000) {
      toast.error('Invalid Date/Time', 'Appointment cannot be booked in the past. Please select current or future time.');
      return;
    }

    setIsBooking(true);
    try {
      await appointmentsApi.create({
        ...bookForm,
        scheduled_at: new Date(bookForm.scheduled_at).toISOString(),
      });
      setShowBookModal(false);
      setBookForm(getInitialBookForm());
      setPatientSearchTerm('');
      toast.success(
        'Appointment Confirmed',
        bookForm.status === 'waiting' 
          ? 'Patient directly checked into the OPD Waiting Queue.' 
          : 'Appointment scheduled on the clinical roster.'
      );
      loadData(true);
    } catch (err: any) {
      toast.error('Booking Failed', err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const statusFilters = ['all', 'waiting', 'in_progress', 'scheduled', 'completed'];

  // Doctor conflict detector for selected time slot in booking modal
  const conflictingDoctorAppointments = useMemo(() => {
    if (!bookForm.doctor_id || !bookForm.scheduled_at) return [];
    const targetDate = bookForm.scheduled_at.split('T')[0];
    const targetTimeMs = new Date(bookForm.scheduled_at).getTime();
    return appointments.filter((a) => {
      if (a.doctor_id !== bookForm.doctor_id) return false;
      if (a.status === 'cancelled') return false;
      const aptTimeMs = new Date(a.scheduled_at).getTime();
      return Math.abs(aptTimeMs - targetTimeMs) <= 15 * 60 * 1000;
    });
  }, [bookForm.doctor_id, bookForm.scheduled_at, appointments]);

  // Selected patient details in modal
  const selectedPatientObj = useMemo(() => {
    return patients.find((p) => p.id === bookForm.patient_id);
  }, [bookForm.patient_id, patients]);

  // Selected visit type object
  const currentVisitType = useMemo(() => {
    return fertilityVisitTypes.find((v) => v.id === bookForm.visit_type) || fertilityVisitTypes[0];
  }, [bookForm.visit_type]);

  // Dynamic slot duration and end-time calculation
  const slotTimeDisplay = useMemo(() => {
    if (!bookForm.scheduled_at) return '';
    const d = new Date(bookForm.scheduled_at);
    if (isNaN(d.getTime())) return '';
    const durMins = parseInt(currentVisitType?.duration || '30') || 30;
    const end = new Date(d.getTime() + durMins * 60000);
    const fmt = (dt: Date) => dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fmt(d)} – ${fmt(end)} (${durMins} mins)`;
  }, [bookForm.scheduled_at, currentVisitType]);

  // Doctor's total appointment count for the selected date
  const doctorDayAptCount = useMemo(() => {
    if (!bookForm.doctor_id || !bookForm.scheduled_at) return 0;
    const targetDate = bookForm.scheduled_at.split('T')[0];
    return appointments.filter(
      (a) => a.doctor_id === bookForm.doctor_id && a.scheduled_at?.startsWith(targetDate) && a.status !== 'cancelled'
    ).length;
  }, [bookForm.doctor_id, bookForm.scheduled_at, appointments]);

  // Filtered patients for dropdown search
  const filteredPatientsForBooking = useMemo(() => {
    if (!patientSearchTerm.trim()) {
      return patients.slice(0, 8);
    }
    const q = patientSearchTerm.toLowerCase();
    return patients
      .filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.vid?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.partner_name?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [patients, patientSearchTerm]);

  const quickNoteChips = [
    'Day 8 TVS Follicular Scan',
    'Trigger shot check & OPU prep',
    'Endometrial thickness assessment',
    'Semen collection for ICSI/IUI',
    'Post-transfer Beta-hCG review',
  ];

  // Filtered appointments list based on status, doctor, gender, and query
  const filteredAppointments = appointments.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (doctorFilter !== 'all' && a.doctor_id !== doctorFilter) return false;
    if (genderFilter !== 'all') {
      const aptGender = (a.patient_gender || patients.find((p) => p.id === a.patient_id)?.gender || '').toLowerCase();
      if (aptGender !== genderFilter.toLowerCase()) return false;
    }
    if (searchQuery && !a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const parseUtc = (dStr: string) => {
    if (!dStr) return new Date();
    const s = (dStr.includes('T') && !dStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dStr)) ? `${dStr}Z` : dStr;
    return new Date(s);
  };

  const getWaitTime = (apt: any) => {
    if (apt.status !== 'waiting') return null;
    const dateStr = apt.updated_at || apt.created_at || apt.scheduled_at;
    const refDate = parseUtc(dateStr);
    const waitMs = currentTime.getTime() - refDate.getTime();
    return Math.max(0, Math.floor(waitMs / 60000));
  };

  const getWaitBadgeColor = (waitMins: number | null) => {
    if (waitMins === null) return '';
    if (waitMins < 15) return 'bg-emerald-100 text-emerald-800';
    if (waitMins < 30) return 'bg-amber-100 text-amber-800 font-bold shadow-xs ring-1 ring-amber-300';
    return 'bg-rose-100 text-rose-800 font-bold animate-pulse shadow-xs ring-1 ring-rose-300';
  };

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Queue</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Fertility Clinic Roster
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="vmd-input text-xs w-auto font-bold text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] border-[rgb(var(--clr-primary)/0.2)]"
            />
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Patient Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search Patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="vmd-input text-xs pl-8 w-44"
            />
          </div>

          {/* Doctor Filter (only real doctors & Admin + Doctor) */}
          <select 
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="vmd-input text-xs w-44"
          >
            <option value="all">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                Dr. {d.name} {d.role === 'admin' && d.is_doctor ? '(Admin + Doctor)' : ''}
              </option>
            ))}
          </select>

          {/* Gender Filter for Fertility Clinic */}
          <select 
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="vmd-input text-xs w-36 font-semibold"
          >
            <option value="all">All Genders</option>
            <option value="female">Female ♀</option>
            <option value="male">Male ♂</option>
            <option value="other">Other</option>
          </select>

          {/* In consultation badge */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md hidden sm:flex">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-800">
              {filteredAppointments.filter((a) => a.status === 'in_progress').length} In Cabin
            </span>
          </div>

          {/* Book Appointment CTA */}
          <button
            onClick={() => {
              setBookForm(getInitialBookForm());
              setShowBookModal(true);
            }}
            className="px-4 py-2 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-xs font-bold border transition-all ${
                filter === f
                  ? 'bg-[rgb(var(--clr-primary)/0.08)] border-[rgb(var(--clr-primary)/0.2)] text-[rgb(var(--clr-primary))] shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'All Appointments' : statusLabels[f]}
              <span className="ml-1.5 text-[10px] font-bold">
                ({f === 'all' ? appointments.length : appointments.filter((a) => a.status === f).length})
              </span>
            </button>
          ))}
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Showing {filteredAppointments.length} of {appointments.length} appointments
        </div>
      </div>

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map((apt: any, idx: number) => {
            const aptGender = (apt.patient_gender || patients.find((p) => p.id === apt.patient_id)?.gender || '').toLowerCase();
            const matchedPatient = patients.find((p) => p.id === apt.patient_id);
            const tokenNumber = `#${String(idx + 1).padStart(2, '0')}`;

            return (
              <div
                key={apt.id}
                className={`bg-white border rounded-xl shadow-xs p-5 space-y-4 transition-all hover:shadow-md relative ${
                  apt.status === 'in_progress' ? 'border-emerald-300 ring-2 ring-emerald-100' :
                  apt.status === 'waiting' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                }`}
              >
                {/* Patient Row with Token & Gender */}
                <div className="flex items-center gap-3">
                  {/* Token & Avatar */}
                  <div className="relative">
                    <div className="w-11 h-11 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[rgb(var(--clr-primary)/0.15)]">
                      {apt.patient_name?.charAt(0) || '?'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-slate-800 text-white font-mono text-[9px] font-bold px-1 rounded-sm shadow-xs">
                      {tokenNumber}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm truncate">{apt.patient_name}</p>
                      {/* Gender Badge */}
                      {aptGender === 'female' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-0.5">
                          ♀ Female
                        </span>
                      ) : aptGender === 'male' ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-0.5">
                          ♂ Male
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono font-semibold">{apt.patient_vid}</span>
                      {matchedPatient?.partner_name && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={`Partner: ${matchedPatient.partner_name}`}>
                          · Partner: {matchedPatient.partner_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Wait Timer */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                    {apt.status === 'waiting' && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${getWaitBadgeColor(getWaitTime(apt))}`}>
                        Wait: {getWaitTime(apt)}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Time</p>
                    <p className="text-slate-800 font-bold flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(apt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Doctor</p>
                    <p className="text-slate-800 font-bold truncate mt-0.5">
                      {apt.doctor_name || 'Consultant'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Department</p>
                    <p className="text-slate-800 font-semibold capitalize mt-0.5 truncate">
                      {apt.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Visit Type</p>
                    <p className="text-slate-800 font-semibold capitalize mt-0.5 truncate">
                      {apt.visit_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Clinical Notes if available */}
                {apt.notes && (
                  <div className="text-[11px] text-slate-600 bg-slate-50/70 border border-dashed border-slate-200 px-2.5 py-1.5 rounded-md flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{apt.notes}</span>
                  </div>
                )}

                {/* Triage Vitals Banner */}
                {apt.metadata_?.triage?.vitals && (
                  <div className="text-[11px] bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-md text-emerald-800 font-medium flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold">
                      <Check className="w-3 h-3 text-emerald-600" />
                      BP: {apt.metadata_.triage.vitals.bp || '—'} · HR: {apt.metadata_.triage.vitals.hr || '—'}
                    </span>
                    <span>{apt.metadata_.triage.vitals.weight ? `${apt.metadata_.triage.vitals.weight}kg` : ''}</span>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex gap-2 pt-1 border-t border-slate-100 flex-wrap">
                  {/* Triage button for waiting or scheduled */}
                  {(apt.status === 'waiting' || apt.status === 'scheduled') && (
                    <button
                      onClick={() => {
                        setTriageApt(apt);
                        const t = apt.metadata_?.triage?.vitals || {};
                        setTriageForm({
                          bp: t.bp || '', hr: t.hr || '', temp: t.temp || '',
                          weight: t.weight || '', spo2: t.spo2 || '',
                          chief_complaint: apt.metadata_?.triage?.chief_complaint || ''
                        });
                      }}
                      className={`text-xs font-bold px-2.5 py-2 border rounded-md transition-colors flex items-center gap-1 ${
                        apt.metadata_?.triage
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="Enter Nurse Triage Vitals"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{apt.metadata_?.triage ? 'Triaged' : 'Triage'}</span>
                    </button>
                  )}

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => updateStatus(apt.id, 'waiting')}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      Check In (Waiting)
                    </button>
                  )}

                  {apt.status === 'waiting' && (
                    <button
                      onClick={() => handleStartConsultation(apt)}
                      className="flex-1 text-xs font-bold px-3 py-2 bg-[rgb(var(--clr-primary))] text-white rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs flex items-center justify-center gap-1"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Start Consultation →</span>
                    </button>
                  )}

                  {apt.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStartConsultation(apt)}
                        className="flex-1 text-xs font-bold px-3 py-2 bg-[rgb(var(--clr-primary))] text-white rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)] transition-colors shadow-xs flex items-center justify-center gap-1"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Open Workbench →</span>
                      </button>
                      <button
                        onClick={() => updateStatus(apt.id, 'completed')}
                        className="text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors"
                      >
                        Complete
                      </button>
                    </>
                  )}

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(apt.id, 'cancelled')}
                      className="text-xs font-bold px-2.5 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => openReschedule(apt)}
                      className="text-xs font-bold px-2.5 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      Reschedule
                    </button>
                  )}

                  <Link
                    href={`/patients/${apt.patient_id}`}
                    className="text-xs font-bold px-2.5 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    EMR
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredAppointments.length === 0 && (
        <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-base text-slate-700">No appointments found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No patients match the current date and filter selection. Click "+ Book Appointment" above to schedule a new visit.
          </p>
        </div>
      )}

      {/* STREAMLINED CLINICAL BOOKING MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-100 my-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Book Appointment</h3>
                  <p className="text-xs text-slate-500">Schedule OPD consultation, monitoring, or procedure</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowBookModal(false);
                  setPatientSearchFocus(false);
                }} 
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleBookAppointment} className="space-y-4">
              {/* 1. Patient Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  {!selectedPatientObj && (
                    <Link
                      href="/patients/register"
                      target="_blank"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ New Patient</span>
                    </Link>
                  )}
                </div>

                {!selectedPatientObj ? (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patient by Name, VID, or Phone..."
                      value={patientSearchTerm}
                      onFocus={() => setPatientSearchFocus(true)}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setPatientSearchFocus(true);
                      }}
                      className="vmd-input text-xs pl-9 w-full py-2"
                    />

                    {/* Autocomplete dropdown */}
                    {patientSearchFocus && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                        <div className="p-2 bg-slate-50 text-[11px] font-bold text-slate-500 flex justify-between items-center">
                          <span>Patients ({filteredPatientsForBooking.length})</span>
                          <button
                            type="button"
                            onClick={() => setPatientSearchFocus(false)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {filteredPatientsForBooking.length === 0 ? (
                          <div className="p-3 text-center text-xs text-slate-500">
                            No patient found for &ldquo;{patientSearchTerm}&rdquo;
                          </div>
                        ) : (
                          filteredPatientsForBooking.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setBookForm((prev) => ({ ...prev, patient_id: p.id }));
                                if (p.treating_doctor_id) {
                                  handleSelectDoctor(p.treating_doctor_id);
                                }
                                setPatientSearchFocus(false);
                                setPatientSearchTerm('');
                              }}
                              className="w-full text-left p-2.5 hover:bg-indigo-50/60 transition-colors flex items-center justify-between text-xs"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900">{p.name}</span>
                                  {p.gender === 'female' ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                      ♀ Female
                                    </span>
                                  ) : p.gender === 'male' ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                      ♂ Male
                                    </span>
                                  ) : null}
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                    {p.vid}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {p.phone && <span>📞 {p.phone} </span>}
                                  {p.partner_name && <span>· Partner: {p.partner_name}</span>}
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-2" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Compact Selected Patient Chip */
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {selectedPatientObj.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-900">{selectedPatientObj.name}</span>
                        {selectedPatientObj.gender === 'female' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800">
                            ♀
                          </span>
                        ) : selectedPatientObj.gender === 'male' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800">
                            ♂
                          </span>
                        ) : null}
                        <span className="text-[10px] font-mono text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                          {selectedPatientObj.vid}
                        </span>
                        {selectedPatientObj.partner_name && (
                          <span className="text-[11px] text-slate-500 hidden sm:inline">
                            (Partner: {selectedPatientObj.partner_name})
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setBookForm((prev) => ({ ...prev, patient_id: '' }));
                        setPatientSearchTerm('');
                        setPatientSearchFocus(true);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors flex-shrink-0 ml-2"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Doctor & Auto-Resolved Department (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Treating Doctor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bookForm.doctor_id}
                    onChange={(e) => handleSelectDoctor(e.target.value)}
                    required
                    className="vmd-input text-xs w-full py-2 font-medium"
                  >
                    <option value="">— Select Doctor —</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.name} {d.role === 'admin' && d.is_doctor ? '(Admin + Doctor)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 capitalize truncate">
                      {bookForm.department || 'Fertility / IVF'}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                      Auto
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict notice if doctor has nearby booking */}
              {conflictingDoctorAppointments.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Notice: Dr. has {conflictingDoctorAppointments.length} appointment(s) near this time.</span>
                </div>
              )}

              {/* 3. Date & Time + Quick Slots */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Date & Time <span className="text-red-500">*</span>
                  </label>
                  {slotTimeDisplay && (
                    <span className="text-[10px] font-semibold text-slate-500">
                      Slot: {slotTimeDisplay}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="datetime-local"
                    min={getNowDateTimeLocal()}
                    value={bookForm.scheduled_at}
                    onChange={(e) => setBookForm({ ...bookForm, scheduled_at: e.target.value })}
                    required
                    className="vmd-input text-xs py-2 font-medium flex-1"
                  />
                  {/* Quick Slots */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setBookForm((prev) => ({
                          ...prev,
                          scheduled_at: getNowDateTimeLocal(),
                          status: 'waiting',
                        }));
                      }}
                      className="text-[10px] font-bold px-2 py-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                      title="Direct check-in into Waiting Queue"
                    >
                      ⚡ Now (Walk-In)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setMinutes(d.getMinutes() + 30 - d.getTimezoneOffset());
                        setBookForm((prev) => ({ ...prev, scheduled_at: d.toISOString().slice(0, 16) }));
                      }}
                      className="text-[10px] font-bold px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        setBookForm((prev) => ({ ...prev, scheduled_at: `${d.toISOString().split('T')[0]}T10:00` }));
                      }}
                      className="text-[10px] font-bold px-2 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Tomorrow 10 AM
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. Visit Type / Procedure */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Procedure / Visit Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {fertilityVisitTypes.slice(0, 6).map((vt) => {
                    const isSelected = bookForm.visit_type === vt.id;
                    return (
                      <button
                        key={vt.id}
                        type="button"
                        onClick={() => {
                          setBookForm((prev) => ({
                            ...prev,
                            visit_type: vt.id,
                            notes: prev.notes || vt.defaultNotes,
                          }));
                        }}
                        className={`p-2 rounded-lg text-left border transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold ring-1 ring-indigo-400'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{vt.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1 flex-shrink-0">{vt.duration}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 1-line prep guidance tip */}
                {currentVisitType && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                    💡 <strong className="text-slate-700">Prep tip:</strong> {currentVisitType.prepTip}
                  </p>
                )}
              </div>

              {/* 5. Clinical Notes & SMS toggle */}
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notes / Reason
                  </label>
                  <input
                    type="text"
                    value={bookForm.notes}
                    onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                    placeholder="e.g. Day 8 TVS Scan, semen collection, review..."
                    className="vmd-input text-xs py-2"
                  />
                </div>

                {/* Compact SMS Dispatcher Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={notifyPatientSms}
                    onChange={(e) => setNotifyPatientSms(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span>Send appointment & preparation SMS reminder to patient</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 py-2.5 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isBooking ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Schedule</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookModal(false);
                    setPatientSearchFocus(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal with Future Date-Time Enforcement */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Reschedule Appointment</h3>
              </div>
              <button 
                onClick={() => setRescheduleApt(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="text-sm font-bold text-slate-800">{rescheduleApt.patient_name}</p>
                <p className="text-xs text-slate-500 font-mono">{rescheduleApt.patient_vid}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Current Time: {new Date(rescheduleApt.scheduled_at).toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  min={getNowDateTimeLocal()}
                  value={rescheduleForm.scheduled_at}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                  required
                  className="vmd-input text-xs font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-1">Only current and future slots can be selected.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Treating Consultant</label>
                <select
                  value={rescheduleForm.doctor_id}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, doctor_id: e.target.value })}
                  required
                  className="vmd-input text-xs"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.name} {d.role === 'admin' && d.is_doctor ? '(Admin + Doctor)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nurse Triage Modal */}
      {triageApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
                Nurse Clinical Triage — {triageApt.patient_name}
              </h3>
              <button
                onClick={() => setTriageApt(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={triageForm.bp}
                    onChange={(e) => setTriageForm({ ...triageForm, bp: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="text"
                    placeholder="75"
                    value={triageForm.hr}
                    onChange={(e) => setTriageForm({ ...triageForm, hr: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Temperature (°F)</label>
                  <input
                    type="text"
                    placeholder="98.6"
                    value={triageForm.temp}
                    onChange={(e) => setTriageForm({ ...triageForm, temp: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="65"
                    value={triageForm.weight}
                    onChange={(e) => setTriageForm({ ...triageForm, weight: e.target.value })}
                    className="vmd-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chief Complaint</label>
                <textarea
                  rows={3}
                  placeholder="Patient presents for..."
                  value={triageForm.chief_complaint}
                  onChange={(e) => setTriageForm({ ...triageForm, chief_complaint: e.target.value })}
                  className="vmd-input text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingTriage}
                  className="flex-1 py-3 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                >
                  {isSavingTriage ? 'Saving...' : 'Save Triage Vitals'}
                </button>
                <button
                  type="button"
                  onClick={() => setTriageApt(null)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
