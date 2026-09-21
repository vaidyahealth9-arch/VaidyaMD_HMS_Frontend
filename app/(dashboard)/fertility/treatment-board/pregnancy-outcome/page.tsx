'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Save, Plus, Trash2, Baby, ChevronRight, BellRing } from 'lucide-react';
import { toast } from '@/contexts/ToastContext';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

const DELIVERY_METHODS = ['Select', 'Vaginal Delivery', 'LSCS', 'Assisted Vaginal Delivery', 'Other'];
const SEX_OPTIONS = ['Select', 'Male', 'Female', 'Other'];
const OUTCOME_OPTIONS = ['Select', 'Live Birth', 'Stillbirth', 'Neonatal Death', 'IUFD', 'Other'];
const COMPLICATIONS = ['Select', 'None', 'Preeclampsia', 'Gestational Diabetes', 'Placenta Praevia', 'PPROM', 'Antepartum Haemorrhage', 'Other'];
const BIRTH_DEFECTS_OPTS = ['Select', 'None', 'Cardiac Defect', 'Neural Tube Defect', 'Chromosomal Abnormality', 'Limb Defect', 'Other'];

const emptyBaby = () => ({
  surname: '',
  baby_name: '',
  sex: 'Select',
  city: '',
  district: '',
  country: 'India',
  weight_gm: '',
  outcome: 'Select',
  delivery_method: 'Select',
  birth_complications: 'Select',
  pregnancy_complications: 'Select',
  birth_defects: 'Select',
  labour_complications: 'Select',
  obstetrician: '',
});

export default function PregnancyOutcomePage() {
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    date_of_outcome: new Date().toISOString().split('T')[0],
    no_of_babies: 1,
    gestation_weeks: '',
    gestation_days: '',
    hospital: '',
    remarks: '',
    birthday_reminder: true,
    attempt_number: '1',
    treatment_cycle: '',
  });

  const [babies, setBabies] = useState<ReturnType<typeof emptyBaby>[]>([emptyBaby()]);

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'no_of_babies') {
      const n = parseInt(value) || 1;
      setBabies((prev) => {
        if (n > prev.length) {
          return [...prev, ...Array.from({ length: n - prev.length }, emptyBaby)];
        }
        return prev.slice(0, n);
      });
    }
  };

  const handleBabyChange = (idx: number, field: string, value: string) => {
    setBabies((prev) => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });
  };

  const addBaby = () => {
    setBabies((prev) => [...prev, emptyBaby()]);
    setForm((prev) => ({ ...prev, no_of_babies: prev.no_of_babies + 1 }));
  };

  const removeBaby = (idx: number) => {
    if (babies.length <= 1) return;
    setBabies((prev) => prev.filter((_, i) => i !== idx));
    setForm((prev) => ({ ...prev, no_of_babies: prev.no_of_babies - 1 }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast.success('Outcome Saved', 'Cycle/Pregnancy outcome record has been saved.');
    } catch {
      toast.error('Save Failed', 'Unable to save outcome record.');
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
    <div className={`flex flex-col gap-1 ${span2 ? 'sm:col-span-2' : ''}`}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-pink-50/20 to-white print:bg-white">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/fertility/treatment-board"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Treatment Board
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-semibold text-slate-800">Cycle / Pregnancy Outcome</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white rounded-lg transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Save Outcome'}
            </button>
          </div>
        </div>
      </div>

      <div className="printable-document max-w-5xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:m-0 print:max-w-none">
        {/* Printable Header for standard A4 layout */}
        <div className="hidden print:block mb-4">
          <PrintableReportHeader
            title="TREATMENT CYCLE PREGNANCY & DELIVERY OUTCOME"
            subtitle="Department of Reproductive Medicine & Obstetrics • Clinical Outcome Record"
            metaFields={[
              { label: 'Outcome Date', value: form.date_of_outcome },
              { label: 'Gestation', value: `${form.gestation_weeks}w + ${form.gestation_days}d` },
              { label: 'Babies Count', value: `${form.no_of_babies}` },
            ]}
          />
        </div>

        {/* Title */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 mb-6 text-white shadow-lg print:hidden">
          <div className="flex items-center gap-3 mb-1">
            <Baby className="w-6 h-6 opacity-80" />
            <h1 className="text-xl font-bold">Cycle / Pregnancy Outcome</h1>
          </div>
          <p className="text-pink-100 text-sm">Record delivery outcome, baby details, and complications for the treatment cycle</p>
        </div>

        {/* Cycle outcome summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <div className="w-1.5 h-5 rounded-full bg-pink-500" />
            <h2 className="text-sm font-bold text-slate-800">Outcome Summary</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Attempt No.">
              <select className={selectCls} value={form.attempt_number} onChange={(e) => handleFormChange('attempt_number', e.target.value)}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Treatment Cycle Type">
              <input className={inputCls} placeholder="E.g. ICSI, FET…" value={form.treatment_cycle} onChange={(e) => handleFormChange('treatment_cycle', e.target.value)} />
            </Field>
            <Field label="Date of Outcome">
              <input type="date" className={inputCls} value={form.date_of_outcome} onChange={(e) => handleFormChange('date_of_outcome', e.target.value)} />
            </Field>
            <Field label="No. of Babies">
              <input
                type="number" min={0} max={10} className={inputCls}
                value={form.no_of_babies}
                onChange={(e) => handleFormChange('no_of_babies', parseInt(e.target.value) || 0)}
              />
            </Field>
            <Field label="Gestation — Weeks">
              <input type="number" min={0} className={inputCls} placeholder="wks" value={form.gestation_weeks} onChange={(e) => handleFormChange('gestation_weeks', e.target.value)} />
            </Field>
            <Field label="Gestation — Days">
              <input type="number" min={0} max={6} className={inputCls} placeholder="days (0–6)" value={form.gestation_days} onChange={(e) => handleFormChange('gestation_days', e.target.value)} />
            </Field>
            <Field label="Hospital / Delivery Centre">
              <input className={inputCls} placeholder="Hospital name" value={form.hospital} onChange={(e) => handleFormChange('hospital', e.target.value)} />
            </Field>
            <Field label="Remarks" span2>
              <textarea
                className={`${inputCls} h-16 resize-none`}
                placeholder="General remarks about the outcome…"
                value={form.remarks}
                onChange={(e) => handleFormChange('remarks', e.target.value)}
              />
            </Field>

            {/* Birthday reminder toggle */}
            <div className="sm:col-span-4 flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleFormChange('birthday_reminder', !form.birthday_reminder)}
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${form.birthday_reminder ? 'bg-pink-500' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.birthday_reminder ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <BellRing className={`w-4 h-4 ${form.birthday_reminder ? 'text-pink-500' : 'text-slate-400'}`} />
                Birthday Message Reminder
                <span className="text-xs text-slate-400 font-normal">(sends SMS on baby's birthday each year)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Baby details */}
        <div className="space-y-4">
          {babies.map((baby, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-pink-100">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-pink-500" />
                  <h3 className="text-sm font-bold text-slate-800">Baby {idx + 1}</h3>
                </div>
                {babies.length > 1 && (
                  <button
                    onClick={() => removeBaby(idx)}
                    className="text-rose-400 hover:text-rose-600 transition p-1 rounded-lg hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Surname">
                  <input className={inputCls} placeholder="Surname" value={baby.surname} onChange={(e) => handleBabyChange(idx, 'surname', e.target.value)} />
                </Field>
                <Field label="Baby Name">
                  <input className={inputCls} placeholder="Given name" value={baby.baby_name} onChange={(e) => handleBabyChange(idx, 'baby_name', e.target.value)} />
                </Field>
                <Field label="Sex">
                  <select className={selectCls} value={baby.sex} onChange={(e) => handleBabyChange(idx, 'sex', e.target.value)}>
                    {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Weight (gm)">
                  <input type="number" min={0} className={inputCls} placeholder="grams" value={baby.weight_gm} onChange={(e) => handleBabyChange(idx, 'weight_gm', e.target.value)} />
                </Field>
                <Field label="City">
                  <input className={inputCls} placeholder="City" value={baby.city} onChange={(e) => handleBabyChange(idx, 'city', e.target.value)} />
                </Field>
                <Field label="District">
                  <input className={inputCls} placeholder="District" value={baby.district} onChange={(e) => handleBabyChange(idx, 'district', e.target.value)} />
                </Field>
                <Field label="Country">
                  <input className={inputCls} placeholder="Country" value={baby.country} onChange={(e) => handleBabyChange(idx, 'country', e.target.value)} />
                </Field>
                <Field label="Outcome">
                  <select className={selectCls} value={baby.outcome} onChange={(e) => handleBabyChange(idx, 'outcome', e.target.value)}>
                    {OUTCOME_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Method of Delivery">
                  <select className={selectCls} value={baby.delivery_method} onChange={(e) => handleBabyChange(idx, 'delivery_method', e.target.value)}>
                    {DELIVERY_METHODS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Birth Complications">
                  <select className={selectCls} value={baby.birth_complications} onChange={(e) => handleBabyChange(idx, 'birth_complications', e.target.value)}>
                    {COMPLICATIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Pregnancy Complications">
                  <select className={selectCls} value={baby.pregnancy_complications} onChange={(e) => handleBabyChange(idx, 'pregnancy_complications', e.target.value)}>
                    {COMPLICATIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Labour Complications">
                  <select className={selectCls} value={baby.labour_complications} onChange={(e) => handleBabyChange(idx, 'labour_complications', e.target.value)}>
                    {COMPLICATIONS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Birth Defects">
                  <select className={selectCls} value={baby.birth_defects} onChange={(e) => handleBabyChange(idx, 'birth_defects', e.target.value)}>
                    {BIRTH_DEFECTS_OPTS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Obstetrician">
                  <input className={inputCls} placeholder="Obstetrician name" value={baby.obstetrician} onChange={(e) => handleBabyChange(idx, 'obstetrician', e.target.value)} />
                </Field>
              </div>
            </div>
          ))}

          {/* Add baby */}
          <button
            onClick={addBaby}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-pink-200 rounded-2xl text-sm text-pink-500 hover:bg-pink-50 hover:border-pink-300 transition"
          >
            <Plus className="w-4 h-4" />
            Add Another Baby
          </button>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between print:hidden bg-white rounded-2xl border border-slate-100 px-6 py-4 shadow-sm">
          <span className="text-xs text-slate-400">Weight in grams · Gestation weeks + days format</span>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm text-white rounded-lg transition disabled:opacity-60 shadow"
              style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving…' : 'Save Outcome'}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .rounded-2xl { border-radius: 0; }
          .shadow-lg, .shadow-sm, .shadow { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
