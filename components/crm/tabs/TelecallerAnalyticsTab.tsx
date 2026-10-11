'use client';

import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  PhoneOutgoing, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { TelecallerKPIItem } from '../types';

interface TelecallerAnalyticsTabProps {
  kpis: TelecallerKPIItem[];
  isLoading: boolean;
}

export const TelecallerAnalyticsTab: React.FC<TelecallerAnalyticsTabProps> = ({
  kpis,
  isLoading,
}) => {
  const formatSeconds = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${sec % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Top Telecaller Leaderboard Podium */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.slice(0, 3).map((item, idx) => {
            const medalColors = [
              'bg-amber-500/10 text-amber-600 border-amber-300',
              'bg-slate-300/20 text-slate-700 border-slate-300',
              'bg-amber-700/10 text-amber-800 border-amber-600/30',
            ];
            const rankLabels = ['Top Performer (1st)', 'Runner Up (2nd)', '3rd Position'];

            return (
              <Card key={item.user_id} className="p-5 border-slate-200 bg-white relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${medalColors[idx]}`}>
                      <Trophy className="w-3 h-3 mr-1" />
                      {rankLabels[idx]}
                    </Badge>
                    <h3 className="text-base font-bold text-slate-900 mt-2">{item.user_name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Conversions</span>
                    <span className="text-2xl font-bold text-emerald-600 font-mono">{item.conversions}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Calls Placed</span>
                    <strong className="text-slate-800">{item.total_calls}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Conversion %</span>
                    <strong className="text-emerald-700">{item.conversion_rate_percentage}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Talk Time</span>
                    <strong className="text-slate-800">{formatSeconds(item.total_duration_seconds)}</strong>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Performance Scorecard Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Telecaller Performance Scorecard</h3>
            <p className="text-xs text-slate-400">
              Aggregated calling volume, conversion rates, and average handle time (AHT) per telecaller.
            </p>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Telecaller Name</th>
              <th className="py-3 px-4 text-center">Total Dials</th>
              <th className="py-3 px-4 text-center">Connected Calls</th>
              <th className="py-3 px-4 text-center">Total Talk Time</th>
              <th className="py-3 px-4 text-center">Avg Handle Time (AHT)</th>
              <th className="py-3 px-4 text-center">Conversions</th>
              <th className="py-3 px-4 text-center">Conversion %</th>
              <th className="py-3 px-4 text-right">Overdue Callbacks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-slate-400">
                  Calculating performance KPIs...
                </td>
              </tr>
            ) : kpis.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  No telecaller call history found to compute performance metrics.
                </td>
              </tr>
            ) : (
              kpis.map((kpi) => (
                <tr key={kpi.user_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {kpi.user_name}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {kpi.total_calls}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {kpi.answered_calls}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-800 font-medium">
                    {formatSeconds(kpi.total_duration_seconds)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono text-slate-600">
                    {formatSeconds(kpi.avg_duration_seconds)}
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">
                    {kpi.conversions}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {kpi.conversion_rate_percentage}%
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    {kpi.overdue_follow_ups > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-rose-600 font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        {kpi.overdue_follow_ups} overdue
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
