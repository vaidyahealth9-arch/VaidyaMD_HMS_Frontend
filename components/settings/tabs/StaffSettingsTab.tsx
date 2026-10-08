'use client';

import React, { useState, useMemo } from 'react';
import { authApi } from '@/lib/api';
import {
  Search,
  Plus,
  Users,
  ShieldCheck,
  Check,
  AlertTriangle,
  KeyRound,
  Stethoscope,
  Building2,
  Building,
  Filter,
} from 'lucide-react';
import StaffUserModal from '../modals/StaffUserModal';
import { CLINICAL_DEPARTMENTS } from '../types';

interface StaffSettingsTabProps {
  staffUsers: any[];
  setStaffUsers: React.Dispatch<React.SetStateAction<any[]>>;
  hospitalBranches: any[];
}

export default function StaffSettingsTab({
  staffUsers,
  setStaffUsers,
  hospitalBranches,
}: StaffSettingsTabProps) {
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffDeptFilter, setStaffDeptFilter] = useState('all');
  const [staffBranchFilter, setStaffBranchFilter] = useState('all');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaffUser, setEditingStaffUser] = useState<any>(null);
  const [staffForm, setStaffForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    is_doctor: boolean;
    branch_id: string;
    specialization: string;
    qualification: string;
    reg_number: string;
    phone: string;
    departments: string[];
    is_active: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'doctor',
    is_doctor: true,
    branch_id: '',
    specialization: '',
    qualification: '',
    reg_number: '',
    phone: '',
    departments: ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)'],
    is_active: true,
  });

  // Unique departments for filter dropdown
  const availableDepartments = useMemo(() => {
    const deptsSet = new Set<string>();
    // Collect from standard departments
    CLINICAL_DEPARTMENTS.forEach((d) => deptsSet.add(d.name));
    // Collect from actual users
    staffUsers.forEach((u) => {
      if (Array.isArray(u.departments)) {
        u.departments.forEach((d: string) => d && deptsSet.add(d.trim()));
      } else if (typeof u.departments === 'string' && u.departments.trim()) {
        u.departments.split(',').forEach((d: string) => d.trim() && deptsSet.add(d.trim()));
      }
    });
    return Array.from(deptsSet).filter(Boolean).sort();
  }, [staffUsers]);

  // KPI Metrics
  const doctorCount = useMemo(
    () => staffUsers.filter((u) => u.is_doctor || u.role === 'doctor').length,
    [staffUsers]
  );
  const activeUserCount = useMemo(
    () => staffUsers.filter((u) => u.is_active !== false).length,
    [staffUsers]
  );
  const activeDepartmentsCount = useMemo(() => {
    const activeDepts = new Set<string>();
    staffUsers.forEach((u) => {
      if (Array.isArray(u.departments)) {
        u.departments.forEach((d: string) => d && activeDepts.add(d.trim().toLowerCase()));
      } else if (typeof u.departments === 'string' && u.departments.trim()) {
        u.departments.split(',').forEach((d: string) => d.trim() && activeDepts.add(d.trim().toLowerCase()));
      }
    });
    return activeDepts.size;
  }, [staffUsers]);

  const handleSaveStaffUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const deptsArray = Array.isArray(staffForm.departments)
        ? staffForm.departments.map((d) => String(d).trim()).filter(Boolean)
        : typeof staffForm.departments === 'string'
        ? (staffForm.departments as string).split(',').map((d) => d.trim()).filter(Boolean)
        : [];

      // Validate doctor department requirement
      if ((staffForm.is_doctor || staffForm.role === 'doctor') && deptsArray.length === 0) {
        alert('Please assign at least one Clinical Department for doctor users (e.g. Fertility, OPD).');
        return;
      }

      const isAdminRole = staffForm.role === 'admin' || staffForm.role === 'ADMIN';
      const effectiveIsActive = isAdminRole ? true : staffForm.is_active;

      if (editingStaffUser) {
        await authApi.adminUpdateUser(editingStaffUser.id, {
          name: staffForm.name,
          email: staffForm.email,
          role: staffForm.role,
          is_doctor: staffForm.is_doctor,
          branch_id: staffForm.branch_id || null,
          specialization: staffForm.specialization,
          qualification: staffForm.qualification,
          reg_number: staffForm.reg_number,
          phone: staffForm.phone,
          departments: deptsArray,
          is_active: effectiveIsActive,
          ...(staffForm.password ? { password: staffForm.password } : {}),
        });
        alert('Staff user updated successfully!');
      } else {
        if (!staffForm.password) {
          alert('Temporary password is required to create a new staff account.');
          return;
        }
        await authApi.createUser({
          name: staffForm.name,
          email: staffForm.email,
          password: staffForm.password,
          role: staffForm.role,
          is_doctor: staffForm.is_doctor,
          branch_id: staffForm.branch_id || null,
          specialization: staffForm.specialization,
          qualification: staffForm.qualification,
          reg_number: staffForm.reg_number,
          phone: staffForm.phone,
          departments: deptsArray,
        });
        alert('Staff user created successfully!');
      }
      setShowAddStaffModal(false);
      setShowEditStaffModal(false);
      authApi.listUsers({ include_inactive: true }).then((res: any) => setStaffUsers(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Error saving staff user');
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Staff</div>
              <div className="text-xl font-bold text-slate-900">{staffUsers.length}</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Treating Doctors</div>
              <div className="text-xl font-bold text-emerald-700">{doctorCount}</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Departments</div>
              <div className="text-xl font-bold text-indigo-700">{activeDepartmentsCount} active</div>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Branches</div>
              <div className="text-xl font-bold text-slate-900">{hospitalBranches.length || 1}</div>
            </div>
          </div>
        </div>

        {/* Filter & Action Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff, email, reg no, department..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              />
            </div>

            {/* Role Filter */}
            <select
              value={staffRoleFilter}
              onChange={(e) => setStaffRoleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors only</option>
              <option value="embryologist">Embryologists</option>
              <option value="andrologist">Andrologists</option>
              <option value="nurse">Nurses</option>
              <option value="scanning">Ultrasonologists</option>
              <option value="pharma">Pharmacists</option>
              <option value="receptionist">Receptionists</option>
              <option value="counsellor">Counsellors</option>
              <option value="manager">Managers</option>
              <option value="accounts">Accounts</option>
              <option value="admin">Administrators</option>
            </select>

            {/* Department Filter */}
            <select
              value={staffDeptFilter}
              onChange={(e) => setStaffDeptFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-hidden max-w-[200px]"
            >
              <option value="all">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            {hospitalBranches.length > 0 && (
              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-hidden"
              >
                <option value="all">All Branches</option>
                {hospitalBranches.map((br) => (
                  <option key={br.id} value={br.id}>
                    {br.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => {
              setEditingStaffUser(null);
              setStaffForm({
                name: '',
                email: '',
                password: '',
                role: 'doctor',
                is_doctor: true,
                branch_id: hospitalBranches[0]?.id || '',
                specialization: 'Reproductive Medicine & Infertility',
                qualification: 'MBBS, MS (OBG), DRM',
                reg_number: '',
                phone: '',
                departments: ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)'],
                is_active: true,
              });
              setShowAddStaffModal(true);
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Staff User
          </button>
        </div>

        {/* Staff Roster Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Role & Privileges</th>
                  <th className="py-3 px-3">Clinical Department(s)</th>
                  <th className="py-3 px-3">Specialization & Qualifications</th>
                  <th className="py-3 px-3">Registration No.</th>
                  <th className="py-3 px-3">Branch Location</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffUsers
                  .filter((u) => {
                    const q = staffSearch.toLowerCase();
                    const deptsList = Array.isArray(u.departments)
                      ? u.departments
                      : typeof u.departments === 'string' && u.departments
                      ? u.departments.split(',').map((d: string) => d.trim())
                      : [];

                    const matchesSearch =
                      !q ||
                      u.name?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.reg_number?.toLowerCase().includes(q) ||
                      u.specialization?.toLowerCase().includes(q) ||
                      deptsList.some((d: string) => d.toLowerCase().includes(q));

                    const matchesRole =
                      staffRoleFilter === 'all' ||
                      (staffRoleFilter === 'doctor'
                        ? u.is_doctor || u.role?.toLowerCase() === 'doctor'
                        : u.role?.toLowerCase() === staffRoleFilter.toLowerCase());

                    const matchesDept =
                      staffDeptFilter === 'all' ||
                      deptsList.some((d: string) => d.toLowerCase() === staffDeptFilter.toLowerCase());

                    const matchesBranch =
                      staffBranchFilter === 'all' || u.branch_id === staffBranchFilter;

                    return matchesSearch && matchesRole && matchesDept && matchesBranch;
                  })
                  .map((userItem) => {
                    const deptsList: string[] = Array.isArray(userItem.departments)
                      ? userItem.departments
                      : typeof userItem.departments === 'string' && userItem.departments
                      ? userItem.departments.split(',').map((d: string) => d.trim()).filter(Boolean)
                      : [];

                    const isDoctor = Boolean(userItem.is_doctor || userItem.role === 'doctor');

                    return (
                      <tr key={userItem.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Staff Member */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            {isDoctor && <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            <span>{userItem.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{userItem.email}</div>
                          {userItem.phone && (
                            <div className="text-[10px] text-slate-400">{userItem.phone}</div>
                          )}
                        </td>

                        {/* 2. Role & Privileges */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 text-slate-700">
                              {userItem.role}
                            </span>
                            {userItem.is_doctor && (
                              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                Specialist MD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Clinical Department(s) */}
                        <td className="py-3 px-3">
                          {deptsList.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                              {deptsList.map((dept, idx) => (
                                <span
                                  key={idx}
                                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${
                                    idx === 0
                                      ? 'bg-blue-50 text-blue-800 border-blue-200 font-semibold shadow-2xs'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                  title={idx === 0 ? 'Primary Department' : undefined}
                                >
                                  {idx === 0 && <span className="mr-0.5 text-amber-500 font-bold">★</span>}
                                  {dept}
                                </span>
                              ))}
                            </div>
                          ) : isDoctor ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              No Dept Set
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>

                        {/* 4. Specialization & Qualifications */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">
                            {userItem.specialization || (isDoctor ? 'Treating Consultant' : 'Clinical Staff')}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {userItem.qualification || '---'}
                          </div>
                        </td>

                        {/* 5. Registration No. */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {userItem.reg_number || 'N/A'}
                        </td>

                        {/* 6. Branch Location */}
                        <td className="py-3 px-3 text-slate-600">
                          {hospitalBranches.find((b) => b.id === userItem.branch_id)?.name || 'Main Facility'}
                        </td>

                        {/* 7. Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              userItem.role === 'admin'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : userItem.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {userItem.role === 'admin' ? 'Permanent Active' : userItem.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingStaffUser(userItem);
                              setStaffForm({
                                name: userItem.name,
                                email: userItem.email,
                                password: '',
                                role: userItem.role,
                                is_doctor: Boolean(userItem.is_doctor),
                                branch_id: userItem.branch_id || '',
                                specialization: userItem.specialization || '',
                                qualification: userItem.qualification || '',
                                reg_number: userItem.reg_number || '',
                                phone: userItem.phone || '',
                                departments: deptsList.length > 0
                                  ? deptsList
                                  : isDoctor
                                  ? ['Reproductive Medicine & Infertility', 'Outpatient Department (OPD)']
                                  : [],
                                is_active: userItem.is_active,
                              });
                              setShowEditStaffModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-md shadow-xs transition-colors"
                          >
                            Edit / Credentials
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <StaffUserModal
        isOpen={showAddStaffModal || showEditStaffModal}
        onClose={() => {
          setShowAddStaffModal(false);
          setShowEditStaffModal(false);
        }}
        editingStaffUser={editingStaffUser}
        staffForm={staffForm}
        setStaffForm={setStaffForm}
        hospitalBranches={hospitalBranches}
        onSubmit={handleSaveStaffUser}
      />
    </>
  );
}

