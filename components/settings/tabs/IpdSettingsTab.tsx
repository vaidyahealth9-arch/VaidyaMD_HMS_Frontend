'use client';

import React, { useState } from 'react';
import { ipdApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, BedDouble } from 'lucide-react';
import WardModal from '../modals/WardModal';
import BedModal from '../modals/BedModal';

interface IpdSettingsTabProps {
  wards: any[];
  setWards: React.Dispatch<React.SetStateAction<any[]>>;
  beds: any[];
  setBeds: React.Dispatch<React.SetStateAction<any[]>>;
  hospitalBranches?: any[];
}

export default function IpdSettingsTab({
  wards,
  setWards,
  beds,
  setBeds,
  hospitalBranches = [],
}: IpdSettingsTabProps) {
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [showWardModal, setShowWardModal] = useState(false);
  const [editingWard, setEditingWard] = useState<any>(null);
  const [wardFormName, setWardFormName] = useState('');
  const [wardFormCode, setWardFormCode] = useState('');
  const [wardFormDept, setWardFormDept] = useState('General IPD');
  const [wardFormRate, setWardFormRate] = useState<number>(0);
  const [wardFormBeds, setWardFormBeds] = useState<number>(1);

  const [showBedModal, setShowBedModal] = useState(false);
  const [editingBed, setEditingBed] = useState<any>(null);
  const [bedFormWardId, setBedFormWardId] = useState('');
  const [bedFormNumber, setBedFormNumber] = useState('');
  const [bedFormType, setBedFormType] = useState('Standard');
  const [bedFormRate, setBedFormRate] = useState<number>(0);
  const [bedFormStatus, setBedFormStatus] = useState('Vacant');

  const handleSaveWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWard) {
        await ipdApi.updateWard(editingWard.id, {
          name: wardFormName,
          department: wardFormDept,
          base_charge_per_day: Number(wardFormRate),
        });
      } else {
        await ipdApi.createWard({
          name: wardFormName,
          code: wardFormCode.toUpperCase(),
          department: wardFormDept,
          base_charge_per_day: Number(wardFormRate),
          total_beds: Number(wardFormBeds),
          branch_id: hospitalBranches?.[0]?.id || null,
        });
      }
      setShowWardModal(false);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to save ward');
    }
  };

  const handleDeleteWard = async (wardId: string) => {
    if (!confirm('Are you sure you want to deactivate this ward?')) return;
    try {
      await ipdApi.deleteWard(wardId);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to deactivate ward');
    }
  };

  const handleSaveBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!bedFormWardId) {
        alert('Please select a ward for the bed');
        return;
      }
      if (editingBed) {
        await ipdApi.updateBed(editingBed.id, {
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: Number(bedFormRate),
          status: bedFormStatus,
        });
      } else {
        await ipdApi.createBed({
          ward_id: bedFormWardId,
          bed_number: bedFormNumber,
          bed_type: bedFormType,
          daily_rate: Number(bedFormRate),
          status: bedFormStatus,
        });
      }
      setShowBedModal(false);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to save bed');
    }
  };

  const handleDeleteBed = async (bedId: string) => {
    if (!confirm('Are you sure you want to delete this bed?')) return;
    try {
      await ipdApi.deleteBed(bedId);
      const [w, b] = await Promise.all([ipdApi.listWards(), ipdApi.listBeds()]);
      setWards(Array.isArray(w) ? w : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete bed');
    }
  };


  return (
    <>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Filter by Ward:</span>
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="all">All Wards ({wards.length})</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingWard(null);
                  setWardFormName('');
                  setWardFormCode('');
                  setWardFormDept('General IPD');
                  setWardFormRate(2500);
                  setWardFormBeds(4);
                  setShowWardModal(true);
                }}
                className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ward
              </button>
              <button
                onClick={() => {
                  setEditingBed(null);
                  setBedFormWardId(selectedWardFilter !== 'all' ? selectedWardFilter : (wards[0]?.id || ''));
                  setBedFormNumber('');
                  setBedFormType('standard_manual');
                  const currentW = wards.find((w) => w.id === (selectedWardFilter !== 'all' ? selectedWardFilter : wards[0]?.id));
                  setBedFormRate(currentW?.base_charge_per_day || 2500);
                  setBedFormStatus('Vacant');
                  setShowBedModal(true);
                }}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-mid text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Bed
              </button>
            </div>
          </div>

          {/* Wards Management Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">Inpatient Wards Directory</span>
              <span className="text-[11px] text-slate-500 font-medium">{wards.length} Wards Configured</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ward Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Base Tariff</th>
                  <th className="py-2.5 px-3 text-center">Beds</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                      No wards configured yet. Click &quot;+ Add Ward&quot; above to create a ward.
                    </td>
                  </tr>
                ) : (
                  wards.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{w.name}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-primary font-semibold">{w.code}</td>
                      <td className="py-2 px-3 text-slate-600">{w.department || 'General IPD'}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-800">{formatCurrency(w.base_charge_per_day || 2500)}/day</td>
                      <td className="py-2 px-3 text-center font-bold text-slate-700">{w.total_beds || 0}</td>
                      <td className="py-2 px-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingWard(w);
                            setWardFormName(w.name);
                            setWardFormCode(w.code);
                            setWardFormDept(w.department || 'General IPD');
                            setWardFormRate(w.base_charge_per_day || 2500);
                            setWardFormBeds(w.total_beds || 0);
                            setShowWardModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded inline-block"
                          title="Edit Ward"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWard(w.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded inline-block"
                          title="Deactivate Ward"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Beds Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Hospital Beds Grid ({beds.filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter).length} Beds)
              </h4>
            </div>

            {beds.filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter).length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs italic">
                No beds found for this selection. Click &quot;+ Add Bed&quot; above to create a bed.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {beds
                  .filter((b) => selectedWardFilter === 'all' || b.ward_id === selectedWardFilter)
                  .map((b) => {
                    const isVac = b.status === 'Vacant' || b.status?.toLowerCase() === 'available';
                    const isOcc = b.status === 'Occupied';
                    return (
                      <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-xs">{b.bed_number}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              isVac
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOcc
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isVac ? 'Vacant' : b.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          <div className="capitalize">{b.bed_type || b.type || 'Standard'}</div>
                          <div className="font-mono font-semibold text-slate-800">{formatCurrency(b.daily_rate || 2500)}/day</div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100 flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingBed(b);
                              setBedFormWardId(b.ward_id);
                              setBedFormNumber(b.bed_number);
                              setBedFormType(b.bed_type || 'standard_manual');
                              setBedFormRate(b.daily_rate || 2500);
                              setBedFormStatus(b.status || 'Vacant');
                              setShowBedModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title="Edit Bed"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteBed(b.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete Bed"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

      <WardModal
        isOpen={showWardModal}
        onClose={() => setShowWardModal(false)}
        editingWard={editingWard}
        wardFormName={wardFormName}
        setWardFormName={setWardFormName}
        wardFormCode={wardFormCode}
        setWardFormCode={setWardFormCode}
        wardFormDept={wardFormDept}
        setWardFormDept={setWardFormDept}
        wardFormRate={wardFormRate}
        setWardFormRate={setWardFormRate}
        wardFormBeds={wardFormBeds}
        setWardFormBeds={setWardFormBeds}
        onSubmit={handleSaveWard}
      />
      <BedModal
        isOpen={showBedModal}
        onClose={() => setShowBedModal(false)}
        editingBed={editingBed}
        wards={wards}
        bedFormWardId={bedFormWardId}
        setBedFormWardId={setBedFormWardId}
        bedFormNumber={bedFormNumber}
        setBedFormNumber={setBedFormNumber}
        bedFormType={bedFormType}
        setBedFormType={setBedFormType}
        bedFormRate={bedFormRate}
        setBedFormRate={setBedFormRate}
        bedFormStatus={bedFormStatus}
        setBedFormStatus={setBedFormStatus}
        onSubmit={handleSaveBed}
      />
    </>
  );
}
