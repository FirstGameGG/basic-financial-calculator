import type { PaletteMode } from '@mui/material';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storageKeys } from '../../services/storage/local-storage';

export type TextScale = 'small' | 'medium' | 'large';

type PreferencesState = {
  mode: PaletteMode;
  language: string;
  textScale: TextScale;
};

type PreferencesActions = {
  setMode: (mode: PaletteMode) => void;
  toggleMode: () => void;
  setLanguage: (language: string) => void;
  setTextScale: (textScale: TextScale) => void;
};

export const TEXT_SCALE_FACTORS: Record<TextScale, number> = {
  small: 1.1,
  medium: 1,
  large: 0.9,
};

const DEFAULT_STATE: PreferencesState = {
  mode: 'light',
  language: 'en',
  textScale: 'medium',
};

export const usePreferencesStore = create<PreferencesState & PreferencesActions>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      setMode: (mode) => set({ mode }),
      toggleMode: () => set({ mode: get().mode === 'light' ? 'dark' : 'light' }),
      setLanguage: (language) => set({ language }),
      setTextScale: (textScale) => set({ textScale }),
    }),
    {
      name: storageKeys.preferences,
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          const fallback = JSON.stringify(DEFAULT_STATE);
          if (typeof window === 'undefined') return fallback;
          return window.localStorage.getItem(key) ?? fallback;
        },
        setItem: (key, value) => {
          if (typeof window === 'undefined') return;
          window.localStorage.setItem(key, value);
        },
        removeItem: (key) => {
          if (typeof window === 'undefined') return;
          window.localStorage.removeItem(key);
        },
      })),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<PreferencesState>) }),
      partialize: (state) => ({ mode: state.mode, language: state.language, textScale: state.textScale }),
    },
  ),
);

export const selectMode = (state: PreferencesState) => state.mode;
export const selectLanguage = (state: PreferencesState) => state.language;
export const selectTextScale = (state: PreferencesState) => state.textScale;
export const selectTextScaleFactor = (state: PreferencesState) => TEXT_SCALE_FACTORS[state.textScale];
