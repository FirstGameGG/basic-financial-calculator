import { forwardRef, useEffect, useState, type ChangeEventHandler, type FocusEvent } from 'react';

import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useTranslation } from 'react-i18next';

import {
  formatNumberValue,
  formatNumericString,
  sanitizeNumericInput,
} from '../../utils/numberInput';

type FormattedNumberFieldProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange'> & {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
};

export const FormattedNumberField = forwardRef<HTMLInputElement, FormattedNumberFieldProps>(
  function FormattedNumberField({ value, onValueChange, onBlur, onFocus, inputProps, ...rest }, ref) {
    const { i18n } = useTranslation();
    const locale = i18n.language;
    const [isFocused, setIsFocused] = useState(false);
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
      if (isFocused) return;
      setDisplayValue(formatNumberValue(value, locale));
    }, [value, isFocused, locale]);

    const handleFocus = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(true);
      setDisplayValue(value == null || Number.isNaN(value) ? '' : value.toString());
      if (onFocus) onFocus(event);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setIsFocused(false);
      setDisplayValue(formatNumberValue(value, locale));
      if (onBlur) onBlur(event);
    };

    const handleChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
      const raw = event.target.value;
      const sanitized = sanitizeNumericInput(raw, locale);

      if (!sanitized) {
        setDisplayValue('');
        onValueChange(undefined);
        return;
      }

      setDisplayValue(formatNumericString(sanitized, locale));
      const numeric = Number(sanitized);
      if (!Number.isNaN(numeric)) {
        onValueChange(numeric);
      }
    };

    return (
      <TextField
        {...rest}
        inputRef={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        inputProps={{ ...inputProps, inputMode: 'decimal' }}
      />
    );
  },
);
