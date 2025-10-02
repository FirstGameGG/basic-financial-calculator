import { useEffect, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { LoadingButton } from '@mui/lab';
import Grid from '@mui/material/GridLegacy';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  computeSavingsDailyActual365,
  type SavingsCalculatorResult,
} from '../../../domain/finance/savingsActual365';
import { formatCurrency } from '../../../utils/format';
import { resolveLocalizedText } from '../../../utils/i18n';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';
import { selectLanguage, usePreferencesStore } from '../../preferences/store';
import { useBotDepositRates } from '../hooks/useBotDepositRates';
import {
  savingsDefaultValues,
  savingsFormSchema,
  type SavingsFormValues,
} from '../schema';
import {
  calculateEndDateFromTenure,
  getBangkokToday,
} from '../utils/date';
import type { BotDepositRateRecord } from '../../../services/bot/depositRates';
import { RateTimestampNotice } from './RateTimestampNotice';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';

const RATE_TYPE_OPTIONS: { value: 'min' | 'average' | 'max'; labelKey: string }[] = [
  { value: 'min', labelKey: 'deposits.rateType.min' },
  { value: 'average', labelKey: 'deposits.rateType.average' },
  { value: 'max', labelKey: 'deposits.rateType.max' },
];

const buildBankKey = (record: BotDepositRateRecord) => `${record.bankType.en}|${record.bank.en}`;

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

export const SavingsDepositCalculator = () => {
  const { t } = useTranslation();
  const preferredLanguage = usePreferencesStore(selectLanguage);
  const currency = 'THB';

  const [calculation, setCalculation] = useState<SavingsCalculatorResult | null>(null);
  const [appliedRate, setAppliedRate] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [periodDate, setPeriodDate] = useState<string | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [showAdvancedDetails, setShowAdvancedDetails] = useState<boolean>(false);

  const { data: botData, isLoading: botLoading, error: botError } = useBotDepositRates();

  const methods = useForm<SavingsFormValues>({
    defaultValues: savingsDefaultValues,
    resolver: zodResolver(savingsFormSchema),
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = methods;

  const { fields: eventFields, append, remove } = useFieldArray({ control, name: 'events' });

  useEffect(() => {
    if (!watch('startDate')) {
      const today = getBangkokToday();
      setValue('startDate', today, { shouldDirty: false });
      if (!watch('endDate')) {
        const defaultEnd = calculateEndDateFromTenure(today, 12);
        setValue('endDate', defaultEnd, { shouldDirty: false });
      }
    }
  }, [setValue, watch]);

  useEffect(() => {
    if (botData) {
      setPeriodDate(botData.period);
      setDataTimestamp(botData.timestamp);
      const firstRecord = botData.records[0];
      if (firstRecord && !watch('botSelection')) {
        setValue(
          'botSelection',
          { bankKey: buildBankKey(firstRecord), rateType: 'average' },
          { shouldDirty: false },
        );
      }
    }
  }, [botData, setValue, watch]);

  useEffect(() => {
    const currentSource = watch('rateSource');
    if (!botData && botError && currentSource === 'bot') {
      setValue('rateSource', 'custom');
    }
  }, [botData, botError, setValue, watch]);

  const bankGroups = useMemo(() => {
    if (!botData) return [];

    const grouped = new Map<
      string,
      {
        bankType: BotDepositRateRecord['bankType'];
        banks: BotDepositRateRecord[];
      }
    >();

    botData.records.forEach((record) => {
      const key = `${record.bankType.en}|${record.bankType.th ?? ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          bankType: record.bankType,
          banks: [],
        });
      }
      grouped.get(key)?.banks.push(record);
    });

    return Array.from(grouped.values()).map((group) => ({
      ...group,
      banks: group.banks.sort((a, b) => a.bank.en.localeCompare(b.bank.en)),
    }));
  }, [botData]);

  const bankRecordMap = useMemo(() => {
    if (!botData) return new Map<string, BotDepositRateRecord>();
    return new Map(botData.records.map((record) => [buildBankKey(record), record] as const));
  }, [botData]);

  const rateSource = watch('rateSource');

  const handleAddEvent = () => {
    const events = watch('events');
    const defaultDate = events.length > 0
      ? events[events.length - 1]?.date ?? watch('startDate') ?? ''
      : watch('startDate') ?? '';
    append({ date: defaultDate, type: 'deposit', amount: 0 });
  };

  const bankRateLabel = (record: BotDepositRateRecord) => {
    const rateSelection = watch('botSelection');
    const rateType = rateSelection?.rateType ?? 'average';
    const value = record.savings[rateType];
    if (value == null) return t('deposits.rateUnavailable');
    return percentFormatter.format(value / 100);
  };

  const onSubmit = (values: SavingsFormValues) => {
    let annualRatePercent = values.customAnnualRate ?? 0;

    if (values.rateSource === 'bot') {
      if (!values.botSelection) {
        setError('botSelection', { message: t('validation.required') });
        return;
      }
      const record = bankRecordMap.get(values.botSelection.bankKey);
      if (!record) {
        setError('botSelection', { message: t('deposits.errors.bankNotFound') });
        return;
      }
      const rateValue = record.savings[values.botSelection.rateType];
      if (rateValue == null) {
        setError('botSelection', { message: t('deposits.errors.rateUnavailable') });
        return;
      }
      annualRatePercent = rateValue;
    }

    try {
      const sanitizedEvents = values.events
        .map((event) => ({
          date: event.date,
          type: event.type,
          amount: Number(event.amount),
        }))
        .filter((event) => event.date);

      const result = computeSavingsDailyActual365({
        principalStart: values.principal,
        annualRatePct: annualRatePercent,
        startDate: values.startDate,
        endDate: values.endDate,
        events: sanitizedEvents,
        apply20kRule: true,
        overrideKeepCompounding: false,
        withholdingTax: {
          enabled: false,
          rate: 0,
        },
        timezone: 'Asia/Bangkok',
      });

      setCalculation(result);
      setAppliedRate(annualRatePercent);
      setSubmissionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmissionError(message);
      setCalculation(null);
      setAppliedRate(null);
    }
  };

  const renderError = (field: keyof typeof errors) => {
    const message = errors[field]?.message;
    if (!message) return null;
    return t(message.toString(), { defaultValue: message.toString() });
  };

  const handleExportPayoutHistory = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('deposits.csv.date'),
        t('deposits.csv.grossInterest'),
        t('deposits.csv.netInterest'),
        t('deposits.csv.balanceAfterPayout'),
      ],
    ];

    calculation.payouts.forEach((payout) => {
      rows.push([
        payout.date,
        formatCurrency(payout.grossInterest, currency),
        formatCurrency(payout.netInterest, currency),
        formatCurrency(payout.balanceAfterPayout, currency),
      ]);
    });

    const filename = `savings-payout-history-${calculation.payouts[0]?.date ?? 'export'}`;
    exportTable(filename, rows, format, t('deposits.savings.payoutHistory'));
  };

  const handleExportYearSummary = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('deposits.savings.yearSummary.year'),
        t('deposits.savings.yearSummary.totalGross'),
        t('deposits.savings.yearSummary.totalTax'),
        t('deposits.savings.yearSummary.totalNet'),
        t('deposits.savings.yearSummary.closingBalance'),
      ],
    ];

    calculation.yearSummaries.forEach((summary) => {
      rows.push([
        summary.year,
        formatCurrency(summary.grossInterest, currency),
        formatCurrency(summary.tax, currency),
        formatCurrency(summary.netInterest, currency),
        formatCurrency(summary.closingBalance, currency),
      ]);
    });

    const filename = `savings-year-summary-${calculation.yearSummaries[0]?.year ?? 'export'}`;
    exportTable(filename, rows, format, t('deposits.savings.yearSummary.title'));
  };

  const handleExportSteps = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('deposits.savings.step.from'),
        t('deposits.savings.step.to'),
        t('deposits.savings.step.days'),
        t('deposits.savings.step.principal'),
        t('deposits.csv.grossInterest'),
      ],
    ];

    calculation.steps.forEach((step) => {
      rows.push([
        step.fromDate,
        step.toDate,
        step.days,
        formatCurrency(step.principal, currency),
        formatCurrency(step.grossInterest, currency),
      ]);
    });

    const filename = `savings-daily-steps-${calculation.steps[0]?.fromDate ?? 'export'}`;
    exportTable(filename, rows, format, t('deposits.savings.stepsTitle'));
  };

  const renderEventRow = (index: number) => {
    const field = eventFields[index];
    const eventError = errors.events?.[index];

    return (
      <TableRow key={field.id}>
        <TableCell sx={{ minWidth: 160 }}>
          <Controller
            name={`events.${index}.date`}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                type="date"
                fullWidth
                value={controllerField.value ?? ''}
                error={Boolean(eventError?.date)}
                helperText={eventError?.date && t(eventError.date.message ?? '', { defaultValue: eventError.date.message })}
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 160 }}>
          <Controller
            name={`events.${index}.type`}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                select
                fullWidth
                error={Boolean(eventError?.type)}
                helperText={eventError?.type && t(eventError.type.message ?? '', {
                  defaultValue: eventError.type.message,
                })}
              >
                <MenuItem value="deposit">{t('deposits.events.deposit')}</MenuItem>
                <MenuItem value="withdraw">{t('deposits.events.withdraw')}</MenuItem>
              </TextField>
            )}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 160 }}>
          <Controller
            name={`events.${index}.amount`}
            control={control}
            render={({ field: controllerField }) => (
              <FormattedNumberField
                ref={controllerField.ref}
                name={controllerField.name}
                value={controllerField.value}
                onBlur={controllerField.onBlur}
                onValueChange={(value) => controllerField.onChange(value)}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                }}
                error={Boolean(eventError?.amount)}
                helperText={eventError?.amount && t(eventError.amount.message ?? '', {
                  defaultValue: eventError.amount.message,
                })}
              />
            )}
          />
        </TableCell>
        <TableCell align="right">
          <Tooltip title={t('deposits.events.remove')}>
            <span>
              <IconButton
                aria-label={t('deposits.events.remove')}
                onClick={() => remove(index)}
                disabled={eventFields.length === 0}
              >
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader
          title={t('deposits.savings.title')}
          subheader={t('deposits.savings.subtitle')}
        />
        <CardContent>
          <FormProvider {...methods}>
            <Stack
              component="form"
              noValidate
              spacing={3}
              onSubmit={(event) => {
                void handleSubmit(onSubmit)(event);
              }}
            >
              {botError && (
                <Alert severity="warning">{t('deposits.notices.botUnavailable')}</Alert>
              )}

              <RateTimestampNotice periodDate={periodDate} dataTimestamp={dataTimestamp} />

              <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">{t('deposits.fields.principal')}</Typography>
                  <Controller
                    name="principal"
                    control={control}
                    render={({ field }) => (
                      <FormattedNumberField
                        ref={field.ref}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        onValueChange={(value) => field.onChange(value)}
                        placeholder="100000"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{currency}</InputAdornment>,
                          inputProps: { 'aria-label': t('deposits.fields.principal') },
                        }}
                        error={Boolean(errors.principal)}
                        helperText={renderError('principal')}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">{t('deposits.fields.rateSource')}</Typography>
                  <Controller
                    name="rateSource"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        SelectProps={{ inputProps: { 'aria-label': t('deposits.fields.rateSource') } }}
                      >
                        <MenuItem value="bot" disabled={!botData}>
                          {t('deposits.rateSource.bot')}
                        </MenuItem>
                        <MenuItem value="custom">{t('deposits.rateSource.custom')}</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>

                {rateSource === 'custom' && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">{t('deposits.fields.customRate')}</Typography>
                    <Controller
                      name="customAnnualRate"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="1.25"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                            inputProps: { 'aria-label': t('deposits.fields.customRate') },
                          }}
                          error={Boolean(errors.customAnnualRate)}
                          helperText={renderError('customAnnualRate')}
                          onChange={(event) =>
                            field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                          }
                        />
                      )}
                    />
                  </Grid>
                )}

                {rateSource === 'bot' && botData && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">{t('deposits.fields.bank')}</Typography>
                    <Controller
                      name="botSelection"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          value={field.value?.bankKey ?? ''}
                          onChange={(event) =>
                            field.onChange({
                              bankKey: event.target.value,
                              rateType: field.value?.rateType ?? 'average',
                            })
                          }
                          error={Boolean(errors.botSelection)}
                          helperText={renderError('botSelection')}
                          SelectProps={{ inputProps: { 'aria-label': t('deposits.fields.bank') } }}
                        >
                          {bankGroups.flatMap((group) => {
                            const groupKey = `${group.bankType.en}-${group.bankType.th ?? 'th'}`;
                            const groupLabel = resolveLocalizedText(preferredLanguage, group.bankType);
                            return [
                              <ListSubheader key={`${groupKey}-header`}>
                                {groupLabel}
                              </ListSubheader>,
                              ...group.banks.map((record) => (
                                <MenuItem key={buildBankKey(record)} value={buildBankKey(record)}>
                                  {resolveLocalizedText(preferredLanguage, record.bank)}
                                  {' · '}
                                  {bankRateLabel(record)}
                                </MenuItem>
                              )),
                            ];
                          })}
                        </TextField>
                      )}
                    />
                  </Grid>
                )}

                {rateSource === 'bot' && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">{t('deposits.fields.rateType')}</Typography>
                    <Controller
                      name="botSelection"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          select
                          value={field.value?.rateType ?? 'average'}
                          onChange={(event) =>
                            field.onChange({
                              bankKey: field.value?.bankKey ?? '',
                              rateType: event.target.value as 'min' | 'average' | 'max',
                            })
                          }
                        >
                          {RATE_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {t(option.labelKey)}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">{t('deposits.fields.startDate')}</Typography>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ 'aria-label': t('deposits.fields.startDate') }}
                        error={Boolean(errors.startDate)}
                        helperText={renderError('startDate')}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">{t('deposits.fields.endDate')}</Typography>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ 'aria-label': t('deposits.fields.endDate') }}
                        error={Boolean(errors.endDate)}
                        helperText={renderError('endDate')}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">{t('deposits.events.title')}</Typography>
                  <Tooltip title={t('deposits.events.add')}>
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddEvent}
                      >
                        {t('deposits.events.add')}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('deposits.events.date')}</TableCell>
                        <TableCell>{t('deposits.events.type')}</TableCell>
                        <TableCell>{t('deposits.events.amount')}</TableCell>
                        <TableCell align="right">{t('deposits.events.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {eventFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              {t('deposits.events.empty')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {eventFields.map((_event, index) => renderEventRow(index))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary">
                  {t('deposits.events.hint')}
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting || botLoading}
                >
                  {t('deposits.actions.calculate')}
                </LoadingButton>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => {
                    methods.reset(savingsDefaultValues);
                    setCalculation(null);
                    setAppliedRate(null);
                    setSubmissionError(null);
                  }}
                >
                  {t('deposits.actions.reset')}
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {t('deposits.savings.agreement')}
              </Typography>
            </Stack>
          </FormProvider>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title={t('deposits.results.title')} />
        <CardContent>
          {!calculation && !submissionError && (
            <Typography variant="body2" color="text.secondary">
              {t('deposits.results.empty')}
            </Typography>
          )}

          {submissionError && (
            <Alert severity="error" sx={{ mb: calculation ? 2 : 0 }}>
              {submissionError}
            </Alert>
          )}

          {calculation && (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.totalContributions')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.totalContributions, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.grossInterest')}</Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.grossInterestTotal, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.taxWithheld')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.withholdingTaxTotal, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.netInterest')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.netInterestTotal, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.endingBalance')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.endingBalance, currency)}
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {calculation.yearSummaries.map((summary) => (
                  <Chip
                    key={summary.year}
                    label={
                      summary.mode === 'CompoundAtPayout'
                        ? t('deposits.savings.mode.compound', { year: summary.year })
                        : t('deposits.savings.mode.simple', { year: summary.year })
                    }
                    color={summary.mode === 'CompoundAtPayout' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                ))}
              </Stack>

              {appliedRate != null && (
                <Typography variant="body2" color="text.secondary">
                  {t('deposits.results.appliedRate')}: {percentFormatter.format(appliedRate / 100)}
                </Typography>
              )}

              <Divider />

              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography variant="subtitle2">{t('deposits.savings.payoutHistory')}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                    >
                      {showAdvancedDetails ? t('deposits.savings.advancedDetails.toggle').replace('Show', 'Hide') : t('deposits.savings.advancedDetails.toggle')}
                    </Button>
                    <ExportButton onExport={handleExportPayoutHistory} disabled={calculation.payouts.length === 0} size="small" />
                  </Stack>
                </Stack>
                {calculation.payouts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t('deposits.savings.noPayouts')}
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('deposits.csv.date')}</TableCell>
                          <TableCell>{t('deposits.csv.grossInterest')}</TableCell>
                          {!showAdvancedDetails && <TableCell>{t('deposits.csv.netInterest')}</TableCell>}
                          {!showAdvancedDetails && <TableCell>{t('deposits.csv.balanceAfterPayout')}</TableCell>}
                          {showAdvancedDetails && <TableCell>{t('deposits.savings.advancedDetails.taxableAmount')}</TableCell>}
                          {showAdvancedDetails && <TableCell>{t('deposits.savings.advancedDetails.taxWithheld')}</TableCell>}
                          {showAdvancedDetails && <TableCell>{t('deposits.savings.advancedDetails.runningTax')}</TableCell>}
                          {showAdvancedDetails && <TableCell>{t('deposits.csv.balanceAfterPayout')}</TableCell>}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculation.payouts.map((payout) => (
                          <TableRow key={payout.date} sx={{ 
                            backgroundColor: payout.thresholdCrossed ? 'warning.light' : 'inherit',
                            '&:hover': {
                              backgroundColor: payout.thresholdCrossed ? 'warning.main' : undefined,
                            }
                          }}>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <span>{payout.date}</span>
                                {payout.thresholdCrossed && (
                                  <Chip 
                                    label={t('deposits.savings.thresholdBadge')} 
                                    size="small" 
                                    color="warning"
                                  />
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>{formatCurrency(payout.grossInterest, currency)}</TableCell>
                            {!showAdvancedDetails && <TableCell>{formatCurrency(payout.netInterest, currency)}</TableCell>}
                            {!showAdvancedDetails && <TableCell>{formatCurrency(payout.balanceAfterPayout, currency)}</TableCell>}
                            {showAdvancedDetails && <TableCell>{formatCurrency(payout.taxableAmountThisPayout ?? 0, currency)}</TableCell>}
                            {showAdvancedDetails && <TableCell>{formatCurrency(payout.taxWithheldThisPayout ?? 0, currency)}</TableCell>}
                            {showAdvancedDetails && <TableCell>{formatCurrency(payout.runningYtdTax ?? 0, currency)}</TableCell>}
                            {showAdvancedDetails && <TableCell>{formatCurrency(payout.balanceAfterPayout, currency)}</TableCell>}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
                
                {calculation.payouts.length > 0 && (
                  <Card variant="outlined" sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        {t('deposits.savings.status.title')}
                      </Typography>
                      <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('deposits.savings.status.cumulativeYtd')}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(calculation.payouts[calculation.payouts.length - 1]?.cumulativeYtdGross ?? 0, currency)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {(calculation.payouts[calculation.payouts.length - 1]?.remainingToThreshold ?? 0) > 0
                              ? t('deposits.savings.status.remainingToThreshold')
                              : t('deposits.savings.status.exceededBy')}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {formatCurrency(Math.abs(calculation.payouts[calculation.payouts.length - 1]?.remainingToThreshold ?? 0), currency)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('deposits.savings.status.taxStatus')}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {calculation.payouts[calculation.payouts.length - 1]?.taxStatus === 'none' && t('deposits.savings.status.taxStatusNone')}
                            {calculation.payouts[calculation.payouts.length - 1]?.taxStatus === 'threshold-crossed' && t('deposits.savings.status.taxStatusCrossed')}
                            {calculation.payouts[calculation.payouts.length - 1]?.taxStatus === 'above-threshold' && t('deposits.savings.status.taxStatusAbove')}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            {t('deposits.savings.status.interestMethod')}
                          </Typography>
                          <Typography variant="body1" fontWeight="medium">
                            {calculation.payouts[calculation.payouts.length - 1]?.interestMethod === 'compound'
                              ? t('deposits.savings.status.methodCompound')
                              : t('deposits.savings.status.methodSimple')}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Stack>

              {calculation.yearSummaries.length > 0 && (
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{t('deposits.savings.yearSummary.title')}</Typography>
                    <ExportButton onExport={handleExportYearSummary} size="small" />
                  </Stack>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('deposits.savings.yearSummary.year')}</TableCell>
                          <TableCell>{t('deposits.savings.yearSummary.totalGross')}</TableCell>
                          <TableCell>{t('deposits.savings.yearSummary.totalTax')}</TableCell>
                          <TableCell>{t('deposits.savings.yearSummary.totalNet')}</TableCell>
                          <TableCell>{t('deposits.savings.yearSummary.closingBalance')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculation.yearSummaries.map((summary) => (
                          <TableRow key={summary.year}>
                            <TableCell>{summary.year}</TableCell>
                            <TableCell>{formatCurrency(summary.grossInterest, currency)}</TableCell>
                            <TableCell>{formatCurrency(summary.tax, currency)}</TableCell>
                            <TableCell>{formatCurrency(summary.netInterest, currency)}</TableCell>
                            <TableCell>{formatCurrency(summary.closingBalance, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              )}

              {calculation.steps.length > 0 && showAdvancedDetails && (
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{t('deposits.savings.stepsTitle')}</Typography>
                    <ExportButton onExport={handleExportSteps} size="small" />
                  </Stack>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('deposits.savings.step.from')}</TableCell>
                          <TableCell>{t('deposits.savings.step.to')}</TableCell>
                          <TableCell>{t('deposits.savings.step.days')}</TableCell>
                          <TableCell>{t('deposits.savings.step.principal')}</TableCell>
                          <TableCell>{t('deposits.csv.grossInterest')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calculation.steps.map((step) => (
                          <TableRow key={`${step.fromDate}-${step.toDate}`}>
                            <TableCell>{step.fromDate}</TableCell>
                            <TableCell>{step.toDate}</TableCell>
                            <TableCell>{step.days}</TableCell>
                            <TableCell>{formatCurrency(step.principal, currency)}</TableCell>
                            <TableCell>{formatCurrency(step.grossInterest, currency)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Stack>
              )}

              <Alert severity="info" variant="outlined" icon={false}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2">
                    {t('deposits.savings.notes.title')}
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {t('deposits.savings.notes.first')}
                    </Typography>
                    <Typography variant="body2">
                      {t('deposits.savings.notes.second')}
                    </Typography>
                    <Typography variant="body2">
                      {t('deposits.savings.notes.third')}
                    </Typography>
                    <Typography variant="body2">
                      {t('deposits.savings.notes.fourth')}
                    </Typography>
                  </Stack>
                </Stack>
              </Alert>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};