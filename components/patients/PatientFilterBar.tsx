import React from 'react';
import { Search, Stethoscope, UserX } from 'lucide-react';

interface PatientFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  treatingDoctorId: string;
  onTreatingDoctorChange: (v: string) => void;
  doctorsList: any[];
  referredByType: string;
  onReferredByTypeChange: (v: string) => void;
  area: string;
  onAreaChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  currentUserId?: string;
  isCurrentUserDoctor?: boolean;
}

export default function PatientFilterBar({
  search,
  onSearchChange,
  gender,
  onGenderChange,
  treatingDoctorId,
  onTreatingDoctorChange,
  doctorsList,
  referredByType,
  onReferredByTypeChange,
  area,
  onAreaChange,
  startDate,
  onStartDateChange,
  currentUserId,
  isCurrentUserDoctor,
}: PatientFilterBarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, VID, or phone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))] focus:bg-white transition-colors"
          />
        </div>

        {/* Treating Doctor Filter */}
        <div className="lg:col-span-3">
          <select
            value={treatingDoctorId}
            onChange={(e) => onTreatingDoctorChange(e.target.value)}
            className={`w-full border rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))] transition-colors ${
              treatingDoctorId
                ? 'bg-primary/10 border-primary text-primary font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="">All Treating Doctors</option>
            <option value="unassigned">⚠️ Unassigned (No Doctor)</option>
            {doctorsList.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name?.startsWith('Dr.') ? d.name : `Dr. ${d.name}`} {d.specialization ? `(${d.specialization})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Gender Filter */}
        <div className="lg:col-span-2">
          <select
            value={gender}
            onChange={(e) => onGenderChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
          >
            <option value="">All Genders</option>
            <option value="female">Female ♀</option>
            <option value="male">Male ♂</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Referral Source Filter */}
        <div className="lg:col-span-3">
          <select
            value={referredByType}
            onChange={(e) => onReferredByTypeChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
          >
            <option value="">All Referral Sources</option>
            <option value="doctor">Referring Doctor / Clinic</option>
            <option value="marketing_person">Marketing Camp</option>
            <option value="walk_in">Walk-in</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Pill Buttons Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Filters:</span>
          {isCurrentUserDoctor && currentUserId && (
            <button
              type="button"
              onClick={() => onTreatingDoctorChange(treatingDoctorId === currentUserId ? '' : currentUserId)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                treatingDoctorId === currentUserId
                  ? 'bg-primary text-white shadow-2xs ring-2 ring-primary/20'
                  : 'bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>My Patients</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onTreatingDoctorChange(treatingDoctorId === 'unassigned' ? '' : 'unassigned')}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              treatingDoctorId === 'unassigned'
                ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-500/20'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Unassigned</span>
          </button>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Area / Locality..."
              value={area}
              onChange={(e) => onAreaChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 w-36 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary"
              title="Registered from"
            />
          </div>
        </div>

        {(treatingDoctorId || gender || referredByType || area || startDate || search) && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onGenderChange('');
              onTreatingDoctorChange('');
              onReferredByTypeChange('');
              onAreaChange('');
              onStartDateChange('');
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}
