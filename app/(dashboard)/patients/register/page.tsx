'use client';

import { useState, useEffect } from 'react';
import { patientsApi, authApi, documentsApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from '@/contexts/ToastContext';
import { Building2, Building, User, Users, AlertTriangle, X, Check, Camera, FileText, UploadCloud, Trash2, Barcode } from 'lucide-react';
import PatientBarcodeModal from '@/components/common/PatientBarcodeModal';

import { isUserDoctor, getUserRoleDisplay } from '@/lib/utils';

export default function RegisterPatientPage() {
  const { user, currentBranch, branches } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [registrationMode, setRegistrationMode] = useState<'couple' | 'individual'>('couple');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<{ primary: any; partner?: any } | null>(null);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  useEffect(() => {
    authApi.listUsers().then((u: any) => {
      if (Array.isArray(u)) {
        setDoctorsList(u.filter((x: any) => isUserDoctor(x)));
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
    blood_group: '',
    photo_url: '',
    identity_type: 'aadhaar',
    aadhaar_number: '',
    abha_number: '',
    referred_by_type: 'walk_in',
    referred_by_name: '',
    referring_doctor: '',
    marketing_person_name: '',
    area: '',
    treating_doctor_id: '',
    financial_type: 'self_pay',
    is_surrogate: false,
    alert_notes_text: '',
    clinical_notes_text: '',
    // Donor specific
    donor_type: 'oocyte_donor',
    donor_bank_code: '',
    serology_status: '',
    karyotype_status: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<{ name: string; dataUrl: string; type: string; size: string; fileObj?: File } | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => update('photo_url', reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentFile({
        name: file.name,
        dataUrl: reader.result as string,
        type: file.type || 'application/pdf',
        size: (file.size / 1024).toFixed(1) + ' KB',
        fileObj: file,
      });
    };
    reader.readAsDataURL(file);
  };

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
    blood_group: '',
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
      phone: data.phone?.trim() || '',
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
    if (data.photo_url) payload.photo_url = data.photo_url;
    if (data.referring_doctor) {
      payload.referring_doctor = data.referring_doctor.trim();
      payload.referred_by_name = data.referring_doctor.trim();
      payload.referred_by_type = 'doctor';
    } else if (data.referred_by_name) {
      payload.referred_by_name = data.referred_by_name.trim();
    }
    if (data.marketing_person_name) {
      payload.marketing_person_name = data.marketing_person_name.trim();
      if (!payload.referred_by_type) payload.referred_by_type = 'marketing_person';
    }
    if (data.financial_type) payload.financial_type = data.financial_type;
    if (data.is_surrogate) payload.is_surrogate = Boolean(data.is_surrogate);

    if (form.treating_doctor_id) payload.treating_doctor_id = form.treating_doctor_id;
    const activeBranchId = currentBranch?.id || branches?.[0]?.id || user?.branch_id;
    if (activeBranchId) payload.branch_id = activeBranchId;

    if (alertNotes.length > 0) payload.alert_notes = alertNotes;
    if (clinicalNotes.length > 0) payload.clinical_notes = clinicalNotes;

    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.phone?.trim()) {
      setError('Contact phone number is required for patient registration.');
      return;
    }

    setIsSaving(true);

    try {
      const primaryPayload = buildPayload(form, false);
      const primaryPatient: any = await patientsApi.create(primaryPayload);

      // If photo was picked, upload to purpose-based profile path and update patient photo_url
      if (photoFile && primaryPatient?.id) {
        try {
          const photoRes = await documentsApi.uploadFile(photoFile, {
            category: 'profile',
            document_type: 'patient_photo',
            patient_id: primaryPatient.id,
          });
          await patientsApi.update(primaryPatient.id, { photo_url: photoRes.url }).catch(() => {});
        } catch (photoErr) {
          console.warn('Notice: Background photo upload fallback:', photoErr);
        }
      }

      // If an identity document was selected during registration, attach it to identity folder
      if (documentFile) {
        try {
          let storedFilePath = documentFile.dataUrl;
          if (documentFile.fileObj && primaryPatient?.id) {
            try {
              const uploadRes = await documentsApi.uploadFile(documentFile.fileObj, {
                category: 'identity_proof',
                document_type: 'identity_proof',
                patient_id: primaryPatient.id,
              });
              storedFilePath = uploadRes.url;
            } catch (upErr) {
              console.warn('Identity document upload fallback:', upErr);
            }
          }
          await documentsApi.create({
            patient_id: primaryPatient.id,
            file_name: documentFile.name,
            file_path: storedFilePath,
            category: 'identity_proof',
            mime_type: documentFile.type,
          });
        } catch (docErr) {
          console.error('Failed to attach document during registration:', docErr);
        }
      }

      // If registered as couple and partner details are entered
      let partnerRes: any = null;
      if (form.registration_type === 'patient' && registrationMode === 'couple' && partnerForm.name.trim()) {
        const partnerPayload = {
          ...buildPayload(partnerForm, true),
          partner_id: primaryPatient.id,
          registration_type: 'patient',
          treating_doctor_id: form.treating_doctor_id || undefined,
          area: form.area?.trim() || undefined,
          referred_by_type: form.referred_by_type || undefined,
          referred_by_name: form.referred_by_name?.trim() || undefined,
          referring_doctor: form.referring_doctor?.trim() || undefined,
          marketing_person_name: form.marketing_person_name?.trim() || undefined,
        };

        partnerRes = await patientsApi.create(partnerPayload);
        // Bidirectional linking
        await patientsApi.linkPartner(primaryPatient.id, partnerRes.id).catch(() => {});
      }

      toast.success('Patient Registered', 'Registration completed successfully!');
      setRegisteredSuccessData({ primary: primaryPatient, partner: partnerRes });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review the input fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const bloodGroups = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

  const getPrimaryCardTitle = () => {
    if (form.registration_type === 'donor_bank') {
      return { icon: Building2, title: 'ART Bank Donor Details', subtitle: 'National ART Registry & Bank Form 23' };
    }
    if (form.registration_type === 'donor_hospital') {
      return { icon: Building, title: 'Hospital Altruistic Donor Details', subtitle: 'Hospital Clinical & Genetic Screening' };
    }
    if (registrationMode === 'couple') {
      return { icon: User, title: 'Female Partner / Wife', subtitle: 'Primary Commissioning Patient' };
    }
    return {
      icon: User,
      title: 'Patient Details',
      subtitle: 'Universal Patient Registration (OPD / GYN / General)',
    };
  };

  const cardHeader = getPrimaryCardTitle();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Registration Portal</h1>
          <p className="text-slate-500 text-xs mt-1">Register new fertility couples, individual patients, or gamete donors</p>
        </div>
        <Link href="/patients" className="text-xs font-bold text-slate-500 hover:text-slate-800">
          ← Back to Directory
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> {error}</span>
          <button onClick={() => setError('')} className="text-rose-500 p-1 rounded-md hover:bg-rose-100 transition-colors"><X className="w-4 h-4" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Registration Category Selector */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            1. Registration Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: 'patient', label: 'Clinical Patient / Couple', desc: 'Standard fertility treatments' },
              { value: 'donor_bank', label: 'ART Bank Donor', desc: 'Commercial/Bank gamete donor' },
              { value: 'donor_hospital', label: 'Hospital Donor', desc: 'Altruistic hospital donor' },
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
                className={`p-3.5 rounded-md text-left border transition-all ${
                  form.registration_type === cat.value
                    ? 'border-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.05)] ring-2 ring-[rgb(var(--clr-primary)/0.2)] shadow-sm'
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
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    registrationMode === 'couple'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Couple (Wife & Husband)
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationMode('individual')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    registrationMode === 'individual'
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Individual Patient
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Primary Patient / Donor Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <cardHeader.icon className="w-4 h-4 text-slate-500 inline mr-1" /> {cardHeader.title}
              <span className="text-[11px] font-normal text-slate-400">({cardHeader.subtitle})</span>
            </h2>
            <span className="text-[10px] text-[rgb(var(--clr-primary))] font-semibold bg-[rgb(var(--clr-primary)/0.08)] px-2.5 py-0.5 rounded-md border border-[rgb(var(--clr-primary)/0.2)]">
              Auto VID Generated
            </span>
          </div>

          {/* Donor-Specific Fields */}
          {form.registration_type !== 'patient' && (
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-md grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  <option value="oocyte_donor">Oocyte Donor (Female)</option>
                  <option value="semen_donor">Semen / Sperm Donor (Male)</option>
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
                required
              >
                <option value="" disabled>— Select —</option>
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
                <option value="">— Select Blood Group —</option>
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

          {/* Aadhaar, Doctor & Referral Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-500 mb-1.5 min-h-[32px] flex items-end">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={form.aadhaar_number}
                onChange={(e) => update('aadhaar_number', e.target.value)}
                className="vmd-input text-xs"
                placeholder="9876-5432-1098"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-500 mb-1.5 min-h-[32px] flex items-end">
                <span>Treating Consultant <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <select
                value={form.treating_doctor_id}
                onChange={(e) => update('treating_doctor_id', e.target.value)}
                className="vmd-input text-xs"
              >
                <option value="">— Assign Doctor Later at OPD —</option>
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} ({d.specialization || (d.role === 'admin' && d.is_doctor ? 'Admin + Doctor' : 'Doctor')})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-500 mb-1.5 min-h-[32px] flex items-end">
                <span>Referring Doctor / Clinic <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="text"
                value={form.referring_doctor}
                onChange={(e) => update('referring_doctor', e.target.value)}
                className="vmd-input text-xs"
                placeholder="e.g. Dr. A. Sharma / City Clinic"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="text-xs font-bold text-slate-500 mb-1.5 min-h-[32px] flex items-end">
                <span>Marketing Person / Lead <span className="text-[10px] text-slate-400 font-normal">(Optional)</span></span>
              </label>
              <input
                type="text"
                value={form.marketing_person_name}
                onChange={(e) => update('marketing_person_name', e.target.value)}
                className="vmd-input text-xs"
                placeholder="e.g. Rahul Kumar (Field Lead)"
              />
            </div>
          </div>

          {/* Non-Mandatory Patient Photo & Identity Document Upload */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Photo */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" /> Patient Photo <span className="text-[10px] text-slate-400 font-normal">(Optional — can upload later)</span>
                </label>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={() => update('photo_url', '')}
                    className="text-[10px] text-rose-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Patient Preview" className="w-14 h-14 rounded-full object-cover border border-slate-300 shadow-xs" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">JPG, PNG format (Max 2MB)</p>
                </div>
              </div>
            </div>

            {/* Document / Aadhaar Upload */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Aadhaar / Identity Proof <span className="text-[10px] text-slate-400 font-normal">(Optional — can upload later)</span>
                </label>
                {documentFile && (
                  <button
                    type="button"
                    onClick={() => setDocumentFile(null)}
                    className="text-[10px] text-rose-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
              <div className="flex-1">
                {documentFile ? (
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{documentFile.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">({documentFile.size})</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleDocumentUpload}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">PDF or image of Aadhaar / ID proof</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Alerts & Drug Allergies Field */}
          <div className="pt-3 border-t border-slate-100">
            <label className="block text-xs font-bold text-amber-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1" /> Clinical Alerts & Drug Allergies <span className="text-[10px] text-slate-400 font-normal">(Optional — leave blank if none)</span>
            </label>
            <input
              type="text"
              value={form.alert_notes_text}
              onChange={(e) => update('alert_notes_text', e.target.value)}
              className="vmd-input text-xs bg-amber-50/40 border-amber-200 text-amber-950 placeholder-amber-700/50 focus:ring-amber-400"
              placeholder="e.g. Sulfa drug allergy, Penicillin allergy, Diabetic, Hypertensive, Thyroid"
            />
          </div>
        </div>

        {/* Partner Card (Only if registering a couple) */}
        {form.registration_type === 'patient' && registrationMode === 'couple' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500 inline mr-1" /> Male Partner / Husband Details
              </h2>
              <span className="text-[10px] text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                <select value={partnerForm.gender} onChange={(e) => updatePartner('gender', e.target.value)} className="vmd-input text-xs">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
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
                  <option value="">— Select Blood Group —</option>
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
            className="flex-1 py-3.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md shadow-sm transition-colors"
          >
            {isSaving ? 'Registering...' : 'Complete Registration'}
          </button>
          <Link
            href="/patients"
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-md transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>

      {/* Registration Success & Quick Barcode Sticker Dialog */}
      {registeredSuccessData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Registration Complete!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Patient record successfully created in VaidyaMD HMS
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full font-mono text-xs font-bold text-primary">
                VID: {registeredSuccessData.primary?.vid}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <strong className="text-slate-900 uppercase">{registeredSuccessData.primary?.name}</strong>
              </div>
              {registeredSuccessData.partner?.name && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Partner / Spouse:</span>
                  <strong className="text-slate-900 uppercase">{registeredSuccessData.partner.name}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-mono text-slate-700">{registeredSuccessData.primary?.phone || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBarcodeModal(true)}
                className="py-2.5 px-4 bg-slate-900 hover:bg-black text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Barcode className="w-4 h-4" />
                <span>Print Barcode Stickers</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/patients/${registeredSuccessData.primary.id}`)}
                className="py-2.5 px-4 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Go to EMR Profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {showBarcodeModal && registeredSuccessData && (
        <PatientBarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          patient={registeredSuccessData.primary}
          partner={registeredSuccessData.partner}
          initialPreset="50x38"
          initialSampleType="Case File"
        />
      )}
    </div>
  );
}
