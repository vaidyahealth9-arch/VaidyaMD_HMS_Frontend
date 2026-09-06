'use client';

import { useState } from 'react';
import { canAccessField } from '@/lib/utils';

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
  schema: FormSchema;
  initialData?: Record<string, unknown>;
  userRole: string;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  isSaving?: boolean;
}

// --- Field Components ---
function TextField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input
      id={field.id}
      type={field.type === 'number' ? 'number' : 'text'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      min={field.min}
      max={field.max}
      step={field.step}
      readOnly={field.readOnly || disabled}
      className="vmd-input"
    />
  );
}

function TextareaField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <textarea
      id={field.id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={field.rows || 3}
      readOnly={disabled}
      className="vmd-input resize-none"
    />
  );
}

function SelectField({ field, value, onChange, disabled }: { field: FieldSchema; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="relative">
      <select
        id={field.id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="vmd-input appearance-none pr-8 cursor-pointer"
      >
        <option value="">— Select —</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</span>
    </div>
  );
}

function CheckboxGroupField({ field, value, onChange, disabled }: { field: FieldSchema; value: string[]; onChange: (v: string[]) => void; disabled: boolean }) {
  const checked = Array.isArray(value) ? value : [];

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
      {field.options?.map((opt) => {
        const isChecked = checked.includes(opt.value);
        return (
          <label
            key={opt.value}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer select-none
              border transition-all duration-150 shadow-sm
              ${isChecked
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggle(opt.value)}
              className="w-4 h-4 accent-indigo-600 rounded"
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
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      readOnly={disabled}
      className="vmd-input"
    />
  );
}

// --- DynamicForm Main ---
export default function DynamicForm({ schema, initialData = {}, userRole, onSave, isSaving }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);

  const updateField = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
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
          {field.role_badge && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
              {field.role_badge}
            </span>
          )}
        </div>

        {isDisabled ? (
          <div className="vmd-input opacity-40 bg-slate-100 cursor-not-allowed text-slate-400 italic text-sm">
            🔒 {field.role_badge || 'Restricted access'}
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
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {schema.sections.map((section) => {
        // Section-level access check
        const sectionAccessible = !section.role_access || canAccessField(section.role_access, userRole);

        return (
          <div key={section.id} className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${!sectionAccessible ? 'opacity-60' : ''}`}>
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">{section.title}</h3>
              {section.role_badge && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  {section.role_badge}
                </span>
              )}
            </div>

            {/* Fields Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {section.fields.map((field) => {
                const isWide = ['textarea', 'checkbox_group'].includes(field.type) || field.id.includes('complaint') || field.id.includes('notes');
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
          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-60"
        >
          {isSaving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          ) : (
            <>💾 Save Record</>
          )}
        </button>
      </div>
    </form>
  );
}
