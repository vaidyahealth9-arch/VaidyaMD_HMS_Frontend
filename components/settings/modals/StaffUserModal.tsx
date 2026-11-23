'use client';

import React, { useState, useMemo } from 'react';
import { X, Lock, ShieldCheck, Check, Plus, Building2, Stethoscope, Sparkles, IndianRupee } from 'lucide-react';
import { CLINICAL_DEPARTMENTS, VAIDYAMD_ROLES } from '../types';

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
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
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
              <label className="block text-slate-700 font-semibold mb-1">Email (Login Username) *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="pooja@vaidyamd.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Section 2: Contact & Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                {editingStaffUser ? 'New Password (Optional)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!editingStaffUser}
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                placeholder={editingStaffUser ? 'Leave blank to keep current' : '••••••••'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">System Role *</label>
              <select
                value={staffForm.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                {VAIDYAMD_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Branch</label>
              <select
                value={staffForm.branch_id}
                onChange={(e) => setStaffForm({ ...staffForm, branch_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden bg-white"
              >
                <option value="">All Branches / Central</option>
                {hospitalBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div>
              <label className="block text-slate-700 font-semibold mb-1">NMC / State Medical Council Reg No.</label>
              <input
                type="text"
                value={staffForm.reg_number}
                onChange={(e) => setStaffForm({ ...staffForm, reg_number: e.target.value })}
                placeholder="TSMC/FMR/10576"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>
          </div>

          {/* Section 3: Doctor Privileges Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                Treating Doctor / Consultant Privileges
              </span>
              <p className="text-[11px] text-slate-500">
                Enables this user to be assigned to patients, treatment cycles, OPD queues, and clinical notes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={staffForm.is_doctor}
                onChange={(e) => setStaffForm({ ...staffForm, is_doctor: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Section 4: Specialization & Qualifications & Doctor Master Consultation Fee */}
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

            {isDoctorUser && (
              <div className="sm:col-span-2 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-slate-900 font-bold text-xs flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                    Doctor OPD Consultation Fee (₹)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Master consultation amount auto-populated during registration, queue check-in, and appointments.
                  </p>
                </div>
                <div className="relative w-full sm:w-44">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={staffForm.consultation_fee ?? 500}
                    onChange={(e) => setStaffForm({ ...staffForm, consultation_fee: Number(e.target.value) })}
                    placeholder="500"
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-bold text-slate-900 text-xs shadow-2xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Clinical Departments */}
          <div className="p-3.5 rounded-xl border bg-slate-50 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-600" />
                Clinical Department(s)
              </label>
              <span className="text-[10px] text-slate-400">{currentDepts.length} Assigned</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CLINICAL_DEPARTMENTS.map((dept) => {
                const isSelected = currentDepts.some((d) => d.toLowerCase() === dept.name.toLowerCase());
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => toggleDepartment(dept.name)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                    <span>{dept.short || dept.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-bold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
            >
              {editingStaffUser ? 'Update Staff Member' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
