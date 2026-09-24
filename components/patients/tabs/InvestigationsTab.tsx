'use client';

import React, { useState, useEffect } from 'react';
import { fertilityApi, andrologyApi } from '@/lib/api';
import DynamicForm from '@/components/dynamic-form/DynamicForm';
import { toast } from '@/contexts/ToastContext';

interface InvestigationsTabProps {
  patient: any;
  partner?: any;
  user: any;
}

export default function InvestigationsTab({ patient, partner, user }: InvestigationsTabProps) {
  const patientId = patient?.id;
  const [investigationGender, setInvestigationGender] = useState<'female' | 'male'>('female');
  const [activeSchemaType, setActiveSchemaType] = useState<string>('follicular_scan');
  const [activeSchema, setActiveSchema] = useState<any>(null);
  const [historyRecord, setHistoryRecord] = useState<any>(null);
  const [isSavingRecord, setIsSavingRecord] = useState<boolean>(false);

  // Sync schema and history record when schema type or target patient changes
  useEffect(() => {
    if (!activeSchemaType || !patientId) return;

    const isMaleInvestigation = [
      'casa_semen_analysis', 'sperm_dfi', 'sperm_preparation', 'semen_freezing', 'surgical_sperm_retrieval'
    ].includes(activeSchemaType);
    const targetId = isMaleInvestigation ? (patient?.gender === 'male' ? patient.id : (partner?.id || patientId)) : patientId;

    fertilityApi.getSchema(activeSchemaType)
      .then((s: any) => setActiveSchema(s))
      .catch((err) => console.error('Failed to load schema', err));

    fertilityApi.getRecords(targetId, activeSchemaType)
      .then((res: any) => {
        if (res && res.length > 0) {
          setHistoryRecord(res[0]);
        } else {
          // Check andrology records for CASA semen analysis fallback
          if (activeSchemaType === 'casa_semen_analysis') {
            andrologyApi.list({ patient_id: targetId }).then((andRes: any) => {
              if (andRes && andRes.length > 0) {
                setHistoryRecord(andRes[0]);
              } else {
                setHistoryRecord(null);
              }
            }).catch(() => setHistoryRecord(null));
          } else {
            setHistoryRecord(null);
          }
        }
      })
      .catch(() => { });
  }, [activeSchemaType, patientId, partner?.id, patient?.gender]);

  const handleSaveInvestigation = async (formData: Record<string, unknown>) => {
    if (!user) return;
    setIsSavingRecord(true);
    try {
      const isMaleInvestigation = [
        'casa_semen_analysis', 'sperm_dfi', 'sperm_preparation', 'semen_freezing', 'surgical_sperm_retrieval'
      ].includes(activeSchemaType);
      const targetId = isMaleInvestigation ? (patient?.gender === 'male' ? patient.id : (partner?.id || patientId)) : patientId;

      await fertilityApi.saveRecord({
        patient_id: targetId,
        record_type: activeSchemaType,
        data: formData,
        created_by: user.id,
      });
      toast.success('Investigation Saved', 'Investigation record saved successfully!');
      fertilityApi.getRecords(targetId, activeSchemaType).then((res: any) => {
        if (res && res.length > 0) setHistoryRecord(res[0]);
      });
    } catch (e: any) {
      toast.error('Save Failed', e.message || 'Failed to save record');
    } finally {
      setIsSavingRecord(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setInvestigationGender('female');
              setActiveSchemaType('follicular_scan');
            }}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              investigationGender === 'female' ? 'bg-pink-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ♀ Female Scans &amp; Reports
          </button>
          <button
            type="button"
            onClick={() => {
              setInvestigationGender('male');
              setActiveSchemaType('casa_semen_analysis');
            }}
            className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
              investigationGender === 'male' ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ♂ Male Diagnostic Reports
          </button>
        </div>

        <select
          value={activeSchemaType}
          onChange={(e) => setActiveSchemaType(e.target.value)}
          className="vmd-input text-xs font-bold text-slate-800 max-w-xs"
        >
          {investigationGender === 'female' ? (
            <>
              <option value="follicular_scan">Baseline Follicular Scan</option>
              <option value="pelvic_organ_usg">Pelvic Organ Ultrasound</option>
              <option value="sonohysterogram">Saline Infusion Sonohysterography (SIS)</option>
              <option value="endometrial_assessment">Endometrial Receptivity Scan</option>
              <option value="early_pregnancy_scan">Early Pregnancy USG Scan</option>
            </>
          ) : (
            <>
              <option value="casa_semen_analysis">CASA Semen Analysis Report</option>
              <option value="sperm_dfi">Sperm DNA Fragmentation (DFI)</option>
              <option value="sperm_preparation">Sperm Preparation (Pre/Post Wash)</option>
              <option value="semen_freezing">Semen Freezing Log</option>
            </>
          )}
        </select>
      </div>

      {activeSchema && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <DynamicForm
            schema={activeSchema}
            initialData={historyRecord?.data || {}}
            onSave={handleSaveInvestigation}
            isSaving={isSavingRecord}
            userRole={user?.role || 'doctor'}
          />
        </div>
      )}
    </div>
  );
}
