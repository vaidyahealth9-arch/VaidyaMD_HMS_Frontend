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


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/utils';

export default function LimsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
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

  // HL7 Ingestion Simulation Mutation
  const simulateHl7Mutation = useMutation({
    mutationFn: (analyzerType: 'casa' | 'hematology') =>
      limsApi.simulateHl7Ingestion({
        analyzer_type: analyzerType,
        test_code: analyzerType === 'casa' ? 'CASA_SEMEN' : 'CBC_5PART',
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['lims-worklist'] });
      setActionSuccess(`HL7 ORU^R01 message ingested from ${data.sample_id}! Sample is now Pending Authorization.`);
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('HL7 Simulation Failed', err.message || 'Failed to ingest data'));
    },
  });

  // Fetch Patients for Manual Lab Entry
  const { data: patientsData } = useQuery({
    queryKey: ['patients-list-lims'],
    queryFn: () => patientsApi.list({ per_page: 500 }),
  });
  const patients = patientsData?.patients || [];

  // Manual Report Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    patient_id: '',
    test_name: '',
    category: 'Hematology',
    sample_id: '',
    param1_name: '',
    param1_val: '',
    param1_unit: '',
    param1_ref: '',
    param2_name: '',
    param2_val: '',
    param2_unit: '',
    param2_ref: '',
    param3_name: '',
    param3_val: '',
    param3_unit: '',
    param3_ref: '',
    notes: '',
  });

  // Manual Lab Report Mutation
  const manualReportMutation = useMutation({
    mutationFn: () =>
      limsApi.createManualReport({
        patient_id: manualForm.patient_id,
        test_name: manualForm.test_name,
        category: manualForm.category,
        sample_id: manualForm.sample_id || undefined,
        pathologist_notes: manualForm.notes,
        observations: {
          [manualForm.param1_name]: { value: manualForm.param1_val, unit: manualForm.param1_unit, ref_range: manualForm.param1_ref },
          ...(manualForm.param2_name ? { [manualForm.param2_name]: { value: manualForm.param2_val, unit: manualForm.param2_unit, ref_range: manualForm.param2_ref } } : {}),
          ...(manualForm.param3_name ? { [manualForm.param3_name]: { value: manualForm.param3_val, unit: manualForm.param3_unit, ref_range: manualForm.param3_ref } } : {}),
        },
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['lims-worklist'] });
      setShowManualModal(false);
      setActionSuccess(data.message || 'Manual diagnostic report queued into LIMS worklist!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('Report Entry Failed', err.message || 'Failed to submit report'));
    },
  });

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
    const matchesSearch =
      !searchQuery ||
      item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sample_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.test_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = worklist.filter((w: any) => w.status === 'Pending Authorization').length;
  const authorizedCount = worklist.filter((w: any) => w.status === 'Authorized').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 leading-tight">LIMS & HL7 Equipment Ingestion</h1>
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
              if (patients.length > 0 && !manualForm.patient_id) {
                setManualForm((prev) => ({ ...prev, patient_id: patients[0].id }));
              }
              setShowManualModal(true);
            }}
            className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Diagnostic Report</span>
          </Button>

          {/* HL7 Equipment Simulators */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2 hidden sm:inline">Equipment:</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => simulateHl7Mutation.mutate('casa')}
              disabled={simulateHl7Mutation.isPending}
              className="gap-1.5 text-xs font-bold text-indigo-700 hover:bg-white rounded-xl h-7 px-2.5"
            >
              <Microscope className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulate CASA</span>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => simulateHl7Mutation.mutate('hematology')}
              disabled={simulateHl7Mutation.isPending}
              className="gap-1.5 text-xs font-bold text-slate-700 hover:bg-white rounded-xl h-7 px-2.5"
            >
              <Activity className="w-3.5 h-3.5 text-slate-600" />
              <span>Simulate CBC</span>
            </Button>
          </div>
        </div>
      </div>


      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
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
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{worklist.length} Records</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
              <FlaskConical className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-700 uppercase">Pending Pathologist Sign-Off</p>
              <h3 className="text-2xl font-black text-amber-700 mt-0.5">{pendingCount} Samples</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Authorized & Published to EMR</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{authorizedCount} Reports</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['all', 'Pending Authorization', 'Authorized'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st === 'all' ? 'All Worklist' : st}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, sample barcode, test..."
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* LIMS WORKLIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
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
                          isPending ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-slate-200 text-slate-700'
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
              <FlaskConical className="w-5 h-5 text-indigo-600" />
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
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
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
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
                          <td className="p-2.5 font-bold text-indigo-700">{obs.value}</td>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewSheetOpen(false)}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => authorizeMutation.mutate()}
              disabled={authorizeMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl shadow-md gap-1.5 text-xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>{authorizeMutation.isPending ? 'Publishing...' : 'Authorize & Publish to EMR'}</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Manual Diagnostic Report Entry Dialog */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">New Diagnostic Lab Report Entry</h3>
                  <p className="text-xs text-slate-500">Record manual bench results, hormonal assays or external lab documents</p>
                </div>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Patient Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Search Patient *</label>
                <input
                  type="text"
                  list="limsPatientsList"
                  placeholder="Type name or ID to search..."
                  value={
                    patients.find((p: any) => p.id === manualForm.patient_id)
                      ? `${patients.find((p: any) => p.id === manualForm.patient_id)?.name} (${patients.find((p: any) => p.id === manualForm.patient_id)?.mrn || patients.find((p: any) => p.id === manualForm.patient_id)?.vid})`
                      : manualForm.patient_id
                  }
                  onChange={(e) => {
                    const match = patients.find((p: any) => `${p.name} (${p.mrn || p.vid})` === e.target.value);
                    setManualForm({ ...manualForm, patient_id: match ? match.id : e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="limsPatientsList">
                  {patients.map((p: any) => (
                    <option key={p.id} value={`${p.name} (${p.mrn || p.vid})`} />
                  ))}
                </datalist>
              </div>

              {/* Test Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Investigation / Test Name *</label>
                <input
                  type="text"
                  value={manualForm.test_name}
                  onChange={(e) => setManualForm({ ...manualForm, test_name: e.target.value })}
                  placeholder="e.g. Complete Blood Count (CBC) or AMH"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnostic Category</label>
                <select
                  value={manualForm.category}
                  onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900 focus:bg-white"
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry / Hormones</option>
                  <option value="Andrology">Andrology & Semen</option>
                  <option value="Serology">Serology / Infectious</option>
                  <option value="Pathology">Clinical Pathology</option>
                </select>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sample Barcode (Optional)</label>
                <input
                  type="text"
                  value={manualForm.sample_id}
                  onChange={(e) => setManualForm({ ...manualForm, sample_id: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:bg-white"
                />
              </div>
            </div>

            {/* Test Parameters / Observations */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900">Quantitative Observation Parameters</h4>
              
              {/* Row 1 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={manualForm.param1_name}
                  onChange={(e) => setManualForm({ ...manualForm, param1_name: e.target.value })}
                  placeholder="Parameter"
                  className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param1_val}
                  onChange={(e) => setManualForm({ ...manualForm, param1_val: e.target.value })}
                  placeholder="Value"
                  className="font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param1_unit}
                  onChange={(e) => setManualForm({ ...manualForm, param1_unit: e.target.value })}
                  placeholder="Unit"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param1_ref}
                  onChange={(e) => setManualForm({ ...manualForm, param1_ref: e.target.value })}
                  placeholder="Ref Range"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={manualForm.param2_name}
                  onChange={(e) => setManualForm({ ...manualForm, param2_name: e.target.value })}
                  placeholder="Parameter 2"
                  className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param2_val}
                  onChange={(e) => setManualForm({ ...manualForm, param2_val: e.target.value })}
                  placeholder="Value"
                  className="font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param2_unit}
                  onChange={(e) => setManualForm({ ...manualForm, param2_unit: e.target.value })}
                  placeholder="Unit"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param2_ref}
                  onChange={(e) => setManualForm({ ...manualForm, param2_ref: e.target.value })}
                  placeholder="Ref Range"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                <input
                  type="text"
                  value={manualForm.param3_name}
                  onChange={(e) => setManualForm({ ...manualForm, param3_name: e.target.value })}
                  placeholder="Parameter 3"
                  className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param3_val}
                  onChange={(e) => setManualForm({ ...manualForm, param3_val: e.target.value })}
                  placeholder="Value"
                  className="font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param3_unit}
                  onChange={(e) => setManualForm({ ...manualForm, param3_unit: e.target.value })}
                  placeholder="Unit"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
                <input
                  type="text"
                  value={manualForm.param3_ref}
                  onChange={(e) => setManualForm({ ...manualForm, param3_ref: e.target.value })}
                  placeholder="Ref Range"
                  className="bg-white border border-slate-200 rounded-lg p-1.5"
                />
              </div>
            </div>

            {/* Pathologist Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Pathologist Notes</label>
              <textarea
                rows={2}
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Clinical notes or external lab reference remarks"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManualModal(false)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={() => manualReportMutation.mutate()}
                disabled={manualReportMutation.isPending || !manualForm.patient_id || !manualForm.test_name}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 rounded-xl shadow-md gap-1.5 text-xs"
              >
                {manualReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Submit to LIMS Worklist</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

