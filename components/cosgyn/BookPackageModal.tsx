'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Sparkles,
  Zap,
  Activity,
  Calendar,
  RotateCcw,
  Receipt,
  Search,
  X,
  Check,
  AlertTriangle,
  Printer,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface EditableSessionItem {
  id: string;
  equipment: string;
  session_number: number;
  date: string;
  time: string;
  duration_mins: number;
  notes?: string;
}

interface BookPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: any[];
  treatments: any[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  selectedTreatmentId: string;
  setSelectedTreatmentId: (id: string) => void;
  selectedTreatment: any;
  cosgynStartDate: string;
  setCosgynStartDate: (d: string) => void;
  cosgynTime: string;
  setCosgynTime: (t: string) => void;
  cosgynFrequency: string;
  setCosgynFrequency: (f: string) => void;
  cosgynDuration: number;
  setCosgynDuration: (d: number) => void;
  teslaStartDate: string;
  setTeslaStartDate: (d: string) => void;
  teslaTime: string;
  setTeslaTime: (t: string) => void;
  teslaFrequency: string;
  setTeslaFrequency: (f: string) => void;
  teslaDuration: number;
  setTeslaDuration: (d: number) => void;
  editableSessions: EditableSessionItem[];
  generateSessions: () => void;
  handleEditSessionRow: (index: number, field: keyof EditableSessionItem, value: any) => void;
  isSlotBooked: (equip: string, date: string, time: string) => boolean;
  bookingPackagePrice: number;
  setBookingPackagePrice: (p: number) => void;
  bookingBillingChoice: 'bill_later' | 'bill_now';
  setBookingBillingChoice: (c: 'bill_later' | 'bill_now') => void;
  bookingDiscount: number;
  setBookingDiscount: (d: number) => void;
  bookingPaidAmount: number | null;
  setBookingPaidAmount: (a: number | null) => void;
  bookingPaymentMethod: string;
  setBookingPaymentMethod: (m: string) => void;
  bookingUpiRef: string;
  setBookingUpiRef: (ref: string) => void;
  bookingNotes: string;
  setBookingNotes: (n: string) => void;
  handleBookSubmit: (e: React.FormEvent, shouldPrint?: boolean) => void;
  isCreatingPlan: boolean;
}

export default function BookPackageModal({
  isOpen,
  onClose,
  patients,
  treatments,
  selectedPatientId,
  setSelectedPatientId,
  selectedTreatmentId,
  setSelectedTreatmentId,
  selectedTreatment,
  cosgynStartDate,
  setCosgynStartDate,
  cosgynTime,
  setCosgynTime,
  cosgynFrequency,
  setCosgynFrequency,
  cosgynDuration,
  setCosgynDuration,
  teslaStartDate,
  setTeslaStartDate,
  teslaTime,
  setTeslaTime,
  teslaFrequency,
  setTeslaFrequency,
  teslaDuration,
  setTeslaDuration,
  editableSessions,
  generateSessions,
  handleEditSessionRow,
  isSlotBooked,
  bookingPackagePrice,
  setBookingPackagePrice,
  bookingBillingChoice,
  setBookingBillingChoice,
  bookingDiscount,
  setBookingDiscount,
  bookingPaidAmount,
  setBookingPaidAmount,
  bookingPaymentMethod,
  setBookingPaymentMethod,
  bookingUpiRef,
  setBookingUpiRef,
  bookingNotes,
  setBookingNotes,
  handleBookSubmit,
  isCreatingPlan,
}: BookPackageModalProps) {
  const [modalPatientSearch, setModalPatientSearch] = useState('');
  const [isModalPatientDropdownOpen, setIsModalPatientDropdownOpen] = useState(false);
  const modalPatientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalPatientDropdownRef.current && !modalPatientDropdownRef.current.contains(event.target as Node)) {
        setIsModalPatientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Book Cosmetic Gynecology Package</h3>
              <p className="text-xs text-pink-100">
                Independent modality start dates, frequencies, time allotment, and granular slot editing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Scrollable Body */}
        <form onSubmit={(e) => handleBookSubmit(e, false)} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* 1. Patient Selector */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">Select Patient *</label>
            {(() => {
              const selectedPat = patients.find((p: any) => p.id === selectedPatientId);

              if (selectedPat) {
                return (
                  <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-800 flex items-center justify-center font-bold text-xs">
                        {selectedPat.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-pink-950">{selectedPat.name}</p>
                        <p className="text-[11px] text-pink-700 font-mono">
                          MRN: {selectedPat.mrn || selectedPat.vid || 'N/A'} · {selectedPat.gender || 'F'} · {selectedPat.age ? `${selectedPat.age}y` : ''} · {selectedPat.phone || ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatientId('');
                        setModalPatientSearch('');
                        setIsModalPatientDropdownOpen(true);
                      }}
                      className="h-7 text-xs border-pink-300 text-pink-800 hover:bg-pink-100 cursor-pointer"
                    >
                      Change
                    </Button>
                  </div>
                );
              }

              const query = modalPatientSearch.toLowerCase().trim();
              const filtered = patients.filter((p: any) => {
                if (!query) return true;
                return (
                  p.name?.toLowerCase().includes(query) ||
                  p.mrn?.toLowerCase().includes(query) ||
                  p.vid?.toLowerCase().includes(query) ||
                  p.phone?.toLowerCase().includes(query)
                );
              }).slice(0, 15);

              return (
                <div className="relative" ref={modalPatientDropdownRef}>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Type patient name, MRN, VID, or phone..."
                      value={modalPatientSearch}
                      onChange={(e) => {
                        setModalPatientSearch(e.target.value);
                        setIsModalPatientDropdownOpen(true);
                      }}
                      onFocus={() => setIsModalPatientDropdownOpen(true)}
                      className="pl-9 pr-9 h-9 text-xs bg-slate-50 border-slate-300 focus:bg-white focus:ring-2 focus:ring-pink-500"
                    />
                    {modalPatientSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setModalPatientSearch('');
                          setIsModalPatientDropdownOpen(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown list */}
                  {isModalPatientDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {filtered.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500 font-medium">
                          No patients found matching "{modalPatientSearch}"
                        </div>
                      ) : (
                        filtered.map((p: any) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatientId(p.id);
                              setModalPatientSearch('');
                              setIsModalPatientDropdownOpen(false);
                            }}
                            className="w-full text-left p-2.5 hover:bg-pink-50/60 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] group-hover:bg-pink-100 group-hover:text-pink-800">
                                {p.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 group-hover:text-pink-950">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono">
                                  MRN: {p.mrn || p.vid || 'N/A'} · {p.gender || 'F'} · {p.age ? `${p.age}y` : ''} · {p.phone || 'No phone'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-pink-600 opacity-0 group-hover:opacity-100 uppercase tracking-wider">
                              Select →
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* 2. Treatment Package Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Treatment Protocol / Package *</label>
            <select
              value={selectedTreatmentId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTreatmentId(id);
                const t = treatments.find((item: any) => item.id === id);
                if (t) {
                  setBookingPackagePrice(t.price);
                } else if (id === 'custom_jet') {
                  setBookingPackagePrice(10000);
                } else if (id === 'custom_tesla') {
                  setBookingPackagePrice(4000);
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
              required
            >
              <option value="">-- Choose Protocol --</option>
              <optgroup label="Single Standalone Sessions">
                <option value="custom_jet">Single Session: Jet Plasma</option>
                <option value="custom_tesla">Single Session: Tesla Chair</option>
              </optgroup>
              <optgroup label="Pre-configured Packages">
                {treatments.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatCurrency(t.price)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Package Summary */}
          {selectedTreatment && (
            <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-bold text-pink-950 text-xs">{selectedTreatment.name}</span>
                <div className="flex gap-3 text-[11px] text-pink-800 mt-0.5">
                  <span>⚡ Jet Plasma: {selectedTreatment.jet_plasma_sessions} sessions</span>
                  <span>🪑 Tesla Chair: {selectedTreatment.tesla_chair_sessions} sessions</span>
                  {selectedTreatment.prp_sessions > 0 && <span>✨ PRP: {selectedTreatment.prp_sessions} sessions</span>}
                </div>
              </div>
              <span className="font-extrabold text-pink-700 text-sm font-mono">{formatCurrency(selectedTreatment.price)}</span>
            </div>
          )}

          {/* 3. INDEPENDENT MODALITY CONFIGURATION */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-pink-600" />
                <span>Independent Modality Scheduling &amp; Frequency</span>
              </h4>
              <span className="text-[10px] text-slate-400">Configure distinct start dates &amp; frequencies for each</span>
            </div>

            {/* Modality 1: Cosmetic Gynae / Jet Plasma */}
            {(selectedTreatment?.jet_plasma_sessions > 0 || selectedTreatmentId === 'custom_jet') && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Cosmetic Gynae / Jet Plasma Suite ({selectedTreatment?.jet_plasma_sessions || 1} Sessions)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Vaginal rejuvenation</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={cosgynStartDate}
                      onChange={(e) => setCosgynStartDate(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Time Slot</label>
                    <Input
                      type="time"
                      value={cosgynTime}
                      onChange={(e) => setCosgynTime(e.target.value)}
                      className="h-8 text-xs bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Frequency</label>
                    <select
                      value={cosgynFrequency}
                      onChange={(e) => setCosgynFrequency(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none cursor-pointer"
                    >
                      <option value="weekly">Weekly (Every 7d)</option>
                      <option value="twice_weekly">Twice a Week</option>
                      <option value="fortnightly">Fortnightly (Every 14d)</option>
                      <option value="monthly">Monthly (Every 28d)</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Duration (Mins)</label>
                    <Input
                      type="number"
                      value={cosgynDuration}
                      onChange={(e) => setCosgynDuration(Number(e.target.value))}
                      className="h-8 text-xs bg-white"
                      min={15}
                      max={120}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modality 2: Tesla Chair */}
            {(selectedTreatment?.tesla_chair_sessions > 0 || selectedTreatmentId === 'custom_tesla') && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-700" />
                    <span>Tesla Chair Pelvic Floor Suite ({selectedTreatment?.tesla_chair_sessions || 1} Sessions)</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-medium">Independent pelvic floor protocol</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Start Date</label>
                    <Input
                      type="date"
                      value={teslaStartDate}
                      onChange={(e) => setTeslaStartDate(e.target.value)}
                      className="h-8 text-xs bg-white border-purple-200 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Time Slot</label>
                    <Input
                      type="time"
                      value={teslaTime}
                      onChange={(e) => setTeslaTime(e.target.value)}
                      className="h-8 text-xs bg-white border-purple-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Frequency</label>
                    <select
                      value={teslaFrequency}
                      onChange={(e) => setTeslaFrequency(e.target.value)}
                      className="w-full h-8 px-2 text-xs bg-white border border-purple-200 rounded-md focus:outline-none cursor-pointer"
                    >
                      <option value="twice_weekly">Twice a Week (e.g. Mon/Thu)</option>
                      <option value="weekly">Weekly (Every 7d)</option>
                      <option value="fortnightly">Fortnightly (Every 14d)</option>
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Tesla Duration (Mins)</label>
                    <Input
                      type="number"
                      value={teslaDuration}
                      onChange={(e) => setTeslaDuration(Number(e.target.value))}
                      className="h-8 text-xs bg-white border-purple-200"
                      min={15}
                      max={90}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. GRANULAR SESSION EDITING TABLE */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-pink-600" />
                <label className="text-xs font-bold text-slate-800">
                  Auto-Populated Session Schedule ({editableSessions.length} Sessions)
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSessions}
                className="h-6 text-[10px] font-bold text-slate-600 hover:bg-slate-100 gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset / Recalculate</span>
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-2 w-8">#</th>
                    <th className="p-2">Equipment / Modality</th>
                    <th className="p-2">Date (Editable)</th>
                    <th className="p-2">Time Slot (Editable)</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2 text-right">Slot Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {editableSessions.map((session, idx) => {
                    const isTesla = session.equipment.includes('Tesla');
                    const isConflict = isSlotBooked(session.equipment, session.date, session.time);
                    const dayName = new Date(session.date).toLocaleDateString('en-US', { weekday: 'short' });

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/70">
                        <td className="p-2 font-mono text-slate-400 font-bold text-[11px]">{idx + 1}</td>
                        <td className="p-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold gap-1 ${
                              isTesla
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-primary/10 text-primary border-primary/20'
                            }`}
                          >
                            {isTesla ? '🪑' : '⚡'} {session.equipment}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="date"
                              value={session.date}
                              onChange={(e) => handleEditSessionRow(idx, 'date', e.target.value)}
                              className="h-7 text-xs w-32 bg-slate-50"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">{dayName}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={session.time}
                            onChange={(e) => handleEditSessionRow(idx, 'time', e.target.value)}
                            className="h-7 text-xs w-24 font-mono bg-slate-50"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={session.duration_mins}
                              onChange={(e) => handleEditSessionRow(idx, 'duration_mins', Number(e.target.value))}
                              className="h-7 text-xs w-16"
                              min={15}
                              max={120}
                            />
                            <span className="text-[10px] text-slate-400">m</span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          {isConflict ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Busy
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Available
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. RECORD PAYMENT & BILLING OPTIONS */}
          <div className="p-4 bg-gradient-to-r from-slate-50 via-pink-50/25 to-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-pink-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Record Payment &amp; Billing Option</h3>
                  <p className="text-[10px] text-slate-500">Configure package pricing, discounts, and payment collection before confirming</p>
                </div>
              </div>

              {/* Toggle Choice Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setBookingBillingChoice('bill_now')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    bookingBillingChoice === 'bill_now'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Record Payment Now
                </button>
                <button
                  type="button"
                  onClick={() => setBookingBillingChoice('bill_later')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    bookingBillingChoice === 'bill_later'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Bill / Settle Later
                </button>
              </div>
            </div>

            {/* When "Record Payment Now" is active */}
            {bookingBillingChoice === 'bill_now' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Package Fee */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Package Fee (₹) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={bookingPackagePrice || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBookingPackagePrice(val);
                        setBookingPaidAmount(Math.max(0, val - bookingDiscount));
                      }}
                      placeholder={selectedTreatment?.price?.toString() || '0'}
                      className="h-8 text-xs font-bold bg-white"
                      required
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Discount (₹)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={bookingDiscount || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBookingDiscount(val);
                        setBookingPaidAmount(Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - val));
                      }}
                      placeholder="0"
                      className="h-8 text-xs font-bold bg-white font-mono"
                    />
                  </div>

                  {/* Amount Collected / Paid Amount */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Amount Paid Now (₹) *
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={
                        bookingPaidAmount !== null
                          ? bookingPaidAmount
                          : Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount)
                      }
                      onChange={(e) => setBookingPaidAmount(Number(e.target.value))}
                      className="h-8 text-xs font-bold bg-white text-emerald-800 font-mono"
                      required
                    />
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Payment Mode *
                    </label>
                    <select
                      value={bookingPaymentMethod}
                      onChange={(e) => setBookingPaymentMethod(e.target.value)}
                      className="w-full h-8 text-xs font-semibold rounded-md border border-slate-300 bg-white px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI (GPay / PhonePe / QR)</option>
                      <option value="card">Card (POS Terminal)</option>
                      <option value="net_banking">Net Banking / NEFT</option>
                    </select>
                  </div>
                </div>

                {/* Additional Payment Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {bookingPaymentMethod === 'upi' ? (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        UPI Reference / Transaction ID (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. 423985723498 / GPay Ref"
                        value={bookingUpiRef}
                        onChange={(e) => setBookingUpiRef(e.target.value)}
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Payment / Receipt Notes (Optional)
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Paid in full at front desk"
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  )}

                  {/* Financial Balance Summary */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs font-medium">
                    <span className="text-slate-500">Payment Breakdown:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">
                        Net: <strong className="font-mono">₹{Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount).toLocaleString()}</strong>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-emerald-700 font-bold">
                        Paid: <span className="font-mono">₹{Number(bookingPaidAmount !== null ? bookingPaidAmount : Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount)).toLocaleString()}</span>
                      </span>
                      {Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount) - Number(bookingPaidAmount !== null ? bookingPaidAmount : Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount)) > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-amber-700 font-bold font-mono">
                            Due: ₹{(Math.max(0, (bookingPackagePrice || selectedTreatment?.price || 0) - bookingDiscount) - Number(bookingPaidAmount)).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* When "Bill Later" is selected */
              <div className="p-3 bg-white rounded-lg border border-dashed border-amber-300 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-900 block">Package Will Be Scheduled Without Immediate Billing</span>
                  <span className="text-[11px] text-amber-700">
                    Total package fee of ₹{(bookingPackagePrice || selectedTreatment?.price || 0).toLocaleString()} will be marked as "Pending Bill" and can be settled anytime from Booked Packages tab.
                  </span>
                </div>
                <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[10px]">
                  Pending Bill
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-xs"
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              {/* Save & Print Option */}
              <Button
                type="button"
                variant="outline"
                disabled={isCreatingPlan || !selectedPatientId || !selectedTreatmentId}
                onClick={(e) => handleBookSubmit(e, true)}
                className="border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold h-9 text-xs px-4 gap-1.5 shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save &amp; Print Schedule</span>
              </Button>

              {/* Confirm Option */}
              <Button
                type="submit"
                disabled={isCreatingPlan || !selectedPatientId || !selectedTreatmentId}
                className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-9 text-xs px-5 shadow-sm cursor-pointer"
              >
                {isCreatingPlan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Confirming &amp; Recording...
                  </>
                ) : bookingBillingChoice === 'bill_now' ? (
                  'Confirm Booking & Record Payment'
                ) : (
                  'Confirm & Schedule Package'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
