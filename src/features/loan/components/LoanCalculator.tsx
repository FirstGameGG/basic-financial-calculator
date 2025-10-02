import { useState } from 'react';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { LoanCalculatorForm } from './LoanCalculatorForm';
import { LoanSummaryCards } from './LoanSummaryCards';
import { AmortizationChart } from './AmortizationChart';
import { AmortizationTable } from './AmortizationTable';
import { useLoanCalculator } from '../hooks/useLoanCalculator';

export const LoanCalculator = () => {
  const { t } = useTranslation();
  const { result, error, defaultValues, hasResult, calculate, reset, clearError } = useLoanCalculator();
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);

  const handleRequestReset = () => {
    setResetDialogOpen(true);
  };

  const handleConfirmReset = () => {
    reset();
    setResetDialogOpen(false);
  };

  const handleCancelReset = () => setResetDialogOpen(false);

  return (
    <Stack spacing={{ xs: 3, sm: 4 }}>
      <LoanCalculatorForm
        defaultValues={defaultValues}
        onSubmit={calculate}
        onRequestReset={handleRequestReset}
      />

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          clearError();
        }}
      >
        <Alert severity="error" onClose={clearError} variant="filled" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Card variant="outlined">
        <CardHeader title={t('loan.results.title')} />
        <CardContent>
          {hasResult && result ? (
            <Stack spacing={{ xs: 3, sm: 4 }}>
              <LoanSummaryCards result={result} />
              <AmortizationChart result={result} />
              <AmortizationTable result={result} />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('loan.results.empty')}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Dialog open={isResetDialogOpen} onClose={handleCancelReset} aria-labelledby="reset-dialog-title">
        <DialogTitle id="reset-dialog-title">{t('loan.reset')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('loan.resetConfirm', 'This will clear the form and delete saved values. Continue?')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReset} color="inherit">
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirmReset} color="error" variant="contained">
            {t('loan.resetConfirmAction', 'Yes, reset')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default LoanCalculator;
