import { useState } from 'react';
import type { MouseEvent } from 'react';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useTranslation } from 'react-i18next';

import { usePreferencesStore } from '../../features/preferences/store';

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ไทย' },
];

export const LanguageMenu = () => {
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const current = i18n.language;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleSelect = (code: string) => {
    void i18n.changeLanguage(code);
    setLanguage(code);
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          color="inherit"
          onClick={handleOpen}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          aria-controls="language-menu"
        >
          <TranslateRoundedIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="language-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        {LANGUAGES.map(({ code, label }) => (
          <MenuItem
            key={code}
            selected={current === code}
            onClick={() => handleSelect(code)}
          >
            {current === code && (
              <ListItemIcon>
                <CheckRoundedIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText primary={label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageMenu;
