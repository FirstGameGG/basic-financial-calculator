import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './styles/global.css';

import App from './app/App';
import { AppProviders } from './app/providers';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);

const deferServiceWorkerRegistration = () => {
  const activate = async () => {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: false });
  };

  const requestIdle = window.requestIdleCallback?.bind(window);

  if (requestIdle) {
    requestIdle(activate);
  } else {
    setTimeout(activate, 800);
  }
};

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  if (document.readyState === 'complete') {
    deferServiceWorkerRegistration();
  } else {
    window.addEventListener('load', deferServiceWorkerRegistration, { once: true });
  }
}
