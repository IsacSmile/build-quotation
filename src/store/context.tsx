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

  const flushSave = useCallback(() => {
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
      flushSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };

    window.addEventListener('pagehide', handleFlush);
    window.addEventListener('beforeunload', handleFlush);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flushSave();
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
    if (isInitialMount.current) return;
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
