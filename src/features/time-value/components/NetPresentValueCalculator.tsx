import { useMemo, useState } from 'react';

import Grid from '@mui/material/GridLegacy';
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { BarChart } from '@mui/x-charts/BarChart';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  netPresentValueDefaultValues,
  netPresentValueFormSchema,
  type NetPresentValueFormValues,
} from '../schema';
import {
  calculateNetPresentValue,
  type NetPresentValueResult,
} from '../../../domain/finance/timeValue';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';

export const NetPresentValueCalculator = () => {
  const { t } = useTranslation();
  const currency = 'THB';

  const methods = useForm<NetPresentValueFormValues>({
    defaultValues: netPresentValueDefaultValues,
    resolver: zodResolver(netPresentValueFormSchema),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = methods;

  const initialInvestment = watch('initialInvestment');
  const discountRatePercent = watch('discountRatePercent');
  const periodsPerYear = watch('periodsPerYear');

  const { fields, append, remove } = useFieldArray<NetPresentValueFormValues, 'cashFlows'>({
    control,
    name: 'cashFlows',
  });
  const [calculation, setCalculation] = useState<NetPresentValueResult | null>(null);

  const onSubmit = (values: NetPresentValueFormValues) => {
    const result = calculateNetPresentValue({
      initialInvestment: values.initialInvestment,
      discountRatePercent: values.discountRatePercent,
      periodsPerYear: values.periodsPerYear,
      cashFlows: values.cashFlows.map((entry) => entry.amount),
    });
    setCalculation(result);
  };

  const handleReset = () => {
    reset(netPresentValueDefaultValues);
    setCalculation(null);
  };

  const handleAddCashFlow = () => {
    append({ amount: 0 });
  };

  const handleRemoveCashFlow = (index: number) => {
    if (fields.length === 1) return;
    remove(index);
  };

  const formatAsCurrency = (value: number, customCurrency?: string) =>
    formatCurrency(value, (customCurrency ?? currency).toUpperCase());

  const handleExportCashFlows = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('timeValue.npv.results.period'),
        t('timeValue.npv.results.cashFlow'),
        t('timeValue.npv.results.presentValue'),
      ],
    ];

    calculation.discountedCashFlows.forEach((entry) => {
      rows.push([
        entry.period,
        formatCurrency(entry.cashFlow.toNumber(), currency),
        formatCurrency(entry.presentValue.toNumber(), currency),
      ]);
    });

    const filename = `npv-cash-flows-${new Date().toISOString().split('T')[0]}`;
    exportTable(filename, rows, format, t('timeValue.npv.results.discountedCashFlows'));
  };

  const cashFlowArrayErrorMessage = (() => {
    const error = errors.cashFlows;
    if (!error || Array.isArray(error)) {
      return undefined;
    }

    if (typeof (error as { message?: string }).message === 'string') {
      return (error as { message?: string }).message;
    }

    const root = (error as { root?: { message?: string } }).root;
    if (typeof root?.message === 'string') {
      return root.message;
    }

    return undefined;
  })();

  const chartData = useMemo(() => {
    if (!calculation) return null;

    return calculation.discountedCashFlows.map((entry) => ({
      period: entry.period,
      cashFlow: entry.cashFlow.toNumber(),
      presentValue: entry.presentValue.toNumber(),
    }));
  }, [calculation]);

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader title={t('timeValue.npv.title')} subheader={t('timeValue.npv.description')} />
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
                    {t('timeValue.npv.inputs.initialInvestment')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="10000"
                    value={initialInvestment}
                    onValueChange={(value) => setValue('initialInvestment', value ?? 0)}
                    error={Boolean(errors.initialInvestment)}
                    helperText={errors.initialInvestment?.message}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.npv.inputs.discountRate')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="8"
                    value={discountRatePercent}
                    onValueChange={(value) => setValue('discountRatePercent', value ?? 0)}
                    error={Boolean(errors.discountRatePercent)}
                    helperText={errors.discountRatePercent?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">
                    {t('timeValue.npv.inputs.periodsPerYear')}
                  </Typography>
                  <FormattedNumberField
                    fullWidth
                    placeholder="1"
                    value={periodsPerYear}
                    onValueChange={(value) => setValue('periodsPerYear', value ?? 1)}
                    error={Boolean(errors.periodsPerYear)}
                    helperText={errors.periodsPerYear?.message}
                  />
                </Grid>
              </Grid>

              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                    {t('timeValue.npv.inputs.cashFlows')}
                  </Typography>
                  <LoadingButton
                    type="button"
                    startIcon={<AddCircleOutlineRoundedIcon />}
                    variant="outlined"
                    onClick={handleAddCashFlow}
                  >
                    {t('timeValue.npv.actions.addCashFlow')}
                  </LoadingButton>
                </Stack>
                {cashFlowArrayErrorMessage ? (
                  <Typography color="error" variant="body2">
                    {cashFlowArrayErrorMessage}
                  </Typography>
                ) : null}
                <Stack spacing={2}>
                  {fields.map((field, index) => {
                    const cashFlowFieldName = `cashFlows.${index}.amount` as const;
                    const cashFlowValue = watch(cashFlowFieldName);
                    return (
                      <Stack key={field.id} direction="row" spacing={2} alignItems="center">
                        <FormattedNumberField
                          fullWidth
                          placeholder="0"
                          value={cashFlowValue}
                          onValueChange={(value) => setValue(cashFlowFieldName, value ?? 0)}
                          error={Boolean(errors.cashFlows?.[index]?.amount)}
                          helperText={errors.cashFlows?.[index]?.amount?.message}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                          }}
                        />
                        <IconButton
                          aria-label={t('timeValue.npv.actions.removeCashFlow')}
                          onClick={() => handleRemoveCashFlow(index)}
                          disabled={fields.length === 1}
                        >
                          <DeleteOutlineRoundedIcon />
                        </IconButton>
                      </Stack>
                    );
                  })}
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ minWidth: 200 }}>
                  {t('timeValue.npv.submit')}
                </LoadingButton>
                <LoadingButton type="button" variant="text" color="inherit" onClick={handleReset}>
                  {t('timeValue.npv.reset')}
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        </CardContent>
      </Card>

      <Stack spacing={3}>
        <Card variant="outlined">
          <CardHeader title={t('timeValue.npv.results.title')} />
          <CardContent>
            {calculation ? (
              <>
                <Grid container spacing={3} sx={{ m: 0, width: '100%' }}>
                  <Grid item xs={12} md={4}>
                    <ResultStat
                      label={t('timeValue.npv.results.netPresentValue')}
                      value={formatAsCurrency(calculation.npv.toNumber())}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ResultStat
                      label={t('timeValue.npv.results.totalCashFlow')}
                      value={formatAsCurrency(calculation.totalCashFlow.toNumber())}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <ResultStat
                      label={t('timeValue.npv.results.ratePerPeriod')}
                      value={`${formatNumber(calculation.ratePerPeriod.times(100).toNumber(), 3)} %`}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {t('timeValue.npv.results.discountedCashFlows')}
                  </Typography>
                  <ExportButton onExport={handleExportCashFlows} size="small" />
                </Stack>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('timeValue.npv.results.period')}</TableCell>
                      <TableCell align="right">{t('timeValue.npv.results.cashFlow')}</TableCell>
                      <TableCell align="right">{t('timeValue.npv.results.presentValue')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {calculation.discountedCashFlows.map((entry) => (
                      <TableRow key={entry.period}>
                        <TableCell>{entry.period}</TableCell>
                        <TableCell align="right">
                          {formatAsCurrency(entry.cashFlow.toNumber())}
                        </TableCell>
                        <TableCell align="right">
                          {formatAsCurrency(entry.presentValue.toNumber())}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t('timeValue.npv.results.empty')}
              </Typography>
            )}
          </CardContent>
        </Card>

        {chartData ? (
          <Card variant="outlined">
            <CardHeader title={t('timeValue.npv.chart.title')} />
            <CardContent>
              <BarChart
                height={320}
                dataset={chartData}
                xAxis={[{ scaleType: 'band', dataKey: 'period', label: t('timeValue.npv.chart.periodLabel') }]}
                series={[
                  {
                    dataKey: 'cashFlow',
                    label: t('timeValue.npv.chart.cashFlow'),
                    valueFormatter: (value) => formatAsCurrency(Number(value ?? 0)),
                  },
                  {
                    dataKey: 'presentValue',
                    label: t('timeValue.npv.chart.presentValue'),
                    valueFormatter: (value) => formatAsCurrency(Number(value ?? 0)),
                  },
                ]}
                margin={{ top: 16, right: 16, bottom: 32, left: 64 }}
              />
            </CardContent>
          </Card>
        ) : null}
      </Stack>
    </Stack>
  );
};



const ResultStat = ({ label, value }: { label: string; value: string }) => (
  <Stack spacing={1}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Stack>
);

export default NetPresentValueCalculator;
