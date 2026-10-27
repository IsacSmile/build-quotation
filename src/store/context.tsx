import React, { createContext, useContext, useEffect, useReducer, useRef } from 'react';
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

  // Autosave to localStorage 500ms after changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (state.isSaved) return;

    const timer = setTimeout(() => {
      const qRes = saveQuotationsToStorage(state.quotations, state.activeQuotationId);
      const sRes = saveSettingsToStorage(state.settings);

      if (qRes.isQuotaError || sRes.isQuotaError) {
        dispatch({ type: 'SET_STORAGE_ERROR', payload: true });
      } else {
        if (state.storageError) {
          dispatch({ type: 'SET_STORAGE_ERROR', payload: false });
        }
        dispatch({ type: 'SET_SAVED_STATUS', payload: true });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state.quotations, state.activeQuotationId, state.settings, state.isSaved, state.storageError]);

  // Persist activeQuotationId immediately on switch so reloads preserve active quotation selection
  useEffect(() => {
    if (isInitialMount.current) return;
    safeSetItem(STORAGE_KEYS.ACTIVE_ID, state.activeQuotationId);
  }, [state.activeQuotationId]);

  const activeQuotation = state.quotations.find((q) => q.id === state.activeQuotationId);

  return (
    <QuotationContext.Provider
      value={{
        state,
        dispatch,
        quotations: state.quotations,
        activeQuotationId: state.activeQuotationId,
        activeQuotation,
        settings: state.settings,
        isSaved: state.isSaved,
        storageError: state.storageError,
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
