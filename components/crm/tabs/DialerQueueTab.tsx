'use client';

import React, { useState } from 'react';
import { 
  PhoneCall, 
  MapPin, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Smartphone
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { DialerQueueItem } from '../types';

interface DialerQueueTabProps {
  queueItem: DialerQueueItem | null;
  onCallInitiated: (leadId: string, phone: string) => void;
  onSkipNext: () => void;
  isLoading: boolean;
}

export const DialerQueueTab: React.FC<DialerQueueTabProps> = ({
  queueItem,
  onCallInitiated,
  onSkipNext,
  isLoading,
}) => {
  const [callingState, setCallingState] = useState<'idle' | 'calling'>('idle');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-xl border border-slate-200">
        <Clock className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm">Fetching next lead in priority queue...</p>
      </div>
    );
  }

  if (!queueItem) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-xl border border-slate-200">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">Queue is Clear!</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          No pending leads or due follow-ups in the dialing queue right now. You can import new leads or review the leads list.
        </p>
      </div>
    );
  }

  const { lead, previous_call_count, last_disposition, last_notes } = queueItem;

  const handleDial = () => {
    setCallingState('calling');
    onCallInitiated(lead.id, lead.phone);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Lead Information Card */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-6 border-slate-200 shadow-sm bg-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
                <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-700 font-mono">
                  Priority: {lead.priority === 3 ? 'Urgent' : lead.priority === 2 ? 'High' : 'Normal'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                {lead.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lead.city}{lead.state ? `, ${lead.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Source: <strong className="text-slate-700 capitalize">{lead.source.replace('_', ' ')}</strong>
                </span>
                {lead.source_campaign && (
                  <span className="text-slate-600 italic">
                    Campaign: {lead.source_campaign}
                  </span>
                )}
              </div>
            </div>

            <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-2.5 py-1 uppercase">
              {lead.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Primary Contact</div>
              <div className="text-lg font-mono font-bold text-slate-900 tracking-wide mt-0.5">
                {lead.phone}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSkipNext}
                className="text-xs text-slate-600 border-slate-200 hover:bg-slate-100"
              >
                Skip / Next Lead
              </Button>
              <Button
                size="lg"
                onClick={handleDial}
                disabled={callingState === 'calling'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                {callingState === 'calling' ? 'Calling...' : 'Dial Now'}
              </Button>
            </div>
          </div>

          {/* Previous Interaction History */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Previous Interactions</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Total Previous Calls</span>
                <span className="font-semibold text-slate-800 text-sm">{previous_call_count} times</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Last Call Outcome</span>
                <span className="font-semibold text-slate-800 text-sm capitalize">
                  {last_disposition ? last_disposition.replace('_', ' ') : 'First Contact'}
                </span>
              </div>
            </div>

            {last_notes && (
              <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200/60 rounded-lg text-xs text-amber-900">
                <strong>Previous Notes:</strong> {last_notes}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Telephony Bridge Status */}
      <div className="space-y-4">
        <Card className="p-5 border-slate-200 bg-white">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-3">
            <Smartphone className="w-4 h-4 text-primary" />
            Telephony Bridge (Android SIM)
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Zero-Cost SIM Calling Ready
            </div>
            <p className="mt-1 text-emerald-700 text-[11px] leading-relaxed">
              Clicking <strong>Dial Now</strong> triggers your connected phone to place the call via standard SIM. When the call terminates, the audio auto-uploads for Whisper transcription.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>Speech-to-Text:</span>
              <strong className="text-slate-700">Faster-Whisper (Self-Hosted)</strong>
            </div>
            <div className="flex justify-between">
              <span>Telephony Cost:</span>
              <strong className="text-emerald-700">₹0 / min</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
