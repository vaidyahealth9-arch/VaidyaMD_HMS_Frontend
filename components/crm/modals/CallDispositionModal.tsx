'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { 
  CheckCircle2, 
  Trophy, 
  CalendarClock, 
  PhoneOff, 
  XCircle, 
  AlertCircle, 
  VolumeX,
  ArrowRight
} from 'lucide-react';
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

const DISPOSITION_OPTIONS: {
  label: string;
  value: CallDisposition;
  defaultStatus: LeadStatus;
  icon: any;
  color: string;
  activeBg: string;
}[] = [
  {
    label: 'Interested in Care',
    value: 'interested',
    defaultStatus: 'interested',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-900',
  },
  {
    label: 'Appointment Booked',
    value: 'converted_appointment',
    defaultStatus: 'converted',
    icon: Trophy,
    color: 'text-teal-700',
    activeBg: 'bg-teal-50 border-teal-600 text-teal-900',
  },
  {
    label: 'Callback Requested',
    value: 'callback_requested',
    defaultStatus: 'follow_up',
    icon: CalendarClock,
    color: 'text-amber-700',
    activeBg: 'bg-amber-50 border-amber-500 text-amber-900',
  },
  {
    label: 'Not Reachable / No Answer',
    value: 'not_reachable',
    defaultStatus: 'contacted',
    icon: PhoneOff,
    color: 'text-slate-600',
    activeBg: 'bg-slate-100 border-slate-400 text-slate-900',
  },
  {
    label: 'Not Interested',
    value: 'not_interested',
    defaultStatus: 'lost',
    icon: XCircle,
    color: 'text-rose-600',
    activeBg: 'bg-rose-50 border-rose-500 text-rose-900',
  },
  {
    label: 'Wrong Number',
    value: 'wrong_number',
    defaultStatus: 'lost',
    icon: AlertCircle,
    color: 'text-rose-600',
    activeBg: 'bg-rose-50 border-rose-500 text-rose-900',
  },
  {
    label: 'DND / Opt-Out',
    value: 'dnd',
    defaultStatus: 'do_not_call',
    icon: VolumeX,
    color: 'text-rose-800',
    activeBg: 'bg-rose-100 border-rose-700 text-rose-950',
  },
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

  const selectedOpt = DISPOSITION_OPTIONS.find((o) => o.value === selectedDisposition);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      disposition: selectedDisposition,
      notes: notes.trim() || undefined,
      follow_up_scheduled_at: followUpDate || undefined,
      lead_status: selectedOpt?.defaultStatus,
    });
    setNotes('');
    setFollowUpDate('');
    onClose();
  };

  const isFollowUpExpected = selectedDisposition === 'callback_requested' || selectedDisposition === 'interested';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Call Outcome & Notes — {leadName}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
          {/* Visual Outcome Selector Grid */}
          <div>
            <label className="block text-slate-700 font-semibold mb-2">
              Select Call Outcome / Disposition *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DISPOSITION_OPTIONS.map((opt) => {
                const isSelected = selectedDisposition === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedDisposition(opt.value)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? `${opt.activeBg} font-bold shadow-2xs ring-1 ring-primary/40`
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? '' : opt.color}`} />
                    <span className="text-[11px] leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Transition Preview */}
          {selectedOpt && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Automatic Status Transition:</span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-600">Current</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[10px]">
                  {selectedOpt.defaultStatus.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}

          {/* Telecaller Discussion Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">
                Discussion Notes & Patient Feedback
              </label>
              <span className="text-[10px] text-slate-400 font-mono">{notes.length}/500</span>
            </div>
            <Textarea
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record chief patient inquiry, questions asked, or appointment date details..."
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Follow-Up Schedule Picker */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Next Follow-Up Date & Time {isFollowUpExpected ? '(Recommended)' : '(Optional)'}
            </label>
            <Input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={`text-xs h-9 ${
                isFollowUpExpected && !followUpDate ? 'border-amber-300 bg-amber-50/30' : ''
              }`}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs bg-primary hover:bg-primary/90 text-white font-semibold px-4"
            >
              Save & Next Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
