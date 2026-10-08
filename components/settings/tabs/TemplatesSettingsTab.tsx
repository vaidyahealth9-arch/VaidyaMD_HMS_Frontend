'use client';

import React, { useState, useMemo } from 'react';
import { templatesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import {
  Search,
  Plus,
  FileText,
  Activity,
  ClipboardList,
  Pill,
  Calendar,
  Layers,
  Code,
  Eye,
  CheckCircle2,
  Trash2,
  Sparkles,
  Edit2,
  Check,
  FlaskConical,
} from 'lucide-react';
import {
  TemplatePurpose,
  PurposeTabConfig,
  TEMPLATE_PURPOSE_TABS,
  getTemplatePurpose,
  getPurposeBadgeStyle,
  parseSchemaToFields,
  buildSchemaFromFields,
} from '../types';
import ClinicalTemplateModal from '../modals/ClinicalTemplateModal';

interface TemplatesSettingsTabProps {
  clinicalTemplates: any[];
  setClinicalTemplates: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function TemplatesSettingsTab({
  clinicalTemplates,
  setClinicalTemplates,
}: TemplatesSettingsTabProps) {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templatePurposeTab, setTemplatePurposeTab] = useState<TemplatePurpose>('all');
  const [templateFilterPlugin, setTemplateFilterPlugin] = useState('all');
  const [templateViewMode, setTemplateViewMode] = useState<'preview' | 'json' | 'builder'>('preview');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateJsonText, setTemplateJsonText] = useState('');
  const [templateJsonError, setTemplateJsonError] = useState<string | null>(null);
  const [parsedSchema, setParsedSchema] = useState<any>(null);
  const [activeTemplateFields, setActiveTemplateFields] = useState<Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    options?: string;
    required?: boolean;
  }>>([]);
  const [previewRole, setPreviewRole] = useState<string>('doctor');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [builderGenericMode, setBuilderGenericMode] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);

  // Tailored Clinical Editor State (for selectedTemplate)
  const [rxCategory, setRxCategory] = useState('Stimulation / OI');
  const [rxMedications, setRxMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([
    { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }
  ]);
  const [rxAdvice, setRxAdvice] = useState('');

  const [orderCategory, setOrderCategory] = useState('Fertility / IVF');
  const [orderInvestigations, setOrderInvestigations] = useState('');
  const [orderMedications, setOrderMedications] = useState<Array<{
    drug_name: string;
    dose: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>>([]);
  const [orderInstructions, setOrderInstructions] = useState('');

  const [proformaComplaint, setProformaComplaint] = useState('');
  const [proformaHopi, setProformaHopi] = useState('');
  const [proformaDiagnosis, setProformaDiagnosis] = useState('');
  const [proformaInvestigations, setProformaInvestigations] = useState('');
  const [proformaPlan, setProformaPlan] = useState('');

  const [scanType, setScanType] = useState('Transvaginal Sonography (TVS)');
  const [scanEndometrium, setScanEndometrium] = useState('');
  const [scanRightOvary, setScanRightOvary] = useState('');
  const [scanLeftOvary, setScanLeftOvary] = useState('');
  const [scanPod, setScanPod] = useState('Clear / No free fluid');
  const [scanImpression, setScanImpression] = useState('');

  const [visitDurationMinutes, setVisitDurationMinutes] = useState(30);
  const [visitConsultationType, setVisitConsultationType] = useState('Couple Consultation');
  const [visitRoom, setVisitRoom] = useState('Consultation Room 1');
  const [visitTariffCode, setVisitTariffCode] = useState('');
  const [visitInstructions, setVisitInstructions] = useState('');

  const purposeCounts = useMemo(() => {
    const counts: Record<TemplatePurpose, number> = {
      all: clinicalTemplates.length,
      proformas: 0,
      scans: 0,
      order_sets: 0,
      rx: 0,
      visit_types: 0,
    };
    clinicalTemplates.forEach((t) => {
      const p = getTemplatePurpose(t);
      if (counts[p] !== undefined) counts[p] += 1;
    });
    return counts;
  }, [clinicalTemplates]);

  const filteredTemplates = useMemo(() => {
    return clinicalTemplates.filter((tmpl) => {
      if (templatePurposeTab !== 'all') {
        const p = getTemplatePurpose(tmpl);
        if (p !== templatePurposeTab) return false;
      }
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase();
        const matchTitle = (tmpl.title || '').toLowerCase().includes(q);
        const matchSlug = (tmpl.record_type || '').toLowerCase().includes(q);
        const matchDesc = (tmpl.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchDesc) return false;
      }
      return true;
    });
  }, [clinicalTemplates, templatePurposeTab, templateSearch]);

  const handleSelectPurposeTab = (tabId: TemplatePurpose) => {
    setTemplatePurposeTab(tabId);
    if (tabId !== 'all') {
      const matching = clinicalTemplates.filter((t) => getTemplatePurpose(t) === tabId);
      if (matching.length > 0 && (!selectedTemplate || getTemplatePurpose(selectedTemplate) !== tabId)) {
        handleSelectTemplate(matching[0]);
      }
    }
  };

  const handleActiveFieldsChange = (newFields: typeof activeTemplateFields) => {
    setActiveTemplateFields(newFields);
    const updatedSchema = buildSchemaFromFields(newFields);
    setParsedSchema(updatedSchema);
    setTemplateJsonText(JSON.stringify(updatedSchema, null, 2));
    setTemplateJsonError(null);
  };

  const applyTemplatePreset = (type: 'consultation' | 'ultrasound' | 'rx' | 'order_set' | 'visit_type', target: 'new' | 'active' = 'active') => {
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
    handleActiveFieldsChange(presetFields);
  };

  const handleSelectTemplate = (tmpl: any) => {
    setSelectedTemplate(tmpl);
    setTemplateTitle(tmpl.title || '');
    setTemplateDesc(tmpl.description || '');
    const schemaObj = tmpl.schema_json || {};
    setParsedSchema(schemaObj);
    setTemplateJsonText(JSON.stringify(schemaObj, null, 2));
    setTemplateJsonError(null);
    setActiveTemplateFields(parseSchemaToFields(schemaObj));
    setBuilderGenericMode(false);

    const purpose = getTemplatePurpose(tmpl);
    if (purpose === 'rx') {
      setRxCategory(schemaObj?.category || 'Stimulation / OI');
      if (Array.isArray(schemaObj?.medications) && schemaObj.medications.length > 0) {
        setRxMedications(schemaObj.medications.map((m: any) => ({
          drug_name: m.drug_name || m.name || '',
          dose: m.dose || m.dosage || '',
          frequency: m.frequency || 'OD',
          duration: m.duration || '',
          instructions: m.instructions || '',
        })));
      } else {
        setRxMedications([{ drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }]);
      }
      setRxAdvice(schemaObj?.advice || '');
    } else if (purpose === 'order_sets') {
      setOrderCategory(schemaObj?.category || 'Fertility / IVF');
      if (Array.isArray(schemaObj?.investigations)) {
        setOrderInvestigations(schemaObj.investigations.join(', '));
      } else {
        setOrderInvestigations(schemaObj?.investigations || '');
      }
      if (Array.isArray(schemaObj?.medications) && schemaObj.medications.length > 0) {
        setOrderMedications(schemaObj.medications.map((m: any) => ({
          drug_name: m.drug_name || m.name || '',
          dose: m.dose || m.dosage || '',
          frequency: m.frequency || 'OD',
          duration: m.duration || '',
          instructions: m.instructions || '',
        })));
      } else {
        setOrderMedications([]);
      }
      setOrderInstructions(schemaObj?.instructions || '');
    } else if (purpose === 'proformas') {
      setProformaComplaint(schemaObj?.complaint || '');
      setProformaHopi(schemaObj?.hopi || '');
      setProformaDiagnosis(schemaObj?.diagnosis || '');
      setProformaInvestigations(schemaObj?.investigations || '');
      setProformaPlan(schemaObj?.plan || '');
    } else if (purpose === 'scans') {
      setScanType(schemaObj?.scan_type || 'Transvaginal Sonography (TVS)');
      setScanEndometrium(schemaObj?.endometrium || '');
      setScanRightOvary(schemaObj?.right_ovary || '');
      setScanLeftOvary(schemaObj?.left_ovary || '');
      setScanPod(schemaObj?.pouch_of_douglas || 'Clear / No free fluid');
      setScanImpression(schemaObj?.impression || '');
    } else if (purpose === 'visit_types') {
      setVisitDurationMinutes(schemaObj?.duration_minutes ? Number(schemaObj.duration_minutes) : 30);
      setVisitConsultationType(schemaObj?.consultation_type || 'Couple Consultation');
      setVisitRoom(schemaObj?.room || 'Consultation Room 1');
      setVisitTariffCode(schemaObj?.tariff_code || '');
      setVisitInstructions(schemaObj?.instructions || '');
    }
  };

  const handleJsonChange = (val: string) => {
    setTemplateJsonText(val);
    try {
      const parsed = JSON.parse(val);
      setParsedSchema(parsed);
      setActiveTemplateFields(parseSchemaToFields(parsed));
      setTemplateJsonError(null);
    } catch (e: any) {
      setTemplateJsonError(e.message);
    }
  };

  // -------------------------------------------------------------
  // SAVE HANDLERS
  const handleSaveTemplate = async () => {
    if (templateJsonError || !selectedTemplate || !user) return;
    setIsSavingTemplate(true);
    try {
      let schemaPayload: any = parsedSchema;
      const purpose = getTemplatePurpose(selectedTemplate);

      if (templateViewMode === 'builder') {
        if (builderGenericMode) {
          schemaPayload = buildSchemaFromFields(activeTemplateFields);
        } else if (purpose === 'rx') {
          const validMeds = rxMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: rxCategory,
            medications: validMeds,
            advice: rxAdvice,
          };
        } else if (purpose === 'order_sets') {
          const invList = orderInvestigations
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          const validMeds = orderMedications.filter((m) => m.drug_name.trim().length > 0);
          schemaPayload = {
            category: orderCategory,
            investigations: invList,
            medications: validMeds,
            instructions: orderInstructions,
          };
        } else if (purpose === 'proformas') {
          schemaPayload = {
            complaint: proformaComplaint,
            hopi: proformaHopi,
            diagnosis: proformaDiagnosis,
            investigations: proformaInvestigations,
            plan: proformaPlan,
          };
        } else if (purpose === 'scans') {
          schemaPayload = {
            scan_type: scanType,
            endometrium: scanEndometrium,
            right_ovary: scanRightOvary,
            left_ovary: scanLeftOvary,
            pouch_of_douglas: scanPod,
            impression: scanImpression,
          };
        } else if (purpose === 'visit_types') {
          schemaPayload = {
            duration_minutes: Number(visitDurationMinutes),
            consultation_type: visitConsultationType,
            room: visitRoom,
            tariff_code: visitTariffCode,
            instructions: visitInstructions,
          };
        } else {
          schemaPayload = buildSchemaFromFields(activeTemplateFields);
        }
      } else if (templateViewMode === 'json') {
        schemaPayload = parsedSchema;
      }

      const updated: any = await templatesApi.update(selectedTemplate.id, {
        title: templateTitle,
        description: templateDesc,
        schema_json: schemaPayload,
      });
      setClinicalTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTemplate(updated);
      setParsedSchema(schemaPayload);
      setTemplateJsonText(JSON.stringify(schemaPayload, null, 2));
      alert('Clinical Template schema published to EMR successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };


  return (
    <>
        <div className="space-y-4">
          {/* Top Horizontal Purpose Sub-Tabs Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Clinical & Rx Templates</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {clinicalTemplates.length} Active Templates
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Organized by clinical purpose for consultation workups, sonography scans, smart order sets, daily Rx, and appointment scheduling.
                </p>
              </div>
              <button
                onClick={() => {
                  const initialPurpose = templatePurposeTab === 'all' ? 'proformas' : templatePurposeTab;
                  setShowNewTemplateModal(true);
                }}
                className="px-3.5 py-1.5 text-xs bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                New Template
              </button>
            </div>

            {/* Horizontal Sub-Tabs List with Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {TEMPLATE_PURPOSE_TABS.map((ptab) => {
                const TabIcon = ptab.icon;
                const isActive = templatePurposeTab === ptab.id;
                const count = purposeCounts[ptab.id] || 0;

                return (
                  <button
                    key={ptab.id}
                    type="button"
                    onClick={() => handleSelectPurposeTab(ptab.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-primary/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TabIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-primary'}`} />
                        <span className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                          {ptab.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    <p className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {ptab.hint}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Active Purpose Summary Banner */}
            {(() => {
              const activeTabInfo = TEMPLATE_PURPOSE_TABS.find((t) => t.id === templatePurposeTab) || TEMPLATE_PURPOSE_TABS[0];
              const ActiveIcon = activeTabInfo.icon;
              return (
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ActiveIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-slate-800">{activeTabInfo.label}:</span>
                    <span className="text-slate-500 text-[11px]">{activeTabInfo.description}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Showing <span className="font-bold text-slate-800">{filteredTemplates.length}</span> of {purposeCounts[templatePurposeTab] || 0} templates
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Two-Column Editor Layout: Left Template Selector, Right Schema Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-3">
              {/* Search within Purpose */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder={`Search ${templatePurposeTab === 'all' ? 'all templates' : TEMPLATE_PURPOSE_TABS.find(t => t.id === templatePurposeTab)?.label}...`}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              {/* Template Cards List */}
              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {filteredTemplates.map((tmpl) => {
                  const purpose = getTemplatePurpose(tmpl);
                  const purposeConfig = TEMPLATE_PURPOSE_TABS.find((t) => t.id === purpose);
                  const isSelected = selectedTemplate?.id === tmpl.id;
                  const fieldCount = Array.isArray(tmpl.schema_json)
                    ? tmpl.schema_json.length
                    : typeof tmpl.schema_json === 'object' && tmpl.schema_json !== null
                    ? Object.keys(tmpl.schema_json).length
                    : 0;

                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 text-xs leading-snug truncate max-w-[210px]">
                          {tmpl.title}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${getPurposeBadgeStyle(purpose)}`}>
                          {purposeConfig?.badgeLabel || purpose}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span className="truncate max-w-[170px]">{tmpl.record_type}</span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {fieldCount > 0 ? `${fieldCount} fields` : 'Custom schema'}
                        </span>
                      </div>
                      {tmpl.description && (
                        <p className="text-[10px] text-slate-400 truncate mt-1">
                          {tmpl.description}
                        </p>
                      )}
                    </button>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-xl space-y-2">
                    <p className="text-xs text-slate-500">No templates found in this purpose category.</p>
                    <button
                      type="button"
                      onClick={() => setShowNewTemplateModal(true)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Create New Template
                    </button>
                  </div>
                )}
              </div>
            </div>
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{templateTitle || 'Template Editor'}</h3>
                <p className="text-[11px] text-slate-500">{selectedTemplate?.record_type} · {selectedTemplate?.plugin_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* 3-Mode Toggle: Form Builder | JSON Schema | Live Preview */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTemplateFields(parseSchemaToFields(parsedSchema));
                      setTemplateViewMode('builder');
                    }}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'builder' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Form Builder
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewMode('json')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'json' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    JSON Schema
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewMode('preview')}
                    className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                      templateViewMode === 'preview' ? 'bg-white text-primary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </button>
                </div>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || !!templateJsonError}
                  className="px-3.5 py-1.5 text-xs bg-primary hover:bg-primary-mid text-white font-semibold rounded-lg shadow-sm"
                >
                  {isSavingTemplate ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>

            {/* In Form Builder mode */}
            {templateViewMode === 'builder' && (
              <div className="space-y-4">
                {/* Purpose Group Header Banner & Toggle */}
                {(() => {
                  const purpose = getTemplatePurpose(selectedTemplate);
                  const pConfig = TEMPLATE_PURPOSE_TABS.find((t) => t.id === purpose) || TEMPLATE_PURPOSE_TABS[0];
                  const IconComp = pConfig.icon;

                  return (
                    <div className="flex flex-wrap justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <span>{builderGenericMode ? 'Generic Form Builder' : pConfig.label + ' Clinical Editor'}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getPurposeBadgeStyle(purpose)}`}>
                              {pConfig.badgeLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">{pConfig.hint}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBuilderGenericMode(!builderGenericMode)}
                          className="text-[11px] px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-700 font-semibold transition-colors"
                        >
                          {builderGenericMode ? '← Back to Tailored Clinical UI' : '⚙ Raw Field Builder'}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 1. PURPOSE: RX PRESCRIPTIONS & MEDICATION PROTOCOLS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'rx' && (
                  <div className="space-y-4">
                    <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Pill className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-950">Prescription & Protocol Editor</h4>
                          <p className="text-[11px] text-indigo-700">Define daily dosing regimens, frequency, and instructions</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Category:</label>
                        <select
                          value={rxCategory}
                          onChange={(e) => setRxCategory(e.target.value)}
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
                    </div>

                    {/* Medications Table */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Prescribed Medications ({rxMedications.length})</span>
                        <button
                          type="button"
                          onClick={() => setRxMedications([...rxMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                          className="text-xs font-semibold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Medication
                        </button>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="p-2.5 w-8 text-center">#</th>
                              <th className="p-2.5">Drug / Brand Name *</th>
                              <th className="p-2.5">Dose / Strength</th>
                              <th className="p-2.5">Frequency</th>
                              <th className="p-2.5">Duration</th>
                              <th className="p-2.5">Instructions</th>
                              <th className="p-2.5 text-center w-10">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rxMedications.map((med, mIdx) => (
                              <tr key={mIdx} className="hover:bg-slate-50/50">
                                <td className="p-2 text-slate-400 font-mono text-[11px] text-center">{mIdx + 1}</td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.drug_name}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].drug_name = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. Tab Letrozole 2.5mg"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.dose}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].dose = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. 5mg or 150 IU"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <select
                                    value={med.frequency}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].frequency = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary font-semibold"
                                  >
                                    <option value="OD">OD (Once Daily)</option>
                                    <option value="BD">BD (Twice Daily)</option>
                                    <option value="TDS">TDS (Thrice Daily)</option>
                                    <option value="QID">QID (4 Times Daily)</option>
                                    <option value="HS">HS (At Bedtime)</option>
                                    <option value="SOS">SOS (When Needed)</option>
                                    <option value="STAT">STAT (Immediate)</option>
                                  </select>
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.duration}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].duration = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. 5 Days"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={med.instructions}
                                    onChange={(e) => {
                                      const next = [...rxMedications];
                                      next[mIdx].instructions = e.target.value;
                                      setRxMedications(next);
                                    }}
                                    placeholder="e.g. After food with water"
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setRxMedications(rxMedications.filter((_, i) => i !== mIdx))}
                                    disabled={rxMedications.length <= 1}
                                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded"
                                    title="Remove medication row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* General Clinical Advice */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">General Clinical Advice / Protocol Instructions</label>
                      <textarea
                        rows={3}
                        value={rxAdvice}
                        onChange={(e) => setRxAdvice(e.target.value)}
                        placeholder="e.g. Continue adequate hydration (2.5 - 3 Litres/day). Report for Day 9 Follicular Monitoring USG with empty bladder."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 2. PURPOSE: SMART ORDER SETS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'order_sets' && (
                  <div className="space-y-4">
                    <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">Smart Order Set Editor</h4>
                          <p className="text-[11px] text-emerald-700">Bundle diagnostic lab investigations, imaging scans, and companion medicines</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Category:</label>
                        <select
                          value={orderCategory}
                          onChange={(e) => setOrderCategory(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                        >
                          <option value="Fertility / IVF">Fertility / IVF</option>
                          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
                          <option value="General Medicine">General Medicine</option>
                          <option value="Andrology / Male Fertility">Andrology / Male Fertility</option>
                          <option value="Endocrinology">Endocrinology</option>
                        </select>
                      </div>
                    </div>

                    {/* Diagnostic Investigations */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Bundled Diagnostic Investigations & Lab Tests (Comma-separated)
                      </label>
                      <textarea
                        rows={2}
                        value={orderInvestigations}
                        onChange={(e) => setOrderInvestigations(e.target.value)}
                        placeholder="e.g. Serum AMH, Serum FSH, Serum LH, Serum Estradiol E2, Serum TSH, Serum Prolactin, Pelvic TVS Ultrasound"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-semibold py-0.5">Quick Add:</span>
                        {['Serum AMH', 'Baseline TVS', 'Day 2 FSH/LH', 'Thyroid Profile', 'Viral Markers', 'Semen Analysis WHO 6th', 'Serum Progesterone'].map((test) => (
                          <button
                            key={test}
                            type="button"
                            onClick={() => {
                              const current = orderInvestigations.split(',').map((s) => s.trim()).filter(Boolean);
                              if (!current.includes(test)) {
                                setOrderInvestigations(current.concat(test).join(', '));
                              }
                            }}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full text-slate-700 transition-colors"
                          >
                            + {test}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bundled Medications Table */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">Bundled Regimen Medications ({orderMedications.length})</span>
                        <button
                          type="button"
                          onClick={() => setOrderMedications([...orderMedications, { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' }])}
                          className="text-xs font-semibold px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Medication
                        </button>
                      </div>

                      {orderMedications.length > 0 ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                              <tr>
                                <th className="p-2 w-8 text-center">#</th>
                                <th className="p-2">Drug Name</th>
                                <th className="p-2">Dose</th>
                                <th className="p-2">Frequency</th>
                                <th className="p-2">Duration</th>
                                <th className="p-2">Instructions</th>
                                <th className="p-2 text-center w-10">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {orderMedications.map((med, mIdx) => (
                                <tr key={mIdx} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-slate-400 font-mono text-[11px] text-center">{mIdx + 1}</td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.drug_name}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].drug_name = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. Inj Menopur 150 IU"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.dose}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].dose = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. 150 IU"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={med.frequency}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].frequency = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary font-semibold"
                                    >
                                      <option value="OD">OD</option>
                                      <option value="BD">BD</option>
                                      <option value="TDS">TDS</option>
                                      <option value="HS">HS</option>
                                      <option value="STAT">STAT</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.duration}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].duration = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. 4 Days"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={med.instructions}
                                      onChange={(e) => {
                                        const next = [...orderMedications];
                                        next[mIdx].instructions = e.target.value;
                                        setOrderMedications(next);
                                      }}
                                      placeholder="e.g. Subcutaneously at 9 PM"
                                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setOrderMedications(orderMedications.filter((_, i) => i !== mIdx))}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs text-center">
                          No bundled medications added to this order set yet (Optional).
                        </div>
                      )}
                    </div>

                    {/* Nursing / Patient Instructions */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Clinical & Nursing Instructions</label>
                      <textarea
                        rows={2}
                        value={orderInstructions}
                        onChange={(e) => setOrderInstructions(e.target.value)}
                        placeholder="e.g. Fasting 8-10 hours overnight. Collect blood sample before taking morning thyroid medication."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. PURPOSE: CLINICAL PROFORMAS */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'proformas' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-blue-950">Clinical Consultation Proforma</h4>
                          <p className="text-[11px] text-blue-700">Configure complaints, presenting illness, diagnosis, and treatment plans</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Chief Complaints & Duration *</label>
                        <textarea
                          rows={2}
                          value={proformaComplaint}
                          onChange={(e) => setProformaComplaint(e.target.value)}
                          placeholder="e.g. Primary Infertility for 2.5 years, irregular menstrual cycles with severe dysmenorrhea..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">History of Presenting Illness (HOPI) & Clinical Background</label>
                        <textarea
                          rows={3}
                          value={proformaHopi}
                          onChange={(e) => setProformaHopi(e.target.value)}
                          placeholder="e.g. Married for 3 years, non-consanguineous. Regular coitus. Menstrual cycle 35-45 days. No past abdominal surgeries. Partner semen analysis reports normozoospermia."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Provisional / Differential Diagnosis *</label>
                          <input
                            type="text"
                            value={proformaDiagnosis}
                            onChange={(e) => setProformaDiagnosis(e.target.value)}
                            placeholder="e.g. Polycystic Ovarian Syndrome (Rotterdam Criteria)"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Recommended Investigations</label>
                          <input
                            type="text"
                            value={proformaInvestigations}
                            onChange={(e) => setProformaInvestigations(e.target.value)}
                            placeholder="e.g. Day 2 Baseline TVS, Serum AMH, TSH, Fasting Insulin"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Plan of Management & Counseling Notes</label>
                        <textarea
                          rows={3}
                          value={proformaPlan}
                          onChange={(e) => setProformaPlan(e.target.value)}
                          placeholder="e.g. Weight management lifestyle counseling. Start Ovulation Induction with Letrozole on Day 2 of next cycle. Plan IUI."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. PURPOSE: ULTRASOUND SCANS & FOLLICULAR TRACKING */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'scans' && (
                  <div className="space-y-4">
                    <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Activity className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-sky-950">Ultrasound & Follicular Scan Schema</h4>
                          <p className="text-[11px] text-sky-700">Configure sonographic pelvic organ metrics, follicle tracking, and endometrial patterns</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-semibold text-slate-600">Scan Modality:</label>
                        <select
                          value={scanType}
                          onChange={(e) => setScanType(e.target.value)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-medium focus:ring-1 focus:ring-primary"
                        >
                          <option value="Transvaginal Sonography (TVS)">Transvaginal Sonography (TVS)</option>
                          <option value="Follicular Tracking Study">Follicular Tracking Study</option>
                          <option value="Transabdominal Pelvic USG (TAS)">Transabdominal Pelvic USG (TAS)</option>
                          <option value="Early Pregnancy Viability USG">Early Pregnancy Viability USG</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Endometrium (Thickness & Echogenicity)</label>
                        <input
                          type="text"
                          value={scanEndometrium}
                          onChange={(e) => setScanEndometrium(e.target.value)}
                          placeholder="e.g. 8.2mm, Trilaminar Triple-Line, Homogeneous"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Pouch of Douglas (POD) Fluid</label>
                        <input
                          type="text"
                          value={scanPod}
                          onChange={(e) => setScanPod(e.target.value)}
                          placeholder="e.g. Clear / No free fluid in cul-de-sac"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Right Ovary (AFC & Dominant Follicle)</label>
                        <input
                          type="text"
                          value={scanRightOvary}
                          onChange={(e) => setScanRightOvary(e.target.value)}
                          placeholder="e.g. AFC: 8 | Dominant Follicle: 18.5mm x 17.0mm"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Left Ovary (AFC & Secondary Follicles)</label>
                        <input
                          type="text"
                          value={scanLeftOvary}
                          onChange={(e) => setScanLeftOvary(e.target.value)}
                          placeholder="e.g. AFC: 7 | Leading Follicle: 12.0mm"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block font-semibold text-slate-700 mb-1">Sonographer Impression / Summary Findings</label>
                      <textarea
                        rows={3}
                        value={scanImpression}
                        onChange={(e) => setScanImpression(e.target.value)}
                        placeholder="e.g. Day 11 Follicular Study reveals mature pre-ovulatory dominant follicle in Right Ovary with receptive trilaminar endometrium. Advise trigger when > 18mm."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 5. PURPOSE: APPOINTMENT VISIT TYPES */}
                {!builderGenericMode && getTemplatePurpose(selectedTemplate) === 'visit_types' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-amber-950">Appointment Visit Type & Resource Schema</h4>
                          <p className="text-[11px] text-amber-700">Configure appointment calendar slot durations, rooms, and patient prep</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Slot Duration (Minutes) *</label>
                        <select
                          value={visitDurationMinutes}
                          onChange={(e) => setVisitDurationMinutes(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary font-semibold"
                        >
                          <option value={15}>15 Minutes (Brief Follow-up / Scan Review)</option>
                          <option value={20}>20 Minutes (Standard Review)</option>
                          <option value={30}>30 Minutes (Couple Consultation / Evaluation)</option>
                          <option value={45}>45 Minutes (Comprehensive ART Counseling)</option>
                          <option value={60}>60 Minutes (Primary Infertility Workup / Pre-Op)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Consultation Modality / Service Category</label>
                        <input
                          type="text"
                          value={visitConsultationType}
                          onChange={(e) => setVisitConsultationType(e.target.value)}
                          placeholder="e.g. In-Person Couple Consultation / Video Teleconsult"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Allocated Clinical Room / Resource</label>
                        <select
                          value={visitRoom}
                          onChange={(e) => setVisitRoom(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary"
                        >
                          <option value="Consultation Room 1">Consultation Room 1 (Senior Consultant)</option>
                          <option value="Consultation Room 2">Consultation Room 2 (Junior Consultant)</option>
                          <option value="Ultrasound TVS Suite A">Ultrasound TVS Suite A</option>
                          <option value="IVF Cleanroom Procedure OT">IVF Cleanroom Procedure OT (OPU / ET)</option>
                          <option value="Andrology Semen Collection Suite">Andrology Semen Collection Suite</option>
                          <option value="Counseling Room B">Counseling Room B</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Linked Tariff Code (Service Catalog)</label>
                        <input
                          type="text"
                          value={visitTariffCode}
                          onChange={(e) => setVisitTariffCode(e.target.value)}
                          placeholder="e.g. OPD-CONS-01"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="text-xs">
                      <label className="block font-semibold text-slate-700 mb-1">Pre-Appointment Instructions for Patient (Included in SMS/WhatsApp)</label>
                      <textarea
                        rows={3}
                        value={visitInstructions}
                        onChange={(e) => setVisitInstructions(e.target.value)}
                        placeholder="e.g. Please bring all previous investigation reports, semen analysis, and surgical discharge summaries. Arrive 15 minutes before slot."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 6. GENERIC FIELD BUILDER (When toggled or for custom schemas) */}
                {builderGenericMode && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="text-xs font-bold text-slate-700">
                        Dynamic Schema Fields ({activeTemplateFields.length})
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('consultation', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Proforma
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('ultrasound', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: USG Scan
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('order_set', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Order Set
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('rx', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Rx
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplatePreset('visit_type', 'active')}
                          className="text-[11px] px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-slate-600 font-medium"
                        >
                          + Preset: Visit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = [
                              ...activeTemplateFields,
                              { id: `field_${activeTemplateFields.length + 1}`, label: '', type: 'text', placeholder: '', required: false }
                            ];
                            handleActiveFieldsChange(next);
                          }}
                          className="text-[11px] px-2.5 py-1 bg-primary text-white rounded font-semibold hover:bg-primary-mid flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Field
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {activeTemplateFields.map((fld, fIdx) => (
                        <div key={fIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              #{fIdx + 1} · {fld.id || `field_${fIdx + 1}`}
                            </span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!fld.required}
                                  onChange={(e) => {
                                    const next = [...activeTemplateFields];
                                    next[fIdx] = { ...next[fIdx], required: e.target.checked };
                                    handleActiveFieldsChange(next);
                                  }}
                                  className="accent-primary rounded"
                                />
                                Required
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const next = activeTemplateFields.filter((_, i) => i !== fIdx);
                                  handleActiveFieldsChange(next);
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Field Label</label>
                              <input
                                type="text"
                                value={fld.label}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], label: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                placeholder="e.g. Endometrial Thickness (mm)"
                                className="vmd-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Input Type</label>
                              <select
                                value={fld.type}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], type: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                className="vmd-input text-xs"
                              >
                                <option value="text">Text Line</option>
                                <option value="textarea">Textarea (Multi-line)</option>
                                <option value="number">Number</option>
                                <option value="select">Dropdown Select</option>
                                <option value="checkbox_group">Checkbox Multi-Select</option>
                                <option value="date">Date Picker</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Placeholder / Helper Text</label>
                              <input
                                type="text"
                                value={fld.placeholder || ''}
                                onChange={(e) => {
                                  const next = [...activeTemplateFields];
                                  next[fIdx] = { ...next[fIdx], placeholder: e.target.value };
                                  handleActiveFieldsChange(next);
                                }}
                                placeholder="Optional placeholder..."
                                className="vmd-input text-xs"
                              />
                            </div>
                            {['select', 'checkbox_group'].includes(fld.type) && (
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Options (comma-separated)</label>
                                <input
                                  type="text"
                                  value={fld.options || ''}
                                  onChange={(e) => {
                                    const next = [...activeTemplateFields];
                                    next[fIdx] = { ...next[fIdx], options: e.target.value };
                                    handleActiveFieldsChange(next);
                                  }}
                                  placeholder="e.g. Triple Line, Homogeneous, Hyperechoic"
                                  className="vmd-input text-xs"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {activeTemplateFields.length === 0 && (
                        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs">
                          No visual fields defined yet. Click "+ Add Field" or choose a quick preset above.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* In Raw JSON mode */}
            {templateViewMode === 'json' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Edit raw JSON schema structure</span>
                  {templateJsonError ? (
                    <span className="text-rose-600 font-semibold">⚠ {templateJsonError}</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">✓ Valid JSON Schema</span>
                  )}
                </div>
                <textarea
                  rows={18}
                  value={templateJsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full font-mono text-xs p-3 border border-slate-200 rounded-lg bg-slate-900 text-slate-100"
                />
              </div>
            )}

            {/* In Live Preview mode */}
            {templateViewMode === 'preview' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                  <span className="text-slate-600 font-medium">Interactive EMR Simulation (Doctor View)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Preview as Role:</span>
                    <select
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold"
                    >
                      <option value="doctor">Doctor / Consultant</option>
                      <option value="nurse">Nurse</option>
                      <option value="embryologist">Embryologist</option>
                      <option value="admin">Administrator</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                  </div>
                </div>

                {/* Purpose 1 Preview: Prescription Slip */}
                {getTemplatePurpose(selectedTemplate) === 'rx' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-4 font-sans text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-2xl font-serif font-bold text-indigo-700">℞</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Prescription Protocol'}</h4>
                        <p className="text-[11px] text-slate-500">{templateDesc || 'Outpatient Medication Regimen'}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                        {rxCategory}
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="p-2.5">Medication & Strength</th>
                            <th className="p-2.5">Dosage</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5">Duration</th>
                            <th className="p-2.5">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rxMedications.filter((m) => m.drug_name).length > 0 ? (
                            rxMedications
                              .filter((m) => m.drug_name)
                              .map((m, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold text-slate-800 flex items-center gap-1.5">
                                    <Pill className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span>{m.drug_name}</span>
                                  </td>
                                  <td className="p-2.5 text-slate-700">{m.dose || '—'}</td>
                                  <td className="p-2.5">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[11px] border border-indigo-100">
                                      {m.frequency}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-slate-700">{m.duration || '—'}</td>
                                  <td className="p-2.5 text-slate-500 italic">{m.instructions || 'As directed'}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400">
                                No medication rows defined in this Rx template yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {rxAdvice && (
                      <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5 space-y-1">
                        <span className="font-bold text-amber-900 text-xs block">Patient & Clinical Advice:</span>
                        <p className="text-amber-800 text-xs whitespace-pre-wrap">{rxAdvice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 2 Preview: Smart Order Set Sheet */}
                {getTemplatePurpose(selectedTemplate) === 'order_sets' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-4 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 tracking-wider uppercase">OPD Order Set</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Order Set'}</h4>
                        <p className="text-[11px] text-slate-500">{templateDesc}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {orderCategory}
                      </span>
                    </div>

                    {/* Investigations Badges */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-800 block text-xs">Requisitioned Investigations:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {orderInvestigations.split(',').map((inv, idx) => {
                          const trimmed = inv.trim();
                          if (!trimmed) return null;
                          return (
                            <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                              <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                              {trimmed}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {orderMedications.filter((m) => m.drug_name).length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-800 block text-xs">Companion Protocol Medications:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {orderMedications
                            .filter((m) => m.drug_name)
                            .map((m, idx) => (
                              <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-slate-800 block">{m.drug_name}</span>
                                  <span className="text-[11px] text-slate-500">{m.dose} · {m.frequency} · {m.duration}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 italic max-w-[120px] text-right truncate">
                                  {m.instructions}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {orderInstructions && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px]">Nursing & Preparation Notes:</span>
                        <p className="text-xs whitespace-pre-wrap">{orderInstructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 3 Preview: Consultation Proforma */}
                {getTemplatePurpose(selectedTemplate) === 'proformas' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">EMR Consultation Workup</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Consultation Proforma'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        Proforma
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Chief Complaints & Onset</span>
                        <p className="text-slate-800 font-medium">{proformaComplaint || '—'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">History of Presenting Illness (HOPI)</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{proformaHopi || '—'}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                          <span className="font-bold text-blue-900 block text-[11px] uppercase tracking-wide">Provisional Diagnosis</span>
                          <p className="text-blue-950 font-bold">{proformaDiagnosis || '—'}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wide">Planned Investigations</span>
                          <p className="text-slate-800">{proformaInvestigations || '—'}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                        <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wide">Treatment Plan & Counseling</span>
                        <p className="text-emerald-950 leading-relaxed whitespace-pre-wrap">{proformaPlan || '—'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Purpose 4 Preview: Ultrasound Scan Worksheet */}
                {getTemplatePurpose(selectedTemplate) === 'scans' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-sky-600 tracking-wider uppercase">Sonography Imaging Worksheet</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Ultrasound Scan'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded">
                        {scanType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Endometrium</span>
                        <p className="text-slate-900 font-semibold">{scanEndometrium || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Pouch of Douglas (POD)</span>
                        <p className="text-slate-900 font-semibold">{scanPod || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Right Ovary Metrics</span>
                        <p className="text-slate-900 font-semibold">{scanRightOvary || '—'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Left Ovary Metrics</span>
                        <p className="text-slate-900 font-semibold">{scanLeftOvary || '—'}</p>
                      </div>
                    </div>

                    {scanImpression && (
                      <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-1">
                        <span className="font-bold text-sky-950 block text-[11px] uppercase tracking-wide">Sonographic Impression</span>
                        <p className="text-sky-900 leading-relaxed whitespace-pre-wrap">{scanImpression}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Purpose 5 Preview: Appointment Visit Type */}
                {getTemplatePurpose(selectedTemplate) === 'visit_types' && (
                  <div className="border border-slate-200 rounded-2xl bg-white p-5 shadow-xs space-y-3.5 text-xs">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 tracking-wider uppercase">Appointment Slot Booking</span>
                        <h4 className="font-bold text-slate-900 text-sm">{templateTitle || 'Visit Type'}</h4>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {visitDurationMinutes} Mins
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Consultation Modality</span>
                        <p className="text-slate-900 font-semibold">{visitConsultationType}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-500 block text-[10px] uppercase">Allocated Room / Resource</span>
                        <p className="text-slate-900 font-semibold">{visitRoom}</p>
                      </div>
                    </div>

                    {visitTariffCode && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Billing Tariff Code:</span>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{visitTariffCode}</span>
                      </div>
                    )}

                    {visitInstructions && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-1 text-amber-900">
                        <span className="font-bold block text-[11px]">Patient Booking Guidelines (SMS/WhatsApp Preview):</span>
                        <p className="text-xs whitespace-pre-wrap">{visitInstructions}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback to DynamicForm if user is in generic schema mode or has custom field array */}
                {(builderGenericMode || Array.isArray(parsedSchema)) && (
                  <DynamicForm
                    key={`${selectedTemplate?.id || 'none'}-${previewRole}-${templateJsonText.length}`}
                    schema={parsedSchema}
                    userRole={previewRole}
                    onSave={async () => { alert('Form submitted in preview mode!'); }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ClinicalTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        initialPurpose={templatePurposeTab === 'all' ? 'proformas' : templatePurposeTab}
        onSuccess={(created) => {
          setShowNewTemplateModal(false);
          templatesApi.list().then((res: any) => {
            const list = Array.isArray(res) ? res : res?.templates || [];
            setClinicalTemplates(list);
            const found = list.find((t: any) => t.id === created?.id || t.title === created?.title);
            if (found) handleSelectTemplate(found);
          });
        }}
      />
    </>
  );
}
