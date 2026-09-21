'use client';

import React, { useState } from 'react';
import {
  Snowflake,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';
import { andrologyApi, cryoApi } from '@/lib/api';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

export interface SpermFreezingModalProps {
  patient: any;
  partner?: any;
  cycle?: any;
  activeCycle?: any;
  onClose: () => void;
  onSaved?: () => void;
}

interface CryoVialRow {
  vialNo: string;
  tankNo: string;
  canisterNo: string;
  caneNo: string;
  gobletColor: string;
  comments: string;
}

export default function SpermFreezingModal({
  patient,
  partner,
  cycle,
  activeCycle,
  onClose,
  onSaved,
}: SpermFreezingModalProps) {
  const resolvedCycle = activeCycle || cycle;
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [usePrePrintedPad, setUsePrePrintedPad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Section 1: Patient & Treatment Details
  const [femalePartnerName, setFemalePartnerName] = useState(
    resolvedCycle?.patient_name || partner?.name || patient?.partner_name || ''
  );
  const [patientAge, setPatientAge] = useState(patient?.age ? String(patient.age) : '');
  const [treatmentCycleId, setTreatmentCycleId] = useState(resolvedCycle?.cycle_id || '');
  const [freezingType, setFreezingType] = useState('General Autologous');
  const [indication, setIndication] = useState('');
  const [freezingId, setFreezingId] = useState(
    `SP-FRZ-${patient?.vid || '001'}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [consentObtained, setConsentObtained] = useState('');
  const [infectionScreening, setInfectionScreening] = useState('');

  // Section 2: Semen Collection
  const [productionDateTime, setProductionDateTime] = useState('');
  const [freezingDateTime, setFreezingDateTime] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('');
  const [collectionPlace, setCollectionPlace] = useState('');
  const [abstinenceDays, setAbstinenceDays] = useState('');

  // Section 3: Semen Parameters
  const [semenVolume, setSemenVolume] = useState('');
  const [liquefactionTime, setLiquefactionTime] = useState('');
  const [ph, setPh] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [spermConc, setSpermConc] = useState('');
  const [totalMotility, setTotalMotility] = useState('');
  const [progressiveMotility, setProgressiveMotility] = useState('');
  const [normalMorphology, setNormalMorphology] = useState('');

  // Cryoprotectant & Media
  const [cryoMedia, setCryoMedia] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [mediaExpiryDate, setMediaExpiryDate] = useState('');
  const [dilutionRatio, setDilutionRatio] = useState('');
  const [equilibrationMin, setEquilibrationMin] = useState('');

  // Duration & Expiry
  const [durationDays, setDurationDays] = useState('365');
  const calculateExpiry = (days: string) => {
    const d = parseInt(days, 10) || 365;
    const exp = new Date(Date.now() + d * 86400000);
    return exp.toISOString().split('T')[0];
  };
  const [expiryDate, setExpiryDate] = useState(calculateExpiry('365'));

  const [embryologistName, setEmbryologistName] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isDiscarded, setIsDiscarded] = useState(false);

  // Dynamic Cryo Vials
  const [vials, setVials] = useState<CryoVialRow[]>([]);

  const addVial = () => {
    const nextIdx = vials.length + 1;
    setVials([
      ...vials,
      {
        vialNo: `Vial ${nextIdx} (0.5 mL)`,
        tankNo: '',
        canisterNo: '',
        caneNo: '',
        gobletColor: '',
        comments: '',
      },
    ]);
  };

  const removeVial = (index: number) => {
    setVials(vials.filter((_, i) => i !== index));
  };

  const updateVial = (index: number, field: keyof CryoVialRow, value: string) => {
    const updated = [...vials];
    updated[index][field] = value;
    setVials(updated);
  };

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        record_type: 'semen_freezing',
        data: {
          freezing_id: freezingId,
          freezing_type: freezingType,
          indication,
          male_partner_name: patient?.name,
          female_partner_name: femalePartnerName,
          patient_age: patientAge,
          treatment_cycle_id: treatmentCycleId,
          consent_obtained: consentObtained,
          infection_screening: infectionScreening,
          production_datetime: productionDateTime,
          freezing_datetime: freezingDateTime,
          collection_method: collectionMethod,
          collection_place: collectionPlace,
          abstinence_days: parseInt(abstinenceDays, 10) || 0,
          pre_freeze_analysis: {
            volume_ml: parseFloat(semenVolume) || 0,
            liquefaction: liquefactionTime,
            ph: parseFloat(ph) || 0,
            viscosity,
            sperm_conc_million_ml: parseFloat(spermConc) || 0,
            total_motility_pct: parseFloat(totalMotility) || 0,
            progressive_motility_pct: parseFloat(progressiveMotility) || 0,
            normal_morphology_pct: parseFloat(normalMorphology) || 0,
          },
          media: {
            brand: cryoMedia,
            batch_no: batchNo,
            expiry_date: mediaExpiryDate,
            dilution_ratio: dilutionRatio,
            equilibration_min: equilibrationMin,
          },
          storage: {
            duration_days: parseInt(durationDays, 10) || 0,
            expiry_date: expiryDate,
            no_of_vials: vials.length,
            vials,
          },
          embryologist_name: embryologistName,
          witness_name: witnessName,
          remarks,
          is_discarded: isDiscarded,
        },
      };

      await andrologyApi.create(payload);

      // Also register in cryo biobank for statutory tracking
      for (const v of vials) {
        try {
          await cryoApi.createSample({
            patient_id: patient.id,
            partner_id: activeCycle?.patient_id || null,
            sample_type: 'sperm',
            straw_number: `${freezingId}-${v.vialNo.split(' ')[1] || '01'}`,
            no_of_embryos: 1,
            tank_number: v.tankNo,
            canister_number: v.canisterNo,
            cane_number: v.caneNo,
            goblet_colour: v.gobletColor,
            expiry_date: expiryDate,
            consent_form_reference: 'ART-FORM-15-SPERM',
          });
        } catch {
          // ignore duplicate straw registrations
        }
      }

      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      alert(err.message || 'Failed to save sperm freezing record');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-rail-bg/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:p-0 print:static print:bg-white print:overflow-visible">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Snowflake className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                IVF Lab — Semen Cryopreservation Record
              </h2>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patient?.name || 'Male Patient'}</span> ({patient?.vid || 'VID-000'})
                {femalePartnerName && ` · Partner: ${femalePartnerName}`}
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
                <Eye className="w-3.5 h-3.5" /> Preview Certificate
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
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print:overflow-visible print:p-0">
          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* Section 1: Clinical & Identification */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Patient &amp; Treatment Identification
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Freezing ID / Code</label>
                    <input
                      type="text"
                      value={freezingId}
                      onChange={(e) => setFreezingId(e.target.value)}
                      className="vmd-input text-xs font-mono font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Freezing Type</label>
                    <select
                      value={freezingType}
                      onChange={(e) => setFreezingType(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    >
                      <option value="General Autologous">General Autologous</option>
                      <option value="Donor Semen">Donor Semen (Third Party)</option>
                      <option value="Surgical (TESA/PESA)">Surgical (TESA / PESA)</option>
                      <option value="Fertility Preservation (Onco)">Oncofertility Preservation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Female Partner Name</label>
                    <input
                      type="text"
                      value={femalePartnerName}
                      onChange={(e) => setFemalePartnerName(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Consent Verified</label>
                    <input
                      type="text"
                      value={consentObtained}
                      onChange={(e) => setConsentObtained(e.target.value)}
                      className="vmd-input text-xs font-semibold text-emerald-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Indication for Cryopreservation</label>
                    <input
                      type="text"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Infection Screening Status</label>
                    <input
                      type="text"
                      value={infectionScreening}
                      onChange={(e) => setInfectionScreening(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Semen Collection & Baseline Analysis */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Collection &amp; Pre-Freezing Semen Evaluation
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Production Date/Time</label>
                    <input
                      type="datetime-local"
                      value={productionDateTime}
                      onChange={(e) => setProductionDateTime(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Freezing Date/Time</label>
                    <input
                      type="datetime-local"
                      value={freezingDateTime}
                      onChange={(e) => setFreezingDateTime(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Collection Method</label>
                    <select
                      value={collectionMethod}
                      onChange={(e) => setCollectionMethod(e.target.value)}
                      className="vmd-input text-xs"
                    >
                      <option value="Masturbation">Masturbation</option>
                      <option value="PESA">PESA (Epididymal)</option>
                      <option value="TESA">TESA (Testicular)</option>
                      <option value="Micro-TESE">Micro-TESE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Abstinence (Days)</label>
                    <input
                      type="number"
                      value={abstinenceDays}
                      onChange={(e) => setAbstinenceDays(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Volume (mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={semenVolume}
                      onChange={(e) => setSemenVolume(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Concentration (M/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={spermConc}
                      onChange={(e) => setSpermConc(e.target.value)}
                      className="vmd-input text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Total Motility (%)</label>
                    <input
                      type="number"
                      value={totalMotility}
                      onChange={(e) => setTotalMotility(e.target.value)}
                      className="vmd-input text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Progressive PR (%)</label>
                    <input
                      type="number"
                      value={progressiveMotility}
                      onChange={(e) => setProgressiveMotility(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Media Details & Expiry */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Cryoprotectant Media &amp; Statutory Duration
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Freezing Media</label>
                    <input
                      type="text"
                      value={cryoMedia}
                      onChange={(e) => setCryoMedia(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Batch / Lot No</label>
                    <input
                      type="text"
                      value={batchNo}
                      onChange={(e) => setBatchNo(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Duration (Days)</label>
                    <input
                      type="number"
                      value={durationDays}
                      onChange={(e) => {
                        setDurationDays(e.target.value);
                        setExpiryDate(calculateExpiry(e.target.value));
                      }}
                      className="vmd-input text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Statutory Expiry Date</label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="vmd-input text-xs font-bold text-rose-700 bg-rose-50"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Cryo Vials & Physical Storage Coordinates */}
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                <div className="bg-primary text-white px-4 py-2.5 flex items-center justify-between font-bold text-xs uppercase tracking-wider">
                  <span>4. Cryo Vial Inventory &amp; Physical Coordinates</span>
                  <button
                    type="button"
                    onClick={addVial}
                    className="px-2.5 py-1 bg-primary hover:bg-primary-mid text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Vial / Straw
                  </button>
                </div>
                <div className="p-4 bg-white overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="p-2">Vial # / Volume</th>
                        <th className="p-2">Tank No</th>
                        <th className="p-2">Canister No</th>
                        <th className="p-2">Cane No</th>
                        <th className="p-2">Goblet Color</th>
                        <th className="p-2">Comments</th>
                        <th className="p-2 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vials.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                            No cryo vials added. Click &quot;+ Add Vial / Straw&quot; above to log frozen aliquots.
                          </td>
                        </tr>
                      ) : vials.map((v, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.vialNo}
                              onChange={(e) => updateVial(idx, 'vialNo', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.tankNo}
                              onChange={(e) => updateVial(idx, 'tankNo', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.canisterNo}
                              onChange={(e) => updateVial(idx, 'canisterNo', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.caneNo}
                              onChange={(e) => updateVial(idx, 'caneNo', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.gobletColor}
                              onChange={(e) => updateVial(idx, 'gobletColor', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={v.comments}
                              onChange={(e) => updateVial(idx, 'comments', e.target.value)}
                              className="vmd-input text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVial(idx)}
                              disabled={vials.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30"
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

              {/* Remarks & Signoffs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Laboratory Remarks</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="vmd-input text-xs"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="discardToggle"
                      checked={isDiscarded}
                      onChange={(e) => setIsDiscarded(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <label htmlFor="discardToggle" className="text-xs font-bold text-rose-700">
                      Mark Sample as Discarded / Consumed
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryologist / Operator</label>
                    <input
                      type="text"
                      value={embryologistName}
                      onChange={(e) => setEmbryologistName(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Dual Witness Verification</label>
                    <input
                      type="text"
                      value={witnessName}
                      onChange={(e) => setWitnessName(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Printable Lab Certificate */
            <div className="printable-document max-w-4xl mx-auto bg-white p-6 sm:p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800 print:border-none print:shadow-none print:p-0 print:m-0">
              <PrintableReportHeader
                title="SEMEN CRYOPRESERVATION & BIOBANK CERTIFICATE"
                subtitle="VaidyaMD BioBank • In Compliance with ART (Regulation) Act 2021 Form 15"
                hideHospitalHeader={usePrePrintedPad}
                onTogglePrePrintedPad={() => setUsePrePrintedPad(!usePrePrintedPad)}
                patient={{
                  name: patient?.name,
                  vid: patient?.vid,
                  age: patientAge,
                  gender: 'Male',
                  partner_name: femalePartnerName,
                }}
                metaFields={[
                  { label: 'Freezing ID', value: freezingId },
                  { label: 'Cryo Date', value: freezingDateTime.replace('T', ' ') },
                  { label: 'Cycle ID', value: treatmentCycleId },
                  { label: 'Storage Valid Till', value: expiryDate },
                ]}
              />

              <div className="grid grid-cols-2 text-xs border border-slate-200 divide-x divide-y divide-slate-200">
                <div className="p-2.5 bg-slate-50 font-bold">Freezing Type: <span className="font-semibold text-slate-800">{freezingType}</span></div>
                <div className="p-2.5 bg-slate-50 font-bold">Indication: <span className="font-semibold text-slate-800">{indication}</span></div>
                <div className="p-2.5">Storage Duration: <span className="font-semibold">{durationDays} Days (Expires: {expiryDate})</span></div>
                <div className="p-2.5">Statutory Consent: <span className="font-semibold">{consentObtained}</span></div>
                <div className="p-2.5 col-span-2">Viral Screening: <span className="font-medium text-emerald-800">{infectionScreening}</span></div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Pre-Freeze Semen Quality</h3>
                <div className="grid grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded border border-slate-200 text-center">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Volume</span>
                    <strong className="text-sm">{semenVolume} mL</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Sperm Conc</span>
                    <strong className="text-sm">{spermConc} M/mL</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Total Motility</span>
                    <strong className="text-sm text-emerald-700">{totalMotility}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Progressive PR</span>
                    <strong className="text-sm text-primary">{progressiveMotility}%</strong>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Physical Storage Coordinates in LN2 Tank</h3>
                <table className="w-full text-xs border-collapse border border-slate-300 text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold">
                      <th className="p-2 border border-slate-300">Vial No</th>
                      <th className="p-2 border border-slate-300">Tank</th>
                      <th className="p-2 border border-slate-300">Canister</th>
                      <th className="p-2 border border-slate-300">Cane</th>
                      <th className="p-2 border border-slate-300">Goblet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vials.map((v, i) => (
                      <tr key={i}>
                        <td className="p-2 border border-slate-300 font-bold">{v.vialNo}</td>
                        <td className="p-2 border border-slate-300">{v.tankNo}</td>
                        <td className="p-2 border border-slate-300">{v.canisterNo}</td>
                        <td className="p-2 border border-slate-300">{v.caneNo}</td>
                        <td className="p-2 border border-slate-300">{v.gobletColor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-600 bg-amber-50 p-3 rounded border border-amber-200 space-y-1">
                <p className="font-bold text-amber-900">Statutory Consent Notice:</p>
                <p>
                  Vitrification and storage authorized under statutory patient consent. As per clinic policy, renewal must be executed prior to the expiry date of <strong>{expiryDate}</strong>.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{embryologistName}</p>
                  <p className="text-slate-500">Freezing Embryologist</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{witnessName}</p>
                  <p className="text-slate-500">Witness Signatory</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="text-xs text-slate-500">
            {saveSuccess && (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sperm freezing coordinates recorded successfully!
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
                <Printer className="w-3.5 h-3.5" /> Print Certificate
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
              className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Freezing Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
