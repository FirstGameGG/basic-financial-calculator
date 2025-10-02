import { useEffect, useMemo, useState } from 'react';

import Grid from '@mui/material/GridLegacy';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  InputAdornment,
  ListSubheader,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { LineChart } from '@mui/x-charts/LineChart';
import { useTheme } from '@mui/material/styles';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  calculateFixedDeposit,
  type FixedDepositResult,
} from '../../../domain/finance/deposit';
import { formatCurrency } from '../../../utils/format';
import { selectLanguage, usePreferencesStore } from '../../preferences/store';
import { useBotDepositRates } from '../hooks/useBotDepositRates';
import {
  fixedDepositDefaultValues,
  fixedDepositFormSchema,
  type FixedDepositFormValues,
} from '../schema';
import {
  calculateEndDateFromTenure,
  formatBangkokDate,
  getBangkokToday,
  parseBangkokDate,
} from '../utils/date';
import type { BotDepositRateRecord, BotFixedTerm } from '../../../services/bot/depositRates';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';
import { resolveLocalizedText } from '../../../utils/i18n';
import { RateTimestampNotice } from './RateTimestampNotice';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';

const RATE_TYPE_OPTIONS: { value: 'min' | 'average' | 'max'; labelKey: string }[] = [
  { value: 'min', labelKey: 'deposits.rateType.min' },
  { value: 'average', labelKey: 'deposits.rateType.average' },
  { value: 'max', labelKey: 'deposits.rateType.max' },
];

const TERM_MONTHS: Record<BotFixedTerm, number> = {
  '3M': 3,
  '6M': 6,
  '12M': 12,
  '24M': 24,
};

const buildBankKey = (record: BotDepositRateRecord) => `${record.bankType.en}|${record.bank.en}`;

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

export const FixedDepositCalculator = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const preferredLanguage = usePreferencesStore(selectLanguage);
  const currency = 'THB';

  const { data: botData, isLoading: botLoading, error: botError } = useBotDepositRates();
  const [calculation, setCalculation] = useState<FixedDepositResult | null>(null);
  const [appliedRate, setAppliedRate] = useState<number | null>(null);
  const [periodDate, setPeriodDate] = useState<string | null>(null);
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);
  const [maturityDate, setMaturityDate] = useState<string | null>(null);

  const methods = useForm<FixedDepositFormValues>({
    defaultValues: fixedDepositDefaultValues,
    resolver: zodResolver(fixedDepositFormSchema),
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = methods;

  useEffect(() => {
    if (!watch('startDate')) {
      const today = getBangkokToday();
      setValue('startDate', today, { shouldDirty: false });
    }
  }, [setValue, watch]);

  useEffect(() => {
    if (botData) {
      setPeriodDate(botData.period);
      setDataTimestamp(botData.timestamp);
      const firstRecord = botData.records[0];
      if (firstRecord && !watch('botSelection')) {
        const termCandidates = (Object.keys(firstRecord.fixed) as BotFixedTerm[]).filter((term) => {
          const rate = firstRecord.fixed[term];
          return rate.min != null || rate.max != null;
        });
        if (!termCandidates.length) {
          return;
        }
        const defaultTerm = termCandidates.includes('12M')
          ? '12M'
          : termCandidates[0] ?? '12M';
        setValue(
          'botSelection',
          { bankKey: buildBankKey(firstRecord), rateType: 'average', term: defaultTerm },
          { shouldDirty: false },
        );
        setValue('termMonths', TERM_MONTHS[defaultTerm], { shouldDirty: false });
      }
    }
  }, [botData, setValue, watch]);

  useEffect(() => {
    const currentSource = watch('rateSource');
    if (!botData && botError && currentSource === 'bot') {
      setValue('rateSource', 'custom');
    }
  }, [botData, botError, setValue, watch]);

  const rateSource = watch('rateSource');
  const termMonths = watch('termMonths');
  const termCount = watch('termCount');
  const startDate = watch('startDate');

  useEffect(() => {
    if (startDate && termMonths && termCount) {
      const totalMonths = termMonths * termCount;
      const computedEnd = calculateEndDateFromTenure(startDate, totalMonths);
      setMaturityDate(computedEnd);
    }
  }, [startDate, termMonths, termCount]);

  const bankGroups = useMemo(() => {
    if (!botData) return [];
    const grouped = new Map<
      string,
      { bankType: BotDepositRateRecord['bankType']; banks: BotDepositRateRecord[] }
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

  const botSelection = watch('botSelection');

  const availableTerms = useMemo(() => {
    if (!botData) return [];
    const record = botSelection ? bankRecordMap.get(botSelection.bankKey) : null;
    if (!record) return [];

    return (Object.keys(record.fixed) as BotFixedTerm[]).filter((term) => {
      const rate = record.fixed[term];
      return rate.min != null || rate.max != null;
    });
  }, [bankRecordMap, botData, botSelection]);

  const bankRateLabel = (record: BotDepositRateRecord) => {
    const rateType = botSelection?.rateType ?? 'average';
    const preferredTerm = botSelection?.term;
    const termCandidates = (Object.keys(record.fixed) as BotFixedTerm[]).filter((term) => {
      const rate = record.fixed[term];
      return rate.min != null || rate.max != null || rate.average != null;
    });

    const resolvedTerm = preferredTerm && record.fixed[preferredTerm]
      ? preferredTerm
      : termCandidates[0];

    if (!resolvedTerm) {
      return t('deposits.rateUnavailable');
    }

    const rateEntry = record.fixed[resolvedTerm];
    const value = rateEntry[rateType] ?? rateEntry.average ?? rateEntry.max ?? rateEntry.min;

    if (value == null) {
      return t('deposits.rateUnavailable');
    }

    return percentFormatter.format(value / 100);
  };

  const onSubmit = (values: FixedDepositFormValues) => {
    let annualRatePercent = values.customAnnualRate ?? 0;
    let effectiveTermMonths = values.termMonths;

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

      const rate = record.fixed[values.botSelection.term]?.[values.botSelection.rateType];
      if (rate == null) {
        setError('botSelection', { message: t('deposits.errors.rateUnavailable') });
        return;
      }

      annualRatePercent = rate;
      effectiveTermMonths = TERM_MONTHS[values.botSelection.term];
    }

    const result = calculateFixedDeposit({
      principal: values.principal,
      annualRatePercent,
      termMonths: effectiveTermMonths,
      startDate: values.startDate,
      termCount: values.termCount,
      compoundOnRollover: values.compoundOnRollover,
      withholdingTax: values.withholdingTax,
    });

    setCalculation(result);
    setAppliedRate(annualRatePercent);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('deposits.csv.term'),
        t('deposits.csv.startDate'),
        t('deposits.csv.endDate'),
        t('deposits.csv.principal'),
        t('deposits.csv.interest'),
        t('deposits.csv.tax'),
        t('deposits.csv.balance'),
      ],
    ];

    calculation.schedule.forEach((entry) => {
      rows.push([
        entry.termIndex,
        entry.startDate,
        entry.endDate,
        formatCurrency(entry.principal.toNumber(), currency),
        formatCurrency(entry.netInterest.toNumber(), currency),
        formatCurrency(entry.taxAmount.toNumber(), currency),
        formatCurrency(entry.endingBalance.toNumber(), currency),
      ]);
    });

    const filename = `fixed-deposit-schedule-${calculation.schedule[0]?.startDate ?? 'export'}`;
    exportTable(filename, rows, format, t('deposits.fixed.title'));
  };

  const renderError = (field: keyof typeof errors) => {
    const message = errors[field]?.message;
    if (!message) return null;
    return t(message.toString(), { defaultValue: message.toString() });
  };

  const formatRateDisplay = (rate: number | null) => {
    if (rate == null) return t('deposits.rateUnavailable');
    return percentFormatter.format(rate / 100);
  };

  return (
    <Stack spacing={3}>
      <Card variant="outlined">
        <CardHeader
          title={t('deposits.fixed.title')}
          subheader={t('deposits.fixed.subtitle')}
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
                        placeholder="200000"
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
                          placeholder="1.8"
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
                            onChange={(event) => {
                              const bankKey = event.target.value;
                              const previous = field.value;
                              const record = bankRecordMap.get(bankKey);
                              const termCandidates = record
                                ? (Object.keys(record.fixed) as BotFixedTerm[]).filter((term) => {
                                    const rate = record.fixed[term];
                                    return rate.min != null || rate.max != null;
                                  })
                                : [];
                              const previousTerm = previous?.term;
                              const fallbackTerm: BotFixedTerm =
                                previousTerm && termCandidates.includes(previousTerm)
                                  ? previousTerm
                                  : termCandidates.includes('12M')
                                    ? '12M'
                                    : termCandidates[0] ?? '12M';
                              field.onChange({
                                bankKey,
                                rateType: previous?.rateType ?? 'average',
                                term: fallbackTerm,
                              });
                              setValue('termMonths', TERM_MONTHS[fallbackTerm], { shouldDirty: true });
                            }}
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

                {rateSource === 'bot' && botData && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">{t('deposits.fields.term')}</Typography>
                      <Controller
                        name="botSelection"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            select
                            value={availableTerms.length ? field.value?.term ?? availableTerms[0] : ''}
                            onChange={(event) => {
                              if (!event.target.value) return;
                              const term = event.target.value as BotFixedTerm;
                              const months = TERM_MONTHS[term];
                              field.onChange({
                                bankKey: field.value?.bankKey ?? '',
                                rateType: field.value?.rateType ?? 'average',
                                term,
                              });
                              setValue('termMonths', months, { shouldDirty: true });
                            }}
                            disabled={!availableTerms.length}
                            SelectProps={{ inputProps: { 'aria-label': t('deposits.fields.term') } }}
                          >
                            {!availableTerms.length ? (
                              <MenuItem value="" disabled>
                                {t('deposits.errors.noTermData')}
                              </MenuItem>
                            ) : (
                              availableTerms.map((term) => (
                                <MenuItem key={term} value={term}>
                                  {t('deposits.fixed.termLabel', { term })}
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        )}
                      />
                    </Grid>

                    {availableTerms.length === 0 && (
                      <Grid item xs={12}>
                        <Alert severity="info" icon={false}>{t('deposits.errors.noTermData')}</Alert>
                      </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">{t('deposits.fields.rateType')}</Typography>
                      <Controller
                        name="botSelection"
                        control={control}
                        render={({ field }) => (
                          <ToggleButtonGroup
                            exclusive
                            value={field.value?.rateType ?? 'average'}
                            onChange={(_, value) => {
                              if (!value) return;
                              field.onChange({
                                bankKey: field.value?.bankKey ?? '',
                                rateType: value,
                                term: field.value?.term ?? '12M',
                              });
                            }}
                            size="small"
                            aria-label={t('deposits.fields.rateType')}
                            color="primary"
                          >
                            {RATE_TYPE_OPTIONS.map((option) => (
                              <ToggleButton key={option.value} value={option.value}>
                                {t(option.labelKey)}
                              </ToggleButton>
                            ))}
                          </ToggleButtonGroup>
                        )}
                      />
                    </Grid>
                  </>
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
                        error={Boolean(errors.startDate)}
                        helperText={renderError('startDate')}
                        inputProps={{ 'aria-label': t('deposits.fields.startDate') }}
                      />
                    )}
                  />
                </Grid>

                {rateSource === 'custom' && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">{t('deposits.fields.termMonths')}</Typography>
                    <Controller
                      name="termMonths"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          value={field.value ?? ''}
                          type="number"
                          placeholder="12"
                          error={Boolean(errors.termMonths)}
                          helperText={renderError('termMonths')}
                          InputProps={{
                            inputProps: { 'aria-label': t('deposits.fields.termMonths') },
                          }}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === '' ? undefined : Number(event.target.value),
                            )
                          }
                        />
                      )}
                    />
                  </Grid>
                )}

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">{t('deposits.fields.termCount')}</Typography>
                  <Controller
                    name="termCount"
                    control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      placeholder="2"
                      error={Boolean(errors.termCount)}
                      helperText={renderError('termCount')}
                      InputProps={{ inputProps: { 'aria-label': t('deposits.fields.termCount') } }}
                      onChange={(event) =>
                        field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                      }
                    />
                  )}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Controller
                        name="compoundOnRollover"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            {...field}
                            color="primary"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        )}
                      />
                    }
                    label={t('deposits.fields.compoundOnRollover')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Controller
                        name="withholdingTax"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            {...field}
                            color="primary"
                            checked={field.value}
                            onChange={(event) => field.onChange(event.target.checked)}
                          />
                        )}
                      />
                    }
                    label={t('deposits.fields.withholdingTax')}
                  />
                </Grid>
              </Grid>

              {maturityDate && (
                <Alert severity="info" icon={false}>
                  {t('deposits.fixed.maturityInfo', { maturityDate })}
                </Alert>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting || (rateSource === 'bot' && botLoading)}
                  sx={{ minWidth: 200 }}
                >
                  {t('deposits.actions.calculate')}
                </LoadingButton>
                <LoadingButton
                  type="button"
                  variant="text"
                  color="inherit"
                  onClick={() => {
                    reset();
                    setCalculation(null);
                    setAppliedRate(null);
                  }}
                >
                  {t('deposits.actions.reset')}
                </LoadingButton>
              </Stack>
            </Stack>
          </FormProvider>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title={t('deposits.results.title')} />
        <CardContent>
          {!calculation ? (
            <Typography color="text.secondary">{t('deposits.results.empty')}</Typography>
          ) : (
            <Stack spacing={3}>
              <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.totalContributions')}</Typography>
                  <Typography variant="h5">
                    {formatCurrency(calculation.totalContributions.toNumber(), currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.grossInterest')}</Typography>
                  <Typography variant="h5">
                    {formatCurrency(calculation.grossInterest.toNumber(), currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.netInterest')}</Typography>
                  <Typography variant="h5">
                    {formatCurrency(calculation.netInterest.toNumber(), currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.taxWithheld')}</Typography>
                  <Typography variant="h5">
                    {formatCurrency(calculation.taxAmount.toNumber(), currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.endingBalance')}</Typography>
                  <Typography variant="h5">
                    {formatCurrency(calculation.endingBalance.toNumber(), currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">{t('deposits.results.appliedRate')}</Typography>
                  <Typography variant="h5">
                    {formatRateDisplay(appliedRate)}
                  </Typography>
                </Grid>
              </Grid>

              <Alert severity="info" icon={false}>{t('deposits.fixed.disclaimer')}</Alert>

              <RateTimestampNotice periodDate={periodDate} dataTimestamp={dataTimestamp} />

              {calculation.schedule.length > 1 && (
                <LineChart
                  height={320}
                  slotProps={{ legend: { sx: { display: 'none' } } }}
                  series={[
                    {
                      id: 'balance',
                      label: t('deposits.chart.balance'),
                      data: calculation.schedule.map((entry) => entry.endingBalance.toNumber()),
                      color: theme.palette.primary.main,
                    },
                  ]}
                  xAxis={[{
                    scaleType: 'point',
                    data: calculation.schedule.map((entry) => `${t('deposits.fixed.term')} ${entry.termIndex}`),
                    tickLabelStyle: { fill: theme.palette.text.secondary },
                  }]}
                  yAxis={[{
                    tickLabelStyle: { fill: theme.palette.text.secondary },
                  }]}
                />
              )}

              <Divider />

              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{t('deposits.schedule.title')}</Typography>
                <ExportButton onExport={handleExport} disabled={!calculation} />
              </Stack>

              <Stack spacing={2}>
                {calculation.schedule.map((entry) => (
                  <Stack
                    key={entry.termIndex}
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1}
                    justifyContent="space-between"
                    sx={(theme) => ({
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    })}
                  >
                    <Typography variant="subtitle2">
                      {t('deposits.fixed.termRange', {
                        termIndex: entry.termIndex,
                        start: formatBangkokDate(parseBangkokDate(entry.startDate)),
                        end: formatBangkokDate(parseBangkokDate(entry.endDate)),
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {t('deposits.schedule.periodInterest', {
                        value: formatCurrency(entry.netInterest.toNumber(), currency),
                      })}
                    </Typography>
                    {!entry.taxAmount.isZero() && (
                      <Typography variant="body2">
                        {t('deposits.schedule.tax', {
                          value: formatCurrency(entry.taxAmount.toNumber(), currency),
                        })}
                      </Typography>
                    )}
                    <Typography variant="body2" fontWeight={600}>
                      {t('deposits.schedule.balance', {
                        value: formatCurrency(entry.endingBalance.toNumber(), currency),
                      })}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default FixedDepositCalculator;