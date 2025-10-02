import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { FutureValueCalculator } from '../../../features/time-value/components/FutureValueCalculator';
import { MathFormula } from '../../components/MathFormula';

const FutureValueInfo = () => {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('timeValue.futureValue.info.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('timeValue.futureValue.info.subtitle')}
          </Typography>
        </Stack>

        <MathFormula formula={t('timeValue.futureValue.info.formula')} />

        <List disablePadding>
          {['pv', 'rate', 'periods', 'contribution', 'frequency'].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2' }}
                primary={t(`timeValue.futureValue.info.items.${item}.title`)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondary={t(`timeValue.futureValue.info.items.${item}.description`)}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};

export const FutureValuePage = () => (
  <Stack spacing={{ xs: 3, sm: 4 }}>
    <FutureValueCalculator />
    <FutureValueInfo />
  </Stack>
);

export default FutureValuePage;
