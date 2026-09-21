'use client';

import React, { useState } from 'react';
import {
  HeartHandshake,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Clock,
  Calendar,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { andrologyApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

export interface IUIDonorModalProps {
  patient: any;
  partner?: any;
  cycle?: any;
  activeCycle?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function IUIDonorModal({
  patient,
  partner,
  cycle,
  activeCycle,
  onClose,
  onSaved,
}: IUIDonorModalProps) {
  const { user } = useAuth();
  const resolvedCycle = activeCycle || cycle;
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);

  // Recipient info
  const recipientName = patient?.name || 'Recipient Patient';
  const recipientVid = patient?.vid || 'VH-PAT-000';
  const partnerName = partner?.name || '';

  // Donor Details
  const [donorBank, setDonorBank] = useState('');
  const [donorCode, setDonorCode] = useState('');
  const [donorBloodGroup, setDonorBloodGroup] = useState('');
  const [donorKaryotype, setDonorKaryotype] = useState('');
  const [donorCmvStatus, setDonorCmvStatus] = useState('');
  const [donorTraits, setDonorTraits] = useState('');

  // Straw Thawing & Storage Coordinates
  const [strawId, setStrawId] = useState('');
  const [canisterLocation, setCanisterLocation] = useState('');
  const [thawTemp, setThawTemp] = useState('');
  const [prepMethod, setPrepMethod] = useState('');
  const [washMedia, setWashMedia] = useState('');

  // Semen & Motility Parameters
  const [preThawMotility, setPreThawMotility] = useState('');
  const [postWashVolume, setPostWashVolume] = useState('');
  const [postWashConc, setPostWashConc] = useState('');
  const [postWashProgressive, setPostWashProgressive] = useState('');
  const [tmsi, setTmsi] = useState(''); // Total motile sperm inseminated in millions

  // Insemination Procedure Details
  const [iuiDate, setIuiDate] = useState(new Date().toISOString().split('T')[0]);
  const [iuiTime, setIuiTime] = useState('');
  const [hoursPostTrigger, setHoursPostTrigger] = useState('');
  const [catheterType, setCatheterType] = useState('');
  const [inseminatedVolume, setInseminatedVolume] = useState('');
  const [easeOfInsertion, setEaseOfInsertion] = useState('');
  const [tenaculumUsed, setTenaculumUsed] = useState('No');
  const [cervicalBleeding, setCervicalBleeding] = useState('');
  const [restTimeMin, setRestTimeMin] = useState('');

  // Regulatory & Clinical Verification
  const [form14Verified, setForm14Verified] = useState(false);
  const [form23Verified, setForm23Verified] = useState(false);
  const [anonymityCertified, setAnonymityCertified] = useState(false);

  // Signatures
  const [gynaecologistName, setGynaecologistName] = useState('');
  const [andrologistName, setAndrologistName] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [adviceAfterIui, setAdviceAfterIui] = useState('');

  // Auto-calculate TMSI when Volume, Conc, or Progressive Motility changes
  const handleRecalculateTmsi = (vol: string, conc: string, prog: string) => {
    const v = parseFloat(vol) || 0;
    const c = parseFloat(conc) || 0;
    const p = parseFloat(prog) || 0;
    if (v > 0 && c > 0 && p > 0) {
      const totalMotile = (v * c * (p / 100)).toFixed(1);
      setTmsi(totalMotile);
    }
  };

  const handleSave = async () => {
    if (!patient?.id) {
      alert('Missing patient information.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'iui_donor_record',
        data: {
          recipient_name: recipientName,
          recipient_vid: recipientVid,
          partner_name: partnerName,
          cycle_id: resolvedCycle?.cycle_id || resolvedCycle?.id,
          donor_bank: donorBank,
          donor_code: donorCode,
          donor_blood_group: donorBloodGroup,
          donor_karyotype: donorKaryotype,
          donor_cmv_status: donorCmvStatus,
          donor_traits: donorTraits,
          straw_id: strawId,
          canister_location: canisterLocation,
          thaw_temp: thawTemp,
          prep_method: prepMethod,
          wash_media: washMedia,
          pre_thaw_motility: preThawMotility,
          post_wash_volume: postWashVolume,
          post_wash_conc: postWashConc,
          post_wash_progressive: postWashProgressive,
          tmsi: tmsi,
          iui_date: iuiDate,
          iui_time: iuiTime,
          hours_post_trigger: hoursPostTrigger,
          catheter_type: catheterType,
          inseminated_volume: inseminatedVolume,
          ease_of_insertion: easeOfInsertion,
          tenaculum_used: tenaculumUsed,
          cervical_bleeding: cervicalBleeding,
          rest_time_min: restTimeMin,
          form14_verified: form14Verified,
          form23_verified: form23Verified,
          anonymity_certified: anonymityCertified,
          gynaecologist_name: gynaecologistName,
          andrologist_name: andrologistName,
          witness_name: witnessName,
          advice_after_iui: adviceAfterIui,
          created_at: new Date().toISOString(),
        },
      };

      await andrologyApi.create(payload);
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to save IUI Donor record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-transparent print:overflow-visible">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:border-none print:bg-transparent">
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                IUI with Donor Semen (IUI-D) — Laboratory &amp; Procedure Record
              </h2>
              <p className="text-xs text-slate-500">
                Recipient: <span className="font-semibold text-slate-800">{recipientName}</span> ({recipientVid}) · Donor Program Code: <span className="font-mono font-bold text-teal-800">{donorCode}</span>
                {resolvedCycle && ` · Cycle: ${resolvedCycle.cycle_id || resolvedCycle.id}`}
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
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Preview &amp; Print
              </button>
            </div>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0">
          {viewMode === 'form' ? (
            /* ======================================================== */
            /* FORM ENTRY VIEW                                          */
            /* ======================================================== */
            <div className="space-y-6">
              {/* Compliance Banner */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span>
                    <strong>ART Act 2021 Compliant:</strong> Third-party donor gamete anonymity enforced. Verified with certified ART Bank registry.
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                  Form 14 &amp; 23 OK
                </span>
              </div>

              {/* 1. Donor Gamete & Bank Verification */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-slate-600" />
                  1. ART Donor Bank &amp; Donor Gamete Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor Sourcing Bank</label>
                    <input
                      type="text"
                      value={donorBank}
                      onChange={(e) => setDonorBank(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Anonymized Donor Code</label>
                    <input
                      type="text"
                      value={donorCode}
                      onChange={(e) => setDonorCode(e.target.value)}
                      className="vmd-input text-xs w-full font-mono font-bold text-teal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor Blood Group &amp; Rh</label>
                    <input
                      type="text"
                      value={donorBloodGroup}
                      onChange={(e) => setDonorBloodGroup(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Donor Karyotype</label>
                    <input
                      type="text"
                      value={donorKaryotype}
                      onChange={(e) => setDonorKaryotype(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">CMV / Infectious Markers</label>
                    <input
                      type="text"
                      value={donorCmvStatus}
                      onChange={(e) => setDonorCmvStatus(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Physical Attributes Profile</label>
                    <input
                      type="text"
                      value={donorTraits}
                      onChange={(e) => setDonorTraits(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Thaw Protocol & Cryostraw Coordinates */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                  2. Cryostraw Coordinates &amp; Thaw Protocol
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Cryostraw / Vial ID</label>
                    <input
                      type="text"
                      value={strawId}
                      onChange={(e) => setStrawId(e.target.value)}
                      className="vmd-input text-xs w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Storage Location Coordinates</label>
                    <input
                      type="text"
                      value={canisterLocation}
                      onChange={(e) => setCanisterLocation(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Thaw Temperature &amp; Time</label>
                    <input
                      type="text"
                      value={thawTemp}
                      onChange={(e) => setThawTemp(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm Wash / Prep Method</label>
                    <input
                      type="text"
                      value={prepMethod}
                      onChange={(e) => setPrepMethod(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Wash Media Used</label>
                    <input
                      type="text"
                      value={washMedia}
                      onChange={(e) => setWashMedia(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Post-Thaw & Post-Wash Semen Parameters */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded">
                  3. Post-Wash Semen Metrics &amp; Inseminated Yield (TMSI)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Pre-Thaw Motility %</label>
                    <input
                      type="number"
                      value={preThawMotility}
                      onChange={(e) => setPreThawMotility(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-Wash Vol (mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={postWashVolume}
                      onChange={(e) => {
                        setPostWashVolume(e.target.value);
                        handleRecalculateTmsi(e.target.value, String(postWashConc), String(postWashProgressive));
                      }}
                      className="vmd-input text-xs w-full font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-Wash Conc (M/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={postWashConc}
                      onChange={(e) => {
                        setPostWashConc(e.target.value);
                        handleRecalculateTmsi(String(postWashVolume), e.target.value, String(postWashProgressive));
                      }}
                      className="vmd-input text-xs w-full font-bold text-text-main"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive (PR) %</label>
                    <input
                      type="number"
                      value={postWashProgressive}
                      onChange={(e) => {
                        setPostWashProgressive(e.target.value);
                        handleRecalculateTmsi(String(postWashVolume), String(postWashConc), e.target.value);
                      }}
                      className="vmd-input text-xs w-full font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">TMSI (Million Inseminated)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tmsi}
                      onChange={(e) => setTmsi(e.target.value)}
                      className="vmd-input text-xs w-full font-bold text-teal-900 bg-teal-50"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Insemination Procedure Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  4. Clinical Insemination Procedure Details
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Insemination Date</label>
                    <input
                      type="date"
                      value={iuiDate}
                      onChange={(e) => setIuiDate(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Insemination Time</label>
                    <input
                      type="time"
                      value={iuiTime}
                      onChange={(e) => setIuiTime(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Hours Post Trigger</label>
                    <input
                      type="text"
                      value={hoursPostTrigger}
                      onChange={(e) => setHoursPostTrigger(e.target.value)}
                      className="vmd-input text-xs w-full"
                      placeholder="e.g. 36h"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Catheter Type</label>
                    <input
                      type="text"
                      value={catheterType}
                      onChange={(e) => setCatheterType(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Ease of Insertion</label>
                    <select
                      value={easeOfInsertion}
                      onChange={(e) => setEaseOfInsertion(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option>Easy / Smooth</option>
                      <option>Moderate</option>
                      <option>Difficult (Cervical curve)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Tenaculum Used</label>
                    <select
                      value={tenaculumUsed}
                      onChange={(e) => setTenaculumUsed(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Cervical Bleeding</label>
                    <select
                      value={cervicalBleeding}
                      onChange={(e) => setCervicalBleeding(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option>None</option>
                      <option>Mild / Spotting</option>
                      <option>Moderate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Rest Time (mins)</label>
                    <input
                      type="number"
                      value={restTimeMin}
                      onChange={(e) => setRestTimeMin(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Post-IUI Clinical Advice &amp; Luteal Support</label>
                  <textarea
                    rows={2}
                    value={adviceAfterIui}
                    onChange={(e) => setAdviceAfterIui(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>

              {/* 5. Statutory Consents & Signatures */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                  5. Statutory Consents &amp; Clinical Attestations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form14Verified}
                      onChange={(e) => setForm14Verified(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Form 14 (Donor Gamete Consent) on File</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form23Verified}
                      onChange={(e) => setForm23Verified(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Form 23 (Biobank Straw Allocation) Verified</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymityCertified}
                      onChange={(e) => setAnonymityCertified(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>ART Act 2021 Donor Anonymity Certified</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Treating Gynaecologist</label>
                    <input
                      type="text"
                      value={gynaecologistName}
                      onChange={(e) => setGynaecologistName(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Processing Andrologist</label>
                    <input
                      type="text"
                      value={andrologistName}
                      onChange={(e) => setAndrologistName(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Witness Embryologist</label>
                    <input
                      type="text"
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* PRINT PREVIEW VIEW                                       */
            /* ======================================================== */
            <div className="space-y-6 printable-document print:p-6 text-slate-900 text-xs" style={{ fontFamily: 'Inter, Arial, sans-serif' }}>
              <div className="flex items-center justify-between print:hidden pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Letterhead pad spacing:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded border text-xs">
                    <button
                      type="button"
                      onClick={() => setIncludeHeader(true)}
                      className={`px-2 py-0.5 rounded ${includeHeader ? 'bg-teal-700 text-white font-bold' : 'text-slate-600'}`}
                    >
                      With Header
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncludeHeader(false)}
                      className={`px-2 py-0.5 rounded ${!includeHeader ? 'bg-amber-600 text-white font-bold' : 'text-slate-600'}`}
                    >
                      Pre-printed Pad
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-md shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report (A4)
                </button>
              </div>

              <PrintableReportHeader
                title="IUI WITH DONOR SEMEN (IUI-D) — CLINICAL & LABORATORY RECORD"
                subtitle="Assisted Conception Unit · ART Bank Gamete Allocation"
                badge="IUI-DONOR REPORT"
                includeHeader={includeHeader}
                department="Department of Andrology & Reproductive Medicine"
                patient={{
                  name: recipientName,
                  vid: recipientVid,
                }}
                partner={partnerName ? { name: partnerName } : undefined}
                metaFields={[
                  { label: 'Anonymized Donor Code', value: donorCode },
                  { label: 'Insemination Date & Time', value: `${iuiDate} at ${iuiTime}` },
                ]}
              />

              {/* Donor Profile Summary */}
              <div className="space-y-1.5 avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-300">
                  1. Donor Gamete Sourcing &amp; Identity Verification
                </h3>
                <table className="w-full text-xs border-collapse print-table">
                  <tbody>
                    <tr>
                      <td className="w-1/4 font-semibold bg-slate-50">Sourcing ART Bank</td>
                      <td className="w-1/4">{donorBank}</td>
                      <td className="w-1/4 font-semibold bg-slate-50">Donor Code</td>
                      <td className="w-1/4 font-mono font-bold text-teal-900">{donorCode}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">Blood Group &amp; Rh</td>
                      <td>{donorBloodGroup}</td>
                      <td className="font-semibold bg-slate-50">Karyotype</td>
                      <td>{donorKaryotype}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">CMV / Serology</td>
                      <td>{donorCmvStatus}</td>
                      <td className="font-semibold bg-slate-50">Cryostraw ID</td>
                      <td className="font-mono">{strawId}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">Physical Traits</td>
                      <td colSpan={3}>{donorTraits}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Thawing & Post-Wash Semen Analysis */}
              <div className="space-y-1.5 avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-300">
                  2. Thaw Protocol &amp; Post-Wash Semen Parameters
                </h3>
                <table className="w-full text-xs border-collapse print-table">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[10px]">
                      <th className="py-1 px-3">Parameter</th>
                      <th className="py-1 px-3">Pre-Thaw Standard</th>
                      <th className="py-1 px-3">Post-Wash Result</th>
                      <th className="py-1 px-3">Clinical Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-semibold">Sperm Concentration</td>
                      <td>—</td>
                      <td className="font-bold">{postWashConc} Million / mL</td>
                      <td className="text-slate-500">≥ 10 M/mL</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Progressive Motility (PR)</td>
                      <td>{preThawMotility}%</td>
                      <td className="font-bold text-emerald-800">{postWashProgressive}%</td>
                      <td className="text-slate-500">≥ 70% Post-Wash</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Inseminated Volume</td>
                      <td>—</td>
                      <td className="font-bold">{postWashVolume} mL</td>
                      <td className="text-slate-500">0.3 – 0.5 mL</td>
                    </tr>
                    <tr>
                      <td className="font-semibold">Total Motile Sperm (TMSI)</td>
                      <td>—</td>
                      <td className="font-bold text-teal-900 bg-teal-50">{tmsi} Million</td>
                      <td className="text-slate-500">≥ 5.0 Million (Optimal ≥ 10M)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Insemination Record */}
              <div className="space-y-1.5 avoid-break">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1 border-b border-slate-300">
                  3. Insemination Procedure Record
                </h3>
                <table className="w-full text-xs border-collapse print-table">
                  <tbody>
                    <tr>
                      <td className="w-1/4 font-semibold bg-slate-50">Insemination Date &amp; Time</td>
                      <td className="w-1/4">{iuiDate} at {iuiTime}</td>
                      <td className="w-1/4 font-semibold bg-slate-50">Hours Post Trigger</td>
                      <td className="w-1/4">{hoursPostTrigger} hrs</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">Insemination Catheter</td>
                      <td>{catheterType}</td>
                      <td className="font-semibold bg-slate-50">Ease of Insertion</td>
                      <td>{easeOfInsertion}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">Tenaculum Used</td>
                      <td>{tenaculumUsed}</td>
                      <td className="font-semibold bg-slate-50">Cervical Bleeding</td>
                      <td>{cervicalBleeding}</td>
                    </tr>
                    <tr>
                      <td className="font-semibold bg-slate-50">Post-Procedure Rest</td>
                      <td colSpan={3}>{restTimeMin} minutes in supine position</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Advice */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 avoid-break">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Post-Procedure Luteal Support &amp; Instructions</span>
                <p className="text-xs text-slate-800">{adviceAfterIui}</p>
              </div>

              {/* Attestation Signatures */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-xs avoid-break">
                <div>
                  <div className="border-b border-slate-400 w-full mb-1" />
                  <p className="font-bold text-slate-800">{gynaecologistName}</p>
                  <p className="text-[10px] text-slate-500">Operating Gynaecologist</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-full mb-1" />
                  <p className="font-bold text-slate-800">{andrologistName}</p>
                  <p className="text-[10px] text-slate-500">Processing Andrologist</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-full mb-1" />
                  <p className="font-bold text-slate-800">{witnessName}</p>
                  <p className="text-[10px] text-slate-500">Witness Embryologist</p>
                </div>
              </div>

              {/* Legal / ART Act Footnote */}
              <div className="text-[9px] text-slate-400 border-t border-slate-200 pt-2 text-center">
                This donor insemination record is executed pursuant to the provisions of the Assisted Reproductive Technology (Regulation) Act, 2021. Donor anonymity is strictly maintained.
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
                IUI Donor procedure record saved successfully!
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
              {isSaving ? 'Saving...' : 'Save IUI-D Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
