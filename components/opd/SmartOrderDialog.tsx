'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { opdApi } from '@/lib/api';
import { 
  Sparkles, 
  Plus, 
  FlaskConical, 
  Pill, 
  Save, 
  Edit3, 
  Trash2, 
  Search, 
  ArrowRight, 
  Info, 
  AlertTriangle, 
  X,
  Check,
  FolderOpen
} from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface SmartOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOrderSet: (orderSet: any) => void;
}

const COMMON_CATEGORIES = [
  'General Medicine',
  'Obstetrics & Gynecology',
  'Fertility / IVF',
  'Cardiology',
  'Pediatrics',
  'Endocrinology',
];

const BUILT_IN_ORDER_SETS = [
  {
    id: 'builtin_pcos_initial',
    name: 'PCOS Initial Evaluation Bundle',
    category: 'Endocrinology & Infertility',
    isBuiltin: true,
    investigations: [
      'Serum FSH & LH (Day 2-3)',
      'Serum Total Testosterone & DHEAS',
      'Fasting Insulin & Glucose (HOMA-IR)',
      'Oral Glucose Tolerance Test (75g OGTT)',
      'Serum TSH & Prolactin',
      'Pelvic Ultrasound (Ovarian Follicle Count / AFC)',
    ],
    medications: [
      { drug_name: 'Tab Metformin 500mg', dose: '1 tab', frequency: 'BD', duration: '30 days', instructions: 'With meals' },
      { drug_name: 'Tab Myo-Inositol & D-Chiro Inositol (2000mg/50mg)', dose: '1 sachet', frequency: 'BD', duration: '30 days', instructions: 'In water after food' },
      { drug_name: 'Tab Methylcobalamin + L-Methylfolate', dose: '1 tab', frequency: 'OD', duration: '30 days', instructions: 'After breakfast' },
    ],
    instructions: 'Dietary carb restriction, 30 min daily aerobic exercise. Repeat fasting labs in 6 weeks.',
  },
  {
    id: 'builtin_anc_booking',
    name: 'Antenatal Booking & 1st Trimester Screen',
    category: 'Obstetrics & Gynecology',
    isBuiltin: true,
    investigations: [
      'Complete Blood Count (CBC) with Platelets',
      'Blood Grouping & Rh Typing',
      'HbA1c & Fasting Blood Sugar',
      'Serum TSH (First Trimester Target)',
      'Infectious Disease Panel: HIV 1 & 2, HBsAg, HCV, VDRL/RPR',
      'Rubella IgG & Varicella IgG',
      'Urine Routine & Microscopic Examination',
      'First Trimester Scan (NT / NB Ultrasound at 11-13.6 weeks)',
    ],
    medications: [
      { drug_name: 'Tab Folic Acid 5mg', dose: '1 tab', frequency: 'OD', duration: '90 days', instructions: 'Morning after food' },
      { drug_name: 'Tab Doxylamine Succinate + Pyridoxine 10mg/10mg', dose: '1-2 tabs', frequency: 'HS', duration: '14 days', instructions: 'At bedtime for nausea' },
    ],
    instructions: 'Adequate hydration. Report immediate warning signs (vaginal bleeding, severe cramping).',
  },
  {
    id: 'builtin_infertility_workup',
    name: 'Unexplained Infertility Couple Workup',
    category: 'Fertility / IVF',
    isBuiltin: true,
    investigations: [
      'Comprehensive Semen Analysis (WHO 2021 criteria)',
      'Hysterosalpingography (HSG) / HyCoSy (Tubal Patency)',
      'Day 2-3 Basal Serum FSH, LH, Estradiol (E2)',
      'Serum Anti-Mullerian Hormone (AMH)',
      'Serum Thyroid Stimulating Hormone (TSH) & Prolactin',
      'Day 21 Mid-Luteal Serum Progesterone',
    ],
    medications: [
      { drug_name: 'Tab CoQ10 300mg', dose: '1 cap', frequency: 'OD', duration: '60 days', instructions: 'With morning meal' },
      { drug_name: 'Tab Vitamin D3 60000 IU', dose: '1 cap', frequency: 'Weekly', duration: '8 weeks', instructions: 'With milk' },
    ],
    instructions: 'Schedule HSG on Day 7 to 10 of cycle post-cessation of bleeding. Review with partner.',
  },
  {
    id: 'builtin_rpl_screening',
    name: 'Recurrent Pregnancy Loss (RPL) Screening',
    category: 'Obstetrics & Gynecology',
    isBuiltin: true,
    investigations: [
      'Couple Peripheral Blood Karyotype (Chromosomal Analysis)',
      'Antiphospholipid Syndrome (APS) Panel: Lupus Anticoagulant, Anticardiolipin IgG/IgM',
      'Anti-beta-2-glycoprotein 1 Antibodies',
      'Antinuclear Antibodies (ANA by IFA)',
      'Inherited Thrombophilia: Factor V Leiden, Prothrombin Gene G20210A, Protein C & S',
      '3D Pelvic Saline Infusion Sonohysterography (SIS) / Hysteroscopy',
      'HbA1c & Fasting Insulin',
    ],
    medications: [
      { drug_name: 'Tab Low Dose Aspirin 75mg', dose: '1 tab', frequency: 'OD', duration: '30 days', instructions: 'After lunch' },
      { drug_name: 'Tab L-Methylfolate 5mg', dose: '1 tab', frequency: 'OD', duration: '60 days', instructions: 'Morning' },
    ],
    instructions: 'Repeat positive antiphospholipid titers after 12 weeks for confirmation.',
  },
  {
    id: 'builtin_male_oats',
    name: 'Male Factor Subfertility (OATS) Protocol',
    category: 'Fertility / IVF',
    isBuiltin: true,
    investigations: [
      'Repeat Semen Analysis with Strict Kruger Morphology',
      'Sperm DNA Fragmentation Index (DFI)',
      'Serum FSH, LH, Total & Free Testosterone, Prolactin',
      'Scrotal Color Doppler Ultrasound (Varicocele Screening)',
      'Semen Culture & Antibiotic Sensitivity',
      'Y-Chromosome Microdeletion & Karyotype (if severe oligozoospermia)',
    ],
    medications: [
      { drug_name: 'Cap L-Carnitine + CoQ10 + Zinc + Lycopene + Selenium', dose: '1 cap', frequency: 'BD', duration: '90 days', instructions: 'After meals' },
      { drug_name: 'Tab Vitamin C 500mg', dose: '1 tab', frequency: 'OD', duration: '60 days', instructions: 'Post breakfast' },
    ],
    instructions: 'Strict avoidance of thermal exposure (hot baths, laptops on lap). 2-3 days abstinence for repeat semen analysis.',
  },
  {
    id: 'builtin_endo_pain',
    name: 'Endometriosis & Chronic Pelvic Pain Protocol',
    category: 'General Medicine',
    isBuiltin: true,
    investigations: [
      'High-Resolution Pelvic Ultrasound with Deep Endometriosis Mapping',
      'Pelvic MRI with IV Contrast (Endometriosis Protocol)',
      'Serum CA-125',
      'Complete Hemogram (CBC) & ESR / CRP',
      'Urinalysis and Renal Function Test (RFT)',
    ],
    medications: [
      { drug_name: 'Tab Dienogest 2mg', dose: '1 tab', frequency: 'OD', duration: '90 days', instructions: 'Daily at same time' },
      { drug_name: 'Tab Drotaverine + Mefenamic Acid (80mg/250mg)', dose: '1 tab', frequency: 'TID PRN', duration: '3-5 days', instructions: 'During acute pain episodes with food' },
    ],
    instructions: 'Monitor for spotting. Maintain a daily pelvic pain calendar.',
  },
];

export default function SmartOrderDialog({
  open,
  onOpenChange,
  onSelectOrderSet,
}: SmartOrderDialogProps) {
  const [orderSets, setOrderSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Order Set Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newInvestigations, setNewInvestigations] = useState('');
  const [newMedications, setNewMedications] = useState<{ drug_name: string; dose: string; frequency: string; duration: string; instructions: string }[]>([]);
  const [newInstructions, setNewInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddMedRow = () => {
    setNewMedications((prev) => [
      ...prev,
      { drug_name: '', dose: '', frequency: 'OD', duration: '', instructions: '' },
    ]);
  };

  const handleRemoveMedRow = (idx: number) => {
    setNewMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx: number, field: string, val: string) => {
    setNewMedications((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val } as any;
      return updated;
    });
  };

  const fetchOrderSets = async () => {
    setIsLoading(true);
    try {
      const res = await opdApi.getOrderSets();
      const mapped = Array.isArray(res)
        ? res.map((t: any) => ({
            id: t.id,
            name: t.title,
            category: t.schema_json?.category || 'General',
            investigations: t.schema_json?.investigations || [],
            medications: t.schema_json?.medications || [],
            instructions: t.schema_json?.instructions || '',
            isCustom: true,
          }))
        : [];

      // Merge custom order sets with built-in sets (avoid duplicates by lowercase name)
      const customNames = new Set(mapped.map((m: any) => m.name.toLowerCase()));
      const availableBuiltins = BUILT_IN_ORDER_SETS.filter(
        (b) => !customNames.has(b.name.toLowerCase())
      );
      setOrderSets([...mapped, ...availableBuiltins]);
    } catch (err) {
      console.error('Failed to fetch order sets', err);
      // Even on network error, ensure built-in order sets are available
      setOrderSets(BUILT_IN_ORDER_SETS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && !isCreating && !editingId) {
      fetchOrderSets();
    }
  }, [open, isCreating, editingId]);

  const resetForm = () => {
    setNewName('');
    setNewCategory('');
    setNewInvestigations('');
    setNewMedications([]);
    setNewInstructions('');
    setFormError(null);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleStartEdit = (os: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (os.isBuiltin) {
      setEditingId(null);
      setNewName(`${os.name} (Custom)`);
    } else {
      setEditingId(os.id);
      setNewName(os.name || '');
    }
    setNewCategory(os.category || '');
    setNewInvestigations(Array.isArray(os.investigations) ? os.investigations.join('\n') : '');
    
    if (Array.isArray(os.medications)) {
      setNewMedications(os.medications.map((m: any) => {
        if (typeof m === 'string') {
          return { drug_name: m, dose: '', frequency: '', duration: '', instructions: '' };
        }
        return m;
      }));
    } else {
      setNewMedications([]);
    }
    setNewInstructions(os.instructions || '');
    setFormError(null);
    setIsCreating(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim()) {
      setFormError('Bundle Name is required.');
      return;
    }
    if (!newCategory.trim()) {
      setFormError('Category is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const payload = {
        title: newName.trim(),
        plugin_id: 'opd_order_set',
        record_type: editingId ? undefined : `os_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        schema_json: {
          category: newCategory.trim(),
          investigations: newInvestigations
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          medications: newMedications.filter((m) => m.drug_name.trim().length > 0),
          instructions: newInstructions.trim() || undefined,
        }
      };

      if (editingId) {
        // Drop record_type for updates as it cannot be modified
        const { record_type, ...updatePayload } = payload;
        await opdApi.updateOrderSet(editingId, updatePayload as any);
      } else {
        await opdApi.createOrderSet(payload);
      }

      resetForm();
      fetchOrderSets();
    } catch (err: any) {
      console.error('Error saving order set', err);
      setFormError(err?.message || 'Failed to save order set. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (os: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (os.isBuiltin) return;
    setDeleteTarget({ id: os.id, name: os.name });
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await opdApi.deleteOrderSet(deleteTarget.id);
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      fetchOrderSets();
    } catch (err) {
      console.error('Failed to delete order set', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Derive unique categories from existing order sets
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    orderSets.forEach((os) => {
      if (os.category) set.add(os.category.trim());
    });
    return Array.from(set);
  }, [orderSets]);

  const filteredSets = useMemo(() => {
    return orderSets.filter((os) => {
      const matchesSearch =
        os.name.toLowerCase().includes(search.toLowerCase()) ||
        os.category.toLowerCase().includes(search.toLowerCase()) ||
        (os.investigations && os.investigations.some((inv: string) => inv.toLowerCase().includes(search.toLowerCase()))) ||
        (os.medications && os.medications.some((med: any) => {
          const name = typeof med === 'string' ? med : med.drug_name;
          return name && name.toLowerCase().includes(search.toLowerCase());
        }));

      const matchesCat =
        selectedCategory === 'All' ||
        os.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [orderSets, search, selectedCategory]);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) {
          resetForm();
          setDeleteTarget(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-w-[95vw] w-full p-0 bg-white overflow-hidden shadow-2xl border border-slate-200 rounded-xl">
        <DialogTitle className="sr-only">Clinical Order Sets</DialogTitle>

        {/* Delete Confirmation Modal Overlay */}
        {deleteTarget && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Delete Order Set?</h4>
                  <p className="text-xs text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Are you sure you want to delete <span className="font-semibold text-slate-900">"{deleteTarget.name}"</span>?
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-md h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-md h-9 text-xs font-semibold gap-1.5"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isCreating ? (
          <div className="flex flex-col bg-white text-slate-800">
            {/* Header with Title, Count and Create Button */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">Clinical Order Sets</h3>
                      <Badge variant="secondary" className="text-xs bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] font-bold">
                        {orderSets.length} Bundles
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Standardized bundles for one-click lab investigations and prescriptions
                    </p>
                  </div>
                </div>

                {/* Primary Action Button: Create New Order Set */}
                <Button
                  type="button"
                  onClick={handleStartCreate}
                  size="sm"
                  className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md h-9 gap-1.5 text-xs font-semibold px-4 shadow-sm shrink-0 transition-all active:scale-95 cursor-pointer z-10"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Create Order Set</span>
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <Input
                  placeholder="Search by diagnosis, lab tests, medications, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="h-9 pl-9 pr-8 text-xs bg-white shadow-xs border-slate-200 rounded-md focus-visible:ring-2 focus-visible:ring-[rgb(var(--clr-primary))] w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Chips */}
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-2.5 py-0.75 rounded-lg font-medium transition-colors shrink-0 ${
                      selectedCategory === 'All'
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    All ({orderSets.length})
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-0.75 rounded-lg font-medium transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-[rgb(var(--clr-primary))] text-white font-semibold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-[rgb(var(--clr-primary)/0.08)] hover:text-[rgb(var(--clr-primary))]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* List of Order Sets */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2.5 bg-slate-50/30">
              {isLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-[rgb(var(--clr-primary))] border-t-transparent rounded-full animate-spin" />
                  <span>Loading clinical bundles...</span>
                </div>
              ) : filteredSets.length === 0 ? (
                <div className="py-10 text-center text-slate-500 flex flex-col items-center gap-2">
                  <FolderOpen className="w-8 h-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-700">No order sets found</p>
                  <p className="text-[11px] text-slate-400">
                    {search || selectedCategory !== 'All'
                      ? 'Try adjusting your search terms or category filter'
                      : 'Create your first clinical order set to speed up consultations.'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStartCreate}
                    className="mt-2 text-xs font-semibold rounded-md text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.08)]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Create Order Set
                  </Button>
                </div>
              ) : (
                filteredSets.map((os) => (
                  <div
                    key={os.id}
                    onClick={() => {
                      onSelectOrderSet(os);
                      onOpenChange(false);
                    }}
                    className="group bg-white rounded-lg p-4 border border-slate-200 hover:border-[rgb(var(--clr-primary))] hover:shadow-md transition-all duration-150 flex flex-col gap-2.5 relative cursor-pointer"
                  >
                    {/* Card Header: Title & Category */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold border-primary/20 text-primary bg-primary/10 px-2 py-0.5"
                          >
                            {os.category}
                          </Badge>
                          {os.isBuiltin ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-slate-100 text-slate-600 border-slate-200 px-2 py-0.5"
                            >
                              Built-in Protocol
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold bg-purple-50 text-purple-700 border-purple-200 px-2 py-0.5"
                            >
                              Custom Bundle
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm md:text-base leading-snug">
                          {os.name}
                        </h4>
                      </div>
                    </div>

                    {/* Investigations Preview */}
                    {os.investigations && os.investigations.length > 0 && (
                      <div className="text-xs text-slate-700 flex items-start gap-2.5 bg-slate-50/90 rounded-md p-2.5 border border-slate-100">
                        <FlaskConical className="w-4 h-4 text-[rgb(var(--clr-primary))] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 leading-relaxed">
                          <span className="font-bold text-slate-800 mr-1.5">Labs:</span>
                          <span className="text-slate-600">
                            {os.investigations.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Medications Preview */}
                    {os.medications && os.medications.length > 0 && (
                      <div className="text-xs text-slate-700 flex items-start gap-2.5 bg-slate-50/90 rounded-md p-2.5 border border-slate-100">
                        <Pill className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 leading-relaxed">
                          <span className="font-bold text-slate-800 mr-1.5">Rx:</span>
                          <span className="text-slate-600">
                            {os.medications.map((m: any) => typeof m === 'string' ? m : m.drug_name).filter(Boolean).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instructions Preview */}
                    {os.instructions && (
                      <div className="text-xs text-slate-500 flex items-start gap-2 px-1">
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">Advice: {os.instructions}</span>
                      </div>
                    )}

                    {/* Dedicated Action Footer */}
                    <div className="pt-2.5 mt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="text-[11px] font-semibold text-slate-400">
                        {os.investigations?.length || 0} Lab Investigation{(os.investigations?.length || 0) === 1 ? '' : 's'} • {os.medications?.length || 0} Medication{(os.medications?.length || 0) === 1 ? '' : 's'}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Customize / Edit Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(os, e);
                          }}
                          className="h-8 px-3 text-xs text-slate-700 hover:text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.08)] border border-slate-200 rounded-md gap-1.5 font-semibold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span>{os.isBuiltin ? 'Customize' : 'Edit'}</span>
                        </Button>

                        {/* Delete Button (Custom Only) */}
                        {!os.isBuiltin && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(os, e);
                            }}
                            className="h-8 px-2.5 text-xs text-slate-400 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-md cursor-pointer"
                            title="Delete this custom bundle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Insert / Apply Button */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrderSet(os);
                            onOpenChange(false);
                          }}
                          className="h-8 px-4 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md text-xs font-bold gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Apply to Workbench</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <div className="flex flex-col bg-white max-h-[85vh] overflow-hidden">
            {/* Form Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between pr-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
                  {editingId ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingId ? 'Edit Clinical Order Set' : 'Create New Order Set'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define reusable diagnostic orders, medication protocols, and instructions.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Bundle Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Bundle Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Acute Gastroenteritis Protocol or Antenatal Routine"
                  className="h-9 text-xs rounded-md"
                  autoFocus
                />
              </div>

              {/* Category with Quick-select Suggestions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Department / Specialty Category <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click a chip or type custom</span>
                </div>
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Obstetrics & Gynecology, General Medicine"
                  className="h-9 text-xs rounded-md mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        newCategory === cat
                          ? 'bg-[rgb(var(--clr-primary))] text-white border-[rgb(var(--clr-primary))] font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Diagnostic Investigations */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                    <span>Investigations / Lab Orders</span>
                  </label>
                  <span className="text-[10px] text-slate-400">One test per line</span>
                </div>
                <textarea
                  value={newInvestigations}
                  onChange={(e) => setNewInvestigations(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-md p-3 text-xs focus:ring-2 focus:ring-[rgb(var(--clr-primary))] focus:bg-white outline-none font-mono"
                  rows={4}
                  placeholder={`Complete Blood Count (CBC)\nSerum Creatinine & Electrolytes\nUrine Routine & Microscopy`}
                />
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Prescription Medications ({newMedications.length})
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddMedRow}
                    className="h-7 text-xs font-bold text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)] hover:bg-[rgb(var(--clr-primary)/0.05)] gap-1"
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
                      {newMedications.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <Input
                              value={m.drug_name}
                              onChange={(e) => handleMedChange(idx, 'drug_name', e.target.value)}
                              placeholder="e.g. Tab Paracetamol 650mg"
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
                              placeholder="After food"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {newMedications.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-400 text-xs font-medium italic">
                            No medications added to this bundle.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Instructions */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>General Instructions / Lifestyle Advice</span>
                </label>
                <textarea
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Low salt diet, fluid intake 2-3L/day, review with lab reports in 48 hours."
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-md p-2.5 text-xs focus:ring-2 focus:ring-[rgb(var(--clr-primary))] focus:bg-white outline-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Form Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete({ id: editingId, name: newName })}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md h-9 gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Bundle</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-xs font-semibold rounded-md h-9 text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateOrUpdate}
                  disabled={!newName.trim() || !newCategory.trim() || isSaving}
                  className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md h-9 gap-1.5 text-xs font-semibold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : editingId ? 'Update Order Set' : 'Save Order Set'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
