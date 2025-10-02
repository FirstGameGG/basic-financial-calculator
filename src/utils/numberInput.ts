type LocaleFormat = {
  decimalSeparator: string;
  thousandsSeparator: string;
};

const LOCALE_FORMATS: Record<string, LocaleFormat> = {
  th: { decimalSeparator: '.', thousandsSeparator: ',' },
  en: { decimalSeparator: '.', thousandsSeparator: ',' },
};

const DEFAULT_FORMAT: LocaleFormat = { decimalSeparator: '.', thousandsSeparator: ',' };

export const getLocaleFormat = (locale?: string): LocaleFormat => {
  if (!locale) return DEFAULT_FORMAT;
  return LOCALE_FORMATS[locale] || DEFAULT_FORMAT;
};

export const sanitizeNumericInput = (value: string, locale?: string) => {
  const format = getLocaleFormat(locale);
  let sanitized = '';
  let hasDecimalPoint = false;

  for (const char of value) {
    if (char >= '0' && char <= '9') {
      sanitized += char;
      continue;
    }

    // Accept both . and , as decimal separators for convenience
    if ((char === format.decimalSeparator || char === '.' || char === ',') && !hasDecimalPoint) {
      hasDecimalPoint = true;
      sanitized += '.'; // Always use . internally
    }
  }

  if (sanitized.startsWith('.')) {
    sanitized = `0${sanitized}`;
  }

  return sanitized;
};

export const formatNumericString = (value: string, locale?: string) => {
  if (!value) return '';

  const format = getLocaleFormat(locale);
  const [integerPartRaw, decimalPart] = value.split('.');
  const integerPart = integerPartRaw || '0';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, format.thousandsSeparator);

  if (decimalPart != null) {
    return decimalPart !== '' 
      ? `${formattedInteger}${format.decimalSeparator}${decimalPart}` 
      : `${formattedInteger}${format.decimalSeparator}`;
  }

  return formattedInteger;
};

export const formatNumberValue = (value: number | null | undefined, locale?: string) => {
  if (value == null || Number.isNaN(value)) return '';
  return formatNumericString(value.toString(), locale);
};
