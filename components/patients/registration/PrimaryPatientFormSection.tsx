import React from 'react';
import { Building2, Building, User, AlertTriangle, Camera, FileText, Trash2 } from 'lucide-react';
import { PatientRegistrationFormState, RegistrationMode, DocumentUploadFile, BLOOD_GROUPS } from './types';

interface PrimaryPatientFormSectionProps {
  form: PatientRegistrationFormState;
  update: (field: string, value: any) => void;
  registrationMode: RegistrationMode;
  doctorsList: any[];
  documentFile: DocumentUploadFile | null;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDocument: () => void;
}

export default function PrimaryPatientFormSection({
  form,
  update,
  registrationMode,
  doctorsList,
  documentFile,
  handlePhotoUpload,
  handleDocumentUpload,
  onClearDocument,
}: PrimaryPatientFormSectionProps) {
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
            {BLOOD_GROUPS.map((bg) => (
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
                onClick={onClearDocument}
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
  );
}
