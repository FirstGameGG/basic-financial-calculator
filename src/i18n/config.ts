import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import th from './locales/th/translation.json';

let initialised = false;

export const initI18n = () => {
  if (initialised) return i18n;

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        th: { translation: th },
      },
      fallbackLng: 'en',
      supportedLngs: ['en', 'th'],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

  initialised = true;
  return i18n;
};

export default i18n;
