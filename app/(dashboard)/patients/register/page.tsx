'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPlus, AlertTriangle, X, ArrowLeft } from 'lucide-react';
import PageLayout from '@/components/common/PageLayout';
import PageHeader from '@/components/common/PageHeader';
import { Badge } from '@/shared/ui/badge';
import { toast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { patientsApi, authApi, billingApi, appointmentsApi } from '@/lib/api';
import { isUserDoctor } from '@/lib/utils';
import {
  RegistrationMode,
  RegistrationSuccessData,
  CategorySelectorSection,
  PrimaryPatientFormSection,
  PartnerFormSection,
  RegistrationTariffSection,
  RegistrationSuccessModal,
  buildRegistrationPayload,
  uploadRegistrationDocuments,
  useRegistrationForm,
} from '@/components/patients/registration';

export default function RegisterPatientPage() {
  const { user, currentBranch, branches } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('couple');
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [registeredSuccessData, setRegisteredSuccessData] = useState<RegistrationSuccessData | null>(null);

  // Registration Tariff & Billing State
  const [tariffFee, setTariffFee] = useState<number>(500);
  const [tariffPaymentStatus, setTariffPaymentStatus] = useState<'paid' | 'pending' | 'waived'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // OPD Direct Check-in State
  const [queueForOpd, setQueueForOpd] = useState(false);
  const [opdDoctorId, setOpdDoctorId] = useState('');
  const [opdVisitType, setOpdVisitType] = useState('consultation');

  const {
    form,
    update,
    partnerForm,
    updatePartner,
    photoFile,
    documentFile,
    setDocumentFile,
    handlePhotoUpload,
    handleDocumentUpload,
  } = useRegistrationForm();

  useEffect(() => {
    authApi.listUsers().then((u: any) => {
      if (Array.isArray(u)) setDoctorsList(u.filter((x: any) => isUserDoctor(x)));
    }).catch(() => {});
  }, []);

  const activeBranchId = currentBranch?.id || branches?.[0]?.id || user?.branch_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.phone?.trim()) {
      setError('Contact phone number is required for patient registration.');
      return;
    }

    setIsSaving(true);
    try {
      const primaryPayload = buildRegistrationPayload(form, form.registration_type, form.treating_doctor_id, activeBranchId, false);
      const primaryPatient: any = await patientsApi.create(primaryPayload);

      // Async documents upload helper
      await uploadRegistrationDocuments(primaryPatient.id, photoFile, documentFile);

      // Partner creation and bidirectional link if couple mode
      let partnerRes: any = null;
      const isCouple = form.registration_type === 'patient' && registrationMode === 'couple' && Boolean(partnerForm.name.trim());
      if (isCouple) {
        const partnerPayload = {
          ...buildRegistrationPayload(partnerForm, 'patient', form.treating_doctor_id, activeBranchId, true),
          partner_id: primaryPatient.id,
          registration_type: 'patient',
          area: form.area?.trim() || undefined,
          referred_by_type: form.referred_by_type || undefined,
          referred_by_name: form.referred_by_name?.trim() || undefined,
          referring_doctor: form.referring_doctor?.trim() || undefined,
          marketing_person_name: form.marketing_person_name?.trim() || undefined,
        };

        partnerRes = await patientsApi.create(partnerPayload);
        await patientsApi.linkPartner(primaryPatient.id, partnerRes.id).catch(() => {});
      }

      // Generate Single Consolidated Couple Registration Invoice if tariff > 0
      let invoiceRes: any = null;
      if (tariffFee > 0 && tariffPaymentStatus !== 'waived') {
        try {
          const itemDesc = isCouple
            ? `Couple Registration & Initial Consultation - [Primary: ${primaryPatient.name}] & [Spouse: ${partnerRes?.name || 'Partner'}]`
            : `Patient Registration & Initial Consultation - ${primaryPatient.name}`;
          const invNotes = isCouple
            ? `Consolidated couple registration tariff for ${primaryPatient.name} (${primaryPatient.vid}) and ${partnerRes?.name || 'Spouse'} (${partnerRes?.vid || ''}). Spouse fee waived (₹0).`
            : `Registration tariff for ${primaryPatient.name} (${primaryPatient.vid})`;

          invoiceRes = await billingApi.createInvoice({
            patient_id: primaryPatient.id,
            appointment_source: 'OP',
            source_module: 'opd',
            reason_for_attendance: isCouple ? 'Couple Registration' : 'Patient Registration',
            items: [{
              description: itemDesc,
              quantity: 1,
              unit_price: tariffFee,
              total: tariffFee,
              service_code: isCouple ? 'REG-COUPLE' : 'REG-PATIENT',
            }],
            paid_amount: tariffPaymentStatus === 'paid' ? tariffFee : 0,
            payment_method: tariffPaymentStatus === 'paid' ? paymentMethod : 'pending',
            branch_id: activeBranchId,
            notes: invNotes,
          });
        } catch (invErr) {
          console.warn('Registration invoice creation note:', invErr);
        }
      }

      // Direct Check-In to Today's OPD Waiting Queue if selected
      let appointmentRes: any = null;
      const effectiveDoctorId = form.treating_doctor_id || opdDoctorId || doctorsList[0]?.id;
      if (queueForOpd && effectiveDoctorId) {
        try {
          const apptMeta: Record<string, any> = {};
          if (isCouple && partnerRes) {
            apptMeta.is_couple_visit = true;
            apptMeta.partner_id = partnerRes.id;
            apptMeta.partner_name = partnerRes.name;
            apptMeta.partner_vid = partnerRes.vid;
          }
          if (invoiceRes?.id) {
            apptMeta.invoice_id = String(invoiceRes.id);
            apptMeta.invoice_number = invoiceRes.invoice_number;
            apptMeta.invoice_status = invoiceRes.status;
          }

          appointmentRes = await appointmentsApi.create({
            patient_id: primaryPatient.id,
            doctor_id: effectiveDoctorId,
            department: 'OPD',
            scheduled_at: new Date().toISOString(),
            visit_type: opdVisitType || 'consultation',
            status: 'waiting',
            consultation_fee: 0,
            notes: isCouple
              ? `Direct OPD check-in from Couple Registration (${primaryPatient.name} & ${partnerRes?.name || 'Spouse'})`
              : `Direct OPD check-in from Registration (${primaryPatient.name})`,
            metadata: Object.keys(apptMeta).length > 0 ? apptMeta : undefined,
          });
        } catch (apptErr) {
          console.warn('OPD Queue check-in notice:', apptErr);
        }
      }

      toast.success(
        isCouple ? 'Couple Registered' : 'Patient Registered',
        isCouple
          ? queueForOpd
            ? 'Couple registered and added to today\'s OPD waiting queue!'
            : 'Couple registered with single consolidated tariff!'
          : queueForOpd
          ? 'Patient registered and added to today\'s OPD waiting queue!'
          : 'Registration completed successfully!'
      );
      setRegisteredSuccessData({
        primary: primaryPatient,
        partner: partnerRes,
        invoice: invoiceRes,
        fee: tariffFee,
        appointment: appointmentRes,
        queuedToOpd: Boolean(appointmentRes),
      });
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
          <PartnerFormSection partnerForm={partnerForm} updatePartner={updatePartner} />
        )}

        <RegistrationTariffSection
          registrationMode={registrationMode}
          tariffFee={tariffFee}
          setTariffFee={setTariffFee}
          tariffPaymentStatus={tariffPaymentStatus}
          setTariffPaymentStatus={setTariffPaymentStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          primaryName={form.name}
          partnerName={partnerForm.name}
          queueForOpd={queueForOpd}
          setQueueForOpd={setQueueForOpd}
          treatingDoctorId={form.treating_doctor_id}
          doctorsList={doctorsList}
          opdDoctorId={opdDoctorId}
          setOpdDoctorId={setOpdDoctorId}
          opdVisitType={opdVisitType}
          setOpdVisitType={setOpdVisitType}
        />

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3.5 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold text-xs rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Registering...' : registrationMode === 'couple' ? 'Complete Couple Registration' : 'Complete Registration'}
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
