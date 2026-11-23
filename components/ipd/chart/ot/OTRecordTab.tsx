'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, Plus, List } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import EmptyState from '@/components/common/EmptyState';
import Spinner from '@/components/common/Spinner';
import { ipdApi } from '@/features/ipd/api';
import type { AdmissionDetails, OTRecord } from '@/features/ipd/types';
import OTRecordCard from './OTRecordCard';
import OTRecordForm from './OTRecordForm';
import OTPostBillingModal from './OTPostBillingModal';
import PrintOTRecordModal from './PrintOTRecordModal';

interface OTRecordTabProps {
  admissionId: string;
  admission: AdmissionDetails;
  onRefreshParent: () => void;
}

export default function OTRecordTab({
  admissionId,
  admission,
  onRefreshParent,
}: OTRecordTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'form'>('list');
  const [editingRecord, setEditingRecord] = useState<OTRecord | null>(null);
  const [billingRecord, setBillingRecord] = useState<OTRecord | null>(null);
  const [printingRecord, setPrintingRecord] = useState<OTRecord | null>(null);

  const { data: records = [], isLoading, refetch } = useQuery<OTRecord[]>({
    queryKey: ['ipd-ot-records', admissionId],
    queryFn: () => ipdApi.listOTRecords(admissionId),
    enabled: !!admissionId,
  });

  const handleRefresh = () => {
    refetch();
    onRefreshParent();
  };

  const handleOpenNewForm = () => {
    setEditingRecord(null);
    setActiveSubTab('form');
  };

  const handleEditRecord = (record: OTRecord) => {
    setEditingRecord(record);
    setActiveSubTab('form');
  };

  const handleFormSuccess = () => {
    handleRefresh();
    setActiveSubTab('list');
    setEditingRecord(null);
  };

  const totalSurgeryHours = records.reduce((acc, r) => acc + (r.total_ot_hours || 0), 0);
  const completedCount = records.filter((r) => r.status === 'Completed').length;

  return (
    <div className="space-y-4">
      {/* Sub-Tab Navigation Bar (In Same Window) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('list');
              setEditingRecord(null);
            }}
            className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-indigo-600" />
            <span>Surgical Procedures ({records.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('form');
            }}
            className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'form'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>{editingRecord ? `Editing: ${editingRecord.procedure_name}` : 'Schedule / Document OT'}</span>
          </button>
        </div>

        {activeSubTab === 'list' && (
          <Button
            size="sm"
            onClick={handleOpenNewForm}
            className="h-8 text-xs font-bold gap-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule / Log Surgery</span>
          </Button>
        )}
      </div>

      {/* VIEW 1: IN-WINDOW SURGERY FORM */}
      {activeSubTab === 'form' && (
        <OTRecordForm
          admissionId={admissionId}
          initialRecord={editingRecord}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setActiveSubTab('list');
            setEditingRecord(null);
          }}
        />
      )}

      {/* VIEW 2: SURGICAL PROCEDURES LIST */}
      {activeSubTab === 'list' && (
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Operation Theatre (OT) &amp; Surgical Records</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Surgical wheel in/out tracking, operating room tariffs, staff assignments, and operative notes
              </p>
            </div>
          </CardHeader>

          {/* Mini KPI Bar */}
          {records.length > 0 && (
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center gap-6 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Surgeries</span>
                <strong className="text-slate-900">{records.length}</strong>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Total OT Duration</span>
                <strong className="text-indigo-900 font-mono">{totalSurgeryHours.toFixed(1)} Hours</strong>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[10px] font-bold block">Completed Procedures</span>
                <strong className="text-emerald-700">{completedCount}</strong>
              </div>
            </div>
          )}

          {/* List of OT Records */}
          <CardContent className="p-4 space-y-3">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Spinner size="md" />
                <span>Loading OT surgical records...</span>
              </div>
            ) : records.length > 0 ? (
              records.map((r) => (
                <OTRecordCard
                  key={r.id}
                  record={r}
                  onEdit={handleEditRecord}
                  onBill={(rec) => setBillingRecord(rec)}
                  onPrint={(rec) => setPrintingRecord(rec)}
                />
              ))
            ) : (
              <EmptyState
                icon={Scissors}
                title="No Surgical Procedures Logged"
                subtitle="Schedule major/minor operations, document wheel in/out timestamps, surgeon notes, and post charges to the rolling bill."
                action={
                  <Button
                    size="sm"
                    onClick={handleOpenNewForm}
                    className="h-8 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Schedule First Surgery
                  </Button>
                }
                className="py-10"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Review & Post Billing Modal */}
      {billingRecord && (
        <OTPostBillingModal
          isOpen={!!billingRecord}
          onClose={() => setBillingRecord(null)}
          record={billingRecord}
          admissionId={admissionId}
          onSuccess={handleRefresh}
        />
      )}

      {/* Print OT Operative Notes Modal */}
      {printingRecord && (
        <PrintOTRecordModal
          isOpen={!!printingRecord}
          onClose={() => setPrintingRecord(null)}
          record={printingRecord}
          admission={admission}
        />
      )}
    </div>
  );
}
