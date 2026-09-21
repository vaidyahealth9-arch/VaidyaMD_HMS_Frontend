'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Activity,
  Microscope,
  ShieldCheck,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Eye,
  Scissors,
  Check,
} from 'lucide-react';
import { andrologyApi } from '@/lib/api';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

export interface SurgicalSpermRetrievalModalProps {
  patient: any;
  activeCycle?: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SurgicalSpermRetrievalModal({
  patient,
  activeCycle,
  onClose,
  onSaved,
}: SurgicalSpermRetrievalModalProps) {
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [usePrePrintedPad, setUsePrePrintedPad] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Procedure Details
  const [procedureType, setProcedureType] = useState('TESA');
  const [procedureDate, setProcedureDate] = useState(new Date().toISOString().split('T')[0]);
  const [indication, setIndication] = useState('');
  const [laterality, setLaterality] = useState('');
  const [anesthesia, setAnesthesia] = useState('');
  const [surgeonName, setSurgeonName] = useState('');
  const [needleType, setNeedleType] = useState('');
  const [aspirateVolume, setAspirateVolume] = useState('');
  const [tissueAppearance, setTissueAppearance] = useState('');

  // Embryology Screening
  const [screeningEmbryologist, setScreeningEmbryologist] = useState('');
  const [searchTimeMin, setSearchTimeMin] = useState('');
  const [spermFound, setSpermFound] = useState<'yes_motile' | 'yes_twitching' | 'immotile' | 'none'>('none');
  const [motilityGrade, setMotilityGrade] = useState('');
  const [countEstimate, setCountEstimate] = useState('');
  const [morphologyImpression, setMorphologyImpression] = useState('');

  // Downstream Clinical Disposition
  const [disposition, setDisposition] = useState<'ICSI_TODAY' | 'CRYOPRESERVED' | 'DISCARDED'>('ICSI_TODAY');
  const [strawsVitrified, setStrawsVitrified] = useState('0');
  const [cryoLocation, setCryoLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        patient_id: patient.id,
        procedure_type: procedureType,
        procedure_date: procedureDate,
        indication,
        laterality,
        anesthesia,
        surgeon_name: surgeonName,
        needle_type: needleType,
        aspirate_volume_ml: parseFloat(aspirateVolume) || 0,
        tissue_appearance: tissueAppearance,
        screening_embryologist: screeningEmbryologist,
        search_time_min: parseInt(searchTimeMin, 10) || 0,
        sperm_found_status: spermFound,
        motility_grade: motilityGrade,
        count_estimate: countEstimate,
        morphology_impression: morphologyImpression,
        disposition,
        straws_vitrified: disposition === 'CRYOPRESERVED' ? parseInt(strawsVitrified, 10) : 0,
        cryo_location: disposition === 'CRYOPRESERVED' ? cryoLocation : null,
        operative_notes: notes,
        linked_cycle_id: activeCycle?.id || null,
      };

      await andrologyApi.saveSurgicalRetrieval(payload);
      setSaveSuccess(true);
      onSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save surgical sperm retrieval report:', err);
      alert(err.message || 'Failed to save surgical retrieval report');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70  z-50 flex items-center justify-center p-3 sm:p-6 print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none">
        {/* Header Bar */}
        <div className="bg-primary text-white px-6 py-4 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/100/20 text-accent flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Surgical Sperm Retrieval Operative Record</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/100/20 border border-white/20 text-white">
                  {procedureType}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Patient: <strong>{patient?.name || 'Male Patient'}</strong> ({patient?.vid}) {activeCycle ? `· Linked Cycle: ${activeCycle.cycle_id}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'form' ? 'preview' : 'form')}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              {viewMode === 'form' ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Report</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit Form</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('preview');
                setTimeout(() => window.print(), 100);
              }}
              className="px-3 py-1.5 rounded-md bg-[rgb(var(--clr-primary))] hover:opacity-90 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-sm"
              title="Print Operative Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:overflow-visible print:p-0">
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Surgical sperm retrieval operative record and embryology assessment saved!</span>
            </div>
          )}

          {viewMode === 'form' ? (
            <div className="space-y-6">
              {/* SECTION 1: Operative & Surgical Protocol */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Scissors className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                  <h3 className="font-bold text-sm text-slate-900">1. Surgical Procedure &amp; Anesthesia</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Procedure Method *</label>
                    <select
                      value={procedureType}
                      onChange={(e) => setProcedureType(e.target.value)}
                      className="vmd-input text-xs w-full font-bold text-slate-800"
                    >
                      <option value="TESA">TESA (Testicular Sperm Aspiration)</option>
                      <option value="PESA">PESA (Percutaneous Epididymal Sperm Aspiration)</option>
                      <option value="Micro-TESE">Micro-TESE (Microsurgical Testicular Extraction)</option>
                      <option value="TESE">Open Testicular Biopsy / TESE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Procedure Date *</label>
                    <input
                      type="date"
                      value={procedureDate}
                      onChange={(e) => setProcedureDate(e.target.value)}
                      className="vmd-input text-xs w-full font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication</label>
                    <input
                      type="text"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Laterality / Side</label>
                    <select
                      value={laterality}
                      onChange={(e) => setLaterality(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="">Select Laterality...</option>
                      <option value="Right Testis">Right Testis</option>
                      <option value="Left Testis">Left Testis</option>
                      <option value="Bilateral (Right + Left)">Bilateral (Right + Left)</option>
                      <option value="Right Epididymis">Right Epididymis (Caput)</option>
                      <option value="Left Epididymis">Left Epididymis (Caput)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Anesthesia Type</label>
                    <select
                      value={anesthesia}
                      onChange={(e) => setAnesthesia(e.target.value)}
                      className="vmd-input text-xs w-full"
                    >
                      <option value="">Select Anesthesia...</option>
                      <option value="Local Cord Block + Sedation">Local Cord Block + Sedation</option>
                      <option value="Local Infiltration (Lidocaine 2%)">Local Infiltration only</option>
                      <option value="General Anesthesia (GA)">General Anesthesia (GA)</option>
                      <option value="Spinal Anesthesia">Spinal Anesthesia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Operating Andrologist / Surgeon</label>
                    <input
                      type="text"
                      value={surgeonName}
                      onChange={(e) => setSurgeonName(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Aspirate Volume (mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={aspirateVolume}
                      onChange={(e) => setAspirateVolume(e.target.value)}
                      className="vmd-input text-xs w-full font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tissue / Tubule Macroscopic Appearance</label>
                    <input
                      type="text"
                      value={tissueAppearance}
                      onChange={(e) => setTissueAppearance(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Embryology Wet-Prep Screening */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Microscope className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">2. Embryology Laboratory Wet-Preparation Screening</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Screening Embryologist</label>
                    <input
                      type="text"
                      value={screeningEmbryologist}
                      onChange={(e) => setScreeningEmbryologist(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Search Duration (mins)</label>
                    <input
                      type="number"
                      value={searchTimeMin}
                      onChange={(e) => setSearchTimeMin(e.target.value)}
                      className="vmd-input text-xs w-full font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Spermatozoa Verification Result *</label>
                    <select
                      value={spermFound}
                      onChange={(e) => setSpermFound(e.target.value as any)}
                      className={`vmd-input text-xs w-full font-bold ${
                        spermFound === 'yes_motile' || spermFound === 'yes_twitching'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                          : 'text-rose-700 bg-rose-50 border-rose-300'
                      }`}
                    >
                      <option value="yes_motile">Motile Spermatozoa Observed (Progressive)</option>
                      <option value="yes_twitching">Twitching / In-situ Flagellar Movement Observed</option>
                      <option value="immotile">Non-Motile Spermatozoa Only</option>
                      <option value="none">Complete Azoospermia (0 Spermatozoa found)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Motility Characteristic</label>
                    <input
                      type="text"
                      value={motilityGrade}
                      onChange={(e) => setMotilityGrade(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Yield / Count Estimate</label>
                    <input
                      type="text"
                      value={countEstimate}
                      onChange={(e) => setCountEstimate(e.target.value)}
                      className="vmd-input text-xs w-full font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Morphology Impression</label>
                    <input
                      type="text"
                      value={morphologyImpression}
                      onChange={(e) => setMorphologyImpression(e.target.value)}
                      className="vmd-input text-xs w-full"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Clinical Disposition & Cryopreservation */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-4.5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                  <Activity className="w-4 h-4 text-[rgb(var(--clr-primary))]" />
                  <h3 className="font-bold text-sm text-slate-900">3. Sample Allocation &amp; Downstream Disposition</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Allocation *</label>
                    <select
                      value={disposition}
                      onChange={(e) => setDisposition(e.target.value as any)}
                      className="vmd-input text-xs w-full font-bold text-slate-800"
                    >
                      <option value="ICSI_TODAY">Direct ICSI Injection (Today OPU Cycle)</option>
                      <option value="CRYOPRESERVED">Cryopreserved / Vitrified for Future Cycle</option>
                      <option value="DISCARDED">Discarded (Insufficient / Non-viable)</option>
                    </select>
                  </div>

                  {disposition === 'CRYOPRESERVED' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Number of Straws Frozen</label>
                        <input
                          type="number"
                          value={strawsVitrified}
                          onChange={(e) => setStrawsVitrified(e.target.value)}
                          className="vmd-input text-xs w-full font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Storage Coordinates</label>
                        <input
                          type="text"
                          value={cryoLocation}
                          onChange={(e) => setCryoLocation(e.target.value)}
                          className="vmd-input text-xs w-full font-mono"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Additional Surgical & Histopathology Audit */}
                <div className="pt-3 border-t border-slate-200/60">
                  <details className="group">
                    <summary className="text-xs font-bold text-slate-600 cursor-pointer flex items-center justify-between hover:text-slate-900 py-1">
                      <span>Advanced Operative Details, Histopathology &amp; Complications Audit</span>
                      <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Tissue Processing Method</label>
                        <select defaultValue="Mechanical mincing" className="vmd-input text-xs w-full">
                          <option value="Mechanical mincing">Mechanical mincing with sterile needles</option>
                          <option value="Mechanical dispersion">Mechanical dispersion &amp; centrifugation</option>
                          <option value="Density gradient">Density gradient separation</option>
                          <option value="Direct use">Direct stereomicroscopic search</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Complications / Hemostasis</label>
                        <select defaultValue="None" className="vmd-input text-xs w-full">
                          <option value="None">None (Uneventful recovery)</option>
                          <option value="Minimal Bleeding">Minimal bleeding controlled by pressure</option>
                          <option value="Hematoma">Scrotal hematoma managed conservatively</option>
                          <option value="Pain">Mild to moderate pain, analgesics administered</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Dual Witness Verification</label>
                        <input type="text" defaultValue="Witness Embryologist & Doctor" className="vmd-input text-xs w-full" />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Histopathology / Biopsy Specimen Notes</label>
                        <textarea
                          rows={2}
                          defaultValue="Tubular fragments sent for histopathological evaluation of spermatogenesis (Johnsen score assessment)."
                          className="vmd-input text-xs w-full"
                        />
                      </div>
                    </div>
                  </details>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Operative Summary &amp; Patient Instructions</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="vmd-input text-xs w-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* PREVIEW MODE: Printable Operative Report */
            <div className="printable-document bg-white border border-slate-300 rounded-lg p-6 sm:p-8 max-w-4xl mx-auto space-y-6 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0">
              <PrintableReportHeader
                title={`SURGICAL SPERM RETRIEVAL (${procedureType}) REPORT`}
                subtitle="VaidyaMD Andrology & Reproductive Surgery • Operative & Embryology Assessment"
                hideHospitalHeader={usePrePrintedPad}
                onTogglePrePrintedPad={() => setUsePrePrintedPad(!usePrePrintedPad)}
                patient={{
                  name: patient?.name,
                  vid: patient?.vid,
                  age: patient?.age,
                  gender: 'Male',
                  partner_name: activeCycle?.patient_name || patient?.partner_name,
                }}
                metaFields={[
                  { label: 'Procedure', value: `${procedureType} (${laterality})` },
                  { label: 'Date', value: procedureDate },
                  { label: 'Indication', value: indication },
                  { label: 'Surgeon', value: surgeonName },
                ]}
              />

              {/* Surgical Protocol */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                  Surgical Operative Findings
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Procedure:</span>
                    <strong>{procedureType} ({laterality})</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Operating Surgeon:</span>
                    <strong>{surgeonName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Aspirate Volume:</span>
                    <strong className="font-mono">{aspirateVolume} mL</strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block text-[10px]">Tissue Description:</span>
                    <p className="font-medium text-slate-800">{tissueAppearance}</p>
                  </div>
                </div>
              </div>

              {/* Embryology Search Results */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1">
                  Embryology Laboratory Search &amp; Viability
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Search Duration:</span>
                    <strong>{searchTimeMin} mins</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spermatozoa Observed:</span>
                    <strong className="text-emerald-700 font-bold">
                      {spermFound === 'yes_motile' ? 'Motile Sperm Present' : spermFound === 'yes_twitching' ? 'Twitching Sperm Present' : 'None'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Yield / Count:</span>
                    <strong>{countEstimate}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block text-[10px]">Downstream Allocation:</span>
                    <strong className="text-slate-800">
                      {disposition === 'ICSI_TODAY'
                        ? 'Allocated for direct ICSI today'
                        : `Vitrified (${strawsVitrified} Straws in ${cryoLocation})`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 flex items-end justify-between text-xs text-slate-700">
                <div>
                  <div className="border-t border-slate-400 pt-1 w-48 font-bold text-center">
                    {screeningEmbryologist}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Clinical Andrologist / Embryologist</p>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-1 w-48 font-bold text-center">
                    {surgeonName}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Consultant Urologist / Andrologist</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between flex-shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-md transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[rgb(var(--clr-primary))] hover:opacity-90 text-white font-bold text-xs rounded-md shadow-md shadow-primary/20 transition-all flex items-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Save Surgical Retrieval Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
