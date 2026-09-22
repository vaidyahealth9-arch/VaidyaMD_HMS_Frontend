'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface WidgetPosition {
  x: number;
  y: number;
}

interface AmbientScribeContextType {
  isRecording: boolean;
  seconds: number;
  isProcessing: boolean;
  liveTranscript: string;
  errorMessage: string | null;
  lastStatus: string | null;
  isWidgetVisible: boolean;
  isCollapsed: boolean;
  isDocked: boolean;
  dockEdge: 'left' | 'right';
  position: WidgetPosition;
  // Actions
  startRecording: () => boolean;
  stopRecording: () => void;
  toggleRecording: () => void;
  injectText: (transcriptText: string) => void;
  clearMessages: () => void;
  setIsWidgetVisible: (visible: boolean) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsDocked: (docked: boolean) => void;
  setDockEdge: (edge: 'left' | 'right') => void;
  setPosition: (pos: WidgetPosition) => void;
  resetPosition: () => void;
}

const STORAGE_KEY_CONFIG = 'vaidya_scribe_config_v4';

const AmbientScribeContext = createContext<AmbientScribeContextType | undefined>(undefined);

export function AmbientScribeProvider({ children }: { children: React.ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');

  // UI state preferences (Default collapsed to prevent obstructing page actions)
  const [isWidgetVisible, setIsWidgetVisibleState] = useState(true);
  const [isCollapsed, setIsCollapsedState] = useState(true);
  const [isDocked, setIsDockedState] = useState(false);
  const [dockEdge, setDockEdgeState] = useState<'left' | 'right'>('right');
  const [position, setPositionState] = useState<WidgetPosition>({ x: -1, y: -1 });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const lastTargetRef = useRef<{
    element: HTMLInputElement | HTMLTextAreaElement;
    selectionStart: number;
    selectionEnd: number;
  } | null>(null);

  // Global listener: Record the currently active input/textarea and exact cursor coordinates
  useEffect(() => {
    const handleTargetActivity = () => {
      const el = document.activeElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
        lastTargetRef.current = {
          element: inputEl,
          selectionStart: inputEl.selectionStart ?? inputEl.value.length,
          selectionEnd: inputEl.selectionEnd ?? inputEl.value.length,
        };
      }
    };

    document.addEventListener('focusin', handleTargetActivity);
    document.addEventListener('input', handleTargetActivity);
    document.addEventListener('keyup', handleTargetActivity);
    document.addEventListener('mouseup', handleTargetActivity);
    document.addEventListener('selectionchange', handleTargetActivity);

    return () => {
      document.removeEventListener('focusin', handleTargetActivity);
      document.removeEventListener('input', handleTargetActivity);
      document.removeEventListener('keyup', handleTargetActivity);
      document.removeEventListener('mouseup', handleTargetActivity);
      document.removeEventListener('selectionchange', handleTargetActivity);
    };
  }, []);

  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setLastStatus(null);
  }, []);

  const injectText = useCallback((transcriptText: string) => {
    if (!transcriptText.trim()) {
      setErrorMessage('No speech detected.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Identify destination input element (active or recently active before mic click)
      let activeElement: HTMLInputElement | HTMLTextAreaElement | null = null;
      const currentActive = document.activeElement;

      if (currentActive && (currentActive.tagName === 'INPUT' || currentActive.tagName === 'TEXTAREA')) {
        activeElement = currentActive as HTMLInputElement | HTMLTextAreaElement;
      } else if (lastTargetRef.current?.element && document.body.contains(lastTargetRef.current.element)) {
        activeElement = lastTargetRef.current.element;
      } else {
        // Fallback: Primary clinical history textarea on the page
        activeElement =
          (document.querySelector('textarea[name="present_history"]') as HTMLTextAreaElement) ||
          (document.querySelector('textarea[name="chief_complaints"]') as HTMLTextAreaElement) ||
          (document.querySelector('textarea') as HTMLTextAreaElement) ||
          (document.querySelector('input[type="text"]') as HTMLInputElement) ||
          null;
      }

      if (activeElement) {
        // Refocus the element so the cursor stays live
        activeElement.focus();

        const currentText = activeElement.value || '';
        const savedStart = lastTargetRef.current?.element === activeElement
          ? lastTargetRef.current.selectionStart
          : (activeElement.selectionStart ?? currentText.length);
        const savedEnd = lastTargetRef.current?.element === activeElement
          ? lastTargetRef.current.selectionEnd
          : (activeElement.selectionEnd ?? currentText.length);

        const start = Math.min(Math.max(0, savedStart), currentText.length);
        const end = Math.min(Math.max(start, savedEnd), currentText.length);

        const prefix = currentText.slice(0, start);
        const suffix = currentText.slice(end);

        const textToInsert =
          (prefix && !prefix.endsWith(' ') && !prefix.endsWith('\n') ? ' ' : '') +
          transcriptText.trim();
        const newText = prefix + textToInsert + suffix;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value'
        )?.set;

        if (activeElement.tagName === 'INPUT' && nativeInputValueSetter) {
          nativeInputValueSetter.call(activeElement, newText);
        } else if (activeElement.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
          nativeTextAreaValueSetter.call(activeElement, newText);
        } else {
          activeElement.value = newText;
        }

        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        activeElement.dispatchEvent(new Event('change', { bubbles: true }));

        const newCursorPos = start + textToInsert.length;
        activeElement.setSelectionRange(newCursorPos, newCursorPos);

        // Update tracking to the new cursor position
        lastTargetRef.current = {
          element: activeElement,
          selectionStart: newCursorPos,
          selectionEnd: newCursorPos,
        };

        setLastStatus('Text inserted at cursor position');
      } else {
        navigator.clipboard.writeText(transcriptText.trim());
        setLastStatus('Copied to clipboard (Click on an input field to dictate directly)');
      }

      setLiveTranscript('');
      finalTranscriptRef.current = '';
      setTimeout(() => setLastStatus(null), 4000);
    } catch (err: any) {
      console.error('Insertion error:', err);
      setErrorMessage(err.message || 'Failed to insert text.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Load saved preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isWidgetVisible === 'boolean') setIsWidgetVisibleState(parsed.isWidgetVisible);
        if (typeof parsed.isCollapsed === 'boolean') setIsCollapsedState(parsed.isCollapsed);
        if (typeof parsed.isDocked === 'boolean') setIsDockedState(parsed.isDocked);
        if (parsed.dockEdge === 'left' || parsed.dockEdge === 'right') setDockEdgeState(parsed.dockEdge);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPositionState({ x: parsed.x, y: parsed.y });
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  // Save preferences
  const persistConfig = (updates: Partial<{ isWidgetVisible: boolean; isCollapsed: boolean; isDocked: boolean; dockEdge: 'left' | 'right'; x: number; y: number }>) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      const current = saved ? JSON.parse(saved) : {};
      const next = { ...current, ...updates };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const setIsWidgetVisible = (visible: boolean) => {
    setIsWidgetVisibleState(visible);
    persistConfig({ isWidgetVisible: visible });
  };

  const setIsCollapsed = (collapsed: boolean) => {
    setIsCollapsedState(collapsed);
    persistConfig({ isCollapsed: collapsed });
  };

  const setIsDocked = (docked: boolean) => {
    setIsDockedState(docked);
    persistConfig({ isDocked: docked });
  };

  const setDockEdge = (edge: 'left' | 'right') => {
    setDockEdgeState(edge);
    persistConfig({ dockEdge: edge });
  };

  const setPosition = (pos: WidgetPosition) => {
    setPositionState(pos);
    persistConfig({ x: pos.x, y: pos.y });
  };

  const resetPosition = () => {
    setPositionState({ x: -1, y: -1 });
    setIsDockedState(false);
    setIsCollapsedState(true);
    setIsWidgetVisibleState(true);
    try {
      localStorage.removeItem(STORAGE_KEY_CONFIG);
    } catch {}
  };

  // Timer effect
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

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);


  const startRecording = useCallback((): boolean => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian / Global English

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
        if (isRecording && recognitionRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      return true;
    } catch (err: any) {
      console.error('Failed to start SpeechRecognition:', err);
      setErrorMessage(err.message || 'Failed to initialize speech recognition.');
      return false;
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    const captured = finalTranscriptRef.current || liveTranscript;
    injectText(captured);
  }, [injectText, liveTranscript]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Global keyboard shortcut: Alt+D or Option+D to toggle dictation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt+D / Option+D
      if (e.altKey && (e.key === 'd' || e.key === 'D' || e.code === 'KeyD')) {
        e.preventDefault();
        toggleRecording();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleRecording]);

  return (
    <AmbientScribeContext.Provider
      value={{
        isRecording,
        seconds,
        isProcessing,
        liveTranscript,
        errorMessage,
        lastStatus,
        isWidgetVisible,
        isDocked,
        dockEdge,
        position,
        isCollapsed,
        startRecording,
        stopRecording,
        toggleRecording,
        injectText,
        clearMessages,
        setIsWidgetVisible,
        setIsDocked,
        setDockEdge,
        setPosition,
        setIsCollapsed,
        resetPosition,
      }}
    >
      {children}
    </AmbientScribeContext.Provider>
  );
}

export function useAmbientScribe() {
  const context = useContext(AmbientScribeContext);
  if (!context) {
    throw new Error('useAmbientScribe must be used within an AmbientScribeProvider');
  }
  return context;
}
