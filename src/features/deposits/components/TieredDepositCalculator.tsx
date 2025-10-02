import { useEffect, useState } from 'react';

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
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Switch,
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

import { calculateTieredDeposit, type TieredDepositResult } from '../../../domain/finance';
import { formatCurrency } from '../../../utils/format';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';
import {
  tieredDepositDefaultValues,
  tieredDepositFormSchema,
  type TieredDepositFormValues,
} from '../schema';
import {
  calculateEndDateFromTenure,
  getBangkokToday,
} from '../utils/date';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const TieredDepositCalculator = () => {
  const { t } = useTranslation();
  const currency = 'THB';

  const [calculation, setCalculation] = useState<TieredDepositResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const methods = useForm<TieredDepositFormValues>({
    defaultValues: tieredDepositDefaultValues,
    resolver: zodResolver(tieredDepositFormSchema),
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = methods;

  const { fields: tierFields, append, remove } = useFieldArray({ control, name: 'tiers' });

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

  const handleAddTier = () => {
    const tiers = watch('tiers');
    const lastTier = tiers[tiers.length - 1];
    const newMinBalance = lastTier ? lastTier.maxBalance : 0;
    append({ minBalance: newMinBalance, maxBalance: newMinBalance + 50000, rate: 1.0 });
  };

  const onSubmit = (values: TieredDepositFormValues) => {
    try {
      const sanitizedTiers = values.tiers.map((tier) => ({
        minBalance: Number(tier.minBalance),
        maxBalance: Number(tier.maxBalance),
        rate: Number(tier.rate),
      }));

      const result = calculateTieredDeposit({
        principal: values.principal,
        startDate: values.startDate,
        endDate: values.endDate,
        tiers: sanitizedTiers,
        withholdingTax: values.withholdingTax,
      });

      setCalculation(result);
      setSubmissionError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSubmissionError(message);
      setCalculation(null);
    }
  };

  const handleExportTierBreakdown = (format: 'csv' | 'xlsx') => {
    if (!calculation) return;

    const rows: (string | number)[][] = [
      [
        t('deposits.tiered.tierRange'),
        t('deposits.tiered.balanceInTier'),
        t('deposits.tiered.tierRate'),
        t('deposits.results.grossInterest'),
      ],
    ];

    calculation.tierBreakdown.forEach((tier) => {
      rows.push([
        `${formatCurrency(tier.minBalance, currency)} - ${formatCurrency(tier.maxBalance, currency)}`,
        formatCurrency(tier.balanceInTier, currency),
        percentFormatter.format(tier.rate / 100),
        formatCurrency(tier.grossInterest, currency),
      ]);
    });

    const filename = `tiered-deposit-breakdown-${new Date().toISOString().split('T')[0]}`;
    exportTable(filename, rows, format, t('deposits.tiered.breakdown'));
  };

  const renderError = (field: keyof typeof errors) => {
    const message = errors[field]?.message;
    if (!message) return null;
    return t(message.toString(), { defaultValue: message.toString() });
  };

  const renderTierRow = (index: number) => {
    const field = tierFields[index];
    const tierError = errors.tiers?.[index];

    return (
      <TableRow key={field.id}>
        <TableCell sx={{ minWidth: 160 }}>
          <Controller
            name={`tiers.${index}.minBalance`}
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
                error={Boolean(tierError?.minBalance)}
                helperText={tierError?.minBalance && t(tierError.minBalance.message ?? '', {
                  defaultValue: tierError.minBalance.message,
                })}
              />
            )}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 160 }}>
          <Controller
            name={`tiers.${index}.maxBalance`}
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
                error={Boolean(tierError?.maxBalance)}
                helperText={tierError?.maxBalance && t(tierError.maxBalance.message ?? '', {
                  defaultValue: tierError.maxBalance.message,
                })}
              />
            )}
          />
        </TableCell>
        <TableCell sx={{ minWidth: 120 }}>
          <Controller
            name={`tiers.${index}.rate`}
            control={control}
            render={({ field: controllerField }) => (
              <TextField
                {...controllerField}
                value={controllerField.value ?? ''}
                type="number"
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  inputProps: { step: '0.01', min: '0' },
                }}
                error={Boolean(tierError?.rate)}
                helperText={tierError?.rate && t(tierError.rate.message ?? '', {
                  defaultValue: tierError.rate.message,
                })}
                onChange={(event) =>
                  controllerField.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                }
              />
            )}
          />
        </TableCell>
        <TableCell align="right">
          <Tooltip title={t('deposits.tiered.removeTier')}>
            <span>
              <IconButton
                aria-label={t('deposits.tiered.removeTier')}
                onClick={() => remove(index)}
                disabled={tierFields.length === 1}
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
          title={t('deposits.tiered.title')}
          subheader={t('deposits.tiered.subtitle')}
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
                  <FormControlLabel
                    control={
                      <Controller
                        name="withholdingTax"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            {...field}
                            color="primary"
                            checked={Boolean(field.value)}
                            onChange={(event) => field.onChange(event.target.checked)}
                            inputProps={{ 'aria-label': t('deposits.fields.withholdingTax') }}
                          />
                        )}
                      />
                    }
                    label={t('deposits.fields.withholdingTax')}
                  />
                </Grid>

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
                  <Typography variant="subtitle2">{t('deposits.tiered.tiers')}</Typography>
                  <Tooltip title={t('deposits.tiered.addTier')}>
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddTier}
                      >
                        {t('deposits.tiered.addTier')}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('deposits.tiered.minBalance')}</TableCell>
                        <TableCell>{t('deposits.tiered.maxBalance')}</TableCell>
                        <TableCell>{t('deposits.tiered.rate')}</TableCell>
                        <TableCell align="right">{t('deposits.tiered.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tierFields.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <Typography variant="body2" color="text.secondary">
                              {t('deposits.tiered.empty')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                      {tierFields.map((_tier, index) => renderTierRow(index))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary">
                  {t('deposits.tiered.hint')}
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                >
                  {t('deposits.actions.calculate')}
                </LoadingButton>
                <Button
                  type="button"
                  variant="text"
                  onClick={() => {
                    methods.reset(tieredDepositDefaultValues);
                    setCalculation(null);
                    setSubmissionError(null);
                  }}
                >
                  {t('deposits.actions.reset')}
                </Button>
              </Stack>
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
                      {t('deposits.results.grossInterest')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.grossInterest, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.taxWithheld')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.taxAmount, currency)}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('deposits.results.netInterest')}
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(calculation.netInterest, currency)}
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

              <Divider />

              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">{t('deposits.tiered.breakdown')}</Typography>
                  <ExportButton onExport={handleExportTierBreakdown} size="small" />
                </Stack>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('deposits.tiered.tierRange')}</TableCell>
                        <TableCell>{t('deposits.tiered.balanceInTier')}</TableCell>
                        <TableCell>{t('deposits.tiered.tierRate')}</TableCell>
                        <TableCell>{t('deposits.results.grossInterest')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculation.tierBreakdown.map((tier) => (
                        <TableRow key={tier.tierIndex}>
                          <TableCell>
                            {formatCurrency(tier.minBalance, currency)} - {formatCurrency(tier.maxBalance, currency)}
                          </TableCell>
                          <TableCell>{formatCurrency(tier.balanceInTier, currency)}</TableCell>
                          <TableCell>{percentFormatter.format(tier.rate / 100)}</TableCell>
                          <TableCell>{formatCurrency(tier.grossInterest, currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};