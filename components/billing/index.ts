// Billing components — single import path for all billing UI
export { default as StatusBadge } from './StatusBadge';
export { default as PatientSearchDropdown } from './PatientSearchDropdown';
export { default as InvoiceLineItemsEditor } from './InvoiceLineItemsEditor';
export { default as RecordPaymentModal, UnifiedPaymentModal } from './RecordPaymentModal';
export { default as ReceiptModal } from './ReceiptModal';
export { default as NewInvoiceSheet, UnifiedInvoiceSheet } from './NewInvoiceSheet';
export { default as UniversalBillingModal } from './UniversalBillingModal';
export { BillingProvider, useBillingModal, openUniversalBilling } from '@/contexts/BillingContext';
export type { OpenBillingOptions } from '@/contexts/BillingContext';
export { default as PatientWalletCard, UniversalWalletCard } from './PatientWalletCard';
export { default as InvoicesTab } from './tabs/InvoicesTab';
export { default as PackagesTab } from './tabs/PackagesTab';
export type { DataTableColumn } from '@/components/common/DataTable';

