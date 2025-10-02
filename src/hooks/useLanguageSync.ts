import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { usePreferencesStore } from '../features/preferences/store';

export const useLanguageSync = () => {
  const { i18n } = useTranslation();
  const language = usePreferencesStore((state) => state.language);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);

  useEffect(() => {
    if (language && i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [i18n, language]);

  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (lng !== language) {
        setLanguage(lng);
      }
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n, language, setLanguage]);
};
