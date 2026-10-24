'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeartHandshake,
  Download,
  Search,
  CreditCard,
  User,
  Activity,
  CheckCircle2,
  Clock,
  Printer,
  Percent,
  X,
  Stethoscope,
  Building2,
  RefreshCw,
  Plus,
  Receipt,
  Sparkles,
  DollarSign,
  TrendingUp,
  FlaskConical,
  Pill,
  Microscope,
  BedDouble,
  ArrowRight,
  FileSpreadsheet,
} from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { referralsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type {
  HospitalReferralOverviewResponse,
  DoctorDirectoryItem,
  CommissionConfigSchema,
  ReferringDoctorCreate,
  ReferralSettlementCreate,
  ReferralSettlement,
  DoctorHierarchyDetailResponse,
} from '@/features/referrals/types';
import PrintableDoctorStatement from '@/components/referrals/PrintableDoctorStatement';
import PrintableSettlementVoucher from '@/components/referrals/PrintableSettlementVoucher';
import SettlementModal from '@/components/referrals/SettlementModal';

export default function ReferralsOverviewPage() {
  const queryClient = useQueryClient();
  const { currentBranch, user } = useAuth() || {};

  // League Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'unsettled' | 'converted'>('all');

  // Modals
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

  // Statement Modal State
  const [selectedDoctorForStatement, setSelectedDoctorForStatement] = useState<string | null>(null);

  // Settlement Modal State
  const [doctorToSettle, setDoctorToSettle] = useState<string | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState<string>('bank_transfer');
  const [settlementReference, setSettlementReference] = useState<string>('');
  const [settlementNotes, setSettlementNotes] = useState<string>('');
  const [settlementDate, setSettlementDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [voucherSettlement, setVoucherSettlement] = useState<ReferralSettlement | null>(null);

  // ─── Queries ───
  const { data: overview, isLoading, isError, refetch } = useQuery<HospitalReferralOverviewResponse>({
    queryKey: ['referrals-hospital-overview'],
    queryFn: () => referralsApi.getOverview(),
  });

  const { data: commissionSettings } = useQuery<CommissionConfigSchema>({
    queryKey: ['referrals-commission-settings'],
    queryFn: () => referralsApi.getCommissionSettings(),
  });

  React.useEffect(() => {
    if (commissionSettings) {
      setConfigForm(commissionSettings);
    }
  }, [commissionSettings]);

  // Doctor detail query for statement modal
  const { data: statementDoctorDetail } = useQuery<DoctorHierarchyDetailResponse>({
    queryKey: ['referrals-doctor-detail', selectedDoctorForStatement],
    queryFn: () => referralsApi.getDoctorDetail(selectedDoctorForStatement!),
    enabled: !!selectedDoctorForStatement,
  });

  // Doctor detail query for quick settlement modal
  const { data: settleDoctorDetail } = useQuery<DoctorHierarchyDetailResponse>({
    queryKey: ['referrals-doctor-detail-settle', doctorToSettle],
    queryFn: () => referralsApi.getDoctorDetail(doctorToSettle!),
    enabled: !!doctorToSettle,
  });

  // Doctor detail query for voucher print breakdown
  const { data: voucherDoctorDetail } = useQuery<DoctorHierarchyDetailResponse>({
    queryKey: ['referrals-doctor-detail-voucher', voucherSettlement?.doctor_name],
    queryFn: () => referralsApi.getDoctorDetail(voucherSettlement!.doctor_name),
    enabled: !!voucherSettlement?.doctor_name,
  });

  // Mutations
  const saveDoctorMutation = useMutation({
    mutationFn: (payload: ReferringDoctorCreate) => referralsApi.saveDoctorProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-hospital-overview'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-directory'] });
      setIsDoctorModalOpen(false);
    },
  });

  const saveCommissionConfigMutation = useMutation({
    mutationFn: (payload: CommissionConfigSchema) => referralsApi.saveCommissionSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-commission-settings'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-hospital-overview'] });
      setIsCommissionConfigOpen(false);
    },
  });

  const settleCommissionMutation = useMutation({
    mutationFn: (payload: ReferralSettlementCreate) => referralsApi.settleCommission(payload),
    onSuccess: (settlement) => {
      queryClient.invalidateQueries({ queryKey: ['referrals-hospital-overview'] });
      queryClient.invalidateQueries({ queryKey: ['referrals-directory'] });
      setDoctorToSettle(null);
      setVoucherSettlement(settlement);
    },
  });

  // Filtered Doctors League Table
  const filteredDoctors = useMemo(() => {
    if (!overview?.doctors_league) return [];
    let list = overview.doctors_league;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.doctor_name.toLowerCase().includes(q) ||
          (d.doctor_profile?.clinic_name && d.doctor_profile.clinic_name.toLowerCase().includes(q)) ||
          (d.doctor_profile?.specialty && d.doctor_profile.specialty.toLowerCase().includes(q)) ||
          (d.doctor_profile?.phone && d.doctor_profile.phone.toLowerCase().includes(q))
      );
    }

    if (tableFilter === 'unsettled') {
      list = list.filter((d) => d.has_unsettled);
    } else if (tableFilter === 'converted') {
      list = list.filter((d) => (d.converted_count || 0) > 0);
    }

    return list;
  }, [overview, searchQuery, tableFilter]);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader
          title="Hospital Referral Operations"
          subtitle="Executive analytics, clinical cycle conversions, and commission liability"
          icon={HeartHandshake}
          titleBadge="Pro"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Loading consolidated hospital referral intelligence...
        </div>
      </PageLayout>
    );
  }

  if (isError || !overview) {
    return (
      <PageLayout>
        <PageHeader
          title="Hospital Referral Operations"
          subtitle="Executive analytics, clinical cycle conversions, and commission liability"
          icon={HeartHandshake}
          titleBadge="Pro"
        />
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <p className="font-semibold text-slate-700">Unable to load hospital referral data.</p>
          <Button size="sm" onClick={() => refetch()} className="h-8 text-xs bg-primary text-white">
            Retry Loading
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader
        title="Hospital Referral Operations"
        subtitle="Consolidated Executive Analytics, Doctor Performance & Payout Governance"
        icon={HeartHandshake}
        titleBadge="Pro"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/referrals/doctors">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold gap-1.5 border-teal-300 text-teal-800 bg-teal-50/50 hover:bg-teal-100/70 cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                Doctor Directory &amp; Payouts
                <ArrowRight className="w-3 h-3 text-teal-600" />
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
                window.open(referralsApi.getExportUrl(), '_blank');
              }}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Consolidated CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDoctorModalOpen(true)}
              className="h-8 text-xs font-bold gap-1.5 bg-primary hover:bg-teal-800 text-white cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Partner Doctor
            </Button>
          </div>
        }
      />
      <div className="space-y-5">
        {/* ════════════════════════════════════════════════════════════════════
            1. TOP EXECUTIVE KPI METRICS STRIP
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total Referral Revenue */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Referral Revenue</span>
              <DollarSign className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              ₹{Math.round(overview.total_referral_revenue).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
              <span>Paid: ₹{Math.round(overview.total_paid).toLocaleString('en-IN')}</span>
              {overview.total_due > 0 && (
                <span className="text-amber-700 font-semibold">
                  Due: ₹{Math.round(overview.total_due).toLocaleString('en-IN')}
                </span>
              )}
            </p>
          </div>

          {/* Referred Patients & Converted Cycles */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Referred Footfall</span>
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {overview.total_patients_count} <span className="text-xs font-normal text-slate-500">Patients</span>
            </p>
            <p className="text-[10px] text-teal-700 font-semibold pt-0.5">
              ✨ {overview.converted_cycles_count} Converted to IVF/IUI cycles
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Cycle Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-extrabold text-purple-900 font-mono tracking-tight">
              {overview.conversion_rate_pct}%
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              Proportion starting advanced clinical cycles
            </p>
          </div>

          {/* Commission Paid to Date */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Disbursed Payouts
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-emerald-800 font-mono tracking-tight">
              ₹{Math.round(overview.settled_commission).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-500 pt-0.5">
              Settled across doctor bank vouchers
            </p>
          </div>

          {/* Outstanding Liability */}
          <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs space-y-1 bg-amber-50/40">
            <div className="flex items-center justify-between text-amber-900">
              <span className="text-[10px] font-bold uppercase tracking-wider">Pending Liability</span>
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-xl font-extrabold text-amber-900 font-mono tracking-tight">
              ₹{Math.round(overview.pending_commission).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-amber-800 pt-0.5 font-medium">
              Unsettled commission dues owed
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            2. DEPARTMENTAL REVENUE SHARE DISTRIBUTION
        ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              Departmental Revenue Origin from Referrals
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Subsections classified automatically from line items
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Embryology / IVF */}
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/50 space-y-1">
              <div className="flex items-center justify-between text-purple-900">
                <span className="text-[10px] font-bold uppercase">IVF / Embryology</span>
                <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
              </div>
              <p className="text-sm font-extrabold text-purple-950 font-mono">
                ₹{Math.round(overview.departmental_totals.embryology).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Pharmacy */}
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center justify-between text-emerald-900">
                <span className="text-[10px] font-bold uppercase">Pharmacy Rx</span>
                <Pill className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <p className="text-sm font-extrabold text-emerald-950 font-mono">
                ₹{Math.round(overview.departmental_totals.pharmacy).toLocaleString('en-IN')}
              </p>
            </div>

            {/* LIMS */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 space-y-1">
              <div className="flex items-center justify-between text-amber-900">
                <span className="text-[10px] font-bold uppercase">Diagnostics &amp; Lab</span>
                <Microscope className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <p className="text-sm font-extrabold text-amber-950 font-mono">
                ₹{Math.round(overview.departmental_totals.lims).toLocaleString('en-IN')}
              </p>
            </div>

            {/* IPD / Procedures */}
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 space-y-1">
              <div className="flex items-center justify-between text-rose-900">
                <span className="text-[10px] font-bold uppercase">IPD / Procedures</span>
                <BedDouble className="w-3.5 h-3.5 text-rose-700" />
              </div>
              <p className="text-sm font-extrabold text-rose-950 font-mono">
                ₹{Math.round(overview.departmental_totals.ipd).toLocaleString('en-IN')}
              </p>
            </div>

            {/* IUI */}
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-1">
              <div className="flex items-center justify-between text-indigo-900">
                <span className="text-[10px] font-bold uppercase">IUI Insemination</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
              </div>
              <p className="text-sm font-extrabold text-indigo-950 font-mono">
                ₹{Math.round(overview.departmental_totals.iui).toLocaleString('en-IN')}
              </p>
            </div>

            {/* OPD */}
            <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 space-y-1">
              <div className="flex items-center justify-between text-blue-900">
                <span className="text-[10px] font-bold uppercase">OPD Consultations</span>
                <Stethoscope className="w-3.5 h-3.5 text-blue-700" />
              </div>
              <p className="text-sm font-extrabold text-blue-950 font-mono">
                ₹{Math.round(overview.departmental_totals.opd).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            3. DOCTOR PERFORMANCE LEAGUE TABLE
        ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
          {/* Table Header Controls */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                Referring Doctor Performance &amp; Commission League
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                {filteredDoctors.length} Doctors
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search doctor, clinic, specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-7.5 text-xs bg-white border-slate-200"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    tableFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({overview.doctors_league.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('unsettled')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    tableFilter === 'unsettled' ? 'bg-white text-amber-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Unsettled Liability
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('converted')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    tableFilter === 'converted' ? 'bg-white text-purple-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IVF/IUI Converters
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Referring Doctor &amp; Center</th>
                  <th className="py-2.5 px-3 text-center">Patients</th>
                  <th className="py-2.5 px-3 text-center">Converted Cycles</th>
                  <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  <th className="py-2.5 px-3 text-right">Realized Cash</th>
                  <th className="py-2.5 px-3 text-right">Commission Earned</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Liability</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No doctors matching the current search / filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Doctor Name & Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs border border-teal-200 flex-shrink-0">
                            {doc.doctor_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{doc.doctor_name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              {doc.doctor_profile?.clinic_name && (
                                <span>{doc.doctor_profile.clinic_name}</span>
                              )}
                              {doc.doctor_profile?.specialty && (
                                <span>· {doc.doctor_profile.specialty}</span>
                              )}
                              {doc.doctor_profile?.custom_commission_pct != null && (
                                <span className="text-teal-800 font-bold bg-teal-50 px-1 rounded">
                                  {doc.doctor_profile.custom_commission_pct}% custom
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Patients Count */}
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                        {doc.patient_count}
                      </td>

                      {/* Converted Cycles & Rate */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 border border-purple-200">
                            {doc.converted_count || 0} cycles ({doc.conversion_rate_pct || 0}%)
                          </span>
                        </div>
                      </td>

                      {/* Revenue */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{Math.round(doc.total_revenue).toLocaleString('en-IN')}
                      </td>

                      {/* Realized Cash */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-800">
                        ₹{Math.round(doc.total_paid).toLocaleString('en-IN')}
                      </td>

                      {/* Commission Earned */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-teal-900">
                        ₹{Math.round(doc.total_commission).toLocaleString('en-IN')}
                      </td>

                      {/* Pending Liability */}
                      <td className="py-3 px-3 text-right font-mono">
                        {doc.total_commission === 0 ? (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Non-Commissionable
                          </span>
                        ) : doc.pending_commission > 0 ? (
                          <span className="text-amber-900 font-extrabold bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200 text-xs">
                            ₹{Math.round(doc.pending_commission).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold text-[11px]">
                            Settled ✓
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/referrals/doctors?doctor=${encodeURIComponent(doc.doctor_name)}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6.5 px-2 text-[10px] font-semibold gap-1 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              Inspect
                              <ArrowRight className="w-2.5 h-2.5" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDoctorForStatement(doc.doctor_name)}
                            title="Generate Doctor Referral Statement"
                            className="h-6.5 px-2 text-[10px] font-semibold gap-1 border-teal-200 text-teal-800 hover:bg-teal-50 cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-teal-700" />
                            Statement
                          </Button>
                          {doc.pending_commission > 0 && (
                            <Button
                              size="sm"
                              onClick={() => setDoctorToSettle(doc.doctor_name)}
                              className="h-6.5 px-2 text-[10px] font-bold bg-teal-700 hover:bg-teal-800 text-white cursor-pointer shadow-xs"
                            >
                              Settle
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            4. RECENT PAYOUT SETTLEMENTS AUDIT FEED
        ════════════════════════════════════════════════════════════════════ */}
        {overview.recent_settlements && overview.recent_settlements.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                Recent Commission Disbursement Vouchers
              </h4>
              <Link
                href="/referrals/doctors"
                className="text-[11px] text-teal-800 font-semibold hover:underline flex items-center gap-1"
              >
                View all in Doctor Directory
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Voucher #</th>
                    <th className="py-2 px-3">Referring Doctor</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method &amp; Ref</th>
                    <th className="py-2 px-3">Invoices</th>
                    <th className="py-2 px-3 text-right">Amount Paid</th>
                    <th className="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overview.recent_settlements.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {st.settlement_number}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {st.doctor_name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{formatDate(st.settlement_date)}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-700">
                        <span className="uppercase font-semibold">{st.payment_method}</span>
                        {st.reference_number && (
                          <span className="text-slate-400 ml-1.5">({st.reference_number})</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                        {st.invoice_ids?.length || 0} bills
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
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: QUICK SETTLEMENT PAYOUT (WITH INVOICE CHECKBOXES)
      ════════════════════════════════════════════════════════════════════ */}
      {doctorToSettle && (
        <SettlementModal
          isOpen={!!doctorToSettle}
          onClose={() => setDoctorToSettle(null)}
          doctorDetail={settleDoctorDetail || null}
          onSettle={(payload) => settleCommissionMutation.mutate(payload)}
          isPending={settleCommissionMutation.isPending}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: 1-CLICK DOCTOR REFERRAL STATEMENT (UNIFIED WITH MODES)
      ════════════════════════════════════════════════════════════════════ */}
      {selectedDoctorForStatement && statementDoctorDetail && (
        <PrintableDoctorStatement
          isOpen={!!selectedDoctorForStatement}
          onClose={() => setSelectedDoctorForStatement(null)}
          doctorDetail={statementDoctorDetail}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: OFFICIAL PRINTABLE DOCTOR SETTLEMENT VOUCHER (UNIFIED)
      ════════════════════════════════════════════════════════════════════ */}
      {voucherSettlement && (
        <PrintableSettlementVoucher
          isOpen={!!voucherSettlement}
          onClose={() => setVoucherSettlement(null)}
          settlement={voucherSettlement}
          doctorDetail={voucherDoctorDetail || settleDoctorDetail || statementDoctorDetail || null}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: REGISTER PARTNER DOCTOR
      ════════════════════════════════════════════════════════════════════ */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-900/10 to-teal-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  Register Referring Partner Doctor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save doctor profile, clinical center, and bank account for settlements
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
                    placeholder="e.g. OB/GYN, IVF Specialist"
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
                    placeholder="e.g. Apex Fertility Clinic"
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
                    placeholder="Optional (overrides hospital default)"
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
                {saveDoctorMutation.isPending ? 'Saving...' : 'Register Doctor'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MODAL: COMMISSION RULES
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
    </PageLayout>
  );
}
