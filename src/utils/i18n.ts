export type LocalizedText = {
  en: string;
  th: string | null;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const resolveLocalizedText = (language: string, labels: LocalizedText) => {
  const normalizedLanguage = normalize(language);
  const preferThai = normalizedLanguage.startsWith('th');

  if (preferThai) {
    if (labels.th && labels.th.trim()) {
      return labels.th;
    }
  } else if (labels.en.trim()) {
    return labels.en;
  }

  return labels.en.trim() || labels.th?.trim() || '';
};
