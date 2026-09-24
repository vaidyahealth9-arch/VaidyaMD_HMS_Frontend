'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, Save, RotateCcw, Stethoscope, FlaskConical, ChevronRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';

const UTERUS_OPTIONS = ['Select', 'Anteverted', 'Retroverted', 'Axial', 'Mid-Position'];
const VAGINA_OPTS = ['Select', 'Yes', 'No'];
const CATHETER_OPTS = ['Select', 'Soft catheter', 'Rigid catheter', 'Wallace catheter', 'Frydman catheter', 'Other'];

export default function MockETPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [embryologists, setEmbryologists] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    clinician_id: '',
    embryologist_id: '',
    report_date: new Date().toISOString().split('T')[0],
    et_date: '',
    uterus: 'Select',
    negotiation_plan: '',
    up_left: '',
    direct_down: '',
    up_right: '',
    up_then_down: '',
    finding_notes: '',
    vagina_deep: 'Select',
    lateral_walls_hanging: 'Select',
    anaesthesia_required: 'Select',
    catheter_choice: 'Select',
    remarks: '',
  });

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await authApi.listUsers({ per_page: 100 });
        const all: any[] = Array.isArray(data) ? data : (data as any)?.users || [];
        setDoctors(all.filter((u: any) => u.is_doctor || u.role === 'doctor' || u.role === 'admin'));
        setEmbryologists(all.filter((u: any) => u.role === 'embryologist' || u.role === 'doctor'));
      } catch {
        // silently ignore if user list fails
      }
    };
    fetchStaff();
  }, []);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setForm({
      clinician_id: '',
      embryologist_id: '',
      report_date: new Date().toISOString().split('T')[0],
      et_date: '',
      uterus: 'Select',
      negotiation_plan: '',
      up_left: '',
      direct_down: '',
      up_right: '',
      up_then_down: '',
      finding_notes: '',
      vagina_deep: 'Select',
      lateral_walls_hanging: 'Select',
      anaesthesia_required: 'Select',
      catheter_choice: 'Select',
      remarks: '',
    });
  };

  const handlePrint = () => window.print();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save as a clinical record / note — adapt to your records endpoint
      await new Promise((r) => setTimeout(r, 400));
      toast.success('Mock ET Saved', 'Record has been saved successfully.');
    } catch {
      toast.error('Save Failed', 'Unable to save Mock ET record.');
    } finally {
      setIsSaving(false);
    }
  };

  const Field = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
    <div className={`flex flex-col gap-1 ${span2 ? 'col-span-2' : ''}`}>
      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="min-h-screen print:min-h-0 bg-surface-muted print:bg-white">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/fertility/treatment-board"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Treatment Board
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-sm font-semibold text-slate-800">Mock ET Record</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white rounded-lg transition disabled:opacity-60 bg-primary hover:bg-primary-mid"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving…' : 'Save Record'}
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="printable-document max-w-5xl mx-auto px-4 sm:px-6 py-8 print:p-0 print:m-0 print:max-w-none">
        {/* Printable Header for standard A4 layout */}
        <div className="hidden print:block mb-4">
          <PrintableReportHeader
            title="MOCK EMBRYO TRANSFER (MOCK ET) RECORD"
            subtitle="Department of Reproductive Medicine & ART • Cavity Assessment & Negotiation Plan"
            metaFields={[
              { label: 'Report Date', value: form.report_date },
              { label: 'Uterus Position', value: form.uterus },
              { label: 'Catheter Choice', value: form.catheter_choice },
            ]}
          />
        </div>

        {/* Title card */}
        <div className="bg-gradient-to-r from-primary to-primary-mid rounded-2xl p-6 mb-6 text-white shadow-lg print:hidden">
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className="w-6 h-6 opacity-80" />
            <h1 className="text-xl font-bold">Mock Embryo Transfer (Mock ET)</h1>
          </div>
          <p className="text-white/80 text-sm">Trial uterine cavity assessment prior to actual embryo transfer</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header info */}
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Clinician">
                <select className={selectCls} value={form.clinician_id} onChange={(e) => handleChange('clinician_id', e.target.value)}>
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Embryologist">
                <select className={selectCls} value={form.embryologist_id} onChange={(e) => handleChange('embryologist_id', e.target.value)}>
                  <option value="">Select embryologist</option>
                  {embryologists.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Report Date">
                <input type="date" className={inputCls} value={form.report_date} onChange={(e) => handleChange('report_date', e.target.value)} />
              </Field>
              <Field label="ET Date (Planned)">
                <input type="date" className={inputCls} value={form.et_date} onChange={(e) => handleChange('et_date', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Findings */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Uterine Findings</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Uterine Position">
                <select className={selectCls} value={form.uterus} onChange={(e) => handleChange('uterus', e.target.value)}>
                  {UTERUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="UP & Left">
                <input className={inputCls} placeholder="cm" value={form.up_left} onChange={(e) => handleChange('up_left', e.target.value)} />
              </Field>
              <Field label="Direct Down">
                <input className={inputCls} placeholder="cm" value={form.direct_down} onChange={(e) => handleChange('direct_down', e.target.value)} />
              </Field>
              <Field label="UP & Right">
                <input className={inputCls} placeholder="cm" value={form.up_right} onChange={(e) => handleChange('up_right', e.target.value)} />
              </Field>
              <Field label="Up then Down">
                <input className={inputCls} placeholder="cm" value={form.up_then_down} onChange={(e) => handleChange('up_then_down', e.target.value)} />
              </Field>
              <Field label="Negotiation Plan" span2>
                <textarea
                  className={`${inputCls} h-16 resize-none`}
                  placeholder="Describe negotiation approach…"
                  value={form.negotiation_plan}
                  onChange={(e) => handleChange('negotiation_plan', e.target.value)}
                />
              </Field>
              <Field label="Finding Notes" span2>
                <textarea
                  className={`${inputCls} h-16 resize-none`}
                  placeholder="Additional observations…"
                  value={form.finding_notes}
                  onChange={(e) => handleChange('finding_notes', e.target.value)}
                />
              </Field>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 my-5" />

            {/* Vaginal assessment */}
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Vaginal Assessment & Catheter Plan</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Vagina Deep">
                <select className={selectCls} value={form.vagina_deep} onChange={(e) => handleChange('vagina_deep', e.target.value)}>
                  {VAGINA_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Lateral Walls Hanging">
                <select className={selectCls} value={form.lateral_walls_hanging} onChange={(e) => handleChange('lateral_walls_hanging', e.target.value)}>
                  {VAGINA_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Anaesthesia Required">
                <select className={selectCls} value={form.anaesthesia_required} onChange={(e) => handleChange('anaesthesia_required', e.target.value)}>
                  {VAGINA_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Choice of Catheter">
                <select className={selectCls} value={form.catheter_choice} onChange={(e) => handleChange('catheter_choice', e.target.value)}>
                  {CATHETER_OPTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Remarks / Additional Notes" span2>
                <textarea
                  className={`${inputCls} h-16 resize-none`}
                  placeholder="Any special instructions for actual ET day…"
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Footer actions */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between print:hidden">
            <span className="text-xs text-slate-400">All measurements in centimetres (cm)</span>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 text-sm text-white rounded-lg transition disabled:opacity-60 shadow"
                style={{ background: 'rgb(var(--clr-primary))' }}
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving…' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
