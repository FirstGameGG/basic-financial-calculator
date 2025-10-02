import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { AnimatedPage } from '../../components/AnimatedPage';
import { glassHeroPaperSx, glassHeroTabsSx } from '../../styles/hero';

const TAB_ROUTES = [
  { value: '/calculators/time-value/future-value', labelKey: 'timeValue.tabs.futureValue' },
  { value: '/calculators/time-value/net-present-value', labelKey: 'timeValue.tabs.netPresentValue' },
];

export const TimeValuePage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const currentTab = TAB_ROUTES.find((tab) => location.pathname.startsWith(tab.value))?.value ?? TAB_ROUTES[0].value;

  return (
    <Stack spacing={{ xs: 3, sm: 4 }}>
      <Paper elevation={0} sx={glassHeroPaperSx}>
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700, color: (theme) => (theme.palette.mode === 'light' ? '#4C1F0C' : theme.palette.text.primary) }}
          >
            {t('timeValue.pageTitle')}
          </Typography>
          <Typography
            variant="body1"
            maxWidth={640}
            sx={{ color: (theme) => (theme.palette.mode === 'light' ? 'rgba(76, 31, 12, 0.78)' : theme.palette.text.secondary) }}
          >
            {t('timeValue.pageSubtitle')}
          </Typography>
        </Stack>

        <Tabs
          value={currentTab}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={glassHeroTabsSx}
        >
          {TAB_ROUTES.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={t(tab.labelKey)}
              component={RouterLink}
              to={tab.value}
            />
          ))}
        </Tabs>
      </Paper>

      <AnimatePresence mode="wait">
        <AnimatedPage key={location.pathname}>
          <Outlet />
        </AnimatedPage>
      </AnimatePresence>
    </Stack>
  );
};

export default TimeValuePage;
