import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState, Quotation, Settings } from '../types';
import { AppAction, appReducer } from './reducer';
import {
  STORAGE_KEYS,
  loadQuotationsFromStorage,
  loadSettingsFromStorage,
  safeSetItem,
  saveQuotationsToStorage,
  saveSettingsToStorage,
} from './storage';

interface QuotationContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  quotations: Quotation[];
  activeQuotationId: string;
  activeQuotation: Quotation | undefined;
  settings: Settings;
  isSaved: boolean;
  storageError: boolean;
  isStorageConflict: boolean;
  flushSave: () => void;
  getLatestState: () => AppState;
}

const QuotationContext = createContext<QuotationContextType | null>(null);

function getInitialState(): AppState {
  const { quotations, activeId } = loadQuotationsFromStorage();
  const settings = loadSettingsFromStorage();

  return {
    quotations,
    activeQuotationId: activeId,
    settings,
    isSaved: true,
    storageError: false,
  };
}

export const QuotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);
  const isInitialMount = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  const [isStorageConflict, setIsStorageConflict] = React.useState(false);
  const storageConflictRef = useRef(false);
  storageConflictRef.current = isStorageConflict;

  // Listen to storage events from other tabs
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.QUOTATIONS ||
        e.key === STORAGE_KEYS.SETTINGS ||
        e.key === STORAGE_KEYS.ACTIVE_ID
      ) {
        storageConflictRef.current = true;
        setIsStorageConflict(true);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  const flushSave = useCallback(() => {
    // If another tab has modified storage, never overwrite it!
    if (storageConflictRef.current) {
      console.warn('Save aborted: storage was modified in another tab.');
      return;
    }

    const currentState = latestStateRef.current;
    if (currentState.isSaved) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const qRes = saveQuotationsToStorage(currentState.quotations, currentState.activeQuotationId);
    const sRes = saveSettingsToStorage(currentState.settings);

    if (qRes.isQuotaError || sRes.isQuotaError) {
      dispatch({ type: 'SET_STORAGE_ERROR', payload: true });
    } else {
      if (currentState.storageError) {
        dispatch({ type: 'SET_STORAGE_ERROR', payload: false });
      }
      dispatch({ type: 'SET_SAVED_STATUS', payload: true });
    }
  }, []);

  // Global Ctrl/Cmd+S listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        flushSave();
        dispatch({ type: 'SET_SAVED_STATUS', payload: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushSave]);

  // Expose flushSave on window for testing and programmatic invocation if needed
  useEffect(() => {
    (window as any).__flushSave = flushSave;
    return () => {
      delete (window as any).__flushSave;
    };
  }, [flushSave]);

  // Synchronously flush pending saves on pagehide, visibilitychange, and beforeunload
  useEffect(() => {
    const handleFlush = () => {
      if (!storageConflictRef.current) {
        flushSave();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !storageConflictRef.current) {
        flushSave();
      }
    };

    window.addEventListener('pagehide', handleFlush);
    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (!storageConflictRef.current) {
        flushSave();
      }
      window.removeEventListener('pagehide', handleFlush);
      window.removeEventListener('beforeunload', handleFlush);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSave]);

  // Autosave to localStorage 500ms after changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (storageConflictRef.current) return;
    if (state.isSaved) return;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      flushSave();
    }, 500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [state.quotations, state.activeQuotationId, state.settings, state.isSaved, flushSave]);

  // Persist activeQuotationId immediately on switch so reloads preserve active quotation selection
  useEffect(() => {
    if (isInitialMount.current || storageConflictRef.current) return;
    safeSetItem(STORAGE_KEYS.ACTIVE_ID, state.activeQuotationId);
  }, [state.activeQuotationId]);

  const activeQuotation = state.quotations.find((q) => q.id === state.activeQuotationId);

  const getLatestState = useCallback(() => {
    return latestStateRef.current;
  }, []);

  return (
    <QuotationContext.Provider
      value={{
        state,
        quotations: state.quotations,
        dispatch,
        activeQuotationId: state.activeQuotationId,
        activeQuotation,
        settings: state.settings,
        isSaved: state.isSaved,
        storageError: state.storageError,
        isStorageConflict,
        flushSave,
        getLatestState,
      }}
    >
      {children}
    </QuotationContext.Provider>
  );
};

export function useQuotation() {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotation must be used within a QuotationProvider');
  }
  return context;
}
