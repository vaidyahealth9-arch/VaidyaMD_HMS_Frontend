'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { opdApi } from '@/features/opd/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/contexts/ToastContext';
import {
  FileText,
  Pill,
  Plus,
  Trash2,
  Edit3,
  Search,
  Save,
  X,
  Sparkles,
  Check,
  ChevronRight,
  Stethoscope,
  Info,
  Layers,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';

export interface ClinicalTemplateItem {
  id: string;
  name: string;
  isCustom?: boolean;
  complaint: string;
  hopi: string;
  diagnosis: string;
  investigations: string;
  plan: string;
}

export interface RxMedicationItem {
  drug_name: string;
  dose: string;
  frequency: string;
  duration?: string;
  instructions: string;
}

export interface RxTemplateItem {
  id: string;
  name: string;
  isCustom?: boolean;
  category: string;
  medications: RxMedicationItem[];
  advice?: string;
}

interface TemplateManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'clinical' | 'rx';
  onApplyClinicalTemplate?: (tmpl: ClinicalTemplateItem) => void;
  onApplyRxTemplate?: (tmpl: RxTemplateItem) => void;
  initialClinicalTemplates: ClinicalTemplateItem[];
  initialRxTemplates: RxTemplateItem[];
  onTemplatesUpdated?: () => void;
}

export default function TemplateManagementDialog({
  open,
  onOpenChange,
  defaultTab = 'clinical',
  onApplyClinicalTemplate,
  onApplyRxTemplate,
  initialClinicalTemplates,
  initialRxTemplates,
  onTemplatesUpdated,
}: TemplateManagementDialogProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'clinical' | 'rx'>(defaultTab);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Search & Selection
  const [search, setSearch] = useState('');
  const [selectedClinicalId, setSelectedClinicalId] = useState<string>('');
  const [selectedRxId, setSelectedRxId] = useState<string>('');

  // Editing / Creating State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Custom Templates from DB
  const [customClinical, setCustomClinical] = useState<ClinicalTemplateItem[]>([]);
  const [customRx, setCustomRx] = useState<RxTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Clinical Form Fields
  const [clinicalName, setClinicalName] = useState('');
  const [clinicalComplaint, setClinicalComplaint] = useState('');
  const [clinicalHopi, setClinicalHopi] = useState('');
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState('');
  const [clinicalInvestigations, setClinicalInvestigations] = useState('');
  const [clinicalPlan, setClinicalPlan] = useState('');

  // Rx Form Fields
  const [rxName, setRxName] = useState('');
  const [rxCategory, setRxCategory] = useState('Stimulation / OI');
  const [rxMedications, setRxMedications] = useState<RxMedicationItem[]>([
    { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' },
  ]);
  const [rxAdvice, setRxAdvice] = useState('');

  const fetchCustomTemplates = async () => {
    setIsLoading(true);
    try {
      const [clinicalRes, rxRes] = await Promise.allSettled([
        opdApi.getTemplates('clinical_template'),
        opdApi.getTemplates('rx_template'),
      ]);

      if (clinicalRes.status === 'fulfilled' && Array.isArray(clinicalRes.value)) {
        setCustomClinical(
          clinicalRes.value.map((t: any) => ({
            id: t.id,
            name: t.title,
            isCustom: true,
            complaint: t.schema_json?.complaint || '',
            hopi: t.schema_json?.hopi || '',
            diagnosis: t.schema_json?.diagnosis || '',
            investigations: t.schema_json?.investigations || '',
            plan: t.schema_json?.plan || '',
          }))
        );
      }

      if (rxRes.status === 'fulfilled' && Array.isArray(rxRes.value)) {
        setCustomRx(
          rxRes.value.map((t: any) => ({
            id: t.id,
            name: t.title,
            isCustom: true,
            category: t.schema_json?.category || 'General',
            medications: t.schema_json?.medications || [],
            advice: t.schema_json?.advice || '',
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch custom templates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCustomTemplates();
    }
  }, [open]);

  // Combined lists
  const allClinicalTemplates = [...initialClinicalTemplates, ...customClinical];
  const allRxTemplates = [...initialRxTemplates, ...customRx];

  // Auto-select first item if none selected
  useEffect(() => {
    if (allClinicalTemplates.length > 0 && !selectedClinicalId) {
      setSelectedClinicalId(allClinicalTemplates[0].id);
    }
  }, [allClinicalTemplates, selectedClinicalId]);

  useEffect(() => {
    if (allRxTemplates.length > 0 && !selectedRxId) {
      setSelectedRxId(allRxTemplates[0].id);
    }
  }, [allRxTemplates, selectedRxId]);

  // Filtered lists
  const filteredClinical = allClinicalTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.complaint.toLowerCase().includes(search.toLowerCase()) ||
      t.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRx = allRxTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.medications.some((m) => m.drug_name.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedClinical = allClinicalTemplates.find((t) => t.id === selectedClinicalId);
  const selectedRx = allRxTemplates.find((t) => t.id === selectedRxId);

  // Form Reset
  const resetForm = () => {
    setEditingId(null);
    setIsFormOpen(false);
    setClinicalName('');
    setClinicalComplaint('');
    setClinicalHopi('');
    setClinicalDiagnosis('');
    setClinicalInvestigations('');
    setClinicalPlan('');
    setRxName('');
    setRxCategory('Stimulation / OI');
    setRxMedications([{ drug_name: '', dose: '', frequency: 'OD', instructions: '' }]);
    setRxAdvice('');
  };

  // Open Create Form
  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEditClinical = (tmpl: ClinicalTemplateItem) => {
    setEditingId(tmpl.id);
    setClinicalName(tmpl.name);
    setClinicalComplaint(tmpl.complaint);
    setClinicalHopi(tmpl.hopi);
    setClinicalDiagnosis(tmpl.diagnosis);
    setClinicalInvestigations(tmpl.investigations);
    setClinicalPlan(tmpl.plan);
    setIsFormOpen(true);
  };

  const handleOpenEditRx = (tmpl: RxTemplateItem) => {
    setEditingId(tmpl.id);
    setRxName(tmpl.name);
    setRxCategory(tmpl.category);
    setRxMedications(
      tmpl.medications.length > 0
        ? [...tmpl.medications]
        : [{ drug_name: '', dose: '', frequency: 'OD', instructions: '' }]
    );
    setRxAdvice(tmpl.advice || '');
    setIsFormOpen(true);
  };

  // Save Clinical Template
  const handleSaveClinical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalName.trim()) {
      toast.error('Validation Error', 'Template name is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: clinicalName.trim(),
        record_type: `clinical_${Date.now()}_${clinicalName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`,
        plugin_id: 'clinical_template',
        created_by: user?.id,
        schema_json: {
          complaint: clinicalComplaint,
          hopi: clinicalHopi,
          diagnosis: clinicalDiagnosis,
          investigations: clinicalInvestigations,
          plan: clinicalPlan,
        },
      };

      if (editingId && customClinical.some((c) => c.id === editingId)) {
        await opdApi.updateTemplate(editingId, {
          title: clinicalName.trim(),
          schema_json: payload.schema_json,
        });
        toast.success('Template Updated', `Clinical template "${clinicalName}" saved.`);
      } else {
        const res = await opdApi.createTemplate(payload);
        toast.success('Template Created', `New clinical template "${clinicalName}" created.`);
        if (res?.id) setSelectedClinicalId(res.id);
      }

      await fetchCustomTemplates();
      if (onTemplatesUpdated) onTemplatesUpdated();
      resetForm();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save clinical template');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Rx Template
  const handleSaveRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxName.trim()) {
      toast.error('Validation Error', 'Prescription template name is required');
      return;
    }

    const validMeds = rxMedications.filter((m) => m.drug_name.trim().length > 0);
    if (validMeds.length === 0) {
      toast.error('Validation Error', 'Please enter at least one medication in the template');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: rxName.trim(),
        record_type: `rx_${Date.now()}_${rxName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}`,
        plugin_id: 'rx_template',
        created_by: user?.id,
        schema_json: {
          category: rxCategory,
          medications: validMeds,
          advice: rxAdvice,
        },
      };

      if (editingId && customRx.some((c) => c.id === editingId)) {
        await opdApi.updateTemplate(editingId, {
          title: rxName.trim(),
          schema_json: payload.schema_json,
        });
        toast.success('Template Updated', `Prescription template "${rxName}" saved.`);
      } else {
        const res = await opdApi.createTemplate(payload);
        toast.success('Template Created', `New prescription template "${rxName}" created.`);
        if (res?.id) setSelectedRxId(res.id);
      }

      await fetchCustomTemplates();
      if (onTemplatesUpdated) onTemplatesUpdated();
      resetForm();
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Failed to save prescription template');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Custom Template
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the template "${name}"?`)) return;

    try {
      await opdApi.deleteTemplate(id);
      toast.success('Template Deleted', `Template "${name}" has been removed.`);
      await fetchCustomTemplates();
      if (onTemplatesUpdated) onTemplatesUpdated();
    } catch (err: any) {
      toast.error('Delete Failed', err.message || 'Failed to delete template');
    }
  };

  // Add/remove medication rows
  const handleAddMedRow = () => {
    setRxMedications((prev) => [
      ...prev,
      { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveMedRow = (idx: number) => {
    setRxMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx: number, field: keyof RxMedicationItem, val: string) => {
    setRxMedications((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-white rounded-xl shadow-2xl border border-slate-200">
        <DialogTitle className="sr-only">Clinical &amp; Prescription Template Management</DialogTitle>

        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgb(var(--clr-primary))] text-white flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">OPD Template Management Studio</h2>
              <p className="text-xs text-slate-400">
                Customise clinical notes, diagnostic regimens, and prescription templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('clinical');
                  setIsFormOpen(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'clinical'
                    ? 'bg-[rgb(var(--clr-primary))] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Clinical Notes ({allClinicalTemplates.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('rx');
                  setIsFormOpen(false);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'rx'
                    ? 'bg-[rgb(var(--clr-primary))] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                <span>Prescription Rx ({allRxTemplates.length})</span>
              </button>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Body: Split View (List + Editor/Preview) */}
        <div className="flex h-[620px] overflow-hidden bg-slate-50">
          {/* Left Column: Template List */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col flex-shrink-0">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/70">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab === 'clinical' ? 'clinical' : 'Rx'} templates...`}
                  className="pl-8 h-8 text-xs bg-white"
                />
              </div>
              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-8 px-2.5 text-xs font-bold bg-[rgb(var(--clr-primary))] text-white gap-1"
                title="Create New Template"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {activeTab === 'clinical' ? (
                filteredClinical.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">No clinical templates found.</p>
                ) : (
                  filteredClinical.map((tmpl) => {
                    const isSelected = selectedClinicalId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedClinicalId(tmpl.id);
                          setIsFormOpen(false);
                        }}
                        className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/40'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{tmpl.name}</h4>
                          {tmpl.isCustom ? (
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded flex-shrink-0">
                              Custom
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded flex-shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          Dx: {tmpl.diagnosis || tmpl.complaint || '—'}
                        </p>
                      </div>
                    );
                  })
                )
              ) : filteredRx.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">No prescription templates found.</p>
              ) : (
                filteredRx.map((tmpl) => {
                  const isSelected = selectedRxId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => {
                        setSelectedRxId(tmpl.id);
                        setIsFormOpen(false);
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-400'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1">{tmpl.name}</h4>
                        {tmpl.isCustom ? (
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded flex-shrink-0">
                            Custom
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded flex-shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {tmpl.category}
                        </span>
                        <span>{tmpl.medications?.length || 0} drugs</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Preview OR Form Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {isFormOpen ? (
              /* ================== FORM EDITOR ================== */
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {editingId ? `Edit ${activeTab === 'clinical' ? 'Clinical' : 'Rx'} Template` : `Create New ${activeTab === 'clinical' ? 'Clinical' : 'Rx'} Template`}
                    </h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 text-xs text-slate-500">
                    Cancel
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'clinical' ? (
                    /* Clinical Template Form */
                    <form id="clinicalForm" onSubmit={handleSaveClinical} className="space-y-4 max-w-2xl text-xs">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Template Title / Protocol Name *
                        </label>
                        <Input
                          value={clinicalName}
                          onChange={(e) => setClinicalName(e.target.value)}
                          placeholder="e.g. Endometriosis Workup & Staging"
                          required
                          className="text-xs font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Chief Complaints</label>
                          <textarea
                            value={clinicalComplaint}
                            onChange={(e) => setClinicalComplaint(e.target.value)}
                            rows={3}
                            placeholder="Primary symptoms..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">History of Present Illness (HOPI)</label>
                          <textarea
                            value={clinicalHopi}
                            onChange={(e) => setClinicalHopi(e.target.value)}
                            rows={3}
                            placeholder="Clinical duration, evolution..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Provisional Diagnosis</label>
                        <Input
                          value={clinicalDiagnosis}
                          onChange={(e) => setClinicalDiagnosis(e.target.value)}
                          placeholder="Provisional or differential diagnosis..."
                          className="text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Investigations</label>
                        <textarea
                          value={clinicalInvestigations}
                          onChange={(e) => setClinicalInvestigations(e.target.value)}
                          rows={3}
                          placeholder="Investigations, scans, imaging (one per line)..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Treatment Plan &amp; Notes</label>
                        <textarea
                          value={clinicalPlan}
                          onChange={(e) => setClinicalPlan(e.target.value)}
                          rows={3}
                          placeholder="Management roadmap, lifestyle advice, next review..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </form>
                  ) : (
                    /* Rx Template Form */
                    <form id="rxForm" onSubmit={handleSaveRx} className="space-y-4 max-w-3xl text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Rx Template Name *</label>
                          <Input
                            value={rxName}
                            onChange={(e) => setRxName(e.target.value)}
                            placeholder="e.g. Endometrial Priming FET Protocol"
                            required
                            className="text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                          <select
                            value={rxCategory}
                            onChange={(e) => setRxCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                          >
                            <option value="Stimulation / OI">Stimulation / Ovulation Induction</option>
                            <option value="PCOS Protocol">PCOS Protocol</option>
                            <option value="Luteal Support">Luteal Support</option>
                            <option value="Post-OPU Recovery">Post-OPU Recovery</option>
                            <option value="Endometrial Prep (FET)">Endometrial Prep (FET)</option>
                            <option value="General OPD / ANC">General OPD / ANC</option>
                          </select>
                        </div>
                      </div>

                      {/* Medications Table */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-700">
                            Prescription Medications ({rxMedications.length}) *
                          </label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAddMedRow}
                            className="h-7 text-xs font-bold text-primary border-primary/20 hover:bg-primary/10 gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Drug</span>
                          </Button>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                              <tr>
                                <th className="p-2.5">Drug / Medicine Name</th>
                                <th className="p-2.5 w-24">Dosage</th>
                                <th className="p-2.5 w-28">Frequency</th>
                                <th className="p-2.5 w-24">Duration</th>
                                <th className="p-2.5">Instructions</th>
                                <th className="p-2.5 w-10 text-center"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {rxMedications.map((m, idx) => (
                                <tr key={idx}>
                                  <td className="p-2">
                                    <Input
                                      value={m.drug_name}
                                      onChange={(e) => handleMedChange(idx, 'drug_name', e.target.value)}
                                      placeholder="e.g. Tab Estradiol Valerate 2mg"
                                      className="h-8 text-xs font-medium"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={m.dose}
                                      onChange={(e) => handleMedChange(idx, 'dose', e.target.value)}
                                      placeholder="1 tab"
                                      className="h-8 text-xs"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={m.frequency}
                                      onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-800"
                                    >
                                      <option value="OD">OD (Once)</option>
                                      <option value="BD">BD (Twice)</option>
                                      <option value="TDS">TDS (Thrice)</option>
                                      <option value="QID">QID (4 times)</option>
                                      <option value="SOS">SOS (As needed)</option>
                                      <option value="Weekly">Weekly</option>
                                      <option value="Alternate Days">Alt Days</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={m.duration || ''}
                                      onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                                      placeholder="e.g. 5 days"
                                      className="h-8 text-xs"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      value={m.instructions}
                                      onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                                      placeholder="After breakfast"
                                      className="h-8 text-xs"
                                    />
                                  </td>
                                  <td className="p-2 text-center">
                                    {rxMedications.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMedRow(idx)}
                                        className="text-slate-400 hover:text-rose-600 p-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">General Advice &amp; Follow-up</label>
                        <textarea
                          value={rxAdvice}
                          onChange={(e) => setRxAdvice(e.target.value)}
                          rows={2}
                          placeholder="e.g. Maintain hydration, report on Day 10 for TVS scan..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </form>
                  )}
                </div>

                {/* Form Footer */}
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form={activeTab === 'clinical' ? 'clinicalForm' : 'rxForm'}
                    disabled={isSaving}
                    className="h-8 text-xs font-bold bg-[rgb(var(--clr-primary))] text-white gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving Template...' : 'Save Template'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              /* ================== PREVIEW DETAILS ================== */
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'clinical' && selectedClinical ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            Clinical Protocol
                          </span>
                          {selectedClinical.isCustom ? (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200">
                              Custom Template
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-slate-100 text-slate-600 border-slate-200">
                              Built-in Protocol
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug break-words">
                          {selectedClinical.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Clinical Outpatient Consultation Template &amp; Documentation Set
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {selectedClinical.isCustom ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditClinical(selectedClinical)}
                              className="h-8.5 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(selectedClinical.id, selectedClinical.name)}
                              className="h-8.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 gap-1.5 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Duplicate as custom
                              setEditingId(null);
                              setClinicalName(`${selectedClinical.name} (Custom)`);
                              setClinicalComplaint(selectedClinical.complaint);
                              setClinicalHopi(selectedClinical.hopi);
                              setClinicalDiagnosis(selectedClinical.diagnosis);
                              setClinicalInvestigations(selectedClinical.investigations);
                              setClinicalPlan(selectedClinical.plan);
                              setIsFormOpen(true);
                            }}
                            className="h-8.5 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Copy &amp; Customize</span>
                          </Button>
                        )}

                        {onApplyClinicalTemplate && (
                          <Button
                            size="sm"
                            onClick={() => {
                              onApplyClinicalTemplate(selectedClinical);
                              onOpenChange(false);
                            }}
                            className="h-8.5 text-xs font-semibold bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Apply to Workbench</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Chief Complaints
                          </span>
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">
                            {selectedClinical.complaint || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            History of Present Illness (HOPI)
                          </span>
                          <p className="text-xs text-slate-700 mt-0.5 whitespace-pre-line">
                            {selectedClinical.hopi || '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Provisional Diagnosis
                          </span>
                          <p className="text-xs font-bold text-primary mt-0.5">
                            {selectedClinical.diagnosis || '—'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1.5">
                            Investigations
                          </span>
                          <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                            {selectedClinical.investigations || 'None specified'}
                          </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1.5">
                            Plan &amp; Management Notes
                          </span>
                          <p className="text-xs text-slate-800 whitespace-pre-line font-medium leading-relaxed">
                            {selectedClinical.plan || 'None specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'rx' && selectedRx ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-300">
                            {selectedRx.category}
                          </Badge>
                          {selectedRx.isCustom ? (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200">
                              Custom Rx Regimen
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] font-semibold bg-slate-100 text-slate-600 border-slate-200">
                              Default Regimen
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug break-words">
                          {selectedRx.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Structured Outpatient Prescription Regimen &amp; Dosing Guidelines
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        {selectedRx.isCustom ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditRx(selectedRx)}
                              className="h-8.5 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-2xs"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(selectedRx.id, selectedRx.name)}
                              className="h-8.5 text-xs font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 gap-1.5 shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Duplicate as custom
                              setEditingId(null);
                              setRxName(`${selectedRx.name} (Custom)`);
                              setRxCategory(selectedRx.category);
                              setRxMedications([...selectedRx.medications]);
                              setRxAdvice(selectedRx.advice || '');
                              setIsFormOpen(true);
                            }}
                            className="h-8.5 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Copy &amp; Customize</span>
                          </Button>
                        )}

                        {onApplyRxTemplate && (
                          <Button
                            size="sm"
                            onClick={() => {
                              onApplyRxTemplate(selectedRx);
                              onOpenChange(false);
                            }}
                            className="h-8.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Apply to Prescription</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {/* Medications Table */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="p-3">#</th>
                              <th className="p-3">Medication / Drug Name</th>
                              <th className="p-3">Dose</th>
                              <th className="p-3">Frequency</th>
                              <th className="p-3">Duration</th>
                              <th className="p-3">Instructions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {selectedRx.medications.map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="p-3 font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                                <td className="p-3 font-bold text-slate-900">{m.drug_name}</td>
                                <td className="p-3 font-semibold text-slate-700">{m.dose}</td>
                                <td className="p-3 font-semibold text-emerald-700">
                                  <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                                    {m.frequency}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 font-medium">{m.duration || '—'}</td>
                                <td className="p-3 text-slate-600">{m.instructions}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {selectedRx.advice && (
                        <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg">
                          <span className="text-[10px] uppercase font-bold text-amber-800 block tracking-wider mb-1">
                            General Advice &amp; Instructions
                          </span>
                          <p className="text-xs text-amber-950 font-medium whitespace-pre-line leading-relaxed">
                            {selectedRx.advice}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
                    Select a template from the list or click "New" to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
