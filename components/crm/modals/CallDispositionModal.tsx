'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { CallDisposition, LeadStatus } from '../types';

interface CallDispositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    disposition: CallDisposition;
    notes?: string;
    follow_up_scheduled_at?: string;
    lead_status?: LeadStatus;
  }) => void;
  leadName: string;
}

const DISPOSITION_OPTIONS: { label: string; value: CallDisposition; defaultStatus: LeadStatus }[] = [
  { label: 'Interested in Consultation', value: 'interested', defaultStatus: 'interested' },
  { label: 'Scheduled Appointment / Converted', value: 'converted_appointment', defaultStatus: 'converted' },
  { label: 'Requested Callback / Follow-Up', value: 'callback_requested', defaultStatus: 'follow_up' },
  { label: 'Not Reachable / No Answer', value: 'not_reachable', defaultStatus: 'contacted' },
  { label: 'Not Interested', value: 'not_interested', defaultStatus: 'lost' },
  { label: 'Wrong Number', value: 'wrong_number', defaultStatus: 'lost' },
  { label: 'DND / Opt-Out', value: 'dnd', defaultStatus: 'do_not_call' },
];

export const CallDispositionModal: React.FC<CallDispositionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  leadName,
}) => {
  const [selectedDisposition, setSelectedDisposition] = useState<CallDisposition>('interested');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const opt = DISPOSITION_OPTIONS.find((o) => o.value === selectedDisposition);
    onSubmit({
      disposition: selectedDisposition,
      notes: notes.trim() || undefined,
      follow_up_scheduled_at: followUpDate || undefined,
      lead_status: opt?.defaultStatus,
    });
    setNotes('');
    setFollowUpDate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Call Outcome & Notes — {leadName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Call Disposition / Outcome *
            </label>
            <select
              value={selectedDisposition}
              onChange={(e) => setSelectedDisposition(e.target.value as CallDisposition)}
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {DISPOSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Telecaller Call Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter patient inquiry details, chief concerns, or discussion summary..."
              rows={3}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Next Follow-Up Date & Time (Optional)
            </label>
            <Input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              Save & Next Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
