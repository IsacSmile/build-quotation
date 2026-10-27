import { Component, ErrorInfo, ReactNode } from 'react';
import { STORAGE_KEYS } from '../store/storage';
import { getLocalDateString } from '../utils/backup';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleDownloadBackup = () => {
    const localDateStr = getLocalDateString();
    try {
      const quotationsRaw = localStorage.getItem(STORAGE_KEYS.QUOTATIONS) || '[]';
      const settingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}';
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID) || '';

      const dump = {
        app: 'quotation-builder',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        activeQuotationId: activeId,
        settings: JSON.parse(settingsRaw),
        quotations: JSON.parse(quotationsRaw),
      };

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency-quotation-backup-${localDateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to parse storage, downloading raw dump:', e);
      const rawDump: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) rawDump[k] = localStorage.getItem(k);
      }
      const blob = new Blob([JSON.stringify(rawDump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency-raw-storage-dump-${localDateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="error-boundary-screen"
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            className="error-boundary-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              padding: '32px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                margin: '0 auto 16px',
              }}
            >
              ⚠️
            </div>
            <h1
              className="error-boundary-title"
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '12px',
              }}
            >
              Something went wrong. Your data is safe.
            </h1>
            <p
              className="error-boundary-message"
              style={{
                fontSize: '14px',
                color: '#4b5563',
                lineHeight: 1.5,
                marginBottom: '24px',
              }}
            >
              An unexpected display error occurred. Your saved quotations and settings remain safely stored in your browser. You can download a backup copy or reload the application.
            </p>
            <div
              className="error-boundary-actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                type="button"
                className="error-boundary-btn error-boundary-btn--primary"
                onClick={this.handleDownloadBackup}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Download backup
              </button>
              <button
                type="button"
                className="error-boundary-btn error-boundary-btn--secondary"
                onClick={this.handleReload}
                style={{
                  padding: '10px 18px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  fontWeight: 500,
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
