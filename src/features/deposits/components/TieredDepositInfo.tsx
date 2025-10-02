import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { MathFormula } from '../../../ui/components/MathFormula';

export const TieredDepositInfo = () => {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('deposits.tiered.info.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('deposits.tiered.info.subtitle')}
          </Typography>
        </Stack>

        <MathFormula formula={t('deposits.tiered.info.formula')} />

        <List disablePadding>
          {['tiers', 'calculation', 'example', 'time'].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2' }}
                primary={t(`deposits.tiered.info.items.${item}.title`)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondary={t(`deposits.tiered.info.items.${item}.description`)}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};

export default TieredDepositInfo;
