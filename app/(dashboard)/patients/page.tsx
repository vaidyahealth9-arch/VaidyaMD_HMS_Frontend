'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { patientsApi } from '@/lib/api';
import Link from 'next/link';
import { Download, Plus, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import AddToOPDModal from '@/components/opd/AddToOPDModal';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/shared/ui/badge';
import PatientFilterBar from '@/components/patients/PatientFilterBar';
import PatientTable from '@/components/patients/PatientTable';

export default function PatientsPage() {
  const { currentBranch } = useAuth();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [referredByType, setReferredByType] = useState('');
  const [area, setArea] = useState('');
  const [gender, setGender] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [opdModalPatient, setOpdModalPatient] = useState<any>(null);

  const fetchPatients = () => {
    setIsLoading(true);
    const params: any = { page, limit: 20 };
    if (search) params.search = search;
    if (referredByType) params.referred_by_type = referredByType;
    if (area) params.area = area;
    if (gender) params.gender = gender;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (filterParam === 'donor') params.registration_type = 'donor';
    if (filterParam === 'art_bank') params.registration_type = 'donor_bank';
    if (filterParam === 'today') {
      const todayStr = new Date().toISOString().split('T')[0];
      params.start_date = todayStr;
      params.end_date = todayStr;
    }

    patientsApi
      .list(params)
      .then((res: any) => {
        setPatients(res.patients || res.items || []);
        setTotal(res.total || 0);
      })
      .catch((err) => console.error('Failed to load patients:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, referredByType, area, gender, startDate, endDate, page, filterParam, currentBranch]);

  const handleSendToOPD = (patient: any) => {
    setOpdModalPatient(patient);
  };

  const handleExportCSV = () => {
    if (!patients || patients.length === 0) return;
    const headers = ['VID', 'Name', 'Gender', 'Age', 'Phone', 'Blood Group', 'Partner Name', 'Referred By', 'Area', 'Reg Date'];
    const rows = patients.map((p: any) => [
      p.vid,
      p.name,
      p.gender,
      p.age || '',
      p.phone ? `'${p.phone}` : '',
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
    <PageLayout className="space-y-6">
      <PageHeader
        icon={Users}
        title="Fertility Patient Directory"
        titleBadge={
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs">
            {total} Registered
          </Badge>
        }
        subtitle="Universal directory of fertility couples, individual patients, and gamete donors"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <Link
              href="/patients/register"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white text-xs font-semibold rounded-md transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Patient / Couple</span>
            </Link>
          </div>
        }
      />

      <PatientFilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        gender={gender}
        onGenderChange={(v) => { setGender(v); setPage(1); }}
        referredByType={referredByType}
        onReferredByTypeChange={(v) => { setReferredByType(v); setPage(1); }}
        area={area}
        onAreaChange={(v) => { setArea(v); setPage(1); }}
        startDate={startDate}
        onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
      />

      <PatientTable
        patients={patients}
        isLoading={isLoading}
        total={total}
        page={page}
        onPageChange={setPage}
        onSendToOPD={handleSendToOPD}
      />

      <AddToOPDModal
        open={!!opdModalPatient}
        onClose={() => setOpdModalPatient(null)}
        patient={opdModalPatient}
      />
    </PageLayout>
  );
}
