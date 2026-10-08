'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { counselingApi, patientsApi, treatmentCyclesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import {
  HeartHandshake,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Activity,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import PrintableCounselingSheetModal from '@/components/common/PrintableCounselingSheetModal';
import {
  CounselingDirectoryTable,
  NewCounselingSessionModal,
  ViewCounselingNoteModal,
} from '@/components/counseling';

export default function CounselingPage() {
  const { user } = useAuth();

  // Fetch dynamic Treatment Cycle Types for procedures list
  const { data: cycleTypes } = useQuery({
    queryKey: ['treatment-cycle-types'],
    queryFn: () => treatmentCyclesApi.listTypes().catch(() => []),
  });

  const dynamicProcedures: string[] =
    cycleTypes && Array.isArray(cycleTypes) && cycleTypes.length > 0
      ? cycleTypes.map((c: any) => c.name)
      : [
          'IVF - Self Oocyte',
          'ICSI - Donor Oocyte',
          'IUI - Husband Semen',
          'IUI - Donor Semen',
          'Frozen Embryo Transfer (FET)',
          'Blastocyst Culture & Transfer',
          'TESA / PESA ICSI',
          'Oocyte Vitrification / Preservation',
          'Pre-implantation Genetic Testing (PGT)',
          'Diagnostic Laparo-Hysteroscopy',
        ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterProcedure, setSelectedFilterProcedure] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [printingNote, setPrintingNote] = useState<any | null>(null);

  // Queries
  const { data: counselingNotes, isLoading: notesLoading, refetch: refetchNotes } = useQuery({
    queryKey: ['counseling-notes'],
    queryFn: () => counselingApi.listNotes().catch(() => []),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientsApi.list({ per_page: 500 }).catch(() => ({ patients: [] })),
  });

  const patients = patientsData?.patients || [];
  const notesList: any[] = Array.isArray(counselingNotes) ? counselingNotes : [];

  const filteredNotes = notesList.filter((note: any) => {
    if (selectedFilterProcedure && note.procedure !== selectedFilterProcedure) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const patientMatch = note.patient_name?.toLowerCase().includes(q) || note.patient_vid?.toLowerCase().includes(q);
      const procedureMatch = note.procedure?.toLowerCase().includes(q);
      const discussionMatch = note.discussion?.toLowerCase().includes(q);
      const remarksMatch = note.remarks?.toLowerCase().includes(q);
      return patientMatch || procedureMatch || discussionMatch || remarksMatch;
    }
    return true;
  });

  const totalSessions = notesList.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = notesList.filter((n: any) => n.created_at?.startsWith(todayStr)).length;

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setEditingNote(note);
    setShowNewModal(true);
  };

  return (
    <PageLayout className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Counselor Desk & Clinical Suite"
        subtitle="Pre-ART counseling, emotional & financial consent, procedure charting, and doctor synchronization"
        icon={HeartHandshake}
        actions={
          <Button
            onClick={() => {
              setEditingNoteId(null);
              setEditingNote(null);
              setShowNewModal(true);
            }}
            className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold h-9 rounded-md shadow-sm text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Counseling Session</span>
          </Button>
        }
      />

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Counseling Sessions</span>
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{totalSessions}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">8-column documentation active</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Today&apos;s Sessions</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mt-2">{todaySessions}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Conducted today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Counselor</span>
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-base font-bold text-slate-900 mt-2 truncate">
              {user?.name || 'Lead Counselor'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{user?.role || 'Staff'}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-emerald-50/50 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>EMR Doctor Sync</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
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
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <CounselingDirectoryTable
        notesLoading={notesLoading}
        notes={filteredNotes}
        onView={(note) => setViewingNote(note)}
        onPrint={(note) => setPrintingNote(note)}
        onEdit={handleEdit}
      />

      {/* Modals */}
      <NewCounselingSessionModal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false);
          setEditingNoteId(null);
          setEditingNote(null);
        }}
        editingNoteId={editingNoteId}
        initialData={editingNote}
        patients={patients}
        dynamicProcedures={dynamicProcedures}
        user={user}
        onSuccess={() => refetchNotes()}
      />

      <ViewCounselingNoteModal
        isOpen={!!viewingNote}
        onClose={() => setViewingNote(null)}
        note={viewingNote}
        onPrint={(note) => setPrintingNote(note)}
      />

      {/* Printable A4 Sheet Modal */}
      <PrintableCounselingSheetModal
        isOpen={!!printingNote}
        onClose={() => setPrintingNote(null)}
        note={printingNote}
      />
    </PageLayout>
  );
}
