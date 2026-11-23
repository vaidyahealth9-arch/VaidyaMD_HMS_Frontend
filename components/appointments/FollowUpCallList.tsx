'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Search,
  CheckCircle2,
  CalendarPlus,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { request } from '@/lib/api';
import { formatDateTime, safeString } from '@/lib/utils';

interface FollowUpCallListProps {
  onBookAppointment: (patient: any, doctorName?: string) => void;
  doctors: any[];
}

interface FollowUpItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string;
  patient_mrn: string;
  doctor_name: string;
  consultation_date: string;
  follow_up_advice: string;
  status: 'due' | 'upcoming' | 'confirmed';
}

export default function FollowUpCallList({ onBookAppointment, doctors }: FollowUpCallListProps) {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'upcoming'>('all');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    // Fetch recent outpatient clinical records with follow-up instructions
    request<any[]>('/core/clinical-records/?plugin_id=opd')
      .then((records) => {
        if (!isMounted || !Array.isArray(records)) return;
        const items: FollowUpItem[] = [];

        records.forEach((rec) => {
          const d = rec.data || {};
          const rawFollowUp = d.follow_up || d.nextFollowUp || d.treatment_notes || '';
          if (!rawFollowUp || rawFollowUp === 'No Follow-up required' || rawFollowUp === 'none') return;

          // Determine doctor
          const docName = d.doctor?.name || d.doctor_name || rec.created_by_name || 'Treating Clinician';
          const patientName = rec.patient?.name || d.patient_name || 'Patient';
          const patientPhone = rec.patient?.phone || d.patient_phone || '';
          const patientMrn = rec.patient?.mrn || rec.patient?.vid || '';

          items.push({
            id: rec.id,
            patient_id: rec.patient_id,
            patient_name: patientName,
            patient_phone: patientPhone,
            patient_mrn: patientMrn,
            doctor_name: docName.startsWith('Dr') ? docName : `Dr. ${docName}`,
            consultation_date: rec.created_at || new Date().toISOString(),
            follow_up_advice: typeof rawFollowUp === 'string' ? rawFollowUp : JSON.stringify(rawFollowUp),
            status: 'due',
          });
        });

        setFollowUps(items);
      })
      .catch(() => {
        if (isMounted) setFollowUps([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredItems = useMemo(() => {
    return followUps.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.patient_name.toLowerCase().includes(q) ||
        item.patient_phone.includes(q) ||
        item.patient_mrn.toLowerCase().includes(q) ||
        item.doctor_name.toLowerCase().includes(q) ||
        item.follow_up_advice.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [followUps, searchQuery, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Controls Strip */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Reception Follow-Up Call &amp; Appointment Confirmation List
            </h3>
            <p className="text-[11px] text-slate-500">
              Patients advised for clinical review by treating clinicians. Call to confirm return visit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient, doctor, MRN..."
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Follow-up Call Table */}
      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading follow-up reminders...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-bold text-slate-700">No Pending Follow-up Calls</p>
          <p className="text-xs text-slate-400 mt-0.5">
            All patients are up to date or no upcoming reviews recorded.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Patient Details</th>
                  <th className="py-2.5 px-3">Treating Clinician</th>
                  <th className="py-2.5 px-3">Consulted On</th>
                  <th className="py-2.5 px-3">Doctor Follow-Up Advice</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{item.patient_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.patient_mrn} {item.patient_phone ? `• ${item.patient_phone}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{item.doctor_name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {formatDateTime(item.consultation_date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs py-0.5">
                        <Clock className="w-3 h-3 text-amber-600 mr-1" />
                        <span>{item.follow_up_advice}</span>
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.patient_phone && (
                          <a
                            href={`tel:${item.patient_phone}`}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors cursor-pointer"
                            title={`Call ${item.patient_phone}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            onBookAppointment(
                              { id: item.patient_id, name: item.patient_name, phone: item.patient_phone },
                              item.doctor_name
                            )
                          }
                          className="bg-primary hover:bg-primary/90 text-white font-bold text-[11px] h-7 px-2.5 rounded shadow-2xs gap-1 cursor-pointer"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Book Review</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
