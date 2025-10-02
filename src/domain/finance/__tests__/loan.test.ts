import { describe, expect, it } from 'vitest';

import type { LoanInput } from '../loan';
import { buildAmortizationSchedule, calculateLoanSummary, calculatePaymentPerPeriod } from '../loan';

describe('loan calculations', () => {
  const baseInput: LoanInput = {
    principal: 250_000,
    annualRatePercent: 4.5,
    years: 30,
    paymentsPerYear: 12,
  };

  it('calculates the payment per period with interest', () => {
    const payment = calculatePaymentPerPeriod(baseInput);
    expect(payment.toNumber()).toBeCloseTo(1266.71, 2);
  });

  it('generates a full amortization schedule', () => {
    const schedule = buildAmortizationSchedule(baseInput);
    expect(schedule).toHaveLength(baseInput.years * baseInput.paymentsPerYear);
    expect(schedule[0].interest.toNumber()).toBeGreaterThan(0);
    const last = schedule[schedule.length - 1];
    expect(last.balance.toNumber()).toBeCloseTo(0, 6);
  });

  it('calculates totals for zero interest loans', () => {
    const result = calculateLoanSummary({
      ...baseInput,
      annualRatePercent: 0,
      years: 5,
    });

    expect(result.paymentPerPeriod.toNumber()).toBeCloseTo(4166.67, 2);
    expect(result.totalInterest.toNumber()).toBeCloseTo(0, 6);
    expect(result.totalCost.toNumber()).toBeCloseTo(250_000, 2);
  });

  it('throws for invalid principal', () => {
    expect(() => calculatePaymentPerPeriod({ ...baseInput, principal: 0 })).toThrow(
      /must be greater than zero/,
    );
  });

  it('throws for invalid payments per year', () => {
    expect(() => calculatePaymentPerPeriod({ ...baseInput, paymentsPerYear: 0 })).toThrow(
      /must be greater than zero/,
    );
  });
});
