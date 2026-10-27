import React from 'react';
import { useQuotation } from '../store/context';
import { EditableText } from './EditableText';

interface ToolbarProps {
  onNewQuotation: () => void;
  onOpenQuotationList: () => void;
  onOpenSettings: () => void;
  quotationListTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  settingsTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewQuotation,
  onOpenQuotationList,
  onOpenSettings,
  quotationListTriggerRef,
  settingsTriggerRef,
}) => {
  const { activeQuotation, dispatch, isSaved, storageError } = useQuotation();

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

  return (
    <header className="app-toolbar no-print" role="banner">
      {/* Left side: Brand + Title */}
      <div className="toolbar-left">
        <span className="toolbar-brand">Quotation Builder</span>
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

        {/* 4. Export PDF (Disabled for Phase 6) */}
        <button
          type="button"
          className="toolbar-btn"
          disabled={true}
          title="Coming in the next step"
          aria-label="Export PDF (Coming in next step)"
        >
          <span className="toolbar-btn-icon" aria-hidden="true">📄</span>
          <span className="toolbar-btn-text">Export PDF</span>
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
    </header>
  );
};
