'use client';

import React from 'react';
import { Button } from '@/shared/ui/button';
import { Sparkles, Printer, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import CustomCosgynServicesBuilder from './CustomCosgynServicesBuilder';
import CosgynSessionScheduleTable from './CosgynSessionScheduleTable';
import CosgynBillingSection from './CosgynBillingSection';
import CosgynPatientSelector from './CosgynPatientSelector';
import CosgynLegacyModalityCards from './CosgynLegacyModalityCards';
import type { EditableSessionItem, CustomCosgynServiceItem } from './types';

export type { EditableSessionItem, CustomCosgynServiceItem };

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
  isSlotBooked: (equip: string, date: string, time: string, currentSessionId?: string) => boolean;
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
  customServices?: CustomCosgynServiceItem[];
  setCustomServices?: React.Dispatch<React.SetStateAction<CustomCosgynServiceItem[]>>;
  customPackageName?: string;
  setCustomPackageName?: (name: string) => void;
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
  customServices,
  setCustomServices,
  customPackageName = 'Custom CosGyn Care Plan',
  setCustomPackageName,
}: BookPackageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Book Cosmetic Gynecology Package</h3>
              <p className="text-xs text-pink-100">
                Independent modality start dates, custom services &amp; quantities, and granular slot scheduling
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-white text-xl font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={(e) => handleBookSubmit(e, false)} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Patient Selector */}
          <CosgynPatientSelector
            patients={patients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
          />

          {/* Treatment Package Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Treatment Protocol / Package *</label>
            <select
              value={selectedTreatmentId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedTreatmentId(id);
                const t = treatments.find((item: any) => item.id === id);
                if (t) {
                  const isSingleTesla = t.name?.toLowerCase().includes('tesla') && !t.name?.toLowerCase().includes('jet') && (t.tesla_chair_sessions === 1 || t.name?.toLowerCase().includes('single'));
                  setBookingPackagePrice(isSingleTesla ? Math.max(Math.round(t.price), 8000) : Math.round(t.price));
                } else if (id === 'custom_package') {
                  const total = customServices && customServices.length > 0
                    ? customServices.reduce((acc, s) => acc + (Number(s.sessions) || 0) * (Number(s.unitPrice) || 0), 0)
                    : 24000;
                  setBookingPackagePrice(total);
                } else if (id === 'custom_jet') {
                  const match = treatments.find((item: any) => item.name?.toLowerCase().includes('jet plasma') && !item.name?.toLowerCase().includes('tesla') && (item.jet_plasma_sessions === 1 || item.name?.toLowerCase().includes('single')));
                  setBookingPackagePrice(Math.round(match ? Math.max(match.price, 10000) : 10000));
                } else if (id === 'custom_tesla') {
                  const match = treatments.find((item: any) => item.name?.toLowerCase().includes('tesla') && !item.name?.toLowerCase().includes('jet plasma') && (item.tesla_chair_sessions === 1 || item.name?.toLowerCase().includes('single')));
                  setBookingPackagePrice(Math.round(match ? Math.max(match.price, 8000) : 8000));
                } else if (id === 'custom_combo') {
                  const match = treatments.find((item: any) => item.name?.toLowerCase().includes('jet plasma') && item.name?.toLowerCase().includes('tesla'));
                  setBookingPackagePrice(Math.round(match ? Math.max(match.price, 13500) : 13500));
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
              required
            >
              <option value="">-- Choose Protocol --</option>
              <optgroup label="✨ Custom Package & Modalities Builder">
                <option value="custom_package">🛠️ Build Custom Package (Custom Services &amp; Quantities)</option>
              </optgroup>
              <optgroup label="Pre-configured Packages">
                {treatments.map((t: any) => {
                  const isSingleTesla = t.name?.toLowerCase().includes('tesla') && !t.name?.toLowerCase().includes('jet') && (t.tesla_chair_sessions === 1 || t.name?.toLowerCase().includes('single'));
                  const p = isSingleTesla ? Math.max(Number(t.price) || 0, 8000) : t.price;
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} — {formatCurrency(p)}
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* Package Summary Badge for Standard Package */}
          {selectedTreatment && selectedTreatmentId !== 'custom_package' && (
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

          {/* Custom Package Services & Quantities Builder */}
          {selectedTreatmentId === 'custom_package' && customServices && setCustomServices && (
            <CustomCosgynServicesBuilder
              customServices={customServices}
              setCustomServices={setCustomServices}
              customPackageName={customPackageName}
              setCustomPackageName={setCustomPackageName || (() => {})}
              todayStr={cosgynStartDate || new Date().toISOString().split('T')[0]}
            />
          )}

          {/* Legacy Modality Cards for Preset Packages */}
          {selectedTreatmentId !== 'custom_package' && (
            <CosgynLegacyModalityCards
              selectedTreatment={selectedTreatment}
              selectedTreatmentId={selectedTreatmentId}
              cosgynStartDate={cosgynStartDate}
              setCosgynStartDate={setCosgynStartDate}
              cosgynTime={cosgynTime}
              setCosgynTime={setCosgynTime}
              cosgynFrequency={cosgynFrequency}
              setCosgynFrequency={setCosgynFrequency}
              cosgynDuration={cosgynDuration}
              setCosgynDuration={setCosgynDuration}
              teslaStartDate={teslaStartDate}
              setTeslaStartDate={setTeslaStartDate}
              teslaTime={teslaTime}
              setTeslaTime={setTeslaTime}
              teslaFrequency={teslaFrequency}
              setTeslaFrequency={setTeslaFrequency}
              teslaDuration={teslaDuration}
              setTeslaDuration={setTeslaDuration}
            />
          )}

          {/* Granular Session Schedule Table */}
          <CosgynSessionScheduleTable
            editableSessions={editableSessions}
            onEditSessionRow={handleEditSessionRow}
            onResetSessions={generateSessions}
            isSlotBooked={isSlotBooked}
          />

          {/* Payment & Billing Section */}
          <CosgynBillingSection
            bookingPackagePrice={bookingPackagePrice}
            setBookingPackagePrice={setBookingPackagePrice}
            bookingBillingChoice={bookingBillingChoice}
            setBookingBillingChoice={setBookingBillingChoice}
            bookingDiscount={bookingDiscount}
            setBookingDiscount={setBookingDiscount}
            bookingPaidAmount={bookingPaidAmount}
            setBookingPaidAmount={setBookingPaidAmount}
            bookingPaymentMethod={bookingPaymentMethod}
            setBookingPaymentMethod={setBookingPaymentMethod}
            bookingUpiRef={bookingUpiRef}
            setBookingUpiRef={setBookingUpiRef}
            bookingNotes={bookingNotes}
            setBookingNotes={setBookingNotes}
            selectedTreatmentPrice={selectedTreatment?.price}
          />

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
            <Button type="button" variant="outline" onClick={onClose} className="h-9 text-xs">
              Cancel
            </Button>
            <div className="flex items-center gap-2">
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
              <Button
                type="submit"
                disabled={isCreatingPlan || !selectedPatientId || !selectedTreatmentId}
                className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold h-9 text-xs px-5 shadow-sm cursor-pointer"
              >
                {isCreatingPlan ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Confirming...
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
