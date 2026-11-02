'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  PhoneOutgoing, 
  PhoneMissed,
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award,
  Calendar,
  Filter,
  User,
  X,
  Play,
  FileText,
  ChevronRight,
  PhoneCall,
  Volume2,
  RefreshCw,
  PhoneForwarded,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { TelecallerKPIItem, CallLog } from '../types';
import { crmApi } from '@/lib/api';

interface TelecallerAnalyticsTabProps {
  kpis: TelecallerKPIItem[];
  isLoading: boolean;
  onFilterChange?: (params: { preset?: string; date_from?: string; date_to?: string }) => void;
  onRefresh?: () => void;
}

type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'all_time' | 'custom';

export const TelecallerAnalyticsTab: React.FC<TelecallerAnalyticsTabProps> = ({
  kpis,
  isLoading,
  onFilterChange,
  onRefresh,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<DatePreset>('all_time');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  
  // Drilldown Inspector Drawer State
  const [selectedAgent, setSelectedAgent] = useState<TelecallerKPIItem | null>(null);
  const [agentCalls, setAgentCalls] = useState<CallLog[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(false);

  // Fetch calls when drawer opens for an agent
  useEffect(() => {
    if (!selectedAgent) {
      setAgentCalls([]);
      return;
    }

    let isMounted = true;
    setIsLoadingCalls(true);
    crmApi.listCalls({ telecaller_id: selectedAgent.user_id, limit: 50 })
      .then((data) => {
        if (isMounted) setAgentCalls(data);
      })
      .catch((err) => {
        console.error('Failed to load agent calls', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCalls(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedAgent]);

  const handlePresetClick = (preset: DatePreset) => {
    setSelectedPreset(preset);
    if (preset !== 'custom' && onFilterChange) {
      onFilterChange({ preset: preset === 'all_time' ? undefined : preset });
    }
  };

  const handleCustomApply = () => {
    if (onFilterChange && customFrom && customTo) {
      onFilterChange({
        date_from: `${customFrom}T00:00:00Z`,
        date_to: `${customTo}T23:59:59Z`,
      });
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const remSec = sec % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    if (mins > 0) return `${mins}m ${remSec}s`;
    return `${remSec}s`;
  };

  // Aggregated totals across all telecallers
  const totalCallsPlaced = kpis.reduce((acc, k) => acc + (k.total_calls || 0), 0);
  const totalDurationSecs = kpis.reduce((acc, k) => acc + (k.total_duration_seconds || 0), 0);
  const totalConversions = kpis.reduce((acc, k) => acc + (k.conversions || 0), 0);
  const totalCallbacks = kpis.reduce((acc, k) => acc + (k.callback_count || 0), 0);
  const totalRejected = kpis.reduce((acc, k) => acc + (k.not_interested_count || 0) + (k.dnd_invalid_count || 0) + (k.wrong_number_count || 0), 0);
  const totalSkipped = kpis.reduce((acc, k) => acc + (k.skipped_count || 0), 0);
  const overallConversionPct = totalCallsPlaced > 0 ? ((totalConversions / totalCallsPlaced) * 100).toFixed(1) : '0.0';

  const datePresets: { id: DatePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'all_time', label: 'All Time' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Date Selection Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center mr-1">
            <Calendar className="w-3.5 h-3.5 mr-1 text-primary" /> Period:
          </span>
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {datePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={`text-xs px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                  selectedPreset === preset.id
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {selectedPreset === 'custom' && (
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs h-8 w-34 bg-slate-50"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs h-8 w-34 bg-slate-50"
              />
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customFrom || !customTo}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Apply
              </Button>
            </div>
          )}
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="text-xs text-slate-700 hover:bg-slate-50 font-semibold shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Scorecard
          </Button>
        )}
      </div>

      {/* Aggregate Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="p-3.5 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Dials</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{totalCallsPlaced}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Attempted calls</span>
        </Card>

        <Card className="p-3.5 border-slate-200 bg-white shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Talk Time</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">{formatSeconds(totalDurationSecs)}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Connected duration</span>
        </Card>

        <Card className="p-3.5 border-emerald-100 bg-emerald-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Converted</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{totalConversions}</div>
          <span className="text-[10px] text-emerald-600 mt-1 font-semibold block">{overallConversionPct}% conversion</span>
        </Card>

        <Card className="p-3.5 border-amber-100 bg-amber-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Callbacks</span>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{totalCallbacks}</div>
          <span className="text-[10px] text-amber-600 mt-1 block">Follow-up requested</span>
        </Card>

        <Card className="p-3.5 border-rose-100 bg-rose-50/40 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Rejected / DND</span>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{totalRejected}</div>
          <span className="text-[10px] text-rose-600 mt-1 block">Not interested or invalid</span>
        </Card>

        <Card className="p-3.5 border-slate-200 bg-slate-50/60 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Skipped / Unanswered</span>
          <div className="text-xl font-bold font-mono text-slate-700 mt-1">{totalSkipped}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">&lt;5s or no response</span>
        </Card>
      </div>

      {/* Top Performers Podium */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.slice(0, 3).map((item, idx) => {
            const medalColors = [
              'bg-amber-500/10 text-amber-700 border-amber-300',
              'bg-slate-200/50 text-slate-700 border-slate-300',
              'bg-amber-700/10 text-amber-800 border-amber-600/30',
            ];
            const rankBadges = ['#1', '#2', '#3'];
            const rankLabels = ['Top Performer (1st)', 'Runner Up (2nd)', '3rd Position'];

            return (
              <Card
                key={item.user_id}
                onClick={() => setSelectedAgent(item)}
                className="p-5 border-slate-200 bg-white relative overflow-hidden shadow-2xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className="absolute -right-2 -top-2 w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center font-black text-xl text-slate-300 select-none group-hover:text-primary/40 transition-colors">
                  {rankBadges[idx]}
                </div>

                <div className="flex items-start justify-between pr-8">
                  <div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${medalColors[idx]}`}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {rankLabels[idx]}
                    </Badge>
                    <h3 className="text-base font-bold text-slate-900 mt-2 flex items-center gap-1.5">
                      {item.user_name}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Conversions</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono">{item.conversions}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Dials</span>
                    <strong className="text-slate-800 font-mono">{item.total_calls}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Talk Time</span>
                    <strong className="text-slate-800 font-mono">{formatSeconds(item.total_duration_seconds)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Callbacks</span>
                    <strong className="text-amber-700 font-mono">{item.callback_count || 0}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Skipped</span>
                    <strong className="text-slate-500 font-mono">{item.skipped_count || 0}</strong>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Performance Scorecard Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Telecaller Performance Scorecard</h3>
            <p className="text-xs text-slate-400">
              Click any telecaller to open their detailed call timeline, recordings, and transcripts.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <strong>{kpis.length}</strong> active telecallers
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Telecaller Name</th>
                <th className="py-3 px-3 text-center">Dials</th>
                <th className="py-3 px-3 text-center">Connected</th>
                <th className="py-3 px-3 text-center">Talk Time</th>
                <th className="py-3 px-3 text-center">Avg AHT</th>
                <th className="py-3 px-3 text-center text-emerald-700">Converted</th>
                <th className="py-3 px-3 text-center text-amber-700">Callbacks</th>
                <th className="py-3 px-3 text-center text-rose-700">Rejected / DND</th>
                <th className="py-3 px-3 text-center text-slate-500">Skipped</th>
                <th className="py-3 px-3 text-center">Conversion %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    <div className="inline-block animate-spin mr-2">⏳</div>
                    Calculating performance KPIs for {selectedPreset}...
                  </td>
                </tr>
              ) : kpis.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    No telecaller activity found for this period.
                  </td>
                </tr>
              ) : (
                kpis.map((kpi, idx) => (
                  <tr
                    key={kpi.user_id}
                    onClick={() => setSelectedAgent(kpi)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {kpi.user_name}
                          </div>
                          {kpi.email && <div className="text-[10px] text-slate-400 font-normal">{kpi.email}</div>}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {kpi.total_calls}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-700">
                      {kpi.answered_calls}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-800 font-semibold">
                      {formatSeconds(kpi.total_duration_seconds)}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {formatSeconds(kpi.avg_duration_seconds)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {kpi.conversions}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                        {kpi.callback_count || 0}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-rose-50 text-rose-700 border border-rose-200">
                        {(kpi.not_interested_count || 0) + (kpi.dnd_invalid_count || 0) + (kpi.wrong_number_count || 0)}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {kpi.skipped_count || 0}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full font-bold font-mono text-[11px] border ${
                          kpi.conversion_rate_percentage >= 20
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : kpi.conversion_rate_percentage >= 10
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {kpi.conversion_rate_percentage}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(kpi);
                        }}
                        className="text-xs text-primary hover:bg-primary/10 font-semibold h-7 px-2.5"
                      >
                        Drilldown
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspector Drawer for Selected Telecaller */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {selectedAgent.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedAgent.user_name}</h3>
                  <div className="text-xs text-slate-500 font-normal">
                    {selectedAgent.email || 'Telecaller Performance Details'}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAgent(null)}
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Agent Mini KPI Bar */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-slate-100/70 border-b border-slate-200 text-center text-xs">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Total Calls</span>
                <strong className="text-sm font-mono text-slate-900">{selectedAgent.total_calls}</strong>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Talk Time</span>
                <strong className="text-sm font-mono text-slate-900">{formatSeconds(selectedAgent.total_duration_seconds)}</strong>
              </div>
              <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 block font-semibold">Converted</span>
                <strong className="text-sm font-mono text-emerald-700">{selectedAgent.conversions}</strong>
              </div>
              <div className="bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                <span className="text-[10px] text-amber-700 block font-semibold">Callbacks</span>
                <strong className="text-sm font-mono text-amber-700">{selectedAgent.callback_count || 0}</strong>
              </div>
            </div>

            {/* Call History List with Recordings & Transcripts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-primary" />
                  Call Log Timeline ({agentCalls.length})
                </h4>
                {isLoadingCalls && (
                  <span className="text-xs text-slate-400 flex items-center">
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" /> Loading logs...
                  </span>
                )}
              </div>

              {agentCalls.length === 0 && !isLoadingCalls ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No individual call records found for this telecaller.
                </div>
              ) : (
                agentCalls.map((call) => {
                  const callDate = new Date(call.created_at);
                  const isAnswered = (call.duration_seconds || 0) > 0;

                  return (
                    <div
                      key={call.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-2 text-xs"
                    >
                      {/* Top Row: Contact & Outcome */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">
                            {call.lead_name || 'Patient Lead'}
                          </div>
                          <div className="font-mono text-slate-500 text-[11px]">
                            {call.phone_dialed}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {call.disposition ? (
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-semibold ${
                                call.disposition === 'converted_appointment'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : call.disposition === 'callback_requested'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : call.disposition === 'not_interested' || call.disposition === 'dnd'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {call.disposition.replace('_', ' ')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200">
                              {isAnswered ? 'Completed' : 'Skipped / No Answer'}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Meta: Duration & Timestamp */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1 text-slate-700 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatSeconds(call.duration_seconds)}
                        </span>
                        <span>•</span>
                        <span>
                          {callDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at{' '}
                          {callDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Notes / Whisper Transcript */}
                      {call.notes && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-700 text-[11px]">
                          <span className="font-semibold text-slate-500 block text-[10px] uppercase">Agent Notes:</span>
                          {call.notes}
                        </div>
                      )}

                      {call.transcript_text && (
                        <div className="bg-primary/5 p-2 rounded-lg border border-primary/20 text-slate-800 text-[11px]">
                          <span className="font-semibold text-primary block text-[10px] uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Whisper STT Transcript:
                          </span>
                          &ldquo;{call.transcript_text}&rdquo;
                        </div>
                      )}

                      {/* Audio Player if recording file path exists */}
                      {call.recording_file_path && (
                        <div className="pt-1">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                            <Volume2 className="w-3 h-3 text-primary" /> Call Audio Recording:
                          </div>
                          <audio
                            controls
                            src={crmApi.getRecordingAudioUrl(call.id)}
                            className="w-full h-8 rounded"
                            preload="none"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAgent(null)}
                className="text-xs font-semibold"
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
