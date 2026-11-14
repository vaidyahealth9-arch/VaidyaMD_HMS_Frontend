'use client';

import { useState } from 'react';
import {
  PatientRegistrationFormState,
  PartnerRegistrationFormState,
  DocumentUploadFile,
} from './types';

export function useRegistrationForm() {
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
    donor_type: 'oocyte_donor',
    donor_bank_code: '',
    serology_status: '',
    karyotype_status: '',
  });

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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<DocumentUploadFile | null>(null);

  const update = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));
  const updatePartner = (field: string, value: any) => setPartnerForm((prev) => ({ ...prev, [field]: value }));

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

  return {
    form,
    update,
    partnerForm,
    updatePartner,
    photoFile,
    documentFile,
    setDocumentFile,
    handlePhotoUpload,
    handleDocumentUpload,
  };
}
