'use client';

import React, { useMemo } from 'react';
import { generateCode128SvgString, generateQrSvgString } from '@/lib/barcodeUtils';

export type StickerPreset = '50x25' | '50x38' | '75x50' | '38x25';
export type BarcodeFormat = 'code128' | 'qr' | 'both';

export interface PatientBarcodeStickerProps {
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
  };
  partner?: {
    name?: string;
    vid?: string;
    [key: string]: any;
  } | null;
  hospitalName?: string;
  branchName?: string;
  preset?: StickerPreset;
  barcodeType?: BarcodeFormat;
  sampleType?: string;
  collectionDate?: string;
  collectionTime?: string;
  className?: string;
  id?: string;
}

export default function PatientBarcodeSticker({
  patient,
  partner,
  hospitalName = 'VAIDYAMD HMS',
  branchName,
  preset = '50x25',
  barcodeType = 'code128',
  sampleType,
  collectionDate,
  collectionTime,
  className = '',
  id,
}: PatientBarcodeStickerProps) {
  const vid = (patient?.vid || 'VID-0000').toUpperCase();
  const patientName = patient?.name || 'PATIENT';
  const ageGender = [
    patient?.age ? `${patient.age}y` : '',
    patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : '',
  ].filter(Boolean).join(' / ');

  const bloodGroup = patient?.blood_group ? `BG: ${patient.blood_group}` : '';
  const dateStr = collectionDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = collectionTime || new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Code 128 barcode generator configuration per preset
  const barcodeSvg = useMemo(() => {
    let height = 36;
    let width = 1.3;

    if (preset === '50x25') {
      height = 28;
      width = 1.15;
    } else if (preset === '38x25') {
      height = 24;
      width = 0.95;
    } else if (preset === '50x38') {
      height = 42;
      width = 1.25;
    } else if (preset === '75x50') {
      height = 56;
      width = 1.6;
    }

    const { svg } = generateCode128SvgString(vid, {
      height,
      width,
      showText: false, // We render patient VID cleanly via HTML font for crisp typography
      lineColor: '#000000',
    });
    return svg;
  }, [vid, preset]);

  // Dimensions mapped to physical millimeters
  const dimensions = useMemo(() => {
    switch (preset) {
      case '38x25':
        return { width: '38mm', height: '25mm', minWidth: '38mm', minHeight: '25mm' };
      case '50x38':
        return { width: '50mm', height: '38mm', minWidth: '50mm', minHeight: '38mm' };
      case '75x50':
        return { width: '75mm', height: '50mm', minWidth: '75mm', minHeight: '50mm' };
      case '50x25':
      default:
        return { width: '50mm', height: '25mm', minWidth: '50mm', minHeight: '25mm' };
    }
  }, [preset]);

  return (
    <div
      id={id}
      style={dimensions}
      className={`barcode-sticker-item bg-white text-black p-[2mm] flex flex-col justify-between overflow-hidden border border-dashed border-slate-300 print:border-none print:m-0 print:p-[1.5mm] select-none font-sans ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          PRESET: 50mm x 25mm (Standard Specimen Tube / Blood Sample Label)
      ───────────────────────────────────────────────────────────── */}
      {preset === '50x25' && (
        <div className="w-full h-full flex flex-col justify-between text-[8px] leading-tight">
          {/* Header row: Hospital Name & Date/Time */}
          <div className="flex items-center justify-between border-b border-black/30 pb-[0.5mm] text-[7px] font-semibold">
            <span className="truncate max-w-[28mm] uppercase tracking-wider">{hospitalName}</span>
            <span className="font-mono text-[6.5px] text-black/80">{dateStr} {timeStr}</span>
          </div>

          {/* Patient Name & Tags */}
          <div className="flex items-center justify-between pt-[0.5mm]">
            <span className="font-bold text-[9px] truncate max-w-[32mm] leading-none uppercase tracking-tight">
              {patientName}
            </span>
            {sampleType && (
              <span className="font-mono font-black text-[6.5px] px-1 py-0.2 bg-black text-white rounded-xs uppercase leading-none">
                {sampleType}
              </span>
            )}
          </div>

          {/* Middle: Barcode Only */}
          <div className="flex items-center justify-center py-[0.5mm]">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg || '' }}
              />
              <span className="font-mono font-bold text-[8px] tracking-[1.5px] leading-none mt-[0.5mm]">
                {vid}
              </span>
            </div>
          </div>

          {/* Footer: Age/Gender, Blood Group, Doctor */}
          <div className="flex items-center justify-between border-t border-black/30 pt-[0.5mm] text-[7px]">
            <span className="font-medium truncate max-w-[26mm]">{ageGender || '—'}</span>
            <span className="font-bold">{bloodGroup || (patient?.gender ? patient.gender.toUpperCase() : '')}</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRESET: 50mm x 38mm (Wristband / Physical EMR Case File Label)
      ───────────────────────────────────────────────────────────── */}
      {preset === '50x38' && (
        <div className="w-full h-full flex flex-col justify-between text-[8.5px] leading-tight">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black pb-[0.5mm]">
            <div>
              <span className="font-black text-[7.5px] tracking-wider uppercase block">{hospitalName}</span>
              {branchName && <span className="text-[6.5px] text-black/70 block uppercase">{branchName}</span>}
            </div>
            <div className="text-right font-mono text-[6.5px]">
              <div>{dateStr}</div>
              <div>{timeStr}</div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="pt-[0.5mm]">
            <div className="font-black text-[10.5px] truncate leading-none uppercase">
              {patientName}
            </div>
            {partner?.name && (
              <div className="text-[7.5px] text-black/90 font-medium truncate mt-[0.5mm]">
                Spouse / Partner: <strong className="uppercase">{partner.name}</strong>
              </div>
            )}
          </div>

          {/* Barcode Section Only */}
          <div className="flex items-center justify-center my-[0.5mm]">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg || '' }}
              />
              <span className="font-mono font-bold text-[9px] tracking-[2px] leading-none mt-[0.5mm]">
                {vid}
              </span>
            </div>
          </div>

          {/* Bottom Info Grid */}
          <div className="border-t border-black/40 pt-[0.5mm] space-y-[0.3mm] text-[7.5px]">
            <div className="flex items-center justify-between">
              <span>{ageGender || '—'}</span>
              <strong className="font-bold">{bloodGroup || 'BG: —'}</strong>
            </div>
            <div className="flex items-center justify-between text-[7px] text-black/80">
              <span className="truncate max-w-[30mm]">
                Doc: {patient?.treating_doctor_name || 'Consultant'}
              </span>
              {sampleType && (
                <span className="font-bold font-mono px-1 py-0.2 bg-black text-white text-[6.5px] rounded-xs uppercase">
                  {sampleType}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRESET: 75mm x 50mm (Large EMR Folder / IVF Case Sticker - Barcode Only)
      ───────────────────────────────────────────────────────────── */}
      {preset === '75x50' && (
        <div className="w-full h-full flex flex-col justify-between text-[9px] leading-tight">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-black pb-[1mm]">
            <div>
              <span className="font-black text-[9px] tracking-wider uppercase block">{hospitalName}</span>
              <span className="text-[7.5px] font-semibold text-black/75 uppercase">
                {branchName ? `${branchName} · Patient Medical Record` : 'Patient Identification & EMR Record'}
              </span>
            </div>
            <div className="text-right font-mono text-[7.5px]">
              <span className="font-bold block">{dateStr}</span>
              <span className="text-black/70">{timeStr}</span>
            </div>
          </div>

          {/* Names & Demographics */}
          <div className="grid grid-cols-3 gap-2 pt-[1mm]">
            <div className="col-span-2">
              <div className="font-black text-[12px] uppercase leading-tight truncate">
                {patientName}
              </div>
              {partner?.name && (
                <div className="text-[8.5px] text-black/80 mt-[0.5mm] truncate">
                  Spouse / Partner: <strong className="text-black uppercase">{partner.name}</strong>
                </div>
              )}
              <div className="flex items-center gap-3 text-[8px] text-black/90 mt-[0.5mm]">
                <span>Age/Gen: <strong>{ageGender || '—'}</strong></span>
                <span>Blood: <strong>{bloodGroup || '—'}</strong></span>
              </div>
            </div>

            {/* Quick Sample / Category Badge */}
            <div className="text-right flex flex-col justify-start items-end">
              <span className="font-mono text-[8px] font-bold border border-black px-1.5 py-0.5 rounded-xs">
                {vid}
              </span>
              {sampleType && (
                <span className="mt-1 font-mono font-black text-[7.5px] bg-black text-white px-1.5 py-0.5 rounded-xs uppercase">
                  {sampleType}
                </span>
              )}
            </div>
          </div>

          {/* Barcode Center Only (No QR) */}
          <div className="flex items-center justify-center my-[1mm] bg-black/3 p-[1.5mm] rounded-xs">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg || '' }}
              />
              <span className="font-mono font-bold text-[9.5px] tracking-[2px] mt-[0.5mm]">
                {vid}
              </span>
            </div>
          </div>

          {/* Footer Details */}
          <div className="border-t border-black/40 pt-[0.8mm] flex items-center justify-between text-[7.5px] text-black/80">
            <span className="truncate max-w-[45mm]">
              Attending: <strong>{patient?.treating_doctor_name || 'Dr. Consultant Specialist'}</strong>
            </span>
            {patient?.phone && (
              <span className="font-mono text-[7.5px]">Ph: {patient.phone}</span>
            )}
            <span className="font-mono text-[7px] text-black/60">VaidyaMD EMR</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PRESET: 38mm x 25mm (Ultra-compact Cryo Straw / Microcentrifuge Tube)
      ───────────────────────────────────────────────────────────── */}
      {preset === '38x25' && (
        <div className="w-full h-full flex flex-col justify-between text-[7.5px] leading-tight">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/40 pb-[0.3mm] text-[6.5px]">
            <span className="font-bold truncate max-w-[22mm] uppercase">{patientName}</span>
            <span className="font-mono text-[6px]">{dateStr}</span>
          </div>

          {/* Barcode Only */}
          <div className="flex items-center justify-center my-[0.5mm]">
            <div className="w-full flex flex-col items-center">
              <div
                className="w-full flex justify-center overflow-hidden"
                dangerouslySetInnerHTML={{ __html: barcodeSvg || '' }}
              />
              <span className="font-mono font-bold text-[7.5px] tracking-[1px] leading-none mt-[0.3mm]">
                {vid}
              </span>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="flex items-center justify-between border-t border-black/40 pt-[0.3mm] text-[6.5px]">
            <span>{ageGender || (patient?.gender?.slice(0, 1).toUpperCase())}</span>
            {sampleType ? (
              <span className="font-bold uppercase font-mono">{sampleType}</span>
            ) : (
              <span>{bloodGroup || ''}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
