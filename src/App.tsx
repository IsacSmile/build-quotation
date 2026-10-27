import React, { useRef, useState } from 'react';
import { useQuotation } from './store/context';
import { Toolbar } from './components/Toolbar';
import { QuotationList } from './components/QuotationList';
import { SettingsPanel } from './components/SettingsPanel';
import { Paper } from './components/Paper';

export const AppContent: React.FC = () => {
  const { dispatch, isStorageConflict } = useQuotation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuotationListOpen, setIsQuotationListOpen] = useState(false);

  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const quotationListTriggerRef = useRef<HTMLButtonElement>(null);

  const handleNewQuotation = () => {
    dispatch({ type: 'CREATE_QUOTATION' });
  };

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#e9ebee' }}>
      {/* Sticky Top Toolbar */}
      <Toolbar
        onNewQuotation={handleNewQuotation}
        onOpenQuotationList={() => setIsQuotationListOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        quotationListTriggerRef={quotationListTriggerRef}
        settingsTriggerRef={settingsTriggerRef}
      />

      {/* Multi-tab data conflict banner */}
      {isStorageConflict && (
        <div
          className="storage-conflict-banner"
          role="alert"
          style={{
            backgroundColor: '#fffbeb',
            borderBottom: '1px solid #fde68a',
            color: '#92400e',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: '13px',
            fontWeight: 500,
            position: 'sticky',
            top: '52px',
            zIndex: 900,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          }}
        >
          <span>Your data was changed in another tab. Reload to continue.</span>
          <button
            type="button"
            className="storage-conflict-reload-btn"
            onClick={() => window.location.reload()}
            style={{
              padding: '4px 12px',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Reload
          </button>
        </div>
      )}

      {/* Main WYSIWYG A4 Paper Canvas */}
      <main style={{ flex: 1, backgroundColor: '#e9ebee' }}>
        <Paper onOpenSettings={() => setIsSettingsOpen(true)} />
      </main>

      {/* Quotation List Slide-over Panel */}
      <QuotationList
        isOpen={isQuotationListOpen}
        onClose={() => setIsQuotationListOpen(false)}
        triggerRef={quotationListTriggerRef}
        onNewQuotation={handleNewQuotation}
      />

      {/* Settings Slide-over Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        triggerRef={settingsTriggerRef}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
