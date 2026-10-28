'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PhoneCall, 
  Clock, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Battery, 
  Radio,
  RefreshCw,
  EyeOff
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { crmApi } from '@/lib/api';
import { TelecallerRosterItem } from '../types';

interface TelecallerRosterTabProps {
  roster: TelecallerRosterItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const TelecallerRosterTab: React.FC<TelecallerRosterTabProps> = ({
  roster,
  isLoading,
  onRefresh,
}) => {
  const [hideRevoked, setHideRevoked] = useState(false);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0);

  // Auto-refresh telemetry every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
      setSecondsSinceRefresh(0);
    }, 30000);

    const secTimer = setInterval(() => {
      setSecondsSinceRefresh((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(secTimer);
    };
  }, [onRefresh]);

  const displayedRoster = hideRevoked ? roster.filter((r) => !r.is_revoked) : roster;

  const onlineCount = roster.filter((r) => r.is_online && !r.is_revoked).length;
  const onCallCount = roster.filter((r) => r.is_online && !r.is_revoked && r.current_state === 'on_call').length;
  const idleCount = roster.filter((r) => r.is_online && !r.is_revoked && r.current_state === 'idle').length;

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const getStateBadge = (state: string, isOnline: boolean, isRevoked?: boolean) => {
    if (isRevoked) {
      return (
        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5" />
          Revoked
        </Badge>
      );
    }
    if (!isOnline || state === 'offline') {
      return (
        <Badge variant="outline" className="bg-slate-100 text-slate-500 border-slate-200 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" />
          Offline
        </Badge>
      );
    }
    switch (state) {
      case 'on_call':
        return (
          <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
            On SIM Call
          </Badge>
        );
      case 'ringing':
        return (
          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
            Ringing
          </Badge>
        );
      case 'wrap_up':
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
            Wrap Up
          </Badge>
        );
      case 'idle':
      default:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            Ready / Idle
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Floor Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Paired</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">{roster.length}</div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Online Now</span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{onlineCount}</div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actively On Call</span>
            <PhoneCall className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">{onCallCount}</div>
        </Card>

        <Card className="p-4 border-slate-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ready / Idle</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">{idleCount}</div>
        </Card>
      </div>

      {/* Live Floor Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Live Telecaller Floor Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live telemetry syncs every 30 seconds from companion Android devices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideRevoked(!hideRevoked)}
              className="text-xs px-2.5 py-1 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 font-medium cursor-pointer"
            >
              {hideRevoked ? 'Show Revoked' : 'Hide Revoked'}
            </button>

            <Badge variant="outline" className="text-xs bg-white text-slate-600 border-slate-200">
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Updated {secondsSinceRefresh}s ago
            </Badge>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Telecaller</th>
              <th className="py-3 px-4">Device & Battery</th>
              <th className="py-3 px-4">Live State</th>
              <th className="py-3 px-4">Active Patient Call</th>
              <th className="py-3 px-4 text-center">Calls Today</th>
              <th className="py-3 px-4 text-center">Talk Time Today</th>
              <th className="py-3 px-4 text-center">Conversions</th>
              <th className="py-3 px-4 text-right">Admin Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading && roster.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Polling device presence...
                </td>
              </tr>
            ) : displayedRoster.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No telecaller Android devices active. Share the companion APK to pair phones.
                </td>
              </tr>
            ) : (
              displayedRoster.map((item) => {
                const batt = item.battery_level ?? 100;
                const battColor =
                  batt > 50 ? 'bg-emerald-500' : batt > 20 ? 'bg-amber-500' : 'bg-rose-500';

                return (
                  <tr key={item.user_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.user_name}</div>
                      <div className="text-[11px] text-slate-400">{item.email}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.device_model || 'Android Phone'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{item.sim_operator || 'SIM Active'}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${battColor}`} style={{ width: `${batt}%` }} />
                          </div>
                          <span className="text-[10px] font-mono">{batt}%</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getStateBadge(item.current_state, item.is_online, item.is_revoked)}
                    </td>

                    <td className="py-3 px-4">
                      {item.current_lead_name ? (
                        <div>
                          <span className="font-medium text-slate-800">{item.current_lead_name}</span>
                          {item.call_duration_seconds > 0 && (
                            <span className="ml-2 font-mono text-[11px] text-rose-600 font-bold">
                              ({formatSeconds(item.call_duration_seconds)})
                            </span>
                          )}
                          <div className="text-[11px] font-mono text-slate-400">{item.current_lead_phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-800 text-center">
                      {item.calls_today}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 text-center">
                      {formatSeconds(item.total_talk_time_seconds)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-center">
                      {item.conversions_today}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {item.is_revoked ? (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                          Revoked
                        </Badge>
                      ) : (
                        <button
                          onClick={async () => {
                            if (confirm(`Revoke device access for ${item.user_name}? This immediately terminates the phone session.`)) {
                              await crmApi.revokeDevice(item.user_id);
                              onRefresh();
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Revoke Device
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
