'use client';

import React from 'react';
import FertilityWalletCard, { type FertilityWalletCardProps } from '@/components/fertility/FertilityWalletCard';

export interface PatientWalletCardProps extends FertilityWalletCardProps {}

/**
 * Universal Patient Advance Wallet Card & Transaction Ledger —
 * Single reusable financial ledger component across Patient Profiles,
 * Central Billing, Inpatient Department, and Fertility.
 */
export default function PatientWalletCard(props: PatientWalletCardProps) {
  return <FertilityWalletCard {...props} />;
}

export { PatientWalletCard as UniversalWalletCard };
