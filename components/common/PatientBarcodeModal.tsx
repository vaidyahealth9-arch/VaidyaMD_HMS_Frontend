'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  Tag,
  Layers,
  Barcode as BarcodeIcon,
  Info,
  Grid,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FlaskConical,
  TestTube,
  CheckCircle2,
} from 'lucide-react';
import PatientBarcodeSticker, {
  StickerPreset,
  BarcodeFormat,
} from './PatientBarcodeSticker';
import {
  exportElementAsPng,
  generateZplCode,
  ZplPatientPayload,
} from '@/lib/barcodeUtils';
import { toast } from '@/contexts/ToastContext';

export interface PatientBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id?: string;
    name: string;
    vid: string;
    mrn?: string;
    age?: string | number;
    gender?: string;
    blood_group?: string;
    phone?: string;
    treating_doctor_name?: string;
    [key: string]: any;
  } | null;
  partner?: {
    name?: string;
    vid?: string;
    [key: string]: any;
  } | null;
  hospitalName?: string;
  branchName?: string;
  initialPreset?: StickerPreset;
  initialSampleType?: string;
  initialSampleId?: string;
  initialCopies?: number;
  initialMode?: 'desmat48' | 'roll';
}

const THERMAL_ROLL_PRESETS: {
  id: StickerPreset;
  name: string;
  dimensions: string;
  description: string;
  badge: string;
}[] = [
  {
    id: '50x25',
    name: '50 × 25 mm',
    dimensions: '50mm × 25mm',
    description: 'Pathology Blood Tubes, Serum Vials & Semen Sample Containers',
    badge: 'Standard Lab',
  },
  {
    id: '50x38',
    name: '50 × 38 mm',
    dimensions: '50mm × 38mm',
    description: 'Patient Wristbands, Daycare Bands & Physical EMR Case Covers',
    badge: 'Wristband & File',
  },
  {
    id: '75x50',
    name: '75 × 50 mm',
    dimensions: '75mm × 50mm',
    description: 'Large EMR Folder, IVF Master File & High-Density Barcode',
    badge: 'Master EMR',
  },
  {
    id: '38x25',
    name: '38 × 25 mm',
    dimensions: '38mm × 25mm',
    description: 'Cryo Straws, Microcentrifuge Tubes & Ultra-compact Vials',
    badge: 'Cryo & Micro',
  },
];

const SAMPLE_TYPE_PRESETS = [
  { label: 'General / File', value: '' },
  { label: 'EDTA Blood', value: 'EDTA Blood' },
  { label: 'Serum', value: 'Serum' },
  { label: 'Fluoride Sugar', value: 'Fluoride' },
  { label: 'Citrate Coag', value: 'Citrate' },
  { label: 'Semen Sample', value: 'Semen Sample' },
  { label: 'Urine', value: 'Urine' },
  { label: 'Follicular Fluid', value: 'Follicular' },
  { label: 'Biopsy / Tissue', value: 'Biopsy' },
  { label: 'Wristband', value: 'Wristband' },
];

const MULTI_TUBE_ROUTINE = [
  'EDTA Blood',
  'Serum',
  'Fluoride',
  'Citrate',
  'Urine',
  'General File',
  'EDTA Blood',
  'Serum',
];

const PHLEBOTOMY_GUIDE = [
  { color: 'bg-purple-500', name: 'Lavender (EDTA)', tests: 'CBC, HbA1c, ESR, Blood Group' },
  { color: 'bg-red-500', name: 'Red / Gold (Serum)', tests: 'LFT, KFT, Lipid, Hormones, Thyroid' },
  { color: 'bg-slate-400', name: 'Grey (Sodium Fluoride)', tests: 'Fasting / PP Blood Glucose' },
  { color: 'bg-sky-400', name: 'Light Blue (Citrate)', tests: 'PT / INR, APTT, D-Dimer' },
];

export default function PatientBarcodeModal({
  isOpen,
  onClose,
  patient,
  partner,
  hospitalName = 'VAIDYAMD HMS',
  branchName = 'Reproductive Health Centre',
  initialPreset = 'desmat48',
  initialSampleType = '',
  initialSampleId,
  initialCopies = 6,
  initialMode,
}: PatientBarcodeModalProps) {
  // Determine mode dynamically: default to desmat48 unless explicitly initialized with roll preset
  const determinedMode =
    initialMode || (initialPreset && !initialPreset.startsWith('desmat') ? 'roll' : 'desmat48');
  const [printMode, setPrintMode] = useState<'desmat48' | 'roll'>(determinedMode);

  // Desmat 48 Configuration
  const [startPosition, setStartPosition] = useState<number>(1);
  const [copies, setCopies] = useState<number>(initialCopies);
  const [sampleType, setSampleType] = useState<string>(initialSampleType);
  const [useMultiTubeSequence, setUseMultiTubeSequence] = useState<boolean>(false);
  const [sheetMemoryNotice, setSheetMemoryNotice] = useState<string | null>(null);

  // Calibration and Margins for Desmat 48 Sheet
  const [desmatPreset, setDesmatPreset] = useState<'standard' | 'compact' | 'custom'>('standard');
  const [topMargin, setTopMargin] = useState<number>(4.5);
  const [leftMargin, setLeftMargin] = useState<number>(8.0);
  const [labelWidth, setLabelWidth] = useState<number>(48.5);
  const [labelHeight, setLabelHeight] = useState<number>(24.0);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);

  // Thermal Roll Configuration
  const [rollPreset, setRollPreset] = useState<StickerPreset>(
    initialPreset === 'desmat48' || initialPreset === 'desmat48-compact' ? '50x25' : initialPreset
  );
  const [barcodeType, setBarcodeType] = useState<BarcodeFormat>('code128');
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [zplCopied, setZplCopied] = useState<boolean>(false);

  const previewStickerRef = useRef<HTMLDivElement>(null);

  // Load Smart Sheet Memory from localStorage on mount/open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const savedSlot = localStorage.getItem('vaidya_desmat48_last_slot');
      if (savedSlot) {
        const lastSlot = parseInt(savedSlot, 10);
        if (!isNaN(lastSlot) && lastSlot >= 1 && lastSlot < 48) {
          const nextSlot = lastSlot + 1;
          setStartPosition(nextSlot);
          const remaining = 48 - lastSlot;
          setSheetMemoryNotice(
            `Sheet Tracker: Last print ended at Slot #${lastSlot}. Pre-selected Slot #${nextSlot} (${remaining} stickers remaining).`
          );
        } else {
          setStartPosition(1);
          setSheetMemoryNotice(null);
        }
      }

      // Load saved calibration if any
      const savedCalib = localStorage.getItem('vaidya_desmat48_calibration');
      if (savedCalib) {
        const cal = JSON.parse(savedCalib);
        if (cal.topMargin !== undefined) setTopMargin(cal.topMargin);
        if (cal.leftMargin !== undefined) setLeftMargin(cal.leftMargin);
        if (cal.labelWidth !== undefined) setLabelWidth(cal.labelWidth);
        if (cal.labelHeight !== undefined) setLabelHeight(cal.labelHeight);
        if (cal.desmatPreset !== undefined) setDesmatPreset(cal.desmatPreset);
      }
    } catch {
      // Fallback silently if localStorage is restricted
    }
  }, [isOpen]);

  // Handle Preset Changes for Desmat
  const handlePresetSelect = (preset: 'standard' | 'compact') => {
    setDesmatPreset(preset);
    if (preset === 'standard') {
      setTopMargin(4.5);
      setLeftMargin(8.0);
      setLabelWidth(48.5);
      setLabelHeight(24.0);
    } else if (preset === 'compact') {
      setTopMargin(21.3);
      setLeftMargin(8.0);
      setLabelWidth(48.5);
      setLabelHeight(21.2);
    }
  };

  // Save Calibration to localStorage
  const handleSaveCalibration = () => {
    try {
      localStorage.setItem(
        'vaidya_desmat48_calibration',
        JSON.stringify({ desmatPreset, topMargin, leftMargin, labelWidth, labelHeight })
      );
      toast.success('Margins Saved', 'Desmat 48 sheet printer alignment saved for your browser.');
    } catch {
      // Ignore
    }
  };

  // Reset to Brand New Sheet (Slot 1)
  const handleResetToNewSheet = () => {
    setStartPosition(1);
    setSheetMemoryNotice('Reset to fresh A4 sheet starting at Slot #1.');
    try {
      localStorage.removeItem('vaidya_desmat48_last_slot');
    } catch {
      // Ignore
    }
  };

  // Helper to determine specimen tag per index (supports multi-tube set)
  const getSampleTagForIndex = (idx: number): string => {
    if (useMultiTubeSequence) {
      return MULTI_TUBE_ROUTINE[idx % MULTI_TUBE_ROUTINE.length];
    }
    return sampleType;
  };

  if (!isOpen || !patient) return null;

  // Print Handler
  const handlePrint = () => {
    if (printMode === 'desmat48') {
      const endSlot = Math.min(48, startPosition + copies - 1);
      try {
        if (endSlot >= 48) {
          localStorage.removeItem('vaidya_desmat48_last_slot');
        } else {
          localStorage.setItem('vaidya_desmat48_last_slot', endSlot.toString());
        }
      } catch {
        // Ignore
      }

      document.body.classList.add('is-printing-desmat48-sheet');
      const cleanup = () => {
        document.body.classList.remove('is-printing-desmat48-sheet');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(() => {
        window.print();
      }, 60);
    } else {
      document.body.classList.add('is-printing-barcode-roll');
      const cleanup = () => {
        document.body.classList.remove('is-printing-barcode-roll');
        window.removeEventListener('afterprint', cleanup);
      };
      window.addEventListener('afterprint', cleanup);
      setTimeout(() => {
        window.print();
      }, 60);
    }
  };

  // High Resolution (300 DPI) PNG Exporter for Bartender / ZebraDesigner
  const handleDownloadPng = async () => {
    if (!previewStickerRef.current) return;
    setIsExportingPng(true);
    try {
      const filename = `${patient.vid || 'barcode'}_${printMode === 'desmat48' ? 'desmat48' : rollPreset}_${sampleType || 'label'}`;
      await exportElementAsPng(previewStickerRef.current, filename, 3.5);
      toast.success('Sticker PNG Exported', `Saved 300 DPI sticker label as ${filename}.png`);
    } catch (err: any) {
      console.error('Failed to export sticker PNG', err);
      toast.error('PNG Export Failed', err.message || 'Error rasterizing label sticker');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Raw ZPL generation for Direct Zebra Socket
  const handleCopyZpl = () => {
    const payload: ZplPatientPayload = {
      hospitalName,
      patientName: patient.name,
      vid: patient.vid,
      ageGender: [
        patient.age ? `${patient.age}y` : '',
        patient.gender ? patient.gender.toUpperCase() : '',
      ].filter(Boolean).join(' / '),
      bloodGroup: patient.blood_group,
      sampleType,
      partnerName: partner?.name,
    };

    const zpl = generateZplCode(payload, rollPreset === 'desmat48' || rollPreset === 'desmat48-compact' ? '50x25' : rollPreset);
    navigator.clipboard.writeText(zpl);
    setZplCopied(true);
    toast.success('ZPL Code Copied', 'Raw Zebra Programming Language code copied to clipboard for direct thermal printing.');
    setTimeout(() => setZplCopied(false), 3000);
  };

  // Calculations for sheet status
  const endPosition = Math.min(48, startPosition + copies - 1);
  const remainingSlotsOnSheet = Math.max(0, 48 - endPosition);
  const isOverflowingSheet = startPosition + copies - 1 > 48;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:static print:bg-transparent print:overflow-visible print:block print:w-full print:h-auto"
    >
      {/* 
        MODAL CONTAINER:
        Strictly fixed height (h-[90vh] max-h-[760px]) so toggling between
        Desmat 48 and Thermal Roll NEVER pops or shifts dimension.
      */}
      <div className="bg-white w-full max-w-5xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[760px] my-auto print:hidden">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>VaidyaMD Barcode &amp; Label Studio</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded">
                  {patient.vid}
                </span>
                {initialSampleId && (
                  <span className="text-[10px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 px-1.5 py-0.5 rounded">
                    Sample: {initialSampleId}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {patient.name} {patient.gender ? `(${patient.gender})` : ''} · Standard hospital sticker generation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-2 flex items-center justify-between flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPrintMode('desmat48')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                printMode === 'desmat48'
                  ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Desmat 48 A4 Sheet (4 × 12)</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                Zero Wastage A4
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('roll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                printMode === 'roll'
                  ? 'bg-white text-primary shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Continuous Thermal Roll</span>
              <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                Zebra / TSC Roll
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            {printMode === 'desmat48' ? (
              <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 text-amber-800 px-2 py-0.5 rounded-md text-[10.5px]">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Slot #{startPosition} &rarr; #{endPosition} ({remainingSlotsOnSheet} remaining)</span>
              </span>
            ) : (
              <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md text-[10.5px] font-mono">
                Continuous Roll Feed (203 / 300 DPI)
              </span>
            )}
          </div>
        </div>

        {/* Modal Body: Consistent Split-Screen (7 cols controls : 5 cols visual map/preview) */}
        <div className="flex-1 overflow-hidden p-4 sm:p-5 bg-slate-50/60">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full">
            {/* ═════════════════════════════════════════════════════════════
                LEFT COLUMN (7 cols): Configuration & Easy Access Tools
                ═════════════════════════════════════════════════════════════ */}
            <div className="md:col-span-7 flex flex-col h-full overflow-y-auto pr-1 space-y-3.5">
              {printMode === 'desmat48' ? (
                <>
                  {/* Smart Sheet Memory Alert if resuming */}
                  {sheetMemoryNotice && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between gap-2 text-xs text-amber-900">
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="truncate text-[11px]">{sheetMemoryNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetToNewSheet}
                        className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded flex-shrink-0"
                      >
                        Reset to Slot #1
                      </button>
                    </div>
                  )}

                  {/* Starting Slot & Quantity Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Starting Slot Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Starting Sticker Slot</label>
                          <span className="text-[10px] font-mono text-slate-400">1 to 48</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setStartPosition((prev) => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={48}
                            value={startPosition}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) setStartPosition(Math.min(48, Math.max(1, val)));
                            }}
                            className="w-full text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded h-8 px-1 focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setStartPosition((prev) => Math.min(48, prev + 1))}
                            className="w-8 h-8 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Number of Copies */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Quantity to Print</label>
                          <span className="text-[10px] text-slate-400">Stickers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setCopies((prev) => Math.max(1, prev - 1))}
                            className="w-8 h-8 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={48}
                            value={copies}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) setCopies(Math.min(48, Math.max(1, val)));
                            }}
                            className="w-full text-center font-mono font-bold text-sm bg-white border border-slate-200 rounded h-8 px-1 focus:outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setCopies((prev) => Math.min(48, prev + 1))}
                            className="w-8 h-8 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Quantity Chips */}
                    <div className="flex items-center gap-1">
                      {[
                        { label: '4 (1 Row)', val: 4 },
                        { label: '8 (2 Rows)', val: 8 },
                        { label: '10', val: 10 },
                        { label: '12 (3 Rows)', val: 12 },
                        { label: 'Fill Sheet', val: Math.max(1, 48 - startPosition + 1) },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setCopies(item.val)}
                          className={`flex-1 py-1 rounded text-[10px] font-bold border transition-colors ${
                            copies === item.val
                              ? 'bg-primary text-white border-primary'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Row Navigation Bar */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-slate-700">Quick Row Jump:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setStartPosition((prev) => Math.max(1, prev - 4))}
                            className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-0.5"
                          >
                            <ChevronLeft className="w-3 h-3" />
                            <span>-1 Row</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setStartPosition((prev) => Math.min(45, prev + 4))}
                            className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-0.5"
                          >
                            <span>+1 Row</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {[1, 5, 9, 13, 17, 21, 25, 29, 33, 37, 41, 45].map((rowStartSlot, idx) => (
                          <button
                            key={rowStartSlot}
                            type="button"
                            onClick={() => setStartPosition(rowStartSlot)}
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border transition-colors ${
                              startPosition === rowStartSlot
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            R{idx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Specimen Tagging & Multi-Tube Routine Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-primary" />
                        <span>Specimen Tagging</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseMultiTubeSequence(!useMultiTubeSequence)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                          useMultiTubeSequence
                            ? 'bg-primary text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {useMultiTubeSequence ? '✓ Multi-Tube Set Active' : 'Routine Multi-Tube Set?'}
                      </button>
                    </div>

                    {useMultiTubeSequence ? (
                      <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg text-[10.5px] text-blue-900">
                        <span className="font-bold block mb-1">Automated Consecutive Lab Tube Sequence:</span>
                        <div className="flex flex-wrap gap-1">
                          {['#1: EDTA', '#2: Serum', '#3: Fluoride', '#4: Citrate', '#5: Urine', '#6: File'].map((tag) => (
                            <span key={tag} className="font-mono bg-white text-blue-900 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1">
                          {SAMPLE_TYPE_PRESETS.slice(0, 8).map((tag) => (
                            <button
                              key={tag.value}
                              type="button"
                              onClick={() => setSampleType(tag.value)}
                              className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-colors ${
                                sampleType === tag.value
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {tag.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Or enter custom specimen type (e.g. Follicular Aspirate, Semen)..."
                          value={sampleType}
                          onChange={(e) => setSampleType(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                        />
                      </>
                    )}
                  </div>

                  {/* Calibration & Printer Alignment Drawer */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setShowCalibration(!showCalibration)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900"
                    >
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                        <span>Desmat Sheet Printer Calibration (Tray Offsets)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {showCalibration ? 'Hide ▲' : 'Tune Margins ▼'}
                      </span>
                    </button>

                    {showCalibration && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePresetSelect('standard')}
                            className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                              desmatPreset === 'standard'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            Standard 48 (24mm)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePresetSelect('compact')}
                            className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                              desmatPreset === 'compact'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          Compact 48 (21.2mm)
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Top Margin (mm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={topMargin}
                            onChange={(e) => setTopMargin(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Left Margin (mm)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={leftMargin}
                            onChange={(e) => setLeftMargin(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveCalibration}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold"
                        >
                          Save Calibration
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ── THERMAL ROLL LEFT CONTROLS ── */
              <>
                {/* Thermal Sizing Presets */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Thermal Sticker Size Preset</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {THERMAL_ROLL_PRESETS.map((cfg) => {
                      const isSelected = rollPreset === cfg.id;
                      return (
                        <button
                          key={cfg.id}
                          type="button"
                          onClick={() => setRollPreset(cfg.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all relative ${
                            isSelected
                              ? 'bg-white border-primary shadow-xs ring-1 ring-primary'
                              : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{cfg.name}</span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs ${
                                isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {cfg.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 leading-tight">
                            {cfg.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Thermal Specimen Tagging */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-primary" />
                    <span>Specimen Tag / Purpose</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {SAMPLE_TYPE_PRESETS.slice(0, 8).map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => setSampleType(tag.value)}
                        className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-colors ${
                          sampleType === tag.value
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Or enter custom specimen type (e.g. Follicular Aspirate, Semen)..."
                    value={sampleType}
                    onChange={(e) => setSampleType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Print Quantity Card */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Print Label Quantity</span>
                      <span className="text-[10px] text-slate-500">Stickers to feed from continuous roll</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 5, 8, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCopies(n)}
                          className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center border transition-all ${
                            copies === n
                              ? 'bg-primary text-white border-primary shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Thermal Utilities Easy Access */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyZpl}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5"
                      title="Copy raw Zebra ZPL commands for raw printer socket"
                    >
                      {zplCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{zplCopied ? 'Copied ZPL!' : 'Copy Raw ZPL'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPng}
                      disabled={isExportingPng}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      title="Download 300 DPI PNG label graphic for Bartender / ZebraDesigner"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isExportingPng ? 'Exporting...' : 'PNG (300 DPI)'}</span>
                    </button>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    Code 128 ISO/IEC
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════════
              RIGHT COLUMN (5 cols): Live Visual Map or Thermal Preview
              ═════════════════════════════════════════════════════════════ */}
          <div className="md:col-span-5 flex flex-col h-full overflow-hidden bg-slate-100/80 p-3.5 rounded-xl border border-slate-200/80">
            {printMode === 'desmat48' ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Visual Map Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-slate-800">4×12 A4 Sheet Map</span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 text-[9.5px]">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-xs bg-slate-300 border border-slate-400 inline-block"></span>
                      <span>Peeled</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-900 font-bold">
                      <span className="w-2 h-2 rounded-xs bg-amber-400 border border-amber-500 inline-block"></span>
                      <span>Print ({copies})</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-xs bg-white border border-dashed border-slate-300 inline-block"></span>
                      <span>Empty</span>
                    </span>
                  </div>
                </div>

                {/* 4x12 Sheet Visual Grid */}
                <div className="flex-1 overflow-y-auto my-2 pr-1">
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 48 }).map((_, idx) => {
                      const slot = idx + 1;
                      const row = Math.floor(idx / 4) + 1;
                      const col = (idx % 4) + 1;

                      const isSkipped = slot < startPosition;
                      const isActive = slot >= startPosition && slot <= endPosition;

                      const activeLabelNumber = isActive ? slot - startPosition + 1 : null;
                      const activeLabelTag = isActive ? getSampleTagForIndex(slot - startPosition) : '';

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setStartPosition(slot)}
                          className={`p-1 rounded border text-left transition-all relative flex flex-col justify-between h-[36px] ${
                            isActive
                              ? 'bg-amber-400/25 border-amber-500 shadow-2xs ring-1 ring-amber-400'
                              : isSkipped
                              ? 'bg-slate-200/80 border-slate-300 opacity-60 hover:opacity-100'
                              : 'bg-white border-dashed border-slate-300 hover:border-primary hover:bg-blue-50/60'
                          }`}
                          title={
                            isSkipped
                              ? `Slot #${slot} (R${row} C${col}) - Peeled. Click to start here.`
                              : isActive
                              ? `Slot #${slot} - Printing #${activeLabelNumber} (${activeLabelTag || patient.vid})`
                              : `Slot #${slot} (R${row} C${col}) - Clean. Click to start here.`
                          }
                        >
                          <div className="flex items-center justify-between w-full leading-none">
                            <span
                              className={`text-[9px] font-mono font-bold ${
                                isActive ? 'text-amber-950 font-black' : isSkipped ? 'text-slate-400' : 'text-slate-700'
                              }`}
                            >
                              #{slot}
                            </span>
                            <span className="text-[7.5px] font-mono text-slate-400">
                              R{row}C{col}
                            </span>
                          </div>

                          <div className="w-full truncate text-[8px] leading-none mt-0.5">
                            {isActive ? (
                              <span className="font-bold text-amber-950 truncate block">
                                #{activeLabelNumber} {activeLabelTag ? `· ${activeLabelTag}` : ''}
                              </span>
                            ) : isSkipped ? (
                              <span className="text-slate-400 italic">Peeled</span>
                            ) : (
                              <span className="text-slate-400">+ Clean</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Miniature Footprint Scaled Preview Box */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-shrink-0 bg-white/60 p-2 rounded-lg">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                      Single Sticker Output (1:1)
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      Exact Desmat cell: 48.5 × 24 mm
                    </span>
                  </div>

                  <div className="flex-shrink-0">
                    <div ref={previewStickerRef} className="shadow-xs bg-white">
                      <PatientBarcodeSticker
                        patient={patient}
                        partner={partner}
                        hospitalName={hospitalName}
                        branchName={branchName}
                        preset="desmat48"
                        sampleType={sampleType}
                        sampleId={initialSampleId}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── THERMAL ROLL RIGHT PREVIEW & EASY ACCESS GUIDE ── */
              <div className="flex flex-col h-full justify-between overflow-hidden">
                <div className="w-full text-center pb-2 border-b border-slate-200/80 flex-shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                    Thermal Sticker Live Preview (1:1 Aspect)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Exact thermal footprint: {rollPreset.replace('x', 'mm × ')}mm
                  </span>
                </div>

                {/* Scaled Sticker Preview in Center */}
                <div className="flex items-center justify-center my-auto py-2 flex-shrink-0">
                  <div ref={previewStickerRef} className="shadow-md rounded-xs bg-white">
                    <PatientBarcodeSticker
                      patient={patient}
                      partner={partner}
                      hospitalName={hospitalName}
                      branchName={branchName}
                      preset={rollPreset}
                      barcodeType={barcodeType}
                      sampleType={sampleType}
                      sampleId={initialSampleId}
                    />
                  </div>
                </div>

                {/* Easy Access: Phlebotomy Color & Specimen Reference Guide */}
                <div className="bg-white/90 p-2.5 rounded-lg border border-slate-200 space-y-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-800">
                    <TestTube className="w-3.5 h-3.5 text-primary" />
                    <span>Quick Phlebotomy Vacutainer Reference</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9.5px]">
                    {PHLEBOTOMY_GUIDE.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 bg-slate-50 p-1 rounded border border-slate-100">
                        <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`}></span>
                        <div className="truncate leading-tight">
                          <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                          <span className="text-slate-500 text-[8.5px] block truncate">{item.tests}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 text-[11px] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {printMode === 'desmat48'
                  ? 'Desmat 48 (4×12) Zero-Wastage Sheet Mode'
                  : 'Zebra / TSC Continuous Roll Mode'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>
                {printMode === 'desmat48'
                  ? `Print ${copies} Stickers (Slots #${startPosition} → #${endPosition})`
                  : `Print ${copies} ${copies === 1 ? 'Sticker' : 'Stickers'}`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRINTABLE DESMAT 48 A4 SHEET OUTPUT:
          Rendered ONLY when printMode === 'desmat48'.
          Hidden on screen via Tailwind's hidden, displayed in @media print
          via print:block and body.is-printing-desmat48-sheet.
          Empty slots are completely invisible so printer skips peeled areas.
      ───────────────────────────────────────────────────────────── */}
      {printMode === 'desmat48' ? (
        <div className="desmat48-print-sheet hidden print:block">
          <div
            className="desmat48-a4-page"
            style={{
              width: '210mm',
              height: '297mm',
              paddingTop: `${topMargin}mm`,
              paddingLeft: `${leftMargin}mm`,
              paddingRight: `${leftMargin}mm`,
              paddingBottom: `${topMargin}mm`,
              display: 'grid',
              gridTemplateColumns: `repeat(4, ${labelWidth}mm)`,
              gridTemplateRows: `repeat(12, ${labelHeight}mm)`,
              boxSizing: 'border-box',
            }}
          >
            {Array.from({ length: 48 }).map((_, idx) => {
              const slotNumber = idx + 1;
              const isActive = slotNumber >= startPosition && slotNumber <= endPosition;

              if (!isActive) {
                return (
                  <div
                    key={slotNumber}
                    className="desmat-cell desmat-cell-empty"
                    style={{
                      width: `${labelWidth}mm`,
                      height: `${labelHeight}mm`,
                      boxSizing: 'border-box',
                    }}
                  />
                );
              }

              const labelIndex = slotNumber - startPosition;
              const currentSampleTag = getSampleTagForIndex(labelIndex);

              return (
                <div
                  key={slotNumber}
                  className="desmat-cell desmat-cell-active"
                  style={{
                    width: `${labelWidth}mm`,
                    height: `${labelHeight}mm`,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  <PatientBarcodeSticker
                    patient={patient}
                    partner={partner}
                    hospitalName={hospitalName}
                    branchName={branchName}
                    preset="desmat48"
                    sampleType={currentSampleTag}
                    sampleId={initialSampleId}
                    className="print-sticker-element"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            PRINTABLE CONTINUOUS THERMAL ROLL OUTPUT:
            Rendered ONLY when printMode === 'roll'.
        ───────────────────────────────────────────────────────────── */
        <div className="barcode-sticker-print hidden print:block">
          {Array.from({ length: copies }).map((_, idx) => (
            <div key={idx} className="barcode-sticker-page-wrapper">
              <PatientBarcodeSticker
                patient={patient}
                partner={partner}
                hospitalName={hospitalName}
                branchName={branchName}
                preset={rollPreset}
                barcodeType={barcodeType}
                sampleType={sampleType}
                sampleId={initialSampleId}
                className="print-sticker-element"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
