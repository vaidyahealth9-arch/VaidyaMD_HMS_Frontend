'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: string | number;
  total: string | number;
  item_name?: string;
}

interface PrintableInvoiceProps {
  invoice: {
    invoice_number: string;
    patient_name: string;
    patient_vid?: string;
    created_at: string;
    appointment_source?: string;
    reason_for_attendance?: string;
    items?: InvoiceItem[];
    subtotal?: string | number;
    total_amount: string | number;
    discount?: string | number;
    wallet_amount_used?: string | number;
    paid_amount: string | number;
    pending_due: string | number;
    payment_method?: string;
  };
  onClose: () => void;
}

const n = (v: string | number | undefined) => parseFloat((v || 0) as any) || 0;

function PayBadge({ due, paid }: { due: number; paid: number }) {
  if (due <= 0) return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#D1FAE5', color: '#065F46', border: '0.5px solid #6EE7B7' }}>PAID IN FULL</span>;
  if (paid > 0)  return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#FFF3CD', color: '#9A6006', border: '0.5px solid #FCD34D' }}>PARTIAL PAYMENT</span>;
  return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#FEE2E2', color: '#B91C1C', border: '0.5px solid #FCA5A5' }}>UNPAID</span>;
}

export default function PrintableInvoice({ invoice, onClose }: PrintableInvoiceProps) {
  const due  = n(invoice.pending_due);
  const paid = n(invoice.paid_amount);

  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title={`Invoice Preview — ${invoice.invoice_number}`}
      subtitle="Review before printing or sending to patient"
      maxWidth="max-w-2xl"
    >
      {({ hideHeader }: { hideHeader: boolean }) => (
        <A4Sheet
          header={
            <PrintableReportHeader
              title="HOSPITAL TAX INVOICE"
              subtitle={`Invoice No: ${invoice.invoice_number}`}
              hideHospitalHeader={hideHeader}
              extraHeaderRight={<PayBadge due={due} paid={paid} />}
            />
          }
          footer={
            <PrintableReportFooter
              signatoryTitle="Authorized Accounts Desk"
              signatorySubtitle="Hospital Billing & Accounts"
              showSignatory={true}
              showComputerGeneratedNotice={true}
              hideHospitalFooter={hideHeader}
              pageNumber={1}
              totalPages={1}
            />
          }
        >
          {/* Patient + Invoice meta grid, Items Table, Totals, Terms (Safe Inner Margins) */}
          <div className="px-6 sm:px-8 print:px-[12mm] py-3 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 rounded-md" style={{ background: '#F7F8FA', border: '0.5px solid #E3E8EE' }}>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9ca3af' }}>Patient Information</p>
                  <p className="font-semibold text-sm" style={{ color: '#111827' }}>{invoice.patient_name || 'Patient'}</p>
                  <p className="font-mono text-xs mt-0.5" style={{ color: '#4b5563' }}>VID / MRN: {invoice.patient_vid || '—'}</p>
                  {invoice.reason_for_attendance && (
                    <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
                      <strong>Reason:</strong> {invoice.reason_for_attendance}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9ca3af' }}>Invoice Details</p>
                  <p className="font-mono font-bold text-sm" style={{ color: '#0B4F6C' }}>{invoice.invoice_number}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#4b5563' }}>Date: {formatDate(invoice.created_at)}</p>
                  <p className="text-[10px]" style={{ color: '#4b5563' }}>
                    Dept / Source: <strong style={{ color: '#111827' }}>{invoice.appointment_source || 'OPD'}</strong>
                  </p>
                  {invoice.payment_method && (
                    <p className="text-[10px]" style={{ color: '#4b5563' }}>
                      Payment Mode: <strong style={{ color: '#0B4F6C' }} className="uppercase">{invoice.payment_method}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs border-collapse print-table">
                <thead>
                  <tr style={{ background: '#F7F8FA', borderBottom: '1px solid #E3E8EE', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', fontWeight: 600 }}>
                    <th className="p-2.5">Item / Procedure Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                      <td className="p-2.5 font-medium" style={{ color: '#111827' }}>{it.description || it.item_name || 'Medication Dispensed'}</td>
                      <td className="p-2.5 text-center" style={{ color: '#6b7280' }}>{it.quantity}</td>
                      <td className="p-2.5 text-right font-mono" style={{ color: '#374151' }}>₹{n(it.unit_price).toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-semibold" style={{ color: '#111827' }}>₹{n(it.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="pt-3 space-y-1 text-xs" style={{ borderTop: '1px solid #e5e7eb' }}>
                <div className="flex justify-between" style={{ color: '#6b7280' }}>
                  <span>Subtotal / Gross Amount:</span>
                  <span className="font-mono font-medium">₹{n(invoice.subtotal || invoice.total_amount).toLocaleString()}</span>
                </div>
                {n(invoice.discount) > 0 && (
                  <div className="flex justify-between font-semibold" style={{ color: '#B91C1C' }}>
                    <span>Concession / Discount:</span>
                    <span className="font-mono">− ₹{n(invoice.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between" style={{ color: '#9ca3af', fontSize: '10px' }}>
                  <span>GST (Healthcare Services — Exempted):</span>
                  <span className="font-mono">₹0.00 (0%)</span>
                </div>
                {n(invoice.wallet_amount_used) > 0 && (
                  <div className="flex justify-between font-semibold" style={{ color: '#0D7A55' }}>
                    <span>Deducted from Advance Wallet:</span>
                    <span className="font-mono">− ₹{n(invoice.wallet_amount_used).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid #d1d5db', color: '#111827' }}>
                  <span>Net Total Billable:</span>
                  <span className="font-mono" style={{ color: '#0B4F6C' }}>₹{n(invoice.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold" style={{ color: '#0D7A55' }}>
                  <span>Total Amount Paid {invoice.payment_method ? `(${invoice.payment_method})` : ''}:</span>
                  <span className="font-mono">₹{paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm" style={{ color: due > 0 ? '#B91C1C' : '#0D7A55' }}>
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{due.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Terms & Notes */}
            <div className="pt-3 pb-1 text-[10px] text-gray-500 border-t border-gray-200">
              <p className="font-semibold text-gray-700 mb-0.5">Terms & Conditions:</p>
              <p>1. Payments received are non-refundable.</p>
              <p>2. Healthcare services are exempted from GST under Notification No. 12/2017-CT(R).</p>
            </div>
          </div>
        </A4Sheet>
      )}
    </PrintableModal>
  );
}
