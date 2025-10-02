import { useMemo, useState } from 'react';

import Grid from '@mui/material/GridLegacy';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { LineChart } from '@mui/x-charts/LineChart';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  futureValueDefaultValues,
  futureValueFormSchema,
  type FutureValueFormValues,
} from '../schema';
import { calculateFutureValue, type FutureValueResult } from '../../../domain/finance/timeValue';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const COMPOUNDING_OPTIONS: { value: FutureValueFormValues['compoundingFrequency']; labelKey: string }[] = [
  { value: 'monthly', labelKey: 'timeValue.futureValue.frequency.monthly' },
  { value: 'quarterly', labelKey: 'timeValue.futureValue.frequency.quarterly' },
  { value: 'annually', labelKey: 'timeValue.futureValue.frequency.annually' },
];

export const FutureValueCalculator = () => {
  const { t } = useTranslation();
  const currency = 'THB';

  const methods = useForm<FutureValueFormValues>({
    defaultValues: futureValueDefaultValues,
    resolver: zodResolver(futureValueFormSchema),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = methods;

  const presentValue = watch('presentValue');
  const annualRatePercent = watch('annualRatePercent');
  const totalPeriods = watch('totalPeriods');
  const recurringContribution = watch('recurringContribution');

  const [calculation, setCalculation] = useState<FutureValueResult | null>(null);

  const onSubmit = (values: FutureValueFormValues) => {
    const result = calculateFutureValue(values);
    setCalculation(result);
  };

  const handleReset = () => {
    reset(futureValueDefaultValues);
    setCalculation(null);
  };

  const formatAsCurrency = (value: number, customCurrency?: string) =>
    formatCurrency(value, (customCurrency ?? currency).toUpperCase());

  const handleExportSchedule = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('timeValue.futureValue.chart.periodLabel'),
        t('timeValue.futureValue.chart.totalContributions'),
        t('timeValue.futureValue.chart.totalValue'),
        t('timeValue.futureValue.results.totalGrowth'),
      ],
    ];

    calculation.schedule.forEach((entry) => {
      const growth = entry.totalValue.minus(entry.totalContributions);
      rows.push([
        entry.period,
        formatCurrency(entry.totalContributions.toNumber(), currency),
        formatCurrency(entry.totalValue.toNumber(), currency),
        formatCurrency(growth.toNumber(), currency),
      ]);
    });

    const filename = `future-value-schedule-${new Date().toISOString().split('T')[0]}`;
    exportTable(filename, rows, format, t('timeValue.futureValue.title'));
  };

  const chartData = useMemo(() => {
    if (!calculation) return null;

    return calculation.schedule.map((entry) => ({
      period: entry.period,
      totalValue: entry.totalValue.toNumber(),
      totalContributions: entry.totalContributions.toNumber(),
    }));
  }, [calculation]);

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader
          title={t('timeValue.futureValue.title')}
          subheader={t('timeValue.futureValue.description')}
        />
        <CardContent>
          <FormProvider {...methods}>
            <Stack
              component="form"
              spacing={3}
              noValidate
              onSubmit={(event) => {
                void handleSubmit(onSubmit)(event);
              }}
            >
              <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.startingPrincipal')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="0"
                    value={presentValue}
                    onValueChange={(value) => setValue('presentValue', value ?? 0)}
                    error={Boolean(errors.presentValue)}
                    helperText={errors.presentValue?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.annualRate')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="0"
                    value={annualRatePercent}
                    onValueChange={(value) => setValue('annualRatePercent', value ?? 0)}
                    error={Boolean(errors.annualRatePercent)}
                    helperText={errors.annualRatePercent?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.totalPeriods')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="120"
                    value={totalPeriods}
                    onValueChange={(value) => setValue('totalPeriods', value ?? 0)}
                    error={Boolean(errors.totalPeriods)}
                    helperText={errors.totalPeriods?.message}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.compoundingFrequency')}
                  </Typography>
                  <Controller
                    name="compoundingFrequency"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        {...field}
                        error={Boolean(errors.compoundingFrequency)}
                        helperText={errors.compoundingFrequency?.message}
                      >
                        {COMPOUNDING_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </MenuItem>
                        ))}
                      </SelectField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.recurringContribution')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="0"
                    value={recurringContribution}
                    onValueChange={(value) => setValue('recurringContribution', value ?? 0)}
                    error={Boolean(errors.recurringContribution)}
                    helperText={errors.recurringContribution?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.futureValue.inputs.contributionTiming')}
                  </Typography>
                  <Controller
                    name="contributionTiming"
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        {...field}
                        error={Boolean(errors.contributionTiming)}
                        helperText={errors.contributionTiming?.message}
                      >
                        <MenuItem value="end">{t('timeValue.futureValue.timing.end')}</MenuItem>
                        <MenuItem value="begin">{t('timeValue.futureValue.timing.begin')}</MenuItem>
                      </SelectField>
                    )}
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ minWidth: 200 }}>
                  {t('timeValue.futureValue.submit')}
                </LoadingButton>
                <LoadingButton type="button" variant="text" color="inherit" onClick={handleReset}>
                  {t('timeValue.futureValue.reset')}
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title={t('timeValue.futureValue.results.title')} />
        <CardContent>
          {calculation ? (
            <>
              <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.futureValue')}
                    value={formatAsCurrency(calculation.futureValue.toNumber())}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.totalInvested')}
                    value={formatAsCurrency(calculation.totalInvested.toNumber())}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.totalGrowth')}
                    value={formatAsCurrency(calculation.totalGrowth.toNumber())}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.periods')}
                    value={formatNumber(calculation.totalPeriods.toNumber(), 0)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.periodicContribution')}
                    value={formatAsCurrency(calculation.periodicContribution.toNumber())}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <ResultStat
                    label={t('timeValue.futureValue.results.ratePerPeriod')}
                    value={`${formatNumber(calculation.ratePerPeriod.times(100).toNumber(), 4)} %`}
                  />
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('timeValue.futureValue.results.empty')}
            </Typography>
          )}
        </CardContent>
      </Card>

      {chartData ? (
        <Card variant="outlined">
          <CardHeader title={t('timeValue.futureValue.chart.title')} />
          <CardContent>
            <LineChart
              height={320}
              xAxis={[{ dataKey: 'period', scaleType: 'point', label: t('timeValue.futureValue.chart.periodLabel') }]}
              series={[
                {
                  id: 'totalValue',
                  dataKey: 'totalValue',
                  label: t('timeValue.futureValue.chart.totalValue'),
                  valueFormatter: (value) => formatAsCurrency(Number(value ?? 0)),
                },
                {
                  id: 'totalContributions',
                  dataKey: 'totalContributions',
                  label: t('timeValue.futureValue.chart.totalContributions'),
                  valueFormatter: (value) => formatAsCurrency(Number(value ?? 0)),
                },
              ]}
              dataset={chartData}
              margin={{ top: 16, right: 20, bottom: 32, left: 60 }}
            />
          </CardContent>
        </Card>
      ) : null}

      {calculation ? (
        <Card variant="outlined">
          <CardHeader
            title={t('timeValue.futureValue.schedule.title', 'Schedule Breakdown')}
            action={<ExportButton onExport={handleExportSchedule} size="small" />}
          />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('timeValue.futureValue.chart.periodLabel')}</TableCell>
                    <TableCell align="right">{t('timeValue.futureValue.chart.totalContributions')}</TableCell>
                    <TableCell align="right">{t('timeValue.futureValue.chart.totalValue')}</TableCell>
                    <TableCell align="right">{t('timeValue.futureValue.results.totalGrowth')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculation.schedule.map((entry) => {
                    const growth = entry.totalValue.minus(entry.totalContributions);
                    return (
                      <TableRow key={entry.period} hover>
                        <TableCell>{entry.period}</TableCell>
                        <TableCell align="right">{formatAsCurrency(entry.totalContributions.toNumber())}</TableCell>
                        <TableCell align="right">{formatAsCurrency(entry.totalValue.toNumber())}</TableCell>
                        <TableCell align="right">{formatAsCurrency(growth.toNumber())}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
};



const SelectField = (props: TextFieldProps) => <TextField select fullWidth {...props} />;

const ResultStat = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={1}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Stack>
);

export default FutureValueCalculator;