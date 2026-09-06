'use client';

import { useEffect, useState } from 'react';
import { appointmentsApi, patientsApi, authApi } from '@/lib/api';
import { statusColors, statusLabels, formatDateTime } from '@/lib/utils';
import { toast } from '@/contexts/ToastContext';
import Link from 'next/link';


const statusOrder = ['in_progress', 'waiting', 'scheduled', 'completed', 'cancelled'];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Book Appointment Modal State
  const [showBookModal, setShowBookModal] = useState(false);
  
  const getInitialBookForm = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return {
      patient_id: '',
      doctor_id: '',
      department: 'fertility',
      scheduled_at: `${d.toISOString().split('T')[0]}T10:00`,
      visit_type: 'consultation',
      notes: '',
    };
  };
  
  const [bookForm, setBookForm] = useState(getInitialBookForm());
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

  // Time for Wait calculations
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);
    Promise.all([
      appointmentsApi.list({ date_filter: selectedDate }),
      patientsApi.list({ per_page: 100 }),
      authApi.listUsers(),
    ])
      .then(([aptData, patData, userData]: any) => {
        const sorted = (aptData.appointments || []).sort((a: any, b: any) =>
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
        );
        setAppointments(sorted);

        const pts = patData.patients || [];
        setPatients(pts);

        const uList = Array.isArray(userData) ? userData : [];
        const docs = uList.filter((u: any) => u.is_doctor || u.role === 'doctor');
        setDoctors(docs);
      })
      .catch((err) => {
        if (!silent) {
          console.error(err);
          toast.error('Failed to load data', err.message || 'Check your connection');
        }
      })
      .finally(() => {
        if (!silent) setIsLoading(false);
      });
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patient_id || !bookForm.doctor_id) {
      toast.error('Missing fields', 'Please select both patient and doctor');
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
      toast.success('Appointment Booked', 'Appointment has been confirmed on the schedule.');
      loadData(true);
    } catch (err: any) {
      toast.error('Booking Failed', err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const statusFilters = ['all', 'waiting', 'in_progress', 'scheduled', 'completed'];

  const filteredAppointments = appointments.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (doctorFilter !== 'all' && a.doctor_id !== doctorFilter) return false;
    if (searchQuery && !a.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getWaitTime = (apt: any) => {
    if (apt.status !== 'waiting') return null;
    const refDate = apt.updated_at ? new Date(apt.updated_at) : new Date(apt.created_at || apt.scheduled_at);
    const waitMs = currentTime.getTime() - refDate.getTime();
    return Math.max(0, Math.floor(waitMs / 60000));
  };

  const getWaitBadgeColor = (waitMins: number | null) => {
    if (waitMins === null) return '';
    if (waitMins < 15) return 'bg-emerald-100 text-emerald-800';
    if (waitMins < 30) return 'bg-amber-100 text-amber-800 font-bold shadow-sm ring-1 ring-amber-300';
    return 'bg-rose-100 text-rose-800 font-black animate-pulse shadow-sm ring-1 ring-rose-300';
  };

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Appointment Queue</h1>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="vmd-input text-xs w-auto font-bold text-indigo-700 bg-indigo-50 border-indigo-200"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input 
            type="text"
            placeholder="Search Patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="vmd-input text-xs w-48"
          />
          <select 
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="vmd-input text-xs w-40"
          >
            <option value="all">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>Dr. {d.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hidden sm:flex">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-emerald-800">
              {filteredAppointments.filter((a) => a.status === 'in_progress').length} In Consultation
            </span>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            + Book
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {statusFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filter === f ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f === 'all' ? 'All Appointments' : statusLabels[f]}
            <span className="ml-1.5 text-[10px] font-bold">
              ({f === 'all' ? appointments.length : appointments.filter((a) => a.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Queue Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAppointments.map((apt: any) => (
            <div
              key={apt.id}
              className={`bg-white border rounded-3xl shadow-sm p-5 space-y-4 transition-all hover:shadow-md ${
                apt.status === 'in_progress' ? 'border-emerald-300 ring-2 ring-emerald-100' :
                apt.status === 'waiting' ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              {/* Patient Row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center flex-shrink-0">
                  {apt.patient_name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{apt.patient_name}</p>
                  <p className="text-xs text-slate-500 font-mono font-bold">{apt.patient_vid}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
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

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl">
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Time</p>
                  <p className="text-slate-800 font-bold">
                    {new Date(apt.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Doctor</p>
                  <p className="text-slate-800 font-bold truncate">{apt.doctor_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Department</p>
                  <p className="text-slate-800 font-bold capitalize">{apt.department}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Visit Type</p>
                  <p className="text-slate-800 font-bold capitalize">{apt.visit_type?.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                {apt.status === 'scheduled' && (
                  <button
                    onClick={() => updateStatus(apt.id, 'waiting')}
                    className="flex-1 text-xs font-bold px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                  >
                    Mark Waiting
                  </button>
                )}
                {apt.status === 'waiting' && (
                  <button
                    onClick={() => updateStatus(apt.id, 'in_progress')}
                    className="flex-1 text-xs font-bold px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    Start Consultation
                  </button>
                )}
                {apt.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus(apt.id, 'completed')}
                    className="flex-1 text-xs font-bold px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Mark Complete
                  </button>
                )}
                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                  <button
                    onClick={() => updateStatus(apt.id, 'cancelled')}
                    className="text-xs font-bold px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {apt.status === 'scheduled' && (
                  <button
                    onClick={() => openReschedule(apt)}
                    className="text-xs font-bold px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    Reschedule
                  </button>
                )}
                <Link
                  href={`/patients/${apt.patient_id}`}
                  className="text-xs font-bold px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  EMR →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredAppointments.length === 0 && (
        <div className="text-center py-16 text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200 p-8">
          <p className="text-4xl">📅</p>
          <p className="font-bold text-sm text-slate-600">No appointments found.</p>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">📅 Schedule Clinical Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Patient Search</label>
                <input
                  type="text"
                  list="patientsList"
                  placeholder="Type name or ID to search..."
                  value={
                    patients.find((p) => p.id === bookForm.patient_id)
                      ? `${patients.find((p) => p.id === bookForm.patient_id)?.name} (${patients.find((p) => p.id === bookForm.patient_id)?.vid})`
                      : bookForm.patient_id
                  }
                  onChange={(e) => {
                    const match = patients.find((p) => `${p.name} (${p.vid})` === e.target.value);
                    setBookForm({ ...bookForm, patient_id: match ? match.id : e.target.value });
                  }}
                  required
                  className="vmd-input text-xs w-full"
                />
                <datalist id="patientsList">
                  {patients.map((p) => (
                    <option key={p.id} value={`${p.name} (${p.vid})`} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Treating Consultant</label>
                  <select
                    value={bookForm.doctor_id}
                    onChange={(e) => setBookForm({ ...bookForm, doctor_id: e.target.value })}
                    required
                    className="vmd-input text-xs"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialization || 'Doctor'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department</label>
                  <select
                    value={bookForm.department}
                    onChange={(e) => setBookForm({ ...bookForm, department: e.target.value })}
                    required
                    className="vmd-input text-xs"
                  >
                    <option value="fertility">Fertility / IVF</option>
                    <option value="maternity">Maternity / OBGYN</option>
                    <option value="pediatrics">Pediatrics</option>
                    <option value="general">General Medicine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={bookForm.scheduled_at}
                    onChange={(e) => setBookForm({ ...bookForm, scheduled_at: e.target.value })}
                    required
                    className="vmd-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Visit Type</label>
                  <select
                    value={bookForm.visit_type}
                    onChange={(e) => setBookForm({ ...bookForm, visit_type: e.target.value })}
                    className="vmd-input text-xs"
                  >
                    <option value="consultation">Consultation</option>
                    <option value="procedure">Procedure (OPU/IUI/FET)</option>
                    <option value="scan">Ultrasound Scan</option>
                    <option value="follow_up">Follow-up Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Clinical Notes</label>
                <input
                  type="text"
                  value={bookForm.notes}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  placeholder="e.g. Day 8 TVS Follicular scan"
                  className="vmd-input text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  {isBooking ? 'Booking...' : 'Confirm Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">🕒 Reschedule Appointment</h3>
              <button onClick={() => setRescheduleApt(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{rescheduleApt.patient_name}</p>
                <p className="text-xs text-slate-500">{rescheduleApt.patient_vid}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">New Date & Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleForm.scheduled_at}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduled_at: e.target.value })}
                  required
                  className="vmd-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Treating Consultant</label>
                <select
                  value={rescheduleForm.doctor_id}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, doctor_id: e.target.value })}
                  required
                  className="vmd-input text-xs"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm New Time
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl"
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
