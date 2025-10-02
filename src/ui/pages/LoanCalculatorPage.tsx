import { Container, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { LoanCalculator } from '../../features/loan/components/LoanCalculator';
import { LoanInfo } from '../../features/loan/components/LoanInfo';
import { glassHeroPaperSx } from '../styles/hero';

export const LoanCalculatorPage = () => {
  const { t } = useTranslation();

  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={{
        px: 0,
        maxWidth: '100%',
      }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Paper elevation={0} sx={glassHeroPaperSx}>
          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontWeight: 700, color: (theme) => (theme.palette.mode === 'light' ? '#4C1F0C' : theme.palette.text.primary) }}
            >
              {t('loan.pageTitle')}
            </Typography>
            <Typography
              variant="body1"
              maxWidth={540}
              sx={{ color: (theme) => (theme.palette.mode === 'light' ? 'rgba(76, 31, 12, 0.78)' : theme.palette.text.secondary) }}
            >
              {t('loan.pageSubtitle')}
            </Typography>
          </Stack>
        </Paper>

        <LoanCalculator />
        <LoanInfo />
      </Stack>
    </Container>
  );
};

export default LoanCalculatorPage;
