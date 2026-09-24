'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { patientsApi } from '@/lib/api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { toast } from '@/contexts/ToastContext';

interface PartnerLinkModalProps {
  open: boolean;
  onClose: () => void;
  patient: any;
  onLinked: () => void;
}

export default function PartnerLinkModal({
  open,
  onClose,
  patient,
  onLinked,
}: PartnerLinkModalProps) {
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [partnerSearchResults, setPartnerSearchResults] = useState<any[]>([]);
  const [isSearchingPartner, setIsSearchingPartner] = useState(false);
  const [isLinkingPartner, setIsLinkingPartner] = useState(false);
  const [pendingCandidate, setPendingCandidate] = useState<{ id: string; name: string } | null>(null);

  if (!open || !patient) return null;

  const handleSearch = async (query: string) => {
    setPartnerSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setPartnerSearchResults([]);
      return;
    }
    setIsSearchingPartner(true);
    try {
      const res: any = await patientsApi.list({ search: query.trim(), per_page: 8 });
      const pts = (res?.patients || []).filter((p: any) => p.id !== patient.id);
      setPartnerSearchResults(pts);
    } catch {
      setPartnerSearchResults([]);
    } finally {
      setIsSearchingPartner(false);
    }
  };

  const confirmLink = async () => {
    if (!pendingCandidate) return;
    setIsLinkingPartner(true);
    try {
      await patientsApi.linkPartner(patient.id, pendingCandidate.id);
      toast.success('Partner Linked', `${pendingCandidate.name} successfully linked as partner!`);
      setPartnerSearchQuery('');
      setPartnerSearchResults([]);
      onLinked();
      onClose();
    } catch (err: any) {
      toast.error('Linking Failed', err.message || 'Failed to link partner');
    } finally {
      setIsLinkingPartner(false);
      setPendingCandidate(null);
    }
  };

  const handleLink = (candidateId: string, candidateName: string) => {
    setPendingCandidate({ id: candidateId, name: candidateName });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center border-b pb-2">
          <div>
            <h3 className="font-bold text-base text-slate-900">Link Existing Patient as Partner</h3>
            <p className="text-xs text-slate-500">
              Search and link a partner to {patient?.name} ({patient?.vid})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Search by Name, Phone, or VID</label>
            <input
              type="text"
              value={partnerSearchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g. Rahul, +91-98765, VH-VMD-00002"
              className="vmd-input text-xs"
              autoFocus
            />
          </div>

          {isSearchingPartner && (
            <div className="py-4 text-center text-xs text-slate-500">Searching patients...</div>
          )}

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {partnerSearchResults.map((p) => (
              <div
                key={p.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-primary/40 hover:bg-accent-light/50 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                      {p.vid}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">
                      {p.gender} · {p.age ? `${p.age}y` : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {p.phone} {p.area ? `· ${p.area}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLinkingPartner}
                  onClick={() => handleLink(p.id, p.name)}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white rounded text-xs font-bold shadow-xs transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  {isLinkingPartner ? 'Linking...' : 'Link as Partner'}
                </button>
              </div>
            ))}
            {!isSearchingPartner && partnerSearchQuery.length >= 2 && partnerSearchResults.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                No matching patients found. Ensure the partner is registered first.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!pendingCandidate}
        onClose={() => setPendingCandidate(null)}
        onConfirm={confirmLink}
        title="Link Partner"
        description={`Are you sure you want to link ${pendingCandidate?.name} as the partner to ${patient?.name}? Both records will be unified under couple EMR.`}
        confirmLabel="Yes, Link Partner"
        variant="primary"
        isLoading={isLinkingPartner}
      />
    </div>
  );
}
