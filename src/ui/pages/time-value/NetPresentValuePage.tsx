import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { NetPresentValueCalculator } from '../../../features/time-value/components/NetPresentValueCalculator';
import { MathFormula } from '../../components/MathFormula';

const NetPresentValueInfo = () => {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('timeValue.npv.info.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('timeValue.npv.info.subtitle')}
          </Typography>
        </Stack>

        <MathFormula formula={t('timeValue.npv.info.formula')} />

        <List disablePadding>
          {['initial', 'cashFlow', 'rate', 'period'].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2' }}
                primary={t(`timeValue.npv.info.items.${item}.title`)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondary={t(`timeValue.npv.info.items.${item}.description`)}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};

export const NetPresentValuePage = () => (
  <Stack spacing={{ xs: 3, sm: 4 }}>
    <NetPresentValueCalculator />
    <NetPresentValueInfo />
  </Stack>
);

export default NetPresentValuePage;
