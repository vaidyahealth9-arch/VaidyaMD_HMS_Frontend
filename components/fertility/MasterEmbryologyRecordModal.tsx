'use client';

import React, { useState } from 'react';
import {
  Dna,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Camera,
  Calendar,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import { embryologyApi, andrologyApi } from '@/lib/api';

export interface MasterEmbryologyRecordModalProps {
  cycle: any;
  patient: any;
  partner?: any;
  onClose: () => void;
  onSaved?: () => void;
}

interface ImageUploadRow {
  id: string;
  previewUrl: string;
  description: string;
}

export default function MasterEmbryologyRecordModal({
  cycle,
  patient,
  partner,
  onClose,
  onSaved,
}: MasterEmbryologyRecordModalProps) {
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Doctors & Clinical Staff
  const [consultantDoctor, setConsultantDoctor] = useState(cycle?.doctor_name || cycle?.treating_doctor_name || '');
  const [embryologist1, setEmbryologist1] = useState('');
  const [embryologist2, setEmbryologist2] = useState('');
  const [gynaecologist1, setGynaecologist1] = useState(cycle?.doctor_name || cycle?.treating_doctor_name || '');
  const [gynaecologist2, setGynaecologist2] = useState('');

  // ART Factors
  const [reasonForArt, setReasonForArt] = useState(cycle?.indication || '');
  const [femaleFactor, setFemaleFactor] = useState(cycle?.female_factors?.join(', ') || '');
  const [maleFactor, setMaleFactor] = useState(cycle?.male_factors?.join(', ') || '');
  const [stimulationProtocol, setStimulationProtocol] = useState(cycle?.protocol_name || cycle?.protocol_type || cycle?.treatment_type || '');
  const [dateOfStimulation, setDateOfStimulation] = useState(cycle?.sentinel_dates?.stim_start || cycle?.start_date || '');
  const [e2OnHcg, setE2OnHcg] = useState('');
  const [eggCollectionDate, setEggCollectionDate] = useState(cycle?.sentinel_dates?.opu || '');
  const [eggCollectionTime, setEggCollectionTime] = useState('');

  // Oocyte & Fertilization Metrics
  const [noOfOocytes, setNoOfOocytes] = useState('');
  const [oocyteQuality, setOocyteQuality] = useState('');
  const [spermParameters, setSpermParameters] = useState('');
  const [oocytesInjected, setOocytesInjected] = useState('');
  const [oocytesFertilized, setOocytesFertilized] = useState('');

  // Embryo Transfer Details
  const [dateDayTransfer, setDateDayTransfer] = useState(cycle?.sentinel_dates?.et || '');
  const [embryosTransferred, setEmbryosTransferred] = useState('');
  const [qualityEmbryosTransferred, setQualityEmbryosTransferred] = useState('');
  const [transferComments, setTransferComments] = useState('');
  const [embryosFrozen, setEmbryosFrozen] = useState('');
  const [embryosDiscarded, setEmbryosDiscarded] = useState('');

  // Vitrification & Cryo Leaf
  const [freezingDoneOn, setFreezingDoneOn] = useState('');
  const [noOfCryoleafs, setNoOfCryoleafs] = useState('');
  const [vitrificationExpiry, setVitrificationExpiry] = useState('');
  const [laserHatching, setLaserHatching] = useState('No');
  const [procedureDone, setProcedureDone] = useState(cycle?.treatment_type || 'ICSI');
  const [renewalBefore, setRenewalBefore] = useState('');
  const [disclaimer, setDisclaimer] = useState(
    'If you fail to communicate regarding extension of freezing, your embryos will be managed as per the statutory guidelines of the ART (Regulation) Act 2021, and clinic disposal protocol.'
  );

  // Embryo Images
  const [images, setImages] = useState<ImageUploadRow[]>([]);

  const addImageRow = () => {
    setImages([
      ...images,
      {
        id: String(Date.now()),
        previewUrl: '',
        description: `Embryo Micrograph #${images.length + 1}`,
      },
    ]);
  };

  const removeImageRow = (id: string) => {
    setImages(images.filter((img) => img.id !== id));
  };

  const updateImageDesc = (id: string, desc: string) => {
    setImages(images.map((img) => (img.id === id ? { ...img, description: desc } : img)));
  };

  const handleImageFile = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImages(images.map((img) => (img.id === id ? { ...img, previewUrl: url } : img)));
    }
  };

  const handleSave = async () => {
    if (!cycle?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient?.id,
        record_type: 'master_embryology_record',
        data: {
          cycle_id: cycle.id,
          cycle_code: cycle.cycle_id,
          consultant_doctor: consultantDoctor,
          embryologist_1: embryologist1,
          embryologist_2: embryologist2,
          gynaecologist_1: gynaecologist1,
          gynaecologist_2: gynaecologist2,
          reason_for_art: reasonForArt,
          female_factor: femaleFactor,
          male_factor: maleFactor,
          stimulation_protocol: stimulationProtocol,
          date_of_stimulation: dateOfStimulation,
          e2_on_hcg: e2OnHcg,
          egg_collection_date: eggCollectionDate,
          egg_collection_time: eggCollectionTime,
          no_of_oocytes: parseInt(noOfOocytes, 10) || 0,
          oocyte_quality: oocyteQuality,
          sperm_parameters: spermParameters,
          oocytes_injected: parseInt(oocytesInjected, 10) || 0,
          oocytes_fertilized: parseInt(oocytesFertilized, 10) || 0,
          date_day_transfer: dateDayTransfer,
          embryos_transferred: parseInt(embryosTransferred, 10) || 0,
          quality_embryos_transferred: qualityEmbryosTransferred,
          transfer_comments: transferComments,
          embryos_frozen: parseInt(embryosFrozen, 10) || 0,
          embryos_discarded: parseInt(embryosDiscarded, 10) || 0,
          freezing_done_on: freezingDoneOn,
          no_of_cryoleafs: parseInt(noOfCryoleafs, 10) || 0,
          vitrification_expiry: vitrificationExpiry,
          laser_hatching: laserHatching,
          procedure_done: procedureDone,
          renewal_before: renewalBefore,
          disclaimer,
          images: images.map((img) => ({ description: img.description })),
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
      alert(err.message || 'Failed to save master embryology record');
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
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Embryology &amp; In-Vitro Culture Master Record
              </h2>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patient?.name || 'Female Patient'}</span> ({patient?.vid})
                {partner?.name && ` · Partner: ${partner.name}`}
                {cycle && ` · Cycle: ${cycle.cycle_id}`}
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
                <Eye className="w-3.5 h-3.5" /> Preview Summary
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
              {/* Clinical Staff Registry */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Clinical &amp; Laboratory Team
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Consultant Doctor *</label>
                    <input
                      type="text"
                      value={consultantDoctor}
                      onChange={(e) => setConsultantDoctor(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Primary Embryologist *</label>
                    <input
                      type="text"
                      value={embryologist1}
                      onChange={(e) => setEmbryologist1(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Secondary Witness *</label>
                    <input
                      type="text"
                      value={embryologist2}
                      onChange={(e) => setEmbryologist2(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ART Factors & Collection */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Etiology &amp; Oocyte Retrieval Timing
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason for ART</label>
                    <input
                      type="text"
                      value={reasonForArt}
                      onChange={(e) => setReasonForArt(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Female Factor</label>
                    <input
                      type="text"
                      value={femaleFactor}
                      onChange={(e) => setFemaleFactor(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Male Factor</label>
                    <input
                      type="text"
                      value={maleFactor}
                      onChange={(e) => setMaleFactor(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Stimulation Protocol</label>
                    <input
                      type="text"
                      value={stimulationProtocol}
                      onChange={(e) => setStimulationProtocol(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Stimulation Start Date</label>
                    <input
                      type="date"
                      value={dateOfStimulation}
                      onChange={(e) => setDateOfStimulation(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">E2 on Day of hCG</label>
                    <input
                      type="text"
                      value={e2OnHcg}
                      onChange={(e) => setE2OnHcg(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Egg Collection Date</label>
                    <input
                      type="date"
                      value={eggCollectionDate}
                      onChange={(e) => setEggCollectionDate(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Collection Time</label>
                    <input
                      type="time"
                      value={eggCollectionTime}
                      onChange={(e) => setEggCollectionTime(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Oocytes & Fertilization */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Gametes, Insemination &amp; 2PN Fertilization
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">No. of Oocytes (COCs) *</label>
                    <input
                      type="number"
                      value={noOfOocytes}
                      onChange={(e) => setNoOfOocytes(e.target.value)}
                      className="vmd-input text-xs font-bold text-pink-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Oocytes Injected (ICSI) *</label>
                    <input
                      type="number"
                      value={oocytesInjected}
                      onChange={(e) => setOocytesInjected(e.target.value)}
                      className="vmd-input text-xs font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Fertilized (2PN) *</label>
                    <input
                      type="number"
                      value={oocytesFertilized}
                      onChange={(e) => setOocytesFertilized(e.target.value)}
                      className="vmd-input text-xs font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Procedure Done</label>
                    <select
                      value={procedureDone}
                      onChange={(e) => setProcedureDone(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    >
                      <option value="ICSI">ICSI</option>
                      <option value="IVF">Standard IVF</option>
                      <option value="IMSI">IMSI</option>
                      <option value="PICSI">PICSI</option>
                      <option value="FET">FET Cycle</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Oocyte Quality Description</label>
                    <input
                      type="text"
                      value={oocyteQuality}
                      onChange={(e) => setOocyteQuality(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Sperm Parameters (Post-Wash)</label>
                    <input
                      type="text"
                      value={spermParameters}
                      onChange={(e) => setSpermParameters(e.target.value)}
                      className="vmd-input text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Transfer & Freezing */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  4. Embryo Transfer &amp; Vitrification
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryos Transferred</label>
                    <input
                      type="number"
                      value={embryosTransferred}
                      onChange={(e) => setEmbryosTransferred(e.target.value)}
                      className="vmd-input text-xs font-bold text-purple-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryos Frozen</label>
                    <input
                      type="number"
                      value={embryosFrozen}
                      onChange={(e) => setEmbryosFrozen(e.target.value)}
                      className="vmd-input text-xs font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Embryos Discarded</label>
                    <input
                      type="number"
                      value={embryosDiscarded}
                      onChange={(e) => setEmbryosDiscarded(e.target.value)}
                      className="vmd-input text-xs text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Laser Hatching</label>
                    <select
                      value={laserHatching}
                      onChange={(e) => setLaserHatching(e.target.value)}
                      className="vmd-input text-xs font-semibold"
                    >
                      <option value="Yes">Yes (Laser Assisted Hatching)</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Transfer Timing &amp; Embryo Grade</label>
                    <input
                      type="text"
                      value={qualityEmbryosTransferred}
                      onChange={(e) => setQualityEmbryosTransferred(e.target.value)}
                      className="vmd-input text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Vitrification Expiry</label>
                    <input
                      type="date"
                      value={vitrificationExpiry}
                      onChange={(e) => setVitrificationExpiry(e.target.value)}
                      className="vmd-input text-xs text-rose-700 font-bold bg-rose-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Renewal Notice Date</label>
                    <input
                      type="date"
                      value={renewalBefore}
                      onChange={(e) => setRenewalBefore(e.target.value)}
                      className="vmd-input text-xs text-amber-800 font-semibold bg-amber-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Transfer Observations &amp; Catheter Check</label>
                  <input
                    type="text"
                    value={transferComments}
                    onChange={(e) => setTransferComments(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>

              {/* Statutory Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Statutory Storage Disclaimer
                </span>
                <textarea
                  rows={2}
                  value={disclaimer}
                  onChange={(e) => setDisclaimer(e.target.value)}
                  className="vmd-input text-xs bg-white text-slate-800 w-full"
                />
              </div>

              {/* Image Upload Gallery */}
              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" /> 5. Microscopic Image Documentation
                  </h3>
                  <button
                    type="button"
                    onClick={addImageRow}
                    className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/15 rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Image
                  </button>
                </div>

                <div className="space-y-2">
                  {images.map((img) => (
                    <div key={img.id} className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="w-16 h-14 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                        {img.previewUrl ? (
                          <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFile(img.id, e)}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary"
                      />
                      <input
                        type="text"
                        value={img.description}
                        onChange={(e) => updateImageDesc(img.id, e.target.value)}
                        placeholder="Embryo stage, grade or annotation..."
                        className="vmd-input text-xs flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeImageRow(img.id)}
                        disabled={images.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Print Preview */
            <div className="max-w-4xl mx-auto bg-white p-8 border border-slate-300 rounded-lg shadow-sm space-y-6 text-slate-800 printable-document print:p-6 print:border-none">
              <PrintableReportHeader
                title="Embryology Laboratory Master Record"
                subtitle="VaidyaMD Embryology Suite · Complete Treatment Cycle Documentation"
                badge="EMBRYOLOGY RECORD"
                patient={{
                  name: patient?.name || 'Female Patient',
                  vid: patient?.vid,
                }}
                partner={partner?.name ? { name: partner.name } : undefined}
                doctor={{
                  name: consultantDoctor,
                }}
                metaFields={[
                  { label: 'Treatment Cycle ID', value: cycle?.cycle_id || '—' },
                  { label: 'Egg Collection Date', value: `${eggCollectionDate} ${eggCollectionTime}` },
                ]}
              />

              <div className="grid grid-cols-2 text-xs border border-slate-200 divide-x divide-y divide-slate-200 avoid-break">
                <div className="p-2.5 bg-slate-50 font-bold">Female Patient: <span className="font-normal">{patient?.name}</span></div>
                <div className="p-2.5 bg-slate-50 font-bold">VID: <span className="font-normal font-mono">{patient?.vid}</span></div>
                <div className="p-2.5">Male Partner: <span className="font-semibold">{partner?.name || 'Partner'}</span></div>
                <div className="p-2.5">Cycle ID: <span className="font-semibold">{cycle?.cycle_id}</span></div>
                <div className="p-2.5">Consultant: <span className="font-semibold">{consultantDoctor}</span></div>
                <div className="p-2.5">Egg Collection: <span className="font-semibold">{eggCollectionDate} {eggCollectionTime}</span></div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Oocytes Retrieved</span>
                  <strong className="text-xl text-pink-700">{noOfOocytes}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Oocytes Injected</span>
                  <strong className="text-xl text-primary">{oocytesInjected}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Fertilized (2PN)</span>
                  <strong className="text-xl text-emerald-700">{oocytesFertilized}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Embryos Transferred</span>
                  <strong className="text-xl text-purple-700">{embryosTransferred}</strong>
                </div>
              </div>

              <div className="text-xs space-y-2 border-t pt-3">
                <p><strong>Transfer Protocol:</strong> {dateDayTransfer}</p>
                <p><strong>Embryo Quality:</strong> {qualityEmbryosTransferred}</p>
                <p><strong>Vitrified Embryos:</strong> {embryosFrozen} in {noOfCryoleafs} cryoleaf(s) (Expires: {vitrificationExpiry})</p>
                <p><strong>Laser Hatching:</strong> {laserHatching}</p>
                <p><strong>Observations:</strong> {transferComments}</p>
              </div>

              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{embryologist1}</p>
                  <p className="text-slate-500">Primary Embryologist</p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="border-b border-slate-400 w-48 mb-1" />
                  <p className="font-bold text-slate-800">{embryologist2}</p>
                  <p className="text-slate-500">Witness Signatory</p>
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
                Master embryology record saved successfully!
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
              className="px-5 py-2 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Embryology Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
