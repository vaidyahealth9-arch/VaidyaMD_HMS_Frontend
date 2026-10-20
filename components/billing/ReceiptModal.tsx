'use client';

import PrintableInvoice from '@/components/common/PrintableInvoice';
import type { Invoice } from '@/features/billing/types';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  defaultLayout?: 'a4' | 'a5' | 'thermal';
}

/**
 * Receipt / Invoice preview modal — single shared source replacing
 * the inline receipt/print blocks across pages.
 *
 * Directly renders <PrintableInvoice> with A4 letterhead or 80mm thermal receipt formats.
 */
export default function ReceiptModal({ invoice, isOpen, onClose, defaultLayout = 'a4' }: ReceiptModalProps) {
  if (!isOpen || !invoice) return null;

  // Ensure items fallback if list endpoint didn't include full line items
  const resolvedInvoice = {
    ...invoice,
    items: (Array.isArray(invoice.items) && invoice.items.length > 0)
      ? invoice.items.map((it: any) => {
          const qty = Number(it.quantity || it.quantity_dispensed || 1);
          const uPrice = it.unit_price ?? it.unitPrice ?? it.rate ?? it.price ?? (it.total ? Number(it.total) / qty : 0);
          const tot = it.total ?? it.total_price ?? (qty * Number(uPrice));
          return {
            ...it,
            description: it.description || it.item_name || 'Billable Item',
            quantity: qty,
            unit_price: Number(uPrice) || 0,
            total: Number(tot) || 0,
          };
        })
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
      defaultLayout={defaultLayout}
    />
  );
}
