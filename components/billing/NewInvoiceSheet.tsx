'use client';

import React from 'react';
import UniversalBillingModal from './UniversalBillingModal';
import type {
  Invoice,
  LineItem,
  DiscountType,
} from '@/features/billing/types';

export interface NewInvoiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: Invoice) => void;
  /** Pre-fill and lock patient (from patient profile context) */
  defaultPatientId?: string;
  lockedPatient?: boolean;
  /** Pre-fill department source */
  defaultSource?: string;
  defaultReason?: string;
  /** Pre-fill line items (from package context, prescription, bed stay) */
  defaultItems?: LineItem[];
  defaultDiscount?: number;
  defaultDiscountType?: DiscountType;
  defaultPaymentStatus?: 'paid' | 'pending';
  packageId?: string;
}

/**
 * Unified Invoice slide-in sheet — single source of truth for invoice creation
 * across all hospital departments (OPD, Pharmacy POS, IPD, CosGyn, Fertility, LIMS, Central Billing).
 * Delegates directly to UniversalBillingModal to enforce identical billing architecture everywhere.
 */
export default function NewInvoiceSheet({
  isOpen,
  onClose,
  onSuccess,
  defaultPatientId = '',
  lockedPatient = false,
  defaultSource = 'opd',
  defaultReason = '',
  defaultItems,
  defaultDiscount = 0,
  defaultDiscountType = 'amount',
  defaultPaymentStatus = 'paid',
  packageId,
}: NewInvoiceSheetProps) {
  return (
    <UniversalBillingModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      patientId={defaultPatientId}
      lockedPatient={lockedPatient}
      sourceModule={defaultSource}
      defaultReason={defaultReason}
      defaultItems={defaultItems}
      defaultDiscount={defaultDiscount}
      defaultDiscountType={defaultDiscountType}
      defaultPaymentStatus={defaultPaymentStatus}
      packageId={packageId}
    />
  );
}

export { NewInvoiceSheet as UnifiedInvoiceSheet };
