import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Barcode } from 'lucide-react';
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

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Registration Complete!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Patient record successfully created in VaidyaMD HMS
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full font-mono text-xs font-bold text-primary">
              VID: {data.primary?.vid}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <strong className="text-slate-900 uppercase">{data.primary?.name}</strong>
            </div>
            {data.partner?.name && (
              <div className="flex justify-between">
                <span className="text-slate-500">Partner / Spouse:</span>
                <strong className="text-slate-900 uppercase">{data.partner.name}</strong>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-700">{data.primary?.phone || '—'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBarcodeModal(true)}
              className="py-2.5 px-4 bg-slate-900 hover:bg-black text-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              <span>Print Barcode Stickers</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/patients/${data.primary.id}`)}
              className="py-2.5 px-4 bg-primary hover:bg-primary-mid text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Go to EMR Profile →
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
