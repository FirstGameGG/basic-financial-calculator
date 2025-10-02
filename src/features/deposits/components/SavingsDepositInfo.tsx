import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { MathFormula } from '../../../ui/components/MathFormula';

export const SavingsDepositInfo = () => {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('deposits.savings.info.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('deposits.savings.info.subtitle')}
          </Typography>
        </Stack>

        <MathFormula formula={t('deposits.savings.info.formula')} />

        <List disablePadding>
          {['method', 'payouts', 'threshold', 'compounding'].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2' }}
                primary={t(`deposits.savings.info.items.${item}.title`)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondary={t(`deposits.savings.info.items.${item}.description`)}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};

export default SavingsDepositInfo;
