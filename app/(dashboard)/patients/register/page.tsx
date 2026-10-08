'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/shared/ui/badge';
import { toast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { patientsApi, authApi, documentsApi } from '@/lib/api';
import { isUserDoctor } from '@/lib/utils';
import {
  PatientRegistrationFormState,
  PartnerRegistrationFormState,
  RegistrationMode,
  DocumentUploadFile,
  RegistrationSuccessData,
  CategorySelectorSection,
  PrimaryPatientFormSection,
  PartnerFormSection,
  RegistrationSuccessModal,
} from '@/components/patients/registration';

export default function RegisterPatientPage() {
  const { user, currentBranch, branches } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('couple');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<RegistrationSuccessData | null>(null);

  useEffect(() => {
    authApi.listUsers().then((u: any) => {
      if (Array.isArray(u)) {
        setDoctorsList(u.filter((x: any) => isUserDoctor(x)));
      }
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState<PatientRegistrationFormState>({
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
  const [documentFile, setDocumentFile] = useState<DocumentUploadFile | null>(null);

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

  const [partnerForm, setPartnerForm] = useState<PartnerRegistrationFormState>({
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

  return (
    <PageLayout className="space-y-6">
      <PageHeader
        icon={UserPlus}
        title="Registration Portal"
        titleBadge={<Badge variant="outline" className="text-primary border-primary/30">Universal EMR</Badge>}
        subtitle="Register new fertility couples, individual patients, or gamete donors"
        actions={
          <Link
            href="/patients"
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Directory</span>
          </Link>
        }
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" /> {error}
          </span>
          <button
            onClick={() => setError('')}
            className="text-rose-500 p-1 rounded-md hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <CategorySelectorSection
          registrationType={form.registration_type}
          registrationMode={registrationMode}
          onSelectCategory={(cat) => update('registration_type', cat)}
          onSelectMode={setRegistrationMode}
        />

        <PrimaryPatientFormSection
          form={form}
          update={update}
          registrationMode={registrationMode}
          doctorsList={doctorsList}
          documentFile={documentFile}
          handlePhotoUpload={handlePhotoUpload}
          handleDocumentUpload={handleDocumentUpload}
          onClearDocument={() => setDocumentFile(null)}
        />

        {form.registration_type === 'patient' && registrationMode === 'couple' && (
          <PartnerFormSection
            partnerForm={partnerForm}
            updatePartner={updatePartner}
          />
        )}

        {/* Submit Actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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

      <RegistrationSuccessModal data={registeredSuccessData} />
    </PageLayout>
  );
}
