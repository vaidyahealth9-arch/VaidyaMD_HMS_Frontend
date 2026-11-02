'use client';

import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  MapPin, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Smartphone,
  Battery,
  AlertCircle,
  PhoneOff,
  User,
  Activity,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { DialerQueueItem, TelecallerRosterItem } from '../types';

interface DialerQueueTabProps {
  queueItem: DialerQueueItem | null;
  onCallInitiated: (leadId: string, phone: string) => void;
  onSkipNext: () => void;
  isLoading: boolean;
  roster?: TelecallerRosterItem[];
  activeCallId?: string | null;
  onEndCall?: () => void;
}

export const DialerQueueTab: React.FC<DialerQueueTabProps> = ({
  queueItem,
  onCallInitiated,
  onSkipNext,
  isLoading,
  roster = [],
  activeCallId = null,
  onEndCall,
}) => {
  const [callTimer, setCallTimer] = useState(0);

  // Active connected companion device
  const onlineDevice = roster.find((r) => r.is_online && !r.is_revoked);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeCallId) {
      interval = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCallId]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-white rounded-xl border border-slate-200">
        <Clock className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium">Fetching next priority lead...</p>
      </div>
    );
  }

  if (!queueItem) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-white rounded-xl border border-slate-200 shadow-xs">
        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Queue is Clear!</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
          No pending leads or due follow-ups in the priority queue right now. You can import new leads or review the directory list.
        </p>
      </div>
    );
  }

  const { lead, previous_call_count, last_disposition, last_notes } = queueItem;

  const priorityBorder =
    lead.priority === 3
      ? 'border-l-4 border-l-rose-500'
      : lead.priority === 2
      ? 'border-l-4 border-l-amber-500'
      : 'border-l-4 border-l-primary';

  const priorityBadge =
    lead.priority === 3
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : lead.priority === 2
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-700 border-slate-200';

  const handleDial = () => {
    onCallInitiated(lead.id, lead.phone);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Lead Information Card */}
      <div className="lg:col-span-2 space-y-4">
        <Card className={`p-6 border-slate-200 shadow-xs bg-white ${priorityBorder} transition-all`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.name}</h2>
                <Badge variant="outline" className={`text-[11px] font-semibold ${priorityBadge}`}>
                  {lead.priority === 3 ? '🔴 Urgent Priority' : lead.priority === 2 ? '🟡 High Priority' : 'Standard'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                {lead.city && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {lead.city}{lead.state ? `, ${lead.state}` : ''}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Source: <strong className="text-slate-700 capitalize">{lead.source.replace('_', ' ')}</strong>
                </span>
                {lead.source_campaign && (
                  <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                    Campaign: {lead.source_campaign}
                  </span>
                )}
              </div>
            </div>

            <Badge className="bg-primary/10 text-primary border-none text-xs font-semibold px-3 py-1 uppercase tracking-wide">
              {lead.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Active Call Live Banner (if a call is in progress) */}
          {activeCallId && (
            <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                </span>
                <div>
                  <div className="text-xs font-bold text-rose-900">SIM CALL IN PROGRESS</div>
                  <div className="text-lg font-mono font-bold text-rose-700">{formatTimer(callTimer)}</div>
                </div>
              </div>

              {onEndCall && (
                <Button
                  size="sm"
                  onClick={onEndCall}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 shadow-sm"
                >
                  <PhoneOff className="w-3.5 h-3.5 mr-1.5" />
                  End Call & Log Outcome
                </Button>
              )}
            </div>
          )}

          {/* Primary Contact Bar */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Primary Phone Contact</div>
              <div className="text-xl font-mono font-bold text-slate-900 tracking-wide mt-0.5">
                {lead.phone}
              </div>
              {lead.alternate_phone && (
                <div className="text-xs text-slate-500 font-mono mt-0.5">Alt: {lead.alternate_phone}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onSkipNext}
                disabled={Boolean(activeCallId)}
                className="text-xs text-slate-600 border-slate-300 hover:bg-slate-100"
              >
                Skip / Next Lead
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const cleanPhone = lead.phone.replace(/\D/g, '').slice(-10);
                  const msg = `Hello ${lead.name}, thank you for contacting VaidyaMD. How can our clinic team assist you today?`;
                  window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
              >
                <MessageSquare className="w-4 h-4 mr-1.5 text-emerald-600" />
                WhatsApp
              </Button>
              <Button
                size="lg"
                onClick={handleDial}
                disabled={Boolean(activeCallId)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4 mr-2" />
                {activeCallId ? 'Call Active...' : 'Dial Now'}
              </Button>
            </div>
          </div>

          {/* Previous Interaction History */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Previous Interactions</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1">Total Previous Attempts</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{previous_call_count} times</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1">Last Interaction Outcome</span>
                <span className="font-bold text-slate-800 text-sm capitalize">
                  {last_disposition ? last_disposition.replace('_', ' ') : 'First Contact (New Lead)'}
                </span>
              </div>
            </div>

            {last_notes && (
              <div className="mt-3.5 p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-amber-900 leading-relaxed">
                <strong className="font-semibold">Last Notes:</strong> {last_notes}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column: Telephony Bridge Status */}
      <div className="space-y-4">
        <Card className="p-5 border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-900 font-semibold text-sm mb-3">
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Telephony SIM Bridge
            </span>
            {onlineDevice ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
                ● Live Linked
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-semibold">
                ● Device Offline
              </Badge>
            )}
          </div>

          {onlineDevice ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {onlineDevice.device_model || 'Android Phone'}
                </span>
                <span className="font-mono text-[11px] font-normal text-emerald-700">
                  {onlineDevice.sim_operator || 'SIM Active'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-600" />
                  Battery: {onlineDevice.battery_level ?? 100}%
                </span>
                <span className="font-mono">v{onlineDevice.app_version || '1.1.0'}</span>
              </div>

              <p className="mt-2 text-emerald-800 text-[11px] leading-relaxed">
                Clicking <strong>Dial Now</strong> pushes the phone number straight to your connected phone for instant SIM calling.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                No Mobile Device Connected
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Open the <strong>VaidyaMD Telecaller</strong> companion app on your phone and tap Connect to enable one-click browser-to-SIM dialing.
              </p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <div className="flex justify-between">
              <span>Speech-to-Text:</span>
              <strong className="text-slate-700 font-semibold">Faster-Whisper (Self-Hosted)</strong>
            </div>
            <div className="flex justify-between">
              <span>Telephony Call Cost:</span>
              <strong className="text-emerald-700 font-bold">₹0 / min (Standard SIM)</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
