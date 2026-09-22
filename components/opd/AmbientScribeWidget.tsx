'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  Edit3,
  X,
  AlertCircle,
  GripVertical,
  Minimize2,
  Maximize2,
  EyeOff,
  PanelRightClose,
  PanelLeftClose,
  Radio,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useAmbientScribe } from '@/contexts/AmbientScribeContext';

export default function AmbientScribeWidget() {
  const {
    isRecording,
    seconds,
    isProcessing,
    liveTranscript,
    errorMessage,
    lastStatus,
    isWidgetVisible,
    isCollapsed,
    isDocked,
    dockEdge,
    position,
    startRecording,
    stopRecording,
    toggleRecording,
    injectText,
    clearMessages,
    setIsWidgetVisible,
    setIsCollapsed,
    setIsDocked,
    setDockEdge,
    setPosition,
  } = useAmbientScribe();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Drag state refs
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const hasMovedRef = useRef(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right (above 10% from bottom) if uninitialized
  useEffect(() => {
    if (typeof window !== 'undefined' && position.x === -1 && position.y === -1) {
      // Default: ~24px from right, ~11% above bottom (elevated above bottom toolbars/footers)
      const defaultX = Math.max(16, window.innerWidth - 240);
      const defaultY = Math.max(80, Math.floor(window.innerHeight * 0.89) - 44);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position, setPosition]);

  // Handle window resize to clamp within viewport
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined' || position.x === -1) return;
      const widgetWidth = widgetRef.current?.offsetWidth || 200;
      const widgetHeight = widgetRef.current?.offsetHeight || 44;
      const maxX = Math.max(12, window.innerWidth - widgetWidth - 12);
      const maxY = Math.max(60, window.innerHeight - widgetHeight - 16);

      const clampedX = Math.min(Math.max(12, position.x), maxX);
      const clampedY = Math.min(Math.max(60, position.y), maxY);

      if (clampedX !== position.x || clampedY !== position.y) {
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, setPosition]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button / touch
    if (e.button !== 0) return;

    // Don't drag if clicking interactive buttons or inputs
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea')) {
      return;
    }

    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;

    const currentX = position.x >= 0 ? position.x : (typeof window !== 'undefined' ? window.innerWidth - 220 : 100);
    const currentY = position.y >= 0 ? position.y : (typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.38) : 200);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: currentX,
      posY: currentY,
    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const widgetWidth = widgetRef.current?.offsetWidth || 200;
    const widgetHeight = widgetRef.current?.offsetHeight || 44;
    const maxX = Math.max(12, window.innerWidth - widgetWidth - 12);
    const maxY = Math.max(60, window.innerHeight - widgetHeight - 16);

    const newX = Math.min(Math.max(12, dragStartRef.current.posX + deltaX), maxX);
    const newY = Math.min(Math.max(60, dragStartRef.current.posY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    // If widget dropped very close to screen edge (within 30px), auto-dock
    if (hasMovedRef.current) {
      const widgetWidth = widgetRef.current?.offsetWidth || 200;
      if (position.x > window.innerWidth - widgetWidth - 30) {
        setDockEdge('right');
      } else if (position.x < 30) {
        setDockEdge('left');
      }
    }
  };

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    injectText(manualText);
    setManualText('');
    setShowManualModal(false);
  };

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // If user explicitly hid the widget, keep hidden (accessible via TopBar)
  if (!isWidgetVisible) {
    return null;
  }

  // Calculate current display coordinates
  const currentX = position.x >= 0 ? position.x : (typeof window !== 'undefined' ? window.innerWidth - 240 : 100);
  const currentY = position.y >= 0 ? position.y : (typeof window !== 'undefined' ? Math.floor(window.innerHeight * 0.89) - 44 : 200);

  // Determine whether expanded card should open upwards or downwards based on Y position
  const opensUpwards = typeof window !== 'undefined' && currentY > window.innerHeight * 0.6;

  // -------------------------------------------------------------
  // MODE 1: DOCKED TO SCREEN EDGE (Zero-Obstruction Mode)
  // -------------------------------------------------------------
  if (isDocked) {
    const isRight = dockEdge === 'right';
    return (
      <div
        ref={widgetRef}
        style={{
          top: `${currentY}px`,
          [isRight ? 'right' : 'left']: 0,
        }}
        className="fixed z-40 select-none group pointer-events-auto print:hidden"
      >
        <div
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (isRecording) {
              setIsExpanded(true);
            } else {
              setIsDocked(false);
            }
          }}
          className={`flex items-center gap-1.5 py-2 px-2.5 shadow-lg border backdrop-blur-md cursor-pointer transition-all duration-200 ${
            isRight
              ? 'rounded-l-xl border-r-0 hover:translate-x-[-4px]'
              : 'rounded-r-xl border-l-0 hover:translate-x-[4px]'
          } ${
            isRecording
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-500/30 animate-pulse'
              : 'bg-white/95 text-slate-800 border-slate-200/90 hover:bg-white shadow-slate-900/10 hover:border-primary/50'
          }`}
          title="Ambient Scribe (Docked) - Click to expand or press Alt+D"
        >
          {isRecording ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-ping flex-shrink-0" />
              <Mic className="w-4 h-4 text-white flex-shrink-0" />
              <span className="text-[11px] font-mono font-bold">{formatTimer(seconds)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <Mic className="w-4 h-4 text-slate-700 flex-shrink-0 group-hover:text-primary transition-colors" />
              <span className="text-[11px] font-bold tracking-tight hidden group-hover:inline transition-all">
                Scribe
              </span>
            </div>
          )}

          {/* Undock button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              setIsDocked(false);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            title="Undock / Float Widget"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // MODE 2 & 3: DRAGGABLE FLOATING PILL & EXPANDED AUDIO PALETTE
  // -------------------------------------------------------------
  return (
    <div
      ref={widgetRef}
      style={{
        transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-40 select-none pointer-events-auto transition-shadow print:hidden ${
        isDragging ? 'cursor-grabbing opacity-90 scale-[1.02]' : 'cursor-grab'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="relative flex flex-col items-end">
        {/* Status / Error Toast Bubble */}
        {(errorMessage || lastStatus) && (
          <div
            className={`absolute ${
              opensUpwards ? 'bottom-full mb-2' : 'top-full mt-2'
            } right-0 flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xl animate-in fade-in zoom-in-95 z-50 whitespace-nowrap max-w-sm ${
              errorMessage
                ? 'bg-amber-600 text-white border border-amber-500'
                : 'bg-emerald-600 text-white border border-emerald-500'
            }`}
          >
            {errorMessage ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="truncate">{errorMessage || lastStatus}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearMessages();
              }}
              className="ml-1 opacity-80 hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Live Audio & Streaming Transcript Palette (Expanded or Recording) */}
        {(isRecording || isExpanded) && (
          <div
            className={`absolute ${
              opensUpwards ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
            } right-0 w-80 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-2xl p-3.5 space-y-2.5 text-xs animate-in fade-in zoom-in-95 z-50`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Palette Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                  }`}
                />
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  {isRecording ? 'Listening Ambiently...' : 'Scribe Standby'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isRecording && (
                  <span className="font-mono font-bold text-[11px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {formatTimer(seconds)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  title="Minimize palette"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live Waveform Indicator when recording */}
            {isRecording && (
              <div className="flex items-center justify-center gap-1 py-1.5 bg-rose-50/70 rounded-lg border border-rose-100">
                {[0.3, 0.7, 0.4, 0.95, 0.6, 0.85, 0.5, 0.75, 0.35, 0.65].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-rose-500 rounded-full animate-pulse"
                    style={{
                      height: `${h * 18 + 4}px`,
                      animationDuration: `${0.35 + (i % 4) * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Live Streaming Transcript */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 min-h-[52px] max-h-28 overflow-y-auto">
              {liveTranscript ? (
                <p className="text-slate-700 italic text-[11px] leading-relaxed">
                  "{liveTranscript}"
                </p>
              ) : (
                <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-slate-400" />
                  <span>
                    {isRecording
                      ? 'Speak naturally (patient complaints, vitals, exam findings)...'
                      : 'Click an input field, then start dictating.'}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Actions in Palette */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowManualModal(true);
                  setIsExpanded(false);
                }}
                className="text-[11px] h-7 px-2 text-slate-600 hover:text-primary gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Paste Notes</span>
              </Button>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={toggleRecording}
                  disabled={isProcessing}
                  className={`text-xs font-bold h-7 px-3 rounded-lg shadow-sm gap-1.5 ${
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="w-3 h-3" />
                  ) : (
                    <Mic className="w-3 h-3" />
                  )}
                  <span>{isRecording ? 'Stop & Insert' : 'Start Dictation'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Mini Pill / Control Bar (Collapsed vs Expanded Mode) */}
        {isCollapsed && !isExpanded ? (
          <div className="relative group flex items-center">
            {/* Hover Tooltip / Expand Button */}
            <div className="absolute right-full mr-2 hidden group-hover:flex items-center gap-1.5 bg-slate-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap animate-in fade-in zoom-in-95 pointer-events-none">
              <span>{isRecording ? 'Recording Live... (Alt+D)' : 'AI Voice Scribe (Alt+D)'}</span>
            </div>

            {/* Collapsed Circular FAB */}
            <div
              className={`relative flex items-center justify-center rounded-full shadow-xl transition-all duration-200 select-none ${
                isRecording
                  ? 'w-12 h-12 bg-rose-600 text-white border-2 border-white ring-4 ring-rose-500/30 animate-pulse cursor-pointer'
                  : 'w-11 h-11 bg-gradient-to-tr from-[rgb(var(--clr-primary))] via-[#0B4F6C] to-emerald-600 text-white border-2 border-white/80 hover:scale-105 hover:shadow-2xl cursor-pointer'
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                toggleRecording();
              }}
              title={isRecording ? 'Click to Stop & Insert' : 'Click to start AI Scribe (Alt+D)'}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isRecording ? (
                <div className="flex flex-col items-center justify-center">
                  <Mic className="w-4 h-4" />
                  <span className="text-[9px] font-mono font-bold leading-none mt-0.5">{formatTimer(seconds)}</span>
                </div>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <Sparkles className="w-3 h-3 text-amber-300 absolute top-1.5 right-1.5 animate-pulse" />
                </>
              )}

              {/* Small Expand Button On Hover */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(false);
                }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                title="Expand Scribe Toolbar"
              >
                <Maximize2 className="w-2.5 h-2.5 text-slate-700" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`flex items-center gap-1.5 p-1 rounded-full shadow-lg border backdrop-blur-md transition-all duration-200 ${
              isRecording
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
                : 'bg-white/95 border-slate-200/90 hover:border-slate-300'
            }`}
          >
            {/* Drag Handle */}
            <div
              className="flex items-center justify-center pl-1.5 pr-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
              title="Drag to reposition widget"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Primary Voice Scribe Toggle Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                toggleRecording();
              }}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-300/60 animate-pulse'
                  : 'bg-gradient-to-r from-primary via-primary-mid to-accent text-white hover:opacity-95'
              }`}
              title={
                isRecording
                  ? 'Stop Recording & Insert Text (Alt+D)'
                  : 'Start AI Voice Dictation (Alt+D)'
              }
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <Mic className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold">{formatTimer(seconds)}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <Mic className="w-3.5 h-3.5" />
                  <span>Dictate</span>
                  <span className="text-[10px] opacity-70 font-mono hidden sm:inline">Alt+D</span>
                </>
              )}
            </button>

            {/* Expand / Details Toggle Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className={`p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                isExpanded ? 'text-primary bg-primary/10' : ''
              }`}
              title="Toggle Live Audio Palette"
            >
              <Radio className="w-3.5 h-3.5" />
            </button>

            {/* Quick Paste Notes Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setShowManualModal(true);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Type or paste consultation notes manually"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            {/* Collapse to Floating FAB Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                setIsCollapsed(true);
                setIsExpanded(false);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Collapse to compact floating button"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {/* Dock to Edge Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const isCloserToLeft = currentX < (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);
                setDockEdge(isCloserToLeft ? 'left' : 'right');
                setIsDocked(true);
                setIsExpanded(false);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Dock to screen margin (Zero-Obstruction Mode)"
            >
              {currentX < (typeof window !== 'undefined' ? window.innerWidth / 2 : 400) ? (
                <PanelLeftClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRightClose className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Hide / Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsWidgetVisible(false);
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mr-0.5"
              title="Hide floating widget (Can reopen anytime from the top bar)"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Manual Dictation / Notes Paste Modal */}
      {showManualModal && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowManualModal(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Manual Clinical Dictation</h3>
                  <p className="text-[11px] text-slate-500">
                    Paste external transcription or notes to insert into active input.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={5}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="E.g.: Patient presents with primary infertility for 3 years. Pelvic ultrasound reveals right ovary AFC 8, left ovary AFC 7. Endometrial thickness 7.2mm..."
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none leading-relaxed transition-all"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Tip: Focus any form input field before clicking Insert.
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowManualModal(false)}
                  className="text-xs font-semibold h-8 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleManualSubmit}
                  disabled={isProcessing || !manualText.trim()}
                  className="text-xs font-bold bg-primary hover:bg-primary/90 text-white h-8 rounded-lg gap-1.5"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Insert Text</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
