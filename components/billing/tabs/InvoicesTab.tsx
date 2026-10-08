'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Check,
  Building,
  Building2,
  ChevronDown,
  User,
  AlertCircle,
  X,
} from 'lucide-react';
import StatusBadge from '../StatusBadge';

const CANONICAL_DEPARTMENTS = [
  'Outpatient (OPD)',
  'Inpatient (IPD)',
  'Clinical Laboratory',
  'Pharmacy',
  'Ultrasound & Radiology',
  'GYN OT',
  'IVF Laboratory',
  'Andrology & Embryology',
  'IUI Procedure',
  'Counselling',
  'Package',
];

const normalizeDepartment = (inv: any): string => {
  const raw = (inv.department || inv.appointment_source || '').trim();
  if (!raw) return 'General / OPD';
  const lower = raw.toLowerCase();
  if (lower.includes('ivf') || lower.includes('embryo') || lower.includes('lab') && lower.includes('ivf')) return 'IVF Laboratory';
  if (lower.includes('andro') || lower.includes('embryo')) return 'Andrology & Embryology';
  if (lower.includes('pharm') || lower.includes('rx') || lower.includes('med')) return 'Pharmacy';
  if (lower.includes('lab') || lower.includes('lims')) return 'Clinical Laboratory';
  if (lower.includes('scan') || lower.includes('radio') || lower.includes('ultra')) return 'Ultrasound & Radiology';
  if (lower.includes('counsel')) return 'Counselling';
  if (lower.includes('ipd') || lower.includes('ward') || lower.includes('inpatient')) return 'Inpatient (IPD)';
  if (lower.includes('gyn-theatre') || lower.includes('gyn ot') || lower.includes('theatre')) return 'GYN OT';
  if (lower.includes('iui')) return 'IUI Procedure';
  if (lower.includes('package')) return 'Package';
  if (lower === 'op' || lower.includes('outpatient')) return 'Outpatient (OPD)';
  return raw;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

interface InvoicesTabProps {
  invoices: any[];
  patients: any[];
  isLoading: boolean;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRecordPayment: (inv: any) => void;
  onViewReceipt: (inv: any) => void;
}

export default function InvoicesTab({
  invoices,
  patients,
  isLoading,
  statusFilter,
  setStatusFilter,
  onRecordPayment,
  onViewReceipt,
}: InvoicesTabProps) {
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [departmentFilters, setDepartmentFilters] = useState<string[]>([]);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);
  const [genderFilter, setGenderFilter] = useState('');

  // Close department dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic Available Departments for Multi-Select Filter
  const availableDepartments = useMemo(() => {
    const set = new Set<string>(CANONICAL_DEPARTMENTS);
    invoices.forEach((inv) => {
      const norm = normalizeDepartment(inv);
      if (norm) set.add(norm);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [invoices]);

  const filteredInvoices = invoices.filter((inv: any) => {
    if (genderFilter) {
      const p = patients.find((pat: any) => pat.id === inv.patient_id);
      const pGender = (p?.gender || '').toLowerCase();
      if (pGender !== genderFilter.toLowerCase()) return false;
    }
    if (departmentFilters.length > 0) {
      const norm = normalizeDepartment(inv);
      const rawDept = inv.department || '';
      const rawSource = inv.appointment_source || '';
      const matches = departmentFilters.includes(norm) ||
        departmentFilters.includes(rawDept) ||
        departmentFilters.includes(rawSource);
      if (!matches) return false;
    }
    if (patientSearchQuery.trim()) {
      const q = patientSearchQuery.toLowerCase().trim();
      const p = patients.find((pat: any) => pat.id === inv.patient_id);
      const patName = (p?.name || inv.patient_name || '').toLowerCase();
      const patVid = (p?.vid || p?.mrn || inv.patient_vid || '').toLowerCase();
      const patPhone = (p?.phone || '').toLowerCase();
      const invNum = (inv.invoice_number || '').toLowerCase();
      const matches = patName.includes(q) || patVid.includes(q) || patPhone.includes(q) || invNum.includes(q);
      if (!matches) return false;
    }
    return true;
  });

  return (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-end gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Search Patient or Invoice #
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search by Patient Name, VID, MRN, Phone, or Invoice #..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
                />
                {patientSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setPatientSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear Search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Department Multi-Select Filter */}
            <div className="relative w-full md:w-56" ref={deptDropdownRef}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Department Filter
              </label>
              <button
                type="button"
                onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                className={`w-full bg-slate-50 border rounded-xl px-3 py-1.5 text-xs flex items-center justify-between gap-1.5 cursor-pointer h-[34px] ${
                  departmentFilters.length > 0
                    ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-2xs'
                    : 'border-slate-200 text-slate-700 font-bold'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${departmentFilters.length > 0 ? 'text-primary' : 'text-slate-400'}`} />
                  <span className="truncate">
                    {departmentFilters.length === 0
                      ? 'All Departments'
                      : departmentFilters.length === 1
                      ? departmentFilters[0]
                      : `${departmentFilters.length} Depts Selected`}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isDeptDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDeptDropdownOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-1 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">
                      Departments {departmentFilters.length > 0 && `(${departmentFilters.length})`}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDepartmentFilters([...availableDepartments])}
                        className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setDepartmentFilters([])}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {availableDepartments.map((dept) => {
                      const isChecked = departmentFilters.includes(dept);
                      const count = invoices.filter((inv) => {
                        const norm = normalizeDepartment(inv);
                        return norm === dept || inv.department === dept || inv.appointment_source === dept;
                      }).length;
                      return (
                        <label
                          key={dept}
                          className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            isChecked ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setDepartmentFilters([...departmentFilters, dept]);
                                } else {
                                  setDepartmentFilters(departmentFilters.filter((d) => d !== dept));
                                }
                              }}
                              className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="truncate max-w-[170px]">{dept}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-100 font-semibold">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-36">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold"
              >
                <option value="">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="w-full md:w-32">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Gender
              </label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold"
              >
                <option value="">All Genders</option>
                <option value="female">Female ♀</option>
                <option value="male">Male ♂</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No invoices found matching criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Invoice #</th>
                      <th className="p-3.5">Patient Details</th>
                      <th className="p-3.5">Dept / Source</th>
                      <th className="p-3.5">Total Amount</th>
                      <th className="p-3.5">Paid Amount</th>
                      <th className="p-3.5">Pending Due</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="p-3.5 font-mono font-bold text-primary">{inv.invoice_number}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.patient_name || 'Patient'}</p>
                          <p className="font-mono text-[10px] text-slate-400">{inv.patient_vid || '—'}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                            {inv.appointment_source}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          ₹{parseFloat(inv.total_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          ₹{parseFloat(inv.paid_amount).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 font-bold text-rose-700">
                          {parseFloat(inv.pending_due) > 0
                            ? `₹${parseFloat(inv.pending_due).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                        <td className="p-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDate(inv.created_at)}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {parseFloat(inv.pending_due) > 0 && (
                              <button
                                onClick={() => onRecordPayment(inv)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors"
                              >
                                Record Pay
                              </button>
                            )}
                            <button
                              onClick={() => onViewReceipt(inv)}
                              className="px-2.5 py-1 bg-primary/10 hover:bg-primary/15 text-primary rounded-lg font-bold text-[10px] transition-colors"
                              title="View &amp; Print Invoice Receipt"
                            >
                              Receipt
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

  );
}
