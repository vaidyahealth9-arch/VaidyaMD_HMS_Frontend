'use client';

import React, { useState } from 'react';
import { formatDate } from '@/lib/utils';
import PrintableModal from './PrintableModal';
import PrintableReportHeader from './PrintableReportHeader';
import PrintableReportFooter from './PrintableReportFooter';
import A4Sheet from './A4Sheet';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: string | number;
  total: string | number;
  item_name?: string;
  unitPrice?: string | number;
  rate?: string | number;
  price?: string | number;
  total_price?: string | number;
  amount?: string | number;
  quantity_dispensed?: number;
}

interface PrintableInvoiceProps {
  invoice: {
    invoice_number: string;
    patient_name?: string;
    patient_vid?: string;
    patient_mrn?: string;
    created_at: string;
    appointment_source?: string;
    source_module?: string;
    department?: string;
    reason_for_attendance?: string;
    items?: InvoiceItem[];
    subtotal?: string | number;
    total_amount: string | number;
    discount?: string | number;
    wallet_amount_used?: string | number;
    paid_amount: string | number;
    pending_due?: string | number;
    payment_method?: string;
    upi_pay_mode?: string;
    notes?: string;
  };
  onClose: () => void;
  defaultLayout?: 'a4' | 'a5' | 'thermal';
}

const n = (v: string | number | undefined) => parseFloat((v || 0) as any) || 0;

const getUnitPrice = (it: any): number => {
  const p = it.unit_price ?? it.unitPrice ?? it.rate ?? it.price;
  const numP = parseFloat(p);
  if (!isNaN(numP) && numP > 0) return numP;
  const tot = parseFloat(it.total ?? it.total_price ?? it.amount ?? 0);
  const qty = parseFloat(it.quantity ?? it.quantity_dispensed ?? 1);
  if (tot > 0 && qty > 0) return tot / qty;
  return 0;
};

function PayBadge({ due, paid }: { due: number; paid: number }) {
  if (due <= 0) return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#D1FAE5', color: '#065F46', border: '0.5px solid #6EE7B7' }}>PAID IN FULL</span>;
  if (paid > 0)  return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#FFF3CD', color: '#9A6006', border: '0.5px solid #FCD34D' }}>PARTIAL PAYMENT</span>;
  return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase" style={{ background: '#FEE2E2', color: '#B91C1C', border: '0.5px solid #FCA5A5' }}>UNPAID</span>;
}

export default function PrintableInvoice({ invoice, onClose, defaultLayout }: PrintableInvoiceProps) {
  const { currentBranch, user } = useAuth() || {};
  const hasFewItems = Boolean(invoice.items && invoice.items.length <= 4);
  const initialLayout = defaultLayout || (hasFewItems ? 'a5' : 'a4');
  const [layout, setLayout] = useState<'a4' | 'a5' | 'thermal'>(initialLayout);

  const due = n(invoice.pending_due !== undefined ? invoice.pending_due : Math.max(0, n(invoice.total_amount) - n(invoice.paid_amount)));
  const paid = n(invoice.paid_amount);

  // Dynamic department branding
  const rawSource = (invoice.source_module || invoice.appointment_source || invoice.department || '').toLowerCase();
  const isPharma = rawSource.includes('pharma');
  const isLab = rawSource.includes('lab') || rawSource.includes('diag') || rawSource.includes('path') || rawSource.includes('lims');
  const isOpd = rawSource.includes('op') || rawSource.includes('consult');
  const isIpd = rawSource.includes('ip') || rawSource.includes('ward') || rawSource.includes('bed');
  const isArt = rawSource.includes('art') || rawSource.includes('ivf') || rawSource.includes('icsi') || rawSource.includes('fertility');
  const isCosGyn = rawSource.includes('cosgyn') || rawSource.includes('aesthetic');

  const hospitalName =
    currentBranch?.receipt_header?.hospital_name ||
    user?.hospital_name ||
    'Hospital & Healthcare Institute';

  // Base brand name without suffix e.g. "Matrika"
  const brandName = hospitalName.replace(/\s+(Hospital|Clinic|Centre|Center|Healthcare|Institute)$/i, '').trim() || hospitalName;

  let deptDocTitle = `${brandName} - Healthcare Invoice`;
  let deptSubtext = 'TAX INVOICE';
  let deptHeaderLabel = 'Hospital Billing';
  let deptSignatorySubtitle = 'Hospital Billing & Accounts';

  if (isPharma) {
    deptDocTitle = `${brandName} Pharmacy Invoice`;
    deptSubtext = 'PHARMACY TAX INVOICE & DISPENSING MEMO';
    deptHeaderLabel = 'Pharmacy Department';
    deptSignatorySubtitle = 'Pharmacy Dispensing Desk';
  } else if (isLab) {
    deptDocTitle = `${brandName} Clinical Diagnostics & Lab Invoice`;
    deptSubtext = 'DIAGNOSTICS & PATHOLOGY INVOICE';
    deptHeaderLabel = 'Clinical Diagnostics & Laboratory';
    deptSignatorySubtitle = 'Diagnostics & Laboratory Desk';
  } else if (isIpd) {
    deptDocTitle = `${brandName} Inpatient Hospital Bill`;
    deptSubtext = 'IPD INPATIENT CHARGES & SURGICAL INVOICE';
    deptHeaderLabel = 'Inpatient Department (IPD)';
    deptSignatorySubtitle = 'Inpatient Billing Desk';
  } else if (isArt) {
    deptDocTitle = `${brandName} Fertility & ART Centre Invoice`;
    deptSubtext = 'ART & EMBRYOLOGY CLINICAL INVOICE';
    deptHeaderLabel = 'Fertility & ART Centre';
    deptSignatorySubtitle = 'ART Accounts & Billing Desk';
  } else if (isCosGyn) {
    deptDocTitle = `${brandName} Cosmetic Gynecology & Aesthetics Invoice`;
    deptSubtext = 'COSMETIC GYNECOLOGY PROCEDURAL INVOICE';
    deptHeaderLabel = 'Cosmetic Gynecology & Aesthetics';
    deptSignatorySubtitle = 'CosGyn Billing Desk';
  } else if (isOpd) {
    deptDocTitle = `${brandName} Outpatient Consultation Bill`;
    deptSubtext = 'OPD CLINICAL CONSULTATION BILL';
    deptHeaderLabel = 'Outpatient Department';
    deptSignatorySubtitle = 'OPD Registration & Accounts';
  }

  return (
    <PrintableModal
      isOpen={true}
      onClose={onClose}
      title={`Invoice Preview — ${invoice.invoice_number}`}
      subtitle="Review before printing or sending to patient"
      pageSize={layout === 'a5' ? 'a5' : 'a4'}
      printLabel={layout === 'a5' ? 'Print (A5)' : layout === 'thermal' ? 'Print (POS Slip)' : 'Print (A4)'}
      maxWidth={layout === 'thermal' ? 'max-w-md' : layout === 'a5' ? 'max-w-3xl' : 'max-w-2xl'}
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

          {/* Layout switcher bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-lg no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Print Format:</span>
              {hasFewItems && (
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  🌱 A5 Suggested (Saves Paper)
                </span>
              )}
            </div>
            <div className="flex gap-1.5 p-0.5 bg-slate-200/80 rounded-md">
              <button
                type="button"
                onClick={() => setLayout('a4')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  layout === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 A4 Letterhead
              </button>
              <button
                type="button"
                onClick={() => setLayout('a5')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  layout === 'a5' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 A5 Slip (Landscape)
              </button>
              <button
                type="button"
                onClick={() => setLayout('thermal')}
                className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                  layout === 'thermal' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🧾 80mm POS Slip
              </button>
            </div>
          </div>

          {layout === 'thermal' ? (
            /* ─── 80mm Compact Thermal Receipt Layout ─── */
            <div className="bg-white p-5 border border-slate-300 rounded-lg shadow-inner font-mono text-[12px] leading-relaxed text-slate-900 max-w-[340px] mx-auto print:max-w-none print:w-[80mm] print:border-none print:shadow-none print:p-2">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-3">
                <h2 className="text-base font-extrabold uppercase tracking-tight">
                  {isPharma ? `${brandName} Pharmacy` : isLab ? `${brandName} Diagnostics & Lab` : isIpd ? `${brandName} Inpatient Care` : hospitalName}
                </h2>
                <p className="text-[11px] font-semibold text-slate-700 uppercase">
                  {deptHeaderLabel}
                </p>
                <p className="text-[10px] text-slate-500">
                  {currentBranch?.gstin ? `GSTIN: ${currentBranch.gstin}` : 'GSTIN: 29AABCV1234F1Z9'}
                </p>
                <p className="text-[10px] font-bold mt-1 text-slate-900 uppercase">{deptSubtext}</p>
              </div>

              <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Inv #:</span>
                  <span className="font-bold">{invoice.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient:</span>
                  <span className="font-bold truncate max-w-[170px]">{invoice.patient_name || 'Walk-in'}</span>
                </div>
                <div className="flex justify-between">
                  <span>VID/MRN:</span>
                  <span>{invoice.patient_vid || invoice.patient_mrn || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dept/Source:</span>
                  <span className="uppercase">{invoice.appointment_source || 'OPD'}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold text-[10px] uppercase pb-1 border-b border-slate-300">
                  <span className="w-3/5">Item / Medication</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/4 text-right">Amount</span>
                </div>
                <div className="space-y-2 pt-1.5">
                  {invoice.items?.map((it, i) => {
                    const unitRate = getUnitPrice(it);
                    const qty = it.quantity || 1;
                    const tot = n(it.total || qty * unitRate);
                    return (
                      <div key={i} className="text-[11px] space-y-0.5">
                        <div className="flex justify-between items-start">
                          <span className="w-3/5 font-semibold truncate pr-1">{it.description || it.item_name || 'Item'}</span>
                          <span className="w-1/6 text-center text-slate-700 font-mono">{qty}</span>
                          <span className="w-1/4 text-right font-bold">₹{tot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono pl-0.5">
                          Rate: ₹{unitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unit
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{n(invoice.subtotal || invoice.total_amount).toLocaleString()}</span>
                </div>
                {n(invoice.discount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>−₹{n(invoice.discount).toLocaleString()}</span>
                  </div>
                )}
                {n(invoice.wallet_amount_used) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Wallet Deduct:</span>
                    <span>−₹{n(invoice.wallet_amount_used).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-[13px] pt-1 border-t border-slate-300">
                  <span>Net Amount:</span>
                  <span>₹{n(invoice.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Paid:</span>
                  <span>₹{paid.toLocaleString()}</span>
                </div>
                {due > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>Balance Due:</span>
                    <span>₹{due.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase text-slate-800">{invoice.payment_method || 'CASH'}</span>
                </div>
              </div>

              {/* Notes / Footer */}
              <div className="pt-3 text-center text-[10px] space-y-1 text-slate-600">
                {invoice.notes && <p className="italic text-[9px] text-slate-500">{invoice.notes}</p>}
                <p className="font-bold tracking-wider">*** THANK YOU ***</p>
                <p>Computer generated invoice. No signature required.</p>
              </div>
            </div>
          ) : (
            /* ─── Standard A4 / A5 Sheet Layout ─── */
            <A4Sheet
              pageSize={layout === 'a5' ? 'a5' : 'a4'}
              header={
                <PrintableReportHeader
                  title={deptDocTitle}
                  subtitle={`Invoice No: ${invoice.invoice_number}`}
                  department={deptHeaderLabel}
                  hideHospitalHeader={hideHeader}
                  extraHeaderRight={<PayBadge due={due} paid={paid} />}
                />
              }
              footer={
                <PrintableReportFooter
                  signatoryTitle="Authorized Accounts Desk"
                  signatorySubtitle={deptSignatorySubtitle}
                  showSignatory={true}
                  showComputerGeneratedNotice={true}
                  hideHospitalFooter={hideHeader}
                  pageNumber={1}
                  totalPages={1}
                />
              }
            >
              <div className={`flex-1 flex flex-col justify-between ${layout === 'a5' ? 'py-1 px-4 print:px-[6mm] space-y-1.5 text-[10px]' : 'py-2.5 px-6 sm:px-8 print:px-[12mm] space-y-4'}`}>
                <div className={layout === 'a5' ? 'space-y-1.5' : 'space-y-4'}>
                  <div className={`grid grid-cols-2 gap-3 rounded-md ${layout === 'a5' ? 'p-1.5 text-[9.5px]' : 'p-2.5'}`} style={{ background: '#F7F8FA', border: '0.5px solid #E3E8EE' }}>
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9ca3af' }}>Patient Information</p>
                      <p className={`font-semibold ${layout === 'a5' ? 'text-xs' : 'text-sm'}`} style={{ color: '#111827' }}>{invoice.patient_name || 'Patient'}</p>
                      <p className="font-mono text-xs mt-0.5" style={{ color: '#4b5563' }}>VID / MRN: {invoice.patient_vid || invoice.patient_mrn || '—'}</p>
                      {invoice.reason_for_attendance && (
                        <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
                          <strong>Reason:</strong> {invoice.reason_for_attendance}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9ca3af' }}>Invoice Details</p>
                      <p className={`font-mono font-bold ${layout === 'a5' ? 'text-xs' : 'text-sm'}`} style={{ color: '#0B4F6C' }}>{invoice.invoice_number}</p>
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
                        <th className={layout === 'a5' ? 'p-1 text-[9px]' : 'p-2.5'}>Item / Procedure Description</th>
                        <th className={`text-center ${layout === 'a5' ? 'p-1 text-[9px]' : 'p-2.5'}`}>Qty</th>
                        <th className={`text-right ${layout === 'a5' ? 'p-1 text-[9px]' : 'p-2.5'}`}>Unit Rate (₹)</th>
                        <th className={`text-right ${layout === 'a5' ? 'p-1 text-[9px]' : 'p-2.5'}`}>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items?.map((it, i) => (
                        <tr key={i} style={{ borderBottom: '0.5px solid #f3f4f6' }}>
                          <td className={`font-medium ${layout === 'a5' ? 'p-1 text-[9.5px]' : 'p-2.5'}`} style={{ color: '#111827' }}>{it.description || it.item_name || 'Medication Dispensed'}</td>
                          <td className={`text-center ${layout === 'a5' ? 'p-1 text-[9.5px]' : 'p-2.5'}`} style={{ color: '#6b7280' }}>{it.quantity}</td>
                          <td className={`text-right font-mono ${layout === 'a5' ? 'p-1 text-[9.5px]' : 'p-2.5'}`} style={{ color: '#374151' }}>₹{getUnitPrice(it).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className={`text-right font-mono font-semibold ${layout === 'a5' ? 'p-1 text-[9.5px]' : 'p-2.5'}`} style={{ color: '#111827' }}>₹{n(it.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className={`${layout === 'a5' ? 'pt-1.5 space-y-0.5 text-[9.5px]' : 'pt-3 space-y-1 text-xs'}`} style={{ borderTop: '1px solid #e5e7eb' }}>
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
                    <div className="flex justify-between" style={{ color: '#9ca3af', fontSize: layout === 'a5' ? '8.5px' : '10px' }}>
                      <span>GST (Healthcare Services — Exempted):</span>
                      <span className="font-mono">₹0.00 (0%)</span>
                    </div>
                    {n(invoice.wallet_amount_used) > 0 && (
                      <div className="flex justify-between font-semibold" style={{ color: '#0D7A55' }}>
                        <span>Deducted from Advance Wallet:</span>
                        <span className="font-mono">− ₹{n(invoice.wallet_amount_used).toLocaleString()}</span>
                      </div>
                    )}
                    <div className={`flex justify-between font-bold pt-1 ${layout === 'a5' ? 'text-xs' : 'text-sm'}`} style={{ borderTop: '1px solid #d1d5db', color: '#111827' }}>
                      <span>Net Total Billable:</span>
                      <span className="font-mono" style={{ color: '#0B4F6C' }}>₹{n(invoice.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold" style={{ color: '#0D7A55' }}>
                      <span>Total Amount Paid {invoice.payment_method ? `(${invoice.payment_method})` : ''}:</span>
                      <span className="font-mono">₹{paid.toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between font-bold ${layout === 'a5' ? 'text-xs' : 'text-sm'}`} style={{ color: due > 0 ? '#B91C1C' : '#0D7A55' }}>
                      <span>Balance Due:</span>
                      <span className="font-mono">₹{due.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms & Notes */}
                <div className={`border-t border-gray-200 text-gray-500 ${layout === 'a5' ? 'pt-1 pb-0 text-[8px]' : 'pt-3 pb-1 text-[10px]'}`}>
                  {layout === 'a5' ? (
                    <p><strong>Terms:</strong> Payments non-refundable · Healthcare services GST exempted under Notification No. 12/2017-CT(R).</p>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-700 mb-0.5">Terms & Conditions:</p>
                      <p>1. Payments received are non-refundable.</p>
                      <p>2. Healthcare services are exempted from GST under Notification No. 12/2017-CT(R).</p>
                    </>
                  )}
                </div>
              </div>
            </A4Sheet>
          )}
        </div>
      )}
    </PrintableModal>
  );
}
