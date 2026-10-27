import React from 'react';
import { useQuotation } from './store/context';

export const AppContent: React.FC = () => {
  const { activeQuotation, settings, isSaved } = useQuotation();

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600 }}>Quotation Builder — Core Engine</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Phase 1: Setup + types + store + localStorage</p>
        </div>
        <div style={{
          fontSize: '12px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: isSaved ? '#dcfce7' : '#fef9c3',
          color: isSaved ? '#15803d' : '#854d0e',
          fontWeight: 500,
        }}>
          {isSaved ? 'Saved ✓' : 'Saving...'}
        </div>
      </header>

      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Loaded Settings (Default Agency)
        </h2>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <div><strong>Agency:</strong> {settings.agencyName}</div>
          <div><strong>Address:</strong> {settings.address}</div>
          <div><strong>Bank:</strong> {settings.bank.bankName} ({settings.bank.holder})</div>
          <div><strong>Payment Footer Enabled:</strong> {settings.paymentEnabled ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Active Quotation: {activeQuotation?.title}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          ID: {activeQuotation?.id} | Sections Count: {activeQuotation?.sections.length}
        </p>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {activeQuotation?.sections.map((section, idx) => (
            <li
              key={section.id}
              style={{
                background: 'var(--heading-bar-bg)',
                padding: '8px 12px',
                marginBottom: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{idx + 1}. {section.heading}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                {section.blocks.length} block(s)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
