import React, { useEffect, useRef, useState } from 'react';
import { Quotation } from '../types';
import { useQuotation } from '../store/context';

interface QuotationListProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  onNewQuotation: () => void;
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const QuotationList: React.FC<QuotationListProps> = ({
  isOpen,
  onClose,
  triggerRef,
  onNewQuotation,
}) => {
  const { quotations, activeQuotationId, dispatch } = useQuotation();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Manage body scroll lock and focus restoration
  useEffect(() => {
    if (!isOpen) return;

    const activeEl = document.activeElement as HTMLElement | null;
    previousActiveElement.current =
      activeEl && activeEl !== document.body ? activeEl : triggerRef?.current || null;

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

  // Sort quotations by updatedAt descending
  const sortedQuotations = [...quotations].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleSelectQuotation = (quotation: Quotation) => {
    dispatch({
      type: 'SET_ACTIVE_QUOTATION',
      payload: { id: quotation.id },
    });
    onClose();
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({
      type: 'DUPLICATE_QUOTATION',
      payload: { id },
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dispatch({
      type: 'DELETE_QUOTATION',
      payload: { id },
    });
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleNewInList = () => {
    onNewQuotation();
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="settings-overlay no-print" onClick={onClose}>
      <div
        ref={panelRef}
        className="quotation-list-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quotation-list-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="quotation-list-header">
          <div className="quotation-list-header-left">
            <h2 id="quotation-list-panel-title" className="quotation-list-title">
              My Quotations
            </h2>
          </div>
          <div className="quotation-list-header-actions">
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              onClick={handleNewInList}
              aria-label="Create new quotation"
            >
              <span className="toolbar-btn-icon" aria-hidden="true">+</span>
              <span className="toolbar-btn-text">New quotation</span>
            </button>
            <button
              type="button"
              className="settings-close-btn"
              onClick={onClose}
              aria-label="Close quotation list"
            >
              ✕
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="quotation-list-body" role="list">
          {sortedQuotations.length === 0 ? (
            <div className="quotation-list-empty">
              No quotations found. Click "+ New quotation" to create one.
            </div>
          ) : (
            sortedQuotations.map((q) => {
              const isActive = q.id === activeQuotationId;
              const isConfirmingDelete = deleteConfirmId === q.id;

              return (
                <div
                  key={q.id}
                  className={`quotation-row ${isActive ? 'quotation-row--active' : ''}`}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => handleSelectQuotation(q)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectQuotation(q);
                    }
                  }}
                  aria-label={`Open quotation: ${q.title || 'Untitled quotation'}`}
                >
                  <div className="quotation-row-info">
                    <div className="quotation-row-title-line">
                      <span className="quotation-row-title">
                        {q.title || 'Untitled quotation'}
                      </span>
                      {isActive && (
                        <span className="quotation-badge-active" aria-label="Current active quotation">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="quotation-row-meta">
                      <span title={new Date(q.updatedAt).toLocaleString()}>
                        Updated {formatRelativeTime(q.updatedAt)}
                      </span>
                      <span className="quotation-row-meta-dot" aria-hidden="true">•</span>
                      <span>
                        {q.sections.length} {q.sections.length === 1 ? 'section' : 'sections'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Duplicate / Delete */}
                  <div className="quotation-row-actions" onClick={(e) => e.stopPropagation()}>
                    {isConfirmingDelete ? (
                      <div className="quotation-row-confirm" role="alert">
                        <span className="quotation-confirm-prompt">Delete?</span>
                        <button
                          type="button"
                          className="quotation-confirm-btn quotation-confirm-btn--yes"
                          onClick={(e) => handleConfirmDelete(e, q.id)}
                          aria-label="Confirm delete quotation"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          className="quotation-confirm-btn quotation-confirm-btn--no"
                          onClick={handleCancelDelete}
                          aria-label="Cancel delete quotation"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="quotation-action-btn"
                          onClick={(e) => handleDuplicate(e, q.id)}
                          title="Duplicate quotation"
                          aria-label={`Duplicate quotation ${q.title}`}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="quotation-action-btn quotation-action-btn--delete"
                          onClick={(e) => handleDeleteClick(e, q.id)}
                          title="Delete quotation"
                          aria-label={`Delete quotation ${q.title}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
