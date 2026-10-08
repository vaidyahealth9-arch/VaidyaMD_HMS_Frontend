'use client';

import React, { useState } from 'react';
import { limsApi, cryoApi, templatesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, FlaskConical, Dna } from 'lucide-react';
import LimsTestModal from '../modals/LimsTestModal';
import CryoTankModal from '../modals/CryoTankModal';

interface LabsSettingsTabProps {
  limsTests: any[];
  setLimsTests: React.Dispatch<React.SetStateAction<any[]>>;
  cryoTankMap: any;
  setCryoTankMap: React.Dispatch<React.SetStateAction<any>>;
}

export default function LabsSettingsTab({
  limsTests,
  setLimsTests,
  cryoTankMap,
  setCryoTankMap,
}: LabsSettingsTabProps) {
  const [labSubTab, setLabSubTab] = useState<'lims' | 'cryo'>('lims');
  const [showLimsModal, setShowLimsModal] = useState(false);
  const [editingLimsTest, setEditingLimsTest] = useState<any>(null);
  const [limsForm, setLimsForm] = useState({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });

  const [cryoTanks, setCryoTanks] = useState<any[]>([]);
  const [showCryoTankModal, setShowCryoTankModal] = useState(false);
  const [editingCryoTank, setEditingCryoTank] = useState<any>(null);
  const [cryoTankForm, setCryoTankForm] = useState({ tank_name: '', tank_code: '', tank_type: 'Autologous Embryos', canister_count: 6, capacity_litres: 35, location: 'IVF Cleanroom Cryo Suite A' });

  const handleSaveLimsTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = limsForm.test_code.toUpperCase().replace(/\s+/g, '-');
      const schemaData = {
        test_name: limsForm.test_name,
        test_code: code,
        category: limsForm.category,
        sample_type: limsForm.sample_type,
        tat_hours: Number(limsForm.tat_hours),
        parameters: [
          {
            name: limsForm.test_name,
            unit: limsForm.unit || '',
            ref_range: limsForm.ref_range,
          },
        ],
      };
      if (editingLimsTest) {
        await templatesApi.update(editingLimsTest.id, {
          title: limsForm.test_name,
          description: `${limsForm.category} | Sample: ${limsForm.sample_type} | TAT: ${limsForm.tat_hours}h | Code: ${code}`,
          schema_json: schemaData,
        });
        alert('LIMS test template updated!');
      } else {
        await templatesApi.create({
          plugin_id: 'lims',
          record_type: `lims_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: limsForm.test_name,
          description: `${limsForm.category} | Sample: ${limsForm.sample_type} | TAT: ${limsForm.tat_hours}h | Code: ${code}`,
          schema_json: schemaData,
        });
        alert('LIMS test template created!');
      }
      setShowLimsModal(false);
      setEditingLimsTest(null);
      setLimsForm({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });
      templatesApi.list('lims').then((res: any) => setLimsTests(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save LIMS test');
    }
  };

  const handleDeleteLimsTest = async (testId: string) => {
    if (!confirm('Are you sure you want to deactivate this LIMS test template?')) return;
    try {
      await templatesApi.update(testId, { is_active: false });
      alert('LIMS test template deactivated!');
      templatesApi.list('lims').then((res: any) => setLimsTests(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate LIMS test');
    }
  };

  // Cryo Tank CRUD Handlers
  const handleSaveCryoTank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const code = cryoTankForm.tank_code.toUpperCase().replace(/\s+/g, '-');
      const schemaData = {
        tank_name: cryoTankForm.tank_name,
        tank_code: code,
        tank_type: cryoTankForm.tank_type,
        location: cryoTankForm.location,
        canister_count: Number(cryoTankForm.canister_count),
        capacity_litres: Number(cryoTankForm.capacity_litres),
        canister_colours: ['Red', 'Blue', 'Green', 'Yellow', 'White', 'Orange'],
        supported_device_types: ['Cryotop', 'CryoLock', 'CBS Straw'],
      };
      if (editingCryoTank) {
        await templatesApi.update(editingCryoTank.id, {
          title: cryoTankForm.tank_name,
          description: `${cryoTankForm.tank_type} | ${cryoTankForm.capacity_litres}L | ${cryoTankForm.location} | ${cryoTankForm.canister_count} Canisters`,
          schema_json: schemaData,
        });
        alert('Cryo tank storage updated!');
      } else {
        await templatesApi.create({
          plugin_id: 'fertility_cryo',
          record_type: `cryo_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          title: cryoTankForm.tank_name,
          description: `${cryoTankForm.tank_type} | ${cryoTankForm.capacity_litres}L | ${cryoTankForm.location} | ${cryoTankForm.canister_count} Canisters`,
          schema_json: schemaData,
        });
        alert('Cryo tank storage created!');
      }
      setShowCryoTankModal(false);
      setEditingCryoTank(null);
      setCryoTankForm({ tank_name: '', tank_code: '', tank_type: 'Autologous Embryos', canister_count: 6, capacity_litres: 35, location: 'IVF Cleanroom Cryo Suite A' });
      templatesApi.list('fertility_cryo').then((res: any) => setCryoTanks(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to save Cryo tank');
    }
  };

  const handleDeleteCryoTank = async (tankId: string) => {
    if (!confirm('Are you sure you want to deactivate this Cryo tank?')) return;
    try {
      await templatesApi.update(tankId, { is_active: false });
      alert('Cryo tank deactivated!');
      templatesApi.list('fertility_cryo').then((res: any) => setCryoTanks(Array.isArray(res) ? res : []));
    } catch (e: any) {
      alert(e.message || 'Failed to deactivate Cryo tank');
    }
  };


  return (
    <>
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <button
                onClick={() => setLabSubTab('lims')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  labSubTab === 'lims' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                LIMS Diagnostic Directory
              </button>
              <button
                onClick={() => setLabSubTab('cryo')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg ${
                  labSubTab === 'cryo' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Cryobank LN2 Storage Infrastructure
              </button>
            </div>
          </div>

          {labSubTab === 'lims' ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">LIMS Diagnostic Directory & Reference Intervals</h3>
                  <p className="text-[11px] text-slate-500">Analyzer test templates, normal ranges, and turnaround times ({limsTests.length} tests)</p>
                </div>
                <button
                  onClick={() => {
                    setEditingLimsTest(null);
                    setLimsForm({ test_name: '', test_code: '', category: 'Biochemistry', sample_type: 'Serum', tat_hours: 4, ref_range: '', unit: '' });
                    setShowLimsModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add LIMS Test
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(limsTests.length > 0 ? limsTests : [
                  { id: '1', title: 'Serum Beta-hCG (Rapid)', schema_json: { test_code: 'LAB-HCG', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 3, parameters: [{ ref_range: '< 5.0 mIU/mL' }] } },
                  { id: '2', title: 'Anti-Müllerian Hormone (AMH)', schema_json: { test_code: 'LAB-AMH', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 6, parameters: [{ ref_range: '1.5 - 4.0 ng/mL' }] } },
                  { id: '3', title: 'Serum Estradiol (E2)', schema_json: { test_code: 'LAB-E2', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 4, parameters: [{ ref_range: '20 - 400 pg/mL' }] } },
                  { id: '4', title: 'Thyroid Profile (TSH & FT4)', schema_json: { test_code: 'LAB-THY', sample_type: 'Serum', category: 'Biochemistry', tat_hours: 4, parameters: [{ ref_range: '0.4 - 2.5 mIU/L' }] } },
                  { id: '5', title: 'Semen Analysis (WHO 6th)', schema_json: { test_code: 'AND-SEMEN', sample_type: 'Semen', category: 'Andrology', tat_hours: 2, parameters: [{ ref_range: '> 15 M/mL, > 40% Motility' }] } },
                ]).map((t: any) => {
                  const s = t.schema_json || {};
                  const param = (s.parameters && s.parameters[0]) || {};
                  return (
                    <div key={t.id || s.test_code} className="p-3.5 border border-slate-200 rounded-xl space-y-2 bg-slate-50/50 hover:bg-white transition-all shadow-2xs">
                      <div className="flex justify-between items-start font-bold text-xs text-slate-900">
                        <span className="truncate max-w-[170px]">{t.title || s.test_name}</span>
                        <span className="font-mono text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {s.test_code || 'LAB'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Normal: <span className="font-semibold text-slate-800">{param.ref_range || s.ref_range || 'Clinical normal'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Specimen: {s.sample_type || 'Serum'} · TAT: {s.tat_hours || 4}h</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingLimsTest(t);
                              setLimsForm({
                                test_name: t.title || s.test_name || '',
                                test_code: s.test_code || '',
                                category: s.category || 'Biochemistry',
                                sample_type: s.sample_type || 'Serum',
                                tat_hours: s.tat_hours || 4,
                                ref_range: param.ref_range || s.ref_range || '',
                                unit: param.unit || '',
                              });
                              setShowLimsModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded"
                            title="Edit Test"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLimsTest(t.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Deactivate Test"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cryopreservation LN2 Tanks & Canister Matrix</h3>
                  <p className="text-[11px] text-slate-500">Cryogenic liquid nitrogen containers ({cryoTanks.length || 4} tanks configured)</p>
                </div>
                <button
                  onClick={() => {
                    setEditingCryoTank(null);
                    setCryoTankForm({
                      tank_name: '',
                      tank_code: `TANK-0${cryoTanks.length + 1}`,
                      tank_type: 'Autologous Embryos',
                      canister_count: 6,
                      capacity_litres: 35,
                      location: 'IVF Cleanroom Cryo Suite A',
                    });
                    setShowCryoTankModal(true);
                  }}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cryo Tank
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(cryoTanks.length > 0 ? cryoTanks : [
                  { id: '1', title: 'Tank 1 — Main Autologous Embryo Bank', schema_json: { tank_code: 'TANK-01', tank_type: 'Autologous Embryos', capacity_litres: 47, canister_count: 6, location: 'Suite A' } },
                  { id: '2', title: 'Tank 2 — Autologous Sperm & TESA Bank', schema_json: { tank_code: 'TANK-02', tank_type: 'Autologous Gametes', capacity_litres: 35, canister_count: 6, location: 'Suite A' } },
                  { id: '3', title: 'Tank 3 — Certified ART Donor Bank', schema_json: { tank_code: 'TANK-03', tank_type: 'Donor Gametes', capacity_litres: 35, canister_count: 6, location: 'Vault B' } },
                ]).map((tank: any, idx: number) => {
                  const s = tank.schema_json || {};
                  return (
                    <div key={tank.id || idx} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-start font-bold text-xs text-slate-900">
                        <div>
                          <span className="block truncate max-w-[180px]">{tank.title || s.tank_name}</span>
                          <span className="text-[10px] font-mono text-primary font-semibold">{s.tank_code || `LN2-0${idx + 1}`}</span>
                        </div>
                        <span className="text-emerald-700 text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold shrink-0">
                          -196°C LN2
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {s.canister_count || 6} Canisters · {s.capacity_litres || 35}L · {s.location || 'IVF Cleanroom'}
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                        <div className="bg-accent h-2 rounded-full" style={{ width: `${Math.min(90, (idx + 1) * 28)}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>{s.tank_type || 'Cryo Storage'}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCryoTank(tank);
                              setCryoTankForm({
                                tank_name: tank.title || s.tank_name || '',
                                tank_code: s.tank_code || '',
                                tank_type: s.tank_type || 'Autologous Embryos',
                                canister_count: s.canister_count || 6,
                                capacity_litres: s.capacity_litres || 35,
                                location: s.location || 'IVF Cleanroom Cryo Suite A',
                              });
                              setShowCryoTankModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-primary rounded"
                            title="Edit Tank"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteCryoTank(tank.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Deactivate Tank"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      <LimsTestModal
        isOpen={showLimsModal}
        onClose={() => setShowLimsModal(false)}
        editingLimsTest={editingLimsTest}
        limsForm={limsForm}
        setLimsForm={setLimsForm}
        onSubmit={handleSaveLimsTest}
      />
      <CryoTankModal
        isOpen={showCryoTankModal}
        onClose={() => setShowCryoTankModal(false)}
        editingCryoTank={editingCryoTank}
        cryoTankForm={cryoTankForm}
        setCryoTankForm={setCryoTankForm}
        onSubmit={handleSaveCryoTank}
      />
    </>
  );
}
