import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QuotationProvider } from './store/context';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QuotationProvider>
      <App />
    </QuotationProvider>
  </React.StrictMode>
);
