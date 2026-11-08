'use client';

import React, { useState } from 'react';
import { Settings, Plus, BedDouble, Wrench, Trash2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { ipdApi } from '@/features/ipd/api';
import { toast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/lib/utils';
import type { Ward, Bed } from '@/features/ipd/types';

interface WardBedManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  wards: Ward[];
  beds: Bed[];
  onRefresh: () => void;
}

export default function WardBedManagementModal({
  isOpen,
  onClose,
  wards,
  beds,
  onRefresh,
}: WardBedManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'wards' | 'beds'>('wards');
  const [selectedWardId, setSelectedWardId] = useState<string>(wards[0]?.id || '');

  // Add Ward Form
  const [isAddingWard, setIsAddingWard] = useState(false);
  const [wardName, setWardName] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardDept, setWardDept] = useState('General IPD');
  const [wardRate, setWardRate] = useState('2000');
  const [wardBedCount, setWardBedCount] = useState('6');

  // Add Bed Form
  const [isAddingBed, setIsAddingBed] = useState(false);
  const [bedNumber, setBedNumber] = useState('');
  const [bedType, setBedType] = useState('Standard');
  const [bedDailyRate, setBedDailyRate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWard = wards.find((w) => w.id === selectedWardId) || wards[0];
  const wardBeds = beds.filter((b) => b.ward_id === (selectedWard?.id || ''));

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardName || !wardCode) {
      toast.error('Validation Error', 'Ward name and code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ipdApi.createWard({
        name: wardName,
        code: wardCode.toUpperCase(),
        department: wardDept,
        base_charge_per_day: Number(wardRate) || 2000,
        total_beds: Number(wardBedCount) || 5,
      });
      toast.success('Ward Created', `Created ${wardName} with ${wardBedCount} initial beds.`);
      onRefresh();
      setIsAddingWard(false);
      setWardName('');
      setWardCode('');
    } catch (err: any) {
      toast.error('Failed to create ward', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWard || !bedNumber) {
      toast.error('Validation Error', 'Please select a ward and specify a bed number.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ipdApi.createBed({
        ward_id: selectedWard.id,
        bed_number: bedNumber,
        bed_type: bedType,
        daily_rate: bedDailyRate ? Number(bedDailyRate) : selectedWard.base_charge_per_day,
        status: 'Vacant',
      });
      toast.success('Bed Created', `Bed ${bedNumber} added to ${selectedWard.name}.`);
      onRefresh();
      setIsAddingBed(false);
      setBedNumber('');
      setBedDailyRate('');
    } catch (err: any) {
      toast.error('Failed to create bed', err?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMaintenance = async (bed: Bed) => {
    const newStatus = bed.status === 'Maintenance' ? 'Vacant' : 'Maintenance';
    try {
      await ipdApi.updateBedStatus(bed.id, newStatus);
      toast.success('Status Updated', `Bed ${bed.bed_number} set to ${newStatus}.`);
      onRefresh();
    } catch (err: any) {
      toast.error('Error', err?.message);
    }
  };

  const handleDeleteBed = async (bed: Bed) => {
    if (bed.status === 'Occupied') {
      toast.error('Cannot Delete', 'Cannot delete an occupied bed.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently remove Bed ${bed.bed_number}?`)) return;

    try {
      await ipdApi.deleteBed(bed.id);
      toast.success('Bed Removed', `Bed ${bed.bed_number} deleted.`);
      onRefresh();
    } catch (err: any) {
      toast.error('Error', err?.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Settings className="w-5 h-5 text-slate-700" />
            <span>Ward & Inpatient Bed Configuration</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Add wards, calibrate daily room tariffs, configure bed units, and toggle maintenance states.
          </DialogDescription>

          <div className="flex gap-2 pt-3">
            <button
              onClick={() => setActiveTab('wards')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'wards' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Wards Overview ({wards.length})
            </button>
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'beds' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bed Allocation ({beds.length} Total)
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {/* TAB 1: WARDS */}
          {activeTab === 'wards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Hospital Wards & Units</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingWard(!isAddingWard)}
                  className="h-7 text-xs font-semibold gap-1 text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingWard ? 'Cancel' : 'Add New Ward'}</span>
                </Button>
              </div>

              {isAddingWard && (
                <form onSubmit={handleCreateWard} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="font-bold text-slate-800 block text-xs">Create Inpatient Ward</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Ward Name *</label>
                      <Input
                        placeholder="e.g. Intensive Care Unit"
                        value={wardName}
                        onChange={(e) => setWardName(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Ward Code *</label>
                      <Input
                        placeholder="e.g. ICU"
                        value={wardCode}
                        onChange={(e) => setWardCode(e.target.value)}
                        className="h-8 text-xs font-mono uppercase"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
                      <Input
                        placeholder="e.g. Critical Care"
                        value={wardDept}
                        onChange={(e) => setWardDept(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Base Rate / Day (₹)</label>
                      <Input
                        type="number"
                        placeholder="3500"
                        value={wardRate}
                        onChange={(e) => setWardRate(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Auto-Generate Beds</label>
                      <Input
                        type="number"
                        placeholder="8"
                        value={wardBedCount}
                        onChange={(e) => setWardBedCount(e.target.value)}
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingWard(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting} className="bg-slate-900 text-white font-bold">
                      {isSubmitting ? 'Creating...' : 'Save Ward'}
                    </Button>
                  </div>
                </form>
              )}

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {wards.map((ward) => {
                  const bCount = beds.filter((b) => b.ward_id === ward.id).length;
                  const occCount = beds.filter((b) => b.ward_id === ward.id && b.status === 'Occupied').length;
                  return (
                    <div key={ward.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{ward.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {ward.code}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {ward.department || 'General IPD'} · Base Tariff: {formatCurrency(ward.base_charge_per_day)}/day
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-semibold text-slate-600">
                          {occCount} / {bCount} Occupied
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedWardId(ward.id);
                            setActiveTab('beds');
                          }}
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Manage Beds ➔
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BEDS */}
          {activeTab === 'beds' && (
            <div className="space-y-4">
              {/* Select Ward */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {wards.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWardId(w.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        selectedWard?.id === w.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddingBed(!isAddingBed)}
                  className="h-7 text-xs font-semibold shrink-0 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingBed ? 'Cancel' : 'Add Bed'}</span>
                </Button>
              </div>

              {isAddingBed && (
                <form onSubmit={handleCreateBed} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="font-bold text-slate-800 block text-xs">
                    Add Bed to {selectedWard?.name || 'Selected Ward'}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bed Number *</label>
                      <Input
                        placeholder="e.g. ICU-09"
                        value={bedNumber}
                        onChange={(e) => setBedNumber(e.target.value)}
                        className="h-8 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bed Type</label>
                      <select
                        value={bedType}
                        onChange={(e) => setBedType(e.target.value)}
                        className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Semi-Private">Semi-Private</option>
                        <option value="Deluxe">Deluxe Private</option>
                        <option value="ICU">ICU / Ventilator</option>
                        <option value="Isolation">Isolation</option>
                        <option value="Daycare">Daycare / Post-Op</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Daily Rate (₹)</label>
                      <Input
                        type="number"
                        placeholder={`Default: ₹${selectedWard?.base_charge_per_day || 2000}`}
                        value={bedDailyRate}
                        onChange={(e) => setBedDailyRate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingBed(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={isSubmitting} className="bg-indigo-600 text-white font-bold">
                      {isSubmitting ? 'Adding...' : 'Confirm Add Bed'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Beds Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-2.5">Bed #</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Rate / Day</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {wardBeds.map((bed) => {
                      const isOccupied = bed.status === 'Occupied';
                      const isMaint = bed.status === 'Maintenance';
                      return (
                        <tr key={bed.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold font-mono text-slate-900">{bed.bed_number}</td>
                          <td className="p-2.5 text-slate-600">{bed.bed_type || 'Standard'}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{formatCurrency(bed.daily_rate || 2000)}</td>
                          <td className="p-2.5">
                            <Badge
                              variant={isOccupied ? 'destructive' : isMaint ? 'warning' : 'success'}
                              className="text-[10px] uppercase font-bold"
                            >
                              {bed.status}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isOccupied && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleToggleMaintenance(bed)}
                                  className="h-7 px-2 text-xs text-amber-700 hover:bg-amber-50 gap-1"
                                  title={isMaint ? 'Mark as Vacant' : 'Set Under Maintenance'}
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                  <span>{isMaint ? 'Clear Maint' : 'Maintenance'}</span>
                                </Button>
                              )}
                              {!isOccupied && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBed(bed)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600"
                                  title="Delete Bed"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
