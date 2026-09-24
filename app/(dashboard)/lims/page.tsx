'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { limsApi, patientsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
  Microscope,
  Radio,
  Clock,
  UserCheck,
  Search,
  Sliders,
  Send,
  Eye,
  Plus,
  X,
  UploadCloud,
  Loader2,
} from 'lucide-react';


import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/shared/ui/sheet';
import { formatDateTime } from '@/lib/utils';
import ManualDiagnosticEntry from '@/components/lims/ManualDiagnosticEntry';
import PageLayout from '@/components/common/PageLayout';

export default function LimsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewRecord, setReviewRecord] = useState<any>(null);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [pathologistComments, setPathologistComments] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch LIMS Worklist
  const { data: worklist = [], isLoading } = useQuery({
    queryKey: ['lims-worklist'],
    queryFn: () => limsApi.getWorklist(),
    refetchInterval: 5000, // Live equipment polling
  });


  // Fetch Patients for Manual Lab Entry
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-lims'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || [];

  // Manual Report Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [initialPatientIdForManualForm, setInitialPatientIdForManualForm] = useState('');

  // Pathologist Authorization Mutation
  const authorizeMutation = useMutation({
    mutationFn: () =>
      limsApi.authorizeReport(reviewRecord.id, {
        pathologist_id: user?.id,
        comments: pathologistComments || 'Report Verified & Authorized.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lims-worklist'] });
      setReviewSheetOpen(false);
      setActionSuccess('Lab report authorized and published to Patient EMR!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('Authorization Failed', err.message || 'Failed to authorize report'));
    },
  });


  const handleOpenReview = (record: any) => {
    setReviewRecord(record);
    setPathologistComments(record.pathologist_notes || '');
    setReviewSheetOpen(true);
  };

  const filteredWorklist = worklist.filter((item: any) => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesGender = selectedGender === 'all' || (() => {
      if (item.patient_gender) return item.patient_gender.toLowerCase() === selectedGender.toLowerCase();
      const pts = patientsData?.patients || [];
      const p = pts.find((pat: any) => pat.id === item.patient_id || pat.vid === item.patient_mrn);
      return (p?.gender || '').toLowerCase() === selectedGender.toLowerCase();
    })();
    const matchesSearch =
      !searchQuery ||
      item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sample_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.test_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesGender && matchesSearch;
  });

  const pendingCount = worklist.filter((w: any) => w.status === 'Pending Authorization').length;
  const authorizedCount = worklist.filter((w: any) => w.status === 'Authorized').length;

  return (
    <PageLayout className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] border border-[rgb(var(--clr-primary)/0.2)] flex items-center justify-center text-[rgb(var(--clr-primary))]">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">LIMS & HL7 Equipment Ingestion</h1>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                MLLP Port 2575 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Automated analyzer integration (CASA Semen, Mindray Hematology) and Pathologist review</p>
          </div>
        </div>

        {/* Action Controls & Simulator */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => {
              if (patients.length > 0) {
                setInitialPatientIdForManualForm(patients[0].id);
              }
              setShowManualModal(true);
            }}
            className="gap-1.5 text-xs font-bold bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md h-9 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagnostic Report</span>
          </Button>


        </div>
      </div>

      {/* LIMS Workflow Explanation Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-md bg-[rgb(var(--clr-primary))] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900">How Laboratory & HL7 Ingestion Works in VaidyaMD:</h4>
            <p className="text-slate-600 leading-relaxed">
              1. <strong>Direct Analyzer Ingestion:</strong> Automated analyzers (CASA Semen Analyzer, Hematology/CBC) stream raw results over MLLP Port 2575 into this LIMS queue as <em>Pending Authorization</em>.
            </p>
            <p className="text-slate-600 leading-relaxed">
              2. <strong>Pathologist Review & Sign-Off:</strong> Click <em>Review & Authorize</em> to verify reference ranges and add clinical impressions.
            </p>
            <p className="text-slate-600 leading-relaxed">
              3. <strong>Instant EMR Publication:</strong> Once authorized, reports are automatically published to the patient&apos;s EMR and visible in <em>Patient 360 &rarr; Investigations</em>.
            </p>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Total Samples Ingested</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{worklist.length} Records</h3>
            </div>
            <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase">Pending Pathologist Sign-Off</p>
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

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'Pending Authorization', 'Authorized'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedStatus === st
                  ? 'bg-[rgb(var(--clr-primary))] text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All Worklist' : st}
            </button>
          ))}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
            {['all', 'female', 'male'].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGender(g)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                  selectedGender === g
                    ? 'bg-white text-[rgb(var(--clr-primary))] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'All Genders' : g === 'female' ? 'Female ♀' : 'Male ♂'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, sample barcode, test..."
            className="pl-9 h-9 text-xs rounded-md"
          />
        </div>
      </div>

      {/* LIMS WORKLIST TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">Sample Barcode</th>
              <th className="p-3.5">Patient Details</th>
              <th className="p-3.5">Diagnostic Test Name</th>
              <th className="p-3.5">Analyzer Stream</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Ingested At</th>
              <th className="p-3.5 text-right">Pathologist Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredWorklist.length > 0 ? (
              filteredWorklist.map((item: any) => {
                const isPending = item.status === 'Pending Authorization';
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] px-2 py-0.5 rounded">
                        {item.sample_id}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{item.patient_name}</p>
                      <p className="text-[11px] text-slate-500">{item.patient_mrn} · {item.gender}, {item.age}y</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{item.test_name}</p>
                      <p className="text-[10px] text-slate-400">{item.observations_count} parameters extracted</p>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px] font-mono">{item.analyzer_id}</Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={isPending ? 'warning' : 'success'} className="text-[10px] uppercase font-bold">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-slate-500">{formatDateTime(item.created_at)}</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant={isPending ? 'default' : 'outline'}
                        onClick={() => handleOpenReview(item)}
                        className={`h-7 text-xs font-bold rounded-lg gap-1 ${
                          isPending ? 'bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isPending ? 'Review & Sign' : 'View Report'}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400 text-xs">
                  {isLoading ? 'Loading equipment stream...' : 'No lab records found matching criteria. Click simulate buttons above.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PATHOLOGIST REVIEW & AUTHORIZATION SHEET */}
      <Sheet open={reviewSheetOpen} onOpenChange={setReviewSheetOpen}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[rgb(var(--clr-primary))]" />
              <SheetTitle className="text-base font-bold text-slate-900">
                Pathologist Review: {reviewRecord?.test_name}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-slate-500">
              Sample {reviewRecord?.sample_id} · Patient: {reviewRecord?.patient_name} ({reviewRecord?.patient_mrn})
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-3">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-md border border-slate-200">
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Analyzer Model</span>
                <span className="font-bold text-slate-800">{reviewRecord?.analyzer_id}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-bold uppercase">Ingestion Time</span>
                <span className="font-semibold text-slate-800">{reviewRecord ? formatDateTime(reviewRecord.created_at) : '—'}</span>
              </div>
            </div>

            {/* Extracted Parameters Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">HL7 Parsed Observations</h4>
              <div className="border border-slate-200 rounded-md overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Result</th>
                      <th className="p-2.5">Unit</th>
                      <th className="p-2.5">Reference Range</th>
                      <th className="p-2.5">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {reviewRecord?.observations &&
                      Object.values(reviewRecord.observations).map((obs: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{obs.name || obs.code}</td>
                          <td className="p-2.5 font-bold text-[rgb(var(--clr-primary))]">{obs.value}</td>
                          <td className="p-2.5 text-slate-500">{obs.unit}</td>
                          <td className="p-2.5 text-slate-600">{obs.reference_range || '—'}</td>
                          <td className="p-2.5">
                            <Badge variant={obs.flag === 'N' ? 'success' : 'destructive'} className="text-[9px]">
                              {obs.flag === 'N' ? 'Normal' : obs.flag}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pathologist Comments */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pathologist Clinical Interpretation & Sign-Off Notes</label>
              <textarea
                value={pathologistComments}
                onChange={(e) => setPathologistComments(e.target.value)}
                rows={3}
                placeholder="e.g. Findings correlate with normozoospermic profile under WHO 6th edition guidelines."
                className="w-full bg-slate-50 border border-slate-300 rounded-md p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewSheetOpen(false)}
              className="rounded-md h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => authorizeMutation.mutate()}
              disabled={authorizeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-md shadow-md gap-1.5 text-xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>{authorizeMutation.isPending ? 'Publishing...' : 'Authorize & Publish to EMR'}</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Manual Diagnostic Report Entry Dialog */}
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
    </PageLayout>
  );
}

