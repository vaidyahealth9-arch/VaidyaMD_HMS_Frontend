'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { limsApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck,
  Barcode,
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import PatientBarcodeModal from '@/components/common/PatientBarcodeModal';
import {
  ManualDiagnosticEntry,
  LimsWorklistTable,
  PathologistReviewSheet,
} from '@/components/lims';

export default function LIMSPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewRecord, setReviewRecord] = useState<any | null>(null);
  const [pathologistComments, setPathologistComments] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Manual entry & Barcode modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [initialPatientIdForManualForm, setInitialPatientIdForManualForm] = useState<string | undefined>(undefined);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodePatient, setBarcodePatient] = useState<any | null>(null);
  const [barcodeSampleId, setBarcodeSampleId] = useState<string | undefined>(undefined);
  const [barcodeSampleType, setBarcodeSampleType] = useState<string | undefined>(undefined);

  // Fetch Worklist
  const { data: worklist = [], isLoading } = useQuery({
    queryKey: ['lims-worklist'],
    queryFn: () => limsApi.getWorklist(),
    refetchInterval: 10000,
  });

  // Fetch Patients
  const { data: patientsData } = useQuery({
    queryKey: ['patients-lims-select'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = (patientsData as any)?.patients || patientsData || [];

  const authorizeMutation = useMutation({
    mutationFn: () =>
      limsApi.authorizeReport(reviewRecord.id, {
        pathologist_id: user?.id,
        comments: pathologistComments || 'Report Verified & Authorized.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lims-worklist'] });
      setReviewSheetOpen(false);
      setReviewRecord(null);
      setPathologistComments('');
      setActionSuccess('Diagnostic report authorized and published to patient EMR timeline');
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  const handleOpenReview = (item: any) => {
    setReviewRecord(item);
    setPathologistComments(item.pathologist_comments || '');
    setReviewSheetOpen(true);
  };

  const handleOpenBarcodeModal = (item?: any) => {
    if (item) {
      const matched = patients.find((p: any) => p.mrn === item.patient_mrn || p.vid === item.patient_mrn);
      const pat = matched || {
        name: item.patient_name,
        mrn: item.patient_mrn,
        gender: item.gender,
        age: item.age,
      };
      setBarcodePatient(pat);
      setBarcodeSampleId(item.sample_id);
      setBarcodeSampleType(item.test_name);
    } else if (patients.length > 0) {
      setBarcodePatient(patients[0]);
      setBarcodeSampleId(undefined);
      setBarcodeSampleType('General Lab');
    }
    setBarcodeModalOpen(true);
  };

  // Filtering
  const filteredWorklist = worklist.filter((item: any) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedGender !== 'all' && (item.gender || '').toLowerCase() !== selectedGender.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (item.patient_name || '').toLowerCase().includes(q) ||
        (item.sample_id || '').toLowerCase().includes(q) ||
        (item.patient_mrn || '').toLowerCase().includes(q) ||
        (item.test_name || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // KPIs
  const totalAnalyzed = worklist.length;
  const pendingCount = worklist.filter((i: any) => i.status === 'Pending Authorization').length;
  const authorizedCount = worklist.filter((i: any) => i.status === 'Authorized').length;

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="LIMS & Automated Diagnostic Analyzers"
        subtitle="Live bidirectional MLLP / HL7 analyzer streams, automated flags & EMR auto-sync"
        icon={FlaskConical}
        titleBadge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-[11px] font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>MLLP Server: Port 2575 (Active)</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setInitialPatientIdForManualForm(undefined);
                setShowManualModal(true);
              }}
              className="gap-1.5 text-xs font-bold bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white shadow-sm h-9"
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleOpenBarcodeModal()}
              className="gap-1.5 text-xs font-bold border-slate-300 text-slate-700 hover:text-slate-900 bg-white h-9 shadow-xs"
            >
              <Barcode className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
              <span>Print Desmat Barcodes</span>
            </Button>
          </div>
        }
      />

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Lab Tests Ingested</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalAnalyzed} Samples</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase">Pending Pathologist Review</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-0.5">{pendingCount} Samples</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Authorized & Published to EMR</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">{authorizedCount} Reports</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Worklist Table */}
      <LimsWorklistTable
        worklist={filteredWorklist}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        selectedGender={selectedGender}
        setSelectedGender={setSelectedGender}
        onOpenBarcodeModal={handleOpenBarcodeModal}
        onOpenReview={handleOpenReview}
      />

      {/* Pathologist Review Sheet */}
      <PathologistReviewSheet
        isOpen={reviewSheetOpen}
        onClose={() => setReviewSheetOpen(false)}
        reviewRecord={reviewRecord}
        pathologistComments={pathologistComments}
        setPathologistComments={setPathologistComments}
        isAuthorizing={authorizeMutation.isPending}
        onAuthorize={() => authorizeMutation.mutate()}
      />

      {/* Manual Diagnostic Entry Dialog */}
      {showManualModal && (
        <ManualDiagnosticEntry
          patients={patients}
          onClose={() => setShowManualModal(false)}
          onSuccess={(message) => {
            setActionSuccess(message);
            setTimeout(() => setActionSuccess(null), 5000);
          }}
          initialPatientId={initialPatientIdForManualForm}
        />
      )}

      {/* Barcode Sticker Modal */}
      {barcodeModalOpen && barcodePatient && (
        <PatientBarcodeModal
          isOpen={barcodeModalOpen}
          onClose={() => setBarcodeModalOpen(false)}
          patient={barcodePatient}
          hospitalName="VAIDYAMD HMS"
          branchName="Diagnostic & Pathology Laboratory"
          initialSampleType={barcodeSampleType}
          initialSampleId={barcodeSampleId}
          initialMode="desmat48"
        />
      )}
    </PageLayout>
  );
}
