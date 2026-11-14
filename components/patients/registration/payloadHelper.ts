import { PatientRegistrationFormState, PartnerRegistrationFormState, DocumentUploadFile } from './types';
import { documentsApi, patientsApi } from '@/lib/api';

export function buildRegistrationPayload(
  data: PatientRegistrationFormState | PartnerRegistrationFormState | any,
  registrationType: string,
  treatingDoctorId?: string,
  activeBranchId?: string,
  isPartner = false
): Record<string, any> {
  const alertNotes = data.alert_notes_text
    ? data.alert_notes_text.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];
  const clinicalNotes = data.clinical_notes_text
    ? data.clinical_notes_text.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : [];

  if (registrationType !== 'patient') {
    if (data.donor_type) clinicalNotes.push(`Donor Type: ${data.donor_type.replace('_', ' ').toUpperCase()}`);
    if (data.donor_bank_code) clinicalNotes.push(`Bank Registry Code: ${data.donor_bank_code}`);
    if (data.serology_status) clinicalNotes.push(`Serology: ${data.serology_status}`);
    if (data.karyotype_status) clinicalNotes.push(`Karyotype: ${data.karyotype_status}`);
  }

  const payload: Record<string, any> = {
    name: data.name?.trim(),
    registration_type: registrationType,
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

  if (treatingDoctorId) payload.treating_doctor_id = treatingDoctorId;
  if (activeBranchId) payload.branch_id = activeBranchId;

  if (alertNotes.length > 0) payload.alert_notes = alertNotes;
  if (clinicalNotes.length > 0) payload.clinical_notes = clinicalNotes;

  return payload;
}

export async function uploadRegistrationDocuments(
  primaryPatientId: string,
  photoFile: File | null,
  documentFile: DocumentUploadFile | null
): Promise<void> {
  if (photoFile && primaryPatientId) {
    try {
      const photoRes = await documentsApi.uploadFile(photoFile, {
        category: 'profile',
        document_type: 'patient_photo',
        patient_id: primaryPatientId,
      });
      await patientsApi.update(primaryPatientId, { photo_url: photoRes.url }).catch(() => {});
    } catch (photoErr) {
      console.warn('Background photo upload fallback:', photoErr);
    }
  }

  if (documentFile && primaryPatientId) {
    try {
      let storedFilePath = documentFile.dataUrl;
      if (documentFile.fileObj) {
        try {
          const uploadRes = await documentsApi.uploadFile(documentFile.fileObj, {
            category: 'identity_proof',
            document_type: 'identity_proof',
            patient_id: primaryPatientId,
          });
          storedFilePath = uploadRes.url;
        } catch (upErr) {
          console.warn('Identity document upload fallback:', upErr);
        }
      }
      await documentsApi.create({
        patient_id: primaryPatientId,
        file_name: documentFile.name,
        file_path: storedFilePath,
        category: 'identity_proof',
        mime_type: documentFile.type,
      });
    } catch (docErr) {
      console.error('Failed to attach document during registration:', docErr);
    }
  }
}
