import { Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <Stack spacing={3} alignItems="center" textAlign="center" sx={{ py: 8 }}>
      <Typography variant="h2" component="h1">
        404
      </Typography>
      <Typography variant="h5">{t('notFound.title')}</Typography>
      <Button component={RouterLink} to="/" variant="contained">
        {t('notFound.action')}
      </Button>
    </Stack>
  );
};

export default NotFoundPage;
