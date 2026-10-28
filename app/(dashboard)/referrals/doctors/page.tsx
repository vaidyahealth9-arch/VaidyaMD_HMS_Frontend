'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeartHandshake,
  Download,
  Search,
  SlidersHorizontal,
  CreditCard,
  User,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Percent,
  X,
  Stethoscope,
  Pill,
  FlaskConical,
  Microscope,
  BedDouble,
  Building2,
  RefreshCw,
  Plus,
  Phone,
  Mail,
  MapPin,
  Check,
  Receipt,
  Sparkles,
  DollarSign,
  Share2,
  ArrowLeft,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { referralsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type {
  DoctorDirectoryItem,
  DoctorHierarchyDetailResponse,
  ReferringDoctorCreate,
  ReferralSettlementCreate,
  ReferralSettlement,
  CommissionConfigSchema,
} from '@/features/referrals/types';
import PrintableDoctorStatement from '@/components/referrals/PrintableDoctorStatement';
import PrintableSettlementVoucher from '@/components/referrals/PrintableSettlementVoucher';
import SettlementModal from '@/components/referrals/SettlementModal';

export default function DoctorDirectoryPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { currentBranch, user } = useAuth() || {};

  const initialDoctorParam = searchParams.get('doctor');

  // Level 1: Master Directory State
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'unsettled' | 'settled'>('all');
  const [selectedDoctorName, setSelectedDoctorName] = useState<string | null>(initialDoctorParam || null);

  // Level 2: Patients Filter / Search within selected doctor
  const [patientSearch, setPatientSearch] = useState('');
  const [expandedPatientIds, setExpandedPatientIds] = useState<Record<string, boolean>>({});

  // Reset expanded patients and search when doctor selection changes
  useEffect(() => {
    setExpandedPatientIds({});
    setPatientSearch('');
  }, [selectedDoctorName]);

  // Modals
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlePreselectedInvoiceId, setSettlePreselectedInvoiceId] = useState<string | null>(null);

  // Doctor Profile Edit Modal
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState<ReferringDoctorCreate>({
    name: '',
    clinic_name: '',
    specialty: '',
    phone: '',
    email: '',
    address: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    pan_number: '',
    custom_commission_pct: undefined,
    notes: '',
  });

  // Commission Rules Modal
  const [isCommissionConfigOpen, setIsCommissionConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState<CommissionConfigSchema>({
    opd_pct: 10,
    pharmacy_pct: 5,
    iui_pct: 10,
    embryology_pct: 15,
    lims_pct: 10,
    ipd_pct: 10,
    other_pct: 5,
  });

  // Printable Settlement Voucher Modal
  const [voucherSettlement, setVoucherSettlement] = useState<ReferralSettlement | null>(null);

  // Doctor Transparency Statement Modal
  const [isDoctorStatementOpen, setIsDoctorStatementOpen] = useState(false);

  // ─── React Queries ───
  const { data: directory = [], isLoading: isDirectoryLoading } = useQuery<DoctorDirectoryItem[]>({
    queryKey: ['referrals-directory', searchQuery, directoryFilter],
    queryFn: () =>
      referralsApi.getDirectory({
        search: searchQuery.trim() || undefined,
        filter_type: directoryFilter === 'all' ? undefined : directoryFilter,
      }),
  });

  // Automatically select first doctor if none selected
  useEffect(() => {
    if (!selectedDoctorName && directory.length > 0) {
      if (initialDoctorParam && directory.some((d) => d.doctor_name === initialDoctorParam)) {
        setSelectedDoctorName(initialDoctorParam);
      } else {
        setSelectedDoctorName(directory[0].doctor_name);
      }
    }
  }, [directory, selectedDoctorName, initialDoctorParam]);

  const { data: doctorDetail, isLoading: isDetailLoading } = useQuery<DoctorHierarchyDetailResponse>({
    queryKey: ['referrals-doctor-detail', selectedDoctorName],
    queryFn: () => referralsApi.getDoctorDetail(selectedDoctorName!),
    enabled: !!selectedDoctorName,
  });

  const { data: commissionSettings } = useQuery<CommissionConfigSchema>({
    queryKey: ['referrals-commission-settings'],
    queryFn: () => referralsApi.getCommissionSettings(),
  });

  useEffect(() => {
    if (commissionSettings) {
      setConfigForm(commissionSettings);
    }
  }, [commissionSettings]);

  // Mutations
  const saveDoctorMutation = useMutation({
    mutationFn: (payload: ReferringDoctorCreate) => referralsApi.saveDoctorProfile(payload),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['referrals-directory'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-doctor-detail', selectedDoctorName] });
      setIsDoctorModalOpen(false);
      setSelectedDoctorName(saved.name);
    },
  });

  const settleCommissionMutation = useMutation({
    mutationFn: (payload: ReferralSettlementCreate) => referralsApi.settleCommission(payload),
    onSuccess: (settlement) => {
      queryClient.invalidateQueries({ queryKey: ['referrals-directory'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-doctor-detail', selectedDoctorName] });
      setIsSettlementModalOpen(false);
      setSettlePreselectedInvoiceId(null);
      // Open printable settlement voucher
      setVoucherSettlement(settlement);
    },
  });

  const saveCommissionConfigMutation = useMutation({
    mutationFn: (payload: CommissionConfigSchema) => referralsApi.saveCommissionSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-commission-settings'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-directory'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-doctor-detail'] });
      setIsCommissionConfigOpen(false);
    },
  });

  // Open Edit Doctor Profile
  const handleOpenDoctorEdit = () => {
    if (!doctorDetail) return;
    const prof = doctorDetail.doctor_profile;
    setDoctorForm({
      name: doctorDetail.doctor_name,
      clinic_name: prof?.clinic_name || '',
      specialty: prof?.specialty || '',
      phone: prof?.phone || '',
      email: prof?.email || '',
      address: prof?.address || '',
      bank_name: prof?.bank_name || '',
      account_number: prof?.account_number || '',
      ifsc_code: prof?.ifsc_code || '',
      upi_id: prof?.upi_id || '',
      pan_number: prof?.pan_number || '',
      custom_commission_pct: prof?.custom_commission_pct ?? undefined,
      notes: prof?.notes || '',
    });
    setIsDoctorModalOpen(true);
  };

  const handleOpenNewDoctor = () => {
    setDoctorForm({
      name: '',
      clinic_name: '',
      specialty: '',
      phone: '',
      email: '',
      address: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      upi_id: '',
      pan_number: '',
      custom_commission_pct: undefined,
      notes: '',
    });
    setIsDoctorModalOpen(true);
  };

  // Toggle patient accordion
  const togglePatientAccordion = (patientId: string) => {
    setExpandedPatientIds((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  };

  // Prepare Settlement Modal
  const handleOpenSettlementModal = (preselectedInvoiceId?: string) => {
    setSettlePreselectedInvoiceId(preselectedInvoiceId || null);
    setIsSettlementModalOpen(true);
  };

  // Filter patients within doctor
  const filteredPatients = useMemo(() => {
    if (!doctorDetail?.patients) return [];
    if (!patientSearch.trim()) return doctorDetail.patients;
    const q = patientSearch.toLowerCase();
    return doctorDetail.patients.filter(
      (p) =>
        p.patient_name.toLowerCase().includes(q) ||
        (p.patient_vid && p.patient_vid.toLowerCase().includes(q)) ||
        p.treatment_protocol.toLowerCase().includes(q)
    );
  }, [doctorDetail, patientSearch]);

  return (
    <PageLayout>
      <PageHeader
        title="Doctor Referral Hierarchy & Settlements"
        subtitle="Inspect referring doctor accounts, clinical treatment cycle conversions, and itemized bill payouts"
        icon={HeartHandshake}
        titleBadge="Pro"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/referrals">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Executive Overview
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCommissionConfigOpen(true)}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5 text-teal-700" />
              Commission Rules
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(referralsApi.getExportUrl(selectedDoctorName || undefined), '_blank');
              }}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Ledger
            </Button>
            <Button
              size="sm"
              onClick={handleOpenNewDoctor}
              className="h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-teal-800 text-white cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Referring Doctor
            </Button>
          </div>
        }
      />
      <div className="space-y-4">
        {/* ════════════════════════════════════════════════════════════════════
            TWO PANE LAYOUT:
            LEFT: Doctor Directory (Level 1)
            RIGHT: Selected Doctor Profile, Patients & Invoices (Level 2 & 3)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* ─────────────────────────────────────────────────────────────
              LEVEL 1: MASTER REFERRING DOCTOR DIRECTORY (Left Sidebar)
          ───────────────────────────────────────────────────────────── */}
          <div className="w-full lg:w-80 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-primary" />
                  Doctor Directory
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {directory.length} Doctors
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search doctor, clinic, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7.5 text-xs bg-white border-slate-200"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDirectoryFilter('all')}
                  className={`flex-1 py-1 rounded transition-all cursor-pointer text-center ${
                    directoryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({directory.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryFilter('unsettled')}
                  className={`flex-1 py-1 rounded transition-all cursor-pointer text-center ${
                    directoryFilter === 'unsettled' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unsettled
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryFilter('settled')}
                  className={`flex-1 py-1 rounded transition-all cursor-pointer text-center ${
                    directoryFilter === 'settled' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Settled
                </button>
              </div>
            </div>

            {/* Doctors List */}
            <div className="max-h-[calc(100vh-270px)] overflow-y-auto divide-y divide-slate-100">
              {isDirectoryLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1.5 text-primary" />
                  Loading directory...
                </div>
              ) : directory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 p-4">
                  <HeartHandshake className="w-7 h-7 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No doctors found</p>
                  <p className="text-[10px] mt-0.5">Register a new partner or search with different filters.</p>
                </div>
              ) : (
                directory.map((doc, idx) => {
                  const isSelected = selectedDoctorName === doc.doctor_name;
                  const profile = doc.doctor_profile;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDoctorName(doc.doctor_name)}
                      className={`p-3 transition-all cursor-pointer text-left space-y-1.5 ${
                        isSelected
                          ? 'bg-teal-50/70 border-l-4 border-l-teal-700 shadow-inner'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {doc.doctor_name}
                          </p>
                          {profile?.clinic_name && (
                            <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                              <Building2 className="w-2.5 h-2.5 flex-shrink-0 text-slate-400" />
                              {profile.clinic_name}
                            </p>
                          )}
                        </div>
                        {doc.has_unsettled ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 whitespace-nowrap">
                            Due ₹{Math.round(doc.pending_commission).toLocaleString('en-IN')}
                          </span>
                        ) : doc.settled_commission > 0 ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                            Settled
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                            Non-Commissionable
                          </span>
                        )}
                      </div>

                      {/* Stats footer */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
                        <span>
                          👥 {doc.patient_count} {doc.patient_count === 1 ? 'pt' : 'pts'} · {doc.invoice_count} bills
                        </span>
                        <span className="font-semibold text-slate-700">
                          Rev: ₹{Math.round(doc.total_revenue).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════
              LEVEL 2 & 3: DETAIL PANE (Selected Doctor, Patients & Bills)
          ════════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 w-full space-y-4">
            {!selectedDoctorName ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                <HeartHandshake className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">Select a Referring Doctor</p>
                <p className="text-xs">Click any doctor on the left directory to inspect referred patients and bills.</p>
              </div>
            ) : isDetailLoading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                Loading doctor referral profile &amp; patient records...
              </div>
            ) : !doctorDetail ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Doctor details not available.
              </div>
            ) : (
              <>
                {/* ─── DOCTOR PROFILE & FINANCIAL SUMMARY CARD ─── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-teal-900/5 via-slate-50 to-amber-500/5">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base border border-teal-200 flex-shrink-0">
                        {doctorDetail.doctor_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-extrabold text-slate-900">
                            {doctorDetail.doctor_name}
                          </h2>
                          {doctorDetail.doctor_profile?.specialty && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {doctorDetail.doctor_profile.specialty}
                            </span>
                          )}
                          {doctorDetail.doctor_profile?.custom_commission_pct != null && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200">
                              ⚡ Custom Override: {doctorDetail.doctor_profile.custom_commission_pct}%
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          {doctorDetail.doctor_profile?.clinic_name && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {doctorDetail.doctor_profile.clinic_name}
                            </span>
                          )}
                          {doctorDetail.doctor_profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {doctorDetail.doctor_profile.phone}
                            </span>
                          )}
                          {doctorDetail.doctor_profile?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {doctorDetail.doctor_profile.email}
                            </span>
                          )}
                          {doctorDetail.doctor_profile?.bank_name && (
                            <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                              <CreditCard className="w-2.5 h-2.5 text-slate-400" />
                              {doctorDetail.doctor_profile.bank_name} ···{doctorDetail.doctor_profile.account_number?.slice(-4) || ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDoctorStatementOpen(true)}
                        className="h-8 text-xs font-semibold gap-1.5 border-teal-200 text-teal-800 hover:bg-teal-50 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                        Doctor Statement
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenDoctorEdit}
                        className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                        Edit Profile / Bank
                      </Button>
                      {doctorDetail.pending_commission > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenSettlementModal()}
                          className="h-8 text-xs font-bold gap-1.5 bg-teal-700 hover:bg-teal-800 text-white cursor-pointer shadow-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Settle Payout (₹{Math.round(doctorDetail.pending_commission).toLocaleString('en-IN')})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Financial Stats Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/50 text-center">
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Referred Patients</p>
                      <p className="text-base font-extrabold text-slate-900 font-mono">
                        {doctorDetail.total_patients_count}
                      </p>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Total Revenue</p>
                      <p className="text-base font-extrabold text-slate-900 font-mono">
                        ₹{Math.round(doctorDetail.total_revenue).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Paid</p>
                      <p className="text-base font-extrabold text-emerald-800 font-mono">
                        ₹{Math.round(doctorDetail.total_paid).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] font-bold text-teal-700 uppercase">Total Commission</p>
                      <p className="text-base font-extrabold text-teal-900 font-mono">
                        ₹{Math.round(doctorDetail.total_commission).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase">Settled to Date</p>
                      <p className="text-base font-extrabold text-emerald-700 font-mono">
                        ₹{Math.round(doctorDetail.settled_commission).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-2.5 space-y-0.5 bg-amber-50/70">
                      <p className="text-[10px] font-bold text-amber-800 uppercase">Pending Payout</p>
                      <p className="text-base font-extrabold text-amber-900 font-mono">
                        ₹{Math.round(doctorDetail.pending_commission).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Department Subsections Pills */}
                  <div className="px-4 py-2 border-t border-slate-100 bg-white flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Departmental Revenue Share:
                    </span>
                    {doctorDetail.departmental_totals.opd > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-medium">
                        OPD: ₹{Math.round(doctorDetail.departmental_totals.opd).toLocaleString('en-IN')}
                      </span>
                    )}
                    {doctorDetail.departmental_totals.pharmacy > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
                        Rx: ₹{Math.round(doctorDetail.departmental_totals.pharmacy).toLocaleString('en-IN')}
                      </span>
                    )}
                    {doctorDetail.departmental_totals.iui > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-medium">
                        IUI: ₹{Math.round(doctorDetail.departmental_totals.iui).toLocaleString('en-IN')}
                      </span>
                    )}
                    {doctorDetail.departmental_totals.embryology > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono font-medium">
                        IVF / Embryology: ₹{Math.round(doctorDetail.departmental_totals.embryology).toLocaleString('en-IN')}
                      </span>
                    )}
                    {doctorDetail.departmental_totals.lims > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-medium">
                        Diagnostics / Lab: ₹{Math.round(doctorDetail.departmental_totals.lims).toLocaleString('en-IN')}
                      </span>
                    )}
                    {doctorDetail.departmental_totals.ipd > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-mono font-medium">
                        IPD / Procedures: ₹{Math.round(doctorDetail.departmental_totals.ipd).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* ─── LEVEL 2: REFERRED PATIENTS LIST (Grouped under Doctor) ─── */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Referred Patients ({doctorDetail.patients.length}) &amp; Bill Invoices
                    </h3>
                    <div className="flex items-center gap-2">
                      {doctorDetail.patients.length > 0 && (
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-medium text-slate-600 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const allExpanded: Record<string, boolean> = {};
                              doctorDetail.patients.forEach((p) => {
                                allExpanded[p.patient_id] = true;
                              });
                              setExpandedPatientIds(allExpanded);
                            }}
                            className="px-2 py-0.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            Expand All
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            type="button"
                            onClick={() => setExpandedPatientIds({})}
                            className="px-2 py-0.5 rounded hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            Collapse All
                          </button>
                        </div>
                      )}
                      <div className="w-52">
                        <Input
                          type="text"
                          placeholder="Filter patients or VID..."
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          className="h-7 text-xs bg-white border-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  {filteredPatients.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                      No matching patients currently linked to this referring doctor.
                    </div>
                  ) : (
                    filteredPatients.map((pat) => {
                      const isExpanded = Boolean(expandedPatientIds[pat.patient_id]);

                      return (
                        <div
                          key={pat.patient_id}
                          className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
                        >
                          {/* Patient Header Card */}
                          <div
                            onClick={() => togglePatientAccordion(pat.patient_id)}
                            className="p-3.5 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200">
                                {pat.patient_name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-slate-900">{pat.patient_name}</h4>
                                  {pat.conversion_badge.includes('IVF') ? (
                                    <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                                      ✨ {pat.conversion_badge}
                                    </span>
                                  ) : pat.conversion_badge.includes('IUI') ? (
                                    <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                                      🧪 {pat.conversion_badge}
                                    </span>
                                  ) : (
                                    <span className="text-[9.5px] font-medium px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                                      {pat.conversion_badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {pat.patient_vid || pat.patient_mrn || '—'} · {[pat.patient_age ? `${pat.patient_age}y` : null, pat.patient_gender].filter(Boolean).join(' / ')}
                                  {pat.patient_phone ? ` · 📞 ${pat.patient_phone}` : ''}
                                </p>
                              </div>
                            </div>

                            {/* Patient Protocol & Financial Summary */}
                            <div className="flex items-center gap-4 text-right">
                              <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Treatment Protocol</p>
                                <p className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1">
                                  <Activity className="w-3 h-3 text-teal-600" />
                                  {pat.treatment_protocol}
                                </p>
                              </div>
                              <div className="border-l border-slate-200 pl-4">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase">Billed / Paid</p>
                                <p className="text-xs font-bold text-slate-900 font-mono">
                                  ₹{Math.round(pat.total_billed).toLocaleString('en-IN')}
                                  <span className="text-emerald-700 text-[10px] ml-1">
                                    (₹{Math.round(pat.total_paid).toLocaleString('en-IN')})
                                  </span>
                                </p>
                              </div>
                              <div className="border-l border-slate-200 pl-4">
                                {pat.total_commission === 0 ? (
                                  <div>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Commission</p>
                                    <span className="text-[9.5px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 inline-block mt-0.5">
                                      Non-Commissionable
                                    </span>
                                  </div>
                                ) : pat.pending_commission > 0 ? (
                                  <div>
                                    <p className="text-[10px] font-semibold text-amber-800 uppercase">Unsettled Comm</p>
                                    <p className="text-xs font-bold text-amber-900 font-mono">
                                      ₹{Math.round(pat.pending_commission).toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-[10px] font-semibold text-emerald-800 uppercase">Commission</p>
                                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block mt-0.5">
                                      Settled ✓
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* ─── LEVEL 3: ITEMIZED INVOICES WITH DEPARTMENTAL SUBSECTIONS ─── */}
                          {isExpanded && (
                            <div className="p-0 overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                                  <tr>
                                    <th className="py-2 px-3">Invoice # &amp; Date</th>
                                    <th className="py-2 px-3">Department Breakdown Subsections</th>
                                    <th className="py-2 px-3 text-right">Net Bill</th>
                                    <th className="py-2 px-3 text-right">Paid</th>
                                    <th className="py-2 px-3 text-right">Due</th>
                                    <th className="py-2 px-3 text-right">Commission</th>
                                    <th className="py-2 px-3 text-center">Settlement Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {pat.invoices.length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">
                                        No invoices recorded for this patient yet.
                                      </td>
                                    </tr>
                                  ) : (
                                    pat.invoices.map((inv) => (
                                      <tr key={inv.invoice_id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Inv # & Date */}
                                        <td className="py-2.5 px-3">
                                          <p className="font-mono font-bold text-slate-900 text-[11px]">
                                            {inv.invoice_number}
                                          </p>
                                          <p className="text-[10px] text-slate-400">{formatDate(inv.invoice_date)}</p>
                                        </td>

                                        {/* Department Subsections Breakdown */}
                                        <td className="py-2.5 px-3">
                                          <div className="flex flex-wrap gap-1 max-w-[340px]">
                                            {inv.subsections.opd > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-blue-50 text-blue-800 border border-blue-200" title="OPD Consultation">
                                                OPD: ₹{Math.round(inv.subsections.opd).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.pharmacy > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200" title="Pharmacy Medicines">
                                                Rx: ₹{Math.round(inv.subsections.pharmacy).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.iui > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-indigo-50 text-indigo-800 border border-indigo-200" title="IUI Services">
                                                IUI: ₹{Math.round(inv.subsections.iui).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.embryology > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-purple-50 text-purple-800 border border-purple-200" title="IVF / Embryology Lab">
                                                IVF: ₹{Math.round(inv.subsections.embryology).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.lims > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Diagnostics & LIMS">
                                                Lab: ₹{Math.round(inv.subsections.lims).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.ipd > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-rose-50 text-rose-800 border border-rose-200" title="IPD & Procedures">
                                                IPD: ₹{Math.round(inv.subsections.ipd).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                            {inv.subsections.other > 0 && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-100 text-slate-700">
                                                Other: ₹{Math.round(inv.subsections.other).toLocaleString('en-IN')}
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* Net Bill */}
                                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                                          ₹{Math.round(inv.net_total).toLocaleString('en-IN')}
                                        </td>

                                        {/* Paid */}
                                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800 text-xs">
                                          ₹{Math.round(inv.paid_amount).toLocaleString('en-IN')}
                                        </td>

                                        {/* Due */}
                                        <td className="py-2.5 px-3 text-right font-mono text-xs">
                                          {inv.pending_due > 0 ? (
                                            <span className="text-amber-800 font-bold">
                                              ₹{Math.round(inv.pending_due).toLocaleString('en-IN')}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">₹0</span>
                                          )}
                                        </td>

                                        {/* Commission Amount */}
                                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-teal-900 text-xs">
                                          ₹{Math.round(inv.commission_amount).toLocaleString('en-IN')}
                                        </td>

                                        {/* Settlement Status */}
                                        <td className="py-2.5 px-3 text-center">
                                          {inv.commission_amount === 0 ? (
                                            <span className="text-[9.5px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                              Non-Commissionable
                                            </span>
                                          ) : inv.is_settled ? (
                                            <div className="inline-flex flex-col items-center">
                                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                SETTLED
                                              </span>
                                              {inv.settlement_number && (
                                                <span className="text-[8.5px] font-mono text-slate-500 mt-0.5">
                                                  {inv.settlement_number}
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-center gap-1.5">
                                              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 inline-flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5 text-amber-700" />
                                                UNSETTLED
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => handleOpenSettlementModal(inv.invoice_id)}
                                                className="text-[10px] text-teal-800 hover:text-teal-900 font-bold underline cursor-pointer"
                                              >
                                                Settle
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ─── SETTLEMENTS AUDIT HISTORY ─── */}
                {doctorDetail.settlements && doctorDetail.settlements.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                        Payout History &amp; Vouchers ({doctorDetail.settlements.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Voucher #</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Method &amp; Ref</th>
                            <th className="py-2 px-3">Bills Settled</th>
                            <th className="py-2 px-3 text-right">Amount Paid</th>
                            <th className="py-2 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {doctorDetail.settlements.map((st) => (
                            <tr key={st.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                {st.settlement_number}
                              </td>
                              <td className="py-2 px-3 text-slate-600">{formatDate(st.settlement_date)}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-700">
                                <span className="uppercase font-semibold">{st.payment_method}</span>
                                {st.reference_number && (
                                  <span className="text-slate-400 ml-1.5">({st.reference_number})</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                {st.invoice_ids?.length || 0} invoices
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-800">
                                ₹{Math.round(st.amount_paid).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setVoucherSettlement(st)}
                                  className="h-6 px-2 text-[10px] font-semibold gap-1 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3 text-teal-700" />
                                  Voucher
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
      {/* ════════════════════════════════════════════════════════════════════
          MODAL: RECORD COMMISSION SETTLEMENT PAYOUT (WITH CHECKBOXES)
      ════════════════════════════════════════════════════════════════════ */}
      {isSettlementModalOpen && doctorDetail && (
        <SettlementModal
          isOpen={isSettlementModalOpen}
          onClose={() => setIsSettlementModalOpen(false)}
          doctorDetail={doctorDetail}
          preselectedInvoiceId={settlePreselectedInvoiceId}
          onSettle={(payload) => settleCommissionMutation.mutate(payload)}
          isPending={settleCommissionMutation.isPending}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: EDIT DOCTOR PROFILE & BANK DETAILS
      ════════════════════════════════════════════════════════════════════ */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-900/10 to-teal-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  Referring Doctor Profile &amp; Banking
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Maintain banking details, contact info, and custom commission override.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDoctorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Doctor Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="h-8 text-xs border-slate-300 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Specialty</label>
                  <Input
                    type="text"
                    placeholder="e.g. OB/GYN, IVF Specialist, GP"
                    value={doctorForm.specialty || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                    className="h-8 text-xs border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Clinic / Hospital</label>
                  <Input
                    type="text"
                    placeholder="e.g. Apex Fertility Care"
                    value={doctorForm.clinic_name || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })}
                    className="h-8 text-xs border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Contact Phone</label>
                  <Input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={doctorForm.phone || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="h-8 text-xs border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Email</label>
                  <Input
                    type="email"
                    placeholder="e.g. drrajesh@example.com"
                    value={doctorForm.email || ''}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="h-8 text-xs border-slate-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-teal-800 uppercase">
                    Custom Commission Override (%)
                  </label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="Leave empty for hospital default"
                    value={doctorForm.custom_commission_pct ?? ''}
                    onChange={(e) =>
                      setDoctorForm({
                        ...doctorForm,
                        custom_commission_pct: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="h-8 text-xs border-teal-300 bg-teal-50/30 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-[11px] font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                  Banking &amp; Settlement Details
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Bank Name</label>
                    <Input
                      type="text"
                      placeholder="e.g. HDFC Bank"
                      value={doctorForm.bank_name || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, bank_name: e.target.value })}
                      className="h-8 text-xs border-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">Account Number</label>
                    <Input
                      type="text"
                      placeholder="e.g. 501002938475"
                      value={doctorForm.account_number || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, account_number: e.target.value })}
                      className="h-8 text-xs border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">IFSC Code</label>
                    <Input
                      type="text"
                      placeholder="e.g. HDFC0001234"
                      value={doctorForm.ifsc_code || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, ifsc_code: e.target.value.toUpperCase() })}
                      className="h-8 text-xs border-slate-300 font-mono uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase">UPI ID / VPA</label>
                    <Input
                      type="text"
                      placeholder="e.g. doctor@okhdfcbank"
                      value={doctorForm.upi_id || ''}
                      onChange={(e) => setDoctorForm({ ...doctorForm, upi_id: e.target.value })}
                      className="h-8 text-xs border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDoctorModalOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saveDoctorMutation.isPending || !doctorForm.name.trim()}
                onClick={() => saveDoctorMutation.mutate(doctorForm)}
                className="h-8 text-xs bg-primary hover:bg-teal-800 text-white font-bold cursor-pointer"
              >
                {saveDoctorMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: HOSPITAL DEFAULT COMMISSION RULES
      ════════════════════════════════════════════════════════════════════ */}
      {isCommissionConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-teal-700" />
                  Hospital Referral Commission Rules
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Default commission % applied to each departmental subsection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCommissionConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">OPD Consultation %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.opd_pct}
                    onChange={(e) => setConfigForm({ ...configForm, opd_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Pharmacy Medicines %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.pharmacy_pct}
                    onChange={(e) => setConfigForm({ ...configForm, pharmacy_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">IUI Services %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.iui_pct}
                    onChange={(e) => setConfigForm({ ...configForm, iui_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">IVF / Embryology %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.embryology_pct}
                    onChange={(e) => setConfigForm({ ...configForm, embryology_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold text-purple-900 bg-purple-50/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">LIMS / Diagnostics %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.lims_pct}
                    onChange={(e) => setConfigForm({ ...configForm, lims_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">IPD / Procedures %</label>
                  <Input
                    type="number"
                    step="0.5"
                    value={configForm.ipd_pct}
                    onChange={(e) => setConfigForm({ ...configForm, ipd_pct: Number(e.target.value) })}
                    className="h-8 text-xs border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCommissionConfigOpen(false)}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={saveCommissionConfigMutation.isPending}
                onClick={() => saveCommissionConfigMutation.mutate(configForm)}
                className="h-8 text-xs bg-primary hover:bg-teal-800 text-white font-bold cursor-pointer"
              >
                {saveCommissionConfigMutation.isPending ? 'Saving...' : 'Save Default Rules'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: OFFICIAL PRINTABLE DOCTOR SETTLEMENT VOUCHER (UNIFIED)
      ════════════════════════════════════════════════════════════════════ */}
      {voucherSettlement && (
        <PrintableSettlementVoucher
          isOpen={!!voucherSettlement}
          onClose={() => setVoucherSettlement(null)}
          settlement={voucherSettlement}
          doctorDetail={doctorDetail}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: 1-CLICK DOCTOR REFERRAL STATEMENT (UNIFIED WITH MODES)
      ════════════════════════════════════════════════════════════════════ */}
      {isDoctorStatementOpen && doctorDetail && (
        <PrintableDoctorStatement
          isOpen={isDoctorStatementOpen}
          onClose={() => setIsDoctorStatementOpen(false)}
          doctorDetail={doctorDetail}
        />
      )}
    </PageLayout>
  );
}
