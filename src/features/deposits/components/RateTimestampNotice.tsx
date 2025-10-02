import { Alert, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface RateTimestampNoticeProps {
  periodDate?: string | null;
  dataTimestamp?: string | null;
  icon?: ReactNode;
}

const normalizeTimestamp = (timestamp: string) => {
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(timestamp);
  return hasTimezone ? timestamp : `${timestamp}Z`;
};

export const RateTimestampNotice = ({ periodDate, dataTimestamp, icon }: RateTimestampNoticeProps) => {
  const { t, i18n } = useTranslation();

  if (!periodDate && !dataTimestamp) {
    return null;
  }

  let formattedTimestamp: string | null = null;

  if (dataTimestamp) {
    const parsed = new Date(normalizeTimestamp(dataTimestamp));
    formattedTimestamp = Number.isNaN(parsed.getTime())
      ? dataTimestamp
      : parsed.toLocaleString(i18n.language, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
  }

  return (
    <Alert severity="info" variant="outlined" icon={icon ?? false}>
      <Stack spacing={2}>
        <Typography variant="subtitle2" color="text.secondary">
          {t('deposits.notices.sourceHeader')}
        </Typography>
        <Stack spacing={1}>
          {periodDate && (
            <Typography variant="body2" color="text.primary">
              {t('deposits.notices.rateDate', { date: periodDate })}
            </Typography>
          )}
          {formattedTimestamp && (
            <Typography variant="body2" color="text.primary">
              {t('deposits.notices.timestamp', { timestamp: formattedTimestamp })}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Alert>
  );
};

export default RateTimestampNotice;
