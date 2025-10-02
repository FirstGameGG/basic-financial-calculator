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
