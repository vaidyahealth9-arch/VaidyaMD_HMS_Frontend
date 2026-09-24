'use client';

import React from 'react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Search,
  X,
  Plus,
  Loader2,
  Package,
  Sparkles,
  SlidersHorizontal,
  Printer,
  Receipt,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BookedPackagesTabProps {
  bookedPlans: any[];
  plansLoading: boolean;
  packagesSearchQuery: string;
  setPackagesSearchQuery: (q: string) => void;
  packagesFilter: 'all' | 'in_progress' | 'completed' | 'unbilled';
  setPackagesFilter: (f: 'all' | 'in_progress' | 'completed' | 'unbilled') => void;
  filteredBookedPlans: any[];
  expandedPlanIds: Record<string, boolean>;
  toggleExpandPlan: (planId: string) => void;
  onOpenBookingModal: () => void;
  onOpenEditSchedule: (plan: any) => void;
  onPrintSchedule: (plan: any) => void;
  onOpenBillingModal: (plan: any) => void;
  onUpdateSessionStatus: (sessionId: string, status: string) => void;
  isUpdatingSession: boolean;
}

export default function BookedPackagesTab({
  bookedPlans,
  plansLoading,
  packagesSearchQuery,
  setPackagesSearchQuery,
  packagesFilter,
  setPackagesFilter,
  filteredBookedPlans,
  expandedPlanIds,
  toggleExpandPlan,
  onOpenBookingModal,
  onOpenEditSchedule,
  onPrintSchedule,
  onOpenBillingModal,
  onUpdateSessionStatus,
  isUpdatingSession,
}: BookedPackagesTabProps) {
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64 sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              value={packagesSearchQuery}
              onChange={(e) => setPackagesSearchQuery(e.target.value)}
              placeholder="Search patient name, MRN, phone, package..."
              className="pl-8 pr-7 h-8 text-xs bg-slate-50"
            />
            {packagesSearchQuery && (
              <button
                type="button"
                onClick={() => setPackagesSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
            <button
              type="button"
              onClick={() => setPackagesFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                packagesFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({bookedPlans.length})
            </button>
            <button
              type="button"
              onClick={() => setPackagesFilter('in_progress')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                packagesFilter === 'in_progress'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              In Progress
            </button>
            <button
              type="button"
              onClick={() => setPackagesFilter('completed')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                packagesFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setPackagesFilter('unbilled')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                packagesFilter === 'unbilled'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending Bill
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-900">{filteredBookedPlans.length}</strong> of{' '}
            {bookedPlans.length} booked packages
          </span>
          <Button
            onClick={onOpenBookingModal}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold h-7.5 px-3 text-xs gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book Package</span>
          </Button>
        </div>
      </div>

      {/* Booked Plans List */}
      {plansLoading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading booked packages...</p>
        </div>
      ) : filteredBookedPlans.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No booked packages found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {packagesSearchQuery
              ? 'No patient packages match your search filter.'
              : 'No cosmetic gynecology packages have been booked yet. Click "Book Package" to enroll a patient.'}
          </p>
          <Button
            onClick={onOpenBookingModal}
            className="bg-gradient-to-r from-pink-600 to-rose-500 text-white text-xs font-bold h-8 px-4 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Book First Package
          </Button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBookedPlans.map((plan: any) => {
            const isExpanded = !!expandedPlanIds[plan.id];
            const isBilled = plan.billed === 'true' || (typeof plan.billed === 'string' && plan.billed.length > 0 && plan.billed !== 'false');
            const progressPercent =
              plan.total_sessions > 0
                ? Math.round((plan.completed_sessions / plan.total_sessions) * 100)
                : 0;
            const isFullyDone =
              plan.completed_sessions >= plan.total_sessions && plan.total_sessions > 0;

            return (
              <Card
                key={plan.id}
                className="border-slate-200 shadow-sm overflow-hidden bg-white transition-all hover:border-slate-300"
              >
                {/* Header Summary Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                  {/* Left: Patient & Package Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-100 to-rose-50 text-pink-600 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs border border-pink-200/60">
                      {plan.patient_name ? plan.patient_name.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{plan.patient_name}</h3>
                        {plan.patient_mrn && (
                          <Badge variant="outline" className="text-[10px] font-mono font-bold bg-slate-50 text-slate-700">
                            {plan.patient_mrn}
                          </Badge>
                        )}
                        {plan.patient_gender && (
                          <span className="text-[11px] text-slate-400 capitalize">
                            • {plan.patient_gender}
                          </span>
                        )}
                        {plan.patient_phone && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            • {plan.patient_phone}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-pink-700 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                          {plan.treatment_name}
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500 font-medium">
                          Started: <strong className="text-slate-700">{formatDate(plan.start_date || plan.created_at)}</strong>
                        </span>
                        {plan.frequency && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span className="text-slate-500 font-medium capitalize">
                              Freq: <strong className="text-slate-700">{plan.frequency.replace('_', ' ')}</strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress, Billing and Side-by-Side Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 lg:gap-6 flex-shrink-0">
                    {/* Progress Bar & Amount */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-800">
                          <span>
                            {plan.completed_sessions} of {plan.total_sessions} Done
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-36 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              isFullyDone
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-pink-500 to-rose-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-l border-slate-200 pl-4 text-right">
                        <p className="text-xs font-extrabold text-slate-900">
                          {formatCurrency(plan.total_amount || 0)}
                        </p>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
                            isBilled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          {isBilled ? 'Billed' : 'Pending Bill'}
                        </Badge>
                      </div>
                    </div>

                    {/* Side-by-Side Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
                      {/* Edit Schedule Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenEditSchedule(plan)}
                        className="h-8 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 flex-shrink-0 cursor-pointer"
                        title="Edit schedule of all sessions in this package"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                        Edit Schedule
                      </Button>

                      {/* Print Schedule Card Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintSchedule(plan)}
                        className="h-8 text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100 flex-shrink-0 cursor-pointer"
                        title="Print Patient Procedure Appointment Card"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1 text-slate-600" />
                        Print Card
                      </Button>

                      {/* Bill / Invoice Package Button */}
                      {isBilled ? (
                        <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-300 h-8 px-2.5 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          {plan.billed !== 'true' && plan.billed ? `Inv #${plan.billed}` : 'Paid & Billed'}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenBillingModal(plan)}
                          className="h-8 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 flex-shrink-0 cursor-pointer"
                          title="Generate Official HMS Invoice & Settle Billing"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Bill / Invoice
                        </Button>
                      )}

                      {/* Toggle Expand Sessions */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpandPlan(plan.id)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex-shrink-0 cursor-pointer"
                        title={isExpanded ? 'Hide sessions schedule' : 'View all sessions schedule'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Sessions List */}
                {isExpanded && (
                  <div className="bg-slate-50/70 p-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Sessions Schedule &amp; Execution Timeline
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {plan.sessions?.length || 0} scheduled procedures
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Session #</th>
                            <th className="p-2.5">Equipment / Modality</th>
                            <th className="p-2.5">Scheduled Date &amp; Time</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {plan.sessions?.map((s: any) => {
                            const isDone = s.status === 'completed';
                            const dtParts = s.scheduled_datetime ? s.scheduled_datetime.split('T') : ['—', ''];
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/60">
                                <td className="p-2.5 font-bold font-mono text-slate-700">
                                  #{s.session_number}
                                </td>
                                <td className="p-2.5 font-semibold text-slate-900">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        s.equipment === 'Tesla Chair' ? 'bg-indigo-500' : 'bg-pink-500'
                                      }`}
                                    />
                                    {s.equipment}
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-700">
                                  <span className="font-semibold">{formatDate(dtParts[0])}</span>{' '}
                                  <span className="text-slate-400 font-mono text-[11px]">{dtParts[1]?.slice(0, 5)}</span>
                                </td>
                                <td className="p-2.5 text-slate-600 font-mono">
                                  {s.duration_mins} mins
                                </td>
                                <td className="p-2.5">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] font-bold capitalize ${
                                      isDone
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                        : s.status === 'cancelled'
                                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-300'
                                    }`}
                                  >
                                    {s.status}
                                  </Badge>
                                </td>
                                <td className="p-2.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isDone ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateSessionStatus(s.id, 'scheduled')}
                                        disabled={isUpdatingSession}
                                        className="h-6 text-[10px] border-slate-200 text-slate-500 hover:bg-slate-50 px-2 flex-shrink-0 cursor-pointer"
                                      >
                                        <RotateCcw className="w-3 h-3 mr-0.5" />
                                        Reopen
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onUpdateSessionStatus(s.id, 'completed')}
                                        disabled={isUpdatingSession}
                                        className="h-6 text-[10px] font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-2 flex-shrink-0 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                        Mark Done
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
