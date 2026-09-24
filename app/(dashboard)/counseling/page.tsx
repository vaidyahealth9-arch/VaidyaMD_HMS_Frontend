'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { counselingApi, patientsApi, treatmentCyclesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import { formatDate } from '@/lib/utils';
import PageLayout from '@/components/common/PageLayout';
import {
  HeartHandshake,
  Plus,
  Search,
  FileText,
  Printer,
  Calendar,
  User,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Edit3,
  X,
  Stethoscope,
  Activity,
  Layers,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import PrintableCounselingSheetModal from '@/components/common/PrintableCounselingSheetModal';

const SOURCES_LIST = [
  'OP Consultation',
  'External Doctor Referral',
  'Direct Walk-in',
  'Community Camp / Outreach',
  'Tele-consultation Transfer',
  'Repeat / Second Opinion Consultation',
];

export default function CounselingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dynamic Treatment Cycle Types for procedures list
  const { data: cycleTypes } = useQuery({
    queryKey: ['treatment-cycle-types'],
    queryFn: () => treatmentCyclesApi.listTypes().catch(() => []),
  });

  const dynamicProcedures: string[] =
    cycleTypes && Array.isArray(cycleTypes) && cycleTypes.length > 0
      ? cycleTypes.map((c: any) => c.name)
      : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterProcedure, setSelectedFilterProcedure] = useState('');
  const [selectedFilterSource, setSelectedFilterSource] = useState('');

  // Modal / Form state
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [printingNote, setPrintingNote] = useState<any | null>(null);
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    source: 'OP Consultation',
    comments: '',
    procedure: '',
    egg_pick_up: '',
    discussion: '',
    laparoscopy_hysteroscopy: '',
    egg_transfer: '',
    remarks: '',
    signature: '',
  });

  // Close patient dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || patientsData?.items || [];

  // Fetch Counseling Notes
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['counseling-notes'],
    queryFn: () => counselingApi.listNotes(),
    refetchInterval: 15000,
  });

  // Fetch Counseling Stats
  const { data: stats } = useQuery({
    queryKey: ['counseling-stats'],
    queryFn: () => counselingApi.getStats(),
    refetchInterval: 30000,
  });

  // Set default signature when modal opens
  useEffect(() => {
    if (showNewModal && !editingNoteId) {
      const counselorName = user?.name || 'Ananya Sen';
      const desig = user?.specialization || 'Lead Fertility Counselor';
      setFormData((prev) => ({
        ...prev,
        signature: `${counselorName} (${desig})`,
      }));
    }
  }, [showNewModal, editingNoteId, user]);

  // Selected Patient Details for New Form
  const activeSelectedPatient = patients.find((p: any) => p.id === selectedPatientId);

  // Filtered Patients for Combobox
  const filteredPatients = patients.filter((p: any) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const vid = (p.vid || p.mrn || '').toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    return name.includes(q) || vid.includes(q) || phone.includes(q);
  }).slice(0, 15);

  // Filtered Notes for Table
  const filteredNotes = notes.filter((n: any) => {
    if (selectedFilterProcedure && n.procedure !== selectedFilterProcedure) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const patName = (n.patient_name || '').toLowerCase();
    const vid = (n.patient_vid || '').toLowerCase();
    const proc = (n.procedure || '').toLowerCase();
    const disc = (n.discussion || '').toLowerCase();
    const sig = (n.signature || '').toLowerCase();
    return patName.includes(q) || vid.includes(q) || proc.includes(q) || disc.includes(q) || sig.includes(q);
  });

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) {
        throw new Error('Please select a patient before saving counseling notes.');
      }
      if (editingNoteId) {
        return counselingApi.updateNote(editingNoteId, formData);
      }
      return counselingApi.createNote({
        patient_id: selectedPatientId,
        ...formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling-notes'] });
      queryClient.invalidateQueries({ queryKey: ['counseling-stats'] });
      toast.success(
        editingNoteId ? 'Counseling Note Updated' : 'Counseling Session Recorded',
        'Notes are now permanently saved and visible in the Doctor Portal.'
      );
      setShowNewModal(false);
      setEditingNoteId(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error('Failed to Save', err?.message || 'Server error occurred');
    },
  });

  const resetForm = () => {
    setSelectedPatientId('');
    setPatientSearch('');
    setFormData({
      source: 'OP Consultation',
      comments: '',
      procedure: '',
      egg_pick_up: '',
      discussion: '',
      laparoscopy_hysteroscopy: '',
      egg_transfer: '',
      remarks: '',
      signature: `${user?.name || 'Counselor'} (${user?.specialization || 'Fertility Counselor'})`,
    });
  };

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setSelectedPatientId(note.patient_id);
    setFormData({
      source: note.source || 'OP Consultation',
      comments: note.comments || '',
      procedure: note.procedure || '',
      egg_pick_up: note.egg_pick_up || '',
      discussion: note.discussion || '',
      laparoscopy_hysteroscopy: note.laparoscopy_hysteroscopy || '',
      egg_transfer: note.egg_transfer || '',
      remarks: note.remarks || '',
      signature: note.signature || '',
    });
    setShowNewModal(true);
  };

  return (
    <PageLayout className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-700 shadow-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Counselor Desk &amp; Clinical Suite</h1>
            <p className="text-xs text-slate-500 font-medium">
              Pre-ART counseling, emotional &amp; financial consent, procedure charting, and doctor synchronization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingNoteId(null);
              resetForm();
              setShowNewModal(true);
            }}
            className="gap-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Counseling Session</span>
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sessions Recorded</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_notes ?? notes.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Pre-ART couple counseling sessions</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-pink-600 uppercase tracking-wider">Today&apos;s Consultations</p>
            <p className="text-2xl font-bold text-pink-700 mt-1">{stats?.today_notes ?? 0}</p>
            <p className="text-[11px] text-pink-600/80 mt-0.5">Counseled at desk today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wider">IVF-ICSI Protocols</p>
            <p className="text-2xl font-bold text-primary mt-1">
              {notes.filter((n: any) => (n.procedure || '').toLowerCase().includes('ivf')).length}
            </p>
            <p className="text-[11px] text-primary/80 mt-0.5">OPU &amp; embryo transfer counseled</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Doctor Portal Sync</p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-base font-bold text-emerald-800">100% Real-Time</span>
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Visible inside OPD Consultation Workbench</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name, VID, procedure, discussion keyword..."
            className="pl-9 h-9 text-xs rounded-md"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFilterProcedure}
            onChange={(e) => setSelectedFilterProcedure(e.target.value)}
            className="h-9 px-3 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="">All Procedures</option>
            {dynamicProcedures.map((p: string) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Session Date</th>
              <th className="p-3.5">Patient Details</th>
              <th className="p-3.5">Source</th>
              <th className="p-3.5">Planned Procedure</th>
              <th className="p-3.5">Clinical Discussion Preview</th>
              <th className="p-3.5">Counselor Signature</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {notesLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading counseling records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredNotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-700 text-sm">No Counseling Sessions Found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Click &quot;New Counseling Session&quot; above to record pre-ART counseling, discussion points, OPU/FET plans, and signatures.
                  </p>
                </td>
              </tr>
            ) : (
              filteredNotes.map((note: any) => (
                <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-slate-600 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{formatDate(note.created_at)}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="p-3.5">
                    <p className="font-bold text-slate-900">{note.patient_name || 'Patient'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                      <span className="font-mono font-bold text-primary">{note.patient_vid || '—'}</span>
                      {note.patient_age && <span>· {note.patient_age}y</span>}
                      {note.partner_name && <span className="truncate max-w-[120px]">· Partner: {note.partner_name}</span>}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 font-semibold border-slate-300">
                      {note.source || 'OP Consultation'}
                    </Badge>
                    {note.comments && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 italic mt-0.5" title={note.comments}>
                        {note.comments}
                      </p>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-text-main text-xs">{note.procedure || 'General Counseling'}</span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <p className="text-slate-700 line-clamp-2 text-[11px] leading-relaxed">
                      {note.discussion || note.remarks || 'Clinical counseling conducted.'}
                    </p>
                    {note.egg_pick_up && (
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-pink-700 bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200">
                        OPU Notes Recorded
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[140px]" title={note.signature}>
                        {note.signature || 'Signed'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingNote(note)}
                        className="h-7 text-xs font-bold px-2.5 border-slate-300 hover:border-primary hover:text-primary"
                        title="View Complete 8-Column Counseling Sheet"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrintingNote(note)}
                        className="h-7 text-xs font-bold px-2 border-slate-300 hover:border-slate-800"
                        title="Print A4 Clinical Sheet"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(note)}
                        className="h-7 text-xs font-bold px-2 border-slate-300 hover:border-primary hover:text-primary"
                        title="Edit Counseling Note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================= */}
      {/* MODAL: + NEW / EDIT COUNSELING SESSION (8 REQUIRED COLUMNS) */}
      {/* ========================================================= */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-4xl w-full rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-6 max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-primary text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent border border-white/15">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingNoteId ? 'Edit Clinical Counseling Record' : 'New Pre-ART Counseling Session'}
                  </h3>
                  <p className="text-xs text-pink-200/80">Structured 8-column documentation · Visible in Doctor Portal</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setEditingNoteId(null);
                }}
                className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Section 1: Patient Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  1. Select Patient / Couple for Counseling <span className="text-rose-500">*</span>
                </label>

                {activeSelectedPatient ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-sm">
                        {activeSelectedPatient.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-emerald-950">{activeSelectedPatient.name}</p>
                          <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300 font-mono">
                            {activeSelectedPatient.vid || activeSelectedPatient.mrn}
                          </Badge>
                          <span className="text-[11px] text-emerald-700 capitalize">· {activeSelectedPatient.gender} ({activeSelectedPatient.age}y)</span>
                        </div>
                        <p className="text-[11px] text-emerald-800/80 mt-0.5">
                          Phone: {activeSelectedPatient.phone || '—'} {activeSelectedPatient.blood_group ? `· Blood Group: ${activeSelectedPatient.blood_group}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPatientId('')}
                      className="text-xs font-bold h-7 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Change Patient
                    </Button>
                  </div>
                ) : (
                  <div className="relative" ref={patientDropdownRef}>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search patient by name, VID, or phone number..."
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          setIsPatientDropdownOpen(true);
                        }}
                        onFocus={() => setIsPatientDropdownOpen(true)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                      />
                    </div>

                    {isPatientDropdownOpen && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            No matching registered patients found.
                          </div>
                        ) : (
                          filteredPatients.map((p: any) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setIsPatientDropdownOpen(false);
                                setPatientSearch('');
                              }}
                              className="w-full px-3.5 py-2.5 text-left hover:bg-pink-50/60 flex items-center justify-between transition-colors"
                            >
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                                <p className="text-[11px] text-slate-500">
                                  {p.gender} · Age: {p.age || '—'} · Phone: {p.phone || '—'}
                                </p>
                              </div>
                              <span className="font-mono text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                                {p.vid || p.mrn}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 2: The 8 Clinical Columns */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Source */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      1. Source (Consultation Channel) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
                    >
                      {SOURCES_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Comments Box beside Source */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Source Comments / Referral Notes
                    </label>
                    <input
                      type="text"
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      placeholder="e.g. Referred by Dr. Rao / Camp patient / Relative / Channel notes..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Column 2: Procedure */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    2. Procedure (Planned ART Treatment) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.procedure}
                    onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
                  >
                    {dynamicProcedures.map((p: string) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Column 3: Egg pick up */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    3. Egg pick up (OPU Clinical &amp; Operational Counseling)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.egg_pick_up}
                    onChange={(e) => setFormData({ ...formData, egg_pick_up: e.target.value })}
                    placeholder="Enter follicular expectations, OPU timing, trigger protocol, anesthesia counseling, husband sperm collection plan, fasting instructions..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
                  />
                </div>

                {/* Column 4: Discussion */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    4. Discussion (Detailed Counseling Notes &amp; Couple Consent) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.discussion}
                    onChange={(e) => setFormData({ ...formData, discussion: e.target.value })}
                    placeholder="Document in-depth discussion: medical protocols, financial package breakdown, realistic success probabilities, emotional readiness, couple queries answered, risks discussed, consent forms verified..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
                  />
                </div>

                {/* Column 5: Laparoscopy/hysteroscopy/etc */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    5. Laparoscopy / Hysteroscopy / Endoscopy Assessment
                  </label>
                  <textarea
                    rows={2}
                    value={formData.laparoscopy_hysteroscopy}
                    onChange={(e) => setFormData({ ...formData, laparoscopy_hysteroscopy: e.target.value })}
                    placeholder="Document endoscopic recommendations, uterine cavity / septum / polyp findings, laparoscopy for hydrosalpinx / ovarian drilling, pre-transfer hysteroscopy plans..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
                  />
                </div>

                {/* Column 6: Egg transfer */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    6. Egg transfer (Embryo Transfer Planning &amp; Luteal Strategy)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.egg_transfer}
                    onChange={(e) => setFormData({ ...formData, egg_transfer: e.target.value })}
                    placeholder="Embryo transfer plan: fresh transfer vs freeze-all blastocyst, Day 3 vs Day 5, single vs double embryo transfer counseling, luteal phase support regimen, post-transfer precautions..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
                  />
                </div>

                {/* Column 7: Remarks */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    7. Remarks &amp; Follow-up Actions
                  </label>
                  <textarea
                    rows={2}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Special instructions, couple motivation level, pending blood viral markers, financial approvals, next visit appointment date..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
                  />
                </div>

                {/* Column 8: Signature */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    8. Signature &amp; Sign-off Designation <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.signature}
                      onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                      placeholder="e.g. Ananya Sen (Lead ART Counselor)"
                      className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm font-mono"
                    />
                    <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-mono flex-shrink-0">
                      Timestamp: {new Date().toLocaleDateString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewModal(false);
                  setEditingNoteId(null);
                }}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !selectedPatientId}
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold text-xs px-6 shadow-md"
              >
                {saveMutation.isPending ? 'Saving to EMR...' : editingNoteId ? 'Update Counseling Note' : 'Save Counseling Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VIEW DETAILS (ALL 8 COLUMNS FORMATTED) */}
      {/* ========================================================= */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
          <div className="bg-white max-w-3xl w-full rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-6">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-pink-300 border border-white/10">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Pre-ART Clinical Counseling Sheet</h3>
                  <p className="text-xs text-slate-400">
                    Recorded on {formatDate(viewingNote.created_at)} at {new Date(viewingNote.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingNote(null)}
                className="text-white/60 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header Banner */}
            <div className="p-4 bg-pink-50/80 border-b border-pink-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-pink-800 block">Patient Information</span>
                <p className="font-bold text-slate-900 text-sm">{viewingNote.patient_name || 'Patient'}</p>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  VID: {viewingNote.patient_vid || '—'} {viewingNote.patient_gender ? `· ${viewingNote.patient_gender}` : ''} {viewingNote.patient_age ? `(${viewingNote.patient_age}y)` : ''}
                </p>
              </div>
              {viewingNote.partner_name && (
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Linked Partner</span>
                  <p className="font-bold text-slate-800 text-xs">{viewingNote.partner_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{viewingNote.partner_vid || '—'}</p>
                </div>
              )}
            </div>

            {/* Body with 8 Columns */}
            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Source &amp; Comments</span>
                  <Badge variant="outline" className="text-xs font-semibold bg-slate-50 mt-1 border-slate-300">
                    {viewingNote.source || 'OP Consultation'}
                  </Badge>
                  {viewingNote.comments && (
                    <p className="text-xs text-slate-700 mt-1.5 italic bg-slate-50 p-2 rounded border border-slate-200/70">
                      {viewingNote.comments}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Procedure</span>
                  <p className="font-bold text-text-main text-sm mt-1">{viewingNote.procedure || 'General Counseling'}</p>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Egg pick up (OPU)</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {viewingNote.egg_pick_up || <span className="text-slate-400 italic">No specific OPU instructions entered.</span>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-pink-700 uppercase tracking-wider block">4. Discussion (Counseling Notes)</span>
                <div className="p-3 bg-pink-50/40 rounded-lg border border-pink-200 text-slate-900 leading-relaxed font-medium">
                  {viewingNote.discussion || <span className="text-slate-400 italic">No discussion notes entered.</span>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Laparoscopy / Hysteroscopy / Endoscopy</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {viewingNote.laparoscopy_hysteroscopy || <span className="text-slate-400 italic">No endoscopic findings documented.</span>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Egg transfer (Embryo Transfer)</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {viewingNote.egg_transfer || <span className="text-slate-400 italic">No transfer notes documented.</span>}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">7. Remarks</span>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                  {viewingNote.remarks || <span className="text-slate-400 italic">No additional remarks.</span>}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">8. Signature</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 font-mono">{viewingNote.signature || 'Counselor Signed'}</span>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>Counselor ID: {viewingNote.counselor_name || 'Staff'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrintingNote(viewingNote);
                  setViewingNote(null);
                }}
                className="gap-1.5 text-xs font-bold"
              >
                <Printer className="w-4 h-4" />
                Print Clinical Sheet
              </Button>
              <Button
                onClick={() => setViewingNote(null)}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* PRINTABLE A4 COUNSELING CASE SHEET */}
      {/* ========================================================= */}
      <PrintableCounselingSheetModal
        isOpen={!!printingNote}
        onClose={() => setPrintingNote(null)}
        note={printingNote}
      />
    </PageLayout>
  );
}
