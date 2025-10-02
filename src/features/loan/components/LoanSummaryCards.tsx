import { Box, Card, CardContent, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../../../utils/format';
import type { LoanResultView } from '../hooks/useLoanCalculator';

export type LoanSummaryCardsProps = {
  result: LoanResultView;
};

export const LoanSummaryCards = ({ result }: LoanSummaryCardsProps) => {
  const { t } = useTranslation();

  const summaryItems = [
    {
      label: t('loan.results.monthlyPayment'),
      value: formatCurrency(result.paymentPerPeriod, result.currency),
    },
    {
      label: t('loan.results.totalInterest'),
      value: formatCurrency(result.totalInterest, result.currency),
    },
    {
      label: t('loan.results.totalCost'),
      value: formatCurrency(result.totalCost, result.currency),
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {summaryItems.map((item) => (
        <Box
          key={item.label}
          sx={{
            flexGrow: 1,
            flexBasis: { xs: '100%', md: 'calc(33.333% - 16px)' },
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <Card 
            variant="outlined" 
            sx={{ 
              height: '100%',
              minWidth: 0,
              maxWidth: '100%',
            }}
          >
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="h5">{item.value}</Typography>
            </CardContent>
          </Card>
        </Box>
      ))}
    </Box>
  );
};

export default LoanSummaryCards;
