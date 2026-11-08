'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Printer, CheckCircle2, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import PrintableModal from '@/components/common/PrintableModal';
import PrintableReportHeader from '@/components/common/PrintableReportHeader';
import PrintableReportFooter from '@/components/common/PrintableReportFooter';
import A4Sheet from '@/components/common/A4Sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ipdApi } from '@/features/ipd/api';
import { pharmacyApi } from '@/lib/api';
import PharmacyItemSearchDropdown from '@/components/common/PharmacyItemSearchDropdown';
import { toast } from '@/contexts/ToastContext';
import type { AdmissionDetails, DischargeSummary } from '@/features/ipd/types';

interface ClinicalDischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: AdmissionDetails | any;
  onProceedToBilling: (summary: DischargeSummary) => void;
  onSuccess: () => void;
}

export default function ClinicalDischargeModal({
  isOpen,
  onClose,
  admission,
  onProceedToBilling,
  onSuccess,
}: ClinicalDischargeModalProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'preview'>('document');
  const [dischargeType, setDischargeType] = useState<any>('Normal');
  const [condition, setCondition] = useState<any>('Stable');
  const [diagnosis, setDiagnosis] = useState('');
  const [hospitalCourse, setHospitalCourse] = useState('');
  const [dietaryAdvice, setDietaryAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');

  // Discharge Medications
  const [medications, setMedications] = useState<Array<{
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);

  useEffect(() => {
    if (admission) {
      setDiagnosis(admission.diagnosis || '');
      const existing = admission.discharge_summary || {};
      if (existing.discharge_type) setDischargeType(existing.discharge_type);
      if (existing.condition_at_discharge) setCondition(existing.condition_at_discharge);
      if (existing.hospital_course) setHospitalCourse(existing.hospital_course);
      if (existing.dietary_advice) setDietaryAdvice(existing.dietary_advice);
      if (existing.follow_up_date) setFollowUpDate(existing.follow_up_date);
      if (existing.follow_up_instructions) setFollowUpInstructions(existing.follow_up_instructions);
      if (Array.isArray(existing.discharge_medications) && existing.discharge_medications.length > 0) {
        setMedications(existing.discharge_medications);
      } else {
        setMedications([
          { medicine_name: 'Tab. Paracetamol 650mg', frequency: 'SOS', duration: '3 days', instructions: 'After food for pain/fever' },
        ]);
      }
    }
  }, [admission]);

  const handleAddMedication = () => {
    setMedications([...medications, { medicine_name: '', dosage: '', frequency: 'BD', duration: '5 days', instructions: 'After food' }]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: string, val: string) => {
    const updated = [...medications];
    (updated[index] as any)[field] = val;
    setMedications(updated);
  };

  const buildSummaryObject = (): DischargeSummary => ({
    discharge_type: dischargeType,
    condition_at_discharge: condition,
    discharge_diagnosis: diagnosis,
    hospital_course: hospitalCourse,
    discharge_medications: medications,
    dietary_advice: dietaryAdvice,
    follow_up_date: followUpDate,
    follow_up_instructions: followUpInstructions,
  });

  const handleSaveDraft = async () => {
    if (!admission?.id) return;
    setIsSaving(true);
    try {
      await ipdApi.saveDischargeSummary(admission.id, buildSummaryObject());
      toast.success('Discharge Summary Saved', 'Clinical discharge summary draft saved.');
      onSuccess();
    } catch (err: any) {
      toast.error('Failed to save summary', err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceed = async () => {
    const summary = buildSummaryObject();
    await handleSaveDraft();

    const validMeds = medications.filter((m) => (m.medicine_name || '').trim());
    if (validMeds.length > 0 && admission?.id) {
      try {
        await pharmacyApi.createIndent({
          requesting_department: 'IPD',
          indent_type: 'IPD_RX',
          urgency: 'Routine',
          notes: `IPD Discharge Rx: ${admission?.patient?.name || 'Inpatient'} (Bed ${admission?.bed?.bed_number || '—'}) - Take-Home Discharge Medications`,
          items: validMeds.map((m) => {
            const rawDur = String(m.duration || '');
            const durMatch = rawDur.match(/\d+/);
            const calcQty = durMatch ? parseInt(durMatch[0], 10) : 1;
            return {
              item_name: m.medicine_name,
              item_code: m.medicine_name,
              dose: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.instructions,
              quantity: calcQty,
              quantity_requested: calcQty,
              patient_id: admission?.patient?.id,
              patient_name: admission?.patient?.name,
              patient_vid: admission?.patient?.vid,
              admission_id: admission?.id,
              bed_number: admission?.bed?.bed_number,
            };
          }),
        });
      } catch (err) {
        console.warn('Could not auto-create pharmacy indent for discharge prescription:', err);
      }
    }

    onProceedToBilling(summary);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Inpatient Clinical Discharge Summary</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {admission?.patient?.name || 'Inpatient'} (MRN: {admission?.patient?.vid || '—'}) · Bed {admission?.bed?.bed_number || '—'} · Admission #{admission?.admission_number || '—'}
            </DialogDescription>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'document' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Document / Edit
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Printable Card
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {activeTab === 'document' ? (
            <div className="space-y-4">
              {/* Type and Condition */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discharge Classification</label>
                  <select
                    value={dischargeType}
                    onChange={(e) => setDischargeType(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                  >
                    <option value="Normal">Normal Medical Discharge</option>
                    <option value="LAMA">LAMA (Left Against Medical Advice)</option>
                    <option value="Referred">Referred to Higher Specialty Center</option>
                    <option value="Deceased">Deceased / Expired</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Condition at Discharge</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md bg-white focus:outline-none"
                  >
                    <option value="Stable">Stable & Ambulatory</option>
                    <option value="Improved">Clinically Improved</option>
                    <option value="Critical">Critical / Under Observation</option>
                    <option value="Cured">Cured / Resolved</option>
                  </select>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discharge / Final Diagnosis</label>
                <Input
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Gastroenteritis with mild dehydration, resolved"
                  className="h-8 text-xs font-semibold"
                />
              </div>

              {/* Hospital Course */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Clinical Course in Hospital & Procedures Performed</label>
                <textarea
                  rows={4}
                  value={hospitalCourse}
                  onChange={(e) => setHospitalCourse(e.target.value)}
                  placeholder="Summarize admission clinical presentation, lab findings, surgery/procedure notes, response to IV fluids/antibiotics, and recovery..."
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Discharge Medications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Take-Home Discharge Medications (Rx)</span>
                  <Button size="sm" variant="outline" onClick={handleAddMedication} className="h-6 text-[11px] gap-1 px-2">
                    <Plus className="w-3 h-3" />
                    <span>Add Medicine</span>
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Medicine Name</th>
                        <th className="p-2 w-24">Freq</th>
                        <th className="p-2 w-24">Duration</th>
                        <th className="p-2">Instructions</th>
                        <th className="p-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medications.map((m, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <PharmacyItemSearchDropdown
                              value={m.medicine_name}
                              onChange={(val) => handleMedChange(idx, 'medicine_name', val)}
                              onSelect={(item) => handleMedChange(idx, 'medicine_name', item.itemName)}
                              categoryFilter="medication"
                              placeholder="Search discharge medication..."
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              value={m.frequency}
                              onChange={(e) => handleMedChange(idx, 'frequency', e.target.value)}
                              placeholder="BD"
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              value={m.duration}
                              onChange={(e) => handleMedChange(idx, 'duration', e.target.value)}
                              placeholder="5 days"
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="p-1.5">
                            <Input
                              value={m.instructions}
                              onChange={(e) => handleMedChange(idx, 'instructions', e.target.value)}
                              placeholder="After food"
                              className="h-7 text-xs"
                            />
                          </td>
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Diet & Follow-up */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dietary & Activity Advice</label>
                  <textarea
                    rows={2}
                    value={dietaryAdvice}
                    onChange={(e) => setDietaryAdvice(e.target.value)}
                    placeholder="e.g. Soft bland diet, adequate hydration, avoid heavy lifting for 2 weeks..."
                    className="w-full p-2 text-xs border border-slate-200 rounded-md focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Follow-Up Date & Warning Signs</label>
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="h-8 text-xs mb-1.5"
                  />
                  <Input
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder="Visit OPD / ER immediately in case of high fever or severe abdominal pain"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* PRINTABLE PREVIEW */
            <div id="printable-discharge-summary" className="p-6 bg-white border border-slate-200 rounded-lg shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 uppercase">Hospital Inpatient Discharge Card</h2>
                  <p className="text-xs text-slate-500">VaidyaMD Healthcare Systems</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-indigo-700 font-mono">Admission #: {admission?.admission_number}</p>
                  <p className="text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Patient Demographics Table */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-md text-xs border border-slate-100">
                <div>
                  <p><span className="font-bold">Patient Name:</span> {admission?.patient?.name}</p>
                  <p><span className="font-bold">MRN / VID:</span> {admission?.patient?.vid}</p>
                  <p><span className="font-bold">Age / Gender:</span> {admission?.patient?.age}y / {admission?.patient?.gender}</p>
                </div>
                <div>
                  <p><span className="font-bold">Attending Doctor:</span> Dr. {admission?.admitting_doctor?.name}</p>
                  <p><span className="font-bold">Ward / Bed:</span> {admission?.bed?.ward_name} · Bed {admission?.bed?.bed_number}</p>
                  <p><span className="font-bold">Admission Date:</span> {admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString('en-IN') : '—'}</p>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">Final Diagnosis</h4>
                  <p className="mt-1 font-semibold text-slate-900">{diagnosis || 'Under Observation'}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">Condition at Discharge</h4>
                  <p className="mt-1 text-slate-700">{condition} ({dischargeType})</p>
                </div>

                {hospitalCourse && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">Clinical Course in Hospital</h4>
                    <p className="mt-1 text-slate-700 whitespace-pre-wrap">{hospitalCourse}</p>
                  </div>
                )}

                {medications.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px] border-b pb-1">Discharge Medications & Advice</h4>
                    <table className="w-full text-left text-xs mt-2 border border-slate-200">
                      <thead className="bg-slate-100 font-bold">
                        <tr>
                          <th className="p-2">Medicine</th>
                          <th className="p-2">Frequency</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {medications.map((m, i) => (
                          <tr key={i}>
                            <td className="p-2 font-semibold">{m.medicine_name}</td>
                            <td className="p-2">{m.frequency}</td>
                            <td className="p-2">{m.duration}</td>
                            <td className="p-2 text-slate-600">{m.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(dietaryAdvice || followUpDate) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {dietaryAdvice && (
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase text-[10px]">Diet & Care</h4>
                        <p className="text-slate-700">{dietaryAdvice}</p>
                      </div>
                    )}
                    {followUpDate && (
                      <div>
                        <h4 className="font-bold text-slate-800 uppercase text-[10px]">Follow-Up Visit</h4>
                        <p className="text-slate-700 font-semibold">{new Date(followUpDate).toLocaleDateString('en-IN')}</p>
                        <p className="text-[11px] text-slate-500">{followUpInstructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-12 border-t mt-8">
                <div className="text-center text-xs">
                  <div className="border-t border-slate-400 w-40 pt-1 text-slate-600">Staff Nurse Signature</div>
                </div>
                <div className="text-center text-xs">
                  <div className="border-t border-slate-400 w-44 pt-1 font-bold text-slate-800">
                    Dr. {admission?.admitting_doctor?.name || 'Attending Physician'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsPrintSummaryOpen(true)} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Print Summary</span>
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="text-xs font-semibold"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              size="sm"
              onClick={handleProceed}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5"
            >
              <span>Proceed to Final Settlement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Official A4 Clinical Discharge Summary Print Modal */}
      {isPrintSummaryOpen && (
        <PrintableModal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          title="Clinical Discharge Summary Preview"
          subtitle={`Official discharge documentation for ${admission?.patient?.name || 'Patient'}`}
          maxWidth="max-w-4xl"
        >
          {({ hideHeader }: { hideHeader: boolean }) => (
            <A4Sheet
              header={
                <PrintableReportHeader
                  title="Inpatient Clinical Discharge Summary"
                  badge="DISCHARGE SUMMARY"
                  hideHospitalHeader={hideHeader}
                  department="Inpatient Department (IPD)"
                  patient={{
                    name: admission?.patient?.name,
                    vid: admission?.patient?.vid,
                    mrn: admission?.patient?.vid,
                    gender: admission?.patient?.gender,
                    age: admission?.patient?.age,
                    phone: admission?.patient?.phone,
                    blood_group: admission?.patient?.blood_group,
                  }}
                  doctor={{
                    name: admission?.admitting_doctor?.name || 'Attending Physician',
                  }}
                  metaFields={[
                    { label: 'Admission #', value: admission?.admission_number },
                    { label: 'Bed & Ward', value: `Bed ${admission?.bed?.bed_number || '—'} (${admission?.bed?.ward_name || 'Ward'})` },
                    {
                      label: 'Admission Date',
                      value: admission?.admission_date ? new Date(admission.admission_date).toLocaleDateString('en-IN') : '—',
                    },
                    { label: 'Discharge Date', value: new Date().toLocaleDateString('en-IN') },
                  ]}
                />
              }
              footer={
                <PrintableReportFooter
                  signatoryTitle="Attending Physician"
                  signatoryName={`Dr. ${admission?.admitting_doctor?.name || 'Attending Physician'}`}
                  witnessTitle="Staff Nurse"
                  showWitness={true}
                  showSignatory={true}
                  showComputerGeneratedNotice={true}
                  hideHospitalFooter={hideHeader}
                />
              }
            >
              <div className="px-6 sm:px-8 print:px-[12mm] py-4 space-y-4 text-xs text-slate-800">
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Condition at Discharge</span>
                    <p className="font-bold text-slate-900 mt-0.5">{condition} ({dischargeType})</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Discharge Diagnosis</span>
                    <p className="font-bold text-slate-900 mt-0.5">{diagnosis || 'Under Observation / Resolved'}</p>
                  </div>
                </div>

                {hospitalCourse && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 mb-1">
                      Clinical Course in Hospital
                    </h4>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{hospitalCourse}</p>
                  </div>
                )}

                {medications.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 mb-1.5">
                      Discharge Medications & Regimen
                    </h4>
                    <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="p-2">Medication</th>
                          <th className="p-2">Frequency</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {medications.map((m, i) => (
                          <tr key={i}>
                            <td className="p-2 font-bold text-slate-900">{m.medicine_name}</td>
                            <td className="p-2">{m.frequency}</td>
                            <td className="p-2">{m.duration}</td>
                            <td className="p-2 text-slate-600">{m.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(dietaryAdvice || followUpDate) && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {dietaryAdvice && (
                      <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-amber-900 block mb-0.5">Dietary & Activity Advice</span>
                        <p className="text-slate-700">{dietaryAdvice}</p>
                      </div>
                    )}
                    {followUpDate && (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-indigo-900 block mb-0.5">Follow-Up Consultation</span>
                        <p className="text-slate-900 font-bold">{new Date(followUpDate).toLocaleDateString('en-IN')}</p>
                        <p className="text-slate-600 text-[11px] mt-0.5">{followUpInstructions}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </A4Sheet>
          )}
        </PrintableModal>
      )}
    </Dialog>

  );
}
