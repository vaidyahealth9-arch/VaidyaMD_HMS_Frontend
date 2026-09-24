'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  User,
  Plus,
  X,
  Camera,
  UserCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Stethoscope,
  CreditCard,
  Barcode,
} from 'lucide-react';

interface PatientHeaderProps {
  patient: any;
  partner?: any;
  activeCycle?: any;
  viewMode: 'couple' | 'individual';
  setViewMode: (mode: 'couple' | 'individual') => void;
  isHeaderExpanded: boolean;
  setIsHeaderExpanded: (expanded: boolean) => void;
  isUploadingPhoto: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditPatient: () => void;
  onEditAlerts: () => void;
  onLinkPartner: () => void;
  onUnlinkPartner: () => void;
  onSendToOPD: () => void;
  onOpenBarcodeModal: () => void;
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  tabs: Array<{ id: string; label: string; icon: any }>;
  formatDate: (dateStr: string) => string;
}

export default function PatientHeader({
  patient,
  partner,
  activeCycle,
  viewMode,
  setViewMode,
  isHeaderExpanded,
  setIsHeaderExpanded,
  isUploadingPhoto,
  onPhotoUpload,
  onEditPatient,
  onEditAlerts,
  onLinkPartner,
  onUnlinkPartner,
  onSendToOPD,
  onOpenBarcodeModal,
  activeTab,
  onSelectTab,
  tabs,
  formatDate,
}: PatientHeaderProps) {
  const hasPartner = !!partner;
  const femalePartner = patient?.gender === 'female' ? patient : partner;
  const malePartner = patient?.gender === 'male' ? patient : partner;

  const currentTabs = tabs.filter((t) => {
    if (t.id === 'andrology') {
      return patient?.gender?.toLowerCase() === 'male' || hasPartner;
    }
    return true;
  }).map((t) => {
    if (t.id === 'overview') {
      return hasPartner
        ? { ...t, label: 'Couple 360', icon: Users }
        : { ...t, label: 'Patient 360', icon: Users };
    }
    return t;
  });

  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm -mx-3 sm:-mx-6 -mt-6 px-4 sm:px-6 py-2.5 space-y-2">
      {/* Row 1: Compact Summary Bar (Default Collapsed View) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Left: Patient Name, Color-coded Gender, VID & Quick Stats */}
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
          {patient?.photo_url ? (
            <img
              src={patient.photo_url}
              alt={patient.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-300 shadow-2xs flex-shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-md bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] font-bold flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 leading-none truncate">
                {viewMode === 'couple' ? (
                  <>
                    {patient?.name}
                    {hasPartner && <span className="text-slate-400 font-normal"> &amp; </span>}
                    {hasPartner && <span className="text-slate-800">{partner?.name}</span>}
                  </>
                ) : (
                  <span>{patient?.name}</span>
                )}
              </h1>
              <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                {patient?.vid}
              </span>

              {/* Color Coded Female Partner Badge */}
              {femalePartner && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-full">
                  <span className="text-rose-600 font-black text-sm leading-none">♀</span>
                  <span>{femalePartner.age ? `${femalePartner.age}y` : ''} · {femalePartner.blood_group || '—'}</span>
                </span>
              )}

              {/* Color Coded Male Partner Badge */}
              {hasPartner && malePartner && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                  <span className="text-sky-600 font-black text-sm leading-none">♂</span>
                  <span>{malePartner.age ? `${malePartner.age}y` : ''} · {malePartner.blood_group || '—'}</span>
                </span>
              )}

              {!hasPartner && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  Individual Patient
                </span>
              )}

              {patient?.phone && (
                <span className="text-xs text-slate-500 font-mono hidden lg:inline">
                  📞 {patient.phone}
                </span>
              )}

              {patient?.treating_doctor_name && (
                <span className="text-xs text-slate-500 hidden xl:inline">
                  Doctor: <strong className="text-slate-700">{patient.treating_doctor_name}</strong>
                </span>
              )}

              <button
                type="button"
                onClick={onEditAlerts}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  patient?.alert_notes?.length > 0
                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300'
                }`}
                title="Click to edit clinical alerts & allergies"
              >
                <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
                {patient?.alert_notes?.length > 0 ? `${patient.alert_notes.length} Alerts (Edit)` : '+ Alert'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Actions & Collapse/Expand Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center flex-wrap">
          {/* View Mode: Couple View vs Individual View Option */}
          {hasPartner && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('couple')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'couple'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View combined Couple 360 overview"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Couple View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('individual')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'individual'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View individual patient record"
              >
                <User className="w-3.5 h-3.5" />
                <span>Individual View</span>
              </button>
            </div>
          )}

          {/* Jump to Partner's Chart */}
          {hasPartner && partner && (
            <Link
              href={`/patients/${partner.id}`}
              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title={`Open ${partner.name}'s individual medical record`}
            >
              <span>Switch to {partner.name} →</span>
            </Link>
          )}

          {/* Unlink Partner Button */}
          {hasPartner && partner && (
            <button
              type="button"
              onClick={onUnlinkPartner}
              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Unlink partner and make both records separate"
            >
              <X className="w-3 h-3" />
              <span>Unlink</span>
            </button>
          )}

          {/* Link Partner Button (When Single / Unlinked) */}
          {!hasPartner && (
            <button
              type="button"
              onClick={onLinkPartner}
              className="px-2.5 py-1 bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              title="Link an existing patient as partner"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Partner</span>
            </button>
          )}

          {activeCycle && (
            <span className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active: {activeCycle.cycle_id}
            </span>
          )}

          <button
            type="button"
            onClick={onSendToOPD}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors shadow-2xs cursor-pointer"
            title="Add this patient to today's OPD waiting queue in Appointments"
          >
            Add to Queue
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('workbench')}
            className={`px-3 py-1.5 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'workbench'
                ? 'bg-[rgb(var(--clr-primary))] text-white'
                : 'bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.18)]'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            OPD Workbench
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('billing')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Open Fertility Advance Wallet & Financial Statement"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Wallet &amp; Billing</span>
          </button>

          {/* Barcode & Thermal Sticker Print Trigger */}
          <button
            type="button"
            onClick={onOpenBarcodeModal}
            className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-amber-300 hover:text-amber-200 border border-slate-700 font-bold text-xs rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Print Patient Barcode & Thermal Sticker Labels"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Barcode Sticker</span>
          </button>

          {/* Expand / Collapse Header Details Toggle */}
          <button
            type="button"
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors flex items-center gap-1 shadow-2xs border border-slate-200/80 cursor-pointer"
            title={isHeaderExpanded ? 'Hide expanded details' : 'Show full details & photo'}
          >
            <span>{isHeaderExpanded ? 'Hide' : 'Details'}</span>
            {isHeaderExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Row 1.5: Notice when viewing in Individual Mode */}
      {hasPartner && viewMode === 'individual' && (
        <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-text-main">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span>
              <strong>Individual Patient View:</strong> Managing <strong>{patient?.name}</strong> independently. Linked Partner: <strong>{partner?.name}</strong> ({partner?.vid}).
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('couple')}
              className="text-primary hover:underline font-bold text-xs cursor-pointer"
            >
              Switch to Couple 360 View →
            </button>
            <span className="text-slate-300">|</span>
            <Link
              href={`/patients/${partner?.id}`}
              className="text-sky-700 hover:underline font-bold text-xs cursor-pointer"
            >
              Open {partner?.name}&apos;s Chart →
            </Link>
          </div>
        </div>
      )}

      {/* Row 2: Expanded Header Details Drawer (When Opened) */}
      {isHeaderExpanded && (
        <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs animate-in fade-in slide-in-from-top-1">
          {/* Column 1: Patient Photo Preview & Upload/Change Action */}
          <div className="md:col-span-3 flex items-center gap-3 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 pr-0 md:pr-3">
            <div className="relative group flex-shrink-0">
              {patient?.photo_url ? (
                <img
                  src={patient.photo_url}
                  alt={patient?.name}
                  className="w-16 h-16 rounded-lg object-cover border border-slate-300 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold flex flex-col items-center justify-center text-xs">
                  <Camera className="w-5 h-5 text-primary mb-0.5" />
                  <span>No Photo</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <p className="font-bold text-slate-800 text-xs">Patient Photo</p>
              <p className="text-[10px] text-slate-500">Upload profile image directly</p>
              <div className="flex flex-col gap-1.5 items-start">
                <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-primary rounded text-[11px] font-bold cursor-pointer transition-colors shadow-2xs">
                  <Camera className="w-3 h-3" />
                  <span>{isUploadingPhoto ? 'Uploading...' : patient?.photo_url ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={onEditPatient}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/20 hover:bg-primary/15 text-primary rounded text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Update Patient Details</span>
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Personal & Contact Information */}
          <div className="md:col-span-5 space-y-1.5 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 pr-0 md:pr-3">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Contact &amp; Demographics</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div><span className="text-slate-400 font-medium">DOB / Age:</span> <strong className="text-slate-700">{patient?.dob || '—'} ({patient?.age || '—'}y)</strong></div>
              <div><span className="text-slate-400 font-medium">Marital Status:</span> <strong className="text-slate-700 capitalize">{patient?.marital_status || 'Married'}</strong></div>
              <div><span className="text-slate-400 font-medium">Phone:</span> <strong className="text-slate-700">{patient?.phone || '—'}</strong></div>
              <div><span className="text-slate-400 font-medium">Email:</span> <strong className="text-slate-700">{patient?.email || '—'}</strong></div>
              <div className="col-span-2">
                <span className="text-slate-400 font-medium">Address:</span> <span className="text-slate-700">{patient?.address ? `${patient.address}, ` : ''}{patient?.area || ''}{patient?.city ? `, ${patient.city}` : ''}{patient?.pincode ? ` - ${patient.pincode}` : ''}</span>
              </div>
              {patient?.emergency_contact_name && (
                <div className="col-span-2">
                  <span className="text-slate-400 font-medium">Emergency:</span> <span className="text-slate-700 font-semibold">{patient.emergency_contact_name} ({patient.emergency_contact_relation || 'Relation'}) · {patient.emergency_contact_phone || ''}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Referral & Hospital Doctor Info */}
          <div className="md:col-span-4 space-y-1.5">
            <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Hospital &amp; Referral Details</p>
            <div className="space-y-1 text-[11px]">
              <div><span className="text-slate-400 font-medium">Treating Doctor:</span> <strong className="text-slate-800">{patient?.treating_doctor_name || 'Unassigned'}</strong></div>
              <div><span className="text-slate-400 font-medium">Referring Doctor:</span> <strong className="text-slate-800">{patient?.referring_doctor || 'Direct / Walk-in'}</strong></div>
              <div><span className="text-slate-400 font-medium">Marketing Person:</span> <strong className="text-slate-800">{patient?.marketing_person_name || 'None'}</strong></div>
              <div><span className="text-slate-400 font-medium">Registered:</span> <span className="text-slate-600">{formatDate(patient?.created_at)}</span></div>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-400 font-medium">Allergies &amp; Alerts:</span>
                  <button
                    type="button"
                    onClick={onEditAlerts}
                    className="text-[10px] font-bold text-amber-800 hover:underline cursor-pointer"
                  >
                    Edit Alerts
                  </button>
                </div>
                {patient?.alert_notes?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {patient.alert_notes.map((a: string, i: number) => (
                      <span key={i} className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">No alerts recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Tab Navigation Rail */}
      <div className="flex p-0.5 bg-slate-100/90 rounded-md overflow-x-auto gap-1">
        {currentTabs.map((t) => {
          const TabIcon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
