'use client';

import PrintableInvoice from '@/components/common/PrintableInvoice';
import type { Invoice } from '@/features/billing/types';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Receipt / Invoice preview modal — single shared source replacing
 * the 3 inline receipt/print blocks in billing/page, cosgyn/page,
 * and patients/[id]/page.
 *
 * Directly renders <PrintableInvoice> which provides complete modal
 * overlay, hospital header toggle, itemization, and browser print functionality.
 */
export default function ReceiptModal({ invoice, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !invoice) return null;

  // Ensure items fallback if list endpoint didn't include full line items
  const resolvedInvoice = {
    ...invoice,
    items: (Array.isArray(invoice.items) && invoice.items.length > 0)
      ? invoice.items
      : [
          {
            description: (invoice as any).reason_for_attendance || `${invoice.appointment_source || 'OPD'} Consultation / Hospital Care Service`,
            quantity: 1,
            unit_price: invoice.total_amount,
            total: invoice.total_amount,
          },
        ],
  };

  return (
    <PrintableInvoice
      invoice={resolvedInvoice as any}
      onClose={onClose}
    />
  );
}
