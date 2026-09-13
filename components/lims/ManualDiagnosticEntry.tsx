'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { limsApi } from '@/lib/api';
import { Plus, X, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';

interface ManualDiagnosticEntryProps {
  patients: any[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  initialPatientId?: string;
}

export default function ManualDiagnosticEntry({ patients, onClose, onSuccess, initialPatientId }: ManualDiagnosticEntryProps) {
  const queryClient = useQueryClient();
  
  const [manualForm, setManualForm] = useState({
    patient_id: initialPatientId || '',
    test_name: '',
    category: 'Hematology',
    sample_id: '',
    param1_name: '',
    param1_val: '',
    param1_unit: '',
    param1_ref: '',
    param2_name: '',
    param2_val: '',
    param2_unit: '',
    param2_ref: '',
    param3_name: '',
    param3_val: '',
    param3_unit: '',
    param3_ref: '',
    notes: '',
  });

  useEffect(() => {
    if (initialPatientId) {
      setManualForm(prev => ({ ...prev, patient_id: initialPatientId }));
    } else if (patients.length > 0 && !manualForm.patient_id) {
      setManualForm(prev => ({ ...prev, patient_id: patients[0].id }));
    }
  }, [initialPatientId, patients]);

  const manualReportMutation = useMutation({
    mutationFn: () =>
      limsApi.createManualReport({
        patient_id: manualForm.patient_id,
        test_name: manualForm.test_name,
        category: manualForm.category,
        sample_id: manualForm.sample_id || undefined,
        pathologist_notes: manualForm.notes,
        observations: {
          [manualForm.param1_name]: { value: manualForm.param1_val, unit: manualForm.param1_unit, ref_range: manualForm.param1_ref },
          ...(manualForm.param2_name ? { [manualForm.param2_name]: { value: manualForm.param2_val, unit: manualForm.param2_unit, ref_range: manualForm.param2_ref } } : {}),
          ...(manualForm.param3_name ? { [manualForm.param3_name]: { value: manualForm.param3_val, unit: manualForm.param3_unit, ref_range: manualForm.param3_ref } } : {}),
        },
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['lims-worklist'] });
      onSuccess(data.message || 'Manual diagnostic report queued into LIMS worklist!');
      onClose();
    },
    onError: (err: any) => {
      import('@/contexts/ToastContext').then(({ toast }) => toast.error('Report Entry Failed', err.message || 'Failed to submit report'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-[rgb(var(--clr-primary)/0.08)] text-[rgb(var(--clr-primary))] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">New Diagnostic Lab Report Entry</h3>
              <p className="text-xs text-slate-500">Record manual bench results, hormonal assays or external lab documents</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Patient Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Search Patient *</label>
            <input
              type="text"
              list="limsPatientsList"
              placeholder="Type name or ID to search..."
              value={
                patients.find((p: any) => p.id === manualForm.patient_id)
                  ? `${patients.find((p: any) => p.id === manualForm.patient_id)?.name} (${patients.find((p: any) => p.id === manualForm.patient_id)?.mrn || patients.find((p: any) => p.id === manualForm.patient_id)?.vid})`
                  : manualForm.patient_id
              }
              onChange={(e) => {
                const match = patients.find((p: any) => `${p.name} (${p.mrn || p.vid})` === e.target.value);
                setManualForm({ ...manualForm, patient_id: match ? match.id : e.target.value });
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
            />
            <datalist id="limsPatientsList">
              {patients.map((p: any) => (
                <option key={p.id} value={`${p.name} (${p.mrn || p.vid})`} />
              ))}
            </datalist>
          </div>

          {/* Test Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Investigation / Test Name *</label>
            <input
              type="text"
              value={manualForm.test_name}
              onChange={(e) => setManualForm({ ...manualForm, test_name: e.target.value })}
              placeholder="e.g. Complete Blood Count (CBC) or AMH"
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[rgb(var(--clr-primary))]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Diagnostic Category</label>
            <select
              value={manualForm.category}
              onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs font-medium text-slate-900 focus:bg-white"
            >
              <option value="Hematology">Hematology</option>
              <option value="Biochemistry">Biochemistry / Hormones</option>
              <option value="Andrology">Andrology & Semen</option>
              <option value="Serology">Serology / Infectious</option>
              <option value="Pathology">Clinical Pathology</option>
            </select>
          </div>

          {/* Barcode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Sample Barcode (Optional)</label>
            <input
              type="text"
              value={manualForm.sample_id}
              onChange={(e) => setManualForm({ ...manualForm, sample_id: e.target.value })}
              placeholder="Leave empty to auto-generate"
              className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs font-mono text-slate-900 focus:bg-white"
            />
          </div>
        </div>

        {/* Test Parameters / Observations */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900">Quantitative Observation Parameters</h4>
          
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <input
              type="text"
              value={manualForm.param1_name}
              onChange={(e) => setManualForm({ ...manualForm, param1_name: e.target.value })}
              placeholder="Parameter"
              className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param1_val}
              onChange={(e) => setManualForm({ ...manualForm, param1_val: e.target.value })}
              placeholder="Value"
              className="font-bold text-[rgb(var(--clr-primary))] bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param1_unit}
              onChange={(e) => setManualForm({ ...manualForm, param1_unit: e.target.value })}
              placeholder="Unit"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param1_ref}
              onChange={(e) => setManualForm({ ...manualForm, param1_ref: e.target.value })}
              placeholder="Ref Range"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <input
              type="text"
              value={manualForm.param2_name}
              onChange={(e) => setManualForm({ ...manualForm, param2_name: e.target.value })}
              placeholder="Parameter 2"
              className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param2_val}
              onChange={(e) => setManualForm({ ...manualForm, param2_val: e.target.value })}
              placeholder="Value"
              className="font-bold text-[rgb(var(--clr-primary))] bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param2_unit}
              onChange={(e) => setManualForm({ ...manualForm, param2_unit: e.target.value })}
              placeholder="Unit"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param2_ref}
              onChange={(e) => setManualForm({ ...manualForm, param2_ref: e.target.value })}
              placeholder="Ref Range"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
            <input
              type="text"
              value={manualForm.param3_name}
              onChange={(e) => setManualForm({ ...manualForm, param3_name: e.target.value })}
              placeholder="Parameter 3"
              className="font-semibold bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param3_val}
              onChange={(e) => setManualForm({ ...manualForm, param3_val: e.target.value })}
              placeholder="Value"
              className="font-bold text-[rgb(var(--clr-primary))] bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param3_unit}
              onChange={(e) => setManualForm({ ...manualForm, param3_unit: e.target.value })}
              placeholder="Unit"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
            <input
              type="text"
              value={manualForm.param3_ref}
              onChange={(e) => setManualForm({ ...manualForm, param3_ref: e.target.value })}
              placeholder="Ref Range"
              className="bg-white border border-slate-200 rounded-lg p-1.5 w-full"
            />
          </div>
        </div>

        {/* Pathologist Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Technician / Pathologist Notes</label>
          <textarea
            rows={2}
            value={manualForm.notes}
            onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
            placeholder="Clinical notes or external lab reference remarks"
            className="w-full bg-slate-50 border border-slate-200 rounded-md p-2.5 text-xs text-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-md h-9 text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={() => manualReportMutation.mutate()}
            disabled={manualReportMutation.isPending || !manualForm.patient_id || !manualForm.test_name}
            className="bg-[rgb(var(--clr-primary))] hover:bg-[rgb(var(--clr-primary)/0.9)] text-white font-semibold h-9 rounded-md shadow-sm gap-1.5 text-xs"
          >
            {manualReportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>Submit to LIMS Worklist</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
