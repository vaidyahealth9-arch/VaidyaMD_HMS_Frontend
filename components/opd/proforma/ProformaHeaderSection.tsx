'use client';

import React from 'react';

interface ProformaHeaderSectionProps {
  inline?: boolean;
  referredBy: string;
  setReferredBy: (v: string) => void;
  livesIn: string;
  setLivesIn: (v: string) => void;
  seenByDr: string;
  setSeenByDr: (v: string) => void;
  staffInAttendance: string;
  setStaffInAttendance: (v: string) => void;
  reasonForConsultation: string;
  setReasonForConsultation: (v: string) => void;
}

export default function ProformaHeaderSection({
  referredBy,
  setReferredBy,
  livesIn,
  setLivesIn,
  seenByDr,
  setSeenByDr,
  staffInAttendance,
  setStaffInAttendance,
  reasonForConsultation,
  setReasonForConsultation,
  inline = false,
}: ProformaHeaderSectionProps) {
  return (
    <>
      {/* Section 1: Referral & Header */}
            {!inline ? (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#2878a8] flex items-center gap-2">
                  <span>1. Referral &amp; Consultation Details</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Referred by
                    </label>
                    <input
                      type="text"
                      value={referredBy}
                      onChange={(e) => setReferredBy(e.target.value)}
                      placeholder="Doctor / Clinic name"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Lives in</label>
                    <input
                      type="text"
                      value={livesIn}
                      onChange={(e) => setLivesIn(e.target.value)}
                      placeholder="City / Region"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Seen by Dr
                    </label>
                    <input
                      type="text"
                      value={seenByDr}
                      onChange={(e) => setSeenByDr(e.target.value)}
                      placeholder="Consultant Doctor"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Staff in attendance
                    </label>
                    <input
                      type="text"
                      value={staffInAttendance}
                      onChange={(e) => setStaffInAttendance(e.target.value)}
                      placeholder="Nurse / Assistant"
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Reason for consultation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={reasonForConsultation}
                      onChange={(e) => setReasonForConsultation(e.target.value)}
                      placeholder="Primary reason for visit..."
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700">
                  Reason for Consultation / Presenting Complaint <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={reasonForConsultation}
                  onChange={(e) => setReasonForConsultation(e.target.value)}
                  placeholder="Primary reason for visit (e.g. Primary infertility for 3 years, irregular cycles)..."
                  className="vmd-input text-xs w-full"
                />
              </div>
            )}
    </>
  );
}
