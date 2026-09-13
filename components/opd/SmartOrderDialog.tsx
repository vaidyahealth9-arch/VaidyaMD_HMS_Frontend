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
  const [newMedications, setNewMedications] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchOrderSets = async () => {
    setIsLoading(true);
    try {
      const res = await opdApi.getOrderSets();
      if (Array.isArray(res)) {
        const mapped = res.map((t: any) => ({
          id: t.id,
          name: t.title,
          category: t.schema_json?.category || 'General',
          investigations: t.schema_json?.investigations || [],
          medications: t.schema_json?.medications || [],
          instructions: t.schema_json?.instructions || '',
        }));
        setOrderSets(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch order sets', err);
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
    setNewMedications('');
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
    setEditingId(os.id);
    setNewName(os.name || '');
    setNewCategory(os.category || '');
    setNewInvestigations(Array.isArray(os.investigations) ? os.investigations.join('\n') : '');
    setNewMedications(Array.isArray(os.medications) ? os.medications.join('\n') : '');
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
          medications: newMedications
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
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
        (os.medications && os.medications.some((med: string) => med.toLowerCase().includes(search.toLowerCase())));

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
      <DialogContent className="sm:max-w-[720px] p-0 bg-white overflow-hidden shadow-2xl border border-slate-200 rounded-lg">
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
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between gap-3 pr-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--clr-primary)/0.1)] text-[rgb(var(--clr-primary))] flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm md:text-base">Clinical Order Sets</h3>
                      <Badge variant="secondary" className="text-[10px] bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] border-[rgb(var(--clr-primary)/0.2)]">
                        {orderSets.length} Bundles
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Standardized bundles for one-click lab investigations and prescriptions
                    </p>
                  </div>
                </div>

                {/* Primary Action Button: Create New Order Set */}
                <Button
                  onClick={handleStartCreate}
                  size="sm"
                  className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md h-8.5 gap-1.5 text-xs font-semibold px-3.5 shadow-sm shrink-0 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
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
                    className="group bg-white rounded-md p-3.5 border border-slate-200 hover:border-[rgb(var(--clr-primary)/0.3)] hover:shadow-md transition-all duration-150 flex flex-col gap-2 relative"
                  >
                    {/* Card Header: Title, Category & Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Sparkles className="w-4 h-4 text-[rgb(var(--clr-primary))] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-sm truncate leading-snug">
                            {os.name}
                          </h4>
                          <span className="inline-block mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-medium border-indigo-150 text-[rgb(var(--clr-primary))] bg-[rgb(var(--clr-primary)/0.08)] px-2 py-0"
                            >
                              {os.category}
                            </Badge>
                          </span>
                        </div>
                      </div>

                      {/* Explicit Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleStartEdit(os, e)}
                          className="h-7.5 px-2.5 text-xs text-slate-600 hover:text-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.08)] border border-slate-200 hover:border-[rgb(var(--clr-primary)/0.2)] rounded-lg gap-1 transition-colors"
                          title="Edit this bundle"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))]" />
                          <span className="hidden sm:inline font-medium">Edit</span>
                        </Button>

                        {/* Delete Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => confirmDelete(os, e)}
                          className="h-7.5 px-2 text-xs text-slate-400 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                          title="Delete this bundle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Insert / Apply Button */}
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            onSelectOrderSet(os);
                            onOpenChange(false);
                          }}
                          className="h-7.5 px-3 bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white rounded-md text-xs font-semibold gap-1 shadow-xs transition-all active:scale-95"
                          title="Apply this order set to consultation"
                        >
                          <span>Insert</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Investigations Preview */}
                    {os.investigations && os.investigations.length > 0 && (
                      <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100">
                        <FlaskConical className="w-3.5 h-3.5 text-[rgb(var(--clr-primary))] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-700 mr-1.5">Labs:</span>
                          <span className="text-slate-600 line-clamp-2">
                            {os.investigations.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Medications Preview */}
                    {os.medications && os.medications.length > 0 && (
                      <div className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100">
                        <Pill className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-700 mr-1.5">Rx:</span>
                          <span className="text-slate-600 line-clamp-2">
                            {os.medications.join(', ')}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Instructions Preview */}
                    {os.instructions && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1 truncate">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">Advice: {os.instructions}</span>
                      </div>
                    )}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-amber-500" />
                    <span>Medications / Prescriptions</span>
                  </label>
                  <span className="text-[10px] text-slate-400">One drug & dosage per line</span>
                </div>
                <textarea
                  value={newMedications}
                  onChange={(e) => setNewMedications(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-md p-3 text-xs focus:ring-2 focus:ring-[rgb(var(--clr-primary))] focus:bg-white outline-none font-mono"
                  rows={4}
                  placeholder={`Tab Paracetamol 650mg TDS (SOS)\nCap Pantoprazole 40mg OD AC\nOral Rehydration Salts (ORS) 1 sachet in 1L water`}
                />
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
