import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QuotationProvider } from './store/context';
import './styles/fonts.css';
import './styles/index.css';
import { injectTypographyCssVariables } from './config/typography';

// Set CSS variables on :root before first render
injectTypographyCssVariables();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QuotationProvider>
      <App />
    </QuotationProvider>
  </React.StrictMode>
);
