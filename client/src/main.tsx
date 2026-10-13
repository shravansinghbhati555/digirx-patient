import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ToastProvider } from './components/ui/Overlay';
import { PortalProvider } from './state/portal';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortalProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </PortalProvider>
  </StrictMode>,
);
