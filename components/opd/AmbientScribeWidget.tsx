'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, CheckCircle2, Volume2, Edit3, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { opdApi } from '@/lib/api';

interface AmbientScribeWidgetProps {
  patientId?: string;
  onDataParsed: (parsedData: any) => void;
}

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AmbientScribeWidget({ patientId, onDataParsed }: AmbientScribeWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastParsedStatus, setLastParsedStatus] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');

  // Seconds timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or paste consultation notes.');
      return false;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English / Global English

      finalTranscriptRef.current = '';
      setLiveTranscript('');

      recognition.onstart = () => {
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = finalTranscriptRef.current;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += (final ? ' ' : '') + transcriptSegment;
          } else {
            interim += transcriptSegment;
          }
        }

        finalTranscriptRef.current = final;
        setLiveTranscript(final + (interim ? ' ' + interim : ''));
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Microphone notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // If still supposed to be recording, restart (keeps connection continuous)
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      return true;
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      setErrorMessage(err.message || 'Failed to initialize speech recognition.');
      return false;
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  };

  const processTranscript = async (transcriptText: string) => {
    if (!transcriptText.trim()) {
      setErrorMessage('No consultation notes or speech detected. Please speak or enter notes manually.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const response = await opdApi.parseScribeAudio({
        transcript_or_audio: transcriptText.trim(),
        patient_id: patientId,
      });

      if (response?.extracted_data) {
        onDataParsed(response.extracted_data);
        setLastParsedStatus('Clinical notes auto-filled from Ambient Scribe!');
        setLiveTranscript('');
        finalTranscriptRef.current = '';
        setShowManualModal(false);
        setManualText('');
        setTimeout(() => setLastParsedStatus(null), 5000);
      }
    } catch (err: any) {
      console.error('Scribe error:', err);
      setErrorMessage(err.message || 'Failed to parse consultation with AI Scribe.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      setErrorMessage(null);
      setLastParsedStatus(null);
      const started = startSpeechRecognition();
      if (started) {
        setIsRecording(true);
      }
    } else {
      setIsRecording(false);
      stopSpeechRecognition();
      const captured = finalTranscriptRef.current || liveTranscript;
      await processTranscript(captured);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    await processTranscript(manualText);
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 max-w-lg">
      {/* Error Alert Bubble */}
      {errorMessage && (
        <div className="flex items-center gap-2 bg-amber-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="ml-1 opacity-80 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Success Notification Bubble */}
      {lastParsedStatus && (
        <div className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{lastParsedStatus}</span>
        </div>
      )}

      {/* Real-time Streaming Transcript Box while recording */}
      {isRecording && liveTranscript && (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl border border-slate-700 shadow-2xl w-80 text-xs animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE AMBIENT STREAM</span>
            </div>
            <span className="text-[10px] text-slate-400">{formatTimer(seconds)}</span>
          </div>
          <p className="line-clamp-4 text-slate-200 leading-relaxed italic">
            "{liveTranscript}"
          </p>
        </div>
      )}

      {/* Manual Dictation / Notes Paste Modal */}
      {showManualModal && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xl w-96 text-xs space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Edit3 className="w-4 h-4 text-indigo-600" />
              <span>Consultation Dictation & Notes</span>
            </div>
            <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Paste or type doctor consultation notes, patient complaints, or vitals. The AI Scribe will extract clinical entities into the EMR form.
          </p>
          <textarea
            rows={4}
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="E.g.: Patient BP 130/85, pulse 78. Complains of irregular cycles and pelvic pain. Suspect PCOS. Order AMH, Day 2 LH/FSH."
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowManualModal(false)}
              className="text-xs font-semibold rounded-xl h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleManualSubmit}
              disabled={isProcessing || !manualText.trim()}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 gap-1"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Extract to EMR</span>
            </Button>
          </div>
        </div>
      )}

      {/* Floating Scribe Main Control Card */}
      <div className={`glass-card p-3 rounded-2xl border shadow-2xl flex items-center gap-3 transition-all duration-300 ${
        isRecording ? 'border-red-400 ring-2 ring-red-400/30 bg-red-50/90' : 'border-indigo-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-2.5 pl-2">
          <div className="relative">
            <span className={`w-3 h-3 rounded-full block ${isRecording ? 'bg-red-500 animate-ping' : 'bg-indigo-500'}`} />
            <span className={`w-3 h-3 rounded-full absolute top-0 left-0 ${isRecording ? 'bg-red-600' : 'bg-indigo-600'}`} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                {isRecording ? 'Listening Ambient Scribe...' : isProcessing ? 'AI Structuring Notes...' : 'Ambient AI Scribe'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {isRecording ? `Recording: ${formatTimer(seconds)}` : isProcessing ? 'Extracting clinical schema...' : 'Live browser mic listen'}
            </span>
          </div>
        </div>

        {/* Live CSS Waveform Animation while recording */}
        {isRecording && (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-100/60 rounded-xl h-8">
            {[0.4, 0.8, 0.3, 1, 0.6, 0.9, 0.5, 0.7, 0.2].map((height, idx) => (
              <div
                key={idx}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${height * 20 + 4}px`,
                  animationDuration: `${0.4 + (idx % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {!isRecording && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowManualModal(!showManualModal)}
              title="Type or paste consultation notes"
              className="h-10 w-10 p-0 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600"
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}

          <Button
            onClick={handleToggleRecord}
            disabled={isProcessing}
            size="sm"
            className={`h-10 px-4 rounded-xl font-bold shadow-md transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                <span>Structuring...</span>
              </>
            ) : isRecording ? (
              <>
                <MicOff className="w-4 h-4 mr-1.5" />
                <span>Stop & Parse</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-1.5" />
                <span>Start Scribe</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
