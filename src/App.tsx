import React, { useRef, useState } from 'react';
import { useQuotation } from './store/context';
import { SettingsPanel } from './components/SettingsPanel';
import { Paper } from './components/Paper';

export const AppContent: React.FC = () => {
  const { isSaved, storageError } = useQuotation();
  // TEMP: Temporary state and ref for Settings trigger, replaced by Toolbar in Phase 6
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Bar with Saved Status and Temp Settings */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-light)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
            Quotation Builder
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Phase 5: Payment Footer
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: storageError ? '#fee2e2' : isSaved ? '#dcfce7' : '#fef9c3',
              color: storageError ? '#b91c1c' : isSaved ? '#15803d' : '#854d0e',
              fontWeight: 500,
            }}
          >
            {storageError ? 'Storage is full. Remove the QR or a custom logo' : isSaved ? 'Saved ✓' : 'Saving...'}
          </div>

          {/* TEMP: Temporary Settings button, replaced by Toolbar in Phase 6 */}
          <button
            ref={settingsTriggerRef}
            type="button"
            className="temp-settings-btn"
            onClick={() => setIsSettingsOpen(true)}
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main WYSIWYG A4 Paper Canvas */}
      <main style={{ flex: 1 }}>
        <Paper onOpenSettings={() => setIsSettingsOpen(true)} />
      </main>

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
