import { List, ListItem, ListItemText, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { MathFormula } from '../../../ui/components/MathFormula';

export const LoanInfo = () => {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h5">{t('loan.info.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('loan.info.subtitle')}
          </Typography>
        </Stack>

        <MathFormula formula={t('loan.info.formula')} />

        <List disablePadding>
          {['principal', 'rate', 'periods', 'payment'].map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 1 }}>
              <ListItemText
                primaryTypographyProps={{ variant: 'body2' }}
                primary={t(`loan.info.items.${item}.title`)}
                secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                secondary={t(`loan.info.items.${item}.description`)}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
};

export default LoanInfo;
