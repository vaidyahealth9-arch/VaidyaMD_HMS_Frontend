import React from 'react';
import { Search } from 'lucide-react';

interface PatientFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  gender: string;
  onGenderChange: (v: string) => void;
  referredByType: string;
  onReferredByTypeChange: (v: string) => void;
  area: string;
  onAreaChange: (v: string) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
}

export default function PatientFilterBar({
  search,
  onSearchChange,
  gender,
  onGenderChange,
  referredByType,
  onReferredByTypeChange,
  area,
  onAreaChange,
  startDate,
  onStartDateChange,
}: PatientFilterBarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
      <div className="lg:col-span-2 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, VID, or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-md pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
        />
      </div>
      <div>
        <select
          value={gender}
          onChange={(e) => onGenderChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
        >
          <option value="">All Genders</option>
          <option value="female">Female ♀</option>
          <option value="male">Male ♂</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <select
          value={referredByType}
          onChange={(e) => onReferredByTypeChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
        >
          <option value="">All Referrals</option>
          <option value="doctor">Referring Doctor</option>
          <option value="marketing_person">Marketing Camp</option>
          <option value="walk_in">Walk-in</option>
          <option value="online">Online</option>
        </select>
      </div>
      <div>
        <input
          type="text"
          placeholder="Filter by Area / City..."
          value={area}
          onChange={(e) => onAreaChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
        />
      </div>
      <div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
          title="Start Date"
        />
      </div>
    </div>
  );
}
