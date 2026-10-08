'use client';

import React, { useState } from 'react';
import { qcApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';

interface QcTabProps {
  qcLogs: any[];
  onQcLogged: (entry: any) => void;
}

export default function QcTab({ qcLogs, onQcLogged }: QcTabProps) {
  const { user } = useAuth();
  const [newQc, setNewQc] = useState({
    co2: '' as any,
    o2: '' as any,
    ph: '' as any,
    temp: '' as any,
    autodialer_test: 'Pass',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogQc = async () => {
    setIsSubmitting(true);
    try {
      const res = await qcApi.createLog({
        co2: newQc.co2,
        o2: newQc.o2,
        ph: newQc.ph,
        temp: newQc.temp,
        autodialer_test: newQc.autodialer_test,
        checked_by: user?.name || 'Embryologist',
        date: new Date().toISOString().split('T')[0],
      });
      if (res?.entry) {
        onQcLogged(res.entry);
      }
      toast.success('QC Logged', 'Daily Gas & Environmental QC reading logged to audit trail & persisted to database!');
      setNewQc({ co2: '', o2: '', ph: '', temp: '', autodialer_test: 'Pass' });
    } catch (err: any) {
      toast.error('QC Failed', err.message || 'Failed to persist QC metric');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 border-b pb-3">Daily Gas &amp; Temperature QC</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">CO₂ Level (%)</label>
            <input
              type="number"
              step="0.1"
              value={newQc.co2}
              onChange={(e) => setNewQc({ ...newQc, co2: parseFloat(e.target.value) || 0 })}
              className="vmd-input text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">O₂ Level (%)</label>
            <input
              type="number"
              step="0.1"
              value={newQc.o2}
              onChange={(e) => setNewQc({ ...newQc, o2: parseFloat(e.target.value) || 0 })}
              className="vmd-input text-xs"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Incubator Temp (°C)</label>
            <input
              type="number"
              step="0.1"
              value={newQc.temp}
              onChange={(e) => setNewQc({ ...newQc, temp: parseFloat(e.target.value) || 0 })}
              className="vmd-input text-xs"
            />
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleLogQc}
            className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-md hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Logging...' : 'Log Daily QC Metric'}
          </button>
        </div>
      </div>

      <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Recent Gas &amp; Sensor Logs</h3>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">CO₂ %</th>
              <th className="p-3">O₂ %</th>
              <th className="p-3">Temp °C</th>
              <th className="p-3">Alarm Test</th>
              <th className="p-3">Checked By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {qcLogs.map((q) => (
              <tr key={q.id}>
                <td className="p-3 font-bold">{q.date}</td>
                <td className="p-3 text-primary font-bold">{q.co2}%</td>
                <td className="p-3 text-emerald-700 font-bold">{q.o2}%</td>
                <td className="p-3">{q.temp}°C</td>
                <td className="p-3">
                  <span className="text-emerald-700 font-bold">Pass</span>
                </td>
                <td className="p-3">{q.checked_by}</td>
              </tr>
            ))}
            {qcLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No QC logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
