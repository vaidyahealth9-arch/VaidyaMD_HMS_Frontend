'use client';

import React from 'react';
import { formatDate } from '@/lib/utils';
import { Printer, X } from 'lucide-react';

interface InvoiceItem { description: string; quantity: number; unit_price: string | number; total: string | number; }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:static print:bg-transparent print:overflow-visible"
      style={{ background: 'rgba(0,0,0,0.55)' }}>

      <div className="bg-white max-w-2xl w-full shadow-xl rounded-lg overflow-hidden flex flex-col my-6 print:shadow-none print:rounded-none print:m-0 print:max-w-full print:border-none print:bg-transparent">

        {/* Preview toolbar */}
        <div className="flex items-center justify-between px-5 py-3 print:hidden"
          style={{ background: 'rgb(var(--clr-rail-bg))', color: 'white' }}>
          <div>
            <p className="text-sm font-semibold">Invoice Preview — {invoice.invoice_number}</p>
            <p className="text-xs opacity-50 mt-0.5">Review before printing or sending to patient</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'rgb(var(--clr-primary))', color: 'white' }}
            >
              <Printer className="w-3.5 h-3.5" /> Print (A4)
            </button>
            <button onClick={onClose} className="p-1 opacity-50 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Printable Document ── */}
        <div className="p-8 space-y-5 printable-document print:p-6" style={{ fontFamily: 'Inter, Arial, sans-serif', fontSize: '11px', color: '#111827' }}>

          {/* Hospital Header */}
          <div className="flex items-start justify-between pb-3" style={{ borderBottom: '1.5px solid #0B4F6C' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0" style={{ background: '#0B4F6C' }}>
                <img src="/logo.svg" alt="VaidyaMD" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-bold text-base leading-tight" style={{ color: '#0B4F6C' }}>
                  VaidyaMD Advanced Hospital & Fertility Centre
                </h1>
                <p className="text-[10px] mt-0.5" style={{ color: '#4b5563' }}>
                  Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033 · +91 40 4888 9999
                </p>
                <p className="text-[9px] mt-0.5 font-mono" style={{ color: '#9ca3af' }}>
                  GSTIN: 36AAAAA0000A1Z5 · Reg No: TS/MED/2024/9876
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: '#9ca3af' }}>Hospital Tax Invoice</p>
              <PayBadge due={due} paid={paid} />
            </div>
          </div>

          {/* Patient + Invoice meta grid */}
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
                  <td className="p-2.5 font-medium" style={{ color: '#111827' }}>{it.description}</td>
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
              <span>Total Amount Paid:</span>
              <span className="font-mono">₹{paid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm" style={{ color: due > 0 ? '#B91C1C' : '#0D7A55' }}>
              <span>Balance Due:</span>
              <span className="font-mono">₹{due.toLocaleString()}</span>
            </div>
          </div>

          {/* Terms + Signature */}
          <div className="pt-5 grid grid-cols-2 gap-4 items-end page-break-avoid" style={{ borderTop: '1px solid #d1d5db', fontSize: '10px', color: '#9ca3af' }}>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#374151' }}>Terms & Conditions:</p>
              <p>1. Payments received are non-refundable.</p>
              <p>2. Healthcare services are exempted from GST under Notification No. 12/2017-CT(R).</p>
              <p className="mt-2 text-[9px]">This is a computer-generated invoice and requires no physical stamp or signature.</p>
            </div>
            <div className="text-right">
              <div className="h-9" />
              <div className="pt-1" style={{ borderTop: '0.5px solid #9ca3af' }}>
                <p className="font-semibold uppercase tracking-wider text-[9px]" style={{ color: '#374151' }}>Authorized Signatory</p>
                <p className="text-[9px]">VaidyaMD Accounts Billing Desk</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
