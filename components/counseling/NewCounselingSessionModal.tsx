'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { counselingApi } from '@/lib/api';
import { toast } from '@/contexts/ToastContext';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { HeartHandshake, X, Search } from 'lucide-react';

const SOURCES_LIST = [
  'OP Consultation',
  'External Doctor Referral',
  'Direct Walk-in',
  'Community Camp / Outreach',
  'Tele-consultation Transfer',
  'Repeat / Second Opinion Consultation',
];

interface NewCounselingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNoteId: string | null;
  patients: any[];
  dynamicProcedures: string[];
  user: any;
  initialData?: any;
  onSuccess: () => void;
}

export default function NewCounselingSessionModal({
  isOpen,
  onClose,
  editingNoteId,
  patients,
  dynamicProcedures,
  user,
  initialData,
  onSuccess,
}: NewCounselingSessionModalProps) {
  const queryClient = useQueryClient();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    source: 'OP Consultation',
    comments: '',
    procedure: dynamicProcedures[0] || 'IVF - Self Oocyte',
    egg_pick_up: '',
    discussion: '',
    laparoscopy_hysteroscopy: '',
    egg_transfer: '',
    remarks: '',
    signature: `${user?.name || 'Counselor'} (${user?.specialization || 'Fertility Counselor'})`,
  });

  useEffect(() => {
    if (initialData) {
      setSelectedPatientId(initialData.patient_id || '');
      setFormData({
        source: initialData.source || 'OP Consultation',
        comments: initialData.comments || '',
        procedure: initialData.procedure || dynamicProcedures[0] || 'IVF - Self Oocyte',
        egg_pick_up: initialData.egg_pick_up || '',
        discussion: initialData.discussion || '',
        laparoscopy_hysteroscopy: initialData.laparoscopy_hysteroscopy || '',
        egg_transfer: initialData.egg_transfer || '',
        remarks: initialData.remarks || '',
        signature: initialData.signature || `${user?.name || 'Counselor'} (${user?.specialization || 'Fertility Counselor'})`,
      });
    } else {
      setSelectedPatientId('');
      setFormData({
        source: 'OP Consultation',
        comments: '',
        procedure: dynamicProcedures[0] || 'IVF - Self Oocyte',
        egg_pick_up: '',
        discussion: '',
        laparoscopy_hysteroscopy: '',
        egg_transfer: '',
        remarks: '',
        signature: `${user?.name || 'Counselor'} (${user?.specialization || 'Fertility Counselor'})`,
      });
    }
  }, [initialData, dynamicProcedures, user, isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSelectedPatient = patients.find((p) => p.id === selectedPatientId);

  const filteredPatients = patients.filter((p: any) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.vid?.toLowerCase().includes(q) ||
      p.mrn?.toLowerCase().includes(q) ||
      p.phone?.includes(q)
    );
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) {
        throw new Error('Please select a patient for counseling session.');
      }
      if (!formData.discussion && !formData.procedure) {
        throw new Error('Please enter procedure and discussion points.');
      }

      const payload = {
        patient_id: selectedPatientId,
        source: formData.source,
        comments: formData.comments,
        procedure: formData.procedure,
        egg_pick_up: formData.egg_pick_up,
        discussion: formData.discussion,
        laparoscopy_hysteroscopy: formData.laparoscopy_hysteroscopy,
        egg_transfer: formData.egg_transfer,
        remarks: formData.remarks,
        signature: formData.signature,
      };

      if (editingNoteId) {
        return counselingApi.updateNote(editingNoteId, payload);
      } else {
        return counselingApi.createNote(payload);
      }
    },
    onSuccess: () => {
      toast.success(
        editingNoteId ? 'Counseling Note Updated' : 'Counseling Note Recorded',
        'Clinical counseling record synchronized successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['counseling-notes'] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error('Submission Failed', err.message || 'Could not save counseling record');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div className="bg-white max-w-4xl w-full rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col my-6 max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-primary text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-accent border border-white/15">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editingNoteId ? 'Edit Clinical Counseling Record' : 'New Pre-ART Counseling Session'}
              </h3>
              <p className="text-xs text-pink-200/80">Structured 8-column documentation · Visible in Doctor Portal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Patient Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              1. Select Patient / Couple for Counseling <span className="text-rose-500">*</span>
            </label>

            {activeSelectedPatient ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-sm">
                    {activeSelectedPatient.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-emerald-950">{activeSelectedPatient.name}</p>
                      <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300 font-mono">
                        {activeSelectedPatient.vid || activeSelectedPatient.mrn}
                      </Badge>
                      <span className="text-[11px] text-emerald-700 capitalize">· {activeSelectedPatient.gender} ({activeSelectedPatient.age}y)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5">
                      Phone: {activeSelectedPatient.phone || '—'} {activeSelectedPatient.blood_group ? `· Blood Group: ${activeSelectedPatient.blood_group}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPatientId('')}
                  className="text-xs font-bold h-7 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                >
                  Change Patient
                </Button>
              </div>
            ) : (
              <div className="relative" ref={patientDropdownRef}>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search patient by name, VID, or phone number..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 shadow-sm"
                  />
                </div>

                {isPatientDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        No matching registered patients found.
                      </div>
                    ) : (
                      filteredPatients.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setIsPatientDropdownOpen(false);
                            setPatientSearch('');
                          }}
                          className="w-full px-3.5 py-2.5 text-left hover:bg-pink-50/60 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{p.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {p.gender} · Age: {p.age || '—'} · Phone: {p.phone || '—'}
                            </p>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                            {p.vid || p.mrn}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: The 8 Clinical Columns */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Source */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Source (Consultation Channel) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
                >
                  {SOURCES_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Comments Box beside Source */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Source Comments / Referral Notes
                </label>
                <input
                  type="text"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="e.g. Referred by Dr. Rao / Camp patient / Relative / Channel notes..."
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            {/* Column 2: Procedure */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                2. Procedure (Planned ART Treatment) <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.procedure}
                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm"
              >
                {dynamicProcedures.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Column 3: Egg pick up */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                3. Egg pick up (OPU Clinical &amp; Operational Counseling)
              </label>
              <textarea
                rows={2}
                value={formData.egg_pick_up}
                onChange={(e) => setFormData({ ...formData, egg_pick_up: e.target.value })}
                placeholder="Enter follicular expectations, OPU timing, trigger protocol, anesthesia counseling, husband sperm collection plan, fasting instructions..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
              />
            </div>

            {/* Column 4: Discussion */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                4. Discussion (Detailed Counseling Notes &amp; Couple Consent) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.discussion}
                onChange={(e) => setFormData({ ...formData, discussion: e.target.value })}
                placeholder="Document in-depth discussion: medical protocols, financial package breakdown, realistic success probabilities, emotional readiness, couple queries answered, risks discussed, consent forms verified..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
              />
            </div>

            {/* Column 5: Laparoscopy/hysteroscopy/etc */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                5. Laparoscopy / Hysteroscopy / Endoscopy Assessment
              </label>
              <textarea
                rows={2}
                value={formData.laparoscopy_hysteroscopy}
                onChange={(e) => setFormData({ ...formData, laparoscopy_hysteroscopy: e.target.value })}
                placeholder="Document endoscopic recommendations, uterine cavity / septum / polyp findings, laparoscopy for hydrosalpinx / ovarian drilling, pre-transfer hysteroscopy plans..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
              />
            </div>

            {/* Column 6: Egg transfer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                6. Egg transfer (Embryo Transfer Planning &amp; Luteal Strategy)
              </label>
              <textarea
                rows={2}
                value={formData.egg_transfer}
                onChange={(e) => setFormData({ ...formData, egg_transfer: e.target.value })}
                placeholder="Embryo transfer plan: fresh transfer vs freeze-all blastocyst, Day 3 vs Day 5, single vs double embryo transfer counseling, luteal phase support regimen, post-transfer precautions..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
              />
            </div>

            {/* Column 7: Remarks */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                7. Remarks &amp; Follow-up Actions
              </label>
              <textarea
                rows={2}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Special instructions, couple motivation level, pending blood viral markers, financial approvals, next visit appointment date..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm leading-relaxed"
              />
            </div>

            {/* Column 8: Signature */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                8. Signature &amp; Sign-off Designation <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.signature}
                  onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                  placeholder="e.g. Ananya Sen (Lead ART Counselor)"
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-pink-500 focus:outline-none shadow-sm font-mono"
                />
                <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-mono flex-shrink-0">
                  Timestamp: {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !selectedPatientId}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-6 shadow-md disabled:opacity-50"
          >
            {saveMutation.isPending
              ? 'Saving to EMR...'
              : editingNoteId
              ? 'Update Counseling Note'
              : 'Save Counseling Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}
