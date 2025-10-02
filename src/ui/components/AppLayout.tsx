import { useState } from 'react';
import type { ReactNode } from 'react';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LanguageMenu } from './LanguageMenu';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';
import { FontSizeControl } from './FontSizeControl';
import { BrandWordmark } from './BrandLogo';

const NAVIGATION = [
  { path: '/', translationKey: 'nav.home' },
  { path: '/calculators/loan', translationKey: 'nav.loanCalculator' },
  { path: '/calculators/time-value', translationKey: 'nav.timeValue' },
  { path: '/calculators/deposits', translationKey: 'nav.deposits' },
  { path: '/about', translationKey: 'nav.about' },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={(theme) => ({
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderBottom: 'none',
          backgroundImage:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(236,165,118,0.9) 0%, rgba(222,138,92,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(55,33,25,0.9) 0%, rgba(104,57,40,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          boxShadow:
            theme.palette.mode === 'light'
              ? '0 16px 32px rgba(236, 165, 118, 0.35)'
              : '0 16px 32px rgba(0, 0, 0, 0.5)',
          borderRadius: { xs: 0, md: 999 },
          mx: { xs: 0, md: 'auto' },
          mt: { xs: 0, md: 2 },
          width: { xs: '100%', md: 'fit-content' },
          maxWidth: { md: 'calc(100% - 48px)' },
        })}
      >
  <Toolbar sx={{ py: 2, px: { xs: 2, md: 3 } }}>
          <Box
            component={RouterLink}
            to="/"
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexGrow: { xs: 1, md: 0 },
              flexShrink: 0,
              px: { xs: 2, md: 3 },
              py: 1,
              borderRadius: 999,
              backgroundColor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(255, 255, 255, 0.12)',
              border:
                theme.palette.mode === 'light'
                  ? '1px solid rgba(255, 255, 255, 0.55)'
                  : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow:
                theme.palette.mode === 'light'
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 16px 30px rgba(105, 57, 29, 0.22)'
                  : '0 6px 18px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(14px)',
            })}
          >
            <BrandWordmark
              height={32}
              label={t('app.title')}
              sx={{
                display: 'block',
                height: { xs: 32, md: 40 },
                minWidth: { xs: 96, md: 120 },
              }}
            />
            <Typography
              component="span"
              sx={{
                position: 'absolute',
                width: 1,
                height: 1,
                padding: 0,
                margin: -1,
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: 0,
              }}
            >
              {t('app.title')}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' }, ml: 2 }}>
            {NAVIGATION.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <Button
                  key={item.path}
                  component={RouterLink}
                  to={item.path}
                  color={isActive ? 'secondary' : 'inherit'}
                  variant={isActive ? 'contained' : 'text'}
                  sx={(theme) =>
                    isActive
                      ? {
                          boxShadow:
                            theme.palette.mode === 'light'
                              ? 'inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 12px 26px rgba(105, 57, 29, 0.24)'
                              : '0 12px 28px rgba(0, 0, 0, 0.5)',
                          backgroundColor:
                            theme.palette.mode === 'light'
                              ? 'rgba(255, 255, 255, 0.22)'
                              : 'rgba(255, 255, 255, 0.12)',
                          border:
                            theme.palette.mode === 'light'
                              ? '1px solid rgba(255, 255, 255, 0.55)'
                              : '1px solid rgba(255, 255, 255, 0.18)',
                          color: theme.palette.mode === 'light' ? '#5B240C' : theme.palette.text.primary,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'light'
                                ? 'rgba(255, 255, 255, 0.3)'
                                : 'rgba(255, 255, 255, 0.18)',
                          },
                        }
                      : {
                          color: 'rgba(255,255,255,0.85)',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.12)',
                          },
                        }
                  }
                >
                  {t(item.translationKey)}
                </Button>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ ml: 'auto', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              onClick={openDrawer}
              aria-label="navigation menu"
            >
              <MenuRoundedIcon />
            </IconButton>
            <FontSizeControl sx={{ display: { xs: 'none', sm: 'flex' } }} />
            <LanguageMenu />
            <ThemeToggle />
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={closeDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
        PaperProps={{
          sx: (theme) => ({
            width: 'min(280px, 80vw)',
            pt: 2,
            pb: 3,
            px: 2,
            backgroundImage:
              theme.palette.mode === 'light'
                ? 'linear-gradient(180deg, rgba(255, 248, 242, 0.95) 0%, rgba(245, 228, 214, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(44, 33, 28, 0.94) 0%, rgba(28, 21, 18, 0.96) 100%)',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 24px 56px rgba(236, 165, 118, 0.28)'
                : '0 24px 56px rgba(0, 0, 0, 0.65)',
          }),
        }}
      >
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Box
            component={RouterLink}
            to="/"
            onClick={closeDrawer}
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              textDecoration: 'none',
              px: 2,
              py: 1,
              borderRadius: 999,
              backgroundColor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.28)'
                  : 'rgba(255, 255, 255, 0.12)',
              border:
                theme.palette.mode === 'light'
                  ? '1px solid rgba(255, 255, 255, 0.55)'
                  : '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow:
                theme.palette.mode === 'light'
                  ? 'inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 16px 30px rgba(105, 57, 29, 0.22)'
                  : '0 6px 18px rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(14px)',
            })}
          >
            <BrandWordmark
              height={28}
              label={t('app.title')}
              sx={{ height: 28, minWidth: 92 }}
            />
          </Box>
        </Stack>

        <Divider sx={{ mb: 2, opacity: 0.4 }} />

        <List disablePadding>
          {NAVIGATION.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <ListItemButton
                key={item.path}
                component={RouterLink}
                to={item.path}
                selected={isActive}
                onClick={closeDrawer}
                sx={(theme) => ({
                  mb: 1,
                  borderRadius: 2,
                  alignItems: 'center',
                  '&.Mui-selected': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? 'rgba(236, 165, 118, 0.18)'
                        : 'rgba(236, 165, 118, 0.25)',
                    border: `1px solid ${theme.palette.secondary.light}`,
                  },
                })}
              >
                <ListItemText
                  primaryTypographyProps={{
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  {t(item.translationKey)}
                </ListItemText>
              </ListItemButton>
            );
          })}
        </List>

        <Divider sx={{ my: 2, opacity: 0.35, display: { xs: 'block', sm: 'none' } }} />

        <FontSizeControl
          sx={{
            justifyContent: 'flex-start',
            display: { xs: 'flex', sm: 'none' },
            mt: 1,
          }}
        />
      </Drawer>

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          px: { xs: 2, sm: 3, lg: 4 },
          pt: { xs: 14, md: 16 },
          pb: { xs: 6, md: 10 },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 6, md: 8 },
        }}
      >
        {children}
      </Container>

      <Footer />
    </Box>
  );
};

export default AppLayout;
