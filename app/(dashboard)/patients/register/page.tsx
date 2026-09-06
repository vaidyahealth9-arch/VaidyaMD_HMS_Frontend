'use client';

import { useState, useEffect } from 'react';
import { patientsApi, authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function RegisterPatientPage() {
  const { user, currentBranch } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [registrationMode, setRegistrationMode] = useState<'couple' | 'individual'>('couple');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  useEffect(() => {
    authApi.listUsers().then((u: any) => {
      if (Array.isArray(u)) {
        setDoctorsList(u.filter((x: any) => x.is_doctor || x.role === 'doctor' || x.role === 'DOCTOR'));
      }
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    registration_type: 'patient',
    title: 'Mrs.',
    name: '',
    surname: '',
    surname_at_birth: '',
    gender: 'female',
    age: '',
    dob: '',
    marital_status: 'married',
    phone: '',
    alternate_phone: '',
    email: '',
    address: '',
    education_qualification: '',
    occupation: '',
    nationality: 'Indian',
    mother_tongue: '',
    blood_group: 'B+ve',
    identity_type: 'aadhaar',
    aadhaar_number: '',
    abha_number: '',
    referred_by_type: 'walk_in',
    referred_by_name: '',
    area: '',
    treating_doctor_id: '',
    financial_type: 'self_pay',
    is_surrogate: false,
    alert_notes_text: '',
    clinical_notes_text: '',
    // Donor specific
    donor_type: 'oocyte_donor',
    donor_bank_code: '',
    serology_status: 'Non-Reactive (All Negative)',
    karyotype_status: '46,XX Normal',
  });

  const [partnerForm, setPartnerForm] = useState({
    title: 'Mr.',
    name: '',
    surname: '',
    age: '',
    dob: '',
    gender: 'male',
    marital_status: 'married',
    phone: '',
    email: '',
    occupation: '',
    education_qualification: '',
    blood_group: 'O+ve',
    identity_type: 'aadhaar',
    aadhaar_number: '',
    abha_number: '',
  });

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const updatePartner = (field: string, value: any) => setPartnerForm((prev) => ({ ...prev, [field]: value }));

  // Helper to build clean sanitized payload for API
  const buildPayload = (data: any, isPartner = false) => {
    const alertNotes = data.alert_notes_text ? data.alert_notes_text.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
    const clinicalNotes = data.clinical_notes_text ? data.clinical_notes_text.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];

    // Donor annotations
    if (form.registration_type !== 'patient') {
      clinicalNotes.push(`Donor Type: ${form.donor_type.replace('_', ' ').toUpperCase()}`);
      if (form.donor_bank_code) clinicalNotes.push(`Bank Registry Code: ${form.donor_bank_code}`);
      clinicalNotes.push(`Serology: ${form.serology_status}`);
      clinicalNotes.push(`Karyotype: ${form.karyotype_status}`);
    }

    const payload: Record<string, any> = {
      name: data.name?.trim(),
      registration_type: form.registration_type,
      gender: data.gender || (isPartner ? 'male' : 'female'),
      phone: data.phone?.trim() || '+91-9999900000',
    };

    if (data.title) payload.title = data.title;
    if (data.surname) payload.surname = data.surname.trim();
    if (data.surname_at_birth) payload.surname_at_birth = data.surname_at_birth.trim();
    if (data.age && !isNaN(parseInt(data.age))) payload.age = parseInt(data.age);
    if (data.dob) payload.dob = data.dob;
    if (data.marital_status) payload.marital_status = data.marital_status;
    if (data.email) payload.email = data.email.trim();
    if (data.address) payload.address = data.address.trim();
    if (data.education_qualification) payload.education_qualification = data.education_qualification;
    if (data.occupation) payload.occupation = data.occupation;
    if (data.nationality) payload.nationality = data.nationality;
    if (data.blood_group) payload.blood_group = data.blood_group;
    if (data.identity_type) payload.identity_type = data.identity_type;
    if (data.aadhaar_number) payload.aadhaar_number = data.aadhaar_number.trim();
    if (data.abha_number) payload.abha_number = data.abha_number.trim();
    if (data.area) payload.area = data.area.trim();
    if (data.referred_by_type) payload.referred_by_type = data.referred_by_type;
    if (data.referred_by_name) payload.referred_by_name = data.referred_by_name.trim();
    if (data.financial_type) payload.financial_type = data.financial_type;
    if (data.is_surrogate) payload.is_surrogate = Boolean(data.is_surrogate);

    if (form.treating_doctor_id) payload.treating_doctor_id = form.treating_doctor_id;
    if (currentBranch?.id) payload.branch_id = currentBranch.id;

    if (alertNotes.length > 0) payload.alert_notes = alertNotes;
    if (clinicalNotes.length > 0) payload.clinical_notes = clinicalNotes;

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const primaryPayload = buildPayload(form, false);
      const primaryPatient: any = await patientsApi.create(primaryPayload);

      // If registered as couple and partner details are entered
      if (form.registration_type === 'patient' && registrationMode === 'couple' && partnerForm.name.trim()) {
        const partnerPayload = {
          ...buildPayload(partnerForm, true),
          partner_id: primaryPatient.id,
          registration_type: 'patient',
          treating_doctor_id: form.treating_doctor_id || undefined,
          area: form.area?.trim() || undefined,
          referred_by_type: form.referred_by_type || undefined,
          referred_by_name: form.referred_by_name?.trim() || undefined,
        };

        const partner: any = await patientsApi.create(partnerPayload);
        // Bidirectional linking
        await patientsApi.linkPartner(primaryPatient.id, partner.id).catch(() => {});
      }

      router.push(`/patients/${primaryPatient.id}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review the input fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const bloodGroups = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

  const getPrimaryCardTitle = () => {
    if (form.registration_type === 'donor_bank') {
      return { icon: '🏦', title: 'ART Bank Donor Details', subtitle: 'National ART Registry & Bank Form 23' };
    }
    if (form.registration_type === 'donor_hospital') {
      return { icon: '🏥', title: 'Hospital Altruistic Donor Details', subtitle: 'Hospital Clinical & Genetic Screening' };
    }
    if (registrationMode === 'couple') {
      return { icon: '👩', title: 'Female Partner / Wife', subtitle: 'Primary Commissioning Patient' };
    }
    return {
      icon: form.gender === 'male' ? '👨' : '👩',
      title: `${form.gender === 'male' ? 'Male' : 'Female'} Patient Details`,
      subtitle: 'Individual Patient Registration',
    };
  };

  const cardHeader = getPrimaryCardTitle();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Registration Portal</h1>
          <p className="text-slate-500 text-xs mt-1">Register new fertility couples, individual patients, or gamete donors</p>
        </div>
        <Link href="/patients" className="text-xs font-bold text-slate-500 hover:text-slate-800">
          ← Back to Directory
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-500 font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Category Selector */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            1. Registration Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'patient', label: '👤 Clinical Patient / Couple', desc: 'Standard fertility treatments' },
              { value: 'donor_bank', label: '🏦 ART Bank Donor', desc: 'Commercial/Bank gamete donor' },
              { value: 'donor_hospital', label: '🏥 Hospital Donor', desc: 'Altruistic hospital donor' },
            ].map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  update('registration_type', cat.value);
                  if (cat.value !== 'patient') {
                    setRegistrationMode('individual');
                  }
                }}
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  form.registration_type === cat.value
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="font-bold text-xs text-slate-900">{cat.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
              </button>
            ))}
          </div>

          {/* Couple vs Individual Toggle (Visible only for patients) */}
          {form.registration_type === 'patient' && (
            <div className="pt-3 border-t flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">Patient Type:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegistrationMode('couple')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    registrationMode === 'couple'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👫 Couple (Wife & Husband)
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationMode('individual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    registrationMode === 'individual'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👤 Individual Patient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Patient / Donor Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{cardHeader.icon}</span> {cardHeader.title}
              <span className="text-[11px] font-normal text-slate-400">({cardHeader.subtitle})</span>
            </h2>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Auto VID Generated
            </span>
          </div>

          {/* Donor-Specific Fields */}
          {form.registration_type !== 'patient' && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Gamete Donor Type</label>
                <select
                  value={form.donor_type}
                  onChange={(e) => {
                    update('donor_type', e.target.value);
                    if (e.target.value === 'oocyte_donor') {
                      update('gender', 'female');
                      update('title', 'Ms.');
                    } else {
                      update('gender', 'male');
                      update('title', 'Mr.');
                    }
                  }}
                  className="vmd-input text-xs"
                >
                  <option value="oocyte_donor">🥚 Oocyte Donor (Female)</option>
                  <option value="semen_donor">🔬 Semen / Sperm Donor (Male)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">ART Bank Code / ID</label>
                <input
                  type="text"
                  value={form.donor_bank_code}
                  onChange={(e) => update('donor_bank_code', e.target.value)}
                  placeholder="e.g. ART-BNK-HYD-044"
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">Serology Clearance</label>
                <input
                  type="text"
                  value={form.serology_status}
                  onChange={(e) => update('serology_status', e.target.value)}
                  className="vmd-input text-xs font-bold text-emerald-800"
                />
              </div>
            </div>
          )}

          {/* Name & Title */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
              <select value={form.title} onChange={(e) => update('title', e.target.value)} className="vmd-input text-xs">
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mr.">Mr.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="vmd-input text-xs"
                placeholder={form.registration_type === 'donor_bank' ? 'Donor Oocyte #44' : 'e.g. Sunita'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Surname</label>
              <input
                type="text"
                value={form.surname}
                onChange={(e) => update('surname', e.target.value)}
                className="vmd-input text-xs"
                placeholder="e.g. Verma"
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Gender <span className="text-red-500">*</span></label>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                className="vmd-input text-xs"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Age (Years) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                required
                min={18}
                max={70}
                className="vmd-input text-xs"
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => update('dob', e.target.value)}
                className="vmd-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Blood Group</label>
              <select value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)} className="vmd-input text-xs">
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact & Identifiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                required
                className="vmd-input text-xs"
                placeholder="+91-9876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="vmd-input text-xs"
                placeholder="patient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Area / Locality</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => update('area', e.target.value)}
                className="vmd-input text-xs"
                placeholder="Jubilee Hills, Hyderabad"
              />
            </div>
          </div>

          {/* Aadhaar & Doctor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Aadhaar Number</label>
              <input
                type="text"
                value={form.aadhaar_number}
                onChange={(e) => update('aadhaar_number', e.target.value)}
                className="vmd-input text-xs"
                placeholder="9876-5432-1098"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Treating Consultant</label>
              <select
                value={form.treating_doctor_id}
                onChange={(e) => update('treating_doctor_id', e.target.value)}
                className="vmd-input text-xs"
              >
                <option value="">— Select Doctor —</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialization || 'Doctor'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Referred By</label>
              <select
                value={form.referred_by_type}
                onChange={(e) => update('referred_by_type', e.target.value)}
                className="vmd-input text-xs"
              >
                <option value="walk_in">Walk-in / Self</option>
                <option value="doctor">Referring Doctor</option>
                <option value="marketing_person">Marketing Camp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Partner Card (Only if registering a couple) */}
        {form.registration_type === 'patient' && registrationMode === 'couple' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>👨</span> Male Partner / Husband Details
              </h2>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Bidirectional Couple Link
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Title</label>
                <select value={partnerForm.title} onChange={(e) => updatePartner('title', e.target.value)} className="vmd-input text-xs">
                  <option value="Mr.">Mr.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Husband Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={partnerForm.name}
                  onChange={(e) => updatePartner('name', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="e.g. Rajesh"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Surname</label>
                <input
                  type="text"
                  value={partnerForm.surname}
                  onChange={(e) => updatePartner('surname', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="e.g. Verma"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={partnerForm.age}
                  onChange={(e) => updatePartner('age', e.target.value)}
                  min={18}
                  max={75}
                  className="vmd-input text-xs"
                  placeholder="34"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={partnerForm.phone}
                  onChange={(e) => updatePartner('phone', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="+91-9876543211"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Blood Group</label>
                <select value={partnerForm.blood_group} onChange={(e) => updatePartner('blood_group', e.target.value)} className="vmd-input text-xs">
                  {bloodGroups.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition-colors"
          >
            {isSaving ? 'Registering...' : '✅ Complete Registration'}
          </button>
          <Link
            href="/patients"
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
