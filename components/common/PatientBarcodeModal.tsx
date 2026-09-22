'use client';

import React, { useState, useRef } from 'react';
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
}

const PRESET_CONFIGS: {
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
  { label: 'Semen Sample', value: 'Semen Sample' },
  { label: 'Follicular Fluid', value: 'Follicular Fluid' },
  { label: 'Wristband', value: 'Wristband' },
  { label: 'Biopsy / Tissue', value: 'Biopsy' },
  { label: 'Urine', value: 'Urine' },
];

export default function PatientBarcodeModal({
  isOpen,
  onClose,
  patient,
  partner,
  hospitalName = 'VAIDYAMD HMS',
  branchName = 'Reproductive Health Centre',
  initialPreset = '50x25',
  initialSampleType = '',
}: PatientBarcodeModalProps) {
  const [preset, setPreset] = useState<StickerPreset>(initialPreset);
  const [barcodeType, setBarcodeType] = useState<BarcodeFormat>('code128');
  const [sampleType, setSampleType] = useState<string>(initialSampleType);
  const [copies, setCopies] = useState<number>(2);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);
  const [zplCopied, setZplCopied] = useState<boolean>(false);

  const previewStickerRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !patient) return null;

  // Print handler specifically structured for Continuous Thermal Roll Label Printers
  const handlePrint = () => {
    // Add print trigger class to body
    document.body.classList.add('is-printing-barcode-roll');
    const cleanup = () => {
      document.body.classList.remove('is-printing-barcode-roll');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  // High Resolution (300 DPI) PNG Exporter for ZebraDesigner / Bartender
  const handleDownloadPng = async () => {
    if (!previewStickerRef.current) return;
    setIsExportingPng(true);
    try {
      const filename = `${patient.vid || 'barcode'}_${preset}_${sampleType || 'label'}`;
      await exportElementAsPng(previewStickerRef.current, filename, 3.5);
      toast.success('Sticker PNG Exported', `Saved 300 DPI sticker label as ${filename}.png`);
    } catch (err: any) {
      console.error('Failed to export sticker PNG', err);
      toast.error('PNG Export Failed', err.message || 'Error rasterizing label sticker');
    } finally {
      setIsExportingPng(false);
    }
  };

  // Raw ZPL generation for Direct Zebra Socket / COM Port
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

    const zpl = generateZplCode(payload, preset);
    navigator.clipboard.writeText(zpl);
    setZplCopied(true);
    toast.success('ZPL Code Copied', 'Raw Zebra Programming Language code copied to clipboard for direct thermal printing.');
    setTimeout(() => setZplCopied(false), 3000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:static print:bg-transparent print:overflow-visible"
    >
      {/* Modal Container */}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:hidden">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Patient Thermal Barcode &amp; Sticker Studio</span>
                <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-xs">
                  {patient.vid}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {patient.name} {patient.gender ? `(${patient.gender})` : ''} · Standard thermal roll presets (Zebra, TSC, TVS, Dymo)
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

        {/* Modal Body: Split into Settings & Live Scaled Preview */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-slate-50/50">
          {/* Left Column: Customization Controls (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            {/* 1. Preset Sizing */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Thermal Sticker Size Preset</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_CONFIGS.map((cfg) => {
                  const isSelected = preset === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => setPreset(cfg.id)}
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
                            isSelected
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-600'
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

            {/* 2. Barcode Format Info */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <BarcodeIcon className="w-3.5 h-3.5 text-primary" />
                <span>Symbology: <strong>Standard Code 128 (1D Barcode)</strong></span>
              </span>
              <span className="text-[10px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                ISO/IEC 15417
              </span>
            </div>

            {/* 3. Sample Type Quick Tags */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span>Specimen Tag / Purpose</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Optional tag on label</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TYPE_PRESETS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => setSampleType(tag.value)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors ${
                      sampleType === tag.value
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
              {/* Custom input */}
              <div className="mt-1.5">
                <input
                  type="text"
                  placeholder="Or enter custom specimen type (e.g. Follicular Aspirate, Oocyte Dish)..."
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* 4. Number of Copies */}
            <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Print Label Quantity</span>
                <span className="text-[10px] text-slate-500">Number of stickers to feed from continuous roll</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5, 8].map((n) => (
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

          {/* Right Column: Live Scaled Visual Preview (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-between bg-slate-100 p-4 rounded-xl border border-slate-200/80">
            <div className="w-full text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Thermal Sticker Preview (1:1 Aspect)
              </span>
              <span className="text-[10px] text-slate-400 block mb-4">
                Exact thermal head footprint: {preset.replace('x', 'mm × ')}mm
              </span>
            </div>

            {/* Render single sticker in container for inspection and 300 DPI capture */}
            <div className="flex items-center justify-center my-auto py-2">
              <div
                ref={previewStickerRef}
                className="shadow-md rounded-xs bg-white transform transition-transform duration-200 hover:scale-[1.03]"
              >
                <PatientBarcodeSticker
                  patient={patient}
                  partner={partner}
                  hospitalName={hospitalName}
                  branchName={branchName}
                  preset={preset}
                  barcodeType={barcodeType}
                  sampleType={sampleType}
                />
              </div>
            </div>

            {/* Information Callout */}
            <div className="w-full mt-4 p-2 bg-blue-50/80 border border-blue-200/80 rounded-md text-[10.5px] text-blue-800 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>
                Labels print at <strong>203 / 300 DPI</strong> native resolution. Zero margins ensure exact fit onto continuous sticker rolls.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Secondary Utilities: Download PNG, Copy ZPL */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExportingPng}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="Download 300 DPI PNG label graphic for Bartender / ZebraDesigner"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isExportingPng ? 'Exporting...' : 'PNG (300 DPI)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyZpl}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Copy raw Zebra ZPL commands for raw printer socket"
            >
              {zplCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5 text-slate-500" />}
              <span>{zplCopied ? 'Copied ZPL!' : 'Copy ZPL'}</span>
            </button>
          </div>

          {/* Primary Action: Print To Thermal Machine */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-primary hover:bg-primary-mid text-white rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {copies} {copies === 1 ? 'Sticker' : 'Stickers'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PRINTABLE CONTINUOUS THERMAL ROLL OUTPUT:
          Rendered outside modal container, visible ONLY in @media print.
          Prints exactly 'copies' count on continuous roll.
      ───────────────────────────────────────────────────────────── */}
      <div className="barcode-sticker-print hidden print:block">
        {Array.from({ length: copies }).map((_, idx) => (
          <div key={idx} className="barcode-sticker-page-wrapper">
            <PatientBarcodeSticker
              patient={patient}
              partner={partner}
              hospitalName={hospitalName}
              branchName={branchName}
              preset={preset}
              barcodeType={barcodeType}
              sampleType={sampleType}
              className="print-sticker-element"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
