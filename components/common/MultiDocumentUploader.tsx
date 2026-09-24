'use client';

import React, { useState } from 'react';
import { documentsApi } from '@/lib/api';
import { UploadCloud, ChevronUp, ChevronDown, Plus, FileText, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

export const DOCUMENT_CATEGORIES = [
  { id: 'identity_proof', label: 'Identity Proof (Aadhaar/PAN/Passport)' },
  { id: 'scan', label: 'Ultrasound / Imaging Scans' },
  { id: 'report', label: 'Diagnostic & Lab Reports' },
  { id: 'consent', label: 'Consent Forms & Statutory Documents' },
  { id: 'prescription', label: 'Prescriptions & Rx' },
  { id: 'other', label: 'Other Documents' },
];

export const KNOWN_DOCUMENT_TYPES = [
  { id: 'aadhaar_card', label: 'Aadhaar Card (UIDAI Proof)', category: 'identity_proof' },
  { id: 'pan_card', label: 'PAN Card', category: 'identity_proof' },
  { id: 'passport', label: 'Passport', category: 'identity_proof' },
  { id: 'voter_id', label: 'Voter ID / Driving License', category: 'identity_proof' },
  { id: 'marriage_cert', label: 'Marriage Certificate', category: 'identity_proof' },
  { id: 'other_identity', label: 'Other Identity Document', category: 'identity_proof' },
  { id: 'tvs_usg_scan', label: 'Transvaginal Ultrasound (TVS) Scan', category: 'scan' },
  { id: 'follicular_chart', label: 'Follicular Tracking Ultrasound Sheet', category: 'scan' },
  { id: 'pelvic_usg_3d', label: 'Pelvic 3D/4D USG (Uterus/Ovaries)', category: 'scan' },
  { id: 'hsg_sis_report', label: 'Hysterosalpingography (HSG) / SIS Report', category: 'scan' },
  { id: 'obstetric_usg', label: 'Obstetric Scan (NT / Anomaly / Growth)', category: 'scan' },
  { id: 'other_scan', label: 'Other Scan / USG Image', category: 'scan' },
  { id: 'semen_analysis', label: 'Semen Analysis Report (CASA / WHO 6th)', category: 'report' },
  { id: 'amh_hormone', label: 'Serum AMH & Day 2/3 Hormone Panel', category: 'report' },
  { id: 'viral_markers', label: 'Viral Screening Panel (HIV, HBsAg, HCV, VDRL)', category: 'report' },
  { id: 'cbc_blood_group', label: 'Complete Blood Count (CBC) & Blood Group', category: 'report' },
  { id: 'thyroid_glucose', label: 'Thyroid Profile (TSH) & Fasting Glucose', category: 'report' },
  { id: 'karyotype_genetic', label: 'Karyotyping & Genetic Screening', category: 'report' },
  { id: 'discharge_summary', label: 'Discharge Summary / Transfer Note', category: 'report' },
  { id: 'prev_ivf_records', label: 'Previous IVF / ART Cycle Records', category: 'report' },
  { id: 'other_report', label: 'Other Diagnostic Report', category: 'report' },
  { id: 'general_consent', label: 'General Procedure Consent', category: 'consent' },
  { id: 'art_form_8', label: 'ART Form 8 - Couple Consent', category: 'consent' },
  { id: 'art_form_11', label: 'ART Form 11 - Oocyte Donor Consent', category: 'consent' },
  { id: 'art_form_13', label: 'ART Form 13 - Semen Donor Consent', category: 'consent' },
  { id: 'art_form_15', label: 'ART Form 15 - Surrogacy Agreement', category: 'consent' },
  { id: 'anesthesia_consent', label: 'Anesthesia & Sedation Consent', category: 'consent' },
  { id: 'cryo_consent', label: 'Embryo / Gamete Cryopreservation Consent', category: 'consent' },
  { id: 'other_consent', label: 'Other Consent Form', category: 'consent' },
  { id: 'opd_prescription', label: 'OPD Consultation Prescription', category: 'prescription' },
  { id: 'external_prescription', label: 'Outside / Referring Doctor Prescription', category: 'prescription' },
  { id: 'discharge_rx', label: 'Discharge Medication Chart', category: 'prescription' },
  { id: 'other_rx', label: 'Other Prescription Document', category: 'prescription' },
  { id: 'other', label: 'Other Document (Specify Custom Name)', category: 'other' },
];

export const getDocTypesForCategory = (category: string) => {
  const filtered = KNOWN_DOCUMENT_TYPES.filter((k) => k.category === category);
  if (!filtered.some((k) => k.id === 'other' || k.id.startsWith('other_'))) {
    filtered.push({ id: 'other', label: 'Other (Specify Custom Name)', category });
  }
  return filtered;
};

export interface MultiDocUploadRow {
  id: string;
  doc_type: string;
  custom_name: string;
  category: string;
  file_name: string;
  file_data: string;
  file_size?: string;
  mime_type?: string;
  target_patient?: 'self' | 'partner';
}

interface MultiDocumentUploaderProps {
  primaryPatientId: string;
  primaryPatientName?: string;
  partnerId?: string;
  partnerName?: string;
  onUploadComplete?: () => void;
}

export default function MultiDocumentUploader({
  primaryPatientId,
  primaryPatientName = 'Primary Patient',
  partnerId,
  partnerName = 'Partner',
  onUploadComplete,
}: MultiDocumentUploaderProps) {
  const { toast } = useToast();
  const [isDocUploadExpanded, setIsDocUploadExpanded] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadRows, setDocUploadRows] = useState<MultiDocUploadRow[]>([
    {
      id: 'doc-row-1',
      doc_type: 'aadhaar_card',
      custom_name: '',
      category: 'identity_proof',
      file_name: '',
      file_data: '',
      file_size: '',
    },
  ]);

  const hasPartner = !!partnerId;

  const handleAddDocRow = () => {
    setDocUploadRows((prev) => [
      ...prev,
      {
        id: 'doc-row-' + Math.random().toString(36).substring(2, 9),
        doc_type: 'other',
        custom_name: '',
        category: 'report',
        file_name: '',
        file_data: '',
        file_size: '',
      },
    ]);
  };

  const handleUpdateDocRow = (id: string, field: keyof MultiDocUploadRow, value: any) => {
    setDocUploadRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === 'category') {
          const availableTypes = getDocTypesForCategory(value);
          updated.doc_type = availableTypes[0]?.id || 'other';
        } else if (field === 'doc_type') {
          const known = KNOWN_DOCUMENT_TYPES.find((k) => k.id === value);
          if (known && known.id !== 'other') {
            updated.category = known.category;
          }
        }
        return updated;
      })
    );
  };

  const handleFilePickedForRow = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDocUploadRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
              ...row,
              file_obj: file,
              file_name: file.name,
              file_data: reader.result as string,
              file_size: (file.size / 1024).toFixed(1) + ' KB',
              mime_type: file.type || 'application/pdf',
            }
            : row
        )
      );
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocRow = (id: string) => {
    setDocUploadRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBatchUploadDocuments = async () => {
    const validRows = docUploadRows.filter((r) => r.file_data);
    if (validRows.length === 0) {
      toast.error('Please choose a file to upload for at least one document row.');
      return;
    }
    setIsUploadingDoc(true);
    try {
      for (const row of validRows) {
        const known = KNOWN_DOCUMENT_TYPES.find((k) => k.id === row.doc_type);
        const resolvedName = (row.custom_name && row.custom_name.trim())
          ? row.custom_name.trim()
          : (known?.label || row.file_name || 'Document');

        const targetPatientId = (row.target_patient === 'partner' && partnerId) ? partnerId : primaryPatientId;

        let storedFilePath = row.file_data;
        if ((row as any).file_obj) {
          try {
            const uploadRes = await documentsApi.uploadFile((row as any).file_obj, {
              category: row.category,
              document_type: row.doc_type,
              patient_id: targetPatientId,
            });
            storedFilePath = uploadRes.url;
          } catch (uploadErr) {
            console.warn('Direct upload failed, falling back to base64 payload:', uploadErr);
          }
        }

        await documentsApi.create({
          patient_id: targetPatientId,
          file_name: resolvedName,
          file_path: storedFilePath,
          category: row.category,
          mime_type: row.mime_type,
        });
      }

      setDocUploadRows([
        {
          id: 'doc-row-' + Math.random().toString(36).substring(2, 9),
          doc_type: 'other',
          custom_name: '',
          category: 'report',
          file_name: '',
          file_data: '',
          file_size: '',
        },
      ]);
      toast.success(`Successfully uploaded ${validRows.length} document(s)!`);
      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => setIsDocUploadExpanded(!isDocUploadExpanded)}
        >
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4 text-primary" /> Upload Patient Documents &amp; Reports
          </h3>
          <button type="button" className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors">
            {isDocUploadExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsDocUploadExpanded(true);
            handleAddDocRow();
          }}
          className="px-3 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-bold text-xs rounded-md border border-primary/20 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Document Row
        </button>
      </div>

      {isDocUploadExpanded && (
        <>
          {/* Rows Queue */}
          <div className="space-y-3">
            {docUploadRows.map((row, idx) => (
              <div
                key={row.id}
                className="bg-white border border-slate-200 rounded-lg p-3.5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center shadow-xs"
              >
                {/* 1. Category Dropdown */}
                <div className={hasPartner ? 'md:col-span-3' : 'md:col-span-3'}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Category #{idx + 1}
                  </label>
                  <select
                    value={row.category}
                    onChange={(e) => handleUpdateDocRow(row.id, 'category', e.target.value)}
                    className="vmd-input text-xs font-semibold text-slate-800"
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Document Type Dropdown */}
                <div className={hasPartner ? 'md:col-span-3' : (row.doc_type === 'other' || row.doc_type.startsWith('other_') ? 'md:col-span-3' : 'md:col-span-4')}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Document Type
                  </label>
                  <select
                    value={row.doc_type}
                    onChange={(e) => handleUpdateDocRow(row.id, 'doc_type', e.target.value)}
                    className="vmd-input text-xs font-medium text-slate-900"
                  >
                    {getDocTypesForCategory(row.category).map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2.5 Target Patient (Self vs Partner) */}
                {hasPartner && (
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Document For
                    </label>
                    <select
                      value={row.target_patient || 'self'}
                      onChange={(e) => handleUpdateDocRow(row.id, 'target_patient', e.target.value)}
                      className="vmd-input text-xs font-semibold text-slate-800"
                    >
                      <option value="self">Self ({primaryPatientName})</option>
                      <option value="partner">Partner ({partnerName})</option>
                    </select>
                  </div>
                )}

                {/* 3. Custom Name */}
                <div className={row.doc_type === 'other' || row.doc_type.startsWith('other_') ? 'md:col-span-3' : 'hidden'}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Specify Document Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Detailed Scan or Report Name"
                    value={row.custom_name}
                    onChange={(e) => handleUpdateDocRow(row.id, 'custom_name', e.target.value)}
                    className="vmd-input text-xs"
                  />
                </div>

                {/* File Picker & Info */}
                <div className={row.doc_type === 'other' ? 'md:col-span-2' : 'md:col-span-4'}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Choose File</label>
                  {row.file_name ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded truncate">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate flex-1">{row.file_name}</span>
                      <span className="text-[10px] text-emerald-600 flex-shrink-0">({row.file_size})</span>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={(e) => handleFilePickedForRow(row.id, e)}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/15 cursor-pointer w-full"
                    />
                  )}
                </div>

                {/* Delete Row Button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveDocRow(row.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Remove row"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              {docUploadRows.filter((r) => r.file_data).length} of {docUploadRows.length} document(s) ready to upload.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddDocRow}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-md transition-colors"
              >
                + Add Another
              </button>
              <button
                type="button"
                disabled={isUploadingDoc || docUploadRows.filter((r) => r.file_data).length === 0}
                onClick={handleBatchUploadDocuments}
                className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-bold text-xs rounded-md shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUploadingDoc ? 'Uploading Documents...' : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload All ({docUploadRows.filter((r) => r.file_data).length})
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
