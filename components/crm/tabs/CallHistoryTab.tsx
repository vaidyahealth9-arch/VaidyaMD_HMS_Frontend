'use client';

import React, { useState, useMemo } from 'react';
import { 
  PhoneCall, 
  Clock, 
  Mic, 
  FileText, 
  Download, 
  Search, 
  RefreshCw, 
  Volume2, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Copy,
  Check
} from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { CallLog } from '../types';
import { getApiBase } from '@/lib/api';

interface CallHistoryTabProps {
  calls: CallLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const CallHistoryTab: React.FC<CallHistoryTabProps> = ({
  calls,
  isLoading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisposition, setFilterDisposition] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered Calls
  const filteredCalls = useMemo(() => {
    return calls.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        c.phone_dialed.toLowerCase().includes(q) ||
        (c.lead_name && c.lead_name.toLowerCase().includes(q)) ||
        (c.transcript_text && c.transcript_text.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      const matchesDisp = 
        filterDisposition === 'ALL' ||
        (c.disposition && c.disposition.toUpperCase() === filterDisposition);

      return matchesSearch && matchesDisp;
    });
  }, [calls, searchQuery, filterDisposition]);

  // Aggregate Metrics
  const totalTalkSeconds = useMemo(() => {
    return calls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
  }, [calls]);

  const transcribedCount = useMemo(() => {
    return calls.filter((c) => c.transcript_status === 'completed' && c.transcript_text).length;
  }, [calls]);

  const recordingsCount = useMemo(() => {
    return calls.filter((c) => Boolean(c.recording_file_path)).length;
  }, [calls]);

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0s';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    if (mins === 0) return `${s}s`;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const formatTotalTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m ${sec % 60}s`;
  };

  const getAudioUrl = (c: CallLog) => {
    if (c.recording_file_path?.startsWith('http')) {
      return c.recording_file_path;
    }
    return `${getApiBase()}/crm/calls/${c.id}/recording`;
  };

  const handleCopyTranscript = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getDispositionBadge = (disp?: string | null) => {
    if (!disp) {
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-xs">
          Not Logged
        </Badge>
      );
    }
    const clean = disp.replace(/_/g, ' ').toUpperCase();
    switch (clean) {
      case 'INTERESTED':
        return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">Interested</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-bold">Converted</Badge>;
      case 'FOLLOW UP':
      case 'CALLBACK REQUESTED':
        return <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">Follow Up</Badge>;
      case 'BUSY':
      case 'NO ANSWER':
        return <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">{clean}</Badge>;
      case 'NOT INTERESTED':
      case 'WRONG NUMBER':
        return <Badge className="bg-rose-50 text-rose-700 border border-rose-200 text-xs">{clean}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{clean}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Calls Logged</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{calls.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <PhoneCall className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Talk Time</p>
              <h3 className="text-2xl font-bold text-primary mt-1">{formatTotalTime(totalTalkSeconds)}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Whisper Transcripts</p>
              <h3 className="text-2xl font-bold text-teal-700 mt-1">{transcribedCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recordings Archived</p>
              <h3 className="text-2xl font-bold text-amber-700 mt-1">{recordingsCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Volume2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search phone, patient, transcript text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterDisposition}
              onChange={(e) => setFilterDisposition(e.target.value)}
              aria-label="Filter by call outcome"
              className="text-xs border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Outcomes</option>
              <option value="INTERESTED">Interested</option>
              <option value="CONVERTED">Converted</option>
              <option value="FOLLOW UP">Follow Up</option>
              <option value="BUSY">Busy</option>
              <option value="NO ANSWER">No Answer</option>
              <option value="NOT INTERESTED">Not Interested</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-xs text-slate-700 bg-white hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Calls Table / Cards */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-slate-200">
            <PhoneCall className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-700">No call records found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Calls placed from the Telecaller companion mobile app will appear here along with audio and Whisper transcripts.
            </p>
          </Card>
        ) : (
          filteredCalls.map((c) => {
            const hasAudio = Boolean(c.recording_file_path);
            const hasTranscript = Boolean(c.transcript_text && !c.transcript_text.startsWith('[Notice'));

            return (
              <Card key={c.id} className="p-5 bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Lead Info & Call Meta */}
                  <div className="space-y-1 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {c.lead_name || 'Patient Lead'}
                      </span>
                      {getDispositionBadge(c.disposition)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-primary font-semibold">{c.phone_dialed}</span>
                      <span>•</span>
                      <span>{new Date(c.call_started_at || c.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Talk Time Duration */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-100 min-w-[110px] justify-center">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-mono font-bold text-primary">
                      {formatDuration(c.duration_seconds)}
                    </span>
                  </div>

                  {/* Audio Player */}
                  <div className="flex items-center gap-2 min-w-[260px]">
                    {hasAudio ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <audio 
                          controls 
                          preload="none" 
                          src={getAudioUrl(c)} 
                          className="h-8 max-w-[210px] outline-none"
                        />
                        <a 
                          href={getAudioUrl(c)} 
                          download={`call_${c.phone_dialed}_${c.id}.aac`}
                          title="Download Audio Recording"
                          className="p-1.5 text-slate-500 hover:text-primary rounded-md hover:bg-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-dashed border-slate-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>No audio recording</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Whisper Speech-to-Text Transcript Section */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Mic className="w-3.5 h-3.5 text-teal-600" />
                      <span>Faster-Whisper Transcript</span>
                      {c.transcript_status === 'completed' && hasTranscript && (
                        <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 font-normal">
                          Transcribed
                        </span>
                      )}
                      {c.transcript_status === 'processing' && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-normal animate-pulse">
                          Transcribing...
                        </span>
                      )}
                    </div>

                    {hasTranscript && c.transcript_text && (
                      <button
                        onClick={() => handleCopyTranscript(c.id, c.transcript_text!)}
                        className="text-[11px] text-slate-500 hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        {copiedId === c.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {hasTranscript && c.transcript_text ? (
                    <div className="p-3 bg-teal-50/40 border border-teal-100 rounded-md text-xs text-slate-800 leading-relaxed italic">
                      "{c.transcript_text}"
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 rounded-md text-xs text-slate-500 italic">
                      {c.transcript_text || 'No speech transcript generated yet.'}
                    </div>
                  )}

                  {/* Telecaller Notes if available */}
                  {c.notes && (
                    <div className="mt-2 text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="font-semibold text-slate-700">Telecaller Notes:</span>
                      <span>{c.notes}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
