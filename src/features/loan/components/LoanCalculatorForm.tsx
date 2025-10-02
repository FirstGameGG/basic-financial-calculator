import { useEffect } from 'react';

import Grid from '@mui/material/GridLegacy';
import { Button, Card, CardContent, InputAdornment, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { loanFormSchema } from '../schema';
import type { LoanFormValues } from '../schema';
import { FormattedNumberField } from '../../../ui/components/FormattedNumberField';

export type LoanCalculatorFormProps = {
  defaultValues: LoanFormValues;
  onSubmit: (values: LoanFormValues) => void;
  onRequestReset: () => void;
};

export const LoanCalculatorForm = ({
  defaultValues,
  onSubmit,
  onRequestReset,
}: LoanCalculatorFormProps) => {
  const { t } = useTranslation();
  const currency = 'THB';
  const methods = useForm<LoanFormValues>({
    defaultValues,
    resolver: zodResolver(loanFormSchema),
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = methods;

  const principal = watch('principal');
  const annualRatePercent = watch('annualRatePercent');

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleReset = () => {
    onRequestReset();
  };

  return (
    <FormProvider {...methods}>
      <Card variant="outlined">
        <CardContent>
          <form
            onSubmit={(event) => {
              void handleSubmit(onSubmit)(event);
            }}
            noValidate
          >
            <Stack spacing={3}>
              <Grid container spacing={2} sx={{ m: 0, width: '100%' }}>
                <Grid item xs={12} sm={6}>
                  <FormattedNumberField
                    label={t('loan.inputs.principal')}
                    fullWidth
                    value={principal}
                    onValueChange={(value) => setValue('principal', value ?? 0)}
                    error={Boolean(errors.principal)}
                    helperText={errors.principal?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          {currency.toUpperCase()}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormattedNumberField
                    label={t('loan.inputs.interestRate')}
                    fullWidth
                    value={annualRatePercent}
                    onValueChange={(value) => setValue('annualRatePercent', value ?? 0)}
                    error={Boolean(errors.annualRatePercent)}
                    helperText={errors.annualRatePercent?.message}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('loan.inputs.term')}
                    fullWidth
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    error={Boolean(errors.years)}
                    helperText={errors.years?.message ?? t('loan.helper.term')}
                    {...register('years', { valueAsNumber: true })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={t('loan.inputs.schedule')}
                    fullWidth
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    error={Boolean(errors.paymentsPerYear)}
                    helperText={errors.paymentsPerYear?.message ?? t('loan.helper.schedule')}
                    {...register('paymentsPerYear', { valueAsNumber: true })}
                  />
                </Grid>
              </Grid>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{ minWidth: 200 }}
                >
                  {t('loan.submit')}
                </Button>
                <Button variant="text" color="inherit" onClick={handleReset}>
                  {t('loan.reset')}
                </Button>
              </Stack>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
};

export default LoanCalculatorForm;