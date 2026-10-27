import React, { useEffect, useRef, useState } from 'react';
import { useQuotation } from '../store/context';
import { EditableText } from './EditableText';
import faizDevCoLogo from '../assets/logos/faiz-dev-co-logo.png';

interface ToolbarProps {
  onNewQuotation: () => void;
  onOpenQuotationList: () => void;
  onOpenSettings: () => void;
  quotationListTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  settingsTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

import { isBlockNonEmpty } from '../store/storage';

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewQuotation,
  onOpenQuotationList,
  onOpenSettings,
  quotationListTriggerRef,
  settingsTriggerRef,
}) => {
  const {
    activeQuotation,
    dispatch,
    isSaved,
    storageError,
    flushSave,
    getLatestState,
  } = useQuotation();

  const [isExporting, setIsExporting] = useState(false);
  const [emptySectionsWarning, setEmptySectionsWarning] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'error' | 'warning' } | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close pre-check notice on Escape key
  useEffect(() => {
    if (emptySectionsWarning === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmptySectionsWarning(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emptySectionsWarning]);

  const showToast = (text: string, type: 'error' | 'warning') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleTitleCommit = (newTitle: string) => {
    if (!activeQuotation) return;
    dispatch({
      type: 'UPDATE_QUOTATION_TITLE',
      payload: {
        id: activeQuotation.id,
        title: newTitle.slice(0, 80),
        isManual: true,
      },
    });
  };

  const handleNewClick = () => {
    onNewQuotation();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      // 1. Blur active element to trigger any pending onBlur commit
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Wait 350ms for EditableText debounce (300ms) to land
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Flush save to guarantee state is committed
      flushSave();

      // Read latest quotation and settings from context
      const latestState = getLatestState();
      const currentQuotation =
        latestState.quotations.find((q) => q.id === latestState.activeQuotationId) ||
        latestState.quotations[0];

      if (!currentQuotation) {
        showToast('No active quotation to export.', 'error');
        setIsExporting(false);
        return;
      }

      // 2. Dynamic import of PDF export engine
      const { exportPdf } = await import('../pdf/exportPdf');

      // 3. Perform export
      const result = await exportPdf(currentQuotation, latestState.settings);

      if (!result.success) {
        showToast(result.error || 'Failed to export PDF.', 'error');
      } else if (result.warnings && result.warnings.length > 0) {
        showToast(result.warnings.join(' '), 'warning');
      }
    } catch (err: any) {
      console.error('Export PDF error:', err);
      showToast(err?.message || 'Failed to export PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    // 1. Blur and flush to inspect up-to-date quotation state
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    flushSave();

    const latestState = getLatestState();
    const currentQuotation =
      latestState.quotations.find((q) => q.id === latestState.activeQuotationId) ||
      latestState.quotations[0];

    if (!currentQuotation) {
      showToast('No active quotation to export.', 'error');
      return;
    }

    // Check sections with headings but no non-empty content
    const emptyCount = currentQuotation.sections.filter((s) => {
      const hasHeading = Boolean(s.heading && s.heading.trim() !== '');
      if (!hasHeading) return false;
      const hasContent = s.blocks.some((b) => isBlockNonEmpty(b));
      return !hasContent;
    }).length;

    if (emptyCount > 0) {
      setEmptySectionsWarning(emptyCount);
      return;
    }

    // No empty sections, export immediately
    executeExport();
  };

  return (
    <header className="app-toolbar no-print" role="banner">
      {/* Left side: Brand + Title */}
      <div className="toolbar-left">
        <div className="toolbar-brand-container" title="Quotation Builder – Powered by Faiz Dev & Co.">
          <img
            src={faizDevCoLogo}
            alt="Faiz Dev & Co."
            className="toolbar-brand-logo"
          />
          <div className="toolbar-brand-text">
            <span className="toolbar-brand">Quotation Builder</span>
            <span className="toolbar-powered-by">Powered by Faiz Dev & Co.</span>
          </div>
        </div>
        <span className="toolbar-divider" aria-hidden="true" />
        <div className="toolbar-title-wrapper">
          <EditableText
            value={activeQuotation?.title || ''}
            onCommit={handleTitleCommit}
            placeholder="Untitled quotation"
            multiline={false}
            className="toolbar-title-input"
            ariaLabel="Quotation Title"
          />
        </div>
      </div>

      {/* Right side: Actions in exact order */}
      <div className="toolbar-right">
        {/* 1. + New */}
        <button
          type="button"
          className="toolbar-btn toolbar-btn--primary"
          onClick={handleNewClick}
          aria-label="Create new quotation"
          title="Create a new quotation (+ New)"
        >
          <span className="toolbar-btn-icon" aria-hidden="true">+</span>
          <span className="toolbar-btn-text">New</span>
        </button>

        {/* 2. My Quotations */}
        <button
          ref={quotationListTriggerRef as any}
          type="button"
          className="toolbar-btn"
          onClick={onOpenQuotationList}
          aria-label="View quotation list"
          title="View all saved quotations"
        >
          <span className="toolbar-btn-icon" aria-hidden="true">📁</span>
          <span className="toolbar-btn-text">My Quotations</span>
        </button>

        {/* 3. Settings */}
        <button
          ref={settingsTriggerRef as any}
          type="button"
          className="toolbar-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Open agency settings"
        >
          <span className="toolbar-btn-icon" aria-hidden="true">⚙️</span>
          <span className="toolbar-btn-text">Settings</span>
        </button>

        {/* 4. Export PDF */}
        <button
          type="button"
          className="toolbar-btn toolbar-btn--export"
          onClick={handleExportPdf}
          disabled={isExporting}
          title={isExporting ? 'Generating PDF...' : 'Export PDF'}
          aria-label={isExporting ? 'Generating PDF' : 'Export PDF'}
        >
          <span className="toolbar-btn-icon" aria-hidden="true">📄</span>
          <span className="toolbar-btn-text">
            {isExporting ? 'Generating...' : 'Export PDF'}
          </span>
        </button>

        {/* 5. Saved Indicator */}
        <div
          className={`toolbar-saved-indicator ${
            storageError
              ? 'toolbar-saved-indicator--error'
              : isSaved
              ? 'toolbar-saved-indicator--saved'
              : 'toolbar-saved-indicator--saving'
          }`}
          role="status"
          aria-live="polite"
        >
          {storageError
            ? 'Storage is full'
            : isSaved
            ? 'Saved ✓'
            : 'Saving...'}
        </div>
      </div>

      {/* Non-blocking inline toast for warnings or errors */}
      {toast && (
        <div className="toolbar-toast-container">
          <div
            className={`toolbar-toast toolbar-toast--${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Export Pre-Check Notice */}
      {emptySectionsWarning !== null && (
        <div
          className="toolbar-precheck-notice"
          role="alert"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            padding: '8px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: '#92400e',
            zIndex: 950,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          }}
        >
          <span className="toolbar-precheck-text">
            {emptySectionsWarning} {emptySectionsWarning === 1 ? 'section is' : 'sections are'} empty and will print as {emptySectionsWarning === 1 ? 'heading' : 'headings'} only.
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="export-precheck-btn export-precheck-btn--confirm"
              onClick={() => {
                setEmptySectionsWarning(null);
                executeExport();
              }}
              style={{
                backgroundColor: '#d97706',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Export anyway
            </button>
            <button
              type="button"
              className="export-precheck-btn export-precheck-btn--cancel"
              onClick={() => setEmptySectionsWarning(null)}
              style={{
                backgroundColor: '#ffffff',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

