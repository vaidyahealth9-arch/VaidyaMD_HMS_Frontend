'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  FileCheck,
  Lock,
} from 'lucide-react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import { andrologyApi } from '@/lib/api';

export interface DonorEmbryoTransferModalProps {
  patient: any;
  activeCycle?: any;
  onClose: () => void;
  onSaved?: () => void;
}

interface DonorEmbryoRow {
  embryoId: string;
  day: string;
  grade: string;
  pgt: string;
  vitDate: string;
  thawDateTime: string;
  survival: string;
  reexpansion: string;
  disposition: string;
}

export default function DonorEmbryoTransferModal({
  patient,
  activeCycle,
  onClose,
  onSaved,
}: DonorEmbryoTransferModalProps) {
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recipient Details
  const [recipientName, setRecipientName] = useState(patient?.name || '');
  const [recipientVid, setRecipientVid] = useState(patient?.vid || '');
  const [recipientAge, setRecipientAge] = useState(patient?.age ? String(patient.age) : '');
  const [recipientBloodGroup, setRecipientBloodGroup] = useState(patient?.blood_group || '');
  const [partnerName, setPartnerName] = useState(patient?.partner_name || activeCycle?.partner_name || '');
  const [cycleId, setCycleId] = useState(activeCycle?.cycle_id || '');
  const [consultant, setConsultant] = useState(activeCycle?.doctor_name || '');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferTime, setTransferTime] = useState('');
  const [recipientConsent, setRecipientConsent] = useState('');
  const [identityVerified, setIdentityVerified] = useState('');
  const [witnessVerified, setWitnessVerified] = useState('');
  const [indication, setIndication] = useState('');

  // Donor Traceability & Anonymity
  const [donorProgramId, setDonorProgramId] = useState('');
  const [donorCode, setDonorCode] = useState('');
  const [embryoCryoId, setEmbryoCryoId] = useState('');
  const [donorType, setDonorType] = useState('');
  const [screeningStatus, setScreeningStatus] = useState('');
  const [donorConsentStatus, setDonorConsentStatus] = useState('');
  const [recipientMatching, setRecipientMatching] = useState('');
  const [eligibilityVerifiedBy, setEligibilityVerifiedBy] = useState('');
  const [documentationRef, setDocumentationRef] = useState('');

  // Endometrial Preparation
  const [cycleType, setCycleType] = useState('HRT / Programmed FET');
  const [endometrialPrep, setEndometrialPrep] = useState('');
  const [triggerDate, setTriggerDate] = useState('');
  const [progesteroneStart, setProgesteroneStart] = useState('');
  const [progesteroneExposure, setProgesteroneExposure] = useState('');
  const [endometrialThickness, setEndometrialThickness] = useState('');
  const [endometrialPattern, setEndometrialPattern] = useState('');
  const [estradiolTransferDay, setEstradiolTransferDay] = useState('');
  const [progesteroneTransferDay, setProgesteroneTransferDay] = useState('');
  const [uterineCavity, setUterineCavity] = useState('');

  // Donor Embryos Thaw & Transfer Table
  const [embryos, setEmbryos] = useState<DonorEmbryoRow[]>([]);

  const addEmbryoRow = () => {
    setEmbryos([
      ...embryos,
      {
        embryoId: '',
        day: 'Day 5 Blastocyst',
        grade: '',
        pgt: '',
        vitDate: '',
        thawDateTime: `${new Date().toISOString().split('T')[0]}`,
        survival: '',
        reexpansion: '',
        disposition: 'Transferred',
      },
    ]);
  };

  const removeEmbryoRow = (index: number) => {
    setEmbryos(embryos.filter((_, i) => i !== index));
  };

  const updateEmbryo = (index: number, field: keyof DonorEmbryoRow, val: string) => {
    const updated = [...embryos];
    updated[index][field] = val;
    setEmbryos(updated);
  };

  // Transfer Procedure
  const [numberTransferred, setNumberTransferred] = useState('1');
  const [catheterType, setCatheterType] = useState('');
  const [ultrasoundGuided, setUltrasoundGuided] = useState('');
  const [transferDifficulty, setTransferDifficulty] = useState('');
  const [transferDoctor, setTransferDoctor] = useState(activeCycle?.doctor_name || '');
  const [transferEmbryologist, setTransferEmbryologist] = useState('');
  const [bloodOnCatheter, setBloodOnCatheter] = useState('');
  const [retainedEmbryo, setRetainedEmbryo] = useState('');

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'donor_embryo_transfer',
        data: {
          recipient: {
            name: recipientName,
            vid: recipientVid,
            age: recipientAge,
            blood_group: recipientBloodGroup,
            partner_name: partnerName,
            cycle_id: cycleId,
            consultant,
            transfer_date: transferDate,
            transfer_time: transferTime,
            recipient_consent: recipientConsent,
            identity_verified: identityVerified,
            witness_verified: witnessVerified,
            indication,
          },
          donor_traceability: {
            program_id: donorProgramId,
            donor_code: donorCode,
            embryo_cryo_id: embryoCryoId,
            donor_type: donorType,
            screening_status: screeningStatus,
            consent_status: donorConsentStatus,
            matching_status: recipientMatching,
            verified_by: eligibilityVerifiedBy,
            documentation_ref: documentationRef,
          },
          endometrial_prep: {
            cycle_type: cycleType,
            medications: endometrialPrep,
            trigger_date: triggerDate,
            progesterone_start: progesteroneStart,
            progesterone_exposure: progesteroneExposure,
            et_thickness: endometrialThickness,
            pattern: endometrialPattern,
            e2: estradiolTransferDay,
            p4: progesteroneTransferDay,
            cavity: uterineCavity,
          },
          embryos,
          procedure: {
            number_transferred: parseInt(numberTransferred, 10) || 1,
            catheter_type: catheterType,
            ultrasound_guided: ultrasoundGuided,
            difficulty: transferDifficulty,
            doctor: transferDoctor,
            embryologist: transferEmbryologist,
            blood_on_catheter: bloodOnCatheter,
            retained_embryo_check: retainedEmbryo,
          },
        },
      };

      await andrologyApi.create(payload);
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save donor embryo transfer record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-rail-bg/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-transparent print:overflow-visible">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:border-none print:bg-transparent print:m-0 print:p-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Donor Embryo Transfer (FET) — Laboratory Record
              </h2>
              <p className="text-xs text-slate-500">
                Recipient: <span className="font-semibold text-slate-800">{recipientName}</span> ({recipientVid}) · Donor Program Code: <span className="font-mono font-bold text-teal-800">{donorCode.split(' ')[0]}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'form' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Form Entry
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Preview Report
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* Section 1: Recipient Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Recipient Couple &amp; Clinical Identification
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Recipient VID *</label>
                    <input
                      type="text"
                      value={recipientVid}
                      onChange={(e) => setRecipientVid(e.target.value)}
                      className="vmd-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Age / Blood Group</label>
                    <input
                      type="text"
                      value={`${recipientAge} Y / ${recipientBloodGroup}`}
                      onChange={(e) => setRecipientBloodGroup(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Partner Name</label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Transfer Date</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="vmd-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Transfer Time</label>
                    <input
                      type="time"
                      value={transferTime}
                      onChange={(e) => setTransferTime(e.target.value)}
                      className="vmd-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Statutory Consent Verified</label>
                    <input
                      type="text"
                      value={recipientConsent}
                      onChange={(e) => setRecipientConsent(e.target.value)}
                      className="vmd-input text-xs font-semibold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Identity &amp; Biometrics</label>
                    <input
                      type="text"
                      value={identityVerified}
                      onChange={(e) => setIdentityVerified(e.target.value)}
                      className="vmd-input text-xs font-semibold text-emerald-800"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Donor Traceability & Regulatory Safeguard */}
              <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-700" /> 2. Donor Embryo Traceability &amp; Confidentiality
                  </h3>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-100 px-2 py-0.5 rounded">
                    ART Act 2021 Compliant
                  </span>
                </div>
                <p className="text-[11px] text-teal-800/80 leading-relaxed">
                  Confidentiality safeguard: Identifiable donor particulars are strictly segregated in the restricted regulatory vault. Clinical records utilize anonymized donor codes exclusively.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Donor Embryo Code *</label>
                    <input
                      type="text"
                      value={donorCode}
                      onChange={(e) => setDonorCode(e.target.value)}
                      className="vmd-input text-xs font-mono font-bold text-teal-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Cryo Straw / Barcode *</label>
                    <input
                      type="text"
                      value={embryoCryoId}
                      onChange={(e) => setEmbryoCryoId(e.target.value)}
                      className="vmd-input text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Screening Clearance</label>
                    <input
                      type="text"
                      value={screeningStatus}
                      onChange={(e) => setScreeningStatus(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Recipient Matching</label>
                    <input
                      type="text"
                      value={recipientMatching}
                      onChange={(e) => setRecipientMatching(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Endometrial Preparation */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Endometrial Preparation &amp; Ultrasound Monitoring
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">FET Protocol Type</label>
                    <select
                      value={cycleType}
                      onChange={(e) => setCycleType(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    >
                      <option value="HRT / Programmed FET">HRT / Programmed FET</option>
                      <option value="Natural Cycle FET">Natural Cycle FET</option>
                      <option value="Modified Natural FET">Modified Natural (hCG Trigger)</option>
                      <option value="Mild Stimulation (Letrozole)">Mild Stimulation (Letrozole)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Thickness (ET)</label>
                    <input
                      type="text"
                      value={endometrialThickness}
                      onChange={(e) => setEndometrialThickness(e.target.value)}
                      className="vmd-input text-xs font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Endometrial Pattern</label>
                    <input
                      type="text"
                      value={endometrialPattern}
                      onChange={(e) => setEndometrialPattern(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Progesterone Exposure</label>
                    <input
                      type="text"
                      value={progesteroneExposure}
                      onChange={(e) => setProgesteroneExposure(e.target.value)}
                      className="vmd-input text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">E2 on Transfer Day</label>
                    <input
                      type="text"
                      value={estradiolTransferDay}
                      onChange={(e) => setEstradiolTransferDay(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">P4 on Transfer Day</label>
                    <input
                      type="text"
                      value={progesteroneTransferDay}
                      onChange={(e) => setProgesteroneTransferDay(e.target.value)}
                      className="vmd-input text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Uterine Cavity Status</label>
                    <input
                      type="text"
                      value={uterineCavity}
                      onChange={(e) => setUterineCavity(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Donor Embryos Thawed & Transferred Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                  <span>4. Donor Embryos Thaw, Survival &amp; Disposition Log</span>
                  <button
                    type="button"
                    onClick={addEmbryoRow}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Embryo
                  </button>
                </div>
                <div className="p-4 bg-white overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">Embryo Cryo ID</th>
                        <th className="p-2">Stage</th>
                        <th className="p-2">Grade</th>
                        <th className="p-2">PGT Status</th>
                        <th className="p-2">Thaw Survival</th>
                        <th className="p-2">Re-expansion</th>
                        <th className="p-2">Disposition</th>
                        <th className="p-2 text-center w-10">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {embryos.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                            No donor embryos added. Click &quot;+ Add Donor Embryo&quot; above to specify thawed embryos.
                          </td>
                        </tr>
                      ) : embryos.map((emb, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={emb.embryoId}
                              onChange={(e) => updateEmbryo(idx, 'embryoId', e.target.value)}
                              className="vmd-input text-xs font-mono font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={emb.day}
                              onChange={(e) => updateEmbryo(idx, 'day', e.target.value)}
                              className="vmd-input text-xs"
                            >
                              <option value="Day 5 Blastocyst">Day 5 Blastocyst</option>
                              <option value="Day 6 Blastocyst">Day 6 Blastocyst</option>
                              <option value="Day 3 Cleavage">Day 3 Cleavage</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={emb.grade}
                              onChange={(e) => updateEmbryo(idx, 'grade', e.target.value)}
                              className="vmd-input text-xs font-bold text-slate-900"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={emb.pgt}
                              onChange={(e) => updateEmbryo(idx, 'pgt', e.target.value)}
                              className="vmd-input text-xs"
                            >
                              <option value="Euploid (Normal 46,XX)">Euploid (46,XX)</option>
                              <option value="Euploid (Normal 46,XY)">Euploid (46,XY)</option>
                              <option value="Not Tested">Not Tested</option>
                              <option value="Mosaic">Mosaic</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={emb.survival}
                              onChange={(e) => updateEmbryo(idx, 'survival', e.target.value)}
                              className="vmd-input text-xs text-emerald-700 font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={emb.reexpansion}
                              onChange={(e) => updateEmbryo(idx, 'reexpansion', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={emb.disposition}
                              onChange={(e) => updateEmbryo(idx, 'disposition', e.target.value)}
                              className="vmd-input text-xs font-bold text-purple-700"
                            >
                              <option value="Transferred">Transferred</option>
                              <option value="Remaining in storage">Remaining in storage</option>
                              <option value="Non-viable">Non-viable</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeEmbryoRow(idx)}
                              disabled={embryos.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 5: Transfer Procedure & Safety Check */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  5. Transfer Procedure &amp; Mandatory Retained Check
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryos Transferred</label>
                    <input
                      type="number"
                      value={numberTransferred}
                      onChange={(e) => setNumberTransferred(e.target.value)}
                      className="vmd-input text-xs font-bold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Catheter Type</label>
                    <input
                      type="text"
                      value={catheterType}
                      onChange={(e) => setCatheterType(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Ultrasound Guidance</label>
                    <input
                      type="text"
                      value={ultrasoundGuided}
                      onChange={(e) => setUltrasoundGuided(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Transfer Ease</label>
                    <input
                      type="text"
                      value={transferDifficulty}
                      onChange={(e) => setTransferDifficulty(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Doctor Performing Transfer</label>
                    <input
                      type="text"
                      value={transferDoctor}
                      onChange={(e) => setTransferDoctor(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryologist Loading</label>
                    <input
                      type="text"
                      value={transferEmbryologist}
                      onChange={(e) => setTransferEmbryologist(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Retained Embryo Verification *</label>
                    <input
                      type="text"
                      value={retainedEmbryo}
                      onChange={(e) => setRetainedEmbryo(e.target.value)}
                      className="vmd-input text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Print Preview */
            <div className="max-w-4xl mx-auto bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800 printable-document print:p-6 print:border-none">
              <PrintableReportHeader
                title="Donor Embryo Transfer (FET) — Official Laboratory Record"
                subtitle="VaidyaMD Assisted Conception & Donor Gamete BioBank · ART Act 2021 Accredited"
                badge="DONOR ET RECORD"
                patient={{
                  name: recipientName,
                  vid: recipientVid,
                }}
                metaFields={[
                  { label: 'Donor Anonymized Code', value: donorCode },
                  { label: 'Transfer Date / Time', value: `${transferDate} at ${transferTime}` },
                ]}
              />

              <div className="grid grid-cols-2 text-xs border border-slate-200 divide-x divide-y divide-slate-200 avoid-break">
                <div className="p-2.5 bg-slate-50 font-bold">Recipient Patient: <span className="font-normal">{recipientName}</span></div>
                <div className="p-2.5 bg-slate-50 font-bold">Recipient VID: <span className="font-normal font-mono">{recipientVid}</span></div>
                <div className="p-2.5">Donor Anonymized Code: <span className="font-mono font-bold text-teal-800">{donorCode}</span></div>
                <div className="p-2.5">Transfer Date/Time: <span className="font-semibold">{transferDate} {transferTime}</span></div>
                <div className="p-2.5">Endometrial Thickness: <span className="font-bold text-emerald-800">{endometrialThickness}</span></div>
                <div className="p-2.5">Retained Check: <span className="font-bold text-emerald-700">0 Retained (Negative)</span></div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Transferred Donor Embryos</h3>
                <table className="w-full text-xs border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border border-slate-300">Embryo ID</th>
                      <th className="p-2 border border-slate-300">Developmental Stage</th>
                      <th className="p-2 border border-slate-300">Gardner Grade</th>
                      <th className="p-2 border border-slate-300">PGT Euploidy</th>
                      <th className="p-2 border border-slate-300">Post-Thaw Survival</th>
                    </tr>
                  </thead>
                  <tbody>
                    {embryos.map((e, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-slate-300 font-mono font-bold">{e.embryoId}</td>
                        <td className="p-2 border border-slate-300">{e.day}</td>
                        <td className="p-2 border border-slate-300 font-bold">{e.grade}</td>
                        <td className="p-2 border border-slate-300">{e.pgt}</td>
                        <td className="p-2 border border-slate-300 text-emerald-700 font-bold">{e.survival}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{transferDoctor}</p>
                  <p className="text-slate-500">Operating Gynaecologist</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{transferEmbryologist}</p>
                  <p className="text-slate-500">Witness Embryologist</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Donor embryo transfer record saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print / PDF
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Donor ET Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
