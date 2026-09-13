'use client';

import React, { useState } from 'react';
import { cryoApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CryoVitrifyModalProps {
  patients: any[];
  activeCycle: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function CryoVitrifyModal({ patients, activeCycle, onClose, onSaved }: CryoVitrifyModalProps) {
  const { user } = useAuth();
  const [vitrifyForm, setVitrifyForm] = useState({
    patient_id: '',
    straw_number: '',
    no_of_embryos: 1,
    tank_number: 'Tank 1 (Main Cryobank)',
    canister_number: 'Canister 1',
    canister_colour: 'Red',
    cane_number: 'Cane 1',
    goblet_position: 'Top Goblet',
    goblet_colour: 'Blue',
    cryo_device_colour: 'White',
    expiry_date: '',
    consent_form_reference: 'ART-FORM-15',
  });

  const handleVitrifyStraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await cryoApi.createSample({
        patient_id: vitrifyForm.patient_id || patients[0]?.id,
        treatment_cycle_id: activeCycle?.id,
        sample_type: 'embryo',
        straw_number: vitrifyForm.straw_number,
        tank_number: vitrifyForm.tank_number,
        canister_number: vitrifyForm.canister_number,
        canister_colour: vitrifyForm.canister_colour,
        goblet_colour: vitrifyForm.goblet_colour,
        cryo_device_colour: vitrifyForm.cryo_device_colour,
        no_of_embryos: vitrifyForm.no_of_embryos,
        embryologist_id: user.id,
        expiry_date: vitrifyForm.expiry_date,
        consent_form_reference: vitrifyForm.consent_form_reference,
      });
      alert('Straw vitrified and assigned physical cryo coordinates!');
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to vitrify straw');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-base text-slate-900">Vitrify Straw to Cryobank Coordinates</h3>
        <form onSubmit={handleVitrifyStraw} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Patient Search</label>
            <input
              type="text"
              list="cryoPatientsList"
              placeholder="Type name or ID to search..."
              value={
                patients.find((p) => p.id === vitrifyForm.patient_id)
                  ? `${patients.find((p) => p.id === vitrifyForm.patient_id)?.name} (${patients.find((p) => p.id === vitrifyForm.patient_id)?.vid})`
                  : vitrifyForm.patient_id
              }
              onChange={(e) => {
                const match = patients.find((p) => `${p.name} (${p.vid})` === e.target.value);
                setVitrifyForm({ ...vitrifyForm, patient_id: match ? match.id : e.target.value });
              }}
              required
              className="vmd-input text-xs w-full"
            />
            <datalist id="cryoPatientsList">
              {patients.map((p) => (
                <option key={p.id} value={`${p.name} (${p.vid})`} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Straw Identifier #</label>
              <input
                type="text"
                value={vitrifyForm.straw_number}
                onChange={(e) => setVitrifyForm({ ...vitrifyForm, straw_number: e.target.value })}
                required
                className="vmd-input text-xs font-mono font-bold text-[rgb(var(--clr-primary))] w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Embryo Count</label>
              <input
                type="number"
                value={vitrifyForm.no_of_embryos}
                onChange={(e) => setVitrifyForm({ ...vitrifyForm, no_of_embryos: parseInt(e.target.value) || 1 })}
                min={1}
                className="vmd-input text-xs w-full"
              />
            </div>
          </div>

          {/* Physical Cryobank Coordinates */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="text-[11px] font-bold uppercase text-slate-700 tracking-wider block">
              Physical Biological Coordinates (LN2 Storage)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Storage Tank</label>
                <select
                  value={vitrifyForm.tank_number}
                  onChange={(e) => setVitrifyForm({ ...vitrifyForm, tank_number: e.target.value })}
                  className="vmd-input text-xs font-bold text-slate-900 bg-white w-full"
                >
                  <option value="Tank 1 (Main Cryobank)">Tank 1 — Main Cryobank (Auto LN2)</option>
                  <option value="Tank 2 (Donor Bank)">Tank 2 — Donor Gamete Bank (Lock)</option>
                  <option value="Tank 3 (Quarantine/Infectious)">Tank 3 — Quarantine / Infectious</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Canister</label>
                <select
                  value={vitrifyForm.canister_number}
                  onChange={(e) => {
                    const val = e.target.value;
                    const colorMap: Record<string, string> = {
                      'Canister 1': 'Red',
                      'Canister 2': 'Blue',
                      'Canister 3': 'Green',
                      'Canister 4': 'Yellow',
                      'Canister 5': 'White',
                    };
                    setVitrifyForm({
                      ...vitrifyForm,
                      canister_number: val,
                      canister_colour: colorMap[val] || 'Red',
                    });
                  }}
                  className="vmd-input text-xs font-bold text-slate-800 bg-white w-full"
                >
                  <option value="Canister 1">Canister 1 (Red Band)</option>
                  <option value="Canister 2">Canister 2 (Blue Band)</option>
                  <option value="Canister 3">Canister 3 (Green Band)</option>
                  <option value="Canister 4">Canister 4 (Yellow Band)</option>
                  <option value="Canister 5">Canister 5 (White Band)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Cane #</label>
                <select
                  value={vitrifyForm.cane_number}
                  onChange={(e) => setVitrifyForm({ ...vitrifyForm, cane_number: e.target.value })}
                  className="vmd-input text-xs font-mono font-bold bg-white w-full"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={`Cane ${n}`}>Cane {n}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Goblet Position</label>
                <select
                  value={vitrifyForm.goblet_position}
                  onChange={(e) => setVitrifyForm({ ...vitrifyForm, goblet_position: e.target.value })}
                  className="vmd-input text-xs font-bold bg-white w-full"
                >
                  <option value="Top Goblet">Top Goblet</option>
                  <option value="Bottom Goblet">Bottom Goblet</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Goblet Color</label>
                <select
                  value={vitrifyForm.goblet_colour}
                  onChange={(e) => setVitrifyForm({ ...vitrifyForm, goblet_colour: e.target.value })}
                  className="vmd-input text-xs font-bold bg-white w-full"
                >
                  <option value="Blue">Blue</option>
                  <option value="Red">Red</option>
                  <option value="Yellow">Yellow</option>
                  <option value="Green">Green</option>
                  <option value="White">White</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Straw Device Color</label>
                <select
                  value={vitrifyForm.cryo_device_colour}
                  onChange={(e) => setVitrifyForm({ ...vitrifyForm, cryo_device_colour: e.target.value })}
                  className="vmd-input text-xs font-bold bg-white w-full"
                >
                  <option value="White">White Straw</option>
                  <option value="Blue">Blue Straw</option>
                  <option value="Red">Red Straw</option>
                  <option value="Yellow">Yellow Straw</option>
                  <option value="Green">Green Straw</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Canister Color Tag</label>
                <span className="inline-block w-full py-1.5 px-3 bg-white border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                  {vitrifyForm.canister_colour}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Consent Expiry Date</label>
              <input
                type="date"
                value={vitrifyForm.expiry_date}
                onChange={(e) => setVitrifyForm({ ...vitrifyForm, expiry_date: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">ART Form Reference</label>
              <input
                type="text"
                value={vitrifyForm.consent_form_reference}
                onChange={(e) => setVitrifyForm({ ...vitrifyForm, consent_form_reference: e.target.value })}
                className="vmd-input text-xs w-full"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-3 bg-[rgb(var(--clr-primary))] text-white font-bold text-xs rounded-md hover:bg-[rgb(var(--clr-primary)/0.9)]">
              Save Cryo Coordinates
            </button>
            <button type="button" onClick={onClose} className="px-4 py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
