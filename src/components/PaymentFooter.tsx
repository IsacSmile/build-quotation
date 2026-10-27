import React from 'react';
import { useQuotation } from '../store/context';
import { getPaymentRows, hasPaymentBlock } from '../utils/payment';

interface PaymentFooterProps {
  onOpenSettings?: () => void;
}

export const PaymentFooter: React.FC<PaymentFooterProps> = ({ onOpenSettings }) => {
  const { settings } = useQuotation();

  // If payment block is disabled in Settings, render nothing at all
  if (!settings.paymentEnabled) {
    return null;
  }

  const hasContent = hasPaymentBlock(settings);

  // If payment is enabled but there are no details and no QR, show editor-only empty hint
  if (!hasContent) {
    return (
      <div
        className="payment-empty-hint no-print"
        onClick={onOpenSettings}
        role="button"
        tabIndex={0}
        title="Edit in Settings"
        aria-label="Payment details are empty. Click to add them in Settings"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenSettings?.();
          }
        }}
      >
        Payment details are empty. Click to add them in Settings.
      </div>
    );
  }

  const rows = getPaymentRows(settings);
  const hasQr = Boolean(settings.qrImage && settings.qrImage.trim() !== '');

  return (
    <div
      className="paper-payment-footer keep-together editable-hint"
      onClick={onOpenSettings}
      role="button"
      tabIndex={0}
      title="Edit in Settings"
      aria-label="Click to edit payment details in Settings"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenSettings?.();
        }
      }}
    >
      {/* Left column: QR code image as-is, width 150px, rounded 14px */}
      {hasQr && (
        <div className="payment-qr-col">
          <img
            src={settings.qrImage}
            alt="Payment QR Code"
            className="payment-qr-img"
          />
        </div>
      )}

      {/* Right column: Bullet list of bank details */}
      {rows.length > 0 && (
        <div className={`payment-details-col ${!hasQr ? 'payment-details-col--full' : ''}`}>
          <ul className="payment-details-list">
            {rows.map((row) => (
              <li key={row.label} className="payment-detail-item">
                <span className="payment-bullet" aria-hidden="true">•</span>
                <span className="payment-text">
                  {row.label}: <b>{row.value}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
