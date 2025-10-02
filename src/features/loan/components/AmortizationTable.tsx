import { useMemo, useState } from 'react';
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '../../../utils/format';
import type { LoanResultView } from '../hooks/useLoanCalculator';
import { ExportButton } from '../../../ui/components/ExportButton';
import { exportTable } from '../../../utils/export';

const DEFAULT_VISIBLE_ROWS = 12;

export type AmortizationTableProps = {
  result: LoanResultView;
};

export const AmortizationTable = ({ result }: AmortizationTableProps) => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(
    () => (showAll ? result.schedule : result.schedule.slice(0, DEFAULT_VISIBLE_ROWS)),
    [result.schedule, showAll],
  );

  const remaining = result.schedule.length - DEFAULT_VISIBLE_ROWS;

  const handleExport = (format: 'csv' | 'xlsx') => {
    const exportRows: (string | number)[][] = [
      [
        t('loan.chart.period'),
        t('loan.results.monthlyPayment'),
        t('loan.chart.interest'),
        t('loan.chart.principal'),
        t('loan.table.balance'),
      ],
    ];

    result.schedule.forEach((entry) => {
      exportRows.push([
        entry.period,
        formatCurrency(entry.payment, result.currency),
        formatCurrency(entry.interest, result.currency),
        formatCurrency(entry.principal, result.currency),
        formatCurrency(entry.balance, result.currency),
      ]);
    });

    const filename = `loan-amortization-schedule-${new Date().toISOString().split('T')[0]}`;
    exportTable(filename, exportRows, format, t('loan.results.amortization'));
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">
          {t('loan.results.amortization')}
        </Typography>
        <ExportButton onExport={handleExport} size="small" />
      </Stack>
      <TableContainer sx={{ maxHeight: 400 }}>
        <Table stickyHeader size="small" aria-label="amortization schedule">
          <TableHead>
            <TableRow>
              <TableCell>{t('loan.chart.period')}</TableCell>
              <TableCell align="right">{t('loan.results.monthlyPayment')}</TableCell>
              <TableCell align="right">{t('loan.chart.interest')}</TableCell>
              <TableCell align="right">{t('loan.chart.principal')}</TableCell>
              <TableCell align="right">{t('loan.table.balance')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((entry) => (
              <TableRow key={entry.period} hover>
                <TableCell component="th" scope="row">
                  {entry.period}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.payment, result.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.interest, result.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.principal, result.currency)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(entry.balance, result.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {remaining > 0 && (
        <Button sx={{ mt: 2 }} onClick={() => setShowAll((prev) => !prev)}>
          {showAll
            ? t('loan.table.showLess')
            : t('loan.table.showAll', { count: remaining })}
        </Button>
      )}
    </Paper>
  );
};

export default AmortizationTable;
