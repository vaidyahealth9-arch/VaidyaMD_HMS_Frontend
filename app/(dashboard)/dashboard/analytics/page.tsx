'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  AlertTriangle,
  ReceiptText,
  DollarSign,
  UserX,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Building2,
  Stethoscope,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Download,
  Activity,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  Users,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const TIMEFRAME_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'All Time', value: 'all' },
];

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeframe, setTimeframe] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'financial' | 'leakage' | 'noshows' | 'clinical'>('financial');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

  // 1. Fetch Revenue Breakdown (with timeframe)
  const {
    data: revenueData,
    isLoading: revLoading,
    isRefetching: revRefetching,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ['analytics-revenue-breakdown', timeframe],
    queryFn: () => analyticsApi.getRevenueBreakdown(timeframe),
  });

  // 2. Fetch Revenue Leakage
  const {
    data: leakageData,
    isLoading: leakLoading,
    refetch: refetchLeakage,
  } = useQuery({
    queryKey: ['analytics-revenue-leakage'],
    queryFn: () => analyticsApi.getRevenueLeakage(),
  });

  // 3. Fetch No Shows
  const {
    data: noShows = [],
    isLoading: noShowLoading,
    refetch: refetchNoShows,
  } = useQuery({
    queryKey: ['analytics-no-shows'],
    queryFn: () => analyticsApi.getNoShows(),
  });

  // 4. Fetch Clinical ART Outcomes
  const {
    data: clinicalData,
    isLoading: clinicalLoading,
    refetch: refetchClinical,
  } = useQuery({
    queryKey: ['analytics-clinical-outcomes'],
    queryFn: () => analyticsApi.getClinicalOutcomes().catch(() => null),
  });

  // 5. Fetch Geographic Distribution
  const { data: cityData = [] } = useQuery({
    queryKey: ['analytics-patients-city'],
    queryFn: () => analyticsApi.getPatientsByCity().catch(() => []),
  });

  // 1-Click Resolve Leakage Mutation
  const resolveLeakageMutation = useMutation({
    mutationFn: (item: any) =>
      analyticsApi.resolveLeakage({
        leakage_item_id: item.leakage_id,
        patient_id: item.patient_id,
        item_description: item.service_description,
        amount: item.estimated_amount,
        department: item.department,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['analytics-revenue-leakage'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-revenue-breakdown'] });
      setActionSuccess(data.message || 'Invoice successfully generated from unbilled clinical item!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  // Send WhatsApp Reminder Mutation
  const handleSendReminder = async (appointmentId: string) => {
    try {
      setSendingReminderId(appointmentId);
      const res = await analyticsApi.sendNoShowReminder(appointmentId);
      queryClient.invalidateQueries({ queryKey: ['analytics-no-shows'] });
      setActionSuccess(res.message || 'WhatsApp recall reminder sent!');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleRefreshAll = () => {
    refetchRevenue();
    refetchLeakage();
    refetchNoShows();
    refetchClinical();
  };

  const exportCSV = () => {
    if (!revenueData) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Billed (INR)', revenueData.kpis?.total_billed || 0],
      ['Total Collected (INR)', revenueData.kpis?.total_collected || 0],
      ['Pending Collections (INR)', revenueData.kpis?.pending_collections || 0],
      ['Collection Efficiency (%)', revenueData.kpis?.collection_efficiency_pct || 0],
      ['Active Patients', revenueData.kpis?.active_patients_count || 0],
      ['Bed Occupancy', revenueData.kpis?.bed_occupancy_rate || '0%'],
      ['Leakage Prevented (INR)', revenueData.kpis?.revenue_leakage_prevented || 0],
      [],
      ['Department', 'Revenue (INR)', 'Share (%)'],
      ...(revenueData.by_department || []).map((d: any) => [d.department, d.revenue, `${d.pct}%`]),
      [],
      ['Referring Partner', 'Referral Type', 'Patients Referred', 'Revenue Generated (INR)'],
      ...(revenueData.referring_doctors || []).map((r: any) => [r.doctor_name, r.referral_type, r.patients_referred, r.revenue_generated]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VaidyaMD_Analytics_Report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = revenueData?.kpis || {
    total_billed: 0,
    total_collected: 0,
    pending_collections: 0,
    collection_efficiency_pct: 0,
    active_patients_count: 0,
    bed_occupancy_rate: '0%',
    total_beds: 0,
    occupied_beds: 0,
    vacant_beds: 0,
    revenue_leakage_prevented: 0,
    invoices_count: 0,
  };

  const deptData = revenueData?.by_department || [];
  const monthlyData = revenueData?.monthly_trend || [];
  const referringDoctors = revenueData?.referring_doctors || [];
  const leakageItems = leakageData?.items || [];
  const leakageSummary = leakageData?.summary || {
    total_leakage_detected: 0,
    unbilled_orders_count: 0,
    unbilled_prescriptions_count: 0,
    unbilled_diagnostics_count: 0,
    unbilled_consultations_count: 0,
  };

  const cycleSummary = clinicalData?.summary || {
    total_cycles: 0,
    running: 0,
    completed: 0,
    cancelled: 0,
    completion_rate_pct: 0,
  };
  const cyclesByType = clinicalData?.by_treatment_type || {};

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] border border-[rgb(var(--clr-primary)/0.25)] flex items-center justify-center text-[rgb(var(--clr-primary))] shadow-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Hospital Performance & Clinical Analytics
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
                Live Data
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Live hospital financial metrics, AI revenue leakage auditing, patient retention queues, and ART clinical outcomes
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {TIMEFRAME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTimeframe(opt.value)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  timeframe === opt.value
                    ? 'bg-white text-[rgb(var(--clr-primary))] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="h-8 text-xs font-semibold gap-1.5 border-slate-200"
            title="Download CSV Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={revLoading || revRefetching}
            className="h-8 text-xs font-semibold gap-1.5 border-slate-200"
            title="Refresh Database Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revLoading || revRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TOP KPI CARDS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Gross Revenue Billed */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Billed</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {formatCurrency(kpis.total_billed)}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {kpis.invoices_count} invoices generated
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Cash Collected */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Cash Collected</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
                {formatCurrency(kpis.total_collected)}
              </h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>{kpis.collection_efficiency_pct}% collection efficiency</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Dues & Revenue Leakage */}
        <Card className="border-red-200 bg-gradient-to-br from-red-50/40 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Unbilled Leakage / Dues</p>
              <h3 className="text-2xl font-bold text-red-700 mt-0.5">
                {formatCurrency(leakageSummary.total_leakage_detected || kpis.pending_collections)}
              </h3>
              <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                {leakageSummary.unbilled_orders_count} unbilled items detected
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* IPD Bed Occupancy & Patients */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/40 to-white shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Bed Occupancy & EMR</p>
              <h3 className="text-2xl font-bold text-purple-900 mt-0.5">
                {kpis.bed_occupancy_rate}
              </h3>
              <p className="text-[11px] text-purple-700 font-medium mt-0.5">
                {kpis.occupied_beds} occupied / {kpis.total_beds} total beds ({kpis.active_patients_count} patients)
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg h-10">
          <TabsTrigger value="financial" className="rounded-md text-xs font-semibold gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Financial & Streams</span>
          </TabsTrigger>
          <TabsTrigger value="leakage" className="rounded-md text-xs font-semibold gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Leakage Action Center ({leakageItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="noshows" className="rounded-md text-xs font-semibold gap-1.5">
            <UserX className="w-3.5 h-3.5 text-amber-500" />
            <span>No-Show & Recall Queue ({noShows.length})</span>
          </TabsTrigger>
          <TabsTrigger value="clinical" className="rounded-md text-xs font-semibold gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
            <span>Clinical & ART Outcomes</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIAL & REVENUE STREAMS */}
        <TabsContent value="financial" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <Card className="lg:col-span-2 border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Monthly Revenue Trajectory (Past 6 Months)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Chronological billing trajectory aggregated directly from cashier invoices
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    Real Invoices
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-72">
                {monthlyData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No monthly records available for selected timeframe.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickFormatter={(v) => (v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v}`)}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                        labelFormatter={(lbl, p) => `${lbl} ${p?.[0]?.payload?.year || ''}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#4f46e5"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRev)"
                        name="Total Billed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Department Breakdown Donut */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Revenue by Care Stream
                </CardTitle>
                <CardDescription className="text-xs">
                  Partitioned across OPD, IVF, Pharmacy, IPD & Lab
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-72 flex flex-col justify-center">
                {kpis.total_billed === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1">
                    <PieChartIcon className="w-8 h-8 text-slate-300" />
                    <span>No billed invoices in this timeframe</span>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="75%">
                      <PieChart>
                        <Pie
                          data={deptData}
                          dataKey="revenue"
                          nameKey="department"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={75}
                          paddingAngle={3}
                        >
                          {deptData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-2 mt-1 text-[10px] text-slate-600 font-medium">
                      {deptData.map((d: any, idx: number) => (
                        <span key={idx} className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {d.department.split(' ')[0]} ({d.pct}%)
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Referring Doctors & Channels Performance */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    Referring Clinician & Marketing Channel Performance
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Patient volume and gross revenue conversion by referral partner and channel
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-semibold">
                  {referringDoctors.length} Channels Tracked
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {referringDoctors.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No referral sources recorded for active patients.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Referral Partner / Source</th>
                      <th className="p-3.5">Channel Type</th>
                      <th className="p-3.5">Referred Patients</th>
                      <th className="p-3.5">Total Revenue Generated</th>
                      <th className="p-3.5">Cash Collected</th>
                      <th className="p-3.5 text-right">Avg Revenue / Patient</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {referringDoctors.map((doc: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                          <span>{doc.doctor_name}</span>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                            {doc.referral_type}
                          </Badge>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {doc.patients_referred} {doc.patients_referred === 1 ? 'patient' : 'patients'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatCurrency(doc.revenue_generated)}
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-700">
                          {formatCurrency(doc.total_collected)}
                        </td>
                        <td className="p-3.5 text-right text-slate-600 font-mono">
                          {formatCurrency(doc.avg_per_patient)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REVENUE LEAKAGE ACTION CENTER */}
        <TabsContent value="leakage" className="space-y-4 pt-3">
          <Card className="border-red-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 bg-red-50/30 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <CardTitle className="text-sm font-bold text-red-900">
                    Revenue Leakage Action Center
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-600 mt-0.5">
                  Identifies clinical investigations, prescriptions, and completed procedures lacking an invoice at the cashier.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-semibold bg-white border-red-200 text-red-700">
                  Est. Unbilled Value: {formatCurrency(leakageSummary.total_leakage_detected)}
                </Badge>
                <Badge variant="destructive" className="text-xs font-bold">
                  {leakageItems.length} Discrepancies
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {leakageItems.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Zero Revenue Leakage Detected</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    All ordered diagnostic investigations, prescriptions, and completed procedures currently have matching billed invoices.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Leakage Ref</th>
                      <th className="p-3.5">Patient Details</th>
                      <th className="p-3.5">Care Stream</th>
                      <th className="p-3.5">Unbilled Service / Drug Order</th>
                      <th className="p-3.5">Est. Lost Value</th>
                      <th className="p-3.5">Detected Date</th>
                      <th className="p-3.5 text-right">1-Click Resolution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leakageItems.map((item: any) => (
                      <tr key={item.leakage_id} className="hover:bg-red-50/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-red-700">{item.leakage_id}</td>
                        <td className="p-3.5">
                          <Link
                            href={`/patients/${item.patient_id}`}
                            className="font-bold text-slate-900 hover:text-[rgb(var(--clr-primary))] transition-colors"
                          >
                            {item.patient_name}
                          </Link>
                          <p className="text-[11px] text-slate-500 font-mono">{item.patient_mrn}</p>
                        </td>
                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px]">
                            {item.department}
                          </Badge>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="font-bold text-slate-800 line-clamp-1">{item.leakage_type}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{item.service_description}</p>
                        </td>
                        <td className="p-3.5 font-bold text-red-700">{formatCurrency(item.estimated_amount)}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{formatDateTime(item.detected_at)}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => resolveLeakageMutation.mutate(item)}
                            disabled={resolveLeakageMutation.isPending}
                            className="h-8 px-3 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                          >
                            <ReceiptText className="w-3.5 h-3.5" />
                            <span>Generate Invoice</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: NO-SHOW & RECALL QUEUE */}
        <TabsContent value="noshows" className="space-y-4 pt-3">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Unconverted & Missed Appointment Queue
                </CardTitle>
                <CardDescription className="text-xs">
                  Appointments scheduled in the past that were never checked in, billed, or completed.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold text-amber-700 border-amber-200 bg-amber-50">
                {noShows.length} Pending Recalls
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {noShows.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No Missed Appointments</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    All past scheduled appointments were either checked in, completed, or cancelled with notice.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Patient Details</th>
                      <th className="p-3.5">Contact Phone</th>
                      <th className="p-3.5">Consultant Doctor</th>
                      <th className="p-3.5">Care Stream</th>
                      <th className="p-3.5">Scheduled Slot (Past)</th>
                      <th className="p-3.5">Recall Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {noShows.map((ns: any) => (
                      <tr key={ns.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <Link
                            href={`/patients/${ns.patient_id}`}
                            className="font-bold text-slate-900 hover:text-[rgb(var(--clr-primary))]"
                          >
                            {ns.patient_name}
                          </Link>
                          <p className="text-[11px] text-slate-500 font-mono">{ns.patient_vid}</p>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">{ns.patient_phone}</td>
                        <td className="p-3.5 text-slate-800 font-semibold">{ns.doctor_name}</td>
                        <td className="p-3.5 text-slate-600">{ns.department}</td>
                        <td className="p-3.5 text-slate-500">{formatDateTime(ns.scheduled_time)}</td>
                        <td className="p-3.5">
                          {ns.reminders_count > 0 ? (
                            <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50 font-semibold">
                              {ns.reminders_count} Reminder(s) Dispatched
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                              No Recall Sent
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendReminder(ns.id)}
                            disabled={sendingReminderId === ns.id}
                            className="h-7 text-xs font-semibold border-[rgb(var(--clr-primary)/0.3)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.05)] rounded gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>{sendingReminderId === ns.id ? 'Sending...' : 'WhatsApp Reminder'}</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CLINICAL & ART OUTCOMES */}
        <TabsContent value="clinical" className="space-y-6 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Total Treatment Cycles</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{cycleSummary.total_cycles}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">IVF, ICSI, FET & IUI protocols</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/30 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Active Running Cycles</p>
                <h3 className="text-2xl font-bold text-blue-800 mt-0.5">{cycleSummary.running}</h3>
                <p className="text-[11px] text-blue-600 mt-0.5">Under stimulation or lab culture</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Completed Cycles</p>
                <h3 className="text-2xl font-bold text-emerald-800 mt-0.5">{cycleSummary.completed}</h3>
                <p className="text-[11px] text-emerald-600 mt-0.5">{cycleSummary.completion_rate_pct}% completion rate</p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-amber-700 uppercase">Cancelled Cycles</p>
                <h3 className="text-2xl font-bold text-amber-800 mt-0.5">{cycleSummary.cancelled}</h3>
                <p className="text-[11px] text-amber-600 mt-0.5">Poor response / medical halt</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Treatment Protocol Distribution */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">
                  Cycle Breakdown by Treatment Protocol
                </CardTitle>
                <CardDescription className="text-xs">
                  Relative proportion of active & historical fertility treatment pathways
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {Object.keys(cyclesByType).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No clinical treatment cycles recorded yet.
                  </div>
                ) : (
                  Object.entries(cyclesByType).map(([proto, count]: any, idx: number) => {
                    const pct = Math.round((count / (cycleSummary.total_cycles || 1)) * 100);
                    return (
                      <div key={proto} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-800 uppercase">{proto}</span>
                          <span className="text-slate-500 font-mono">
                            {count} cycles ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: COLORS[idx % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Patient Demographics by City / Area
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Geographical catchment zone and lead source density
                    </CardDescription>
                  </div>
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {cityData.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No geographical catchment data recorded yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cityData.slice(0, 6).map((city: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 text-xs"
                      >
                        <span className="font-semibold text-slate-800">{city.area || 'City Area'}</span>
                        <Badge variant="outline" className="font-mono text-slate-600">
                          {city.patient_count} patients
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
