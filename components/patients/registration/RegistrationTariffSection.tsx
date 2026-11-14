'use client';

import React from 'react';
import { IndianRupee, Users, ShieldCheck, Check, Stethoscope } from 'lucide-react';

interface RegistrationTariffSectionProps {
  registrationMode: 'couple' | 'individual';
  tariffFee: number;
  setTariffFee: (fee: number) => void;
  tariffPaymentStatus: 'paid' | 'pending' | 'waived';
  setTariffPaymentStatus: (status: 'paid' | 'pending' | 'waived') => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  primaryName?: string;
  partnerName?: string;
  queueForOpd: boolean;
  setQueueForOpd: (val: boolean) => void;
  treatingDoctorId?: string;
  doctorsList: any[];
  opdDoctorId: string;
  setOpdDoctorId: (id: string) => void;
  opdVisitType: string;
  setOpdVisitType: (vt: string) => void;
}

export default function RegistrationTariffSection({
  registrationMode,
  tariffFee,
  setTariffFee,
  tariffPaymentStatus,
  setTariffPaymentStatus,
  paymentMethod,
  setPaymentMethod,
  primaryName,
  partnerName,
  queueForOpd,
  setQueueForOpd,
  treatingDoctorId,
  doctorsList,
  opdDoctorId,
  setOpdDoctorId,
  opdVisitType,
  setOpdVisitType,
}: RegistrationTariffSectionProps) {
  const isCouple = registrationMode === 'couple';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              {isCouple ? 'Couple Registration Tariff & Initial Billing' : 'Patient Registration Tariff'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {isCouple
                ? 'One consolidated invoice covers both partners. Spouse registration fee is automatically waived (₹0).'
                : 'Tariff and first consultation receipt recorded for this patient.'}
            </p>
          </div>
        </div>

        {isCouple && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Single Couple Tariff
          </span>
        )}
      </div>

      {/* Preset Chips */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 block">Select Registration Tariff Option</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              setTariffFee(500);
              setQueueForOpd(false);
              if (tariffPaymentStatus === 'waived') setTariffPaymentStatus('paid');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center ${
              tariffFee === 500 && !queueForOpd && tariffPaymentStatus !== 'waived'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>₹500</span>
            <span className="text-[10px] font-normal text-slate-500">Reg Only</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTariffFee(800);
              setQueueForOpd(true);
              if (tariffPaymentStatus === 'waived') setTariffPaymentStatus('paid');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center ${
              tariffFee === 800 && queueForOpd && tariffPaymentStatus !== 'waived'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>₹800</span>
            <span className="text-[10px] font-bold text-emerald-700">Reg + First OPD ➔</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTariffFee(0);
              setQueueForOpd(false);
              setTariffPaymentStatus('waived');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex flex-col items-center justify-center ${
              tariffFee === 0 || tariffPaymentStatus === 'waived'
                ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>₹0 (Waived)</span>
            <span className="text-[10px] font-normal opacity-80">Complimentary</span>
          </button>

          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
            <input
              type="number"
              min="0"
              step="50"
              value={tariffFee}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTariffFee(val);
                if (val === 0) setTariffPaymentStatus('waived');
                else if (tariffPaymentStatus === 'waived') setTariffPaymentStatus('paid');
              }}
              placeholder="Custom"
              className="w-full h-full pl-6 pr-2 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
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
              onChange={(e) => setQueueForOpd(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
            />
            <div>
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-primary" />
                Direct Check-In to Today's OPD Waiting Queue
              </span>
              <p className="text-[11px] text-slate-500">
                Immediately issues a token on doctor's queue (Consultation fee covered in tariff, ₹0 additional charge).
              </p>
            </div>
          </label>
          {queueForOpd && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200 flex-shrink-0">
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
                value={treatingDoctorId || opdDoctorId}
                onChange={(e) => setOpdDoctorId(e.target.value)}
                className="w-full h-8.5 px-2.5 rounded-md border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Select Consultant —</option>
                {doctorsList.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.specialization ? `(${doc.specialization})` : ''}
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

      {/* Payment Settlement if Fee > 0 */}
      {tariffFee > 0 && (
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100">
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

      {/* Couple Transparency Banner */}
      {isCouple && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Primary ({primaryName || 'Patient'}): <strong>₹{tariffFee}</strong></span>
          </span>
          <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
            Spouse ({partnerName || 'Partner'}): ₹0 Waived
          </span>
        </div>
      )}
    </div>
  );
}
