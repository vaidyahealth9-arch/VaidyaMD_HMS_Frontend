'use client';

import React, { useState } from 'react';
import PrintableModal from './PrintableModal';
import A4Sheet from './A4Sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/shared/ui/button';
import { Settings2, RotateCcw } from 'lucide-react';
import {
  InsuranceBillHeader,
  InsuranceBillTable,
  InsuranceDetailsDrawer,
  type InsuranceDetails,
  type InsuranceBillItem,
  type InsurancePatientInfo,
} from './insurance-bill';

export interface PrintableInsuranceBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: InsurancePatientInfo;
  items: InsuranceBillItem[];
  initialInsurance?: Partial<InsuranceDetails>;
  advanceAmount?: number;
  hospitalName?: string;
}

export default function PrintableInsuranceBillModal({
  isOpen,
  onClose,
  patient,
  items: initialItems,
  initialInsurance,
  advanceAmount = 0,
  hospitalName: customHospitalName,
}: PrintableInsuranceBillModalProps) {
  const { currentBranch, user } = useAuth() || {};
  const branchCfg = (currentBranch?.receipt_header as any) || {};

  const effectiveHospitalName =
    customHospitalName ||
    branchCfg.hospital_name ||
    user?.hospital_name ||
    'Hospital & Research Centre';

  const [insurance, setInsurance] = useState<InsuranceDetails>({
    gst_no: currentBranch?.gstin || branchCfg.gstin || '36AAMCS6700Q1ZP',
    dl_no: branchCfg.dl_no || '',
    bill_type: 'IP Approximate Bill',
    approx_bill_no: initialInsurance?.approx_bill_no || `CAB${new Date().getFullYear()}${String(Date.now()).slice(-6)}`,
    admission_no: initialInsurance?.admission_no || '',
    umr_no: initialInsurance?.umr_no || patient.mrn || patient.vid || '',
    admission_date: initialInsurance?.admission_date || '',
    discharge_date: initialInsurance?.discharge_date || '',
    to_be_discharged_dt: initialInsurance?.to_be_discharged_dt || '',
    department: initialInsurance?.department || 'Inpatient Department (IPD)',
    admitted_bed: initialInsurance?.admitted_bed || '',
    consultant: initialInsurance?.consultant || '',
    claim_no: initialInsurance?.claim_no || '',
    policy_no: initialInsurance?.policy_no || '',
    medical_card_no: initialInsurance?.medical_card_no || '',
    tpa_name: initialInsurance?.tpa_name || '',
    tpa_gst_no: initialInsurance?.tpa_gst_no || '',
    organization: initialInsurance?.organization || '',
    org_gst_no: initialInsurance?.org_gst_no || '',
    ...initialInsurance,
  });

  const [billItems, setBillItems] = useState<InsuranceBillItem[]>(initialItems);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!isOpen) return null;

  // Toggle item exclusion (remove from insurance bill)
  const handleToggleExclude = (id: string) => {
    setBillItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_excluded: !it.is_excluded } : it))
    );
  };

  // Toggle cash service
  const handleToggleCashService = (id: string) => {
    setBillItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_cash_service: !it.is_cash_service } : it))
    );
  };

  const handleResetExclusions = () => {
    setBillItems((prev) => prev.map((it) => ({ ...it, is_excluded: false })));
  };

  const excludedCount = billItems.filter((i) => i.is_excluded).length;

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Insurance Bill — ${insurance.admission_no || patient.name}`}
      subtitle="Inpatient TPA & Discharge Bill of Supply with customizable items"
      maxWidth="max-w-4xl"
      printLabel="Print Insurance Bill"
      showPrePrintedToggle={false}
    >
      {() => (
        <div className="space-y-3 w-full">
          {/* Action Toolbar on Screen */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs no-print shadow-md">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">Bill Type:</span>
              <div className="flex gap-1 p-0.5 bg-slate-800 rounded-md">
                {(['IP Approximate Bill', 'Bill Of Supply', 'IP Final Discharge Bill'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setInsurance((prev) => ({ ...prev, bill_type: t }))}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                      insurance.bill_type === t ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {excludedCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetExclusions}
                  className="h-7 text-xs bg-slate-800 border-slate-700 text-slate-300 hover:text-white gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore {excludedCount} Item{excludedCount > 1 ? 's' : ''}</span>
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{isDrawerOpen ? 'Close Header Edit' : 'Edit Header Details'}</span>
              </Button>
            </div>
          </div>

          {/* Quick Header Editor Drawer */}
          <InsuranceDetailsDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            details={insurance}
            onChange={setInsurance}
          />

          {/* Authentic Printable Document */}
          <A4Sheet>
            <div className="p-6 sm:p-8 print:p-[10mm] space-y-4 flex-1 flex flex-col justify-between bg-white text-slate-900">
              <div className="space-y-3">
                {/* 1. Header with Multi-Details */}
                <InsuranceBillHeader
                  insurance={insurance}
                  patient={patient}
                  hospitalName={effectiveHospitalName}
                />

                {/* 2. Items Table with Exclusion support */}
                <InsuranceBillTable
                  items={billItems}
                  onToggleExclude={handleToggleExclude}
                  onToggleCashService={handleToggleCashService}
                  advanceAmount={advanceAmount}
                />
              </div>

              {/* 3. Official Signatory Footer */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-xs">
                <div>
                  <p className="font-semibold text-slate-700 mb-8">Patient / Attendant Signature:</p>
                  <div className="border-t border-slate-400 w-44 pt-1 text-[10px] text-slate-500">
                    Patient / Attendant Name
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-semibold text-slate-700 mb-8">For {effectiveHospitalName}:</p>
                  <div className="border-t border-slate-400 w-52 pt-1 text-[10px] text-slate-500 text-center">
                    Authorized Inpatient Billing Officer
                  </div>
                </div>
              </div>
            </div>
          </A4Sheet>
        </div>
      )}
    </PrintableModal>
  );
}
