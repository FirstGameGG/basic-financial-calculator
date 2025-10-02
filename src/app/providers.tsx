import { useMemo } from 'react';
import type { PropsWithChildren } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import { MathJaxContext } from 'better-react-mathjax';

import { buildTheme } from './theme';
import { initI18n } from '../i18n/config';
import { usePreferencesStore, TEXT_SCALE_FACTORS } from '../features/preferences/store';
import { useLanguageSync } from '../hooks/useLanguageSync';

const i18n = initI18n();

// MathJax configuration
const mathJaxConfig = {
  loader: { load: ['[tex]/html'] },
  tex: {
    packages: { '[+]': ['html'] },
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
  },
};

export const AppProviders = ({ children }: PropsWithChildren) => {
  const mode = usePreferencesStore((state) => state.mode);
  const textScale = usePreferencesStore((state) => state.textScale);

  const theme = useMemo(() => buildTheme(mode, TEXT_SCALE_FACTORS[textScale]), [mode, textScale]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <MathJaxContext config={mathJaxConfig}>
          <CssBaseline />
          <LanguageSync />
          {children}
        </MathJaxContext>
      </ThemeProvider>
    </I18nextProvider>
  );
};

const LanguageSync = () => {
  useLanguageSync();
  return null;
};
