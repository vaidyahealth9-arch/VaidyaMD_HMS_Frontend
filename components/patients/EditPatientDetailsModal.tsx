'use client';

import React, { useState, useEffect } from 'react';
import { patientsApi, authApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { X, UserCheck, Save, Loader2 } from 'lucide-react';
import { isUserDoctor } from '@/lib/utils';

interface EditPatientDetailsModalProps {
  open: boolean;
  onClose: () => void;
  patient: any;
  onSuccess: (updatedPatient: any) => void;
}

const BLOOD_GROUPS = ['A+ve', 'A-ve', 'B+ve', 'B-ve', 'O+ve', 'O-ve', 'AB+ve', 'AB-ve'];

export default function EditPatientDetailsModal({
  open,
  onClose,
  patient,
  onSuccess,
}: EditPatientDetailsModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && patient) {
      setFormData({
        title: patient.title || (patient.gender === 'male' ? 'Mr.' : 'Mrs.'),
        name: patient.name || '',
        surname: patient.surname || '',
        gender: patient.gender || 'female',
        age: patient.age !== null && patient.age !== undefined ? String(patient.age) : '',
        dob: patient.dob || '',
        marital_status: patient.marital_status || 'married',
        blood_group: patient.blood_group || '',
        phone: patient.phone || '',
        alternate_phone: patient.alternate_phone || '',
        email: patient.email || '',
        address: patient.address || '',
        area: patient.area || '',
        treating_doctor_id: patient.treating_doctor_id || '',
        referring_doctor: patient.referring_doctor || '',
        marketing_person_name: patient.marketing_person_name || '',
        financial_type: patient.financial_type || 'self_pay',
        abha_number: patient.abha_number || '',
        occupation: patient.occupation || '',
        education_qualification: patient.education_qualification || '',
      });
      setError('');
    }
  }, [open, patient]);

  useEffect(() => {
    if (open) {
      authApi.listUsers().then((u: any) => {
        if (Array.isArray(u)) {
          setDoctorsList(u.filter((x: any) => isUserDoctor(x)));
        }
      }).catch(() => {});
    }
  }, [open]);

  if (!open || !patient) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Patient name is required.');
      return;
    }
    if (!formData.phone?.trim()) {
      setError('Phone number is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload: Record<string, any> = {
        title: formData.title || undefined,
        name: formData.name.trim(),
        surname: formData.surname?.trim() || undefined,
        gender: formData.gender,
        age: formData.age && !isNaN(parseInt(formData.age)) ? parseInt(formData.age) : null,
        dob: formData.dob || null,
        marital_status: formData.marital_status || undefined,
        blood_group: formData.blood_group || undefined,
        phone: formData.phone.trim(),
        alternate_phone: formData.alternate_phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        area: formData.area?.trim() || undefined,
        treating_doctor_id: formData.treating_doctor_id || null,
        referring_doctor: formData.referring_doctor?.trim() || undefined,
        referred_by_name: formData.referring_doctor?.trim() || undefined,
        marketing_person_name: formData.marketing_person_name?.trim() || undefined,
        financial_type: formData.financial_type || undefined,
        abha_number: formData.abha_number?.trim() || undefined,
        occupation: formData.occupation?.trim() || undefined,
        education_qualification: formData.education_qualification?.trim() || undefined,
      };

      const updated = await patientsApi.update(patient.id, payload);
      toast.success('Patient Details Updated', `Information for ${formData.name} was successfully updated.`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update patient details. Please check the values and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Update Patient Details</h2>
              <p className="text-xs text-slate-500">
                Editing demographics and clinical records for <strong className="text-slate-800">{patient.name}</strong> ({patient.vid})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Basic Identity &amp; Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Title</label>
                <select
                  value={formData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="Mrs.">Mrs.</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  First / Given Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Surname</label>
                <input
                  type="text"
                  value={formData.surname || ''}
                  onChange={(e) => handleChange('surname', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                <select
                  value={formData.gender || 'female'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Age (Years)</label>
                <input
                  type="number"
                  min={18}
                  max={99}
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob || ''}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Blood Group</label>
                <select
                  value={formData.blood_group || ''}
                  onChange={(e) => handleChange('blood_group', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="">— Select —</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Contact &amp; Residential Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Primary Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  value={formData.alternate_phone || ''}
                  onChange={(e) => handleChange('alternate_phone', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="vmd-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Area / Locality</label>
                <input
                  type="text"
                  value={formData.area || ''}
                  onChange={(e) => handleChange('area', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="e.g. Jubilee Hills"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">Full Postal Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="Apartment, Street, Landmark"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Clinical & Referral Attribution */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              3. Clinical Assignment &amp; Referral Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Treating Consultant</label>
                <select
                  value={formData.treating_doctor_id || ''}
                  onChange={(e) => handleChange('treating_doctor_id', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="">— Unassigned / Assign Later —</option>
                  {doctorsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} ({d.specialization || 'Doctor'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Referring Doctor / Clinic</label>
                <input
                  type="text"
                  value={formData.referring_doctor || ''}
                  onChange={(e) => handleChange('referring_doctor', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="e.g. Dr. A. Sharma"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Marketing Person / Lead</label>
                <input
                  type="text"
                  value={formData.marketing_person_name || ''}
                  onChange={(e) => handleChange('marketing_person_name', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="e.g. Field Team"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Financial Billing Type</label>
                <select
                  value={formData.financial_type || 'self_pay'}
                  onChange={(e) => handleChange('financial_type', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="self_pay">Self Pay / Out of Pocket</option>
                  <option value="insurance">TPA / Health Insurance</option>
                  <option value="corporate">Corporate Hospital Agreement</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Marital Status</label>
                <select
                  value={formData.marital_status || 'married'}
                  onChange={(e) => handleChange('marital_status', e.target.value)}
                  className="vmd-input text-xs"
                >
                  <option value="married">Married</option>
                  <option value="single">Single</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ABHA Health ID</label>
                <input
                  type="text"
                  value={formData.abha_number || ''}
                  onChange={(e) => handleChange('abha_number', e.target.value)}
                  className="vmd-input text-xs"
                  placeholder="14-digit ABHA Number"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
