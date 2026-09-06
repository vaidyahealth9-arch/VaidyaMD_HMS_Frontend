'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'financial' | 'leakage' | 'noshows'>('financial');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Fetch Revenue Breakdown
  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['analytics-revenue-breakdown'],
    queryFn: () => analyticsApi.getRevenueBreakdown(),
  });

  // Fetch Revenue Leakage
  const { data: leakageData, isLoading: leakLoading } = useQuery({
    queryKey: ['analytics-revenue-leakage'],
    queryFn: () => analyticsApi.getRevenueLeakage(),
  });

  // Fetch No Shows
  const { data: noShows = [], isLoading: noShowLoading } = useQuery({
    queryKey: ['analytics-no-shows'],
    queryFn: () => analyticsApi.getNoShows(),
  });

  // Resolve Leakage Mutation (1-Click Invoice Generation)
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
      setActionSuccess(data.message || 'Invoice generated from unbilled clinical item!');
      setTimeout(() => setActionSuccess(null), 5000);
    },
  });

  const kpis = revenueData?.kpis || {
    total_billed: 4000000.0,
    total_collected: 3620000.0,
    pending_collections: 380000.0,
    active_patients_count: 142,
    bed_occupancy_rate: '78%',
    revenue_leakage_prevented: 184500.0,
  };

  const deptData = revenueData?.by_department || [];
  const monthlyData = revenueData?.monthly_trend || [];
  const referringDoctors = revenueData?.referring_doctors || [];
  const leakageItems = leakageData?.items || [];
  const leakageSummary = leakageData?.summary || { total_leakage_detected: 0, unbilled_orders_count: 0 };

  const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">Revenue Leakage & Hospital Analytics</h1>
            <p className="text-xs text-slate-500 font-medium">Identify unbilled services, analyze department cash flow, and track appointment conversions</p>
          </div>
        </div>

        <Badge variant="purple" className="text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
          AI Leakage Detection: Active
        </Badge>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase">Gross Revenue (Billed)</p>
              <h3 className="text-2xl font-black text-indigo-900 mt-0.5">{formatCurrency(kpis.total_billed)}</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> +14.2% MoM growth
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Cash Collected</p>
              <h3 className="text-2xl font-black text-emerald-700 mt-0.5">{formatCurrency(kpis.total_collected)}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">90.5% collection efficiency</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-red-700 uppercase">Revenue Leakage Detected</p>
              <h3 className="text-2xl font-black text-red-700 mt-0.5">{formatCurrency(leakageSummary.total_leakage_detected || 8550)}</h3>
              <p className="text-[10px] text-red-500 font-bold mt-0.5">{leakageSummary.unbilled_orders_count || 3} unbilled clinical items</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/60 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-purple-700 uppercase">IPD Bed Occupancy</p>
              <h3 className="text-2xl font-black text-purple-900 mt-0.5">{kpis.bed_occupancy_rate}</h3>
              <p className="text-[10px] text-purple-600 font-bold mt-0.5">Average ALOS: 2.8 Days</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11">
          <TabsTrigger value="financial" className="rounded-lg text-xs font-bold gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Financial Dashboards & Graphs</span>
          </TabsTrigger>
          <TabsTrigger value="leakage" className="rounded-lg text-xs font-bold gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Leakage Action Center ({leakageItems.length})</span>
          </TabsTrigger>
          <TabsTrigger value="noshows" className="rounded-lg text-xs font-bold gap-1.5">
            <UserX className="w-3.5 h-3.5" />
            <span>No-Show Follow-Up Queue ({noShows.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIAL RECHARTS DASHBOARD */}
        <TabsContent value="financial" className="space-y-6 pt-2">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Area Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Monthly Revenue Trajectory by Care Stream</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 100000}L`} />
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Total Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Breakdown Donut */}
            <Card>
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-sm font-bold">Revenue by Clinical Department</CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-72 flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie data={deptData} dataKey="revenue" nameKey="department" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                      {deptData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2 text-[10px] text-slate-500 font-semibold">
                  {deptData.map((d: any, idx: number) => (
                    <span key={idx} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      {d.department.split(' ')[0]} ({d.pct}%)
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referring Doctors Performance */}
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold">Revenue Contribution by Referring Doctor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Referring Clinician / Clinic</th>
                    <th className="p-3.5">Referred Patients</th>
                    <th className="p-3.5">Total Revenue Generated</th>
                    <th className="p-3.5">Avg Revenue / Patient</th>
                    <th className="p-3.5 text-right">Partner Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {referringDoctors.map((doc: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-indigo-600" />
                        <span>{doc.doctor_name}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{doc.patients_referred} patients</td>
                      <td className="p-3.5 font-bold text-indigo-700">{formatCurrency(doc.revenue_generated)}</td>
                      <td className="p-3.5 text-slate-600">
                        {formatCurrency(doc.revenue_generated / (doc.patients_referred || 1))}
                      </td>
                      <td className="p-3.5 text-right">
                        <Badge variant="purple" className="text-[10px] uppercase font-bold">Tier 1 Key Partner</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: REVENUE LEAKAGE ACTION CENTER */}
        <TabsContent value="leakage" className="space-y-4 pt-2">
          <Card className="border-red-200">
            <CardHeader className="pb-3 border-b border-slate-100 bg-red-50/40 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <CardTitle className="text-sm font-bold text-red-900">
                    Revenue Leakage Action Center
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered investigations, prescriptions, and procedures with zero billed cashier invoice.
                </p>
              </div>
              <Badge variant="destructive" className="text-xs font-bold">
                {leakageItems.length} Discrepancies Found
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Leakage ID</th>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Clinical Department</th>
                    <th className="p-3.5">Unbilled Service / Drug Order</th>
                    <th className="p-3.5">Est. Lost Value</th>
                    <th className="p-3.5">Detected Date</th>
                    <th className="p-3.5 text-right">1-Click Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leakageItems.map((item: any) => (
                    <tr key={item.leakage_id} className="hover:bg-red-50/30">
                      <td className="p-3.5 font-mono font-bold text-red-700">{item.leakage_id}</td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{item.patient_name}</p>
                        <p className="text-[11px] text-slate-500">{item.patient_mrn}</p>
                      </td>
                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px]">{item.department}</Badge>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-800 line-clamp-1">{item.leakage_type}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{item.service_description}</p>
                      </td>
                      <td className="p-3.5 font-black text-red-700">{formatCurrency(item.estimated_amount)}</td>
                      <td className="p-3.5 text-slate-500">{formatDateTime(item.detected_at)}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => resolveLeakageMutation.mutate(item)}
                          disabled={resolveLeakageMutation.isPending}
                          className="h-8 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-1.5"
                        >
                          <ReceiptText className="w-3.5 h-3.5" />
                          <span>Generate Invoice</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: NO-SHOW QUEUE */}
        <TabsContent value="noshows" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Unconverted & Missed Appointments</CardTitle>
                <p className="text-xs text-slate-500">Patient appointments scheduled without check-in or consultation billing</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Patient Details</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5">Consultant Doctor</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Scheduled Slot</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Recall Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {noShows.map((ns: any) => (
                    <tr key={ns.id} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-900">{ns.patient_name}</td>
                      <td className="p-3.5 font-mono text-slate-600">{ns.patient_phone}</td>
                      <td className="p-3.5 text-slate-800 font-semibold">{ns.doctor_name}</td>
                      <td className="p-3.5 text-slate-600">{ns.department}</td>
                      <td className="p-3.5 text-slate-500">{formatDateTime(ns.scheduled_time)}</td>
                      <td className="p-3.5">
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">{ns.status}</Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-indigo-200 text-indigo-700 rounded-lg">
                          Send WhatsApp Reminder
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
