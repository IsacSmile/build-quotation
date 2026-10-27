import { Settings } from '../types';

export interface PaymentRow {
  label: string;
  value: string;
}

/**
 * Returns formatted payment rows in the exact specified order:
 * 1. Account Holder Name
 * 2. Bank Name
 * 3. Account Number
 * 4. IFSC Code
 * 5. SWIFT/BIC Code
 * 6. UPI ID (only if non-empty)
 *
 * Empty values are filtered out.
 */
export function getPaymentRows(settings: Settings): PaymentRow[] {
  const bank = settings.bank;
  if (!bank) return [];

  const candidateRows: PaymentRow[] = [
    { label: 'Account Holder Name', value: bank.holder || '' },
    { label: 'Bank Name', value: bank.bankName || '' },
    { label: 'Account Number', value: bank.accountNo || '' },
    { label: 'IFSC Code', value: bank.ifsc || '' },
    { label: 'SWIFT/BIC Code', value: bank.swift || '' },
  ];

  // UPI ID as a final bullet only if upiId is non-empty
  if (bank.upiId && bank.upiId.trim() !== '') {
    candidateRows.push({ label: 'UPI ID', value: bank.upiId.trim() });
  }

  return candidateRows.filter((row) => row.value.trim() !== '');
}

/**
 * Returns true if the payment block should render content on the quotation.
 * Requires paymentEnabled to be true AND at least one of (QR image or non-empty bank rows).
 */
export function hasPaymentBlock(settings: Settings): boolean {
  if (!settings.paymentEnabled) return false;
  const hasQr = Boolean(settings.qrImage && settings.qrImage.trim() !== '');
  const hasRows = getPaymentRows(settings).length > 0;
  return hasQr || hasRows;
}
