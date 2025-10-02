import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import SavingsIcon from '@mui/icons-material/Savings';
import LockIcon from '@mui/icons-material/Lock';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BrandSymbol } from '../components/BrandLogo';

export const HomePage = () => {
  const { t } = useTranslation();
  const calculatorLinks = [
    { key: 'loan', to: '/calculators/loan', icon: <AccountBalanceIcon fontSize="large" /> },
    { key: 'futureValue', to: '/calculators/time-value/future-value', icon: <TrendingUpIcon fontSize="large" /> },
    { key: 'netPresentValue', to: '/calculators/time-value/net-present-value', icon: <TimelineIcon fontSize="large" /> },
    { key: 'savings', to: '/calculators/deposits/savings', icon: <SavingsIcon fontSize="large" /> },
    { key: 'fixed', to: '/calculators/deposits/fixed', icon: <LockIcon fontSize="large" /> },
    { key: 'tiered', to: '/calculators/deposits/tiered', icon: <LeaderboardIcon fontSize="large" /> },
  ] as const;

  const heroHighlights = [
    { key: 'privacy', icon: <ShieldOutlinedIcon fontSize="small" /> },
    { key: 'localization', icon: <LanguageOutlinedIcon fontSize="small" /> },
  ] as const;

  const calculatorSectionId = 'calculator-section';

  const handleScrollToCalculators = useCallback(() => {
    const calculators = document.getElementById(calculatorSectionId);
    if (calculators) {
      calculators.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <Stack spacing={{ xs: 4, sm: 6 }}>
      <Paper
        elevation={0}
        sx={(theme) => ({
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 3, md: 6 },
          py: { xs: 5, md: 8 },
          borderRadius: 5,
          backgroundImage:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, rgba(237,166,119,0.15) 0%, rgba(255,247,241,0.92) 40%, rgba(255,255,255,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(107,61,42,0.55) 0%, rgba(40,30,24,0.88) 60%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -120,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background:
              theme.palette.mode === 'light'
                ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,192,160,0.05) 60%, rgba(255,255,255,0) 100%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,138,101,0.08) 55%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -160,
            left: -140,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background:
              theme.palette.mode === 'light'
                ? 'radial-gradient(circle, rgba(236,165,118,0.25) 0%, rgba(236,165,118,0.08) 45%, rgba(255,255,255,0) 100%)'
                : 'radial-gradient(circle, rgba(236,165,118,0.2) 0%, rgba(236,165,118,0.07) 45%, rgba(0,0,0,0) 100%)',
            zIndex: 0,
          },
        })}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 5, md: 7 },
            alignItems: 'center',
          }}
        >
          <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', md: 0 }, maxWidth: '100%' }}>
            <Stack spacing={3} textAlign={{ xs: 'center', md: 'left' }}>
              <Chip
                label={t('home.hero.kicker')}
                color="secondary"
                variant="outlined"
                sx={{
                  alignSelf: { xs: 'center', md: 'flex-start' },
                  fontWeight: 600,
                  backdropFilter: 'blur(6px)',
                }}
              />
              <Typography variant="h2" component="h1" sx={{ maxWidth: { xs: '100%', md: 620 }, mx: { xs: 'auto', md: 0 } }}>
                {t('home.hero.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 660, mx: { xs: 'auto', md: 0 } }}>
                {t('home.hero.subtitle')}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }}>
                <Button onClick={handleScrollToCalculators} variant="contained" size="large">
                  {t('home.hero.primaryCta', 'Explore our calculators')}
                </Button>
                <Button component={RouterLink} to="/about" variant="outlined" size="large">
                  {t('home.hero.secondaryCta')}
                </Button>
              </Stack>

              <Stack spacing={3} sx={{ mt: 1 }}>
                {heroHighlights.map(({ key, icon }) => (
                  <Stack
                    key={key}
                    direction="row"
                    spacing={2}
                    alignItems="flex-start"
                    justifyContent={{ xs: 'center', md: 'flex-start' }}
                  >
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        width: 40,
                        height: 40,
                        mt: 0,
                      }}
                    >
                      {icon}
                    </Avatar>
                    <Box sx={{ maxWidth: { xs: 440, md: 520 } }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t(`home.hero.highlights.${key}.title`)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t(`home.hero.highlights.${key}.description`)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Box>
          <Box
            sx={{
              flex: '0 1 auto',
              minWidth: { xs: '100%', md: 280 },
              maxWidth: { xs: '100%', md: '40%' },
            }}
          >
            <Box sx={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: -40, md: -60 },
                  right: { xs: -30, md: -50 },
                  width: { xs: 160, md: 220 },
                  height: { xs: 160, md: 220 },
                  borderRadius: '50%',
                  background: (theme) =>
                    theme.palette.mode === 'light'
                      ? 'linear-gradient(140deg, rgba(255,255,255,0.7) 0%, rgba(236,165,118,0.35) 75%)'
                      : 'linear-gradient(140deg, rgba(255,255,255,0.08) 0%, rgba(236,165,118,0.25) 70%)',
                  filter: 'blur(0px)',
                  opacity: 0.9,
                  zIndex: 0,
                }}
              />
              <BrandSymbol
                size={220}
                label={t('home.hero.logoAlt', 'Basic Financial Calculator logo mark')}
                sx={{
                  position: 'relative',
                  maxWidth: { xs: 220, md: 280 },
                  zIndex: 1,
                }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Stack spacing={3} id={calculatorSectionId}>
        <Stack spacing={1} textAlign={{ xs: 'center', md: 'left' }}>
          <Typography variant="h4" component="h2">
            {t('home.calculatorNav.title', 'Jump into a calculator')}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            maxWidth={720}
            sx={{ mx: { xs: 'auto', md: 'initial' } }}
          >
            {t('home.calculatorNav.subtitle', 'Choose a calculation to get started quickly with localized guidance.')}
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
            gap: { xs: 2, sm: 3, md: 4 },
            width: '100%',
          }}
        >
          {calculatorLinks.map(({ key, to, icon }) => (
            <Card 
              key={key} 
              variant="outlined" 
              sx={{ 
                height: '100%', 
                minWidth: 0, 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardActionArea
                component={RouterLink}
                to={to}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Avatar
                    variant="rounded"
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      mb: 2,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {t(`home.calculatorNav.items.${key}.title`)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(`home.calculatorNav.items.${key}.description`)}
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'primary.main',
                    fontWeight: 600,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t(`home.calculatorNav.items.${key}.action`)}
                  </Typography>
                  <ArrowForwardIcon fontSize="small" />
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Stack>
    </Stack>
  );
};

export default HomePage;
