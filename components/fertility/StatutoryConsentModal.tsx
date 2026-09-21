'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Save,
  X,
  Check,
  Languages,
  PenTool,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { patientsApi } from '@/lib/api';

export interface StatutoryConsentModalProps {
  patient: any;
  partner?: any;
  cycle?: any;
  onClose: () => void;
  onConsentSaved?: () => void;
}

type ConsentFormType = 'FORM_8' | 'FORM_11' | 'FORM_13' | 'FORM_15';
type LangMode = 'bilingual' | 'en' | 'hi';

export default function StatutoryConsentModal({
  patient,
  partner,
  cycle,
  onClose,
  onConsentSaved,
}: StatutoryConsentModalProps) {
  const [selectedForm, setSelectedForm] = useState<ConsentFormType>('FORM_11');
  const [lang, setLang] = useState<LangMode>('bilingual');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Canvas refs for signatures
  const canvasWifeRef = useRef<HTMLCanvasElement | null>(null);
  const canvasHusbandRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingWife, setIsDrawingWife] = useState(false);
  const [isDrawingHusband, setIsDrawingHusband] = useState(false);

  // Canvas drawing handlers
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'wife' | 'husband'
  ) => {
    const canvas = type === 'wife' ? canvasWifeRef.current : canvasHusbandRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);

    if (type === 'wife') setIsDrawingWife(true);
    else setIsDrawingHusband(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    type: 'wife' | 'husband'
  ) => {
    const isDrawing = type === 'wife' ? isDrawingWife : isDrawingHusband;
    if (!isDrawing) return;
    const canvas = type === 'wife' ? canvasWifeRef.current : canvasHusbandRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = (type: 'wife' | 'husband') => {
    if (type === 'wife') setIsDrawingWife(false);
    else setIsDrawingHusband(false);
  };

  const clearCanvas = (type: 'wife' | 'husband') => {
    const canvas = type === 'wife' ? canvasWifeRef.current : canvasHusbandRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveConsent = async () => {
    if (!patient?.id) return;
    setIsSaving(true);
    try {
      const wifeSignature = canvasWifeRef.current?.toDataURL() || '';
      const formTitles: Record<ConsentFormType, string> = {
        FORM_8: 'ART Form 8 - Consent for Oocyte/Gamete Freezing',
        FORM_11: 'ART Form 11 - Consent for IVF/ICSI & Embryo Transfer',
        FORM_13: 'ART Form 13 - Consent for Embryo Disposition',
        FORM_15: 'ART Form 15 - Consent for Cryopreservation Renewal',
      };

      await patientsApi.saveConsent(patient.id, {
        title: formTitles[selectedForm],
        signature: wifeSignature,
      });

      setSaveSuccess(true);
      onConsentSaved?.();
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save consent', err);
      alert(err.message || 'Failed to save consent document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-rail-bg/50 z-[100] flex flex-col items-center justify-start pt-24 sm:pt-28 pb-8 px-3 sm:px-6 overflow-y-auto print:p-0 print:static print:bg-white"
    >
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[calc(100vh-8.5rem)] flex flex-col shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none border border-slate-200 my-auto sm:my-0">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 bg-primary text-white px-6 py-4 flex items-center justify-between flex-shrink-0 print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                ART Act 2021 Statutory Consent Generator
              </h2>
              <p className="text-xs text-slate-400">
                National Assisted Reproductive Technology &amp; Surrogacy Act Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Mode Toggle */}
            <div className="flex p-0.5 bg-slate-800 rounded-md text-xs font-semibold">
              {[
                { id: 'bilingual', label: 'Bilingual (Eng + हिं)' },
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिंदी' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id as LangMode)}
                  className={`px-2.5 py-1 rounded transition-all ${
                    lang === l.id ? 'bg-[rgb(var(--clr-primary))] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-colors ml-2 border border-slate-700 shadow-xs"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Forms Tab Selector */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-6 py-2 flex gap-2 overflow-x-auto print:hidden">
          {[
            { id: 'FORM_11', name: 'Form 11: IVF / ICSI & ET', badge: 'Primary ART' },
            { id: 'FORM_8', name: 'Form 8: Gamete Freezing', badge: 'Cryo' },
            { id: 'FORM_13', name: 'Form 13: Embryo Disposition', badge: 'Disposal' },
            { id: 'FORM_15', name: 'Form 15: Cryo Renewal', badge: 'Annual' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedForm(f.id as ConsentFormType)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedForm === f.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <span>{f.name}</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-200/60 text-slate-600">
                {f.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Form Body Scrollable Area */}
        <div className="printable-document flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 custom-scrollbar print:overflow-visible print:p-0">
          {/* Statutory Title Banner */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Government of India • Ministry of Health &amp; Family Welfare
            </h3>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase">
              {selectedForm === 'FORM_11' && 'FORM 11 — CONSENT FOR IVF / ICSI & EMBRYO TRANSFER'}
              {selectedForm === 'FORM_8' && 'FORM 8 — CONSENT FOR FREEZING OF GAMETES / OOCYTES'}
              {selectedForm === 'FORM_13' && 'FORM 13 — CONSENT FOR DISPOSITION OF CRYOPRESERVED EMBRYOS'}
              {selectedForm === 'FORM_15' && 'FORM 15 — CONSENT FOR RENEWAL OF CRYOPRESERVATION'}
            </h1>
            {(lang === 'bilingual' || lang === 'hi') && (
              <h2 className="text-sm font-bold text-slate-700">
                {selectedForm === 'FORM_11' && 'प्रपत्र 11 — आई.वी.एफ. / इक्सी एवं भ्रूण प्रत्यारोपण हेतु विधिक सहमति पत्र'}
                {selectedForm === 'FORM_8' && 'प्रपत्र 8 — अंडाणु / शुक्राणु हिमीकरण एवं संरक्षण हेतु सहमति'}
                {selectedForm === 'FORM_13' && 'प्रपत्र 13 — हिमीकृत भ्रूणों के उपयोग अथवा निस्तारण हेतु विधिक सहमति'}
                {selectedForm === 'FORM_15' && 'प्रपत्र 15 — हिमीकरण की अवधि नवीनीकरण हेतु सहमति'}
              </h2>
            )}
            <p className="text-[11px] text-slate-500">
              [Under Rule 13 of the Assisted Reproductive Technology (Regulation) Rules, 2022]
            </p>
          </div>

          {/* Couple & Clinical Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Wife / Female Patient</span>
              <span className="font-bold text-slate-900">{patient?.name || '—'}</span>
              <span className="block font-mono text-[10px] text-slate-500">VID: {patient?.vid || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Husband / Partner</span>
              <span className="font-bold text-slate-900">{partner?.name || 'Not Linked'}</span>
              <span className="block font-mono text-[10px] text-slate-500">VID: {partner?.vid || '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Treatment Cycle Code</span>
              <span className="font-mono font-bold text-slate-900">{cycle?.cycle_id || 'TC-CURRENT'}</span>
              <span className="block text-[10px] text-slate-500">{cycle?.treatment_type || 'ICSI'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Date of Execution</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span>
              <span className="block text-[10px] text-emerald-700 font-bold">VaidyaMD Clinic EMR</span>
            </div>
          </div>

          {/* Legal Declarations & Terms */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-700">
            {/* Clause 1 */}
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1">
              {(lang === 'bilingual' || lang === 'en') && (
                <p>
                  <strong>1. Informed Understanding:</strong> We, the undersigned commissioning couple, hereby confirm that the nature, steps, potential risks (including Ovarian Hyperstimulation Syndrome — OHSS, multiple pregnancy, bleeding, or ectopic pregnancy), and realistic clinical success rates of the intended ART treatment have been explained to us in full detail in a language we comprehend.
                </p>
              )}
              {(lang === 'bilingual' || lang === 'hi') && (
                <p className="text-slate-600 font-medium">
                  <strong>1. सूचित समझ:</strong> हम अधोहस्ताक्षरी दंपत्ति पुष्टि करते हैं कि प्रस्तावित उपचार के सभी चरणों, संभावित खतरों (जैसे ओ.एच.एस.एस., एकाधिक गर्भावस्था) तथा सफलता की संभावनाओं के बारे में हमें हमारी समझ में आने वाली भाषा में विस्तार से समझा दिया गया है।
                </p>
              )}
            </div>

            {/* Clause 2 */}
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1">
              {(lang === 'bilingual' || lang === 'en') && (
                <p>
                  <strong>2. Gamete &amp; Embryo Handling:</strong> We authorize the treating clinical team and embryology laboratory to collect, inseminate, fertilize, culture, and perform embryo transfer in accordance with statutory standard operating protocols under Section 21 of the ART Act 2021.
                </p>
              )}
              {(lang === 'bilingual' || lang === 'hi') && (
                <p className="text-slate-600 font-medium">
                  <strong>2. युग्मक एवं भ्रूण संवर्धन:</strong> हम क्लिनिक के भ्रूणविज्ञानी एवं डॉक्टरों को हमारे अंडाणु एवं शुक्राणुओं के संलयन, निषेचन तथा भ्रूण निर्माण व प्रत्यारोपण हेतु विधिक रूप से अधिकृत करते हैं।
                </p>
              )}
            </div>

            {/* Clause 3 (Cryopreservation Terms) */}
            <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/80 space-y-1">
              {(lang === 'bilingual' || lang === 'en') && (
                <p>
                  <strong>3. Cryostorage Duration:</strong> Surplus high-quality embryos shall be cryopreserved for a statutory term of up to 10 (ten) years as prescribed under the ART Rules, renewable annually upon payment of clinic cryobank maintenance dues.
                </p>
              )}
              {(lang === 'bilingual' || lang === 'hi') && (
                <p className="text-slate-600 font-medium">
                  <strong>3. हिमीकरण संरक्षण अवधि:</strong> अतिरिक्त उच्च गुणवत्ता वाले भ्रूणों को ए.आर.टी. कानून के तहत 10 वर्ष तक सुरक्षित रखा जा सकेगा, जिसका प्रतिवर्ष नवीनीकरण कराया जाना अनिवार्य होगा।
                </p>
              )}
            </div>
          </div>

          {/* Interactive Digital Signature Pads */}
          <div className="pt-4 border-t-2 border-slate-200">
            <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider mb-3 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-primary" />
              <span>Digital Signatures &amp; Execution</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Wife Signature Pad */}
              <div className="p-4 bg-pink-50/30 border border-pink-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-900">
                    Signature of Wife / Female Patient (♀)
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCanvas('wife')}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 print:hidden"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="bg-white border-2 border-dashed border-pink-300 rounded-xl overflow-hidden touch-none">
                  <canvas
                    ref={canvasWifeRef}
                    width={400}
                    height={110}
                    onMouseDown={(e) => startDrawing(e, 'wife')}
                    onMouseMove={(e) => draw(e, 'wife')}
                    onMouseUp={() => stopDrawing('wife')}
                    onMouseLeave={() => stopDrawing('wife')}
                    onTouchStart={(e) => startDrawing(e, 'wife')}
                    onTouchMove={(e) => draw(e, 'wife')}
                    onTouchEnd={() => stopDrawing('wife')}
                    className="w-full h-[110px] cursor-crosshair block"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-center">
                  {patient?.name} · VID: {patient?.vid}
                </span>
              </div>

              {/* Husband Signature Pad */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-main">
                    Signature of Husband / Partner (♂)
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCanvas('husband')}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 print:hidden"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="bg-white border-2 border-dashed border-primary/40 rounded-xl overflow-hidden touch-none">
                  <canvas
                    ref={canvasHusbandRef}
                    width={400}
                    height={110}
                    onMouseDown={(e) => startDrawing(e, 'husband')}
                    onMouseMove={(e) => draw(e, 'husband')}
                    onMouseUp={() => stopDrawing('husband')}
                    onMouseLeave={() => stopDrawing('husband')}
                    onTouchStart={(e) => startDrawing(e, 'husband')}
                    onTouchMove={(e) => draw(e, 'husband')}
                    onTouchEnd={() => stopDrawing('husband')}
                    className="w-full h-[110px] cursor-crosshair block"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block text-center">
                  {partner?.name || 'Partner Signature'} · VID: {partner?.vid || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Consent stored to patient EMR!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConsent}
              disabled={isSaving}
              className="px-5 py-2 bg-[rgb(var(--clr-primary))] hover:opacity-90 disabled:opacity-60 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Signing & Saving...' : 'Save Signed Consent'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
