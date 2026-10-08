'use client';

import React, { useState } from 'react';
import { billingApi, cosgynApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import ServiceCatalogModal from '../modals/ServiceCatalogModal';
import TreatmentPackageModal from '../modals/TreatmentPackageModal';
import CosgynPackageModal from '../modals/CosgynPackageModal';

interface TariffsSettingsTabProps {
  serviceCatalog: any[];
  setServiceCatalog: React.Dispatch<React.SetStateAction<any[]>>;
  treatmentPackages: any[];
  setTreatmentPackages: React.Dispatch<React.SetStateAction<any[]>>;
  cosgynTreatments: any[];
  setCosgynTreatments: React.Dispatch<React.SetStateAction<any[]>>;
  hospitalBranches: any[];
}

export default function TariffsSettingsTab({
  serviceCatalog,
  setServiceCatalog,
  treatmentPackages,
  setTreatmentPackages,
  cosgynTreatments,
  setCosgynTreatments,
  hospitalBranches,
}: TariffsSettingsTabProps) {
  const [tariffSubTab, setTariffSubTab] = useState<'catalog' | 'packages' | 'cosgyn'>('catalog');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCatFilter, setCatalogCatFilter] = useState('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceItem, setEditingServiceItem] = useState<any>(null);
  const [serviceItemForm, setServiceItemForm] = useState({
    code: '',
    name: '',
    category: 'Consultation',
    base_price: 0,
    hsn_sac: '',
    gst_rate: 0,
    branch_id: '',
  });

  const [packageSearch, setPackageSearch] = useState('');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    plugin_id: 'fertility',
    base_price: 0,
    items_json: '[]',
  });
  const [packageEditorMode, setPackageEditorMode] = useState<'form' | 'json'>('form');
  const [packageFormItems, setPackageFormItems] = useState<Array<{ name: string; quantity: number; price: number }>>([]);

  const [cosgynSearch, setCosgynSearch] = useState('');
  const [showCosgynModal, setShowCosgynModal] = useState(false);
  const [editingCosgynTreatment, setEditingCosgynTreatment] = useState<any>(null);
  const [cosgynForm, setCosgynForm] = useState({
    name: '',
    package_combo: '',
    jet_plasma_sessions: 0,
    jet_plasma_duration_mins: 30,
    tesla_chair_sessions: 0,
    tesla_chair_duration_mins: 30,
    prp_sessions: 0,
    price: 25000,
  });

  const refreshCosgynTreatments = () => {
    cosgynApi
      .getTreatments()
      .then((res: any) => setCosgynTreatments(Array.isArray(res) ? res : []))
      .catch(() => {});
  };

  const handleSaveServiceItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingServiceItem) {
        await billingApi.updateServiceItem(editingServiceItem.id, {
          code: serviceItemForm.code,
          name: serviceItemForm.name,
          category: serviceItemForm.category,
          base_price: Number(serviceItemForm.base_price),
          hsn_sac: serviceItemForm.hsn_sac,
          gst_rate: Number(serviceItemForm.gst_rate),
          branch_id: serviceItemForm.branch_id || null,
        });
        alert('Service item updated!');
      } else {
        await billingApi.createServiceItem({
          code: serviceItemForm.code,
          name: serviceItemForm.name,
          category: serviceItemForm.category,
          base_price: Number(serviceItemForm.base_price),
          hsn_sac: serviceItemForm.hsn_sac,
          gst_rate: Number(serviceItemForm.gst_rate),
          branch_id: serviceItemForm.branch_id || null,
        });
        alert('Service item created!');
      }
      setShowServiceModal(false);
      billingApi.getServiceCatalog().then((res: any) => setServiceCatalog(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save service item');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let itemsParsed: any[] = [];
      if (packageEditorMode === 'form') {
        itemsParsed = packageFormItems.map((it: any) => ({
          name: it.name?.trim() || 'Service Item',
          quantity: Math.max(1, Number(it.quantity || 1)),
          price: Math.max(0, Number(it.price ?? it.cost ?? 0)),
          service_code: it.code || it.service_code || '',
        }));
      } else {
        try {
          const raw = JSON.parse(packageForm.items_json);
          if (!Array.isArray(raw)) throw new Error('Items must be an array');
          itemsParsed = raw.map((it: any) => ({
            name: it.name?.trim() || 'Service Item',
            quantity: Math.max(1, Number(it.quantity || 1)),
            price: Math.max(0, Number(it.price ?? it.cost ?? 0)),
            service_code: it.code || it.service_code || '',
          }));
        } catch {
          alert('Items JSON is invalid. Please format as a JSON array of objects.');
          return;
        }
      }
      if (editingPackage) {
        await billingApi.updatePackage(editingPackage.id, {
          name: packageForm.name,
          description: packageForm.description,
          plugin_id: packageForm.plugin_id,
          base_price: Number(packageForm.base_price),
          items: itemsParsed,
        });
        alert('Package updated!');
      } else {
        await billingApi.createPackage({
          name: packageForm.name,
          description: packageForm.description,
          plugin_id: packageForm.plugin_id,
          base_price: Number(packageForm.base_price),
          items: itemsParsed,
          is_active: true,
        });
        alert('Treatment package created!');
      }
      setShowPackageModal(false);
      billingApi.listPackages().then((res: any) => setTreatmentPackages(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save package');
    }
  };

  const handleSaveCosgynTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!cosgynForm.name.trim()) {
        alert('Package name is required.');
        return;
      }
      const payload = {
        name: cosgynForm.name.trim(),
        package_combo: cosgynForm.package_combo.trim() || undefined,
        jet_plasma_sessions: Number(cosgynForm.jet_plasma_sessions) || 0,
        jet_plasma_duration_mins: Number(cosgynForm.jet_plasma_duration_mins) || 30,
        tesla_chair_sessions: Number(cosgynForm.tesla_chair_sessions) || 0,
        tesla_chair_duration_mins: Number(cosgynForm.tesla_chair_duration_mins) || 30,
        prp_sessions: Number(cosgynForm.prp_sessions) || 0,
        price: Number(cosgynForm.price) || 0,
      };

      if (editingCosgynTreatment) {
        await cosgynApi.updateTreatment(editingCosgynTreatment.id, payload);
        alert('CosGyn package updated successfully!');
      } else {
        await cosgynApi.createTreatment(payload);
        alert('CosGyn specialty package created successfully!');
      }
      setShowCosgynModal(false);
      refreshCosgynTreatments();
    } catch (err: any) {
      alert(err.message || 'Failed to save CosGyn package');
    }
  };

  const handleDeleteCosgynTreatment = async (treatmentId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete CosGyn package "${name}"?`)) return;
    try {
      await cosgynApi.deleteTreatment(treatmentId);
      alert('Package deleted successfully.');
      refreshCosgynTreatments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    }
  };

  return (
    <>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTariffSubTab('catalog')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tariffSubTab === 'catalog' ? 'bg-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Master Service Catalog ({serviceCatalog.length})
              </button>
              <button
                onClick={() => setTariffSubTab('packages')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  tariffSubTab === 'packages' ? 'bg-primary text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Bundled Treatment Packages ({treatmentPackages.length})
              </button>
              <button
                onClick={() => setTariffSubTab('cosgyn')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  tariffSubTab === 'cosgyn' ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                CosGyn Specialty Packages ({cosgynTreatments.length})
              </button>
            </div>
            {tariffSubTab === 'catalog' && (
              <button
                onClick={() => {
                  setEditingServiceItem(null);
                  setServiceItemForm({
                    code: '',
                    name: '',
                    category: 'Consultation',
                    base_price: 1000,
                    hsn_sac: '999312',
                    gst_rate: 0,
                    branch_id: '',
                  });
                  setShowServiceModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Service Item
              </button>
            )}
            {tariffSubTab === 'packages' && (
              <button
                onClick={() => {
                  setEditingPackage(null);
                  setPackageFormItems([{ name: 'Consultation & Scan', quantity: 1, price: 1500 }]);
                  setPackageEditorMode('form');
                  setPackageForm({
                    name: '',
                    description: '',
                    plugin_id: 'fertility',
                    base_price: 150000,
                    items_json: JSON.stringify([{ name: 'Consultation & Scan', quantity: 1, price: 1500 }], null, 2),
                  });
                  setShowPackageModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Treatment Package
              </button>
            )}
            {tariffSubTab === 'cosgyn' && (
              <button
                onClick={() => {
                  setEditingCosgynTreatment(null);
                  setCosgynForm({
                    name: '',
                    package_combo: '',
                    jet_plasma_sessions: 0,
                    jet_plasma_duration_mins: 30,
                    tesla_chair_sessions: 0,
                    tesla_chair_duration_mins: 30,
                    prp_sessions: 0,
                    price: 25000,
                  });
                  setShowCosgynModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Add CosGyn Package
              </button>
            )}
          </div>

          {tariffSubTab === 'catalog' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-3">Service Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-center">HSN/SAC</th>
                    <th className="py-3 px-3 text-center">GST Rate</th>
                    <th className="py-3 px-4 text-right">Standard Tariff</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceCatalog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{item.code}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                          {item.category || item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{item.hsn_sac || '999312'}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">{item.gst_rate}%</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.base_price || item.cost || 0)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingServiceItem(item);
                            setServiceItemForm({
                              code: item.code,
                              name: item.name,
                              category: item.category || 'Consultation',
                              base_price: item.base_price || item.cost,
                              hsn_sac: item.hsn_sac || '999312',
                              gst_rate: item.gst_rate || 0,
                              branch_id: item.branch_id || '',
                            });
                            setShowServiceModal(true);
                          }}
                          className="px-2 py-1 text-slate-600 hover:text-primary"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tariffSubTab === 'packages' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatmentPackages.map((pkg) => (
                <div key={pkg.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{pkg.name}</h3>
                    <span className="font-mono font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                      {formatCurrency(pkg.base_price ?? pkg.price ?? pkg.amount ?? 0)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{pkg.description || 'Comprehensive treatment bundle.'}</p>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1.5">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                      <span className="font-semibold text-slate-700">Included Services ({(pkg.items || []).length}):</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Sum: {formatCurrency((pkg.items || []).reduce((acc: number, it: any) => acc + ((Number(it.price ?? it.cost ?? 0)) * Number(it.quantity || 1)), 0))}
                      </span>
                    </div>
                    <ul className="space-y-1 text-slate-600">
                      {(pkg.items || []).slice(0, 4).map((it: any, i: number) => {
                        const price = Number(it.price ?? it.cost ?? 0);
                        const qty = Number(it.quantity || 1);
                        return (
                          <li key={i} className="flex justify-between items-center text-[11px] border-b border-slate-100 last:border-0 pb-0.5">
                            <span className="truncate pr-2 font-medium text-slate-700">
                              • {it.name || it.description} <span className="text-slate-400 font-mono text-[10px]">({qty}x)</span>
                            </span>
                            <span className="font-mono font-semibold text-slate-800 shrink-0">
                              {formatCurrency(price * qty)}
                            </span>
                          </li>
                        );
                      })}
                      {(pkg.items || []).length > 4 && (
                        <li className="text-primary font-semibold text-[10px] pt-0.5 text-right">
                          + {(pkg.items || []).length - 4} more services included
                        </li>
                      )}
                      {(!pkg.items || pkg.items.length === 0) && (
                        <li className="text-slate-400 italic">No services listed</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setEditingPackage(pkg);
                        const itms = Array.isArray(pkg.items) ? pkg.items : [];
                        setPackageFormItems(itms);
                        setPackageEditorMode('form');
                        setPackageForm({
                          name: pkg.name,
                          description: pkg.description || '',
                          plugin_id: pkg.plugin_id || 'fertility',
                          base_price: pkg.base_price ?? pkg.price ?? 0,
                          items_json: JSON.stringify(itms, null, 2),
                        });
                        setShowPackageModal(true);
                      }}
                      className="text-xs text-primary hover:text-primary-mid font-semibold"
                    >
                      Edit Bundle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tariffSubTab === 'cosgyn' && (
            <div className="space-y-4">
              {/* CosGyn Packages Header Banner */}
              <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 border border-pink-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cosmetic Gynecology &amp; Aesthetics Protocol Tariffs</h4>
                    <p className="text-xs text-slate-500">
                      Jet Plasma mucosal regeneration, Tesla Chair (HIFEM) pelvic floor therapy, autologous PRP revitalization, and contouring packages.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-pink-200 text-pink-700 rounded-lg">
                    {cosgynTreatments.length} Active Protocols
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={cosgynSearch}
                    onChange={(e) => setCosgynSearch(e.target.value)}
                    placeholder="Search CosGyn package name or protocol..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Treatments Cards Grid */}
              {cosgynTreatments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-pink-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No CosGyn Specialty Packages Configured</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add Jet Plasma, Tesla Chair, PRP or surgical rejuvenation protocols with custom session counts and pricing.
                  </p>
                  <button
                    onClick={() => {
                      setEditingCosgynTreatment(null);
                      setCosgynForm({
                        name: '',
                        package_combo: '',
                        jet_plasma_sessions: 0,
                        jet_plasma_duration_mins: 30,
                        tesla_chair_sessions: 0,
                        tesla_chair_duration_mins: 30,
                        prp_sessions: 0,
                        price: 25000,
                      });
                      setShowCosgynModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-semibold text-xs rounded-lg shadow-xs"
                  >
                    Add First Package
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cosgynTreatments
                    .filter((t: any) => {
                      if (!cosgynSearch) return true;
                      const q = cosgynSearch.toLowerCase();
                      return (
                        (t.name || '').toLowerCase().includes(q) ||
                        (t.package_combo || '').toLowerCase().includes(q)
                      );
                    })
                    .map((t: any) => (
                      <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between hover:border-pink-200 transition-all">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm leading-snug">{t.name}</h3>
                              {t.package_combo && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-50 text-pink-700 border border-pink-100">
                                  {t.package_combo}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-sm text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 shrink-0">
                              {formatCurrency(t.price || 0)}
                            </span>
                          </div>

                          {/* Session breakdown pill list */}
                          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Protocol Sessions:</div>
                            <div className="flex flex-col gap-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                  Jet Plasma:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.jet_plasma_sessions > 0
                                    ? `${t.jet_plasma_sessions} sessions (${t.jet_plasma_duration_mins || 30}m)`
                                    : 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                  Tesla Chair (HIFEM):
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.tesla_chair_sessions > 0
                                    ? `${t.tesla_chair_sessions} sessions (${t.tesla_chair_duration_mins || 30}m)`
                                    : 'None'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                  PRP Revitalization:
                                </span>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.prp_sessions > 0 ? `${t.prp_sessions} sessions` : 'None'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCosgynTreatment(t);
                              setCosgynForm({
                                name: t.name,
                                package_combo: t.package_combo || '',
                                jet_plasma_sessions: t.jet_plasma_sessions || 0,
                                jet_plasma_duration_mins: t.jet_plasma_duration_mins || 30,
                                tesla_chair_sessions: t.tesla_chair_sessions || 0,
                                tesla_chair_duration_mins: t.tesla_chair_duration_mins || 30,
                                prp_sessions: t.prp_sessions || 0,
                                price: t.price || 0,
                              });
                              setShowCosgynModal(true);
                            }}
                            className="px-2.5 py-1 text-xs text-primary hover:text-primary-mid font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCosgynTreatment(t.id, t.name)}
                            className="px-2.5 py-1 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

      <ServiceCatalogModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        editingServiceItem={editingServiceItem}
        serviceItemForm={serviceItemForm}
        setServiceItemForm={setServiceItemForm}
        hospitalBranches={hospitalBranches}
        onSubmit={handleSaveServiceItem}
      />
      <TreatmentPackageModal
        isOpen={showPackageModal}
        onClose={() => setShowPackageModal(false)}
        editingPackage={editingPackage}
        packageForm={packageForm}
        setPackageForm={setPackageForm}
        packageEditorMode={packageEditorMode}
        setPackageEditorMode={setPackageEditorMode}
        packageFormItems={packageFormItems}
        setPackageFormItems={setPackageFormItems}
        onSubmit={handleSavePackage}
      />
      <CosgynPackageModal
        isOpen={showCosgynModal}
        onClose={() => setShowCosgynModal(false)}
        editingCosgynTreatment={editingCosgynTreatment}
        cosgynForm={cosgynForm}
        setCosgynForm={setCosgynForm}
        onSubmit={handleSaveCosgynTreatment}
      />
    </>
  );
}
