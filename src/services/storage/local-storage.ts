const isBrowser = typeof window !== 'undefined';

export const storageKeys = {
  preferences: 'bfc:preferences',
  loanDraft: 'bfc:loan-draft',
} as const;

type StorageKey = (typeof storageKeys)[keyof typeof storageKeys];

type JsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null;

export const storage = {
  get<T = unknown>(key: StorageKey, fallback: T): T {
    if (!isBrowser) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn('Failed to parse storage item', key, error);
      return fallback;
    }
  },
  set(key: StorageKey, value: JsonValue) {
    if (!isBrowser) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: StorageKey) {
    if (!isBrowser) return;
    window.localStorage.removeItem(key);
  },
};
