'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import TabBar from '@/components/common/TabBar';
import { analyticsApi } from '@/lib/api';
import {
  TrendingUp,
  AlertTriangle,
  ReceiptText,
  IndianRupee,
  UserX,
  CheckCircle2,
  BarChart3,
  Building2,
  Download,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { formatCurrency } from '@/lib/utils';
import {
  FinancialTab,
  LeakageTab,
  NoShowsTab,
  ClinicalTab,
} from '@/components/analytics';

const TIMEFRAME_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'All Time', value: 'all' },
];

export default function AnalyticsPage() {
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
    refetch: refetchLeakage,
  } = useQuery({
    queryKey: ['analytics-revenue-leakage'],
    queryFn: () => analyticsApi.getRevenueLeakage(),
  });

  // 3. Fetch No Shows
  const {
    data: noShows = [],
    refetch: refetchNoShows,
  } = useQuery({
    queryKey: ['analytics-no-shows'],
    queryFn: () => analyticsApi.getNoShows(),
  });

  // 4. Fetch Clinical ART Outcomes
  const {
    data: clinicalData,
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
      setActionSuccess(data?.message || 'Invoice successfully generated from unbilled clinical item!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  // Send WhatsApp Reminder Mutation with live WhatsApp Web dispatch
  const handleSendReminder = async (item: any) => {
    const appointmentId = typeof item === 'string' ? item : item?.id;
    if (!appointmentId) return;
    try {
      setSendingReminderId(appointmentId);
      const res = await analyticsApi.sendNoShowReminder(appointmentId);
      queryClient.invalidateQueries({ queryKey: ['analytics-no-shows'] });

      const phone = res?.patient_phone || (typeof item === 'object' ? item.patient_phone : null);
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const patientName = res?.patient_name || (typeof item === 'object' ? item.patient_name : 'Patient');
        const doctorName = res?.doctor_name || (typeof item === 'object' ? item.doctor_name : 'our consultant');
        const msg = encodeURIComponent(
          `Dear ${patientName}, we noticed you missed your scheduled consultation with ${doctorName}. Please let us know if you would like us to reschedule your appointment at your convenience.`
        );
        window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank');
      }

      setActionSuccess(res?.message || 'WhatsApp recall reminder dispatched!');
      setTimeout(() => setActionSuccess(null), 5000);
    } catch {
      setActionSuccess(`Failed to send reminder.`);
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
    const rows = [
      ['Category', 'Metric', 'Value'],
      ['Revenue', 'Total Billed', revenueData?.kpis?.total_billed || 0],
      ['Revenue', 'Total Collected', revenueData?.kpis?.total_collected || 0],
      ['Revenue', 'Pending Collections', revenueData?.kpis?.pending_collections || 0],
      ['Revenue', 'Collection Efficiency %', revenueData?.kpis?.collection_efficiency_pct || 0],
      ['Leakage', 'Unbilled Orders Count', leakageData?.summary?.unbilled_orders_count || 0],
      ['Leakage', 'Est. Lost Revenue', leakageData?.summary?.total_leakage_detected || 0],
      ['Retention', 'Missed Appointments Count', noShows.length || 0],
      ['Clinical', 'Total Treatment Cycles', clinicalData?.cycle_summary?.total_cycles || 0],
      ['Clinical', 'Completed Cycles', clinicalData?.cycle_summary?.completed || 0],
      ['Clinical', 'Completion Rate %', clinicalData?.cycle_summary?.completion_rate_pct || 0],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vaidyamd_analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe data accessors
  const kpis = revenueData?.kpis || {
    total_billed: 0,
    total_collected: 0,
    pending_collections: 0,
    collection_efficiency_pct: 0,
    bed_occupancy_rate: '0%',
    occupied_beds: 0,
    total_beds: 0,
    active_patients_count: 0,
  };

  const monthlyData = revenueData?.monthly_trajectory || [];
  const deptData = revenueData?.by_department || {};
  const deptPieData = Object.entries(deptData).map(([name, val]: any) => ({
    name,
    value: Number(val),
  }));

  const doctorBreakdown = revenueData?.by_doctor || [];
  const leakageItems = leakageData?.detected_leakages || [];
  const leakageSummary = leakageData?.summary || { total_leakage_detected: 0, unbilled_orders_count: 0 };
  const cycleSummary = clinicalData?.cycle_summary || {
    total_cycles: 0,
    running: 0,
    completed: 0,
    completion_rate_pct: 0,
    cancelled: 0,
  };
  const cyclesByType = clinicalData?.by_treatment_type || {};

  return (
    <PageLayout className="space-y-6">
      {/* Header & Controls */}
      <PageHeader
        title="Hospital Performance & Clinical Analytics"
        subtitle="Live hospital financial metrics, AI revenue leakage auditing, patient retention queues, and ART clinical outcomes"
        icon={TrendingUp}
        titleBadge={
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded">
            Live Data
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {TIMEFRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTimeframe(opt.value)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    timeframe === opt.value
                      ? 'bg-white text-primary shadow-sm'
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
        }
      />

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Real-time KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed Revenue */}
        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gross Billed Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {formatCurrency(kpis.total_billed)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Pending: <span className="font-semibold text-amber-600">{formatCurrency(kpis.pending_collections)}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Cash Collected */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white shadow-sm">
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
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Bed Occupancy &amp; EMR</p>
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
      <TabBar
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as any)}
        tabs={[
          { id: 'financial', label: 'Financial & Streams', icon: BarChart3 },
          { id: 'leakage', label: 'Leakage Action Center', icon: AlertTriangle, badge: leakageItems.length || undefined },
          { id: 'noshows', label: 'No-Show & Recall Queue', icon: UserX, badge: noShows.length || undefined },
          { id: 'clinical', label: 'Clinical & ART Outcomes', icon: Activity },
        ]}
      />

      {/* TAB 1: FINANCIAL & REVENUE STREAMS */}
      {activeTab === 'financial' && (
        <FinancialTab
          monthlyData={monthlyData}
          deptPieData={deptPieData}
          doctorBreakdown={doctorBreakdown}
        />
      )}

      {/* TAB 2: REVENUE LEAKAGE ACTION CENTER */}
      {activeTab === 'leakage' && (
        <LeakageTab
          leakageSummary={leakageSummary}
          leakageItems={leakageItems}
          onResolve={(item) => resolveLeakageMutation.mutate(item)}
          isResolving={resolveLeakageMutation.isPending}
        />
      )}

      {/* TAB 3: NO-SHOW & RECALL QUEUE */}
      {activeTab === 'noshows' && (
        <NoShowsTab
          noShows={noShows}
          onSendReminder={handleSendReminder}
          sendingReminderId={sendingReminderId}
        />
      )}

      {/* TAB 4: CLINICAL & ART OUTCOMES */}
      {activeTab === 'clinical' && (
        <ClinicalTab
          cycleSummary={cycleSummary}
          cyclesByType={cyclesByType}
          cityData={cityData}
        />
      )}
    </PageLayout>
  );
}
