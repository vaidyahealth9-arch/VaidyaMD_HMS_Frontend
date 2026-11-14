'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Barcode, Users, Receipt, ArrowRight, Stethoscope } from 'lucide-react';
import PatientBarcodeModal from '@/components/common/PatientBarcodeModal';
import { RegistrationSuccessData } from './types';

interface RegistrationSuccessModalProps {
  data: RegistrationSuccessData | null;
  onClose?: () => void;
}

export default function RegistrationSuccessModal({ data }: RegistrationSuccessModalProps) {
  const router = useRouter();
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  if (!data) return null;

  const isCouple = Boolean(data.partner?.name);

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
          <div className="w-13 h-13 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isCouple ? 'Couple Registration Complete!' : 'Registration Complete!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isCouple
                ? 'Coupled EMR and unified billing record successfully created'
                : 'Patient record successfully created in VaidyaMD HMS'}
            </p>
            <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full font-mono text-xs font-bold text-primary">
                <span>{data.primary?.gender === 'female' ? '♀ Wife:' : 'Primary:'}</span>
                <span>{data.primary?.vid}</span>
              </div>
              {data.partner?.vid && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 rounded-full font-mono text-xs font-bold text-sky-800">
                  <span>{data.partner?.gender === 'male' ? '♂ Husband:' : 'Partner:'}</span>
                  <span>{data.partner?.vid}</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Primary Patient:</span>
              <strong className="text-slate-900 uppercase font-bold">{data.primary?.name}</strong>
            </div>
            {data.partner?.name && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Partner / Spouse:</span>
                <strong className="text-slate-900 uppercase font-bold">{data.partner.name}</strong>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="font-mono text-slate-700">{data.primary?.phone || '—'}</span>
            </div>

            {/* Tariff / Invoice Status */}
            {data.invoice && (
              <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Tariff Receipt:
                </span>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    ₹{data.fee ?? data.invoice.total_amount ?? 500}
                  </span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    data.invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {data.invoice.status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            )}

            {data.queuedToOpd && (
              <div className="text-[11px] text-primary bg-primary/10 p-2 rounded border border-primary/20 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Today's OPD Queue:
                </span>
                <span className="font-bold">Token Queued (Waiting)</span>
              </div>
            )}

            {isCouple && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50/70 p-2 rounded border border-emerald-200/60 flex items-center justify-between">
                <span>Spouse Registration Fee:</span>
                <span className="font-bold">₹0 (Courtesy Waiver Applied)</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {data.queuedToOpd ? (
              <button
                type="button"
                onClick={() => router.push('/appointments?status=waiting')}
                className="py-2.5 px-4 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Go to OPD Waiting Queue →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push(`/patients/${data.primary.id}`)}
                className="py-2.5 px-4 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{isCouple ? 'Open Couple EMR' : 'Go to EMR Profile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="py-2.5 px-4 bg-slate-900 hover:bg-black text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              <span>Print Barcode Stickers</span>
            </button>
          </div>
        </div>
      </div>

      {showBarcodeModal && (
        <PatientBarcodeModal
          isOpen={showBarcodeModal}
          onClose={() => setShowBarcodeModal(false)}
          patient={data.primary}
          partner={data.partner}
          initialPreset="50x38"
          initialSampleType="Case File"
        />
      )}
    </>
  );
}
