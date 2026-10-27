import React, { useEffect, useId, useRef, useState } from 'react';
import { useQuotation } from '../store/context';
import { fileToDataUrl } from '../utils/image';
import { LogoPicker } from './LogoPicker';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, triggerRef }) => {
  const { settings, dispatch, isSaved, storageError } = useQuotation();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const [qrErrorMessage, setQrErrorMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Accessible unique IDs for form controls
  const agencyNameId = useId();
  const addressId = useId();
  const paymentToggleId = useId();
  const holderId = useId();
  const bankNameId = useId();
  const accountNoId = useId();
  const ifscId = useId();
  const swiftId = useId();
  const upiIdField = useId();
  const qrInputId = useId();

  // Manage body scroll lock and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    const activeEl = document.activeElement as HTMLElement | null;
    previousActiveElement.current = (activeEl && activeEl !== document.body)
      ? activeEl
      : (triggerRef?.current || null);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the first focusable element inside the panel
    const focusTimer = setTimeout(() => {
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      }
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, triggerRef]);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!panelRef.current) return;
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAgencyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { agencyName: e.target.value },
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { address: e.target.value },
    });
  };

  const handlePaymentToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { paymentEnabled: e.target.checked },
    });
  };

  const handleBankChange = (field: keyof typeof settings.bank, value: string) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        bank: {
          ...settings.bank,
          [field]: value,
        },
      },
    });
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrErrorMessage(null);
    try {
      const dataUrl = await fileToDataUrl(file, {
        maxWidth: 600,
        maxHeight: 600,
        maxSizeBytes: 2 * 1024 * 1024,
      });

      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: { qrImage: dataUrl },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setQrErrorMessage(err.message);
      } else {
        setQrErrorMessage('Failed to process QR code image.');
      }
    } finally {
      if (qrInputRef.current) {
        qrInputRef.current.value = '';
      }
    }
  };

  const handleRemoveQr = () => {
    setQrErrorMessage(null);
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { qrImage: undefined },
    });
  };

  const handleResetConfirm = () => {
    dispatch({ type: 'RESET_SETTINGS' });
    setConfirmReset(false);
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-left">
            <h2 id="settings-panel-title" className="settings-title">Agency Settings</h2>
            <div className="settings-saved-status">
              {storageError ? (
                <span className="status-badge status-badge--error">Storage Full</span>
              ) : isSaved ? (
                <span className="status-badge status-badge--saved">Saved ✓</span>
              ) : (
                <span className="status-badge status-badge--saving">Saving...</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings panel"
          >
            ✕
          </button>
        </div>

        {/* Non-blocking storage error alert */}
        {storageError && (
          <div className="settings-alert-banner" role="alert">
            Storage is full. Remove the QR or a custom logo
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="settings-body">
          {/* SECTION A: Agency */}
          <section className="settings-group">
            <h3 className="settings-group-title">A) Agency Details</h3>
            <div className="settings-field">
              <label htmlFor={agencyNameId} className="settings-label">
                Agency Name
              </label>
              <input
                id={agencyNameId}
                type="text"
                className="settings-input"
                value={settings.agencyName}
                onChange={handleAgencyNameChange}
                placeholder="e.g. Faiz Dev & Co."
              />
            </div>
            <div className="settings-field">
              <label htmlFor={addressId} className="settings-label">
                Address
              </label>
              <textarea
                id={addressId}
                rows={3}
                className="settings-textarea"
                value={settings.address}
                onChange={handleAddressChange}
                placeholder="Enter agency address..."
              />
            </div>
          </section>

          {/* SECTION B: Logo */}
          <section className="settings-group">
            <h3 className="settings-group-title">B) Agency Logo</h3>
            <LogoPicker />
          </section>

          {/* SECTION C: Payment details */}
          <section className="settings-group">
            <div className="settings-group-header-with-toggle">
              <h3 className="settings-group-title">C) Payment Details</h3>
              <label htmlFor={paymentToggleId} className="settings-toggle-label">
                <input
                  id={paymentToggleId}
                  type="checkbox"
                  className="settings-toggle-checkbox"
                  checked={settings.paymentEnabled}
                  onChange={handlePaymentToggle}
                />
                <span className="settings-toggle-text">Show payment block on quotations</span>
              </label>
            </div>

            <div className={`settings-subgroup ${!settings.paymentEnabled ? 'settings-subgroup--disabled' : ''}`}>
              <div className="settings-field">
                <label htmlFor={holderId} className="settings-label">
                  Account Holder Name
                </label>
                <input
                  id={holderId}
                  type="text"
                  className="settings-input"
                  value={settings.bank.holder}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('holder', e.target.value)}
                  placeholder="e.g. Faiz Dev & Co."
                />
              </div>

              <div className="settings-field">
                <label htmlFor={bankNameId} className="settings-label">
                  Bank Name
                </label>
                <input
                  id={bankNameId}
                  type="text"
                  className="settings-input"
                  value={settings.bank.bankName}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('bankName', e.target.value)}
                  placeholder="e.g. Federal Bank"
                />
              </div>

              <div className="settings-field">
                <label htmlFor={accountNoId} className="settings-label">
                  Account Number
                </label>
                <input
                  id={accountNoId}
                  type="text"
                  className="settings-input"
                  value={settings.bank.accountNo}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('accountNo', e.target.value)}
                  placeholder="e.g. 123456789012"
                />
              </div>

              <div className="settings-field">
                <label htmlFor={ifscId} className="settings-label">
                  IFSC Code
                </label>
                <input
                  id={ifscId}
                  type="text"
                  className="settings-input"
                  value={settings.bank.ifsc}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('ifsc', e.target.value)}
                  placeholder="e.g. FDRL0001234"
                />
              </div>

              <div className="settings-field">
                <label htmlFor={swiftId} className="settings-label">
                  SWIFT/BIC Code
                </label>
                <input
                  id={swiftId}
                  type="text"
                  className="settings-input"
                  value={settings.bank.swift}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('swift', e.target.value)}
                  placeholder="e.g. FDRLINBBXXX"
                />
              </div>

              <div className="settings-field">
                <label htmlFor={upiIdField} className="settings-label">
                  UPI ID
                </label>
                <input
                  id={upiIdField}
                  type="text"
                  className="settings-input"
                  value={settings.bank.upiId}
                  disabled={!settings.paymentEnabled}
                  onChange={(e) => handleBankChange('upiId', e.target.value)}
                  placeholder="e.g. faizdev@upi"
                />
              </div>
            </div>
          </section>

          {/* SECTION D: UPI QR */}
          <section className="settings-group">
            <h3 className="settings-group-title">D) UPI QR Code</h3>
            <div className={`settings-subgroup ${!settings.paymentEnabled ? 'settings-subgroup--disabled' : ''}`}>
              {settings.qrImage ? (
                <div className="qr-preview-box">
                  <div className="qr-preview-stage">
                    <img src={settings.qrImage} alt="Uploaded UPI QR Code" className="qr-preview-img" />
                  </div>
                  <div className="qr-actions">
                    <span className="qr-caption">Uploaded QR (Max 600×600)</span>
                    <button
                      type="button"
                      className="settings-btn-danger-outline"
                      onClick={handleRemoveQr}
                      disabled={!settings.paymentEnabled}
                    >
                      Remove QR
                    </button>
                  </div>
                </div>
              ) : (
                <div className="qr-upload-box">
                  <button
                    type="button"
                    className="qr-upload-btn"
                    onClick={() => qrInputRef.current?.click()}
                    disabled={!settings.paymentEnabled}
                  >
                    + Upload UPI QR Image
                  </button>
                  <span className="settings-caption">PNG, JPG, or SVG up to 2MB</span>
                </div>
              )}

              <input
                ref={qrInputRef}
                id={qrInputId}
                type="file"
                accept=".png,.jpg,.jpeg,.svg,.webp"
                className="visually-hidden"
                disabled={!settings.paymentEnabled}
                onChange={handleQrUpload}
              />

              {qrErrorMessage && (
                <div className="settings-field-error" role="alert">
                  {qrErrorMessage}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer with Reset to defaults */}
        <div className="settings-footer">
          {confirmReset ? (
            <div className="settings-reset-confirm">
              <span className="settings-confirm-text">Restore Faiz Dev & Co. defaults?</span>
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  className="settings-btn-danger-sm"
                  onClick={handleResetConfirm}
                >
                  Yes, Reset Settings
                </button>
                <button
                  type="button"
                  className="settings-btn-secondary-sm"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="settings-reset-link"
              onClick={() => setConfirmReset(true)}
            >
              Reset to defaults
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
