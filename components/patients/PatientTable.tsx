import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PatientTableProps {
  patients: any[];
  isLoading: boolean;
  total: number;
  page: number;
  onPageChange: (newPage: number) => void;
  onSendToOPD: (patient: any) => void;
}

export default function PatientTable({
  patients,
  isLoading,
  total,
  page,
  onPageChange,
  onSendToOPD,
}: PatientTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : patients.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold">No patients found</p>
          <p className="text-xs mt-1">Try adjusting search filters or register a new patient.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Patient Details</th>
                <th className="px-5 py-3.5">Contact / Location</th>
                <th className="px-5 py-3.5">Linked Partner</th>
                <th className="px-5 py-3.5">Referral & ROI</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Reg. Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {patients.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {p.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/patients/${p.id}`}
                          className="font-bold text-slate-900 hover:text-[rgb(var(--clr-primary))] text-sm leading-tight block"
                        >
                          {p.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {p.vid}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              p.gender === 'female'
                                ? 'bg-pink-50 text-pink-700 border border-pink-100'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            }`}
                          >
                            {p.gender} · {p.age}y
                          </span>
                          {p.blood_group && (
                            <span className="text-[10px] font-bold text-slate-500">{p.blood_group}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800">{p.phone}</p>
                    <p className="text-slate-400 text-[11px] truncate max-w-[150px]">{p.area || p.address || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.partner_name ? (
                      <div>
                        <Link
                          href={`/patients/${p.partner_id}`}
                          className="font-bold text-slate-800 hover:text-[rgb(var(--clr-primary))] block truncate max-w-[140px]"
                        >
                          {p.partner_name}
                        </Link>
                        <span className="font-mono text-[10px] text-slate-400">{p.partner_vid || 'Linked Partner'}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No partner linked</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800 capitalize">{p.referred_by_name || p.referred_by_type || 'Walk-in'}</p>
                    <p className="text-slate-400 text-[10px]">{p.area || 'Direct'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.registration_type === 'donor_bank' || p.registration_type === 'donor_hospital'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))]'
                      }`}
                    >
                      {p.registration_type?.replace('_', ' ') || 'Patient'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSendToOPD(p)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-[10px] transition-colors cursor-pointer"
                    >
                      + OPD
                    </button>
                    <Link
                      href={`/patients/${p.id}`}
                      className="px-3 py-1.5 bg-[rgb(var(--clr-primary)/0.08)] hover:bg-[rgb(var(--clr-primary)/0.12)] text-[rgb(var(--clr-primary))] rounded-md font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Open 360 →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} patients
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
