'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  Plus,
  Activity,
  Stethoscope,
  List,
  Package,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '@/components/common/PageLayout';
import TabBar from '@/components/common/TabBar';
import PrintableCosGynScheduleModal from '@/components/common/PrintableCosGynScheduleModal';
import { cosgynApi, patientsApi } from '@/lib/api';
import {
  BookedPackagesTab,
  ScheduleTab,
  CalendarTab,
  PackageCatalogTab,
  BookPackageModal,
  EditPlanScheduleModal,
  CosGynBillingModal,
  addDaysToDate,
  getStepDays,
} from '@/components/cosgyn';
import type { EditableSessionItem } from '@/components/cosgyn/BookPackageModal';

export default function CosGynDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'packages_booked' | 'schedule' | 'calendar' | 'packages'>('packages_booked');
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'Jet Plasma' | 'Tesla Chair'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Booked Packages Tab State
  const [packagesSearchQuery, setPackagesSearchQuery] = useState('');
  const [packagesFilter, setPackagesFilter] = useState<'all' | 'in_progress' | 'completed' | 'unbilled'>('all');
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});

  // Edit Package Schedule Modal State
  const [isEditScheduleOpen, setIsEditScheduleOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planEditSessions, setPlanEditSessions] = useState<{
    id: string;
    session_number: number;
    equipment: string;
    date: string;
    time: string;
    duration_mins: number;
    status: string;
  }[]>([]);

  // Dedicated Billing Modal State
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [billingPlan, setBillingPlan] = useState<any | null>(null);

  // Booking Modal Pricing & Billing options
  const [bookingPackagePrice, setBookingPackagePrice] = useState<number>(0);
  const [bookingBillingChoice, setBookingBillingChoice] = useState<'bill_later' | 'bill_now'>('bill_later');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<string>('cash');
  const [bookingDiscount, setBookingDiscount] = useState<number>(0);
  const [bookingPaidAmount, setBookingPaidAmount] = useState<number | null>(null);
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingUpiRef, setBookingUpiRef] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');

  // Modality-Specific Start Dates, Times, Frequencies, and Durations
  const [cosgynStartDate, setCosgynStartDate] = useState(todayStr);
  const [cosgynTime, setCosgynTime] = useState('10:00');
  const [cosgynFrequency, setCosgynFrequency] = useState('weekly');
  const [cosgynDuration, setCosgynDuration] = useState(30);

  const [teslaStartDate, setTeslaStartDate] = useState(todayStr);
  const [teslaTime, setTeslaTime] = useState('11:30');
  const [teslaFrequency, setTeslaFrequency] = useState('twice_weekly');
  const [teslaDuration, setTeslaDuration] = useState(28);

  const [prpStartDate, setPrpStartDate] = useState(todayStr);
  const [prpTime, setPrpTime] = useState('12:30');
  const [prpFrequency, setPrpFrequency] = useState('fortnightly');
  const [prpDuration, setPrpDuration] = useState(45);

  // Granular Editable Sessions Array
  const [editableSessions, setEditableSessions] = useState<EditableSessionItem[]>([]);

  // Printable Schedule State
  const [printableScheduleData, setPrintableScheduleData] = useState<any | null>(null);

  // Calendar View State
  const [calendarDate, setCalendarDate] = useState(todayStr);
  const [calendarEquipmentFilter, setCalendarEquipmentFilter] = useState<'all' | 'Tesla Chair' | 'Jet Plasma'>('all');

  // Fetch Treatments
  const { data: treatments = [] } = useQuery({
    queryKey: ['cosgyn', 'treatments'],
    queryFn: cosgynApi.getTreatments,
  });

  // Fetch Equipment Sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['cosgyn', 'sessions'],
    queryFn: () => cosgynApi.getSessions(),
    refetchInterval: 30000,
  });

  // Fetch Booked Patient Treatment Plans
  const { data: bookedPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['cosgyn', 'plans'],
    queryFn: () => cosgynApi.getAllPlans(),
    refetchInterval: 30000,
  });

  // Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || patientsData?.items || [];

  const selectedTreatment = treatments.find((t: any) => t.id === selectedTreatmentId);

  // Auto-populate sessions whenever package or modality controls change
  const generateSessions = () => {
    if (!selectedTreatmentId) {
      setEditableSessions([]);
      return;
    }

    const list: EditableSessionItem[] = [];
    let sNum = 1;

    // 1. Jet Plasma / Cosmetic Gynae Procedure Sessions
    const numJp = selectedTreatment
      ? selectedTreatment.jet_plasma_sessions
      : selectedTreatmentId === 'custom_jet'
      ? 1
      : 0;

    let curJpDate = cosgynStartDate || todayStr;
    for (let i = 0; i < numJp; i++) {
      list.push({
        id: `jp-${i + 1}`,
        equipment: 'Jet Plasma',
        session_number: sNum++,
        date: curJpDate,
        time: cosgynTime || '10:00',
        duration_mins: Number(cosgynDuration) || selectedTreatment?.jet_plasma_duration_mins || 30,
      });
      curJpDate = addDaysToDate(curJpDate, getStepDays(cosgynFrequency, i));
    }

    // 2. Tesla Chair Pelvic Floor Sessions
    const numTc = selectedTreatment
      ? selectedTreatment.tesla_chair_sessions
      : selectedTreatmentId === 'custom_tesla'
      ? 1
      : 0;

    let curTcDate = teslaStartDate || todayStr;
    for (let i = 0; i < numTc; i++) {
      list.push({
        id: `tc-${i + 1}`,
        equipment: 'Tesla Chair',
        session_number: sNum++,
        date: curTcDate,
        time: teslaTime || '11:30',
        duration_mins: Number(teslaDuration) || selectedTreatment?.tesla_chair_duration_mins || 28,
      });
      curTcDate = addDaysToDate(curTcDate, getStepDays(teslaFrequency, i));
    }

    // 3. PRP Sessions
    const numPrp = selectedTreatment ? selectedTreatment.prp_sessions : 0;
    let curPrpDate = prpStartDate || todayStr;
    for (let i = 0; i < numPrp; i++) {
      list.push({
        id: `prp-${i + 1}`,
        equipment: 'PRP Therapy',
        session_number: sNum++,
        date: curPrpDate,
        time: prpTime || '12:30',
        duration_mins: Number(prpDuration) || 45,
      });
      curPrpDate = addDaysToDate(curPrpDate, getStepDays(prpFrequency, i));
    }

    // Fallback if standalone procedure
    if (list.length === 0 && selectedTreatment) {
      list.push({
        id: 'proc-1',
        equipment: selectedTreatment.package_combo || 'CosGyn Procedure',
        session_number: 1,
        date: cosgynStartDate || todayStr,
        time: cosgynTime || '10:00',
        duration_mins: 45,
      });
    }

    setEditableSessions(list);
  };

  useEffect(() => {
    generateSessions();
  }, [
    selectedTreatmentId,
    cosgynStartDate,
    cosgynTime,
    cosgynFrequency,
    cosgynDuration,
    teslaStartDate,
    teslaTime,
    teslaFrequency,
    teslaDuration,
    prpStartDate,
    prpTime,
    prpFrequency,
    prpDuration,
  ]);

  const handleOpenBookingModal = (treatmentId?: string, prefillDate?: string, prefillTime?: string, prefillEquip?: string) => {
    const tId = treatmentId || (treatments.length > 0 ? treatments[0].id : '');
    setSelectedTreatmentId(tId);

    const targetTreat = treatments.find((t: any) => t.id === tId);
    const p = targetTreat?.price || 0;
    setBookingPackagePrice(p);
    setBookingBillingChoice('bill_later');
    setBookingDiscount(0);
    setBookingPaidAmount(p);
    setBookingPaymentMethod('cash');
    setBookingNotes('');
    setBookingUpiRef('');

    const initialDate = prefillDate || todayStr;
    setCosgynStartDate(initialDate);
    setTeslaStartDate(initialDate);
    setPrpStartDate(initialDate);

    if (prefillTime) {
      if (prefillEquip === 'Tesla Chair') setTeslaTime(prefillTime);
      else setCosgynTime(prefillTime);
    }

    setIsBookingOpen(true);
  };

  const handleEditSessionRow = (index: number, field: keyof EditableSessionItem, value: any) => {
    setEditableSessions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const isSlotBooked = (equip: string, date: string, time: string) => {
    return sessions.some((s: any) => {
      if (s.status?.toLowerCase() === 'cancelled') return false;
      if (s.equipment?.toLowerCase() !== equip.toLowerCase()) return false;
      const sDate = s.scheduled_datetime ? s.scheduled_datetime.split('T')[0] : '';
      const sTime = s.scheduled_datetime
        ? new Date(s.scheduled_datetime).toTimeString().slice(0, 5)
        : '';
      return sDate === date && sTime === time;
    });
  };

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: (payload: any) => cosgynApi.createPlan(payload),
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsBookingOpen(false);

      const pat = patients.find((p: any) => p.id === variables.patient_id);
      const treat = treatments.find((t: any) => t.id === variables.treatment_id);

      setActionSuccess('Treatment package scheduled! Procedure appointments auto-generated in HMS calendar.');
      setTimeout(() => setActionSuccess(null), 6000);

      if (variables._shouldPrint && variables.custom_sessions) {
        setPrintableScheduleData({
          patient: {
            name: pat?.name || 'Patient',
            mrn: pat?.mrn || pat?.vid,
            age: pat?.age,
            gender: pat?.gender,
            phone: pat?.phone,
          },
          packageName: treat?.name || 'Cosmetic Gynecology Package',
          packagePrice: treat?.price,
          sessions: variables.custom_sessions,
        });
      }

      setSelectedPatientId('');
    },
    onError: (err: any) => {
      alert(`Booking Failed: ${err.message || 'Error scheduling treatment package'}`);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      cosgynApi.updateSession(sessionId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setActionSuccess('Session status updated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const updatePlanScheduleMutation = useMutation({
    mutationFn: ({ planId, sessionsPayload }: { planId: string; sessionsPayload: any[] }) =>
      cosgynApi.updatePlanSchedule(planId, { sessions: sessionsPayload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsEditScheduleOpen(false);
      setEditingPlan(null);
      setActionSuccess('Treatment package schedule updated and synchronized with HMS calendar.');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      alert(`Failed to update schedule: ${err.message || 'Error updating schedule'}`);
    },
  });

  const handleOpenBillingModal = (plan: any) => {
    setBillingPlan(plan);
    setIsBillingModalOpen(true);
  };

  const handleOpenBillingModalForSession = (session: any) => {
    let targetPlan = bookedPlans.find((p: any) => p.id === session.plan_id);
    if (!targetPlan) {
      const relatedSessions = sessions.filter(
        (s: any) => s.plan_id === session.plan_id || s.patient_id === session.patient_id
      );
      targetPlan = {
        id: session.plan_id,
        patient_id: session.patient_id,
        patient_name: session.patient_name,
        patient_mrn: session.patient_id?.slice(0, 8),
        treatment_name: session.treatment_name,
        total_amount: 4000,
        sessions: relatedSessions.length > 0 ? relatedSessions : [session],
      };
    }
    handleOpenBillingModal(targetPlan);
  };

  const handleOpenEditSchedule = (plan: any) => {
    setEditingPlan(plan);
    const sessionsList = (plan.sessions || []).map((s: any) => {
      const dateStr = s.scheduled_datetime ? s.scheduled_datetime.split('T')[0] : todayStr;
      const timeStr = s.scheduled_datetime
        ? (s.scheduled_datetime.split('T')[1]?.slice(0, 5) || '10:00')
        : '10:00';
      return {
        id: s.id,
        session_number: s.session_number,
        equipment: s.equipment || 'CosGyn Procedure',
        date: dateStr,
        time: timeStr,
        duration_mins: s.duration_mins || 30,
        status: (s.status?.toLowerCase?.() || 'scheduled'),
      };
    });
    setPlanEditSessions(sessionsList);
    setIsEditScheduleOpen(true);
  };

  const handleOpenEditScheduleForSession = (session: any) => {
    let targetPlan = bookedPlans.find((p: any) => p.id === session.plan_id);
    if (!targetPlan) {
      const relatedSessions = sessions.filter(
        (s: any) => s.plan_id === session.plan_id || s.patient_id === session.patient_id
      );
      targetPlan = {
        id: session.plan_id,
        patient_id: session.patient_id,
        patient_name: session.patient_name,
        patient_mrn: session.patient_id?.slice(0, 8),
        treatment_name: session.treatment_name,
        sessions: relatedSessions.length > 0 ? relatedSessions : [session],
      };
    }
    handleOpenEditSchedule(targetPlan);
  };

  const handleSavePlanSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    const payload = planEditSessions.map((s) => ({
      id: s.id,
      scheduled_datetime: `${s.date}T${s.time}:00`,
      duration_mins: Number(s.duration_mins) || 30,
      status: s.status,
    }));
    updatePlanScheduleMutation.mutate({ planId: editingPlan.id, sessionsPayload: payload });
  };

  const shiftAllDates = (days: number) => {
    setPlanEditSessions((prev) =>
      prev.map((s) => ({
        ...s,
        date: addDaysToDate(s.date, days),
      }))
    );
  };

  const bulkSetDuration = (duration: number) => {
    setPlanEditSessions((prev) => prev.map((s) => ({ ...s, duration_mins: duration })));
  };

  const updatePlanEditSessionField = (index: number, field: string, val: any) => {
    setPlanEditSessions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const toggleExpandPlan = (planId: string) => {
    setExpandedPlanIds((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const filteredBookedPlans = useMemo(() => {
    return bookedPlans.filter((p: any) => {
      if (packagesFilter === 'in_progress') {
        if (p.completed_sessions >= p.total_sessions && p.total_sessions > 0) return false;
      } else if (packagesFilter === 'completed') {
        if (p.completed_sessions < p.total_sessions || p.total_sessions === 0) return false;
      } else if (packagesFilter === 'unbilled') {
        if (p.billed === 'true') return false;
      }

      if (packagesSearchQuery) {
        const q = packagesSearchQuery.toLowerCase().trim();
        const pName = p.patient_name?.toLowerCase() || '';
        const pMrn = p.patient_mrn?.toLowerCase() || '';
        const pPhone = p.patient_phone?.toLowerCase() || '';
        const tName = p.treatment_name?.toLowerCase() || '';
        if (!pName.includes(q) && !pMrn.includes(q) && !pPhone.includes(q) && !tName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [bookedPlans, packagesFilter, packagesSearchQuery]);

  const handleBookSubmit = (e: React.FormEvent, shouldPrint = false) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedTreatmentId) {
      alert('Please select both a registered patient and a treatment package.');
      return;
    }

    if (editableSessions.length === 0) {
      alert('No sessions configured for this package.');
      return;
    }

    const customSessionsPayload = editableSessions.map((s) => ({
      equipment: s.equipment,
      session_number: s.session_number,
      scheduled_datetime: `${s.date}T${s.time}:00`,
      duration_mins: Number(s.duration_mins) || 30,
    }));

    let finalTreatmentId = selectedTreatmentId;
    let singleEquipment = undefined;
    if (selectedTreatmentId === 'custom_jet') {
      finalTreatmentId = 'manual';
      singleEquipment = 'Jet Plasma';
    } else if (selectedTreatmentId === 'custom_tesla') {
      finalTreatmentId = 'manual';
      singleEquipment = 'Tesla Chair';
    }

    const finalAmount = bookingPackagePrice || selectedTreatment?.price || 0;
    const shouldBill = bookingBillingChoice === 'bill_now';
    const netReceivable = Math.max(0, finalAmount - (Number(bookingDiscount) || 0));
    const paidAmt = shouldBill
      ? (bookingPaidAmount !== null ? Number(bookingPaidAmount) : netReceivable)
      : 0;

    const fullNotes = [
      bookingNotes,
      bookingUpiRef ? `UPI Ref: ${bookingUpiRef}` : null,
    ].filter(Boolean).join(' | ');

    createPlanMutation.mutate({
      patient_id: selectedPatientId,
      treatment_id: finalTreatmentId !== 'manual' ? finalTreatmentId : undefined,
      equipment: singleEquipment,
      custom_sessions: customSessionsPayload,
      total_amount: finalAmount,
      should_bill_now: shouldBill,
      payment_method: bookingPaymentMethod,
      discount: Number(bookingDiscount) || 0,
      paid_amount: paidAmt,
      billing_notes: fullNotes || undefined,
      _shouldPrint: shouldPrint,
    });
  };

  const filteredSessions = sessions.filter((s: any) => {
    if (equipmentFilter !== 'all' && s.equipment !== equipmentFilter) return false;
    if (statusFilter !== 'all' && s.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const patName = s.patient_name?.toLowerCase() || '';
      const patId = s.patient_id?.toLowerCase() || '';
      const treatName = s.treatment_name?.toLowerCase() || '';
      const equip = s.equipment?.toLowerCase() || '';
      if (!patName.includes(q) && !patId.includes(q) && !treatName.includes(q) && !equip.includes(q)) return false;
    }
    return true;
  });

  // Calendar calculations
  const operationalTimeSlots = useMemo(() => [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00',
  ], []);

  const daySessions = useMemo(() => {
    return sessions.filter((s: any) => {
      if (!s.scheduled_datetime) return false;
      const sDate = s.scheduled_datetime.split('T')[0];
      return sDate === calendarDate && s.status !== 'cancelled';
    });
  }, [sessions, calendarDate]);

  const vacancyStats = useMemo(() => {
    const totalSlotsPerEquip = operationalTimeSlots.length;
    const teslaBooked = daySessions.filter((s: any) => s.equipment === 'Tesla Chair').length;
    const jetBooked = daySessions.filter((s: any) => s.equipment === 'Jet Plasma').length;

    const totalSlots = totalSlotsPerEquip * 2;
    const totalBooked = teslaBooked + jetBooked;
    const totalVacant = Math.max(0, totalSlots - totalBooked);

    return {
      totalSlots,
      totalBooked,
      totalVacant,
      teslaVacant: Math.max(0, totalSlotsPerEquip - teslaBooked),
      jetVacant: Math.max(0, totalSlotsPerEquip - jetBooked),
      occupancyRate: totalSlots > 0 ? Math.round((totalBooked / totalSlots) * 100) : 0,
    };
  }, [operationalTimeSlots, daySessions]);

  const totalSessions = sessions.length;
  const jetPlasmaCount = sessions.filter((s: any) => s.equipment === 'Jet Plasma' && s.status !== 'cancelled').length;
  const teslaChairCount = sessions.filter((s: any) => s.equipment === 'Tesla Chair' && s.status !== 'cancelled').length;

  return (
    <PageLayout className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md shadow-pink-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">Cosmetic Gynecology &amp; Aesthetics</h1>
              <Badge variant="purple" className="text-[10px] font-bold uppercase">
                Specialty Suite
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Automated multi-modality scheduling for Tesla Chair pelvic floor therapy, Jet Plasma rejuvenation, and patient cards
            </p>
          </div>
        </div>

        <Button
          onClick={() => handleOpenBookingModal()}
          className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-10 px-4 rounded-lg shadow-sm text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Package &amp; Schedule Sessions</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available Packages</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{treatments.length}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pre-configured protocols</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Scheduled</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalSessions}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Across all equipment</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Jet Plasma Sessions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{jetPlasmaCount}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Vaginal rejuvenation</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tesla Chair Sessions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{teslaChairCount}</p>
              <p className="text-[10px] text-purple-600 font-medium mt-0.5">Pelvic floor rehabilitation</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <TabBar
        variant="underline"
        tabs={[
          { id: 'packages_booked', label: 'Booked Packages', icon: Package, badge: bookedPlans.length },
          { id: 'schedule', label: `Equipment Sessions & Appointments (${filteredSessions.length})`, icon: List },
          { id: 'calendar', label: 'Calendar & Vacancy Slot Matrix', icon: Calendar },
          { id: 'packages', label: `Treatment Packages & Protocols (${treatments.length})`, icon: Sparkles },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Tab Contents */}
      {activeTab === 'packages_booked' && (
        <BookedPackagesTab
          bookedPlans={bookedPlans}
          plansLoading={plansLoading}
          packagesSearchQuery={packagesSearchQuery}
          setPackagesSearchQuery={setPackagesSearchQuery}
          packagesFilter={packagesFilter}
          setPackagesFilter={setPackagesFilter}
          filteredBookedPlans={filteredBookedPlans}
          expandedPlanIds={expandedPlanIds}
          toggleExpandPlan={toggleExpandPlan}
          onOpenBookingModal={handleOpenBookingModal}
          onOpenEditSchedule={handleOpenEditSchedule}
          onPrintSchedule={(plan) => {
            setPrintableScheduleData({
              patient: {
                name: plan.patient_name,
                vid: plan.patient_id?.slice(0, 8),
                mrn: plan.patient_mrn,
                age: plan.patient_age,
                gender: plan.patient_gender,
                phone: plan.patient_phone,
              },
              packageName: plan.treatment_name,
              packagePrice: plan.total_amount,
              sessions: plan.sessions || [],
            });
          }}
          onOpenBillingModal={handleOpenBillingModal}
          onUpdateSessionStatus={(sessionId, status) => updateSessionMutation.mutate({ sessionId, status })}
          isUpdatingSession={updateSessionMutation.isPending}
        />
      )}

      {activeTab === 'schedule' && (
        <ScheduleTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          equipmentFilter={equipmentFilter}
          setEquipmentFilter={setEquipmentFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filteredSessions={filteredSessions}
          sessions={sessions}
          patients={patients}
          sessionsLoading={sessionsLoading}
          onOpenBookingModal={handleOpenBookingModal}
          onPrintSchedule={setPrintableScheduleData}
          onOpenEditScheduleForSession={handleOpenEditScheduleForSession}
          onOpenBillingModalForSession={handleOpenBillingModalForSession}
          onUpdateSessionStatus={(sessionId, status) => updateSessionMutation.mutate({ sessionId, status })}
          isUpdatingSession={updateSessionMutation.isPending}
        />
      )}

      {activeTab === 'calendar' && (
        <CalendarTab
          calendarDate={calendarDate}
          setCalendarDate={setCalendarDate}
          calendarEquipmentFilter={calendarEquipmentFilter}
          setCalendarEquipmentFilter={setCalendarEquipmentFilter}
          todayStr={todayStr}
          operationalTimeSlots={operationalTimeSlots}
          daySessions={daySessions}
          slotVacancyStats={vacancyStats}
          onOpenBookingModal={handleOpenBookingModal}
        />
      )}

      {activeTab === 'packages' && (
        <PackageCatalogTab
          treatments={treatments}
          onOpenBookingModal={handleOpenBookingModal}
        />
      )}

      {/* Modals */}
      <BookPackageModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        patients={patients}
        treatments={treatments}
        selectedPatientId={selectedPatientId}
        setSelectedPatientId={setSelectedPatientId}
        selectedTreatmentId={selectedTreatmentId}
        setSelectedTreatmentId={setSelectedTreatmentId}
        selectedTreatment={selectedTreatment}
        cosgynStartDate={cosgynStartDate}
        setCosgynStartDate={setCosgynStartDate}
        cosgynTime={cosgynTime}
        setCosgynTime={setCosgynTime}
        cosgynFrequency={cosgynFrequency}
        setCosgynFrequency={setCosgynFrequency}
        cosgynDuration={cosgynDuration}
        setCosgynDuration={setCosgynDuration}
        teslaStartDate={teslaStartDate}
        setTeslaStartDate={setTeslaStartDate}
        teslaTime={teslaTime}
        setTeslaTime={setTeslaTime}
        teslaFrequency={teslaFrequency}
        setTeslaFrequency={setTeslaFrequency}
        teslaDuration={teslaDuration}
        setTeslaDuration={setTeslaDuration}
        editableSessions={editableSessions}
        generateSessions={generateSessions}
        handleEditSessionRow={handleEditSessionRow}
        isSlotBooked={isSlotBooked}
        bookingPackagePrice={bookingPackagePrice}
        setBookingPackagePrice={setBookingPackagePrice}
        bookingBillingChoice={bookingBillingChoice}
        setBookingBillingChoice={setBookingBillingChoice}
        bookingDiscount={bookingDiscount}
        setBookingDiscount={setBookingDiscount}
        bookingPaidAmount={bookingPaidAmount}
        setBookingPaidAmount={setBookingPaidAmount}
        bookingPaymentMethod={bookingPaymentMethod}
        setBookingPaymentMethod={setBookingPaymentMethod}
        bookingUpiRef={bookingUpiRef}
        setBookingUpiRef={setBookingUpiRef}
        bookingNotes={bookingNotes}
        setBookingNotes={setBookingNotes}
        handleBookSubmit={handleBookSubmit}
        isCreatingPlan={createPlanMutation.isPending}
      />

      <EditPlanScheduleModal
        isOpen={isEditScheduleOpen}
        editingPlan={editingPlan}
        onClose={() => {
          setIsEditScheduleOpen(false);
          setEditingPlan(null);
        }}
        planEditSessions={planEditSessions}
        onSave={handleSavePlanSchedule}
        isSaving={updatePlanScheduleMutation.isPending}
        shiftAllDates={shiftAllDates}
        bulkSetDuration={bulkSetDuration}
        updatePlanEditSessionField={updatePlanEditSessionField}
      />

      {isBillingModalOpen && billingPlan && (
        <CosGynBillingModal
          isOpen={isBillingModalOpen}
          billingPlan={billingPlan}
          onClose={() => {
            setIsBillingModalOpen(false);
            setBillingPlan(null);
          }}
          onSuccess={(res) => {
            setIsBillingModalOpen(false);
            setBillingPlan(null);
            setActionSuccess(`Official Invoice #${res.invoice_number} created successfully! Total: ₹${res.total_amount}`);
            setTimeout(() => setActionSuccess(null), 6000);
          }}
        />
      )}

      {printableScheduleData && (
        <PrintableCosGynScheduleModal
          patient={printableScheduleData.patient}
          packageName={printableScheduleData.packageName}
          packagePrice={printableScheduleData.packagePrice}
          sessions={printableScheduleData.sessions}
          onClose={() => setPrintableScheduleData(null)}
        />
      )}
    </PageLayout>
  );
}
