import { memo, useCallback } from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import FormatSizeRoundedIcon from '@mui/icons-material/FormatSizeRounded';
import type { StackProps } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { usePreferencesStore, type TextScale } from '../../features/preferences/store';

const SCALE_ORDER: TextScale[] = ['small', 'medium', 'large'];

const SCALE_LABEL_KEYS: Record<TextScale, string> = {
  small: 'fontSize.small',
  medium: 'fontSize.medium',
  large: 'fontSize.large',
};

const SCALE_PREVIEWS: Record<TextScale, number> = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

type FontSizeControlProps = Pick<StackProps, 'sx'>;

export const FontSizeControl = memo(({ sx }: FontSizeControlProps) => {
  const textScale = usePreferencesStore((state) => state.textScale);
  const setTextScale = usePreferencesStore((state) => state.setTextScale);
  const { t } = useTranslation();

  const handleChange = useCallback(
    (_: unknown, next: TextScale | null) => {
      if (next) {
        setTextScale(next);
      }
    },
    [setTextScale],
  );

  return (
  <Stack direction="row" spacing={1} alignItems="center" sx={sx}>
      <Tooltip title={t('fontSize.label')}>
        <FormatSizeRoundedIcon fontSize="small" />
      </Tooltip>
      <ToggleButtonGroup
        value={textScale}
        exclusive
        size="small"
        onChange={handleChange}
        aria-label={t('fontSize.ariaLabel') ?? 'Adjust font size'}
        sx={{
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? 'rgba(255,255,255,0.24)'
              : 'rgba(255,255,255,0.12)',
          borderRadius: 999,
          '& .MuiToggleButton-root': {
            px: 1,
            color: 'inherit',
            border: 'none',
            transition: (theme) => theme.transitions.create(['background-color', 'transform']),
            '&:first-of-type': { borderRadius: '999px 0 0 999px' },
            '&:last-of-type': { borderRadius: '0 999px 999px 0' },
            '&.Mui-selected': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(255, 255, 255, 0.2)',
              color: (theme) => (theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light),
              fontWeight: 600,
            },
            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'rgba(255, 255, 255, 0.18)',
            },
          },
        }}
      >
        {SCALE_ORDER.map((scale) => (
          <ToggleButton key={scale} value={scale} aria-label={t(SCALE_LABEL_KEYS[scale])}>
            <Tooltip title={t(SCALE_LABEL_KEYS[scale])}>
              <Typography
                component="span"
                sx={{
                  fontWeight: 600,
                  transform: `scale(${SCALE_PREVIEWS[scale]})`,
                  transformOrigin: 'center',
                  display: 'inline-block',
                  lineHeight: 1,
                }}
              >
                A
              </Typography>
            </Tooltip>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
});

FontSizeControl.displayName = 'FontSizeControl';

export default FontSizeControl;
