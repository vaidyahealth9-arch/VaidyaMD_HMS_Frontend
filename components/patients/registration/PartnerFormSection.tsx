import React from 'react';
import { User } from 'lucide-react';
import { PartnerRegistrationFormState, BLOOD_GROUPS } from './types';

interface PartnerFormSectionProps {
  partnerForm: PartnerRegistrationFormState;
  updatePartner: (field: string, value: any) => void;
}

export default function PartnerFormSection({
  partnerForm,
  updatePartner,
}: PartnerFormSectionProps) {
  return (
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
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
