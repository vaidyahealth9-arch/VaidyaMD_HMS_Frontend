'use client';

import { useState, useMemo, useEffect } from 'react';
import { canAccessField } from '@/lib/utils';
import { Lock, Save } from 'lucide-react';

// --- Types ---
export interface FieldSchema {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox_group' | 'date' | 'number' | 'file';
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  required?: boolean;
  readOnly?: boolean;
  min?: number;
  max?: number;
  step?: string;
  pattern?: string;
  role_access?: string[];
  role_badge?: string;
  unit?: string;
  formula?: string;
  helper_text?: string;
}

export interface SectionSchema {
  id: string;
  title: string;
  role_access?: string[];
  role_badge?: string;
  fields: FieldSchema[];
}

export interface FormSchema {
  title: string;
  description?: string;
  sections: SectionSchema[];
}

interface DynamicFormProps {
  schema: any;
  initialData?: Record<string, unknown>;
  userRole: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
  submitButtonLabel?: string;
}

// --- Normalization Helpers ---
function normalizeFields(rawFields: any[]): FieldSchema[] {
  if (!Array.isArray(rawFields)) return [];
  return rawFields.map((f: any, idx: number) => {
    const rawId = f.id || (f.label ? f.label.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') : `field_${idx}`);
    const normalizedOptions = Array.isArray(f.options)
      ? f.options.map((opt: any) =>
          typeof opt === 'string' ? { value: opt, label: opt } : opt
        )
      : undefined;

    return {
      id: rawId || `field_${idx}`,
      label: f.label || `Field ${idx + 1}`,
      type: f.type || 'text',
      placeholder: f.placeholder,
      options: normalizedOptions,
      rows: f.rows,
      required: !!f.required,
      readOnly: !!f.readOnly,
      min: f.min,
      max: f.max,
      step: f.step,
      pattern: f.pattern,
      role_access: f.role_access,
      role_badge: f.role_badge,
      unit: f.unit,
      formula: f.formula,
      helper_text: f.helper_text,
    };
  });
}

function normalizeSchema(rawSchema: any): FormSchema {
  if (!rawSchema) {
    return {
      title: 'Clinical Record Form',
      sections: [{ id: 'sec_default', title: 'Clinical Record Details', fields: [] }],
    };
  }

  // 1. Array of field definitions directly
  if (Array.isArray(rawSchema)) {
    return {
      title: 'Clinical Assessment Fields',
      sections: [
        {
          id: 'sec_default',
          title: 'Clinical Assessment Fields',
          fields: normalizeFields(rawSchema),
        },
      ],
    };
  }

  // 2. Standard form schema with sections
  if (Array.isArray(rawSchema.sections)) {
    return {
      title: rawSchema.title || 'Clinical Record Form',
      description: rawSchema.description,
      sections: rawSchema.sections.map((sec: any, sIdx: number) => ({
        id: sec.id || `sec_${sIdx}`,
        title: sec.title || `Section ${sIdx + 1}`,
        role_access: sec.role_access,
        role_badge: sec.role_badge,
        fields: normalizeFields(sec.fields || []),
      })),
    };
  }

  // 3. Schema with fields array directly
  if (Array.isArray(rawSchema.fields)) {
    return {
      title: rawSchema.title || 'Clinical Record Form',
      description: rawSchema.description,
      sections: [
        {
          id: 'sec_default',
          title: rawSchema.title || 'Assessment Fields',
          fields: normalizeFields(rawSchema.fields),
        },
      ],
    };
  }

  // 4. Object of key-value parameters (e.g. order sets, clinical consultation proformas, Rx templates)
  if (typeof rawSchema === 'object') {
    const generatedFields: FieldSchema[] = [];
    for (const [key, value] of Object.entries(rawSchema)) {
      if (key === 'title' || key === 'description') continue;
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (Array.isArray(value)) {
        generatedFields.push({
          id: key,
          label,
          type: 'textarea',
          rows: Math.min(Math.max(value.length, 3), 8),
          placeholder: value.length > 0 && typeof value[0] === 'object' ? JSON.stringify(value, null, 2) : value.join('\n'),
        });
      } else if (typeof value === 'object' && value !== null) {
        generatedFields.push({
          id: key,
          label,
          type: 'textarea',
          rows: 4,
          placeholder: JSON.stringify(value, null, 2),
        });
      } else {
        const strVal = String(value ?? '');
        const isLong = strVal.includes('\n') || strVal.length > 60;
        generatedFields.push({
          id: key,
          label,
          type: isLong ? 'textarea' : 'text',
          rows: isLong ? 4 : undefined,
          placeholder: strVal,
        });
      }
    }

    return {
      title: rawSchema.title || 'Template Parameters',
      description: rawSchema.description,
      sections: [
        {
          id: 'sec_default',
          title: rawSchema.title || 'Template Parameters & Presets',
          fields: generatedFields,
        },
      ],
    };
  }

  return {
    title: 'Clinical Record Form',
    sections: [{ id: 'sec_default', title: 'Clinical Record Details', fields: [] }],
  };
}

// --- Clinical Formula Calculation Engine ---
export function evaluateClinicalFormulas(
  data: Record<string, unknown>
): Record<string, unknown> {
  const updated = { ...data };
  let hasChanges = false;

  // 1. EDD & GA by LMP
  const lmpVal = (data.lmp_date || data.lmp) as string;
  const scanDateVal = (data.scan_date || data.date_of_scan || new Date().toISOString().split('T')[0]) as string;

  if (lmpVal && typeof lmpVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(lmpVal)) {
    const lmpDate = new Date(lmpVal);
    if (!isNaN(lmpDate.getTime())) {
      // EDD by LMP: LMP + 280 days
      const eddDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
      const eddStr = eddDate.toISOString().split('T')[0];
      if (data.edd_lmp !== eddStr) {
        updated.edd_lmp = eddStr;
        hasChanges = true;
      }

      // GA by LMP: scanDate - lmpDate
      if (scanDateVal && /^\d{4}-\d{2}-\d{2}$/.test(scanDateVal)) {
        const scanDate = new Date(scanDateVal);
        if (!isNaN(scanDate.getTime())) {
          const diffMs = scanDate.getTime() - lmpDate.getTime();
          const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
          if (diffDays >= 0) {
            const weeks = Math.floor(diffDays / 7);
            const days = diffDays % 7;
            const gaFormatted = `${weeks}w ${days}d`;
            if (data.ga_lmp !== gaFormatted) {
              updated.ga_lmp = gaFormatted;
              hasChanges = true;
            }
            if (data.ga_lmp_days !== diffDays) {
              updated.ga_lmp_days = diffDays;
              hasChanges = true;
            }
          }
        }
      }
    }
  }

  // 2. Hadlock 4-parameter EFW:
  // Inputs: BPD, HC, AC, FL in mm -> converted to cm (divide by 10)
  // log10(EFW) = 1.3596 + 0.0064*(HC/10) + 0.00061*(BPD/10)*(AC/10) + 0.0424*(AC/10) + 0.174*(FL/10) - 0.00386*(AC/10)*(FL/10)
  // EFW (g) = round(10^(log10(EFW)))
  const bpd = parseFloat(String(data.bpd_mm || data.bpd || ''));
  const hc = parseFloat(String(data.hc_mm || data.hc || ''));
  const ac = parseFloat(String(data.ac_mm || data.ac || ''));
  const fl = parseFloat(String(data.fl_mm || data.fl || ''));

  if (!isNaN(bpd) && bpd > 0 && !isNaN(hc) && hc > 0 && !isNaN(ac) && ac > 0 && !isNaN(fl) && fl > 0) {
    const bpdCm = bpd / 10;
    const hcCm = hc / 10;
    const acCm = ac / 10;
    const flCm = fl / 10;

    const log10Efw =
      1.3596 +
      0.0064 * hcCm +
      0.00061 * bpdCm * acCm +
      0.0424 * acCm +
      0.174 * flCm -
      0.00386 * acCm * flCm;

    const efwVal = Math.round(Math.pow(10, log10Efw));
    if (efwVal > 0 && efwVal < 8000) {
      if (updated.efw_hadlock !== efwVal && updated.efw_hadlock !== String(efwVal)) {
        updated.efw_hadlock = efwVal;
        hasChanges = true;
      }
      if (!updated.efw_g || updated.efw_g !== efwVal) {
        updated.efw_g = efwVal;
        hasChanges = true;
      }
    }
  }

  // 3. Cerebroplacental Ratio (CPR) = MCA PI / UA PI
  const mcaPi = parseFloat(String(data.middle_cerebral_artery_mca_pi || data.mca_pi || ''));
  const uaPi = parseFloat(String(data.umbilical_artery_ua_pi || data.ua_pi || ''));

  if (!isNaN(mcaPi) && mcaPi > 0 && !isNaN(uaPi) && uaPi > 0) {
    const cpr = Math.round((mcaPi / uaPi) * 100) / 100;
    if (updated.cerebroplacental_ratio_cpr !== cpr && updated.cerebroplacental_ratio_cpr !== String(cpr)) {
      updated.cerebroplacental_ratio_cpr = cpr;
      hasChanges = true;
    }
    if (updated.cpr !== cpr && updated.cpr !== String(cpr)) {
      updated.cpr = cpr;
      hasChanges = true;
    }
  }

  // 4. Mean Uterine Artery PI = (Right PI + Left PI) / 2
  const rtPi = parseFloat(String(data.right_uterine_artery_pi || data.rt_uterine_pi || ''));
  const ltPi = parseFloat(String(data.left_uterine_artery_pi || data.lt_uterine_pi || ''));

  if (!isNaN(rtPi) && rtPi > 0 && !isNaN(ltPi) && ltPi > 0) {
    const meanPi = Math.round(((rtPi + ltPi) / 2) * 100) / 100;
    if (updated.mean_uterine_artery_pi !== meanPi && updated.mean_uterine_artery_pi !== String(meanPi)) {
      updated.mean_uterine_artery_pi = meanPi;
      hasChanges = true;
    }
  }

  // 5. Biophysical Profile (BPP) Total & Denominator
  const bBreathing = data.bpp_breathing !== undefined && data.bpp_breathing !== '' ? parseFloat(String(data.bpp_breathing)) : null;
  const bMovements = data.bpp_movements !== undefined && data.bpp_movements !== '' ? parseFloat(String(data.bpp_movements)) : null;
  const bTone = data.bpp_tone !== undefined && data.bpp_tone !== '' ? parseFloat(String(data.bpp_tone)) : null;
  const bFluid = data.bpp_fluid !== undefined && data.bpp_fluid !== '' ? parseFloat(String(data.bpp_fluid)) : null;
  const bNstRaw = data.bpp_nst;

  const usComponents = [bBreathing, bMovements, bTone, bFluid];
  const allUsScored = usComponents.every((v) => v !== null && !isNaN(v));

  if (allUsScored) {
    let total = usComponents.reduce((acc, v) => (acc || 0) + (v || 0), 0) || 0;
    let denom = 8;

    const nstVal = bNstRaw !== undefined && bNstRaw !== '' && bNstRaw !== 'not_performed' ? parseFloat(String(bNstRaw)) : null;
    if (nstVal !== null && !isNaN(nstVal)) {
      total += nstVal;
      denom = 10;
    }

    if (updated.bpp_total !== total && updated.bpp_total !== String(total)) {
      updated.bpp_total = total;
      hasChanges = true;
    }
    if (updated.bpp_denominator !== denom && updated.bpp_denominator !== String(denom)) {
      updated.bpp_denominator = denom;
      hasChanges = true;
    }
    const scoreFormatted = `${total}/${denom}`;
    if (updated.bpp_score !== scoreFormatted) {
      updated.bpp_score = scoreFormatted;
      hasChanges = true;
    }
  }

  return hasChanges ? updated : data;
}

// --- Field Components ---
function TextField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  const isAuto = Boolean(field.formula);
  return (
    <div className="relative flex items-center">
      <input
        id={field.id}
        type={field.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        min={field.min}
        max={field.max}
        step={field.step}
        readOnly={field.readOnly || disabled}
        className={`vmd-input w-full ${field.unit ? 'pr-12' : ''} ${isAuto ? 'bg-slate-50 font-bold text-slate-800' : ''}`}
      />
      {field.unit && (
        <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
          {field.unit}
        </span>
      )}
    </div>
  );
}

function TextareaField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <textarea
      id={field.id}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={field.rows || 3}
      readOnly={disabled}
      className="vmd-input resize-none"
    />
  );
}

function SelectField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  const options = (field.options || []).map((opt: any) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className="relative">
      <select
        id={field.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="vmd-input appearance-none pr-8 cursor-pointer"
      >
        <option value="">— Select —</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</span>
    </div>
  );
}

function CheckboxGroupField({ field, value, onChange, disabled }: { field: FieldSchema; value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const checked = Array.isArray(value) ? value : [];
  const options = (field.options || []).map((opt: any) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const toggle = (optValue: string) => {
    if (disabled) return;
    if (checked.includes(optValue)) {
      onChange(checked.filter((v) => v !== optValue));
    } else {
      onChange([...checked, optValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: any) => {
        const isChecked = checked.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer select-none
              border transition-all duration-150 shadow-sm
              ${isChecked
                ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 accent-primary rounded"
              disabled={disabled}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function DateField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input
      id={field.id}
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      readOnly={disabled}
      className="vmd-input"
    />
  );
}

// --- DynamicForm Main ---
export default function DynamicForm({ schema: rawSchema, initialData = {}, userRole, onSave, isSaving, submitButtonLabel }: DynamicFormProps) {
  const schema = useMemo(() => normalizeSchema(rawSchema), [rawSchema]);

  const computedInitial = useMemo(() => {
    const base: Record<string, unknown> = { ...initialData };
    if (rawSchema && !Array.isArray(rawSchema) && !rawSchema.sections && !rawSchema.fields && typeof rawSchema === 'object') {
      for (const [k, v] of Object.entries(rawSchema)) {
        if (k !== 'title' && k !== 'description' && base[k] === undefined) {
          base[k] = typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v ?? '');
        }
      }
    }
    return evaluateClinicalFormulas(base);
  }, [rawSchema, initialData]);

  const [formData, setFormData] = useState<Record<string, unknown>>(computedInitial);

  useEffect(() => {
    setFormData(computedInitial);
  }, [computedInitial]);

  const updateField = (fieldId: string, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldId]: value };
      return evaluateClinicalFormulas(next);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const renderField = (field: FieldSchema) => {
    const isAccessible = canAccessField(field.role_access, userRole);
    const isDisabled = !isAccessible;
    const value = formData[field.id];

    return (
      <div key={field.id} className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor={field.id} className={`block text-xs font-bold uppercase tracking-wider ${isDisabled ? 'text-slate-300' : 'text-slate-500'}`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="flex items-center gap-1.5">
            {field.formula && (
              <span className="bg-sky-100 text-sky-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                Auto-calc
              </span>
            )}
            {field.role_badge && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {field.role_badge}
              </span>
            )}
          </div>
        </div>

        {isDisabled ? (
          <div className="vmd-input opacity-60 bg-slate-100 cursor-not-allowed text-slate-500 text-xs flex items-center gap-1.5 py-2">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>{field.role_badge || 'Restricted access'}</span>
          </div>
        ) : field.type === 'textarea' ? (
          <TextareaField field={field} value={value as string} onChange={(v) => updateField(field.id, v)} disabled={isDisabled} />
        ) : field.type === 'select' ? (
          <SelectField field={field} value={value as string} onChange={(v) => updateField(field.id, v)} disabled={isDisabled} />
        ) : field.type === 'checkbox_group' ? (
          <CheckboxGroupField field={field} value={value as string[]} onChange={(v) => updateField(field.id, v)} disabled={isDisabled} />
        ) : field.type === 'date' ? (
          <DateField field={field} value={value as string} onChange={(v) => updateField(field.id, v)} disabled={isDisabled} />
        ) : (
          <TextField field={field} value={value as string} onChange={(v) => updateField(field.id, v)} disabled={isDisabled} />
        )}
        {field.helper_text && (
          <p className="text-[11px] text-slate-400 leading-tight">{field.helper_text}</p>
        )}
      </div>
    );
  };

  const sections = Array.isArray(schema.sections) ? schema.sections : [];

  if (sections.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm">
        No form fields configured for this template.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {sections.map((section) => {
        const sectionAccessible = !section.role_access || canAccessField(section.role_access, userRole);
        const fields = Array.isArray(section.fields) ? section.fields : [];

        return (
          <div key={section.id} className={`bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden ${!sectionAccessible ? 'opacity-60' : ''}`}>
            {/* Section Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900">{section.title}</h3>
              {section.role_badge && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded uppercase">
                  {section.role_badge}
                </span>
              )}
            </div>

            {/* Fields Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {fields.map((field) => {
                const isWide =
                  ['textarea', 'checkbox_group'].includes(field.type) ||
                  (field.id && (field.id.includes('complaint') || field.id.includes('notes') || field.id.includes('plan') || field.id.includes('hopi') || field.id.includes('instruction') || field.id.includes('advice')));
                return (
                  <div key={field.id} className={isWide ? 'md:col-span-2' : ''}>
                    {renderField(field)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pb-4">
        <button
          type="button"
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2 bg-primary text-white rounded-md text-xs font-semibold hover:opacity-90 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-60"
        >
          {isSaving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          ) : (
            <><Save className="w-3.5 h-3.5" /> {submitButtonLabel || 'Save Record'}</>
          )}
        </button>
      </div>
    </form>
  );
}
