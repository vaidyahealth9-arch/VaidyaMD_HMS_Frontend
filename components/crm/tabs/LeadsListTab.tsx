'use client';

import React, { useState } from 'react';
import { Search, Phone, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { Lead, LeadStatus, LeadSource } from '../types';

interface LeadsListTabProps {
  leads: Lead[];
  total: number;
  isLoading: boolean;
  onCallLead: (lead: Lead) => void;
  onFilterChange: (filters: { status?: LeadStatus; source?: LeadSource; search?: string }) => void;
}

export const LeadsListTab: React.FC<LeadsListTabProps> = ({
  leads,
  total,
  isLoading,
  onCallLead,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
  };

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'contacted':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'interested':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'follow_up':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'converted':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'lost':
      case 'do_not_call':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, phone or city..."
            className="pl-9 text-xs h-9"
          />
        </form>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{leads.length}</strong> of <strong>{total}</strong> leads
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Lead Name</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Source</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Follow-up</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  No leads found matching your criteria.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {lead.name}
                    {lead.is_converted && (
                      <Badge variant="outline" className="ml-2 text-[10px] bg-teal-50 text-teal-700 border-teal-200">
                        Converted
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">{lead.phone}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {lead.city ? (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.city}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 capitalize">
                    {lead.source.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                        lead.status
                      )}`}
                    >
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {lead.next_follow_up_date ? (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(lead.next_follow_up_date).toLocaleDateString()}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCallLead(lead)}
                      className="text-xs h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Dial
                    </Button>
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
