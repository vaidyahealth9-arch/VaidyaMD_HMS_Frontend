'use client';

import React, { useState } from 'react';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';
import { formatDate, formatDateTime } from '@/lib/utils';
import PaymentVoucherBody from './PaymentVoucherBody';

export interface PaymentVoucherData {
  id?: string;
  receipt_number: string;
  amount: number;
  payment_method: string;
  transaction_reference?: string;
  payment_date: string;
  payment_type?: string;
  collected_by_name?: string;
  notes?: string;
}

export interface PrintablePaymentVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: PaymentVoucherData;
  patient: {
    name: string;
    vid?: string;
    mrn?: string;
    age?: number | string;
    gender?: string;
    phone?: string;
    address?: string;
  };
  admission?: {
    admission_number?: string;
    ward_name?: string;
    bed_number?: string;
    admitting_doctor?: string;
    admission_date?: string;
  };
  financialContext?: {
    current_advance?: number;
    net_due?: number;
    total_accrued?: number;
  };
  defaultLayout?: 'a4' | 'a5';
}

export default function PrintablePaymentVoucherModal({
  isOpen,
  onClose,
  voucher,
  patient,
  admission,
  financialContext,
  defaultLayout = 'a4',
}: PrintablePaymentVoucherModalProps) {
  const [layout, setLayout] = useState<'a4' | 'a5'>(defaultLayout);

  if (!isOpen || !voucher) return null;

  const patientName = patient?.name || 'Inpatient';
  const patientVid = patient?.vid || patient?.mrn || '—';
  const wardBed = [admission?.ward_name, admission?.bed_number ? `Bed ${admission.bed_number}` : null]
    .filter(Boolean)
    .join(' · ');

  const currentAdvance = financialContext?.current_advance ?? voucher.amount;
  const netDue = financialContext?.net_due;

  return (
    <PrintableModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Advance Payment Voucher — ${voucher.receipt_number}`}
      subtitle={`Deposit receipt for ${patientName} (${voucher.receipt_number})`}
      pageSize={layout}
      printLabel={layout === 'a5' ? 'Print Voucher (A5)' : 'Print Voucher (A4)'}
      maxWidth="max-w-4xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <div className="space-y-3">
          {layout === 'a5' && (
            <style jsx global>{`
              @media print {
                @page {
                  size: A5 landscape !important;
                  margin: 0 !important;
                }
              }
            `}</style>
          )}

          {/* Format Switcher Bar (Hidden during actual print) */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-lg no-print text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Print Format:</span>
              <div className="flex gap-1.5 p-0.5 bg-slate-200/80 rounded-md">
                <button
                  type="button"
                  onClick={() => setLayout('a4')}
                  className={`px-3 py-1 font-bold rounded transition-all cursor-pointer ${
                    layout === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 A4 Letterhead
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('a5')}
                  className={`px-3 py-1 font-bold rounded transition-all cursor-pointer ${
                    layout === 'a5' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📋 A5 Slip (Landscape)
                </button>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500">
              Receipt #{voucher.receipt_number}
            </span>
          </div>

          <A4Sheet
            pageSize={layout}
            header={
              <PrintableReportHeader
                title="Inpatient Advance Payment Voucher"
                subtitle="Official Interim Deposit & Running Account Credit Receipt"
                badge="OFFICIAL RECEIPT VOUCHER"
                department="Inpatient Accounts & Patient Billing"
                hideHospitalHeader={hideHeader}
                patient={{
                  name: patientName,
                  vid: patientVid,
                  mrn: patientVid,
                  age: patient.age,
                  gender: patient.gender,
                  phone: patient.phone,
                }}
                doctor={{
                  name: admission?.admitting_doctor,
                }}
                date={formatDate(voucher.payment_date)}
                metaFields={[
                  {
                    label: 'Voucher Number',
                    value: (
                      <span className="font-mono font-bold text-slate-900">{voucher.receipt_number}</span>
                    ),
                  },
                  {
                    label: 'Date & Time',
                    value: (
                      <span className="font-medium text-slate-800">
                        {voucher.payment_date ? formatDateTime(voucher.payment_date) : '—'}
                      </span>
                    ),
                  },
                  {
                    label: 'Payment Mode',
                    value: (
                      <span className="font-bold uppercase text-emerald-800">
                        {voucher.payment_method}
                      </span>
                    ),
                  },
                  ...(voucher.transaction_reference
                    ? [
                        {
                          label: 'Txn / UTR Ref',
                          value: (
                            <span className="font-mono text-slate-700">
                              {voucher.transaction_reference}
                            </span>
                          ),
                        },
                      ]
                    : []),
                  ...(admission?.admission_number
                    ? [
                        {
                          label: 'Admission #',
                          value: (
                            <span className="font-mono text-slate-800 font-semibold">
                              {admission.admission_number}
                            </span>
                          ),
                        },
                      ]
                    : []),
                  ...(wardBed
                    ? [
                        {
                          label: 'Ward & Bed',
                          value: <span className="text-slate-800">{wardBed}</span>,
                        },
                      ]
                    : []),
                ]}
              />
            }
            footer={
              <PrintableReportFooter
                signatoryTitle="Hospital Cashier / Accounts Desk"
                signatorySubtitle="Authorized Financial Signatory"
                signatoryName={voucher.collected_by_name || 'Accounts Officer'}
                witnessTitle="Patient / Attendant Signature"
                showWitness={true}
                showSignatory={true}
                showComputerGeneratedNotice={true}
                hideHospitalFooter={hideHeader}
                pageNumber={1}
                totalPages={1}
              />
            }
          >
            <PaymentVoucherBody
              voucher={voucher}
              layout={layout}
              currentAdvance={currentAdvance}
              netDue={netDue}
            />
          </A4Sheet>
        </div>
      )}
    </PrintableModal>
  );
}
