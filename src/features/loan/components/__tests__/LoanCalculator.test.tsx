import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppProviders } from '../../../../app/providers';
import { calculateLoanSummary } from '../../../../domain/finance/loan';
import { formatCurrency } from '../../../../utils/format';
import { LoanCalculator } from '../LoanCalculator';

vi.mock('@mui/x-charts/LineChart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

describe('LoanCalculator component', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders empty state then shows summary after calculation', async () => {
    const user = userEvent.setup();
    render(
      <AppProviders>
        <LoanCalculator />
      </AppProviders>,
    );

    expect(screen.getByText(/Enter loan details/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/Loan amount/i));
    await user.type(screen.getByLabelText(/Loan amount/i), '120000');
    await user.clear(screen.getByLabelText(/Interest rate/i));
    await user.type(screen.getByLabelText(/Interest rate/i), '5');
    await user.clear(screen.getByLabelText(/Term/i));
    await user.type(screen.getByLabelText(/Term/i), '10');
    await user.clear(screen.getByLabelText(/Payments per year/i));
    await user.type(screen.getByLabelText(/Payments per year/i), '12');

    await user.click(screen.getByRole('button', { name: /Calculate repayment/i }));

    await screen.findAllByText(/Payment per period/i);

    const expectedPayment = formatCurrency(
      calculateLoanSummary({
        principal: 120_000,
        annualRatePercent: 5,
        years: 10,
        paymentsPerYear: 12,
      }).paymentPerPeriod.toNumber(),
      'THB',
    );

    expect(
      screen.getByRole('heading', { level: 5, name: expectedPayment }),
    ).toBeInTheDocument();
  });
});
