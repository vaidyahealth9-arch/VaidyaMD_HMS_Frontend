'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { patientsApi, appointmentsApi } from '@/lib/api';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function PatientsPage() {
  const { currentBranch, user } = useAuth();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [referredByType, setReferredByType] = useState('');
  const [area, setArea] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchPatients = () => {
    setIsLoading(true);
    patientsApi.list({
      page,
      per_page: 50,
      search: search || undefined,
      referred_by_type: referredByType || undefined,
      area: area || undefined,
      branch_id: currentBranch?.id || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
      .then((data: any) => {
        let pts = data.patients || [];
        if (filterParam === 'donor_bank') {
          pts = pts.filter((p: any) => p.registration_type === 'donor_bank' || p.name?.toLowerCase().includes('bank') || p.name?.toLowerCase().includes('donor'));
        } else if (filterParam === 'donor_hospital') {
          pts = pts.filter((p: any) => p.registration_type === 'donor_hospital');
        }
        setPatients(pts);
        setTotal(pts.length);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, referredByType, area, startDate, endDate, page, currentBranch?.id, filterParam]);

  const handleSendToOPD = async (p: any) => {
    if (!user) return;
    try {
      // Check if patient is already in queue today to prevent duplicates
      const todayStr = new Date().toISOString().split('T')[0];
      const existing: any = await appointmentsApi.list({ date_filter: todayStr }).catch(() => ({ appointments: [] }));
      const isAlreadyInQueue = (existing?.appointments || []).some(
        (a: any) => a.patient_id === p.id && (a.status === 'waiting' || a.status === 'in_progress')
      );

      if (isAlreadyInQueue) {
        alert(`Notice: Patient ${p.name} is ALREADY in today's OPD Queue (Waiting/In Consultation). Duplicate entry was prevented.`);
        return;
      }

      await appointmentsApi.create({
        patient_id: p.id,
        doctor_id: p.treating_doctor_id || user.id,
        department: 'OPD',
        scheduled_at: new Date().toISOString(),
        visit_type: 'consultation',
        status: 'waiting',
      });
      alert(`Patient ${p.name} successfully added to OPD Queue for today!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add to OPD Queue');
    }
  };

  const handleExportCSV = () => {
    if (!patients || patients.length === 0) return;
    const headers = ['VID', 'Name', 'Gender', 'Age', 'Phone', 'Blood Group', 'Partner Name', 'Referred By', 'Area', 'Reg Date'];
    const rows = patients.map((p: any) => [
      p.vid,
      p.name,
      p.gender,
      p.age || '',
      p.phone ? `'${p.phone}` : '', // Single quote prefix forces Excel to treat +91-XXX as text, preventing arithmetic evaluation
      p.blood_group || '',
      p.partner_name || '',
      p.referred_by_name || p.referred_by_type || '',
      p.area || '',
      formatDate(p.created_at),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(x => `"${x}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Fertility Patient Directory</h1>
          <p className="text-slate-500 text-sm mt-1">{total} patients registered in clinic</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            📥 Export CSV
          </button>
          <Link
            href="/patients/register"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/30"
          >
            ➕ Register Patient / Couple
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search by name, VID, or phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <select
            value={referredByType}
            onChange={(e) => { setReferredByType(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Referrals</option>
            <option value="doctor">Referring Doctor</option>
            <option value="marketing_person">Marketing Camp</option>
            <option value="walk_in">Walk-in</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            placeholder="Filter by Area / City..."
            value={area}
            onChange={(e) => { setArea(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            title="Start Date"
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-3xl mb-2">🏥</p>
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
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/patients/${p.id}`} className="font-bold text-slate-900 hover:text-indigo-600 text-sm leading-tight block">
                            {p.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              {p.vid}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              p.gender === 'female' ? 'bg-pink-50 text-pink-700 border border-pink-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
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
                          <Link href={`/patients/${p.partner_id}`} className="font-bold text-slate-800 hover:text-indigo-600 block truncate max-w-[140px]">
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.registration_type === 'donor_bank' || p.registration_type === 'donor_hospital'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {p.registration_type?.replace('_', ' ') || 'Patient'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSendToOPD(p)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-bold text-[10px] transition-colors"
                      >
                        + OPD
                      </button>
                      <Link
                        href={`/patients/${p.id}`}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs transition-colors"
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
            <span>Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} patients</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Previous
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
