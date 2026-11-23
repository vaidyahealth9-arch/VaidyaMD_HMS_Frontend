'use client';

import React from 'react';
import { IndianRupee, Users, ShieldCheck, Check, Stethoscope, FileText, Ban } from 'lucide-react';

interface RegistrationTariffSectionProps {
  registrationMode: 'couple' | 'individual';
  registrationFee: number;
  setRegistrationFee: (fee: number) => void;
  consultationFee: number;
  setConsultationFee: (fee: number) => void;
  includeConsultation: boolean;
  setIncludeConsultation: (val: boolean) => void;
  tariffPaymentStatus: 'paid' | 'pending' | 'waived';
  setTariffPaymentStatus: (status: 'paid' | 'pending' | 'waived') => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  primaryName?: string;
  partnerName?: string;
  queueForOpd: boolean;
  setQueueForOpd: (val: boolean) => void;
  treatingDoctorId?: string;
  onSelectDoctor?: (doctorId: string) => void;
  doctorsList: any[];
  opdDoctorId: string;
  setOpdDoctorId: (id: string) => void;
  opdVisitType: string;
  setOpdVisitType: (vt: string) => void;
}

export default function RegistrationTariffSection({
  registrationMode,
  registrationFee,
  setRegistrationFee,
  consultationFee,
  setConsultationFee,
  includeConsultation,
  setIncludeConsultation,
  tariffPaymentStatus,
  setTariffPaymentStatus,
  paymentMethod,
  setPaymentMethod,
  primaryName,
  partnerName,
  queueForOpd,
  setQueueForOpd,
  treatingDoctorId,
  onSelectDoctor,
  doctorsList,
  opdDoctorId,
  setOpdDoctorId,
  opdVisitType,
  setOpdVisitType,
}: RegistrationTariffSectionProps) {
  const isCouple = registrationMode === 'couple';
  const effectiveDoctorId = treatingDoctorId || opdDoctorId;
  const effectiveConsultFee = includeConsultation ? consultationFee : 0;
  const totalAmount = (registrationFee || 0) + (effectiveConsultFee || 0);

  const handleDoctorChange = (docId: string) => {
    setOpdDoctorId(docId);
    if (onSelectDoctor) onSelectDoctor(docId);
    const selectedDoc = doctorsList.find((d) => d.id === docId);
    if (selectedDoc && selectedDoc.consultation_fee !== undefined) {
      setConsultationFee(Number(selectedDoc.consultation_fee) || 500);
    }
  };

  const handleWaiveAll = () => {
    setRegistrationFee(0);
    setConsultationFee(0);
    setTariffPaymentStatus('waived');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isCouple ? 'Couple Registration & Consultation Tariff' : 'Patient Registration & Consultation Tariff'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Registration fee and doctor consultation are itemized separately for clear patient billing.
            </p>
          </div>
        </div>

        {isCouple && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Consolidated Couple Receipt
          </span>
        )}
      </div>

      {/* Two Separate Tariff Columns: Registration vs Consultation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Registration Fee */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
              Registration Fee
            </span>
            <button
              type="button"
              onClick={() => {
                if (registrationFee === 0) setRegistrationFee(500);
                else setRegistrationFee(0);
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline"
            >
              {registrationFee === 0 ? 'Reset to ₹500' : 'Waive (₹0)'}
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="50"
              value={registrationFee}
              onChange={(e) => setRegistrationFee(Math.max(0, Number(e.target.value)))}
              placeholder="500"
              className="w-full h-8.5 pl-7 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {isCouple
              ? 'One fee covers both partners. Spouse registration is ₹0 (waived).'
              : 'Universal patient EMR registration & UHID generation tariff.'}
          </p>
        </div>

        {/* 2. Doctor Consultation Fee */}
        <div className={`border rounded-xl p-3.5 space-y-3 transition-colors ${
          includeConsultation ? 'bg-emerald-50/30 border-emerald-200/80' : 'bg-slate-50/50 border-slate-200 opacity-80'
        }`}>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeConsultation}
                onChange={(e) => {
                  setIncludeConsultation(e.target.checked);
                  if (e.target.checked && !queueForOpd) setQueueForOpd(true);
                }}
                className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                Doctor Consultation Fee
              </span>
            </label>

            {includeConsultation && (
              <button
                type="button"
                onClick={() => {
                  if (consultationFee === 0) {
                    const doc = doctorsList.find((d) => d.id === effectiveDoctorId);
                    setConsultationFee(Number(doc?.consultation_fee) || 500);
                  } else {
                    setConsultationFee(0);
                  }
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline"
              >
                {consultationFee === 0 ? 'Restore Fee' : 'Waive (₹0)'}
              </button>
            )}
          </div>

          {includeConsultation ? (
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Math.max(0, Number(e.target.value)))}
                  placeholder="500"
                  className="w-full h-8.5 pl-7 pr-3 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Default loaded from doctor master. Editable for special clinic tariffs.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic pt-1">
              No consultation fee charged (Registration only visit).
            </p>
          )}
        </div>
      </div>

      {/* OPD Queue Direct Check-In Card */}
      <div className={`p-3.5 rounded-xl border transition-all ${
        queueForOpd ? 'bg-primary/5 border-primary/30 shadow-2xs' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={queueForOpd}
              onChange={(e) => {
                setQueueForOpd(e.target.checked);
                if (e.target.checked) setIncludeConsultation(true);
              }}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                Direct Check-In to Today's OPD Waiting Queue
              </span>
              <p className="text-[11px] text-slate-500">
                Instantly issues a waiting token on the doctor's queue upon completing registration.
              </p>
            </div>
          </label>
          {queueForOpd && (
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200 shrink-0">
              {isCouple ? '1 Couple Token' : '1 Token'}
            </span>
          )}
        </div>

        {queueForOpd && (
          <div className="mt-3 pt-3 border-t border-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Treating Consultant <span className="text-rose-500">*</span>
              </label>
              <select
                value={effectiveDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Select Consultant —</option>
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.specialization ? `(${doc.specialization})` : ''} - ₹{doc.consultation_fee ?? 500}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Visit Type</label>
              <select
                value={opdVisitType}
                onChange={(e) => setOpdVisitType(e.target.value)}
                className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="consultation">{isCouple ? 'Initial Couple Consultation' : 'Initial Consultation'}</option>
                <option value="tvs_scan">Follicular / TVS Ultrasound Scan</option>
                <option value="follow_up">Review / Report Check</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Itemized Total & Settlement Bar */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Reg Fee: <strong>₹{registrationFee}</strong></span>
            <span>+</span>
            <span>Consultation: <strong>₹{effectiveConsultFee}</strong></span>
            <span>=</span>
            <span className="text-sm font-bold text-slate-900">
              Total: <span className="text-emerald-700">₹{totalAmount}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWaiveAll}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                tariffPaymentStatus === 'waived' || totalAmount === 0
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Ban className="w-3 h-3" />
              <span>Waive All (₹0)</span>
            </button>
          </div>
        </div>

        {totalAmount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Settlement Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTariffPaymentStatus('paid')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    tariffPaymentStatus === 'paid'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Paid Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTariffPaymentStatus('pending')}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    tariffPaymentStatus === 'pending'
                      ? 'bg-amber-600 border-amber-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Pay at Counter</span>
                </button>
              </div>
            </div>

            {tariffPaymentStatus === 'paid' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-8.5 px-2.5 rounded-md border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / QR Code</option>
                  <option value="card">Credit / Debit Card</option>
                  <option value="net_banking">Bank Transfer / NEFT</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Couple Transparency Banner */}
      {isCouple && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Primary ({primaryName || 'Patient'}): <strong>₹{totalAmount}</strong></span>
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
            Spouse ({partnerName || 'Partner'}): ₹0 Waived
          </span>
        </div>
      )}
    </div>
  );
}
