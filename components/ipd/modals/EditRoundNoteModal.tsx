'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit3, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import type { RoundNote } from '@/features/ipd/types';

interface EditRoundNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: RoundNote | null;
  admissionId: string;
  onSuccess?: () => void;
}

export default function EditRoundNoteModal({
  isOpen,
  onClose,
  note,
  admissionId,
  onSuccess,
}: EditRoundNoteModalProps) {
  const queryClient = useQueryClient();
  const [roundTime, setRoundTime] = useState('');
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');

  useEffect(() => {
    if (note) {
      setSubjective(note.subjective || '');
      setObjective(note.objective || '');
      setAssessment(note.assessment || '');
      setPlan(note.plan || '');
      if (note.round_time) {
        try {
          const d = new Date(note.round_time);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setRoundTime(localISOTime);
        } catch {
          setRoundTime('');
        }
      }
    }
  }, [note]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => ipdApi.updateRoundNote(note!.id, data),
    onSuccess: () => {
      toast.success('Round Note Updated', 'Doctor progress note modified successfully.');
      queryClient.invalidateQueries({ queryKey: ['ipd-admission-details', admissionId] });
      queryClient.invalidateQueries({ queryKey: ['ipd-round-notes', admissionId] });
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err: any) => toast.error('Update Failed', err?.message || 'Could not update note'),
  });

  if (!note) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      round_time: roundTime ? new Date(roundTime).toISOString() : undefined,
      subjective,
      objective,
      assessment,
      plan,
    });
  };

  const docName = (note.doctor_name || '').replace(/^dr\.?\s+/i, '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="p-1 rounded bg-indigo-50 text-indigo-700">
              <Edit3 className="w-4 h-4" />
            </span>
            <span>Edit Physician Round Note</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Recorded by Dr. {docName || 'Attending Physician'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-600 uppercase text-[10px] flex items-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Round Date &amp; Time (System / Local Time)</span>
            </label>
            <Input
              type="datetime-local"
              value={roundTime}
              onChange={(e) => setRoundTime(e.target.value)}
              className="h-8 text-xs font-mono max-w-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 uppercase text-[10px] block mb-1">
              Subjective (Patient Complaints &amp; Feedback)
            </label>
            <textarea
              rows={3}
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 uppercase text-[10px] block mb-1">
              Objective (Bedside Vitals / Physical Exam / Clinical Findings)
            </label>
            <textarea
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 uppercase text-[10px] block mb-1">
              Assessment (Clinical Assessment / Impression)
            </label>
            <textarea
              rows={2}
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 uppercase text-[10px] block mb-1">
              Plan (Treatment Plan / Medication Adjustments)
            </label>
            <textarea
              rows={2}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {updateMutation.isPending ? 'Saving...' : 'Update Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
