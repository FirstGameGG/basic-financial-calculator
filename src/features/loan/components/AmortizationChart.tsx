import { Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LineChart } from '@mui/x-charts/LineChart';

import type { LoanResultView } from '../hooks/useLoanCalculator';

export type AmortizationChartProps = {
  result: LoanResultView;
};

export const AmortizationChart = ({ result }: AmortizationChartProps) => {
  const { t } = useTranslation();

  const periods = result.schedule.map((entry) => entry.period);
  const balances = result.schedule.map((entry) => entry.balance);
  const interest = result.schedule.map((entry) => entry.cumulativeInterest);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h6">{t('loan.chart.title')}</Typography>
        <LineChart
          height={320}
          series={[
            {
              id: 'balance',
              data: balances,
              label: t('loan.chart.principal'),
              curve: 'monotoneX',
            },
            {
              id: 'interest',
              data: interest,
              label: t('loan.chart.interest'),
              curve: 'monotoneX',
            },
          ]}
          xAxis={[{ data: periods, scaleType: 'linear', label: t('loan.chart.period') }]}
          grid={{ vertical: true, horizontal: true }}
          margin={{ top: 20, right: 20, left: 40, bottom: 40 }}
        />
      </Stack>
    </Paper>
  );
};

export default AmortizationChart;
