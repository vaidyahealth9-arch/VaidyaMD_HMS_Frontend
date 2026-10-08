'use client';

import React, { useState } from 'react';
import { templatesApi } from '@/lib/api';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Activity,
  ClipboardList,
  Pill,
  Calendar,
  Code,
  CheckCircle2,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  TemplatePurpose,
  TEMPLATE_PURPOSE_TABS,
  getPurposeBadgeStyle,
  parseSchemaToFields,
  buildSchemaFromFields,
} from '../types';

interface ClinicalTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPurpose?: TemplatePurpose;
  onSuccess: (newTemplate: any) => void;
}

export default function ClinicalTemplateModal({
  isOpen,
  onClose,
  initialPurpose = 'proformas',
  onSuccess,
}: ClinicalTemplateModalProps) {
  const [newTemplatePurpose, setNewTemplatePurpose] = useState<TemplatePurpose>(initialPurpose);
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: '',
    record_type: 'clinical_template',
    plugin_id: 'fertility',
    description: '',
    schema_json: '[\n  {\n    "id": "field_1",\n    "label": "Assessment Notes",\n    "type": "textarea",\n    "placeholder": "Enter clinical assessment notes...",\n    "required": true\n  }\n]',
  });
  const [newTemplateEditorMode, setNewTemplateEditorMode] = useState<'form' | 'json'>('form');
  const [newTemplateJsonError, setNewTemplateJsonError] = useState<string | null>(null);
  const [newTemplateFields, setNewTemplateFields] = useState<Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string;
    required?: boolean;
  }>>([
    { id: 'field_1', label: 'Assessment Notes', type: 'textarea', placeholder: 'Enter clinical assessment notes...', required: true }
  ]);
  const [isSavingNewTemplate, setIsSavingNewTemplate] = useState(false);

  // New Template tailored editor state
  const [newRxCategory, setNewRxCategory] = useState('Stimulation / OI');
  const [newRxMedications, setNewRxMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: 'Tab Clomiphene Citrate', dose: '50mg', frequency: 'OD', duration: '5 days', instructions: 'Day 2 to Day 6 of cycle' }
  ]);
  const [newRxAdvice, setNewRxAdvice] = useState('Report for Follicular Scan on Day 9. Adequate oral hydration.');

  const [newOrderCategory, setNewOrderCategory] = useState('Fertility / IVF');
  const [newOrderInvestigations, setNewOrderInvestigations] = useState('Serum AMH, Day 2 FSH/LH, Baseline TVS, Semen Analysis');
  const [newOrderMedications, setNewOrderMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: 'Tab Folic Acid', dose: '5mg', frequency: 'OD', duration: '30 days', instructions: 'After food' }
  ]);
  const [newOrderInstructions, setNewOrderInstructions] = useState('Fasting for 8-10 hours required for fasting blood sugar / lipid profile.');

  const [newProformaComplaint, setNewProformaComplaint] = useState('Primary Infertility for 3 years. Irregular menstrual cycles.');
  const [newProformaHopi, setNewProformaHopi] = useState('Attempting to conceive for 3 years without contraception. History of oligomenorrhea since menarche.');
  const [newProformaDiagnosis, setNewProformaDiagnosis] = useState('Polycystic Ovarian Syndrome (PCOS) - Phenotype A with Anovulatory Infertility.');
  const [newProformaInvestigations, setNewProformaInvestigations] = useState('Day 2 Serum AMH (6.8 ng/mL), TVS AFC: 24 (bilateral). Semen Analysis normozoospermic.');
  const [newProformaPlan, setNewProformaPlan] = useState('Initiate Letrozole 2.5mg ovulation induction with follicular monitoring from Day 9.');

  const [newScanType, setNewScanType] = useState('Transvaginal Sonography (TVS)');
  const [newScanEndometrium, setNewScanEndometrium] = useState('Triple-line pattern, 8.5 mm thickness');
  const [newScanRightOvary, setNewScanRightOvary] = useState('Dominant follicle 18.5 mm x 17 mm. AFC: 12');
  const [newScanLeftOvary, setNewScanLeftOvary] = useState('No dominant follicle. AFC: 14');
  const [newScanPod, setNewScanPod] = useState('Clear / No free fluid');
  const [newScanImpression, setNewScanImpression] = useState('Right dominant mature pre-ovulatory follicle. Favorable trilaminar endometrium.');

  const [newVisitDurationMinutes, setNewVisitDurationMinutes] = useState(30);
  const [newVisitConsultationType, setNewVisitConsultationType] = useState('Couple Consultation');
  const [newVisitRoom, setNewVisitRoom] = useState('Consultation Room 1');
  const [newVisitTariffCode, setNewVisitTariffCode] = useState('CONS-FERT-01');
  const [newVisitInstructions, setNewVisitInstructions] = useState('Both partners must attend the consultation with past investigation reports and medical file.');

  const handleNewTemplateFieldsChange = (newFields: typeof newTemplateFields) => {
    setNewTemplateFields(newFields);
    const updatedSchema = buildSchemaFromFields(newFields);
    setNewTemplateForm((prev: any) => ({
      ...prev,
      schema_json: JSON.stringify(updatedSchema, null, 2),
    }));
  };

  const handleNewTemplateJsonChange = (val: string) => {
    setNewTemplateForm((prev: any) => ({ ...prev, schema_json: val }));
    try {
      const parsed = JSON.parse(val);
      setNewTemplateJsonError(null);
      setNewTemplateFields(parseSchemaToFields(parsed));
    } catch (e: any) {
      setNewTemplateJsonError(e.message || 'Invalid JSON syntax');
    }
  };

  const applyTemplatePreset = (type: 'consultation' | 'ultrasound' | 'rx' | 'order_set' | 'visit_type', _target: 'new' | 'active' = 'new') => {
    let presetFields: Array<{ id: string; label: string; type: string; placeholder?: string; options?: string; required?: boolean }> = [];
    if (type === 'consultation') {
      presetFields = [
        { id: 'chief_complaints', label: 'Chief Complaints & Onset', type: 'textarea', placeholder: 'Describe presenting symptoms...', required: true },
        { id: 'medical_history', label: 'Medical & Surgical History', type: 'textarea', placeholder: 'Prior interventions, surgeries, chronic conditions...' },
        { id: 'clinical_examination', label: 'Physical Examination Findings', type: 'textarea', placeholder: 'General, systemic, and local findings...' },
        { id: 'provisional_diagnosis', label: 'Provisional Diagnosis', type: 'text', placeholder: 'e.g. Primary Infertility, PCOS Phenotype B', required: true },
        { id: 'treatment_plan', label: 'Plan of Management & Advice', type: 'textarea', placeholder: 'Medications, follow-up tests, scheduled scans...' }
      ];
    } else if (type === 'ultrasound') {
      presetFields = [
        { id: 'scan_type', label: 'Scan Modality', type: 'select', options: 'TVS Pelvis, TAS Pelvis, Follicular Tracking, Early Pregnancy Viability', required: true },
        { id: 'endometrial_thickness', label: 'Endometrial Thickness (mm)', type: 'number', placeholder: 'e.g. 8.5', required: true },
        { id: 'endometrial_pattern', label: 'Endometrial Pattern', type: 'select', options: 'Triple Line (Trilaminar), Homogeneous, Hyperechoic, Cystic' },
        { id: 'dominant_follicle_size', label: 'Dominant Follicle Diameter (mm)', type: 'number', placeholder: 'e.g. 18.0' },
        { id: 'ovarian_afc', label: 'Antral Follicle Count (R/L)', type: 'text', placeholder: 'e.g. Right: 8, Left: 6' },
        { id: 'pod_fluid', label: 'Pouch of Douglas (POD) Fluid', type: 'select', options: 'Absent, Minimal, Significant Free Fluid' },
        { id: 'scan_impression', label: 'Sonographic Impression', type: 'textarea', placeholder: 'Key ultrasound summary...' }
      ];
    } else if (type === 'order_set') {
      presetFields = [
        { id: 'investigation_bundle', label: 'Included Diagnostic Investigations', type: 'checkbox_group', options: 'Serum AMH, Day 2 FSH/LH, Semen Analysis, TVS Baseline, Thyroid Profile (TSH), Prolactin, Viral Markers Panel', required: true },
        { id: 'clinical_indications', label: 'Clinical Indications', type: 'textarea', placeholder: 'e.g. Primary subfertility > 1.5 years, irregular cycles' },
        { id: 'pre_procedure_fasting', label: 'Fasting / Special Instructions', type: 'text', placeholder: 'e.g. 8-10 hours overnight fasting for metabolic panel' },
        { id: 'priority', label: 'Order Priority', type: 'select', options: 'Routine, Urgent, Stat' }
      ];
    } else if (type === 'rx') {
      presetFields = [
        { id: 'primary_drug', label: 'Drug / Brand Name', type: 'text', placeholder: 'e.g. Tab Metformin 500mg ER', required: true },
        { id: 'dosage', label: 'Dosage / Strength', type: 'text', placeholder: 'e.g. 500mg', required: true },
        { id: 'frequency', label: 'Frequency', type: 'select', options: 'OD (Once Daily), BD (Twice Daily), TDS (Thrice Daily), HS (At Bedtime), SOS (As Needed)', required: true },
        { id: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 30 days', required: true },
        { id: 'route', label: 'Route of Administration', type: 'select', options: 'Oral, Subcutaneous (SC), Intramuscular (IM), Vaginal, Topical' },
        { id: 'special_instructions', label: 'Special Instructions', type: 'textarea', placeholder: 'e.g. Take after food at night. Adequate water intake.' }
      ];
    } else if (type === 'visit_type') {
      presetFields = [
        { id: 'slot_duration_minutes', label: 'Default Slot Duration (Minutes)', type: 'number', placeholder: '30', required: true },
        { id: 'specialty_room', label: 'Designated Room / Cleanroom', type: 'select', options: 'Consultation Room 1, TVS Ultrasound Suite, IVF Cleanroom OT, Andrology Collection Room', required: true },
        { id: 'requires_empty_bladder', label: 'Bladder Preparation Protocol', type: 'select', options: 'Empty Bladder (TVS), Full Bladder (TAS/ET), Not Applicable' },
        { id: 'clinical_notes', label: 'Pre-Appointment Preparation Instructions', type: 'textarea', placeholder: 'Instructions sent to patient in booking SMS...' }
      ];
    }
    handleNewTemplateFieldsChange(presetFields);
  };

  const handleSetNewTemplatePurpose = (purpose: TemplatePurpose) => {
    setNewTemplatePurpose(purpose);
    let defaultRecordType = 'clinical_custom_proforma';
    let defaultPluginId = 'fertility';
    let defaultDesc = '';

    if (purpose === 'proformas') {
      defaultRecordType = 'clinical_workup_proforma';
      defaultPluginId = 'fertility';
      defaultDesc = 'Outpatient clinical evaluation & consultation history proforma';
      applyTemplatePreset('consultation', 'new');
    } else if (purpose === 'scans') {
      defaultRecordType = 'scan_pelvic_usg';
      defaultPluginId = 'fertility';
      defaultDesc = 'Ultrasound sonography scan & follicular tracking record';
      applyTemplatePreset('ultrasound', 'new');
    } else if (purpose === 'order_sets') {
      defaultRecordType = 'os_diagnostic_bundle';
      defaultPluginId = 'opd_order_set';
      defaultDesc = 'Bundled diagnostic investigations & clinical order set';
      applyTemplatePreset('order_set', 'new');
    } else if (purpose === 'rx') {
      defaultRecordType = 'rx_daily_regimen';
      defaultPluginId = 'rx_template';
      defaultDesc = 'Daily protocol prescription & hormonal medication support';
      applyTemplatePreset('rx', 'new');
    } else if (purpose === 'visit_types') {
      defaultRecordType = 'visit_scheduled_procedure';
      defaultPluginId = 'appointment_visit_type';
      defaultDesc = 'Appointment scheduling duration & facility resource allocation';
      applyTemplatePreset('visit_type', 'new');
    }

    setNewTemplateForm((prev) => ({
      ...prev,
      record_type: defaultRecordType,
      plugin_id: defaultPluginId,
      description: defaultDesc,
    }));
  };

  // Template select
  const handleCreateNewTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.title.trim()) {
      alert('Template Title is required.');
      return;
    }
    if (!newTemplateForm.record_type.trim()) {
      alert('Record Type / Slug is required.');
      return;
    }
    setIsSavingNewTemplate(true);
    try {
      let schemaPayload: any = [];
      if (newTemplateEditorMode === 'json') {
        try {
          schemaPayload = JSON.parse(newTemplateForm.schema_json);
        } catch (je: any) {
          alert('JSON Syntax Error: ' + je.message);
          setIsSavingNewTemplate(false);
          return;
        }
      } else {
        // Purpose-based clinical payload
        if (newTemplatePurpose === 'rx') {
          const validMeds = newRxMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: newRxCategory,
            medications: validMeds,
            advice: newRxAdvice,
          };
        } else if (newTemplatePurpose === 'order_sets') {
          const invList = newOrderInvestigations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const validMeds = newOrderMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: newOrderCategory,
            investigations: invList,
            medications: validMeds,
            instructions: newOrderInstructions,
          };
        } else if (newTemplatePurpose === 'proformas') {
          schemaPayload = {
            complaint: newProformaComplaint,
            hopi: newProformaHopi,
            diagnosis: newProformaDiagnosis,
            investigations: newProformaInvestigations,
            plan: newProformaPlan,
          };
        } else if (newTemplatePurpose === 'scans') {
          schemaPayload = {
            scan_type: newScanType,
            endometrium: newScanEndometrium,
            right_ovary: newScanRightOvary,
            left_ovary: newScanLeftOvary,
            pouch_of_douglas: newScanPod,
            impression: newScanImpression,
          };
        } else if (newTemplatePurpose === 'visit_types') {
          schemaPayload = {
            duration_minutes: Number(newVisitDurationMinutes),
            consultation_type: newVisitConsultationType,
            room: newVisitRoom,
            tariff_code: newVisitTariffCode,
            instructions: newVisitInstructions,
          };
        } else {
          schemaPayload = buildSchemaFromFields(newTemplateFields);
        }
      }

      const created: any = await templatesApi.create({
        title: newTemplateForm.title.trim(),
        record_type: newTemplateForm.record_type.trim(),
        plugin_id: newTemplateForm.plugin_id,
        description: newTemplateForm.description.trim(),
        schema_json: schemaPayload,
        is_active: true,
      });

      alert('Template created successfully!');
      onClose();
      setNewTemplateForm({
        title: '',
        record_type: 'clinical_template',
        plugin_id: 'fertility',
        description: '',
        schema_json: '[\n  {\n    "id": "field_1",\n    "label": "Assessment Notes",\n    "type": "textarea",\n    "placeholder": "Enter clinical assessment notes...",\n    "required": true\n  }\n]',
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create template');
    } finally {
      setIsSavingNewTemplate(false);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 bg-rail-bg/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create New Clinical / Rx Template</h3>
                <p className="text-xs text-slate-500">Configure consultation proformas, order sets, or stimulation protocol templates</p>
              </div>
              <button
                type="button"
                onClick={() => onClose()}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="space-y-4">
              {/* Purpose Group Selector */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Clinical Purpose / Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'proformas', label: 'Clinical Proforma', desc: 'Consultation & ANC' },
                    { id: 'scans', label: 'Ultrasound & Scan', desc: 'Follicular / TVS' },
                    { id: 'order_sets', label: 'Smart Order Set', desc: 'Investigation Bundle' },
                    { id: 'rx', label: 'Rx & Protocol', desc: 'Daily Drug Regimen' },
                    { id: 'visit_types', label: 'Visit Type', desc: 'Appointment Slot' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSetNewTemplatePurpose(cat.id as TemplatePurpose)}
                      className={`text-left p-2 rounded-lg border transition-all ${
                        newTemplatePurpose === cat.id
                          ? 'bg-primary text-white border-primary shadow-xs font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="text-[11px] truncate">{cat.label}</div>
                      <div className={`text-[9px] truncate ${newTemplatePurpose === cat.id ? 'text-white/80' : 'text-slate-400'}`}>
                        {cat.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Template Title *</label>
                  <input
                    type="text"
                    required
                    value={newTemplateForm.title}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, title: e.target.value })}
                    placeholder="e.g. Endometriosis Workup Proforma"
                    className="vmd-input"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Record Type / Slug *</label>
                  <input
                    type="text"
                    required
                    value={newTemplateForm.record_type}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, record_type: e.target.value })}
                    placeholder="e.g. endometriosis_workup"
                    className="vmd-input font-mono"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['clinical_template', 'opd_order_set', 'rx_template', 'follicular_study'].map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => setNewTemplateForm((prev) => ({ ...prev, record_type: slug }))}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono"
                      >
                        {slug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Plugin / Department</label>
                  <select
                    value={newTemplateForm.plugin_id}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, plugin_id: e.target.value })}
                    className="vmd-input"
                  >
                    <option value="fertility">Reproductive Medicine (Fertility)</option>
                    <option value="opd">Outpatient Clinic (OPD)</option>
                    <option value="lims">Diagnostic Laboratory (LIMS)</option>
                    <option value="counseling">Clinical Counseling</option>
                    <option value="ipd">Inpatient Wards (IPD)</option>
                    <option value="pharmacy">Pharmacy Dispensary</option>
                    <option value="admin">Hospital Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={newTemplateForm.description}
                    onChange={(e) => setNewTemplateForm({ ...newTemplateForm, description: e.target.value })}
                    placeholder="Brief description of when this template is used..."
                    className="vmd-input"
                  />
                </div>
              </div>

              {/* Schema Configuration Header with Dual Toggle & Presets */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Field Configuration & Schema
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(newTemplateForm.schema_json);
                            setNewTemplateFields(parseSchemaToFields(parsed));
                          } catch {}
                          setNewTemplateEditorMode('form');
                        }}
                        className={`px-3 py-1 rounded-md transition-all ${
                          newTemplateEditorMode === 'form' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Form Builder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = buildSchemaFromFields(newTemplateFields);
                          setNewTemplateForm((prev) => ({ ...prev, schema_json: JSON.stringify(updated, null, 2) }));
                          setNewTemplateEditorMode('json');
                        }}
                        className={`px-3 py-1 rounded-md transition-all ${
                          newTemplateEditorMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
                  <span className="text-slate-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('consultation', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('ultrasound', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Ultrasound Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('order_set', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Order Set
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('rx', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Rx Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplatePreset('visit_type', 'new')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors font-medium"
                  >
                    + Visit Type
                  </button>
                </div>

                {/* Form Builder Mode */}
                {newTemplateEditorMode === 'form' ? (
                  <div className="space-y-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 max-h-[420px] overflow-y-auto">
                    {/* 1. Rx New Template Editor */}
                    {newTemplatePurpose === 'rx' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">Protocol Category</label>
                          <select
                            value={newRxCategory}
                            onChange={(e) => setNewRxCategory(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Stimulation / OI">Stimulation / Ovulation Induction</option>
                            <option value="Luteal Phase Support">Luteal Phase Support</option>
                            <option value="Down-Regulation / Agonist">Down-Regulation / Agonist</option>
                            <option value="FET Preparation">FET Endometrial Preparation</option>
                            <option value="Post-OPU / Transfer">Post-OPU / Transfer Support</option>
                            <option value="General Clinical Rx">General Clinical Rx</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-700">Prescription Medication Regimen ({newRxMedications.length})</span>
                            <button
                              type="button"
                              onClick={() => setNewRxMedications([...newRxMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                              className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" /> Add Drug
                            </button>
                          </div>

                          <div className="space-y-2">
                            {newRxMedications.map((med, mIdx) => (
                              <div key={mIdx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-2 shadow-2xs">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="font-mono font-bold text-indigo-600">#{mIdx + 1} Medication</span>
                                  <button
                                    type="button"
                                    onClick={() => setNewRxMedications(newRxMedications.filter((_, i) => i !== mIdx))}
                                    disabled={newRxMedications.length <= 1}
                                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <input
                                    type="text"
                                    value={med.drug_name}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].drug_name = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Drug Name (e.g. Tab Letrozole)"
                                    className="vmd-input text-xs sm:col-span-2"
                                  />
                                  <input
                                    type="text"
                                    value={med.dose}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].dose = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Dose (e.g. 2.5mg)"
                                    className="vmd-input text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <select
                                    value={med.frequency}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].frequency = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    className="vmd-input text-xs font-semibold"
                                  >
                                    <option value="OD">OD (Once Daily)</option>
                                    <option value="BD">BD (Twice Daily)</option>
                                    <option value="TDS">TDS (Thrice Daily)</option>
                                    <option value="QID">QID (4 Times Daily)</option>
                                    <option value="HS">HS (At Bedtime)</option>
                                    <option value="SOS">SOS (When Needed)</option>
                                    <option value="STAT">STAT (Immediate)</option>
                                  </select>
                                  <input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].duration = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Duration (e.g. 5 days)"
                                    className="vmd-input text-xs"
                                  />
                                  <input
                                    type="text"
                                    value={med.instructions}
                                    onChange={(e) => {
                                      const next = [...newRxMedications];
                                      next[mIdx].instructions = e.target.value;
                                      setNewRxMedications(next);
                                    }}
                                    placeholder="Instructions (e.g. After food)"
                                    className="vmd-input text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Patient & Protocol Advice</label>
                          <textarea
                            rows={2}
                            value={newRxAdvice}
                            onChange={(e) => setNewRxAdvice(e.target.value)}
                            placeholder="Advice given on prescription slip..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 2. Order Sets New Template Editor */}
                    {newTemplatePurpose === 'order_sets' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800">Specialty Category</label>
                          <select
                            value={newOrderCategory}
                            onChange={(e) => setNewOrderCategory(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Fertility / IVF">Fertility / IVF</option>
                            <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Andrology / Male Fertility">Andrology / Male Fertility</option>
                            <option value="Endocrinology">Endocrinology</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-slate-700">
                            Requisitioned Diagnostic Tests (Comma-separated)
                          </label>
                          <textarea
                            rows={2}
                            value={newOrderInvestigations}
                            onChange={(e) => setNewOrderInvestigations(e.target.value)}
                            placeholder="e.g. Serum AMH, Baseline TVS, Day 2 FSH/LH, Semen Analysis"
                            className="vmd-input text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-700">Bundled Companion Medications ({newOrderMedications.length})</span>
                            <button
                              type="button"
                              onClick={() => setNewOrderMedications([...newOrderMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                              className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" /> Add Med
                            </button>
                          </div>

                          {newOrderMedications.map((med, mIdx) => (
                            <div key={mIdx} className="bg-white p-2 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                              <input
                                type="text"
                                value={med.drug_name}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].drug_name = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Drug name"
                                className="vmd-input text-xs"
                              />
                              <input
                                type="text"
                                value={med.dose}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].dose = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Dose"
                                className="vmd-input text-xs"
                              />
                              <input
                                type="text"
                                value={med.frequency}
                                onChange={(e) => {
                                  const next = [...newOrderMedications];
                                  next[mIdx].frequency = e.target.value;
                                  setNewOrderMedications(next);
                                }}
                                placeholder="Frequency (OD/BD)"
                                className="vmd-input text-xs"
                              />
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => {
                                    const next = [...newOrderMedications];
                                    next[mIdx].duration = e.target.value;
                                    setNewOrderMedications(next);
                                  }}
                                  placeholder="Duration"
                                  className="vmd-input text-xs flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => setNewOrderMedications(newOrderMedications.filter((_, i) => i !== mIdx))}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Clinical / Nursing Instructions</label>
                          <textarea
                            rows={2}
                            value={newOrderInstructions}
                            onChange={(e) => setNewOrderInstructions(e.target.value)}
                            placeholder="Special nursing or fasting instructions..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Clinical Proformas New Template Editor */}
                    {newTemplatePurpose === 'proformas' && (
                      <div className="space-y-2.5 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Chief Complaints & Duration *</label>
                          <textarea
                            rows={2}
                            value={newProformaComplaint}
                            onChange={(e) => setNewProformaComplaint(e.target.value)}
                            placeholder="e.g. Primary Infertility for 2.5 years..."
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">History of Presenting Illness (HOPI)</label>
                          <textarea
                            rows={2}
                            value={newProformaHopi}
                            onChange={(e) => setNewProformaHopi(e.target.value)}
                            placeholder="Detailed clinical history..."
                            className="vmd-input text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Provisional Diagnosis *</label>
                            <input
                              type="text"
                              value={newProformaDiagnosis}
                              onChange={(e) => setNewProformaDiagnosis(e.target.value)}
                              placeholder="e.g. Primary Infertility / PCOS"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Diagnostic Investigations</label>
                            <input
                              type="text"
                              value={newProformaInvestigations}
                              onChange={(e) => setNewProformaInvestigations(e.target.value)}
                              placeholder="e.g. Day 2 Baseline TVS, Serum AMH"
                              className="vmd-input text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Plan of Management</label>
                          <textarea
                            rows={2}
                            value={newProformaPlan}
                            onChange={(e) => setNewProformaPlan(e.target.value)}
                            placeholder="Management steps, OI protocol, counseling notes..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 4. Ultrasound Scans New Template Editor */}
                    {newTemplatePurpose === 'scans' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-slate-700">Scan Modality</label>
                          <select
                            value={newScanType}
                            onChange={(e) => setNewScanType(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                          >
                            <option value="Transvaginal Sonography (TVS)">Transvaginal Sonography (TVS)</option>
                            <option value="Follicular Tracking Study">Follicular Tracking Study</option>
                            <option value="Transabdominal Pelvic USG (TAS)">Transabdominal Pelvic USG (TAS)</option>
                            <option value="Early Pregnancy Viability USG">Early Pregnancy Viability USG</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Endometrium Metrics</label>
                            <input
                              type="text"
                              value={newScanEndometrium}
                              onChange={(e) => setNewScanEndometrium(e.target.value)}
                              placeholder="e.g. 8.2mm, Trilaminar Triple-Line"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Pouch of Douglas (POD)</label>
                            <input
                              type="text"
                              value={newScanPod}
                              onChange={(e) => setNewScanPod(e.target.value)}
                              placeholder="e.g. Clear / No free fluid"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Right Ovary Metrics</label>
                            <input
                              type="text"
                              value={newScanRightOvary}
                              onChange={(e) => setNewScanRightOvary(e.target.value)}
                              placeholder="e.g. AFC: 8 | Dominant: 18.5mm"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Left Ovary Metrics</label>
                            <input
                              type="text"
                              value={newScanLeftOvary}
                              onChange={(e) => setNewScanLeftOvary(e.target.value)}
                              placeholder="e.g. AFC: 7 | Leading: 12.0mm"
                              className="vmd-input text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Sonographic Impression</label>
                          <textarea
                            rows={2}
                            value={newScanImpression}
                            onChange={(e) => setNewScanImpression(e.target.value)}
                            placeholder="Summary ultrasound impression..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* 5. Visit Types New Template Editor */}
                    {newTemplatePurpose === 'visit_types' && (
                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Slot Duration</label>
                            <select
                              value={newVisitDurationMinutes}
                              onChange={(e) => setNewVisitDurationMinutes(Number(e.target.value))}
                              className="vmd-input text-xs font-semibold"
                            >
                              <option value={15}>15 Minutes</option>
                              <option value={20}>20 Minutes</option>
                              <option value={30}>30 Minutes</option>
                              <option value={45}>45 Minutes</option>
                              <option value={60}>60 Minutes</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Consultation Modality</label>
                            <input
                              type="text"
                              value={newVisitConsultationType}
                              onChange={(e) => setNewVisitConsultationType(e.target.value)}
                              placeholder="e.g. Couple Infertility Workup"
                              className="vmd-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Allocated Room / Suite</label>
                            <select
                              value={newVisitRoom}
                              onChange={(e) => setNewVisitRoom(e.target.value)}
                              className="vmd-input text-xs"
                            >
                              <option value="Consultation Room 1">Consultation Room 1</option>
                              <option value="Consultation Room 2">Consultation Room 2</option>
                              <option value="Ultrasound TVS Suite A">Ultrasound TVS Suite A</option>
                              <option value="IVF Cleanroom Procedure OT">IVF Cleanroom Procedure OT</option>
                              <option value="Andrology Semen Collection Suite">Andrology Semen Collection Suite</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-0.5">Linked Tariff Code</label>
                            <input
                              type="text"
                              value={newVisitTariffCode}
                              onChange={(e) => setNewVisitTariffCode(e.target.value)}
                              placeholder="e.g. OPD-CONS-01"
                              className="vmd-input text-xs font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-0.5">Patient Preparation Guidelines</label>
                          <textarea
                            rows={2}
                            value={newVisitInstructions}
                            onChange={(e) => setNewVisitInstructions(e.target.value)}
                            placeholder="Instructions communicated to patient on booking confirmation..."
                            className="vmd-input text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={10}
                      value={newTemplateForm.schema_json}
                      onChange={(e) => handleNewTemplateJsonChange(e.target.value)}
                      className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg bg-slate-900 text-slate-100"
                    />
                    <div className="mt-1 text-[11px]">
                      {newTemplateJsonError ? (
                        <span className="text-rose-500 font-semibold">⚠ {newTemplateJsonError}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">✓ Valid JSON</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingNewTemplate}
                  className="px-4 py-2 bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                >
                  {isSavingNewTemplate ? 'Creating Template...' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>

  );
}
