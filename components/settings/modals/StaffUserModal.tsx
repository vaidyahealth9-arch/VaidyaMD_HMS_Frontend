'use client';

import React, { useState, useMemo } from 'react';
import { X, Lock, ShieldCheck, Check, Plus, Building2, Stethoscope, Sparkles } from 'lucide-react';
import { CLINICAL_DEPARTMENTS } from '../types';

interface StaffUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingStaffUser: any;
  staffForm: any;
  setStaffForm: React.Dispatch<React.SetStateAction<any>>;
  hospitalBranches: any[];
  onSubmit: (e: React.FormEvent) => void;
}

export default function StaffUserModal({
  isOpen,
  onClose,
  editingStaffUser,
  staffForm,
  setStaffForm,
  hospitalBranches,
  onSubmit,
}: StaffUserModalProps) {
  const [customDeptInput, setCustomDeptInput] = useState('');

  // Normalize departments as string[]
  const currentDepts: string[] = useMemo(() => {
    if (Array.isArray(staffForm.departments)) {
      return staffForm.departments;
    }
    if (typeof staffForm.departments === 'string' && staffForm.departments.trim()) {
      return staffForm.departments.split(',').map((d: string) => d.trim()).filter(Boolean);
    }
    return [];
  }, [staffForm.departments]);

  if (!isOpen) return null;

  const isDoctorUser = Boolean(staffForm.is_doctor || staffForm.role === 'doctor');

  const toggleDepartment = (deptName: string) => {
    let updated: string[];
    if (currentDepts.some((d) => d.toLowerCase() === deptName.toLowerCase())) {
      updated = currentDepts.filter((d) => d.toLowerCase() !== deptName.toLowerCase());
    } else {
      updated = [...currentDepts, deptName];
    }
    setStaffForm({ ...staffForm, departments: updated });
  };

  const setAsPrimary = (deptName: string) => {
    const existing = currentDepts.find((d) => d.toLowerCase() === deptName.toLowerCase()) || deptName;
    const rest = currentDepts.filter((d) => d.toLowerCase() !== deptName.toLowerCase());
    setStaffForm({ ...staffForm, departments: [existing, ...rest] });
  };

  const addCustomDepartment = () => {
    const trimmed = customDeptInput.trim();
    if (trimmed && !currentDepts.some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      setStaffForm({ ...staffForm, departments: [...currentDepts, trimmed] });
      setCustomDeptInput('');
    }
  };

  const handleRoleChange = (newRole: string) => {
    const willBeDoctor = newRole === 'doctor' ? true : staffForm.is_doctor;
    let nextDepts = currentDepts;
    if (newRole === 'doctor' && currentDepts.length === 0) {
      nextDepts = ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)'];
    }
    setStaffForm({
      ...staffForm,
      role: newRole,
      is_doctor: willBeDoctor,
      departments: nextDepts,
    });
  };

  const handleDoctorPrivilegeToggle = (checked: boolean) => {
    let nextDepts = currentDepts;
    if (checked && currentDepts.length === 0) {
      nextDepts = ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)'];
    }
    setStaffForm({
      ...staffForm,
      is_doctor: checked,
      departments: nextDepts,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              {editingStaffUser ? 'Edit Staff User & Credentials' : 'Add New Staff User'}
              {isDoctorUser && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  Doctor Profile
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure credentials, clinical roles, branch access, and department assignments.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                placeholder="e.g. Dr. Pooja Papishetty"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Corporate Email Address *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="doctor@hospital.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Section 2: Password & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {editingStaffUser ? 'New Password (Leave blank to keep current)' : 'Temporary Password *'}
              </label>
              <input
                type="password"
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden font-mono"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Branch Facility</label>
              <select
                value={staffForm.branch_id}
                onChange={(e) => setStaffForm({ ...staffForm, branch_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              >
                <option value="">Main Facility (All Branches)</option>
                {hospitalBranches.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.name} {br.code ? `(${br.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: Role, Registration, Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Role *</label>
              <select
                value={staffForm.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              >
                <option value="doctor">Doctor / Treating Consultant</option>
                <option value="embryologist">Embryologist</option>
                <option value="andrologist">Andrologist</option>
                <option value="nurse">Nurse / Coordinator</option>
                <option value="scanning">Ultrasonologist / Sonography</option>
                <option value="pharma">Pharmacist</option>
                <option value="receptionist">Receptionist</option>
                <option value="counsellor">Counsellor</option>
                <option value="manager">Manager</option>
                <option value="accounts">Accounts & Billing</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">NMC / State Reg No.</label>
              <input
                type="text"
                value={staffForm.reg_number}
                onChange={(e) => setStaffForm({ ...staffForm, reg_number: e.target.value })}
                placeholder="TSMC/FMR/10576"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-[11px] focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="+91-9876543210"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Section 4: Specialization & Qualifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Clinical Specialization</label>
              <input
                type="text"
                value={staffForm.specialization}
                onChange={(e) => setStaffForm({ ...staffForm, specialization: e.target.value })}
                placeholder="e.g. Reproductive Medicine & Laparoscopy"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Degrees & Qualifications</label>
              <input
                type="text"
                value={staffForm.qualification}
                onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                placeholder="e.g. MBBS, MS (OBG), DRM, FRM"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Section 5: CLINICAL DEPARTMENT CONFIGURATION (Highlight for Doctors) */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isDoctorUser
                ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                : 'bg-slate-50/70 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <div className="flex items-center gap-2">
                {isDoctorUser ? (
                  <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  Clinical Department(s)
                  {isDoctorUser && <span className="text-red-500 font-bold">*</span>}
                </label>
                {isDoctorUser ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    Treating Doctor Assignment
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-200/80 text-slate-600 rounded-full">
                    Department Station
                  </span>
                )}
              </div>

              {currentDepts.length > 0 && (
                <div className="text-[11px] text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                  <span className="text-amber-500 font-bold">★ Primary:</span>
                  <span className="font-semibold text-blue-700">{currentDepts[0]}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mb-2.5">
              {isDoctorUser
                ? 'Assign the clinical departments where this doctor practices. The first department selected is set as the Primary Department for appointment scheduling, OPD routing, and clinical documentation.'
                : 'Designate department affiliations for this staff member (e.g., OPD, IPD, Lab).'}
            </p>

            {/* Active Selected Department Tags with Primary marker */}
            {currentDepts.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5 p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                  Assigned:
                </span>
                {currentDepts.map((dept, idx) => (
                  <span
                    key={dept}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      idx === 0
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx === 0 ? (
                      <span className="text-amber-300 text-[10px] font-bold" title="Primary Department">
                        ★ Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(dept)}
                        className="text-[9px] uppercase tracking-wider text-slate-500 hover:text-blue-700 font-bold mr-0.5 underline"
                        title="Set as primary department for appointments and OPD"
                      >
                        Set Primary
                      </button>
                    )}
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`ml-1 rounded-full p-0.5 ${
                        idx === 0 ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                      }`}
                      title="Remove department"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="mb-2.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center justify-between">
                <span>
                  {isDoctorUser
                    ? '⚠️ No department selected. Please choose at least one department for this doctor.'
                    : 'No department assigned yet.'}
                </span>
                {isDoctorUser && (
                  <button
                    type="button"
                    onClick={() =>
                      setStaffForm({
                        ...staffForm,
                        departments: ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)'],
                      })
                    }
                    className="text-[10px] font-bold text-blue-700 hover:underline bg-white px-2 py-0.5 rounded border border-blue-200"
                  >
                    + Apply Default (Fertility + OPD)
                  </button>
                )}
              </div>
            )}

            {/* Quick Toggle Department Chips */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                <span>Standard Hospital Departments:</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">click to toggle</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CLINICAL_DEPARTMENTS.map((dept) => {
                  const isSelected = currentDepts.some(
                    (d) =>
                      d.toLowerCase() === dept.name.toLowerCase() ||
                      d.toLowerCase() === dept.short.toLowerCase()
                  );
                  const isPrimary =
                    isSelected &&
                    (currentDepts[0]?.toLowerCase() === dept.name.toLowerCase() ||
                      currentDepts[0]?.toLowerCase() === dept.short.toLowerCase());

                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => {
                        const matchedExisting = currentDepts.find(
                          (d) =>
                            d.toLowerCase() === dept.name.toLowerCase() ||
                            d.toLowerCase() === dept.short.toLowerCase()
                        );
                        toggleDepartment(matchedExisting || dept.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 border ${
                        isPrimary
                          ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-xs'
                          : isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                      title={dept.desc}
                    >
                      {isPrimary ? (
                        <span className="text-[10px] text-amber-300 font-bold">★</span>
                      ) : isSelected ? (
                        <Check className="w-3 h-3 text-blue-600" />
                      ) : (
                        <Plus className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{dept.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Department Tag Adder */}
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-200">
              <input
                type="text"
                placeholder="Or enter a custom department name (e.g. Endocrinology, Urology, Genetics)..."
                value={customDeptInput}
                onChange={(e) => setCustomDeptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomDepartment();
                  }
                }}
                className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
              <button
                type="button"
                onClick={addCustomDepartment}
                disabled={!customDeptInput.trim()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors"
              >
                + Add Custom
              </button>
            </div>
          </div>

          {/* Section 6: Privileges & Active Status */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={staffForm.is_doctor}
                onChange={(e) => handleDoctorPrivilegeToggle(e.target.checked)}
                className="rounded text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-semibold text-slate-800">
                Treating Doctor Privileges (Eligible for Consultations & EMR)
              </span>
            </label>

            {staffForm.role !== 'admin' && staffForm.role !== 'ADMIN' ? (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={staffForm.is_active}
                  onChange={(e) => setStaffForm({ ...staffForm, is_active: e.target.checked })}
                  className="rounded text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Account Active</span>
              </label>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Administrator accounts are permanently active</span>
              </div>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm transition-colors"
            >
              {editingStaffUser ? 'Save Staff Changes' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

