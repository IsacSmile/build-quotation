import React, { useRef, useState } from 'react';
import { useQuotation } from './store/context';
import { Toolbar } from './components/Toolbar';
import { QuotationList } from './components/QuotationList';
import { SettingsPanel } from './components/SettingsPanel';
import { Paper } from './components/Paper';

export const AppContent: React.FC = () => {
  const { dispatch } = useQuotation();
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
