'use client';

import React from 'react';
import { Scissors, ArrowLeft, Save, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import OTTimelineSection from './OTTimelineSection';
import OTStaffFormSection from './OTStaffFormSection';
import OTGuestSurgeonsSection from './OTGuestSurgeonsSection';
import OTClinicalNotesSection from './OTClinicalNotesSection';
import OTPricingSection from './OTPricingSection';
import { useOTRecordForm } from './useOTRecordForm';
import type { OTRecord } from './types';

interface OTRecordFormProps {
  admissionId: string;
  initialRecord?: OTRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OTRecordForm({
  admissionId,
  initialRecord,
  onSuccess,
  onCancel,
}: OTRecordFormProps) {
  const form = useOTRecordForm({ admissionId, initialRecord, onSuccess });

  return (
    <Card className="border-slate-200 shadow-sm animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <CardHeader className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex flex-row items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-8 gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Records</span>
            </Button>
          )}
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Scissors className="w-4 h-4" />
            </span>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                {initialRecord ? `Edit OT Record: ${form.procedureName || 'Surgery'}` : 'Schedule / Document OT Surgery'}
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                In-window surgical charting: team, wheel times, operative findings, and fee tariffs
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="h-8 text-xs font-semibold border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={form.saveMutation.isPending}
            onClick={() => form.handleSubmit()}
            className="h-8 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{form.saveMutation.isPending ? 'Saving Record...' : initialRecord ? 'Save Changes' : 'Schedule Surgery'}</span>
          </Button>
        </div>
      </CardHeader>

      {/* 2. Main In-Window Form Body */}
      <CardContent className="p-5 space-y-5 text-xs">
        <form onSubmit={form.handleSubmit} className="space-y-5">
          {/* Section A: Surgery Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">
                Procedure / Surgery Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={form.procedureName}
                onChange={(e) => form.setProcedureName(e.target.value)}
                placeholder="e.g. Laparoscopic Ovarian Cystectomy, Oocyte Retrieval (OPU)..."
                className="h-8 text-xs bg-white font-semibold"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase text-[10px] block mb-1">Surgery Grade</label>
              <select
                value={form.surgeryCategory}
                onChange={(e) => form.setSurgeryCategory(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Minor">Minor Procedure</option>
                <option value="Daycare">Daycare Surgery</option>
                <option value="Major">Major Surgery</option>
                <option value="Super-Major">Super-Major Surgery</option>
              </select>
            </div>
          </div>

          {/* Section B: Wheel Times & OT Timeline */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>OT Table Timeline &amp; Status</span>
            </h4>
            <OTTimelineSection
              otStatus={form.otStatus}
              setOtStatus={form.setOtStatus}
              wheelInTime={form.wheelInTime}
              wheelOutTime={form.wheelOutTime}
              totalHours={form.totalHours}
              setTotalHours={form.setTotalHours}
              onWheelTimeChange={form.handleWheelTimeChange}
            />
          </div>

          {/* Section C: Surgical Team */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Internal Surgical Team &amp; Anesthesia
            </h4>
            <OTStaffFormSection
              doctors={form.doctors}
              nurses={form.nurses}
              primarySurgeonId={form.primarySurgeonId}
              setPrimarySurgeonId={form.setPrimarySurgeonId}
              assistantSurgeonId={form.assistantSurgeonId}
              setAssistantSurgeonId={form.setAssistantSurgeonId}
              assistantSurgeonName={form.assistantSurgeonName}
              setAssistantSurgeonName={form.setAssistantSurgeonName}
              anesthetistId={form.anesthetistId}
              setAnesthetistId={form.setAnesthetistId}
              anesthetistName={form.anesthetistName}
              setAnesthetistName={form.setAnesthetistName}
              scrubNurseId={form.scrubNurseId}
              setScrubNurseId={form.setScrubNurseId}
              circulatingNurseId={form.circulatingNurseId}
              setCirculatingNurseId={form.setCirculatingNurseId}
              anesthesiaType={form.anesthesiaType}
              setAnesthesiaType={form.setAnesthesiaType}
            />
          </div>

          {/* Section D: Visiting External Surgeons */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <OTGuestSurgeonsSection guestSurgeons={form.guestSurgeons} setGuestSurgeons={form.setGuestSurgeons} />
          </div>

          {/* Section E: Operative Notes & Templates */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <OTClinicalNotesSection
              preOpDiagnosis={form.preOpDiagnosis}
              setPreOpDiagnosis={form.setPreOpDiagnosis}
              postOpDiagnosis={form.postOpDiagnosis}
              setPostOpDiagnosis={form.setPostOpDiagnosis}
              operativeNotes={form.operativeNotes}
              setOperativeNotes={form.setOperativeNotes}
              postOpOrders={form.postOpOrders}
              setPostOpOrders={form.setPostOpOrders}
            />
          </div>

          {/* Section F: Fee Tariffs & Billing Presets */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <OTPricingSection
              hourlyRate={form.hourlyRate}
              setHourlyRate={form.setHourlyRate}
              procedureFee={form.procedureFee}
              setProcedureFee={form.setProcedureFee}
              surgeonFee={form.surgeonFee}
              setSurgeonFee={form.setSurgeonFee}
              anesthesiaFee={form.anesthesiaFee}
              setAnesthesiaFee={form.setAnesthesiaFee}
              totalHours={form.totalHours}
              guestSurgeonsFee={form.guestSurgeonsFee}
            />
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={form.saveMutation.isPending}
              className="h-9 px-5 text-xs font-bold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{form.saveMutation.isPending ? 'Saving Record...' : initialRecord ? 'Save Changes' : 'Schedule Surgery'}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
