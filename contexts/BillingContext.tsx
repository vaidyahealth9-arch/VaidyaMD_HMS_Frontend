'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import UniversalBillingModal, { UniversalBillingModalProps } from '@/components/billing/UniversalBillingModal';
import type { Invoice, LineItem, DiscountType } from '@/features/billing/types';

export interface OpenBillingOptions {
  patientId?: string;
  lockedPatient?: boolean;
  sourceModule?: string; // 'opd', 'ipd', 'pharmacy', 'lims', 'fertility', 'cosgyn', 'package', 'general'
  sourceReferenceId?: string;
  defaultReason?: string;
  defaultItems?: LineItem[];
  defaultDiscount?: number;
  defaultDiscountType?: DiscountType;
  defaultPaymentStatus?: 'paid' | 'pending';
  packageId?: string;
  onSuccess?: (invoice: Invoice) => void;
}

interface BillingContextValue {
  openBilling: (options?: OpenBillingOptions) => void;
  closeBilling: () => void;
  isOpen: boolean;
}

const BillingContext = createContext<BillingContextValue | null>(null);

let globalOpenBilling: ((options?: OpenBillingOptions) => void) | null = null;

/**
 * Global billing helper callable anywhere (in non-React callbacks or standalone utils).
 */
export const openUniversalBilling = (options?: OpenBillingOptions) => {
  if (globalOpenBilling) {
    globalOpenBilling(options);
  } else {
    console.warn('BillingProvider is not mounted yet');
  }
};

export function BillingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<OpenBillingOptions>({});

  const openBilling = useCallback((options?: OpenBillingOptions) => {
    setModalOptions(options || {});
    setIsOpen(true);
  }, []);

  const closeBilling = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Set global handler
  React.useEffect(() => {
    globalOpenBilling = openBilling;
    return () => {
      globalOpenBilling = null;
    };
  }, [openBilling]);

  return (
    <BillingContext.Provider value={{ openBilling, closeBilling, isOpen }}>
      {children}
      <UniversalBillingModal
        isOpen={isOpen}
        onClose={closeBilling}
        onSuccess={(invoice) => {
          if (modalOptions.onSuccess) {
            modalOptions.onSuccess(invoice);
          }
        }}
        patientId={modalOptions.patientId}
        lockedPatient={modalOptions.lockedPatient}
        sourceModule={modalOptions.sourceModule}
        sourceReferenceId={modalOptions.sourceReferenceId}
        defaultReason={modalOptions.defaultReason}
        defaultItems={modalOptions.defaultItems}
        defaultDiscount={modalOptions.defaultDiscount}
        defaultDiscountType={modalOptions.defaultDiscountType}
        defaultPaymentStatus={modalOptions.defaultPaymentStatus}
        packageId={modalOptions.packageId}
      />
    </BillingContext.Provider>
  );
}

export function useBillingModal(): BillingContextValue {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBillingModal must be used within a BillingProvider');
  }
  return context;
}
