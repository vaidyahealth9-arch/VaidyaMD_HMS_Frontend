'use client';

import React, { useState } from 'react';
import { protocolsApi, treatmentCyclesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Plus,
  Dna,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Layers,
  Activity,
  Check,
  EyeOff,
  Pill,
} from 'lucide-react';
import CycleTypeModal from '../modals/CycleTypeModal';
import ProtocolModal from '../modals/ProtocolModal';

interface CyclesSettingsTabProps {
  cycleTypes: any[];
  setCycleTypes: React.Dispatch<React.SetStateAction<any[]>>;
  protocols: any[];
  setProtocols: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CyclesSettingsTab({
  cycleTypes,
  setCycleTypes,
  protocols,
  setProtocols,
}: CyclesSettingsTabProps) {
  const { user } = useAuth();
  const [cycleSubTab, setCycleSubTab] = useState<'modalities' | 'protocols'>('modalities');
  const [cycleSearch, setCycleSearch] = useState('');
  const [cycleCategoryFilter, setCycleCategoryFilter] = useState('all');
  const [cycleStatusFilter, setCycleStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
  const [protocolPreviewCalendar, setProtocolPreviewCalendar] = useState<any[]>([]);
  const [protocolStatusFilter, setProtocolStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const [protocolSearch, setProtocolSearch] = useState('');

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [editingCycleType, setEditingCycleType] = useState<any>(null);
  const [cycleTypeForm, setCycleTypeForm] = useState({ name: '', category: 'Stimulation', display_order: 0, is_active: true });

  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<any>(null);
  const [protocolForm, setProtocolForm] = useState({ name: '', category: 'stimulation', description: '', rules: [] as any[], timeline_events: [] as any[] });

  const handleSelectProtocol = (proto: any) => {
    setSelectedProtocol(proto);
    if (proto?.id) {
      const today = new Date().toISOString().split('T')[0];
      protocolsApi
        .previewCalendar({
          protocol_template_id: proto.id,
          sentinel_dates: { stim_start: today, lmp_day1: today },
        })
        .then((res: any) => setProtocolPreviewCalendar(res?.days || []))
        .catch(() => setProtocolPreviewCalendar([]));
    }
  };

  // Schema parsing & field builder synchronization
  const parseSchemaToFields = (schemaObj: any) => {
    let fieldsArray: any[] = [];
    if (Array.isArray(schemaObj)) {
      fieldsArray = schemaObj;
    } else if (Array.isArray(schemaObj?.sections) && schemaObj.sections[0]?.fields) {
      fieldsArray = schemaObj.sections[0].fields;
    } else if (Array.isArray(schemaObj?.fields)) {
      fieldsArray = schemaObj.fields;
    } else if (typeof schemaObj === 'object' && schemaObj !== null) {
      fieldsArray = Object.entries(schemaObj).map(([k, v]) => ({
        id: k,
        label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        type: typeof v === 'string' && (v.includes('\n') || v.length > 50) ? 'textarea' : 'text',
        placeholder: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
      }));
    }
    return fieldsArray.map((f: any, idx: number) => ({
      id: f.id || `field_${idx + 1}`,
      label: f.label || `Field ${idx + 1}`,
      type: f.type || 'text',
      placeholder: f.placeholder || '',
      options: Array.isArray(f.options) ? f.options.map((o: any) => typeof o === 'string' ? o : (o.label || o.value)).join(', ') : '',
      required: !!f.required,
    }));
  };

  const buildSchemaFromFields = (fields: Array<{ id: string; label: string; type: string; placeholder?: string; options?: string; required?: boolean }>) => {
    return fields.map((f, idx) => ({
      id: f.id || (f.label ? f.label.toLowerCase().replace(/[^a-z0-9_]+/g, '_') : `field_${idx + 1}`),
      label: f.label || `Field ${idx + 1}`,
      type: f.type || 'text',
      placeholder: f.placeholder || undefined,
      options: ['select', 'checkbox_group'].includes(f.type) && f.options ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : undefined,
      required: !!f.required,
    }));
  };

  const handleSaveCycleType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCycleType) {
        await treatmentCyclesApi.updateType(editingCycleType.id, cycleTypeForm);
        alert('Cycle modality updated successfully!');
      } else {
        await treatmentCyclesApi.createType(cycleTypeForm);
        alert('Cycle modality created successfully!');
      }
      setShowCycleModal(false);
      setEditingCycleType(null);
      setCycleTypeForm({ name: '', category: 'Stimulation', display_order: 0, is_active: true });
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to save cycle type');
    }
  };

  const handleToggleCycleType = async (cycleType: any) => {
    try {
      if (cycleType.is_active !== false) {
        if (!confirm(`Are you sure you want to deactivate modality "${cycleType.name}"? It will be disabled and hidden from new patient cycles.`)) return;
        await treatmentCyclesApi.deleteType(cycleType.id, false);
        alert('Modality deactivated successfully!');
      } else {
        await treatmentCyclesApi.reactivateType(cycleType.id);
        alert('Modality reactivated successfully!');
      }
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to update modality status');
    }
  };

  const handleHardDeleteCycleType = async (typeId: string, name: string) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete modality "${name}"? This CANNOT be undone!`)) return;
    try {
      await treatmentCyclesApi.deleteType(typeId, true);
      alert('Cycle modality permanently deleted!');
      const ct = await treatmentCyclesApi.listTypes({ include_inactive: true });
      setCycleTypes(Array.isArray(ct) ? ct : []);
    } catch (e: any) {
      alert(e.message || 'Failed to delete cycle modality');
    }
  };

  // Protocol CRUD Handlers
  const handleSaveProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProtocol) {
        await protocolsApi.update(editingProtocol.id, protocolForm);
        alert('Protocol updated successfully!');
      } else {
        await protocolsApi.create({ ...protocolForm, created_by: user?.id });
        alert('Protocol created successfully!');
      }
      setShowProtocolModal(false);
      setEditingProtocol(null);
      setProtocolForm({ name: '', category: 'stimulation', description: '', rules: [], timeline_events: [] });
      const updated = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(updated) ? updated : [];
      setProtocols(pList);
      if (editingProtocol) {
        const found = pList.find((p: any) => p.id === editingProtocol.id);
        if (found) handleSelectProtocol(found);
      } else if (pList.length > 0) {
        handleSelectProtocol(pList[0]);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save protocol');
    }
  };

  const handleDeactivateProtocol = async (protocolId: string) => {
    if (!confirm('Are you sure you want to deactivate this protocol template? It will be marked inactive and moved to the Inactive list.')) return;
    try {
      await protocolsApi.delete(protocolId, false);
      alert('Protocol template deactivated successfully!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      const updated = pList.find((p: any) => p.id === protocolId);
      if (updated) setSelectedProtocol(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate protocol');
    }
  };

  const handleReactivateProtocol = async (protocolId: string) => {
    try {
      await protocolsApi.reactivate(protocolId);
      alert('Protocol template reactivated successfully!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      const updated = pList.find((p: any) => p.id === protocolId);
      if (updated) setSelectedProtocol(updated);
    } catch (e: any) {
      alert(e.message || 'Failed to reactivate protocol');
    }
  };

  const handleHardDeleteProtocol = async (protocolId: string, name: string) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete protocol "${name}" and all its rules? This action CANNOT be undone!`)) return;
    try {
      await protocolsApi.delete(protocolId, true);
      alert('Protocol permanently deleted!');
      const pr = await protocolsApi.list({ include_inactive: true });
      const pList = Array.isArray(pr) ? pr : [];
      setProtocols(pList);
      if (pList.length > 0) handleSelectProtocol(pList[0]);
      else setSelectedProtocol(null);
    } catch (e: any) {
      alert(e.message || 'Failed to delete protocol');
    }
  };

  // LIMS Test CRUD Handlers

  return (
    <>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setCycleSubTab('modalities')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  cycleSubTab === 'modalities' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ART Modality Catalog ({cycleTypes.length})
              </button>
              <button
                onClick={() => setCycleSubTab('protocols')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  cycleSubTab === 'protocols' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Clinical Protocols & Timeline ({protocols.length})
              </button>
            </div>
          </div>

          {cycleSubTab === 'modalities' ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-3 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ART Modality Catalog ({cycleTypes.length})</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Master registry of clinical cycle types offered by the hospital. Populates the treatment type dropdown across Patient Charts, IVF Lab, and Billing packages.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCycleType(null);
                    setCycleTypeForm({ name: '', category: 'Stimulation', display_order: cycleTypes.length + 1, is_active: true });
                    setShowCycleModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Modality
                </button>
              </div>

              {/* Modalities Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search modality name..."
                    value={cycleSearch}
                    onChange={(e) => setCycleSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white"
                  />
                </div>
                <div>
                  <select
                    value={cycleCategoryFilter}
                    onChange={(e) => setCycleCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50"
                  >
                    <option value="all">All Categories</option>
                    <option value="Stimulation">Stimulation (ICSI, IVF)</option>
                    <option value="FET">FET (Frozen Embryo Transfer)</option>
                    <option value="IUI">IUI & Ovulation Induction</option>
                    <option value="Preservation">Preservation (Egg/Embryo Freeze)</option>
                    <option value="Third-Party">Third-Party (Donation / Surrogacy)</option>
                    <option value="Diagnostics">Diagnostics (PGT-A / PGT-M)</option>
                    <option value="Surgical">Surgical (TESA / PESA)</option>
                  </select>
                </div>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setCycleStatusFilter('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({cycleTypes.length})
                  </button>
                  <button
                    onClick={() => setCycleStatusFilter('active')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'active' ? 'bg-white shadow-2xs text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Enabled ({cycleTypes.filter(c => c.is_active !== false).length})
                  </button>
                  <button
                    onClick={() => setCycleStatusFilter('inactive')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      cycleStatusFilter === 'inactive' ? 'bg-white shadow-2xs text-rose-700' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Disabled ({cycleTypes.filter(c => c.is_active === false).length})
                  </button>
                </div>
              </div>

              {/* Modalities Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Cycle Modality</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Display Order</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cycleTypes
                      .filter((c) => {
                        const matchesSearch = !cycleSearch || c.name.toLowerCase().includes(cycleSearch.toLowerCase());
                        const matchesCategory = cycleCategoryFilter === 'all' || (c.category || '').toLowerCase() === cycleCategoryFilter.toLowerCase();
                        const matchesStatus =
                          cycleStatusFilter === 'all'
                            ? true
                            : cycleStatusFilter === 'active'
                            ? c.is_active !== false
                            : c.is_active === false;
                        return matchesSearch && matchesCategory && matchesStatus;
                      })
                      .map((c) => (
                        <tr key={c.id || c.name} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900">{c.name}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                              {c.category || 'Stimulation'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{c.display_order || 0}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                c.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {c.is_active !== false ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex justify-end items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingCycleType(c);
                                  setCycleTypeForm({
                                    name: c.name,
                                    category: c.category || 'Stimulation',
                                    display_order: c.display_order || 0,
                                    is_active: c.is_active !== false,
                                  });
                                  setShowCycleModal(true);
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                                title="Edit Modality"
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={() => handleToggleCycleType(c)}
                                className={`px-2 py-1 border rounded text-[11px] font-semibold flex items-center gap-1 shadow-2xs ${
                                  c.is_active !== false
                                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                }`}
                                title={c.is_active !== false ? 'Deactivate Modality' : 'Enable Modality'}
                              >
                                {c.is_active !== false ? (
                                  <>
                                    <EyeOff className="w-3 h-3" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Enable
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleHardDeleteCycleType(c.id, c.name)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Permanently Delete Modality"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Protocols Library Left Rail */}
              <div className="lg:col-span-4 space-y-2.5">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Protocols Library</span>
                    <span className="text-[10px] text-slate-500">
                      {protocols.filter(p => p.is_active !== false).length} Active · {protocols.filter(p => p.is_active === false).length} Inactive
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingProtocol(null);
                      setProtocolForm({ name: '', category: 'stimulation', description: '', rules: [], timeline_events: [] });
                      setShowProtocolModal(true);
                    }}
                    className="px-2.5 py-1 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" /> Add Protocol
                  </button>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setProtocolStatusFilter('active')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'active' ? 'bg-white shadow-2xs text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Active ({protocols.filter(p => p.is_active !== false).length})
                  </button>
                  <button
                    onClick={() => setProtocolStatusFilter('inactive')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'inactive' ? 'bg-white shadow-2xs text-amber-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Inactive ({protocols.filter(p => p.is_active === false).length})
                  </button>
                  <button
                    onClick={() => setProtocolStatusFilter('all')}
                    className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                      protocolStatusFilter === 'all' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({protocols.length})
                  </button>
                </div>

                {/* Protocols Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search protocols..."
                    value={protocolSearch}
                    onChange={(e) => setProtocolSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                {/* Protocol Card List */}
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                  {protocols
                    .filter((proto) => {
                      const matchesSearch = !protocolSearch || proto.name.toLowerCase().includes(protocolSearch.toLowerCase());
                      const matchesStatus =
                        protocolStatusFilter === 'all'
                          ? true
                          : protocolStatusFilter === 'active'
                          ? proto.is_active !== false
                          : proto.is_active === false;
                      return matchesSearch && matchesStatus;
                    })
                    .map((proto) => (
                      <button
                        key={proto.id}
                        onClick={() => handleSelectProtocol(proto)}
                        className={`w-full text-left p-3 rounded-xl border transition-all ${
                          selectedProtocol?.id === proto.id
                            ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-bold text-slate-900 text-xs truncate">{proto.name}</div>
                          {proto.is_active === false && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 capitalize flex items-center justify-between">
                          <span>{proto.category} Protocol</span>
                          <span className="text-[10px] text-slate-400">
                            {proto.rules?.length || 0} drugs · {proto.timeline_events?.length || 0} events
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Protocol Detail Pane */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {selectedProtocol?.name || 'Protocol Details'}
                      </h3>
                      {selectedProtocol?.category && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                          {selectedProtocol.category}
                        </span>
                      )}
                      {selectedProtocol?.is_active === false && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-300">
                          Deactivated / Inactive
                        </span>
                      )}
                    </div>
                    {selectedProtocol?.description && (
                      <p className="text-xs text-slate-500 mt-1 max-w-xl">{selectedProtocol.description}</p>
                    )}
                  </div>
                  {selectedProtocol && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setEditingProtocol(selectedProtocol);
                          setProtocolForm({
                            name: selectedProtocol.name,
                            category: selectedProtocol.category || 'stimulation',
                            description: selectedProtocol.description || '',
                            rules: (selectedProtocol.rules || []).map((r: any) => ({
                              drug_name: r.drug_name || '',
                              dose: r.dose || '',
                              route: r.route || 'SC',
                              frequency: r.frequency || 'OD',
                              day_start_offset: r.day_start_offset ?? 1,
                              day_end_offset: r.day_end_offset ?? 10,
                              instructions: r.instructions || '',
                            })),
                            timeline_events: (selectedProtocol.timeline_events || []).map((ev: any) => ({
                              type: ev.type || 'scan',
                              day_offset: ev.day_offset ?? 1,
                              title: ev.title || '',
                              instructions: ev.instructions || '',
                            })),
                          });
                          setShowProtocolModal(true);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>

                      {/* Deactivate vs Reactivate Buttons */}
                      {selectedProtocol.is_active !== false ? (
                        <button
                          onClick={() => handleDeactivateProtocol(selectedProtocol.id)}
                          className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                          title="Deactivate protocol (archives it without permanently deleting)"
                        >
                          <EyeOff className="w-3 h-3" /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateProtocol(selectedProtocol.id)}
                          className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                          title="Reactivate protocol (restores it to active clinical schedules)"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Reactivate
                        </button>
                      )}

                      {/* Permanent Delete Button */}
                      <button
                        onClick={() => handleHardDeleteProtocol(selectedProtocol.id, selectedProtocol.name)}
                        className="px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-2xs"
                        title="Permanently delete this protocol and its rules"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Section A: Configured Drug Rules */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Configured Prescriptions & Drug Rules ({selectedProtocol?.rules?.length || 0})
                  </h4>
                  {selectedProtocol?.rules && selectedProtocol.rules.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Medication</th>
                            <th className="py-2 px-2">Dose</th>
                            <th className="py-2 px-2">Route</th>
                            <th className="py-2 px-2">Freq</th>
                            <th className="py-2 px-2 text-center">Cycle Days</th>
                            <th className="py-2 px-3">Clinical Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedProtocol.rules.map((r: any, rIdx: number) => (
                            <tr key={r.id || rIdx} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 font-bold text-slate-800">{r.drug_name}</td>
                              <td className="py-2 px-2 font-mono text-primary font-bold">{r.dose}</td>
                              <td className="py-2 px-2 text-slate-600">{r.route || 'SC'}</td>
                              <td className="py-2 px-2 text-slate-600">{r.frequency || 'OD'}</td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                                D{r.day_start_offset}–D{r.day_end_offset}
                              </td>
                              <td className="py-2 px-3 text-slate-500 text-[11px]">{r.instructions || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No drug rules configured.</p>
                  )}
                </div>

                {/* Section B: Scheduled Clinical Events (Scans, Labs, Procedures) */}
                {selectedProtocol?.timeline_events && selectedProtocol.timeline_events.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" /> Scheduled Scans, Investigations & Procedures ({selectedProtocol.timeline_events.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {selectedProtocol.timeline_events.map((ev: any, evIdx: number) => {
                        const isScan = ev.type === 'scan';
                        const isInv = ev.type === 'investigation';
                        const isProc = ev.type === 'procedure';

                        return (
                          <div
                            key={evIdx}
                            className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                              isScan
                                ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                                : isInv
                                ? 'bg-purple-50/60 border-purple-200 text-purple-900'
                                : 'bg-amber-50/60 border-amber-200 text-amber-900'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/80 border border-slate-200/60">
                                Day {ev.day_offset}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {isScan ? '🔍 Scan' : isInv ? '🧪 Lab' : '🧫 Procedure'}
                              </span>
                            </div>
                            <div className="font-bold text-xs">{ev.title}</div>
                            {ev.instructions && (
                              <div className="text-[10px] opacity-75 mt-0.5 truncate" title={ev.instructions}>
                                {ev.instructions}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section C: Day-by-Day Timeline Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" /> Generated Day-by-Day Clinical Timeline ({protocolPreviewCalendar.length} Days)
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">Computed live via Rules Engine</span>
                  </div>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    {protocolPreviewCalendar.map((dayItem: any, idx: number) => {
                      const hasEvents = (dayItem.scans?.length || 0) + (dayItem.investigations?.length || 0) + (dayItem.procedures?.length || 0) > 0;

                      return (
                        <div
                          key={idx}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition-colors ${
                            hasEvents ? 'bg-slate-50/90 border-slate-300' : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <span className="font-bold font-mono text-primary text-xs shrink-0 w-24">
                              {dayItem.stim_day_label || `Day ${dayItem.day_number || idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {dayItem.display_date || ''}
                            </span>
                          </div>

                          {/* Multi-Track Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 flex-1">
                            {dayItem.milestone && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                                {dayItem.milestone}
                              </span>
                            )}
                            {(dayItem.scans || []).map((s: string, sIdx: number) => (
                              <span key={sIdx} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                🔍 {s}
                              </span>
                            ))}
                            {(dayItem.investigations || []).map((inv: string, iIdx: number) => (
                              <span key={iIdx} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[200px]" title={inv}>
                                🧪 {inv}
                              </span>
                            ))}
                            {(dayItem.procedures || []).map((p: string, pIdx: number) => (
                              <span key={pIdx} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 shrink-0">
                                🧫 {p}
                              </span>
                            ))}
                            {(dayItem.medications || []).map((m: any, mIdx: number) => (
                              <span key={mIdx} className="bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium text-slate-800 shadow-2xs">
                                💊 {m.drug_name || m.name} <strong className="text-primary">{m.dose || m.dosage}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      <CycleTypeModal
        isOpen={showCycleModal}
        onClose={() => setShowCycleModal(false)}
        editingCycleType={editingCycleType}
        cycleTypeForm={cycleTypeForm}
        setCycleTypeForm={setCycleTypeForm}
        onSubmit={handleSaveCycleType}
      />
      <ProtocolModal
        isOpen={showProtocolModal}
        onClose={() => setShowProtocolModal(false)}
        editingProtocol={editingProtocol}
        protocolForm={protocolForm}
        setProtocolForm={setProtocolForm}
        onSubmit={handleSaveProtocol}
      />
    </>
  );
}
