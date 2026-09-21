'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Sparkles,
  Zap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Users,
  User,
  Activity,
  Stethoscope,
  X,
  Loader2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cosgynApi, patientsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CosGynDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'schedule' | 'packages'>('schedule');
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'Jet Plasma' | 'Tesla Chair'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [modalPatientSearch, setModalPatientSearch] = useState('');
  const [isModalPatientDropdownOpen, setIsModalPatientDropdownOpen] = useState(false);
  const modalPatientDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('weekly');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalPatientDropdownRef.current && !modalPatientDropdownRef.current.contains(event.target as Node)) {
        setIsModalPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Treatments
  const { data: treatments = [], isLoading: treatmentsLoading } = useQuery({
    queryKey: ['cosgyn', 'treatments'],
    queryFn: cosgynApi.getTreatments,
  });

  // Fetch Equipment Sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['cosgyn', 'sessions'],
    queryFn: () => cosgynApi.getSessions(),
    refetchInterval: 30000,
  });

  // Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || patientsData?.items || [];

  // Create Plan & Appointments Mutation
  const createPlanMutation = useMutation({
    mutationFn: (payload: any) => cosgynApi.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsBookingOpen(false);
      setSelectedPatientId('');
      setSelectedTreatmentId('');
      setActionSuccess('Treatment package scheduled! Procedure appointments auto-generated in HMS calendar.');
      setTimeout(() => setActionSuccess(null), 6000);
    },
    onError: (err: any) => {
      alert(`Booking Failed: ${err.message || 'Error scheduling treatment package'}`);
    },
  });

  // Update Session Status Mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      cosgynApi.updateSession(sessionId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cosgyn', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setActionSuccess('Session status updated successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
    },
  });

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedTreatmentId) {
      alert('Please select both a registered patient and a treatment package.');
      return;
    }

    let finalTreatmentId = selectedTreatmentId;
    let singleEquipment = undefined;
    if (selectedTreatmentId === 'custom_jet') {
      finalTreatmentId = 'manual';
      singleEquipment = 'Jet Plasma';
    } else if (selectedTreatmentId === 'custom_tesla') {
      finalTreatmentId = 'manual';
      singleEquipment = 'Tesla Chair';
    }

    createPlanMutation.mutate({
      patient_id: selectedPatientId,
      treatment_id: finalTreatmentId !== 'manual' ? finalTreatmentId : undefined,
      equipment: singleEquipment,
      start_date: startDate,
      frequency: frequency,
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

  const selectedTreatment = treatments.find((t: any) => t.id === selectedTreatmentId);

  // Quick stats
  const totalSessions = sessions.length;
  const jetPlasmaCount = sessions.filter((s: any) => s.equipment === 'Jet Plasma' && s.status !== 'cancelled').length;
  const teslaChairCount = sessions.filter((s: any) => s.equipment === 'Tesla Chair' && s.status !== 'cancelled').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
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
              Protocol packages, Jet Plasma, Tesla Chair pelvic floor therapy, and automated appointment scheduling
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            if (treatments.length > 0 && !selectedTreatmentId) {
              setSelectedTreatmentId(treatments[0].id);
            }
            setIsBookingOpen(true);
          }}
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
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Equipment Sessions &amp; Appointments ({filteredSessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'packages'
              ? 'border-pink-600 text-pink-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Treatment Packages &amp; Protocols ({treatments.length})</span>
        </button>
      </div>

      {/* TAB 1: EQUIPMENT SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-64 sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient, ID, or treatment..."
                  className="pl-8 pr-7 h-8 text-xs bg-slate-50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Equipment Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setEquipmentFilter('all')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    equipmentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Equipment
                </button>
                <button
                  onClick={() => setEquipmentFilter('Jet Plasma')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    equipmentFilter === 'Jet Plasma' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Jet Plasma
                </button>
                <button
                  onClick={() => setEquipmentFilter('Tesla Chair')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    equipmentFilter === 'Tesla Chair' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tesla Chair
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter('scheduled')}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'scheduled' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Completed
                </button>
              </div>
            </div>

            <span className="text-slate-500 font-medium">
              Showing {filteredSessions.length} session{filteredSessions.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {sessionsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-600" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No equipment sessions found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Use the "Book Package &amp; Schedule Sessions" button above to enroll a patient in a Cosmetic Gynecology protocol.
                </p>
                <Button
                  onClick={() => setIsBookingOpen(true)}
                  className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold h-8 mt-2"
                >
                  + Book First Session
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Patient</th>
                    <th className="p-3.5">Equipment</th>
                    <th className="p-3.5">Protocol / Package</th>
                    <th className="p-3.5">Scheduled Date &amp; Time</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredSessions.map((session: any) => {
                    const isJet = session.equipment === 'Jet Plasma';
                    const isDone = session.status?.toLowerCase() === 'completed';

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{session.patient_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {session.patient_id?.slice(0, 8)}...</p>
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className={`text-xs font-bold gap-1.5 ${
                              isJet
                                ? 'bg-primary/10 border-primary/20 text-primary'
                                : 'bg-purple-50 border-purple-200 text-purple-700'
                            }`}
                          >
                            <Zap className="w-3 h-3" />
                            {session.equipment}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 max-w-xs truncate">
                          {session.treatment_name}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {new Date(session.scheduled_datetime).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-3.5 text-slate-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {session.duration_mins} mins
                        </td>
                        <td className="p-3.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : session.status?.toLowerCase() === 'cancelled'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-sky-100 text-sky-800 border-sky-300'
                            }`}
                          >
                            {session.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          {!isDone ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSessionMutation.mutate({ sessionId: session.id, status: 'completed' })}
                              disabled={updateSessionMutation.isPending}
                              className="h-7 text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Mark Done
                            </Button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES & PROTOCOLS */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {treatments.map((t: any) => (
            <Card key={t.id} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="purple" className="text-[10px] font-bold mb-1.5">
                        {t.package_combo || 'Cosmetic Gynae'}
                      </Badge>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {t.name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100 font-medium">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        Jet Plasma Sessions:
                      </span>
                      <span className="font-bold text-slate-900">
                        {t.jet_plasma_sessions}x ({t.jet_plasma_duration_mins}m)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-500" />
                        Tesla Chair Sessions:
                      </span>
                      <span className="font-bold text-slate-900">
                        {t.tesla_chair_sessions}x ({t.tesla_chair_duration_mins}m)
                      </span>
                    </div>

                    {t.prp_sessions > 0 && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                          PRP Infiltrations:
                        </span>
                        <span className="font-bold text-slate-900">{t.prp_sessions} session</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Package Fee</span>
                  <span className="text-lg font-extrabold text-pink-700">{formatCurrency(t.price)}</span>
                </div>
                <Button
                  onClick={() => {
                    setSelectedTreatmentId(t.id);
                    setIsBookingOpen(true);
                  }}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-8 text-xs rounded-md shadow-xs"
                >
                  Book Package
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* BOOK PACKAGE & SCHEDULE MODAL */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-bold">Book Cosmetic Gynecology Package</h3>
                  <p className="text-xs text-pink-100">Generates treatment plan &amp; recurring appointments in HMS calendar</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="p-6 space-y-4 text-xs">
              {/* Patient Selector with Searchable Combobox */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Select Patient *</label>
                {(() => {
                  const selectedPat = patients.find((p: any) => p.id === selectedPatientId);

                  if (selectedPat) {
                    return (
                      <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center font-bold text-xs">
                            {selectedPat.name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-pink-950">{selectedPat.name}</p>
                            <p className="text-[11px] text-pink-700 font-mono">
                              MRN: {selectedPat.mrn || selectedPat.vid || 'N/A'} · {selectedPat.gender || 'F'} · {selectedPat.age ? `${selectedPat.age}y` : ''} · {selectedPat.phone || ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPatientId('');
                            setModalPatientSearch('');
                            setIsModalPatientDropdownOpen(true);
                          }}
                          className="h-7 text-xs border-pink-300 text-pink-800 hover:bg-pink-100"
                        >
                          Change
                        </Button>
                      </div>
                    );
                  }

                  const query = modalPatientSearch.toLowerCase().trim();
                  const filtered = patients.filter((p: any) => {
                    if (!query) return true;
                    return (
                      p.name?.toLowerCase().includes(query) ||
                      p.mrn?.toLowerCase().includes(query) ||
                      p.vid?.toLowerCase().includes(query) ||
                      p.phone?.toLowerCase().includes(query)
                    );
                  }).slice(0, 15);

                  return (
                    <div className="relative" ref={modalPatientDropdownRef}>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Type patient name, MRN, VID, or phone..."
                          value={modalPatientSearch}
                          onChange={(e) => {
                            setModalPatientSearch(e.target.value);
                            setIsModalPatientDropdownOpen(true);
                          }}
                          onFocus={() => setIsModalPatientDropdownOpen(true)}
                          className="pl-9 pr-9 h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-500"
                        />
                        {modalPatientSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalPatientSearch('');
                              setIsModalPatientDropdownOpen(true);
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown list */}
                      {isModalPatientDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                          {filtered.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-500 font-medium">
                              No patients found matching "{modalPatientSearch}"
                            </div>
                          ) : (
                            filtered.map((p: any) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPatientId(p.id);
                                  setModalPatientSearch('');
                                  setIsModalPatientDropdownOpen(false);
                                }}
                                className="w-full text-left p-2.5 hover:bg-pink-50/60 transition-colors flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] group-hover:bg-pink-100 group-hover:text-pink-800">
                                    {p.name?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 group-hover:text-pink-950">
                                      {p.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      MRN: {p.mrn || p.vid || 'N/A'} · {p.gender || 'F'} · {p.age ? `${p.age}y` : ''} · {p.phone || 'No phone'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                                  Select →
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Treatment Package Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Treatment Protocol / Package *</label>
                <select
                  value={selectedTreatmentId}
                  onChange={(e) => setSelectedTreatmentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  required
                >
                  <option value="">-- Choose Protocol --</option>
                  <optgroup label="Single Standalone Sessions">
                    <option value="custom_jet">Single Session: Jet Plasma</option>
                    <option value="custom_tesla">Single Session: Tesla Chair</option>
                  </optgroup>
                  <optgroup label="Pre-configured Packages">
                    {treatments.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {formatCurrency(t.price)}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Selected Package Summary Card */}
              {selectedTreatment && (
                <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-pink-950 text-xs">{selectedTreatment.name}</span>
                    <span className="font-extrabold text-pink-700 text-sm">{formatCurrency(selectedTreatment.price)}</span>
                  </div>
                  <div className="flex gap-4 text-[11px] text-pink-800">
                    <span>⚡ Jet Plasma: {selectedTreatment.jet_plasma_sessions} sessions</span>
                    <span>🪑 Tesla Chair: {selectedTreatment.tesla_chair_sessions} sessions</span>
                    {selectedTreatment.prp_sessions > 0 && <span>✨ PRP: {selectedTreatment.prp_sessions} session</span>}
                  </div>
                </div>
              )}

              {/* Date & Frequency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">First Session Date *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Session Frequency *</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-800 h-9 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="twice_weekly">Twice a Week (e.g. Mon / Thu)</option>
                    <option value="weekly">Weekly (Every 7 Days)</option>
                    <option value="fortnightly">Fortnightly (Every 14 Days)</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-md border border-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-600 flex-shrink-0" />
                <span>
                  Confirming this will automatically schedule all {selectedTreatment ? (selectedTreatment.jet_plasma_sessions + selectedTreatment.tesla_chair_sessions) : 'protocol'} sessions in the hospital procedure calendar.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingOpen(false)}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPlanMutation.isPending || !selectedPatientId || !selectedTreatmentId}
                  className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-9 text-xs px-5 shadow-sm"
                >
                  {createPlanMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Generating Appointments...
                    </>
                  ) : (
                    'Confirm & Schedule Package'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
