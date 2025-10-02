import { IconButton, Tooltip } from '@mui/material';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { useTranslation } from 'react-i18next';

import { usePreferencesStore } from '../../features/preferences/store';

export const ThemeToggle = () => {
  const mode = usePreferencesStore((state) => state.mode);
  const toggleMode = usePreferencesStore((state) => state.toggleMode);
  const { t } = useTranslation();

  const isLight = mode === 'light';

  return (
    <Tooltip title={isLight ? t('theme.dark') : t('theme.light')}>
      <IconButton
        color="inherit"
        onClick={toggleMode}
        aria-label={t('common.theme') ?? 'Theme'}
      >
        {isLight ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
