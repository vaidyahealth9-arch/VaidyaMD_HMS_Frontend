'use client';

import React from 'react';
import { FolderOpen, FileCheck, ExternalLink, X } from 'lucide-react';
import MultiDocumentUploader from '@/components/common/MultiDocumentUploader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { documentsApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { useState, useEffect } from 'react';

interface DocumentsTabProps {
  patientId?: string;
  patient: any;
  partner?: any;
  hasPartner?: boolean;
  patientDocs?: any[];
  onDocsRefresh?: () => void;
  onOpenConsentModal: () => void;
  onDocDeleted?: (docId: string) => void;
}

export default function DocumentsTab({
  patientId,
  patient,
  partner,
  hasPartner: propHasPartner,
  patientDocs: propDocs,
  onDocsRefresh,
  onOpenConsentModal,
  onDocDeleted,
}: DocumentsTabProps) {
  const targetId = patientId || patient?.id;
  const hasPartner = propHasPartner !== undefined ? propHasPartner : !!partner;

  const [internalDocs, setInternalDocs] = useState<any[]>([]);
  const patientDocs = propDocs || internalDocs;

  const loadDocs = () => {
    if (!targetId) return;
    documentsApi.list(targetId)
      .then((docs: any) => {
        const list = docs || [];
        setInternalDocs(list);
        if (onDocsRefresh) onDocsRefresh();
      })
      .catch((err) => console.error('Failed to load documents', err));
  };

  useEffect(() => {
    if (!propDocs && targetId) {
      loadDocs();
    }
  }, [propDocs, targetId]);

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteDoc = async () => {
    if (!deletingDocId) return;
    setIsDeleting(true);
    try {
      await documentsApi.delete(deletingDocId);
      toast.success('Document Deleted', 'Document record removed successfully.');
      if (onDocDeleted) {
        onDocDeleted(deletingDocId);
      } else {
        loadDocs();
      }
    } catch (err: any) {
      toast.error('Deletion Failed', err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
      setDeletingDocId(null);
    }
  };

  const handleDeleteDoc = (docId: string) => {
    setDeletingDocId(docId);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Upload New Report Form */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-slate-600" /> Patient Documents &amp; Investigation Reports
            </h2>
            <p className="text-xs text-slate-500">
              Upload or link lab reports, scan images, consent forms, and regulatory documents
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConsentModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-md shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-amber-700" /> Digital ART Consent (Forms 8, 11, 13, 15)
            </span>
          </button>
        </div>

        {/* Multi-Document Upload Builder */}
        <MultiDocumentUploader
          primaryPatientId={patient.id}
          primaryPatientName={patient.name}
          partnerId={partner?.id}
          partnerName={partner?.name}
          onUploadComplete={onDocsRefresh}
        />

        {/* Documents List */}
        {patientDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {patientDocs.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-bold text-slate-800 flex-1 leading-tight">{doc.file_name}</p>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="text-rose-400 hover:text-rose-600 text-xs font-bold flex-shrink-0"
                    title="Remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.category === 'report'
                        ? 'bg-info-bg text-info'
                        : doc.category === 'scan'
                        ? 'bg-purple-100 text-purple-800'
                        : doc.category === 'consent'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.category?.toUpperCase()}
                  </span>
                  {hasPartner && doc.patient_id === partner?.id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                      Partner: {partner.name}
                    </span>
                  )}
                  {hasPartner && doc.patient_id === patient?.id && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                      Self: {patient.name}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(doc.created_at).toLocaleDateString('en-IN')}
                </p>
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary hover:text-primary-mid font-bold underline block truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 inline mr-1" /> Open / View Document
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            No documents on file. Use the form above to register investigation reports, scan images, or consent forms.
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingDocId}
        onClose={() => setDeletingDocId(null)}
        onConfirm={confirmDeleteDoc}
        title="Delete Document"
        description="Are you sure you want to delete this document record? This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
