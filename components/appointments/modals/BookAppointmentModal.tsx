'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { appointmentsApi } from '@/lib/api';
import {
  CalendarDays,
  X,
  UserPlus,
  Search,
  CheckCircle2,
  Calendar,
  Clock,
  AlertTriangle,
  UserCheck,
  Tag,
  Stethoscope,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { toast } from '@/contexts/ToastContext';

const getNowDateTimeLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export const DEFAULT_VISIT_TYPES = [
  {
    id: 'consultation',
    record_type: 'visit_consultation',
    label: 'Consultation',
    duration: '30m',
    badge: 'Clinical Review',
    prepTip: 'Both partners recommended for initial workup',
    defaultNotes: 'Initial fertility evaluation & history',
  },
  {
    id: 'tvs_scan',
    record_type: 'visit_tvs_scan',
    label: 'TVS Follicular Scan',
    duration: '15m',
    badge: 'Ultrasound',
    prepTip: 'Empty bladder immediately before scan',
    defaultNotes: 'Follicular scan (Day of cycle tracking)',
  },
  {
    id: 'opu',
    record_type: 'visit_opu',
    label: 'OPU (Egg Retrieval)',
    duration: '60m',
    badge: 'OT Daycare',
    prepTip: 'Strict fasting 6h; check trigger timing (34-36h prior)',
    defaultNotes: 'OPU Ovum Pick Up procedure',
  },
  {
    id: 'et',
    record_type: 'visit_et',
    label: 'Embryo Transfer (FET/Fresh)',
    duration: '30m',
    badge: 'OT Transfer',
    prepTip: 'Full bladder required; drink 3 glasses water 45m prior',
    defaultNotes: 'Embryo transfer procedure',
  },
  {
    id: 'semen_analysis',
    record_type: 'visit_semen_analysis',
    label: 'Semen Analysis / Collection',
    duration: '30m',
    badge: 'Andrology',
    prepTip: 'Mandatory 2 to 5 days sexual abstinence required',
    defaultNotes: 'Semen sample collection & analysis',
  },
  {
    id: 'iui',
    record_type: 'visit_iui',
    label: 'IUI Insemination',
    duration: '20m',
    badge: 'Procedure',
    prepTip: 'Sample prepared 1-2h prior in andrology lab',
    defaultNotes: 'IUI Insemination procedure',
  },
];

const normalizeVisitType = (vt: any, idx: number) => {
  let meta: any = {};
  if (vt.schema_json) {
    if (typeof vt.schema_json === 'string') {
      try {
        meta = JSON.parse(vt.schema_json);
      } catch {
        meta = {};
      }
    } else if (typeof vt.schema_json === 'object' && vt.schema_json !== null) {
      meta = vt.schema_json;
    }
  }

  const fallback =
    DEFAULT_VISIT_TYPES.find(
      (d) =>
        d.id === vt.id ||
        d.record_type === vt.record_type ||
        d.id === vt.record_type?.replace(/^visit_/, '') ||
        d.label.toLowerCase() === (vt.title || vt.label || '').toLowerCase()
    ) || DEFAULT_VISIT_TYPES[idx % DEFAULT_VISIT_TYPES.length];

  const rawId = vt.record_type ? vt.record_type.replace(/^visit_/, '') : (vt.id || fallback.id);
  const label = vt.title || vt.label || vt.name || meta.title || meta.label || fallback.label;
  const rawDur = vt.duration || meta.duration || meta.slot_duration_minutes || fallback.duration;
  const duration =
    typeof rawDur === 'number'
      ? `${rawDur}m`
      : String(rawDur).endsWith('m')
      ? rawDur
      : `${rawDur}m`;

  const prepTip =
    vt.prepTip ||
    meta.prepTip ||
    meta.prep_tip ||
    meta.clinical_notes ||
    vt.description ||
    fallback.prepTip;

  const defaultNotes = vt.defaultNotes || meta.defaultNotes || fallback.defaultNotes || '';

  return {
    ...fallback,
    ...vt,
    id: rawId,
    label,
    duration,
    prepTip,
    defaultNotes,
  };
};

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patients: any[];
  doctors: any[];
  appointments: any[];
  dynamicVisitTypes: any[];
}

export default function BookAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  patients,
  doctors,
  appointments,
  dynamicVisitTypes,
}: BookAppointmentModalProps) {
  const getInitialBookForm = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    let defaultTime = `${d.toISOString().split('T')[0]}T10:00`;
    if (d.getHours() >= 10) {
      d.setMinutes(d.getMinutes() + 15);
      defaultTime = d.toISOString().slice(0, 16);
    }

    return {
      patient_id: '',
      doctor_id: doctors.length > 0 ? doctors[0].id : '',
      department: doctors.length > 0 ? (doctors[0].departments?.[0] || doctors[0].specialization || 'Fertility / IVF') : 'Fertility & IVF',
      scheduled_at: defaultTime,
      visit_type: 'consultation',
      status: 'scheduled',
      consultation_fee: 0,
      notes: '',
    };
  };

  const [bookForm, setBookForm] = useState(getInitialBookForm);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchFocus, setPatientSearchFocus] = useState(false);
  const [notifyPatientSms, setNotifyPatientSms] = useState(true);
  const [notifyPartnerSms, setNotifyPartnerSms] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const selectedPatientObj = useMemo(() => {
    return patients.find((p) => p.id === bookForm.patient_id);
  }, [bookForm.patient_id, patients]);

  const normalizedVisitTypes = useMemo(() => {
    if (!dynamicVisitTypes || !Array.isArray(dynamicVisitTypes) || dynamicVisitTypes.length === 0) {
      return DEFAULT_VISIT_TYPES;
    }
    return dynamicVisitTypes.map((vt, i) => normalizeVisitType(vt, i));
  }, [dynamicVisitTypes]);

  const currentVisitType = useMemo(() => {
    return (
      normalizedVisitTypes.find(
        (v) => v.id === bookForm.visit_type || v.record_type === bookForm.visit_type
      ) || normalizedVisitTypes[0]
    );
  }, [bookForm.visit_type, normalizedVisitTypes]);

  const slotTimeDisplay = useMemo(() => {
    if (!bookForm.scheduled_at) return '';
    const d = new Date(bookForm.scheduled_at);
    if (isNaN(d.getTime())) return '';
    const durMins = parseInt(currentVisitType?.duration || '30') || 30;
    const end = new Date(d.getTime() + durMins * 60000);
    const fmt = (dt: Date) => dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fmt(d)} – ${fmt(end)} (${durMins} mins)`;
  }, [bookForm.scheduled_at, currentVisitType]);

  const doctorDayAptCount = useMemo(() => {
    if (!bookForm.doctor_id || !bookForm.scheduled_at) return 0;
    const targetDate = bookForm.scheduled_at.split('T')[0];
    return appointments.filter(
      (a) => a.doctor_id === bookForm.doctor_id && a.scheduled_at?.startsWith(targetDate) && a.status !== 'cancelled'
    ).length;
  }, [bookForm.doctor_id, bookForm.scheduled_at, appointments]);

  const conflictingDoctorAppointments = useMemo(() => {
    if (!bookForm.doctor_id || !bookForm.scheduled_at) return [];
    const targetTimeMs = new Date(bookForm.scheduled_at).getTime();
    return appointments.filter((a) => {
      if (a.doctor_id !== bookForm.doctor_id) return false;
      if (a.status === 'cancelled') return false;
      const aptTimeMs = new Date(a.scheduled_at).getTime();
      return Math.abs(aptTimeMs - targetTimeMs) <= 15 * 60 * 1000;
    });
  }, [bookForm.doctor_id, bookForm.scheduled_at, appointments]);

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

  const handleSelectDoctor = (docId: string) => {
    const doc = doctors.find((d) => d.id === docId);
    const autoDept = doc?.departments?.[0] || doc?.specialization || 'Fertility / IVF';
    setBookForm((prev) => ({
      ...prev,
      doctor_id: docId,
      department: autoDept,
    }));
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.patient_id || !bookForm.doctor_id) {
      toast.error('Missing fields', 'Please select both patient and treating consultant');
      return;
    }

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
      toast.success(
        'Appointment Confirmed',
        bookForm.status === 'waiting'
          ? 'Patient directly checked into the OPD Waiting Queue.'
          : 'Appointment scheduled on the clinical roster.'
      );
      onSuccess();
      onClose();
      setBookForm(getInitialBookForm());
      setPatientSearchTerm('');
    } catch (err: any) {
      toast.error('Booking Failed', err.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-xl w-full shadow-2xl border border-slate-100 my-auto space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">Book Appointment</h3>
                  <p className="text-xs text-slate-500">Schedule OPD consultation, monitoring, or procedure</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
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
                      className="text-[11px] font-bold text-primary hover:text-primary-mid flex items-center gap-1"
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
                              className="w-full text-left p-2.5 hover:bg-primary/10 transition-colors flex items-center justify-between text-xs"
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
                  <div className="bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-primary text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
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
                        <span className="text-[10px] font-mono text-primary bg-white px-1.5 py-0.5 rounded border border-primary/20">
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
                      className="text-xs text-primary hover:text-primary-mid font-bold px-2 py-0.5 rounded hover:bg-primary/15 transition-colors flex-shrink-0 ml-2"
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
                    {doctors.map((d) => {
                      const docName = d.name?.trim() || '';
                      const formattedName = /^dr\.?\s+/i.test(docName) ? docName : `Dr. ${docName}`;
                      return (
                        <option key={d.id} value={d.id}>
                          {formattedName} {d.role === 'admin' && d.is_doctor ? '(Admin + Doctor)' : ''}
                        </option>
                      );
                    })}
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
                  {normalizedVisitTypes.slice(0, 6).map((vt) => {
                    const isSelected =
                      bookForm.visit_type === vt.id || bookForm.visit_type === vt.record_type;
                    return (
                      <button
                        key={vt.id || vt.record_type}
                        type="button"
                        onClick={() => {
                          setBookForm((prev) => ({
                            ...prev,
                            visit_type: vt.id,
                            notes: prev.notes || vt.defaultNotes || '',
                          }));
                        }}
                        className={`p-2 rounded-lg text-left border transition-all text-xs flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold ring-1 ring-primary/40'
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
                {currentVisitType && currentVisitType.prepTip && (
                  <p className="text-[11px] text-slate-600 bg-amber-50/60 px-2.5 py-1.5 rounded-lg border border-amber-200/80 flex items-center gap-1.5 animate-in fade-in">
                    <span>💡</span>
                    <span>
                      <strong className="text-slate-800">Prep tip:</strong> {currentVisitType.prepTip}
                    </span>
                  </p>
                )}
              </div>

              {/* Consultation Fee */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Consultation Fee (₹)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Auto-queues bill in finance</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={bookForm.consultation_fee ?? 0}
                    onChange={(e) => setBookForm({ ...bookForm, consultation_fee: Number(e.target.value) })}
                    placeholder="0"
                    className="vmd-input text-xs py-2 pl-7 font-bold text-slate-800"
                  />
                </div>
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
                    className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>Send appointment & preparation SMS reminder to patient</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 py-2.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
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
                    onClose();
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
  );
}
